"use strict";
/**
 * Parser Tests
 * Test suite for PML parser
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const parser_1 = require("../parser");
(0, vitest_1.describe)('PML Parser', () => {
    (0, vitest_1.describe)('Method Definitions', () => {
        (0, vitest_1.it)('should parse simple method without parameters', () => {
            const source = `
define method .myMethod()
endmethod
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.ast.body).toHaveLength(1);
            const method = result.ast.body[0];
            (0, vitest_1.expect)(method.type).toBe('MethodDefinition');
            (0, vitest_1.expect)(method.name).toBe('myMethod');
            (0, vitest_1.expect)(method.parameters).toHaveLength(0);
            (0, vitest_1.expect)(method.body).toHaveLength(0);
        });
        (0, vitest_1.it)('should parse method with parameters', () => {
            const source = `
define method .calculate(!x, !y, !z)
endmethod
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const method = result.ast.body[0];
            (0, vitest_1.expect)(method.name).toBe('calculate');
            (0, vitest_1.expect)(method.parameters).toHaveLength(3);
            (0, vitest_1.expect)(method.parameters[0].name).toBe('x');
            (0, vitest_1.expect)(method.parameters[1].name).toBe('y');
            (0, vitest_1.expect)(method.parameters[2].name).toBe('z');
        });
        (0, vitest_1.it)('should parse method with body', () => {
            const source = `
define method .test()
	!var = 123
	return !var
endmethod
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const method = result.ast.body[0];
            (0, vitest_1.expect)(method.body).toHaveLength(2);
            (0, vitest_1.expect)(method.body[0].type).toBe('VariableDeclaration');
            (0, vitest_1.expect)(method.body[1].type).toBe('ReturnStatement');
        });
    });
    (0, vitest_1.describe)('Variable Declarations', () => {
        (0, vitest_1.it)('should parse local variable declaration', () => {
            const source = '!var = 42';
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.ast.body).toHaveLength(1);
            const varDecl = result.ast.body[0];
            (0, vitest_1.expect)(varDecl.type).toBe('VariableDeclaration');
            (0, vitest_1.expect)(varDecl.name).toBe('var');
            (0, vitest_1.expect)(varDecl.scope).toBe('local');
        });
        (0, vitest_1.it)('should parse global variable declaration', () => {
            const source = '!!globalVar = |hello|';
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const varDecl = result.ast.body[0];
            (0, vitest_1.expect)(varDecl.type).toBe('VariableDeclaration');
            (0, vitest_1.expect)(varDecl.name).toBe('globalVar');
            (0, vitest_1.expect)(varDecl.scope).toBe('global');
        });
        (0, vitest_1.it)('should parse variable with string literal', () => {
            const source = '!str = |test string|';
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            const varDecl = result.ast.body[0];
            (0, vitest_1.expect)(varDecl.initializer?.type).toBe('Literal');
        });
        (0, vitest_1.it)('should parse variable with number literal', () => {
            const source = '!num = 3.14';
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            const varDecl = result.ast.body[0];
            (0, vitest_1.expect)(varDecl.initializer?.type).toBe('Literal');
        });
    });
    (0, vitest_1.describe)('Expressions', () => {
        (0, vitest_1.it)('should parse binary expression', () => {
            const source = '!result = !a + !b';
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const varDecl = result.ast.body[0];
            (0, vitest_1.expect)(varDecl.initializer?.type).toBe('BinaryExpression');
        });
        (0, vitest_1.it)('should parse method call', () => {
            const source = '!result = .myMethod()';
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const varDecl = result.ast.body[0];
            (0, vitest_1.expect)(varDecl.initializer?.type).toBe('CallExpression');
        });
        (0, vitest_1.it)('should parse member expression', () => {
            const source = '!result = !str.upcase()';
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const varDecl = result.ast.body[0];
            (0, vitest_1.expect)(varDecl.initializer?.type).toBe('CallExpression');
        });
        (0, vitest_1.it)('should parse array access', () => {
            const source = '!item = !array[1]';
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const varDecl = result.ast.body[0];
            (0, vitest_1.expect)(varDecl.initializer?.type).toBe('MemberExpression');
        });
    });
    (0, vitest_1.describe)('Control Flow', () => {
        (0, vitest_1.it)('should parse if statement', () => {
            const source = `
if (!x gt 0) then
	!result = |positive|
endif
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const ifStmt = result.ast.body[0];
            (0, vitest_1.expect)(ifStmt.type).toBe('IfStatement');
            (0, vitest_1.expect)(ifStmt.test.type).toBe('BinaryExpression');
            (0, vitest_1.expect)(ifStmt.consequent).toHaveLength(1);
        });
        (0, vitest_1.it)('should parse if-else statement', () => {
            const source = `
if (!x gt 0) then
	!result = |positive|
else
	!result = |negative|
endif
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const ifStmt = result.ast.body[0];
            (0, vitest_1.expect)(ifStmt.type).toBe('IfStatement');
            (0, vitest_1.expect)(ifStmt.consequent).toHaveLength(1);
            (0, vitest_1.expect)(Array.isArray(ifStmt.alternate)).toBe(true);
            (0, vitest_1.expect)(ifStmt.alternate.length).toBe(1);
        });
        (0, vitest_1.it)('should parse if-elseif-else statement', () => {
            const source = `
if (!x gt 0) then
	!result = |positive|
elseif (!x lt 0) then
	!result = |negative|
else
	!result = |zero|
endif
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const ifStmt = result.ast.body[0];
            (0, vitest_1.expect)(ifStmt.type).toBe('IfStatement');
            (0, vitest_1.expect)(ifStmt.alternate).toBeDefined();
            (0, vitest_1.expect)(ifStmt.alternate.type).toBe('IfStatement');
        });
        (0, vitest_1.it)('should parse do values loop', () => {
            const source = `
do !item values !list
	!sum = !sum + !item
enddo
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const doStmt = result.ast.body[0];
            (0, vitest_1.expect)(doStmt.type).toBe('DoStatement');
            (0, vitest_1.expect)(doStmt.variant).toBe('values');
            (0, vitest_1.expect)(doStmt.variable).toBeDefined();
            (0, vitest_1.expect)(doStmt.body).toHaveLength(1);
        });
        (0, vitest_1.it)('should parse do from-to loop', () => {
            const source = `
do !i from 1 to 10
	!sum = !sum + !i
enddo
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            const doStmt = result.ast.body[0];
            (0, vitest_1.expect)(doStmt.type).toBe('DoStatement');
            (0, vitest_1.expect)(doStmt.variant).toBe('from-to');
            (0, vitest_1.expect)(doStmt.from).toBeDefined();
            (0, vitest_1.expect)(doStmt.to).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Error Recovery', () => {
        (0, vitest_1.it)('should recover from unclosed method', () => {
            const source = `
define method .test()
	!var = 123
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            // Should have errors but not crash
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.ast).toBeDefined();
        });
        (0, vitest_1.it)('should recover from missing parameters', () => {
            const source = `
define method .test
	!var = 123
endmethod
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            // Should have errors but not crash
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.ast).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Complex Scenarios', () => {
        (0, vitest_1.it)('should parse complete method with logic', () => {
            const source = `
define method .calculateSum(!numbers)
	!sum = 0
	do !num values !numbers
		if (!num gt 0) then
			!sum = !sum + !num
		endif
	enddo
	return !sum
endmethod
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.ast.body).toHaveLength(1);
            const method = result.ast.body[0];
            (0, vitest_1.expect)(method.name).toBe('calculateSum');
            (0, vitest_1.expect)(method.parameters).toHaveLength(1);
            (0, vitest_1.expect)(method.body).toHaveLength(3); // var decl, do loop, return
        });
        (0, vitest_1.it)('should parse multiple methods', () => {
            const source = `
define method .method1()
	!x = 1
endmethod

define method .method2()
	!y = 2
endmethod
			`.trim();
            const parser = new parser_1.Parser();
            const result = parser.parse(source);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
            (0, vitest_1.expect)(result.ast.body).toHaveLength(2);
            (0, vitest_1.expect)(result.ast.body[0].name).toBe('method1');
            (0, vitest_1.expect)(result.ast.body[1].name).toBe('method2');
        });
    });
});
//# sourceMappingURL=parser.test.js.map