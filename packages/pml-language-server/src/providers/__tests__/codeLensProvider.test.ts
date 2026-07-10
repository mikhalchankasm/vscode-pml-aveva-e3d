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
});
