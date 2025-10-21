/**
 * PML Lexer (Tokenizer)
 * Converts PML source code into tokens
 */

import { Token, TokenType, getKeywordType } from './tokens';

export class Lexer {
	private source: string;
	private position: number = 0;
	private line: number = 1;
	private column: number = 1;
	private tokens: Token[] = [];

	constructor(source: string) {
		this.source = source;
	}

	/**
	 * Tokenize the entire source
	 */
	public tokenize(): Token[] {
		this.tokens = [];
		this.position = 0;
		this.line = 1;
		this.column = 1;

		while (!this.isAtEnd()) {
			this.scanToken();
		}

		// Add EOF token
		this.tokens.push(this.createToken(TokenType.EOF, '', 0));

		return this.tokens;
	}

	/**
	 * Scan single token
	 */
	private scanToken(): void {
		const startPos = this.position;
		const startLine = this.line;
		const startColumn = this.column;

		const char = this.advance();

		// Whitespace (spaces, tabs)
		if (char === ' ' || char === '\t') {
			while (this.peek() === ' ' || this.peek() === '\t') {
				this.advance();
			}
			// Skip whitespace tokens (we don't need them for parsing)
			return;
		}

		// Newline
		if (char === '\n' || char === '\r') {
			if (char === '\r' && this.peek() === '\n') {
				this.advance(); // consume \n after \r
			}
			this.line++;
			this.column = 1;
			// Skip newline tokens for now (we use them for diagnostics if needed)
			return;
		}

		// Comments: -- or $*
		if (char === '-' && this.peek() === '-') {
			this.scanLineComment();
			return;
		}
		if (char === '$' && this.peek() === '*') {
			this.scanLineComment();
			return;
		}

		// Pipe-delimited strings: |...|
		if (char === '|') {
			this.scanPipeString(startLine, startColumn, startPos);
			return;
		}

		// Single-quoted strings: '...'
		if (char === "'") {
			this.scanQuotedString("'", startLine, startColumn, startPos);
			return;
		}

		// Double-quoted strings: "..."
		if (char === '"') {
			this.scanQuotedString('"', startLine, startColumn, startPos);
			return;
		}

		// Numbers
		if (this.isDigit(char)) {
			this.scanNumber(char, startLine, startColumn, startPos);
			return;
		}

		// Variables and methods
		if (char === '!') {
			this.scanVariable(startLine, startColumn, startPos);
			return;
		}

		// Substitute variables: $!variable or $/attribute
		if (char === '$') {
			this.scanSubstituteVariable(startLine, startColumn, startPos);
			return;
		}

		if (char === '.') {
			// Could be method (.method) or just dot
			if (this.isAlpha(this.peek())) {
				this.scanMethod(startLine, startColumn, startPos);
				return;
			} else {
				this.addToken(TokenType.DOT, '.', startLine, startColumn, startPos, 1);
				return;
			}
		}

		// Identifiers and keywords
		if (this.isAlpha(char) || char === '_') {
			this.scanIdentifier(char, startLine, startColumn, startPos);
			return;
		}

		// Operators and delimiters
		switch (char) {
			case '(':
				this.addToken(TokenType.LPAREN, '(', startLine, startColumn, startPos, 1);
				break;
			case ')':
				this.addToken(TokenType.RPAREN, ')', startLine, startColumn, startPos, 1);
				break;
			case '[':
				this.addToken(TokenType.LBRACKET, '[', startLine, startColumn, startPos, 1);
				break;
			case ']':
				this.addToken(TokenType.RBRACKET, ']', startLine, startColumn, startPos, 1);
				break;
			case '{':
				this.addToken(TokenType.LBRACE, '{', startLine, startColumn, startPos, 1);
				break;
			case '}':
				this.addToken(TokenType.RBRACE, '}', startLine, startColumn, startPos, 1);
				break;
			case ',':
				this.addToken(TokenType.COMMA, ',', startLine, startColumn, startPos, 1);
				break;
			case ':':
				this.addToken(TokenType.COLON, ':', startLine, startColumn, startPos, 1);
				break;
			case ';':
				this.addToken(TokenType.SEMICOLON, ';', startLine, startColumn, startPos, 1);
				break;
			case '+':
				this.addToken(TokenType.PLUS, '+', startLine, startColumn, startPos, 1);
				break;
			case '-':
				this.addToken(TokenType.MINUS, '-', startLine, startColumn, startPos, 1);
				break;
			case '/':
				this.addToken(TokenType.SLASH, '/', startLine, startColumn, startPos, 1);
				break;
			case '*':
				if (this.peek() === '*') {
					this.advance();
					this.addToken(TokenType.POWER, '**', startLine, startColumn, startPos, 2);
				} else {
					this.addToken(TokenType.STAR, '*', startLine, startColumn, startPos, 1);
				}
				break;
			case '=':
				this.addToken(TokenType.ASSIGN, '=', startLine, startColumn, startPos, 1);
				break;
			default:
				// Unknown character
				this.addToken(TokenType.UNKNOWN, char, startLine, startColumn, startPos, 1);
		}
	}

	/**
	 * Scan line comment: -- ... or $* ...
	 */
	private scanLineComment(): void {
		while (this.peek() !== '\n' && !this.isAtEnd()) {
			this.advance();
		}
		// Skip comments (don't add to tokens)
	}

	/**
	 * Scan pipe-delimited string: |...|
	 */
	private scanPipeString(line: number, column: number, offset: number): void {
		let value = '';

		while (this.peek() !== '|' && !this.isAtEnd()) {
			const char = this.advance();
			if (char === '\n') {
				this.line++;
				this.column = 1;
			}
			value += char;
		}

		if (this.isAtEnd()) {
			// Unterminated string - but add token anyway with error
			this.addToken(TokenType.STRING, value, line, column, offset, this.position - offset);
			return;
		}

		// Consume closing |
		this.advance();
		this.addToken(TokenType.STRING, value, line, column, offset, this.position - offset);
	}

	/**
	 * Scan quoted string: '...' or "..."
	 * NOTE: PML does NOT use backslash escapes - backslash is a literal character
	 */
	private scanQuotedString(quote: string, line: number, column: number, offset: number): void {
		let value = '';

		while (this.peek() !== quote && !this.isAtEnd()) {
			const char = this.advance();
			if (char === '\n') {
				this.line++;
				this.column = 1;
			}
			// In PML, backslash is a literal character (no escape sequences)
			value += char;
		}

		if (this.isAtEnd()) {
			// Unterminated string
			this.addToken(TokenType.STRING, value, line, column, offset, this.position - offset);
			return;
		}

		// Consume closing quote
		this.advance();
		this.addToken(TokenType.STRING, value, line, column, offset, this.position - offset);
	}

	/**
	 * Scan number: 123, 45.67, 1.23e-4
	 */
	private scanNumber(firstChar: string, line: number, column: number, offset: number): void {
		let value = firstChar;

		while (this.isDigit(this.peek())) {
			value += this.advance();
		}

		// Decimal part
		if (this.peek() === '.' && this.isDigit(this.peekNext())) {
			value += this.advance(); // consume .
			while (this.isDigit(this.peek())) {
				value += this.advance();
			}
		}

		// Exponent part (e.g., 1.23e-4)
		if (this.peek() === 'e' || this.peek() === 'E') {
			const next = this.peekNext();
			if (this.isDigit(next) || next === '+' || next === '-') {
				value += this.advance(); // consume e
				if (this.peek() === '+' || this.peek() === '-') {
					value += this.advance();
				}
				while (this.isDigit(this.peek())) {
					value += this.advance();
				}
			}
		}

		this.addToken(TokenType.NUMBER, value, line, column, offset, this.position - offset);
	}

	/**
	 * Scan variable: !variable or !!globalVariable
	 */
	private scanVariable(line: number, column: number, offset: number): void {
		let value = '!';
		let type = TokenType.LOCAL_VAR;

		// Check for global variable: !!
		if (this.peek() === '!') {
			value += this.advance();
			type = TokenType.GLOBAL_VAR;
		}

		// Variable name
		while (this.isAlphaNumeric(this.peek())) {
			value += this.advance();
		}

		// If no name after !, it's just a ! character (error)
		if (value.length === 1 || (value.length === 2 && type === TokenType.GLOBAL_VAR)) {
			this.addToken(TokenType.UNKNOWN, value, line, column, offset, this.position - offset);
			return;
		}

		this.addToken(type, value, line, column, offset, this.position - offset);
	}

	/**
	 * Scan method: .methodName
	 */
	private scanMethod(line: number, column: number, offset: number): void {
		let value = '.';

		while (this.isAlphaNumeric(this.peek())) {
			value += this.advance();
		}

		this.addToken(TokenType.METHOD, value, line, column, offset, this.position - offset);
	}

	/**
	 * Scan substitute variable: $!variable or $/attribute or $identifier
	 * Used for variable substitution in strings and compose expressions
	 */
	private scanSubstituteVariable(line: number, column: number, offset: number): void {
		let value = '$';

		// Check for $!variable or $!!global or $/attribute
		const next = this.peek();

		if (next === '!') {
			value += this.advance();

			// Check for $!!global
			if (this.peek() === '!') {
				value += this.advance();
			}

			// Variable name
			while (this.isAlphaNumeric(this.peek())) {
				value += this.advance();
			}
		} else if (next === '/') {
			// $/ATTRIBUTE
			value += this.advance();
			while (this.isAlphaNumeric(this.peek())) {
				value += this.advance();
			}
		} else if (this.isAlpha(next)) {
			// $identifier (e.g., in $!indxA)
			while (this.isAlphaNumeric(this.peek())) {
				value += this.advance();
			}
		}

		this.addToken(TokenType.SUBSTITUTE_VAR, value, line, column, offset, this.position - offset);
	}

	/**
	 * Scan identifier or keyword
	 */
	private scanIdentifier(firstChar: string, line: number, column: number, offset: number): void {
		let value = firstChar;

		while (this.isAlphaNumeric(this.peek())) {
			value += this.advance();
		}

		// Check if keyword
		const keywordType = getKeywordType(value);
		if (keywordType) {
			this.addToken(keywordType, value, line, column, offset, this.position - offset);
		} else {
			this.addToken(TokenType.IDENTIFIER, value, line, column, offset, this.position - offset);
		}
	}

	/**
	 * Helper methods
	 */

	private isAtEnd(): boolean {
		return this.position >= this.source.length;
	}

	private advance(): string {
		const char = this.source[this.position];
		this.position++;
		this.column++;
		return char;
	}

	private peek(): string {
		if (this.isAtEnd()) return '\0';
		return this.source[this.position];
	}

	private peekNext(): string {
		if (this.position + 1 >= this.source.length) return '\0';
		return this.source[this.position + 1];
	}

	private isDigit(char: string): boolean {
		return char >= '0' && char <= '9';
	}

	private isAlpha(char: string): boolean {
		return (char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			char === '_';
	}

	private isAlphaNumeric(char: string): boolean {
		return this.isAlpha(char) || this.isDigit(char);
	}

	private addToken(type: TokenType, value: string, line: number, column: number, offset: number, length: number): void {
		this.tokens.push(this.createToken(type, value, length, line, column, offset));
	}

	private createToken(type: TokenType, value: string, length: number, line: number = this.line, column: number = this.column, offset: number = this.position): Token {
		return {
			type,
			value,
			line,
			column,
			offset,
			length
		};
	}
}
