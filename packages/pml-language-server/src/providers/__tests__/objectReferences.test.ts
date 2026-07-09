import { describe, expect, it } from 'vitest';
import { Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { DefinitionProvider } from '../definitionProvider';
import { ReferencesProvider } from '../referencesProvider';
import { RenameProvider } from '../renameProvider';

function textInRange(text: string, range: Range): string {
	const lines = text.split(/\r?\n/);
	if (range.start.line === range.end.line) {
		return lines[range.start.line].slice(range.start.character, range.end.character);
	}
	return '';
}

describe('Object references', () => {
	const uri = 'file:///objects/Pump.pmlobj';
	const source = [
		'define object Pump',
		'endobject',
		'',
		'define method .Pump()',
		'endmethod',
		'',
		'define method .run()',
		'	!made = object Pump()',
		'	!typed is Pump',
		'	.Pump()',
		'endmethod'
	].join('\n');

	function createFixture() {
		const parseResult = new Parser().parse(source);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};

		return { document, documents, symbolIndex };
	}

	it('goes to the object definition from an object constructor', () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new DefinitionProvider(symbolIndex, documents as any);

		const definition = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.indexOf('object Pump()') + 'object '.length)
		});
		const definitions = Array.isArray(definition) ? definition : definition ? [definition] : [];

		expect(definitions).toHaveLength(1);
		expect(definitions[0].uri).toBe(uri);
		expect(definitions[0].range.start.line).toBe(0);
	});

	it('keeps method definition lookup when the cursor is on the method call', () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new DefinitionProvider(symbolIndex, documents as any);

		const definition = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.lastIndexOf('.Pump()') + 1)
		});
		const definitions = Array.isArray(definition) ? definition : definition ? [definition] : [];

		expect(definitions).toHaveLength(1);
		expect(definitions[0].uri).toBe(uri);
		expect(definitions[0].range.start.line).toBe(3);
	});

	it('finds object references without returning same-name method calls', async () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new ReferencesProvider(symbolIndex, documents as any);

		const references = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.indexOf('object Pump()') + 'object '.length),
			context: { includeDeclaration: false }
		});

		expect(references).toHaveLength(2);
		expect(references?.map(reference => textInRange(source, reference.range))).toEqual([
			'Pump',
			'Pump'
		]);
		expect(references?.map(reference => reference.range.start.line)).toEqual([7, 8]);
	});

	it('renames object references without renaming same-name methods', async () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new RenameProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('object Pump()') + 'object '.length);

		const edit = await provider.provide({
			textDocument: { uri },
			position,
			newName: 'Valve'
		});

		const edits = edit?.changes?.[uri] ?? [];
		expect(edits).toHaveLength(3);
		expect(edits.map(change => textInRange(source, change.range))).toEqual([
			'Pump',
			'Pump',
			'Pump'
		]);
		expect(edits.every(change => change.newText === 'Valve')).toBe(true);
		expect(edits.map(change => change.range.start.line)).toEqual([0, 7, 8]);
	});

	it('prefers object references over a same-name form in object syntax', async () => {
		const formUri = 'file:///forms/Pump.pmlfrm';
		const formSource = [
			'setup form !!Pump dialog',
			'exit',
			'define method .open()',
			'\t!!Pump.show()',
			'endmethod'
		].join('\n');
		const { document, documents, symbolIndex } = createFixture();
		const formParseResult = new Parser().parse(formSource);
		symbolIndex.indexFile(formUri, formParseResult.ast, 1, formSource);
		const provider = new ReferencesProvider(symbolIndex, documents as any);

		const references = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.indexOf('object Pump()') + 'object '.length),
			context: { includeDeclaration: false }
		});
		const typedReferences = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.indexOf('is Pump') + 'is '.length),
			context: { includeDeclaration: false }
		});

		expect(references).toHaveLength(2);
		expect(references?.every(reference => reference.uri === uri)).toBe(true);
		expect(references?.map(reference => reference.range.start.line)).toEqual([7, 8]);
		expect(typedReferences).toEqual(references);
	});

	it('renames a local variable without falling through to a same-name object', async () => {
		const collisionUri = 'file:///objects/Grid.pmlobj';
		const collisionSource = [
			'define object grid',
			'endobject',
			'',
			'define method .run()',
			'	!grid = 1',
			'	!other = !grid',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(collisionSource);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(collisionUri, parseResult.ast, 1, collisionSource);
		const document = TextDocument.create(collisionUri, 'pml', 1, collisionSource);
		const documents = {
			get: (requestedUri: string) => requestedUri === collisionUri ? document : undefined
		};
		const provider = new RenameProvider(symbolIndex, documents as any);

		const edit = await provider.provide({
			textDocument: { uri: collisionUri },
			position: document.positionAt(collisionSource.indexOf('!grid') + 1),
			newName: '!slot'
		});

		const edits = edit?.changes?.[collisionUri] ?? [];
		expect(edits).toHaveLength(2);
		expect(edits.map(change => textInRange(collisionSource, change.range))).toEqual([
			'!grid',
			'!grid'
		]);
		expect(edits.every(change => change.newText === '!slot')).toBe(true);
		expect(edits.map(change => change.range.start.line)).toEqual([4, 5]);
	});

	it('does not partially match object names in longer identifiers or non-is words', async () => {
		const boundaryUri = 'file:///objects/Boundary.pmlobj';
		const boundarySource = [
			'define object Pump',
			'endobject',
			'',
			'define object PumpExtra',
			'endobject',
			'',
			'define method .run()',
			'	!made = object Pump()',
			'	!other = object PumpExtra()',
			'	!typed is Pump',
			'	!typedExtra is PumpExtra',
			'	!note = |this Pump should stay text|',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(boundarySource);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(boundaryUri, parseResult.ast, 1, boundarySource);
		const document = TextDocument.create(boundaryUri, 'pml', 1, boundarySource);
		const documents = {
			get: (requestedUri: string) => requestedUri === boundaryUri ? document : undefined
		};
		const referencesProvider = new ReferencesProvider(symbolIndex, documents as any);
		const renameProvider = new RenameProvider(symbolIndex, documents as any);
		const position = document.positionAt(boundarySource.indexOf('object Pump()') + 'object '.length);

		const references = await referencesProvider.provide({
			textDocument: { uri: boundaryUri },
			position,
			context: { includeDeclaration: false }
		});
		const edit = await renameProvider.provide({
			textDocument: { uri: boundaryUri },
			position,
			newName: 'Valve'
		});

		expect(references?.map(reference => reference.range.start.line)).toEqual([7, 9]);
		const edits = edit?.changes?.[boundaryUri] ?? [];
		expect(edits.map(change => textInRange(boundarySource, change.range))).toEqual([
			'Pump',
			'Pump',
			'Pump'
		]);
		expect(edits.map(change => change.range.start.line)).toEqual([0, 7, 9]);
	});

	it('does not return a partial workspace edit when an indexed file cannot be read', async () => {
		const badUri = 'file:///objects/unreadable.pmlobj';
		const { document, documents, symbolIndex } = createFixture();
		const badParseResult = new Parser().parse([
			'define object Other',
			'endobject'
		].join('\n'));
		symbolIndex.indexFile(badUri, badParseResult.ast, 1, 'define object Other\nendobject');
		const provider = new RenameProvider(symbolIndex, documents as any);
		(provider as any).getFileText = async (requestedUri: string) =>
			requestedUri === badUri ? undefined : documents.get(requestedUri)?.getText();

		const edit = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.indexOf('object Pump()') + 'object '.length),
			newName: 'Valve'
		});

		expect(edit).toBeNull();
	});
});
