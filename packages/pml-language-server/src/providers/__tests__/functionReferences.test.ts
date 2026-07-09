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

describe('Global function references', () => {
	const uri = 'file:///functions.pmlfnc';
	const source = [
		'define function !!Process(!target is STRING)',
		'	return !target',
		'endfunction',
		'',
		'define method .run()',
		'	!value = !!Process(!target)',
		'	!!Process(!value)',
		'	!!Main.Process()',
		'	!this.Process()',
		'endmethod'
	].join('\n');

	function createFixture() {
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};

		return { document, documents, symbolIndex };
	}

	it('indexes only direct !!function calls as function references', () => {
		const { symbolIndex } = createFixture();

		const functionReferences = symbolIndex.findFunctionReferences('Process');
		const methodReferences = symbolIndex.findMethodReferences('Process');

		expect(functionReferences).toHaveLength(2);
		expect(functionReferences.map(reference => textInRange(source, reference.range))).toEqual([
			'!!Process',
			'!!Process'
		]);
		expect(methodReferences.map(reference => textInRange(source, reference.range))).toEqual([
			'Process',
			'Process'
		]);
	});

	it('finds direct !!function calls without method or form member calls', async () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new ReferencesProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('!!Process(!target)') + 2);

		const references = await provider.provide({
			textDocument: { uri },
			position,
			context: { includeDeclaration: false }
		});

		expect(references).toHaveLength(2);
		expect(references?.map(reference => textInRange(source, reference.range))).toEqual([
			'!!Process',
			'!!Process'
		]);
	});

	it('includes function definitions when requested', async () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new ReferencesProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('!!Process(!target)') + 2);

		const references = await provider.provide({
			textDocument: { uri },
			position,
			context: { includeDeclaration: true }
		});

		expect(references).toHaveLength(3);
		expect(references?.[0].range.start.line).toBe(0);
	});

	it('goes to the global function definition from a !!function call', () => {
		const { document, documents, symbolIndex } = createFixture();
		const provider = new DefinitionProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('!!Process(!target)') + 2);

		const definition = provider.provide({
			textDocument: { uri },
			position
		});
		const definitions = Array.isArray(definition) ? definition : definition ? [definition] : [];

		expect(definitions).toHaveLength(1);
		expect(definitions[0].uri).toBe(uri);
		expect(definitions[0].range.start.line).toBe(0);
	});

	it('renames direct !!function definitions and calls without touching globals or methods', async () => {
		const renameSource = [
			'define function !!Process(!target is STRING)',
			'	return !target',
			'endfunction',
			'',
			'define method .Process()',
			'endmethod',
			'',
			'define method .run()',
			'	!value = !!Process(!target)',
			'	!!Process(!value)',
			'	!!Process = !!GlobalVar',
			'	!!GlobalVar = !!Process',
			'	!!Main.Process()',
			'	!this.Process()',
			'	.Process()',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(renameSource);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, renameSource);
		const document = TextDocument.create(uri, 'pml', 1, renameSource);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};
		const provider = new RenameProvider(symbolIndex, documents as any);

		const edit = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(renameSource.indexOf('!!Process(!target)') + 2),
			newName: 'Build'
		});

		const edits = edit?.changes?.[uri] ?? [];
		expect(edits).toHaveLength(3);
		expect(edits.map(change => change.newText)).toEqual([
			'!!Build',
			'!!Build',
			'!!Build'
		]);
		expect(edits.map(change => textInRange(renameSource, change.range))).toEqual([
			'!!Process',
			'!!Process',
			'!!Process'
		]);
		expect(edits.map(change => change.range.start.line).sort((left, right) => left - right)).toEqual([0, 8, 9]);
	});

	it('renames global functions across files when triggered from the definition', async () => {
		const functionUri = 'file:///process.pmlfnc';
		const callerUri = 'file:///caller.pmlfrm';
		const functionSource = [
			'define function !!Process(!target is STRING)',
			'	return !target',
			'endfunction',
			'',
			'define method .run()',
			'	!!Process(!target)',
			'endmethod'
		].join('\n');
		const callerSource = [
			'define method .call()',
			'	!!Process(!target)',
			'endmethod'
		].join('\n');
		const parser = new Parser();
		const functionParseResult = parser.parse(functionSource);
		const callerParseResult = parser.parse(callerSource);
		expect(functionParseResult.errors).toHaveLength(0);
		expect(callerParseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(functionUri, functionParseResult.ast, 1, functionSource);
		symbolIndex.indexFile(callerUri, callerParseResult.ast, 1, callerSource);
		const functionDocument = TextDocument.create(functionUri, 'pml', 1, functionSource);
		const callerDocument = TextDocument.create(callerUri, 'pml', 1, callerSource);
		const documents = {
			get: (requestedUri: string) => {
				if (requestedUri === functionUri) return functionDocument;
				if (requestedUri === callerUri) return callerDocument;
				return undefined;
			}
		};
		const provider = new RenameProvider(symbolIndex, documents as any);

		const edit = await provider.provide({
			textDocument: { uri: functionUri },
			position: functionDocument.positionAt(functionSource.indexOf('!!Process') + 2),
			newName: 'Build'
		});

		const functionEdits = edit?.changes?.[functionUri] ?? [];
		const callerEdits = edit?.changes?.[callerUri] ?? [];
		expect(functionEdits).toHaveLength(2);
		expect(callerEdits).toHaveLength(1);
		expect(functionEdits.map(change => textInRange(functionSource, change.range))).toEqual([
			'!!Process',
			'!!Process'
		]);
		expect(callerEdits.map(change => textInRange(callerSource, change.range))).toEqual([
			'!!Process'
		]);
		expect([...functionEdits, ...callerEdits].every(change => change.newText === '!!Build')).toBe(true);
	});
});
