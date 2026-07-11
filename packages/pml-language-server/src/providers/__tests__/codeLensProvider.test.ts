import { describe, expect, it } from 'vitest';
import { TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { CodeLensProvider } from '../codeLensProvider';
import { ReferencesProvider } from '../referencesProvider';

function indexSource(symbolIndex: SymbolIndex, uri: string, source: string): void {
	const result = new Parser().parse(source);
	expect(result.errors).toHaveLength(0);
	symbolIndex.indexFile(uri, result.ast, 1, source);
}

describe('CodeLensProvider', () => {
	it('counts file-scoped method references and workspace function references', async () => {
		const firstUri = 'file:///workspace/first.pml';
		const secondUri = 'file:///workspace/second.pmlfnc';
		const firstSource = [
			'define method .refresh()',
			'endmethod',
			'!this.refresh()',
			'.refresh()',
			'!!buildReport()'
		].join('\n');
		const secondSource = [
			'define function !!buildReport()',
			'endfunction',
			'!!buildReport()'
		].join('\n');
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, firstUri, firstSource);
		indexSource(symbolIndex, secondUri, secondSource);

		const referencesProvider = new ReferencesProvider(symbolIndex, new TextDocuments(TextDocument));
		const provider = new CodeLensProvider(symbolIndex, referencesProvider);

		const methodLenses = provider.provide(firstUri);
		const functionLenses = provider.provide(secondUri);

		expect(methodLenses).toHaveLength(1);
		expect(methodLenses[0].command).toBeUndefined();
		expect(functionLenses).toHaveLength(1);
		expect(functionLenses[0].command).toBeUndefined();

		const resolvedMethod = await provider.resolve(methodLenses[0]);
		const resolvedFunction = await provider.resolve(functionLenses[0]);
		expect(resolvedMethod.command?.title).toBe('2 references');
		expect(resolvedMethod.command?.arguments).toHaveLength(2);
		expect(resolvedFunction.command?.title).toBe('2 references');
		expect(resolvedFunction.command?.arguments).toHaveLength(2);
		expect(resolvedMethod.range.start.line).toBe(resolvedMethod.range.end.line);
	});

	it('does not count same-named methods from another file', async () => {
		const firstUri = 'file:///workspace/first.pml';
		const secondUri = 'file:///workspace/second.pml';
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, firstUri, 'define method .show()\nendmethod\n.show()');
		indexSource(symbolIndex, secondUri, 'define method .show()\nendmethod\n.show()\n.show()');

		const provider = new CodeLensProvider(
			symbolIndex,
			new ReferencesProvider(symbolIndex, new TextDocuments(TextDocument))
		);

		const firstLenses = provider.provide(firstUri);
		const secondLenses = provider.provide(secondUri);
		const resolvedFirst = await provider.resolve(firstLenses[0]);
		const resolvedSecond = await provider.resolve(secondLenses[0]);

		expect(resolvedFirst.command?.title).toBe('1 reference');
		expect(resolvedSecond.command?.title).toBe('2 references');
	});

	it('provides visual form authoring lenses for summaries, members, and callbacks', async () => {
		const uri = 'file:///workspace/Example.pmlfrm';
		const source = [
			'setup form !!Example dialog',
			'  member .caption is STRING',
			'  button .apply |Apply| callback |!this.apply()|',
			'  frame .tools',
			'    button .missing |Missing| callback |!this.onMissing()|',
			'  exit',
			'exit',
			'define method .apply()',
			'endmethod'
		].join('\n');
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, uri, source);
		const provider = new CodeLensProvider(
			symbolIndex,
			new ReferencesProvider(symbolIndex, new TextDocuments(TextDocument))
		);

		const lenses = provider.provide(uri);
		const summary = lenses.find(lens => (lens.data as any)?.kind === 'form-summary');
		const member = lenses.find(lens => (lens.data as any)?.kind === 'form-member');
		const existing = lenses.find(lens => (lens.data as any)?.kind === 'form-callback');
		const missing = lenses.find(lens => (lens.data as any)?.kind === 'missing-form-callback');

		expect(await provider.resolve(summary!)).toMatchObject({ command: { title: 'Form actions · 2 callbacks', command: 'pml.showFormAuthoringRefactors' } });
		expect(await provider.resolve(member!)).toMatchObject({ command: { title: 'member: STRING' } });
		expect(await provider.resolve(existing!)).toMatchObject({ command: { title: 'callback → .apply', command: 'pml.goToCallableDefinition' } });
		expect(await provider.resolve(missing!)).toMatchObject({ command: { title: 'missing callback .onMissing', command: 'pml.showFormAuthoringQuickFixes' } });
	});
});
