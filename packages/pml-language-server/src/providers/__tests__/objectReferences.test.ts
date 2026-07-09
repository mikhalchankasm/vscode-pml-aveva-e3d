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
});
