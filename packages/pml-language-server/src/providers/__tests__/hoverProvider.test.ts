import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { HoverProvider } from '../hoverProvider';

describe('HoverProvider', () => {
	it('shows PDMS command hover only for line-start command starters', () => {
		const document = TextDocument.create(
			'file:///pdms-hover.pml',
			'pml',
			1,
			[
				'MOVE N45E DIST 1500',
				'!result = move'
			].join('\n')
		);
		const provider = new HoverProvider({} as any);

		const commandHover = provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 1 } }, document);
		const expressionHover = provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 11 } }, document);

		expect(commandHover?.contents).toMatchObject({
			kind: 'markdown',
			value: expect.stringContaining('PDMS Command: MOVE')
		});
		expect(expressionHover).toBeNull();
	});

	it('does not show PDMS command hover inside comments', () => {
		const document = TextDocument.create(
			'file:///pdms-hover-comments.pml',
			'pml',
			1,
			[
				'-- MOVE N45E DIST 1500',
				'$* MOVE N45E DIST 1500',
				'$(',
				'MOVE N45E DIST 1500',
				'$)',
				'MOVE N45E DIST 1500'
			].join('\n')
		);
		const provider = new HoverProvider({} as any);

		expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 4 } }, document)).toBeNull();
		expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 4 } }, document)).toBeNull();
		expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 3, character: 1 } }, document)).toBeNull();
		expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 5, character: 1 } }, document)).not.toBeNull();
	});
});
