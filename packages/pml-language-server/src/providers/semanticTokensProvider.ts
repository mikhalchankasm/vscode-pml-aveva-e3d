/**
 * Semantic Tokens Provider
 * Provides semantic highlighting for PML code
 *
 * Token types:
 * - variable: local variables (!var)
 * - parameter: method parameters
 * - function: method/function names
 * - class: object names
 * - type: type names (STRING, REAL, etc.)
 * - keyword: PML keywords
 * - string: string literals
 * - number: numeric literals
 * - comment: comments
 */

import {
	SemanticTokens,
	SemanticTokensBuilder,
	SemanticTokensParams,
	TextDocuments
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

// Define token types - order matters for encoding
export const tokenTypes = [
	'variable',      // 0 - local variables (!var)
	'parameter',     // 1 - method parameters
	'function',      // 2 - method names (.method)
	'class',         // 3 - object names
	'type',          // 4 - type keywords (STRING, REAL, etc.)
	'keyword',       // 5 - control flow keywords
	'string',        // 6 - string literals
	'number',        // 7 - numbers
	'comment',       // 8 - comments
	'property',      // 9 - member access
	'namespace',     // 10 - global variables (!!var)
];

// Token modifiers
export const tokenModifiers = [
	'declaration',   // 0 - variable/function declaration
	'definition',    // 1 - definition
	'readonly',      // 2 - constant
	'deprecated',    // 3 - deprecated symbol
	'modification',  // 4 - assignment target
];

// Token type indices
const TOKEN = {
	VARIABLE: 0,
	PARAMETER: 1,
	FUNCTION: 2,
	CLASS: 3,
	TYPE: 4,
	KEYWORD: 5,
	STRING: 6,
	NUMBER: 7,
	COMMENT: 8,
	PROPERTY: 9,
	NAMESPACE: 10,
};

// Token modifier flags
const MOD = {
	DECLARATION: 1 << 0,
	DEFINITION: 1 << 1,
	READONLY: 1 << 2,
	DEPRECATED: 1 << 3,
	MODIFICATION: 1 << 4,
};

// PML type keywords
const TYPE_KEYWORDS = new Set([
	'string', 'real', 'boolean', 'array', 'dbref', 'integer', 'any'
]);

// PML control flow keywords
const CONTROL_KEYWORDS = new Set([
	'if', 'then', 'else', 'elseif', 'endif',
	'do', 'enddo', 'values', 'from', 'to', 'by',
	'handle', 'elsehandle', 'endhandle',
	'return', 'skip', 'break',
	'define', 'method', 'function', 'object', 'endmethod', 'endfunction', 'endobject',
	'setup', 'form', 'exit', 'frame', 'member',
	'is', 'of', 'using', 'namespace'
]);

// PML operators that should be highlighted
const OPERATOR_KEYWORDS = new Set([
	'and', 'or', 'not', 'eq', 'ne', 'lt', 'gt', 'le', 'ge',
	'true', 'false', 'unset'
]);

export class SemanticTokensProvider {
	constructor(private documents: TextDocuments<TextDocument>) {}

	/**
	 * Provide semantic tokens for full document
	 */
	public provideFull(params: SemanticTokensParams): SemanticTokens {
		const document = this.documents.get(params.textDocument.uri);
		if (!document) {
			return { data: [] };
		}

		const builder = new SemanticTokensBuilder();
		const text = document.getText();
		// Handle both CRLF and LF line endings
		const lines = text.split(/\r?\n/);

		// Track multi-line comment state
		let inBlockComment = false;

		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			const line = lines[lineIndex];
			inBlockComment = this.tokenizeLine(line, lineIndex, builder, inBlockComment);
		}

		return builder.build();
	}

	/**
	 * Tokenize a single line
	 * Returns whether we're still inside a block comment at the end of the line
	 */
	private tokenizeLine(
		line: string,
		lineIndex: number,
		builder: SemanticTokensBuilder,
		inBlockComment: boolean
	): boolean {
		let pos = 0;

		// If we're continuing a block comment from a previous line
		if (inBlockComment) {
			const endPos = line.indexOf('*$');
			if (endPos !== -1) {
				// Block comment ends on this line
				const length = endPos + 2;
				builder.push(lineIndex, 0, length, TOKEN.COMMENT, 0);
				pos = endPos + 2;
				inBlockComment = false;
			} else {
				// Entire line is part of the block comment
				if (line.length > 0) {
					builder.push(lineIndex, 0, line.length, TOKEN.COMMENT, 0);
				}
				return true; // Still in block comment
			}
		}

		while (pos < line.length) {
			// Skip whitespace
			if (/\s/.test(line[pos])) {
				pos++;
				continue;
			}

			// Line comments (-- to end of line)
			if (line[pos] === '-' && line[pos + 1] === '-') {
				const length = line.length - pos;
				builder.push(lineIndex, pos, length, TOKEN.COMMENT, 0);
				break; // Rest of line is comment
			}

			// Block comment ($* ... *$)
			if (line[pos] === '$' && line[pos + 1] === '*') {
				const endPos = line.indexOf('*$', pos + 2);
				if (endPos !== -1) {
					// Block comment ends on same line
					const length = endPos - pos + 2;
					builder.push(lineIndex, pos, length, TOKEN.COMMENT, 0);
					pos = endPos + 2;
					continue;
				} else {
					// Block comment continues to next line
					const length = line.length - pos;
					builder.push(lineIndex, pos, length, TOKEN.COMMENT, 0);
					return true; // Now in block comment
				}
			}

			// String literals (|...|)
			if (line[pos] === '|') {
				const endPos = line.indexOf('|', pos + 1);
				if (endPos !== -1) {
					const length = endPos - pos + 1;
					builder.push(lineIndex, pos, length, TOKEN.STRING, 0);
					pos = endPos + 1;
					continue;
				}
			}

			// String literals ('...')
			if (line[pos] === "'") {
				const endPos = line.indexOf("'", pos + 1);
				if (endPos !== -1) {
					const length = endPos - pos + 1;
					builder.push(lineIndex, pos, length, TOKEN.STRING, 0);
					pos = endPos + 1;
					continue;
				}
			}

			// Global variables (!!varName)
			if (line[pos] === '!' && line[pos + 1] === '!') {
				const match = line.substring(pos).match(/^!![A-Za-z_][A-Za-z0-9_]*/);
				if (match) {
					// Check if it's a declaration/definition
					const beforeText = line.substring(0, pos).trim();
					const isDeclaration = beforeText === '' || beforeText.endsWith('=');
					const modifier = isDeclaration ? MOD.DECLARATION : 0;

					builder.push(lineIndex, pos, match[0].length, TOKEN.NAMESPACE, modifier);
					pos += match[0].length;
					continue;
				}
			}

			// Local variables (!varName)
			if (line[pos] === '!') {
				const match = line.substring(pos).match(/^![A-Za-z_][A-Za-z0-9_]*/);
				if (match) {
					// Check if it's a parameter context
					const beforeText = line.substring(0, pos).trim();
					const isParameter = beforeText.endsWith('(') || beforeText.endsWith(',');

					builder.push(
						lineIndex,
						pos,
						match[0].length,
						isParameter ? TOKEN.PARAMETER : TOKEN.VARIABLE,
						0
					);
					pos += match[0].length;
					continue;
				}
			}

			// Method names (.methodName)
			if (line[pos] === '.') {
				const match = line.substring(pos).match(/^\.[A-Za-z_][A-Za-z0-9_]*/);
				if (match) {
					// Check if it's a definition
					const beforeText = line.substring(0, pos).trim().toLowerCase();
					const isDefinition = beforeText.endsWith('method') || beforeText.endsWith('member');

					builder.push(
						lineIndex,
						pos,
						match[0].length,
						TOKEN.FUNCTION,
						isDefinition ? MOD.DEFINITION : 0
					);
					pos += match[0].length;
					continue;
				}
			}

			// Numbers
			const numberMatch = line.substring(pos).match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
			if (numberMatch) {
				builder.push(lineIndex, pos, numberMatch[0].length, TOKEN.NUMBER, 0);
				pos += numberMatch[0].length;
				continue;
			}

			// Identifiers and keywords
			const identMatch = line.substring(pos).match(/^[A-Za-z_][A-Za-z0-9_]*/);
			if (identMatch) {
				const word = identMatch[0];
				const lowerWord = word.toLowerCase();

				if (TYPE_KEYWORDS.has(lowerWord)) {
					builder.push(lineIndex, pos, word.length, TOKEN.TYPE, 0);
				} else if (CONTROL_KEYWORDS.has(lowerWord)) {
					builder.push(lineIndex, pos, word.length, TOKEN.KEYWORD, 0);
				} else if (OPERATOR_KEYWORDS.has(lowerWord)) {
					builder.push(lineIndex, pos, word.length, TOKEN.KEYWORD, 0);
				} else if (lowerWord === 'object' && this.isObjectInstantiation(line, pos)) {
					// Skip 'OBJECT' keyword, next word is class name
					builder.push(lineIndex, pos, word.length, TOKEN.KEYWORD, 0);
				} else {
					// Check if it's a class name (after 'object' or 'is')
					const beforeText = line.substring(0, pos).trim().toLowerCase();
					if (beforeText.endsWith('object') || beforeText.endsWith('is')) {
						builder.push(lineIndex, pos, word.length, TOKEN.CLASS, 0);
					}
					// Otherwise don't highlight - let TextMate handle it
				}

				pos += word.length;
				continue;
			}

			// Skip other characters
			pos++;
		}

		return inBlockComment;
	}

	/**
	 * Check if we're in an OBJECT instantiation context
	 */
	private isObjectInstantiation(line: string, pos: number): boolean {
		const afterText = line.substring(pos + 6).trim(); // After 'OBJECT'
		return /^[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(afterText);
	}
}

/**
 * Semantic tokens legend for client registration
 */
export const semanticTokensLegend = {
	tokenTypes,
	tokenModifiers
};
