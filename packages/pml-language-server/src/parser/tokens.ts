/**
 * Token types and definitions for PML lexer
 */

export enum TokenType {
	// Literals
	STRING = 'STRING',
	NUMBER = 'NUMBER',
	BOOLEAN = 'BOOLEAN',

	// Identifiers
	IDENTIFIER = 'IDENTIFIER',
	LOCAL_VAR = 'LOCAL_VAR',      // !variable
	GLOBAL_VAR = 'GLOBAL_VAR',    // !!variable
	SUBSTITUTE_VAR = 'SUBSTITUTE_VAR',  // $!variable or $/attribute
	METHOD = 'METHOD',            // .methodName

	// Keywords
	DEFINE = 'DEFINE',
	METHOD_KW = 'METHOD_KW',
	FUNCTION = 'FUNCTION',
	OBJECT = 'OBJECT',
	ENDOBJECT = 'ENDOBJECT',
	ENDMETHOD = 'ENDMETHOD',
	ENDFUNCTION = 'ENDFUNCTION',
	IF = 'IF',
	THEN = 'THEN',
	ELSE = 'ELSE',
	ELSEIF = 'ELSEIF',
	ENDIF = 'ENDIF',
	DO = 'DO',
	ENDDO = 'ENDDO',
	WHILE = 'WHILE',
	FOR = 'FOR',
	VALUES = 'VALUES',
	INDEX = 'INDEX',
	FROM = 'FROM',
	TO = 'TO',
	BY = 'BY',
	HANDLE = 'HANDLE',
	ELSEHANDLE = 'ELSEHANDLE',
	ENDHANDLE = 'ENDHANDLE',
	RETURN = 'RETURN',
	BREAK = 'BREAK',
	CONTINUE = 'CONTINUE',
	GOTO = 'GOTO',
	VAR = 'VAR',
	SETUP = 'SETUP',
	FORM = 'FORM',
	FRAME = 'FRAME',
	EXIT = 'EXIT',
	MEMBER = 'MEMBER',
	IS = 'IS',

	// Form UI keywords (for syntax highlighting, not strict parsing)
	TEXT = 'TEXT',
	BUTTON = 'BUTTON',
	CALL = 'CALL',
	DIALOG = 'DIALOG',
	RESIZE = 'RESIZE',
	WID = 'WID',
	HEI = 'HEI',

	// PML1 Declarative Keywords (for syntax highlighting, not strict parsing)
	COLLECT = 'COLLECT',
	ALL = 'ALL',
	WITH = 'WITH',
	USING = 'USING',
	AT = 'AT',
	COMPOSE = 'COMPOSE',
	SPACE = 'SPACE',

	// Types
	STRING_TYPE = 'STRING_TYPE',
	REAL_TYPE = 'REAL_TYPE',
	INTEGER_TYPE = 'INTEGER_TYPE',
	BOOLEAN_TYPE = 'BOOLEAN_TYPE',
	ARRAY_TYPE = 'ARRAY_TYPE',
	DBREF_TYPE = 'DBREF_TYPE',
	ANY_TYPE = 'ANY_TYPE',

	// Operators
	PLUS = 'PLUS',
	MINUS = 'MINUS',
	STAR = 'STAR',
	SLASH = 'SLASH',
	POWER = 'POWER',          // **
	MOD = 'MOD',
	DIV = 'DIV',
	EQ = 'EQ',
	NE = 'NE',
	GT = 'GT',
	LT = 'LT',
	GE = 'GE',
	LE = 'LE',
	AND = 'AND',
	OR = 'OR',
	NOT = 'NOT',
	OF = 'OF',                // of (attribute access)
	ASSIGN = 'ASSIGN',        // =

	// Delimiters
	LPAREN = 'LPAREN',        // (
	RPAREN = 'RPAREN',        // )
	LBRACKET = 'LBRACKET',    // [
	RBRACKET = 'RBRACKET',    // ]
	LBRACE = 'LBRACE',        // {
	RBRACE = 'RBRACE',        // }
	PIPE = 'PIPE',            // |
	DOT = 'DOT',              // .
	COMMA = 'COMMA',          // ,
	COLON = 'COLON',          // :
	SEMICOLON = 'SEMICOLON',  // ;

	// Special
	NEWLINE = 'NEWLINE',
	COMMENT = 'COMMENT',
	WHITESPACE = 'WHITESPACE',
	EOF = 'EOF',
	UNKNOWN = 'UNKNOWN',
}

export interface Token {
	type: TokenType;
	value: string;
	line: number;
	column: number;
	offset: number;
	length: number;
}

export const KEYWORDS: Record<string, TokenType> = {
	// Control flow
	'define': TokenType.DEFINE,
	'method': TokenType.METHOD_KW,
	'function': TokenType.FUNCTION,
	'object': TokenType.OBJECT,
	'endobject': TokenType.ENDOBJECT,
	'endmethod': TokenType.ENDMETHOD,
	'endfunction': TokenType.ENDFUNCTION,
	'if': TokenType.IF,
	'then': TokenType.THEN,
	'else': TokenType.ELSE,
	'elseif': TokenType.ELSEIF,
	'endif': TokenType.ENDIF,
	'do': TokenType.DO,
	'enddo': TokenType.ENDDO,
	'while': TokenType.WHILE,
	'for': TokenType.FOR,
	'values': TokenType.VALUES,
	'index': TokenType.INDEX,
	'from': TokenType.FROM,
	'to': TokenType.TO,
	'by': TokenType.BY,
	'handle': TokenType.HANDLE,
	'elsehandle': TokenType.ELSEHANDLE,
	'endhandle': TokenType.ENDHANDLE,
	'return': TokenType.RETURN,
	'break': TokenType.BREAK,
	'continue': TokenType.CONTINUE,
	'goto': TokenType.GOTO,
	'var': TokenType.VAR,
	'setup': TokenType.SETUP,
	'form': TokenType.FORM,
	'frame': TokenType.FRAME,
	'exit': TokenType.EXIT,
	'member': TokenType.MEMBER,
	'is': TokenType.IS,

	// Form UI keywords (recognized but not strictly parsed)
	'text': TokenType.TEXT,
	'button': TokenType.BUTTON,
	'call': TokenType.CALL,
	'dialog': TokenType.DIALOG,
	'resize': TokenType.RESIZE,
	'wid': TokenType.WID,
	'hei': TokenType.HEI,

	// PML1 Declarative Keywords (recognized but not strictly parsed)
	'collect': TokenType.COLLECT,
	'all': TokenType.ALL,
	'with': TokenType.WITH,
	'using': TokenType.USING,
	'at': TokenType.AT,
	'compose': TokenType.COMPOSE,
	'space': TokenType.SPACE,

	// Types
	'STRING': TokenType.STRING_TYPE,
	'REAL': TokenType.REAL_TYPE,
	'INTEGER': TokenType.INTEGER_TYPE,
	'BOOLEAN': TokenType.BOOLEAN_TYPE,
	'ARRAY': TokenType.ARRAY_TYPE,
	'DBREF': TokenType.DBREF_TYPE,
	'ANY': TokenType.ANY_TYPE,

	// Operators
	'mod': TokenType.MOD,
	'div': TokenType.DIV,
	'eq': TokenType.EQ,
	'ne': TokenType.NE,
	'neq': TokenType.NE,
	'gt': TokenType.GT,
	'lt': TokenType.LT,
	'ge': TokenType.GE,
	'le': TokenType.LE,
	'and': TokenType.AND,
	'or': TokenType.OR,
	'not': TokenType.NOT,
	'of': TokenType.OF,

	// Boolean literals
	'TRUE': TokenType.BOOLEAN,
	'FALSE': TokenType.BOOLEAN,
	'true': TokenType.BOOLEAN,
	'false': TokenType.BOOLEAN,
};

/**
 * Check if token is a keyword
 */
export function isKeyword(word: string): boolean {
	return word.toLowerCase() in KEYWORDS;
}

/**
 * Get keyword token type
 */
export function getKeywordType(word: string): TokenType | undefined {
	return KEYWORDS[word.toLowerCase()];
}

/**
 * Check if token type is an operator
 */
export function isOperator(type: TokenType): boolean {
	return [
		TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH,
		TokenType.POWER, TokenType.MOD, TokenType.DIV,
		TokenType.EQ, TokenType.NE, TokenType.GT, TokenType.LT, TokenType.GE, TokenType.LE,
		TokenType.AND, TokenType.OR, TokenType.NOT,
		TokenType.ASSIGN
	].includes(type);
}

/**
 * Check if token type is a comparison operator
 */
export function isComparisonOperator(type: TokenType): boolean {
	return [
		TokenType.EQ, TokenType.NE, TokenType.GT, TokenType.LT, TokenType.GE, TokenType.LE
	].includes(type);
}

/**
 * Check if token type is a logical operator
 */
export function isLogicalOperator(type: TokenType): boolean {
	return [TokenType.AND, TokenType.OR, TokenType.NOT].includes(type);
}

/**
 * Check if token type is an arithmetic operator
 */
export function isArithmeticOperator(type: TokenType): boolean {
	return [
		TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH, TokenType.POWER, TokenType.MOD, TokenType.DIV
	].includes(type);
}
