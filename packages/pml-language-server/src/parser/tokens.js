"use strict";
/**
 * Token types and definitions for PML lexer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEYWORDS = exports.TokenType = void 0;
exports.isKeyword = isKeyword;
exports.getKeywordType = getKeywordType;
exports.isOperator = isOperator;
exports.isComparisonOperator = isComparisonOperator;
exports.isLogicalOperator = isLogicalOperator;
exports.isArithmeticOperator = isArithmeticOperator;
var TokenType;
(function (TokenType) {
    // Literals
    TokenType["STRING"] = "STRING";
    TokenType["NUMBER"] = "NUMBER";
    TokenType["BOOLEAN"] = "BOOLEAN";
    // Identifiers
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    TokenType["LOCAL_VAR"] = "LOCAL_VAR";
    TokenType["GLOBAL_VAR"] = "GLOBAL_VAR";
    TokenType["METHOD"] = "METHOD";
    // Keywords
    TokenType["DEFINE"] = "DEFINE";
    TokenType["METHOD_KW"] = "METHOD_KW";
    TokenType["OBJECT"] = "OBJECT";
    TokenType["ENDOBJECT"] = "ENDOBJECT";
    TokenType["ENDMETHOD"] = "ENDMETHOD";
    TokenType["IF"] = "IF";
    TokenType["THEN"] = "THEN";
    TokenType["ELSE"] = "ELSE";
    TokenType["ELSEIF"] = "ELSEIF";
    TokenType["ENDIF"] = "ENDIF";
    TokenType["DO"] = "DO";
    TokenType["ENDDO"] = "ENDDO";
    TokenType["WHILE"] = "WHILE";
    TokenType["FOR"] = "FOR";
    TokenType["VALUES"] = "VALUES";
    TokenType["INDEX"] = "INDEX";
    TokenType["FROM"] = "FROM";
    TokenType["TO"] = "TO";
    TokenType["HANDLE"] = "HANDLE";
    TokenType["ELSEHANDLE"] = "ELSEHANDLE";
    TokenType["ENDHANDLE"] = "ENDHANDLE";
    TokenType["RETURN"] = "RETURN";
    TokenType["BREAK"] = "BREAK";
    TokenType["CONTINUE"] = "CONTINUE";
    TokenType["GOTO"] = "GOTO";
    TokenType["SETUP"] = "SETUP";
    TokenType["FORM"] = "FORM";
    TokenType["FRAME"] = "FRAME";
    TokenType["EXIT"] = "EXIT";
    TokenType["MEMBER"] = "MEMBER";
    TokenType["IS"] = "IS";
    // Types
    TokenType["STRING_TYPE"] = "STRING_TYPE";
    TokenType["REAL_TYPE"] = "REAL_TYPE";
    TokenType["INTEGER_TYPE"] = "INTEGER_TYPE";
    TokenType["BOOLEAN_TYPE"] = "BOOLEAN_TYPE";
    TokenType["ARRAY_TYPE"] = "ARRAY_TYPE";
    TokenType["DBREF_TYPE"] = "DBREF_TYPE";
    TokenType["ANY_TYPE"] = "ANY_TYPE";
    // Operators
    TokenType["PLUS"] = "PLUS";
    TokenType["MINUS"] = "MINUS";
    TokenType["STAR"] = "STAR";
    TokenType["SLASH"] = "SLASH";
    TokenType["POWER"] = "POWER";
    TokenType["MOD"] = "MOD";
    TokenType["DIV"] = "DIV";
    TokenType["EQ"] = "EQ";
    TokenType["NE"] = "NE";
    TokenType["GT"] = "GT";
    TokenType["LT"] = "LT";
    TokenType["GE"] = "GE";
    TokenType["LE"] = "LE";
    TokenType["AND"] = "AND";
    TokenType["OR"] = "OR";
    TokenType["NOT"] = "NOT";
    TokenType["ASSIGN"] = "ASSIGN";
    // Delimiters
    TokenType["LPAREN"] = "LPAREN";
    TokenType["RPAREN"] = "RPAREN";
    TokenType["LBRACKET"] = "LBRACKET";
    TokenType["RBRACKET"] = "RBRACKET";
    TokenType["LBRACE"] = "LBRACE";
    TokenType["RBRACE"] = "RBRACE";
    TokenType["PIPE"] = "PIPE";
    TokenType["DOT"] = "DOT";
    TokenType["COMMA"] = "COMMA";
    TokenType["COLON"] = "COLON";
    TokenType["SEMICOLON"] = "SEMICOLON";
    // Special
    TokenType["NEWLINE"] = "NEWLINE";
    TokenType["COMMENT"] = "COMMENT";
    TokenType["WHITESPACE"] = "WHITESPACE";
    TokenType["EOF"] = "EOF";
    TokenType["UNKNOWN"] = "UNKNOWN";
})(TokenType || (exports.TokenType = TokenType = {}));
exports.KEYWORDS = {
    // Control flow
    'define': TokenType.DEFINE,
    'method': TokenType.METHOD_KW,
    'object': TokenType.OBJECT,
    'endobject': TokenType.ENDOBJECT,
    'endmethod': TokenType.ENDMETHOD,
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
    'handle': TokenType.HANDLE,
    'elsehandle': TokenType.ELSEHANDLE,
    'endhandle': TokenType.ENDHANDLE,
    'return': TokenType.RETURN,
    'break': TokenType.BREAK,
    'continue': TokenType.CONTINUE,
    'goto': TokenType.GOTO,
    'setup': TokenType.SETUP,
    'form': TokenType.FORM,
    'frame': TokenType.FRAME,
    'exit': TokenType.EXIT,
    'member': TokenType.MEMBER,
    'is': TokenType.IS,
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
    'gt': TokenType.GT,
    'lt': TokenType.LT,
    'ge': TokenType.GE,
    'le': TokenType.LE,
    'and': TokenType.AND,
    'or': TokenType.OR,
    'not': TokenType.NOT,
    // Boolean literals
    'TRUE': TokenType.BOOLEAN,
    'FALSE': TokenType.BOOLEAN,
    'true': TokenType.BOOLEAN,
    'false': TokenType.BOOLEAN,
};
/**
 * Check if token is a keyword
 */
function isKeyword(word) {
    return word.toLowerCase() in exports.KEYWORDS;
}
/**
 * Get keyword token type
 */
function getKeywordType(word) {
    return exports.KEYWORDS[word.toLowerCase()];
}
/**
 * Check if token type is an operator
 */
function isOperator(type) {
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
function isComparisonOperator(type) {
    return [
        TokenType.EQ, TokenType.NE, TokenType.GT, TokenType.LT, TokenType.GE, TokenType.LE
    ].includes(type);
}
/**
 * Check if token type is a logical operator
 */
function isLogicalOperator(type) {
    return [TokenType.AND, TokenType.OR, TokenType.NOT].includes(type);
}
/**
 * Check if token type is an arithmetic operator
 */
function isArithmeticOperator(type) {
    return [
        TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH, TokenType.POWER, TokenType.MOD, TokenType.DIV
    ].includes(type);
}
//# sourceMappingURL=tokens.js.map