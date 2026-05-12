import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionProvider } from '../completionProvider';
import { SymbolIndex } from '../../index/symbolIndex';

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
});
