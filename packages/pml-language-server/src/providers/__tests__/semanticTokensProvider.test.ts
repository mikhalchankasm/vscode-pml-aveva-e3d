import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SemanticTokensProvider, tokenTypes } from '../semanticTokensProvider';

interface DecodedToken {
	line: number;
	start: number;
	length: number;
	type: string;
}

function decodeTokens(data: number[]): DecodedToken[] {
	const tokens: DecodedToken[] = [];
	let line = 0;
	let start = 0;

	for (let i = 0; i < data.length; i += 5) {
		line += data[i];
		start = data[i] === 0 ? start + data[i + 1] : data[i + 1];
		tokens.push({
			line,
			start,
			length: data[i + 2],
			type: tokenTypes[data[i + 3]]
		});
	}

	return tokens;
}

describe('SemanticTokensProvider', () => {
	it('should keep $* comments scoped to one line', () => {
		const uri = 'file:///comment-scope.pml';
		const source = [
			'$* this line is a comment',
			'!value = 1'
		].join('\n');
		const document = TextDocument.create(uri, 'pml', 1, source);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};

		const provider = new SemanticTokensProvider(documents as any);
		const result = provider.provideFull({ textDocument: { uri } });
		const tokens = decodeTokens(result.data);

		expect(tokens).toContainEqual({
			line: 0,
			start: 0,
			length: 25,
			type: 'comment'
		});
		expect(tokens.some(token => token.line === 1 && token.type === 'comment')).toBe(false);
		expect(tokens.some(token => token.line === 1 && token.type === 'variable')).toBe(true);
	});

	it('should mark dollar-paren block comments across lines', () => {
		const uri = 'file:///block-comment.pml';
		const source = [
			'$(',
			'!commented = 1',
			'$)',
			'!value = 1'
		].join('\n');
		const document = TextDocument.create(uri, 'pml', 1, source);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};

		const provider = new SemanticTokensProvider(documents as any);
		const result = provider.provideFull({ textDocument: { uri } });
		const tokens = decodeTokens(result.data);

		expect(tokens.some(token => token.line === 0 && token.type === 'comment')).toBe(true);
		expect(tokens.some(token => token.line === 1 && token.type === 'comment')).toBe(true);
		expect(tokens.some(token => token.line === 2 && token.type === 'comment')).toBe(true);
		expect(tokens.some(token => token.line === 3 && token.type === 'comment')).toBe(false);
		expect(tokens.some(token => token.line === 3 && token.type === 'variable')).toBe(true);
	});

	it('should highlight $P output lines as keywords', () => {
		const uri = 'file:///output.pml';
		const source = '$P debug $!value';
		const document = TextDocument.create(uri, 'pml', 1, source);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};

		const provider = new SemanticTokensProvider(documents as any);
		const result = provider.provideFull({ textDocument: { uri } });
		const tokens = decodeTokens(result.data);

		expect(tokens).toContainEqual({
			line: 0,
			start: 0,
			length: source.length,
			type: 'keyword'
		});
	});

	it('should highlight PDMS command starters as keywords', () => {
		const uri = 'file:///pdms-command.pml';
		const source = 'MOVE N45E DIST 1500';
		const document = TextDocument.create(uri, 'pml', 1, source);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};

		const provider = new SemanticTokensProvider(documents as any);
		const result = provider.provideFull({ textDocument: { uri } });
		const tokens = decodeTokens(result.data);

		expect(tokens).toContainEqual({
			line: 0,
			start: 0,
			length: 4,
			type: 'keyword'
		});
	});
});
