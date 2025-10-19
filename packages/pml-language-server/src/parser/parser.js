"use strict";
/**
 * PML Parser
 * Recursive Descent Parser - converts tokens to AST
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseError = exports.Parser = void 0;
const tokens_1 = require("./tokens");
const lexer_1 = require("./lexer");
const nodes_1 = require("../ast/nodes");
class Parser {
    constructor() {
        this.tokens = [];
        this.current = 0;
        this.errors = [];
    }
    /**
     * Parse source code into AST
     */
    parse(source) {
        // Tokenize
        const lexer = new lexer_1.Lexer(source);
        this.tokens = lexer.tokenize();
        this.current = 0;
        this.errors = [];
        // Parse
        const statements = [];
        while (!this.isAtEnd()) {
            try {
                const stmt = this.parseTopLevelStatement();
                if (stmt) {
                    statements.push(stmt);
                }
            }
            catch (error) {
                // Error recovery: skip to next statement
                this.synchronize();
            }
        }
        const program = {
            type: 'Program',
            body: statements,
            range: this.createRange(0, this.tokens.length - 1)
        };
        return {
            ast: program,
            errors: this.errors
        };
    }
    /**
     * Parse top-level statement (method, object, form)
     */
    parseTopLevelStatement() {
        // Skip whitespace/comments
        this.skipTrivia();
        if (this.isAtEnd())
            return null;
        // define method / object
        if (this.check(tokens_1.TokenType.DEFINE)) {
            return this.parseDefinition();
        }
        // setup form
        if (this.check(tokens_1.TokenType.SETUP)) {
            return this.parseFormDefinition();
        }
        // Variables, expressions, etc.
        return this.parseStatement();
    }
    /**
     * Parse definition (method or object)
     */
    parseDefinition() {
        const startToken = this.consume(tokens_1.TokenType.DEFINE, "Expected 'define'");
        if (this.check(tokens_1.TokenType.METHOD_KW)) {
            return this.parseMethodDefinition(startToken);
        }
        else if (this.check(tokens_1.TokenType.OBJECT)) {
            return this.parseObjectDefinition(startToken);
        }
        else {
            throw this.error(this.peek(), "Expected 'method' or 'object' after 'define'");
        }
    }
    /**
     * Parse method definition
     * define method .methodName(!param1, !param2)
     *   ...
     * endmethod
     */
    parseMethodDefinition(startToken) {
        this.consume(tokens_1.TokenType.METHOD_KW, "Expected 'method'");
        // Parse documentation (JSDoc comments before method)
        const documentation = this.parsePrecedingDocumentation();
        // Method name: .methodName
        const nameToken = this.consume(tokens_1.TokenType.METHOD, "Expected method name (e.g., .myMethod)");
        const methodName = nameToken.value.substring(1); // Remove leading dot
        // Parameters: (...)
        this.consume(tokens_1.TokenType.LPAREN, "Expected '(' after method name");
        const parameters = this.parseParameters();
        this.consume(tokens_1.TokenType.RPAREN, "Expected ')' after parameters");
        // Method body
        const body = [];
        while (!this.check(tokens_1.TokenType.ENDMETHOD) && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                body.push(stmt);
            }
        }
        const endToken = this.consume(tokens_1.TokenType.ENDMETHOD, "Expected 'endmethod'");
        return {
            type: 'MethodDefinition',
            name: methodName,
            parameters,
            body,
            documentation,
            deprecated: documentation?.deprecated || false,
            range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
        };
    }
    /**
     * Parse object definition
     * define object MyObject
     *   member .method1()
     *     ...
     *   endmethod
     * endobject
     */
    parseObjectDefinition(startToken) {
        this.consume(tokens_1.TokenType.OBJECT, "Expected 'object'");
        const nameToken = this.consume(tokens_1.TokenType.IDENTIFIER, "Expected object name");
        const objectName = nameToken.value;
        const members = [];
        while (!this.check(tokens_1.TokenType.ENDOBJECT) && !this.isAtEnd()) {
            // Parse member methods
            if (this.check(tokens_1.TokenType.MEMBER)) {
                this.advance(); // consume 'member'
                const memberMethod = this.parseMethodDefinition(this.previous());
                members.push(memberMethod);
            }
            else {
                this.advance(); // skip unknown tokens
            }
        }
        const endToken = this.consume(tokens_1.TokenType.ENDOBJECT, "Expected 'endobject'");
        return {
            type: 'ObjectDefinition',
            name: objectName,
            members,
            range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
        };
    }
    /**
     * Parse form definition
     * setup form !!MyForm
     *   frame .myFrame
     *     ...
     *   exit
     * exit
     */
    parseFormDefinition() {
        const startToken = this.consume(tokens_1.TokenType.SETUP, "Expected 'setup'");
        this.consume(tokens_1.TokenType.FORM, "Expected 'form'");
        const nameToken = this.consume(tokens_1.TokenType.GLOBAL_VAR, "Expected form name (e.g., !!MyForm)");
        const formName = nameToken.value;
        const frames = [];
        const callbacks = {};
        while (!this.check(tokens_1.TokenType.EXIT) && !this.isAtEnd()) {
            if (this.check(tokens_1.TokenType.FRAME)) {
                frames.push(this.parseFrameDefinition());
            }
            else {
                this.advance();
            }
        }
        const endToken = this.consume(tokens_1.TokenType.EXIT, "Expected 'exit'");
        return {
            type: 'FormDefinition',
            name: formName,
            frames,
            callbacks,
            range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
        };
    }
    /**
     * Parse frame definition
     */
    parseFrameDefinition() {
        const startToken = this.consume(tokens_1.TokenType.FRAME, "Expected 'frame'");
        const nameToken = this.consume(tokens_1.TokenType.METHOD, "Expected frame name (e.g., .myFrame)");
        const frameName = nameToken.value.substring(1);
        const gadgets = [];
        while (!this.check(tokens_1.TokenType.EXIT) && !this.check(tokens_1.TokenType.FRAME) && !this.isAtEnd()) {
            // TODO: Parse gadget declarations
            this.advance();
        }
        const endToken = this.consume(tokens_1.TokenType.EXIT, "Expected 'exit'");
        return {
            type: 'FrameDefinition',
            name: frameName,
            gadgets,
            range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
        };
    }
    /**
     * Parse parameters
     */
    parseParameters() {
        const params = [];
        if (this.check(tokens_1.TokenType.RPAREN)) {
            return params; // No parameters
        }
        do {
            // Parameter: !paramName
            if (this.check(tokens_1.TokenType.LOCAL_VAR)) {
                const paramToken = this.advance();
                const paramName = paramToken.value.substring(1); // Remove !
                params.push({
                    type: 'Parameter',
                    name: paramName,
                    range: this.createRange(this.getTokenIndex(paramToken), this.getTokenIndex(paramToken))
                });
            }
            else {
                throw this.error(this.peek(), "Expected parameter name (e.g., !param)");
            }
            // Check for comma (more parameters)
            if (!this.check(tokens_1.TokenType.COMMA)) {
                break;
            }
            this.advance(); // consume comma
        } while (!this.isAtEnd());
        return params;
    }
    /**
     * Parse statement
     */
    parseStatement() {
        this.skipTrivia();
        if (this.isAtEnd())
            return null;
        // if statement
        if (this.check(tokens_1.TokenType.IF)) {
            return this.parseIfStatement();
        }
        // do loop
        if (this.check(tokens_1.TokenType.DO)) {
            return this.parseDoStatement();
        }
        // handle error
        if (this.check(tokens_1.TokenType.HANDLE)) {
            return this.parseHandleStatement();
        }
        // return
        if (this.check(tokens_1.TokenType.RETURN)) {
            return this.parseReturnStatement();
        }
        // break
        if (this.check(tokens_1.TokenType.BREAK)) {
            const token = this.advance();
            return {
                type: 'BreakStatement',
                range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
            };
        }
        // continue
        if (this.check(tokens_1.TokenType.CONTINUE)) {
            const token = this.advance();
            return {
                type: 'ContinueStatement',
                range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
            };
        }
        // Variable declaration or assignment
        if (this.check(tokens_1.TokenType.LOCAL_VAR) || this.check(tokens_1.TokenType.GLOBAL_VAR)) {
            return this.parseVariableDeclarationOrAssignment();
        }
        // Expression statement (method calls, etc.)
        return this.parseExpressionStatement();
    }
    /**
     * Parse if statement
     */
    parseIfStatement() {
        const startToken = this.consume(tokens_1.TokenType.IF, "Expected 'if'");
        // Condition (expression before 'then')
        const test = this.parseExpression();
        this.consume(tokens_1.TokenType.THEN, "Expected 'then' after if condition");
        // Consequent (if body)
        const consequent = [];
        while (!this.check(tokens_1.TokenType.ELSE) && !this.check(tokens_1.TokenType.ELSEIF) && !this.check(tokens_1.TokenType.ENDIF) && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                consequent.push(stmt);
            }
        }
        // Alternate (else/elseif)
        let alternate;
        if (this.check(tokens_1.TokenType.ELSEIF)) {
            // Recursive: elseif is another if statement
            alternate = this.parseIfStatement();
        }
        else if (this.check(tokens_1.TokenType.ELSE)) {
            this.advance(); // consume 'else'
            alternate = [];
            while (!this.check(tokens_1.TokenType.ENDIF) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    alternate.push(stmt);
                }
            }
        }
        const endToken = this.consume(tokens_1.TokenType.ENDIF, "Expected 'endif'");
        return {
            type: 'IfStatement',
            test,
            consequent,
            alternate,
            range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
        };
    }
    /**
     * Parse do statement
     */
    parseDoStatement() {
        const startToken = this.consume(tokens_1.TokenType.DO, "Expected 'do'");
        let variant = 'while';
        let variable;
        let collection;
        let from;
        let to;
        let condition;
        // Check variant
        if (this.check(tokens_1.TokenType.LOCAL_VAR)) {
            const varToken = this.advance();
            variable = {
                type: 'Identifier',
                name: varToken.value.substring(1),
                scope: 'local',
                range: this.createRange(this.getTokenIndex(varToken), this.getTokenIndex(varToken))
            };
            if (this.check(tokens_1.TokenType.VALUES)) {
                this.advance();
                variant = 'values';
                collection = this.parseExpression();
            }
            else if (this.check(tokens_1.TokenType.INDEX)) {
                this.advance();
                variant = 'index';
                collection = this.parseExpression();
            }
            else if (this.check(tokens_1.TokenType.FROM)) {
                this.advance();
                variant = 'from-to';
                from = this.parseExpression();
                this.consume(tokens_1.TokenType.TO, "Expected 'to' in do-from-to");
                to = this.parseExpression();
            }
        }
        else if (this.check(tokens_1.TokenType.WHILE)) {
            this.advance();
            variant = 'while';
            condition = this.parseExpression();
        }
        // Body
        const body = [];
        while (!this.check(tokens_1.TokenType.ENDDO) && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                body.push(stmt);
            }
        }
        const endToken = this.consume(tokens_1.TokenType.ENDDO, "Expected 'enddo'");
        return {
            type: 'DoStatement',
            variant,
            variable,
            collection,
            from,
            to,
            condition,
            body,
            range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
        };
    }
    /**
     * Parse handle statement
     */
    parseHandleStatement() {
        const startToken = this.consume(tokens_1.TokenType.HANDLE, "Expected 'handle'");
        // Error type (usually 'any')
        const errorTypeToken = this.advance();
        const errorType = errorTypeToken.value;
        // Body
        const body = [];
        while (!this.check(tokens_1.TokenType.ELSEHANDLE) && !this.check(tokens_1.TokenType.ENDHANDLE) && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                body.push(stmt);
            }
        }
        // Alternate (elsehandle)
        let alternate;
        if (this.check(tokens_1.TokenType.ELSEHANDLE)) {
            this.advance();
            alternate = [];
            while (!this.check(tokens_1.TokenType.ENDHANDLE) && !this.isAtEnd()) {
                const stmt = this.parseStatement();
                if (stmt) {
                    alternate.push(stmt);
                }
            }
        }
        const endToken = this.consume(tokens_1.TokenType.ENDHANDLE, "Expected 'endhandle'");
        return {
            type: 'HandleStatement',
            errorType,
            body,
            alternate,
            range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
        };
    }
    /**
     * Parse return statement
     */
    parseReturnStatement() {
        const token = this.consume(tokens_1.TokenType.RETURN, "Expected 'return'");
        // Check if there's a return value
        let argument;
        if (!this.isStatementEnd()) {
            argument = this.parseExpression();
        }
        return {
            type: 'ReturnStatement',
            argument,
            range: this.createRange(this.getTokenIndex(token), this.current - 1)
        };
    }
    /**
     * Parse variable declaration or assignment
     */
    parseVariableDeclarationOrAssignment() {
        const varToken = this.advance();
        const isGlobal = varToken.type === tokens_1.TokenType.GLOBAL_VAR;
        const varName = varToken.value.substring(isGlobal ? 2 : 1);
        // Check for assignment
        if (this.check(tokens_1.TokenType.ASSIGN)) {
            this.advance(); // consume =
            const initializer = this.parseExpression();
            const varDecl = {
                type: 'VariableDeclaration',
                name: varName,
                scope: isGlobal ? 'global' : 'local',
                initializer,
                range: this.createRange(this.getTokenIndex(varToken), this.current - 1)
            };
            return varDecl;
        }
        else {
            // Just a variable reference (expression statement)
            const identifier = {
                type: 'Identifier',
                name: varName,
                scope: isGlobal ? 'global' : 'local',
                range: this.createRange(this.getTokenIndex(varToken), this.getTokenIndex(varToken))
            };
            return {
                type: 'ExpressionStatement',
                expression: identifier,
                range: this.createRange(this.getTokenIndex(varToken), this.getTokenIndex(varToken))
            };
        }
    }
    /**
     * Parse expression statement
     */
    parseExpressionStatement() {
        const expr = this.parseExpression();
        if (!expr)
            return null;
        return {
            type: 'ExpressionStatement',
            expression: expr,
            range: expr.range
        };
    }
    /**
     * Parse expression (with operator precedence)
     */
    parseExpression() {
        return this.parseLogicalOr();
    }
    /**
     * Parse logical OR
     */
    parseLogicalOr() {
        let left = this.parseLogicalAnd();
        while (this.match(tokens_1.TokenType.OR)) {
            const operator = this.previous().value;
            const right = this.parseLogicalAnd();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                range: this.createRangeFromNodes(left, right)
            };
        }
        return left;
    }
    /**
     * Parse logical AND
     */
    parseLogicalAnd() {
        let left = this.parseEquality();
        while (this.match(tokens_1.TokenType.AND)) {
            const operator = this.previous().value;
            const right = this.parseEquality();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                range: this.createRangeFromNodes(left, right)
            };
        }
        return left;
    }
    /**
     * Parse equality (eq, ne)
     */
    parseEquality() {
        let left = this.parseComparison();
        while (this.match(tokens_1.TokenType.EQ, tokens_1.TokenType.NE)) {
            const operator = this.previous().value;
            const right = this.parseComparison();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                range: this.createRangeFromNodes(left, right)
            };
        }
        return left;
    }
    /**
     * Parse comparison (gt, lt, ge, le)
     */
    parseComparison() {
        let left = this.parseAddition();
        while (this.match(tokens_1.TokenType.GT, tokens_1.TokenType.LT, tokens_1.TokenType.GE, tokens_1.TokenType.LE)) {
            const operator = this.previous().value;
            const right = this.parseAddition();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                range: this.createRangeFromNodes(left, right)
            };
        }
        return left;
    }
    /**
     * Parse addition/subtraction
     */
    parseAddition() {
        let left = this.parseMultiplication();
        while (this.match(tokens_1.TokenType.PLUS, tokens_1.TokenType.MINUS)) {
            const operator = this.previous().value;
            const right = this.parseMultiplication();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                range: this.createRangeFromNodes(left, right)
            };
        }
        return left;
    }
    /**
     * Parse multiplication/division/mod
     */
    parseMultiplication() {
        let left = this.parsePower();
        while (this.match(tokens_1.TokenType.STAR, tokens_1.TokenType.SLASH, tokens_1.TokenType.MOD, tokens_1.TokenType.DIV)) {
            const operator = this.previous().value;
            const right = this.parsePower();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                range: this.createRangeFromNodes(left, right)
            };
        }
        return left;
    }
    /**
     * Parse power (**)
     */
    parsePower() {
        let left = this.parseUnary();
        while (this.match(tokens_1.TokenType.POWER)) {
            const operator = this.previous().value;
            const right = this.parseUnary();
            left = {
                type: 'BinaryExpression',
                operator,
                left,
                right,
                range: this.createRangeFromNodes(left, right)
            };
        }
        return left;
    }
    /**
     * Parse unary (not, -, +)
     */
    parseUnary() {
        if (this.match(tokens_1.TokenType.NOT, tokens_1.TokenType.MINUS, tokens_1.TokenType.PLUS)) {
            const operator = this.previous().value;
            const argument = this.parseUnary();
            return {
                type: 'UnaryExpression',
                operator,
                argument,
                prefix: true,
                range: this.createRange(this.current - 1, this.current)
            };
        }
        return this.parseCall();
    }
    /**
     * Parse call expression (.method() or object())
     */
    parseCall() {
        let expr = this.parseMember();
        // Check for function call: ()
        while (this.match(tokens_1.TokenType.LPAREN)) {
            const args = this.parseArguments();
            this.consume(tokens_1.TokenType.RPAREN, "Expected ')' after arguments");
            expr = {
                type: 'CallExpression',
                callee: expr,
                arguments: args,
                range: this.createRange(0, this.current - 1) // TODO: proper range
            };
        }
        return expr;
    }
    /**
     * Parse member expression (!var.method, !arr[index])
     */
    parseMember() {
        let expr = this.parsePrimary();
        while (true) {
            if (this.match(tokens_1.TokenType.DOT)) {
                // Member access: .property
                const property = this.consume(tokens_1.TokenType.METHOD, "Expected method name after '.'");
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: {
                        type: 'Identifier',
                        name: property.value.substring(1), // Remove leading dot
                        range: this.createRange(this.getTokenIndex(property), this.getTokenIndex(property))
                    },
                    computed: false,
                    range: this.createRange(0, this.current - 1)
                };
            }
            else if (this.match(tokens_1.TokenType.LBRACKET)) {
                // Array access: [index]
                const index = this.parseExpression();
                this.consume(tokens_1.TokenType.RBRACKET, "Expected ']' after array index");
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: {
                        type: 'Identifier',
                        name: 'index',
                        range: this.createRange(0, 0)
                    },
                    computed: true,
                    range: this.createRange(0, this.current - 1)
                };
            }
            else {
                break;
            }
        }
        return expr;
    }
    /**
     * Parse primary expression (literals, variables, etc.)
     */
    parsePrimary() {
        // String literal
        if (this.match(tokens_1.TokenType.STRING)) {
            const token = this.previous();
            return {
                type: 'Literal',
                value: token.value,
                literalType: 'string',
                pmlType: (0, nodes_1.createStringType)(),
                range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
            };
        }
        // Number literal
        if (this.match(tokens_1.TokenType.NUMBER)) {
            const token = this.previous();
            return {
                type: 'Literal',
                value: parseFloat(token.value),
                literalType: 'number',
                pmlType: (0, nodes_1.createRealType)(),
                range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
            };
        }
        // Boolean literal
        if (this.match(tokens_1.TokenType.BOOLEAN)) {
            const token = this.previous();
            return {
                type: 'Literal',
                value: token.value.toLowerCase() === 'true',
                literalType: 'boolean',
                pmlType: (0, nodes_1.createBooleanType)(),
                range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
            };
        }
        // Variable
        if (this.match(tokens_1.TokenType.LOCAL_VAR, tokens_1.TokenType.GLOBAL_VAR)) {
            const token = this.previous();
            const isGlobal = token.type === tokens_1.TokenType.GLOBAL_VAR;
            return {
                type: 'Identifier',
                name: token.value.substring(isGlobal ? 2 : 1),
                scope: isGlobal ? 'global' : 'local',
                range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
            };
        }
        // Method call (starts with dot)
        if (this.match(tokens_1.TokenType.METHOD)) {
            const token = this.previous();
            return {
                type: 'Identifier',
                name: token.value.substring(1),
                scope: 'method',
                range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
            };
        }
        // Type constructors (STRING(), ARRAY(), etc.)
        if (this.match(tokens_1.TokenType.STRING_TYPE, tokens_1.TokenType.REAL_TYPE, tokens_1.TokenType.INTEGER_TYPE, tokens_1.TokenType.BOOLEAN_TYPE, tokens_1.TokenType.ARRAY_TYPE, tokens_1.TokenType.DBREF_TYPE, tokens_1.TokenType.ANY_TYPE)) {
            const token = this.previous();
            return {
                type: 'Identifier',
                name: token.value,
                range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
            };
        }
        // Identifier
        if (this.match(tokens_1.TokenType.IDENTIFIER)) {
            const token = this.previous();
            return {
                type: 'Identifier',
                name: token.value,
                range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
            };
        }
        // Grouping: (expression)
        if (this.match(tokens_1.TokenType.LPAREN)) {
            const expr = this.parseExpression();
            this.consume(tokens_1.TokenType.RPAREN, "Expected ')' after expression");
            return expr;
        }
        throw this.error(this.peek(), "Expected expression");
    }
    /**
     * Parse function call arguments
     */
    parseArguments() {
        const args = [];
        if (this.check(tokens_1.TokenType.RPAREN)) {
            return args; // No arguments
        }
        do {
            args.push(this.parseExpression());
        } while (this.match(tokens_1.TokenType.COMMA));
        return args;
    }
    /**
     * Parse JSDoc documentation from preceding comments
     * TODO: Implement comment tracking in lexer
     */
    parsePrecedingDocumentation() {
        // For now, return undefined
        // Will be implemented when we add comment tracking
        return undefined;
    }
    /**
     * Helper methods
     */
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    isAtEnd() {
        return this.peek().type === tokens_1.TokenType.EOF;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    consume(type, message) {
        if (this.check(type))
            return this.advance();
        throw this.error(this.peek(), message);
    }
    error(token, message) {
        const error = new ParseError(message, token);
        this.errors.push(error);
        return error;
    }
    synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            // Sync on statement boundaries
            if (this.previous().type === tokens_1.TokenType.NEWLINE)
                return;
            switch (this.peek().type) {
                case tokens_1.TokenType.DEFINE:
                case tokens_1.TokenType.IF:
                case tokens_1.TokenType.DO:
                case tokens_1.TokenType.RETURN:
                case tokens_1.TokenType.HANDLE:
                    return;
            }
            this.advance();
        }
    }
    skipTrivia() {
        // Skip whitespace/comments (already handled by lexer)
        // This is a placeholder for future enhancements
    }
    isStatementEnd() {
        return this.check(tokens_1.TokenType.NEWLINE) || this.isAtEnd();
    }
    getTokenIndex(token) {
        return this.tokens.indexOf(token);
    }
    createRange(startIdx, endIdx) {
        const start = this.tokens[startIdx] || this.tokens[0];
        const end = this.tokens[endIdx] || this.tokens[this.tokens.length - 1];
        return {
            start: { line: start.line - 1, character: start.column - 1 },
            end: { line: end.line - 1, character: end.column + end.length }
        };
    }
    createRangeFromNodes(start, end) {
        return {
            start: start.range.start,
            end: end.range.end
        };
    }
}
exports.Parser = Parser;
/**
 * Parse error
 */
class ParseError extends Error {
    constructor(message, token) {
        super(message);
        this.token = token;
        this.name = 'ParseError';
    }
}
exports.ParseError = ParseError;
//# sourceMappingURL=parser.js.map