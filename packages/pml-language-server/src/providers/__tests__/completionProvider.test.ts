import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionProvider } from '../completionProvider';
import { SymbolIndex } from '../../index/symbolIndex';
import { Parser } from '../../parser/parser';

describe('CompletionProvider', () => {
	it('suggests current form methods after !this without built-in method noise', () => {
		const source = [
			'setup form !!TestForm dialog',
			'exit',
			'',
			'define method .refresh(!target is STRING)',
			'endmethod',
			'',
			'!this.'
		].join('\n');
		const document = TextDocument.create('file:///test.pmlfrm', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.map(item => item.label)).toEqual(['.refresh']);
		expect(completions[0]).toMatchObject({
			detail: 'Method (!target)',
			insertText: 'refresh',
			filterText: 'refresh'
		});
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
	});

	it('suggests methods after indexed and dynamic member receivers', () => {
		const source = [
			'define method .refresh(!target is STRING)',
			'endmethod',
			'',
			'!items[1].'
		].join('\n');
		const document = TextDocument.create('file:///test.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === '.refresh')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(true);

		const dynamicSource = '$!<formName>.';
		const dynamicDocument = TextDocument.create('file:///dynamic.pml', 'pml', 1, dynamicSource);
		const dynamicCompletions = provider.provide({
			textDocument: { uri: dynamicDocument.uri },
			position: dynamicDocument.positionAt(dynamicSource.length)
		}, dynamicDocument);

		expect(dynamicCompletions.some(item => item.label === 'upcase')).toBe(true);
	});

	it('formats workspace method parameters with PML markers', () => {
		const uri = 'file:///workspace-completion.pml';
		const source = [
			'define method .refresh(!target is STRING, !count is REAL)',
			'endmethod',
			'',
			're'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new CompletionProvider(symbolIndex);

		const completions = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.find(item => item.label === '.refresh')).toMatchObject({
			detail: 'Method (!target, !count)'
		});
	});

	it('does not treat non-member dots as member completion receivers', () => {
		const provider = new CompletionProvider(new SymbolIndex());
		const sources = [
			'define method .',
			'foo.',
			'-- !comment.',
			"'!string.",
			'|!pipeString.'
		];

		for (const source of sources) {
			const document = TextDocument.create('file:///non-member-dot.pml', 'pml', 1, source);
			const completions = provider.provide({
				textDocument: { uri: document.uri },
				position: document.positionAt(source.length)
			}, document);

			expect(completions, source).toEqual([]);
		}
	});
});
