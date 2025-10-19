"use strict";
/**
 * PML Lexer (Tokenizer)
 * Converts PML source code into tokens
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const tokens_1 = require("./tokens");
class Lexer {
    constructor(source) {
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.source = source;
    }
    /**
     * Tokenize the entire source
     */
    tokenize() {
        this.tokens = [];
        this.position = 0;
        this.line = 1;
        this.column = 1;
        while (!this.isAtEnd()) {
            this.scanToken();
        }
        // Add EOF token
        this.tokens.push(this.createToken(tokens_1.TokenType.EOF, '', 0));
        return this.tokens;
    }
    /**
     * Scan single token
     */
    scanToken() {
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
        if (char === '.') {
            // Could be method (.method) or just dot
            if (this.isAlpha(this.peek())) {
                this.scanMethod(startLine, startColumn, startPos);
                return;
            }
            else {
                this.addToken(tokens_1.TokenType.DOT, '.', startLine, startColumn, startPos, 1);
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
                this.addToken(tokens_1.TokenType.LPAREN, '(', startLine, startColumn, startPos, 1);
                break;
            case ')':
                this.addToken(tokens_1.TokenType.RPAREN, ')', startLine, startColumn, startPos, 1);
                break;
            case '[':
                this.addToken(tokens_1.TokenType.LBRACKET, '[', startLine, startColumn, startPos, 1);
                break;
            case ']':
                this.addToken(tokens_1.TokenType.RBRACKET, ']', startLine, startColumn, startPos, 1);
                break;
            case '{':
                this.addToken(tokens_1.TokenType.LBRACE, '{', startLine, startColumn, startPos, 1);
                break;
            case '}':
                this.addToken(tokens_1.TokenType.RBRACE, '}', startLine, startColumn, startPos, 1);
                break;
            case ',':
                this.addToken(tokens_1.TokenType.COMMA, ',', startLine, startColumn, startPos, 1);
                break;
            case ':':
                this.addToken(tokens_1.TokenType.COLON, ':', startLine, startColumn, startPos, 1);
                break;
            case ';':
                this.addToken(tokens_1.TokenType.SEMICOLON, ';', startLine, startColumn, startPos, 1);
                break;
            case '+':
                this.addToken(tokens_1.TokenType.PLUS, '+', startLine, startColumn, startPos, 1);
                break;
            case '-':
                this.addToken(tokens_1.TokenType.MINUS, '-', startLine, startColumn, startPos, 1);
                break;
            case '/':
                this.addToken(tokens_1.TokenType.SLASH, '/', startLine, startColumn, startPos, 1);
                break;
            case '*':
                if (this.peek() === '*') {
                    this.advance();
                    this.addToken(tokens_1.TokenType.POWER, '**', startLine, startColumn, startPos, 2);
                }
                else {
                    this.addToken(tokens_1.TokenType.STAR, '*', startLine, startColumn, startPos, 1);
                }
                break;
            case '=':
                this.addToken(tokens_1.TokenType.ASSIGN, '=', startLine, startColumn, startPos, 1);
                break;
            default:
                // Unknown character
                this.addToken(tokens_1.TokenType.UNKNOWN, char, startLine, startColumn, startPos, 1);
        }
    }
    /**
     * Scan line comment: -- ... or $* ...
     */
    scanLineComment() {
        while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
        }
        // Skip comments (don't add to tokens)
    }
    /**
     * Scan pipe-delimited string: |...|
     */
    scanPipeString(line, column, offset) {
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
            this.addToken(tokens_1.TokenType.STRING, value, line, column, offset, this.position - offset);
            return;
        }
        // Consume closing |
        this.advance();
        this.addToken(tokens_1.TokenType.STRING, value, line, column, offset, this.position - offset);
    }
    /**
     * Scan quoted string: '...' or "..."
     */
    scanQuotedString(quote, line, column, offset) {
        let value = '';
        while (this.peek() !== quote && !this.isAtEnd()) {
            const char = this.advance();
            if (char === '\n') {
                this.line++;
                this.column = 1;
            }
            value += char;
        }
        if (this.isAtEnd()) {
            // Unterminated string
            this.addToken(tokens_1.TokenType.STRING, value, line, column, offset, this.position - offset);
            return;
        }
        // Consume closing quote
        this.advance();
        this.addToken(tokens_1.TokenType.STRING, value, line, column, offset, this.position - offset);
    }
    /**
     * Scan number: 123, 45.67, 1.23e-4
     */
    scanNumber(firstChar, line, column, offset) {
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
        this.addToken(tokens_1.TokenType.NUMBER, value, line, column, offset, this.position - offset);
    }
    /**
     * Scan variable: !variable or !!globalVariable
     */
    scanVariable(line, column, offset) {
        let value = '!';
        let type = tokens_1.TokenType.LOCAL_VAR;
        // Check for global variable: !!
        if (this.peek() === '!') {
            value += this.advance();
            type = tokens_1.TokenType.GLOBAL_VAR;
        }
        // Variable name
        while (this.isAlphaNumeric(this.peek())) {
            value += this.advance();
        }
        // If no name after !, it's just a ! character (error)
        if (value.length === 1 || (value.length === 2 && type === tokens_1.TokenType.GLOBAL_VAR)) {
            this.addToken(tokens_1.TokenType.UNKNOWN, value, line, column, offset, this.position - offset);
            return;
        }
        this.addToken(type, value, line, column, offset, this.position - offset);
    }
    /**
     * Scan method: .methodName
     */
    scanMethod(line, column, offset) {
        let value = '.';
        while (this.isAlphaNumeric(this.peek())) {
            value += this.advance();
        }
        this.addToken(tokens_1.TokenType.METHOD, value, line, column, offset, this.position - offset);
    }
    /**
     * Scan identifier or keyword
     */
    scanIdentifier(firstChar, line, column, offset) {
        let value = firstChar;
        while (this.isAlphaNumeric(this.peek())) {
            value += this.advance();
        }
        // Check if keyword
        const keywordType = (0, tokens_1.getKeywordType)(value);
        if (keywordType) {
            this.addToken(keywordType, value, line, column, offset, this.position - offset);
        }
        else {
            this.addToken(tokens_1.TokenType.IDENTIFIER, value, line, column, offset, this.position - offset);
        }
    }
    /**
     * Helper methods
     */
    isAtEnd() {
        return this.position >= this.source.length;
    }
    advance() {
        const char = this.source[this.position];
        this.position++;
        this.column++;
        return char;
    }
    peek() {
        if (this.isAtEnd())
            return '\0';
        return this.source[this.position];
    }
    peekNext() {
        if (this.position + 1 >= this.source.length)
            return '\0';
        return this.source[this.position + 1];
    }
    isDigit(char) {
        return char >= '0' && char <= '9';
    }
    isAlpha(char) {
        return (char >= 'a' && char <= 'z') ||
            (char >= 'A' && char <= 'Z') ||
            char === '_';
    }
    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }
    addToken(type, value, line, column, offset, length) {
        this.tokens.push(this.createToken(type, value, length, line, column, offset));
    }
    createToken(type, value, length, line = this.line, column = this.column, offset = this.position) {
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
exports.Lexer = Lexer;
//# sourceMappingURL=lexer.js.map