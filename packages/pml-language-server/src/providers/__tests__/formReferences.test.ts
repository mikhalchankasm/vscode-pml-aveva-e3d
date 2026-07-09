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

describe('Form references', () => {
	const uri = 'file:///forms/Main.pmlfrm';
	const source = [
		'setup form !!Main dialog',
		'exit',
		'',
		'define method .show()',
		'endmethod',
		'',
		'define method .run()',
		'	!!Main.show()',
		'	!!Main(!target)',
		'	!!Other.show()',
		'	track |OPEN| call |!!Main.show()|',
		'	!label = |Open !!Main.show()|',
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

	it('goes to the form definition from the form portion of a member call', () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new DefinitionProvider(symbolIndex, documents as any);

		const definition = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.indexOf('!!Main.show()') + 2)
		});
		const definitions = Array.isArray(definition) ? definition : definition ? [definition] : [];

		expect(definitions).toHaveLength(1);
		expect(definitions[0].uri).toBe(uri);
		expect(definitions[0].range.start.line).toBe(0);
	});

	it('keeps method definition lookup when the cursor is on the member name', () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new DefinitionProvider(symbolIndex, documents as any);

		const definition = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.indexOf('!!Main.show()') + '!!Main.'.length)
		});
		const definitions = Array.isArray(definition) ? definition : definition ? [definition] : [];

		expect(definitions).toHaveLength(1);
		expect(definitions[0].uri).toBe(uri);
		expect(definitions[0].range.start.line).toBe(3);
	});

	it('finds form references from the form portion of a member call', async () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new ReferencesProvider(symbolIndex, documents as any);

		const references = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.indexOf('!!Main.show()') + 2),
			context: { includeDeclaration: false }
		});

		expect(references).toHaveLength(3);
		expect(references?.map(reference => textInRange(source, reference.range))).toEqual([
			'!!Main',
			'!!Main',
			'!!Main'
		]);
		expect(references?.map(reference => reference.range.start.line)).toEqual([7, 8, 10]);
	});

	it('renames form references from the form portion of a member call', async () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new RenameProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('!!Main.show()') + 2);

		const prepare = provider.prepareRename({ textDocument: { uri }, position });
		const edit = await provider.provide({
			textDocument: { uri },
			position,
			newName: 'Next'
		});

		expect(prepare?.placeholder).toBe('!!Main');
		expect(prepare ? textInRange(source, prepare.range) : '').toBe('!!Main');
		const edits = edit?.changes?.[uri] ?? [];
		expect(edits).toHaveLength(4);
		expect(edits.map(change => textInRange(source, change.range))).toEqual([
			'!!Main',
			'!!Main',
			'!!Main',
			'!!Main'
		]);
		expect(edits.every(change => change.newText === '!!Next')).toBe(true);
		expect(edits.map(change => change.range.start.line)).toEqual([0, 7, 8, 10]);
	});

	it('prefers form references over a same-name object outside object syntax', async () => {
		const objectUri = 'file:///objects/Main.pmlobj';
		const objectSource = [
			'define object Main',
			'endobject',
			'define method .make()',
			'\t!made = object Main()',
			'endmethod'
		].join('\n');
		const { document, documents, symbolIndex } = createFixture();
		const objectParseResult = new Parser().parse(objectSource);
		symbolIndex.indexFile(objectUri, objectParseResult.ast, 1, objectSource);
		const referencesProvider = new ReferencesProvider(symbolIndex, documents as any);
		const renameProvider = new RenameProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('!!Main.show()') + 2);

		const references = await referencesProvider.provide({
			textDocument: { uri },
			position,
			context: { includeDeclaration: false }
		});
		const edit = await renameProvider.provide({
			textDocument: { uri },
			position,
			newName: 'Next'
		});

		expect(references).toHaveLength(3);
		expect(references?.every(reference => reference.uri === uri)).toBe(true);
		expect(edit?.changes?.[uri]).toHaveLength(4);
		expect(edit?.changes?.[objectUri]).toBeUndefined();
	});

	it('does not partially match form names in longer global identifiers', async () => {
		const boundaryUri = 'file:///forms/Boundary.pmlfrm';
		const boundarySource = [
			'setup form !!Main dialog',
			'exit',
			'',
			'setup form !!MainExtra dialog',
			'exit',
			'',
			'define method .run()',
			'	!!Main.show()',
			'	!!MainExtra.show()',
			'	track |OPEN| call |!!Main.show()|',
			'	track |OPEN_EXTRA| call |!!MainExtra.show()|',
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
		const position = document.positionAt(boundarySource.indexOf('!!Main.show()') + 2);

		const references = await referencesProvider.provide({
			textDocument: { uri: boundaryUri },
			position,
			context: { includeDeclaration: false }
		});
		const edit = await renameProvider.provide({
			textDocument: { uri: boundaryUri },
			position,
			newName: 'Next'
		});

		expect(references?.map(reference => reference.range.start.line)).toEqual([7, 9]);
		const edits = edit?.changes?.[boundaryUri] ?? [];
		expect(edits.map(change => textInRange(boundarySource, change.range))).toEqual([
			'!!Main',
			'!!Main',
			'!!Main'
		]);
		expect(edits.map(change => change.range.start.line)).toEqual([0, 7, 9]);
	});
});
