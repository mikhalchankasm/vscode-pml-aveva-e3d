import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolIndex } from '../../index/symbolIndex';
import { CompletionProvider } from '../../providers/completionProvider';
import { CallStubCodeActionProvider } from '../../providers/callStubCodeActionProvider';
import { ReferencesProvider } from '../../providers/referencesProvider';
import { Parser, parserModeFromUri } from '../parser';

const maybeIt = process.env.PML_PERF_GUARDS === 'off' ? it.skip : it;
const parseBudgetMs = Number(process.env.PML_PERF_PARSE_BUDGET_MS ?? 5000);
const indexBudgetMs = Number(process.env.PML_PERF_INDEX_BUDGET_MS ?? 7000);
const completionBudgetMs = Number(process.env.PML_PERF_COMPLETION_BUDGET_MS ?? 200);
const codeActionBudgetMs = Number(process.env.PML_PERF_CODE_ACTION_BUDGET_MS ?? 200);
const referencesBudgetMs = Number(process.env.PML_PERF_REFERENCES_BUDGET_MS ?? 1000);

function createLargePMLFunction(methodCount = 250): string {
	const methods: string[] = [];
	for (let index = 1; index <= methodCount; index++) {
		methods.push([
			`define method .method${index}(!input is STRING)`,
			`	!value = !input.upcase()`,
			`	if (!value.length() gt ${index % 10}) then`,
			`		!value = !value.substring(1, !value.length())`,
			`	endif`,
			`	return !value`,
			`endmethod`
		].join('\n'));
	}
	return methods.join('\n\n');
}

function createIndexedObjectSource(fileIndex: number, methodCount = 20): string {
	const methods: string[] = [];
	for (let methodIndex = 1; methodIndex <= methodCount; methodIndex++) {
		methods.push([
			`	define method .method${fileIndex}_${methodIndex}()`,
			`		!value = ${fileIndex + methodIndex}`,
			`	endmethod`
		].join('\n'));
	}

	return [
		`define object OBJECT${fileIndex}`,
		`	member .name is STRING`,
		...methods,
		`endobject`
	].join('\n');
}

function createWorkspaceMethodSource(fileIndex: number, methodCount = 20): string {
	const methods: string[] = [];
	for (let methodIndex = 1; methodIndex <= methodCount; methodIndex++) {
		const methodName = methodIndex === 1 ? 'sharedRefresh' : `method${fileIndex}_${methodIndex}`;
		methods.push([
			`define method .${methodName}(!target is STRING)`,
			`	!value = !target.upcase()`,
			`	!this.${methodName}()`,
			`	!callback = |!this.${methodName}()|`,
			`endmethod`,
		].join('\n'));
	}
	return methods.join('\n\n');
}

function createIndexedWorkspace(fileCount = 100, methodCount = 20): {
	symbolIndex: SymbolIndex;
	documents: Map<string, TextDocument>;
} {
	const parser = new Parser();
	const symbolIndex = new SymbolIndex();
	const documents = new Map<string, TextDocument>();

	for (let fileIndex = 1; fileIndex <= fileCount; fileIndex++) {
		const uri = `file:///workspace/file${fileIndex}.pml`;
		const source = createWorkspaceMethodSource(fileIndex, methodCount);
		const result = parser.parse(source, { mode: parserModeFromUri(uri) });

		expect(result.errors).toHaveLength(0);
		symbolIndex.indexFile(uri, result.ast, 1, source);
		documents.set(uri, TextDocument.create(uri, 'pml', 1, source));
	}

	return { symbolIndex, documents };
}

describe('performance budget guards', () => {
	maybeIt('parses a large generated PML file within the release budget', () => {
		const source = createLargePMLFunction();
		const parser = new Parser();

		const startedAt = performance.now();
		const result = parser.parse(source, { mode: 'default' });
		const elapsedMs = performance.now() - startedAt;

		expect(result.errors).toHaveLength(0);
		expect(result.ast.body.length).toBe(250);
		expect(elapsedMs).toBeLessThan(parseBudgetMs);
	});

	maybeIt('parses and indexes a 100-file workspace model within the release budget', () => {
		const parser = new Parser();
		const symbolIndex = new SymbolIndex();

		const startedAt = performance.now();
		for (let fileIndex = 1; fileIndex <= 100; fileIndex++) {
			const uri = `file:///workspace/object${fileIndex}.pmlobj`;
			const source = createIndexedObjectSource(fileIndex);
			const result = parser.parse(source, { mode: parserModeFromUri(uri) });

			expect(result.errors).toHaveLength(0);
			symbolIndex.indexFile(uri, result.ast, 1, source);
		}
		const elapsedMs = performance.now() - startedAt;

		const stats = symbolIndex.getStats();
		expect(stats.files).toBe(100);
		expect(stats.objects).toBe(100);
		expect(stats.methods).toBe(2000);
		expect(elapsedMs).toBeLessThan(indexBudgetMs);
	});

	maybeIt('provides file-local method completions with a large workspace index within the release budget', () => {
		const { symbolIndex } = createIndexedWorkspace();
		const source = [
			'define method .localRefresh(!target is STRING)',
			'endmethod',
			'',
			'lo'
		].join('\n');
		const document = TextDocument.create('file:///workspace/current.pml', 'pml', 1, source);
		const result = new Parser().parse(source, { mode: parserModeFromUri(document.uri) });
		expect(result.errors).toHaveLength(0);
		symbolIndex.indexFile(document.uri, result.ast, document.version, source);
		const provider = new CompletionProvider(symbolIndex);

		const startedAt = performance.now();
		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);
		const elapsedMs = performance.now() - startedAt;

		expect(completions.some(item => item.label === '.localRefresh')).toBe(true);
		expect(completions.some(item => item.label === '.sharedRefresh')).toBe(false);
		expect(elapsedMs).toBeLessThan(completionBudgetMs);
	});

	maybeIt('provides typed chained-call completions with a large workspace index within the release budget', () => {
		const { symbolIndex } = createIndexedWorkspace();
		const uri = 'file:///workspace/typed-chain.pml';
		const source = [
			'define function !!currentElement() is DBREF',
			'endfunction',
			'',
			'!!currentElement().query(|NAME|).'
		].join('\n');
		const document = TextDocument.create(uri, 'pml', 1, source);
		const result = new Parser().parse(source, { mode: parserModeFromUri(uri) });
		expect(result.errors).toHaveLength(0);
		symbolIndex.indexFile(uri, result.ast, document.version, source);
		const provider = new CompletionProvider(symbolIndex);

		const startedAt = performance.now();
		const completions = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);
		const elapsedMs = performance.now() - startedAt;

		expect(completions.some(item => item.label === 'upcase')).toBe(true);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
		expect(elapsedMs).toBeLessThan(completionBudgetMs);
	});

	maybeIt('offers a missing-call stub in a large document within the release budget', () => {
		const uri = 'file:///workspace/large-call-actions.pml';
		const source = `${createLargePMLFunction()}\n\n.missingCallable(|value|)`;
		const document = TextDocument.create(uri, 'pml', 1, source);
		const result = new Parser().parse(source, { mode: parserModeFromUri(uri) });
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const provider = new CallStubCodeActionProvider(symbolIndex);
		const position = document.positionAt(source.lastIndexOf('missingCallable') + 2);

		const startedAt = performance.now();
		const actions = provider.provide(document, Range.create(position, position), result.ast);
		const elapsedMs = performance.now() - startedAt;

		expect(actions[0]?.title).toBe('Generate method .missingCallable(!text is STRING)');
		expect(elapsedMs).toBeLessThan(codeActionBudgetMs);
	});

	maybeIt('finds file-local method references with a 100-file workspace model within the release budget', async () => {
		const { symbolIndex, documents } = createIndexedWorkspace();
		const uri = 'file:///workspace/file1.pml';
		const document = documents.get(uri);
		expect(document).toBeDefined();

		const provider = new ReferencesProvider(symbolIndex, {
			get: (requestedUri: string) => documents.get(requestedUri)
		} as any);

		const source = document!.getText();
		const startedAt = performance.now();
		const references = await provider.provide({
			textDocument: { uri },
			position: document!.positionAt(source.indexOf('sharedRefresh')),
			context: { includeDeclaration: false }
		});
		const elapsedMs = performance.now() - startedAt;

		expect(references?.length).toBe(2);
		expect(references?.every(reference => reference.uri === uri)).toBe(true);
		expect(elapsedMs).toBeLessThan(referencesBudgetMs);
	});
});
