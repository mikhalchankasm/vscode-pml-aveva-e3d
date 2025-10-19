/**
 * Parser Tests
 * Test suite for PML parser
 */

import { describe, it, expect } from 'vitest';
import { Parser } from '../parser';
import { MethodDefinition, VariableDeclaration, IfStatement, DoStatement } from '../../ast/nodes';

describe('PML Parser', () => {
	describe('Method Definitions', () => {
		it('should parse simple method without parameters', () => {
			const source = `
define method .myMethod()
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(1);

			const method = result.ast.body[0] as MethodDefinition;
			expect(method.type).toBe('MethodDefinition');
			expect(method.name).toBe('myMethod');
			expect(method.parameters).toHaveLength(0);
			expect(method.body).toHaveLength(0);
		});

		it('should parse method with parameters', () => {
			const source = `
define method .calculate(!x, !y, !z)
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const method = result.ast.body[0] as MethodDefinition;
			expect(method.name).toBe('calculate');
			expect(method.parameters).toHaveLength(3);
			expect(method.parameters[0].name).toBe('x');
			expect(method.parameters[1].name).toBe('y');
			expect(method.parameters[2].name).toBe('z');
		});

		it('should parse method with body', () => {
			const source = `
define method .test()
	!var = 123
	return !var
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const method = result.ast.body[0] as MethodDefinition;
			expect(method.body).toHaveLength(2);
			expect(method.body[0].type).toBe('VariableDeclaration');
			expect(method.body[1].type).toBe('ReturnStatement');
		});
	});

	describe('Variable Declarations', () => {
		it('should parse local variable declaration', () => {
			const source = '!var = 42';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(1);

			const varDecl = result.ast.body[0] as VariableDeclaration;
			expect(varDecl.type).toBe('VariableDeclaration');
			expect(varDecl.name).toBe('var');
			expect(varDecl.scope).toBe('local');
		});

		it('should parse global variable declaration', () => {
			const source = '!!globalVar = |hello|';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const varDecl = result.ast.body[0] as VariableDeclaration;
			expect(varDecl.type).toBe('VariableDeclaration');
			expect(varDecl.name).toBe('globalVar');
			expect(varDecl.scope).toBe('global');
		});

		it('should parse variable with string literal', () => {
			const source = '!str = |test string|';

			const parser = new Parser();
			const result = parser.parse(source);

			const varDecl = result.ast.body[0] as VariableDeclaration;
			expect(varDecl.initializer?.type).toBe('Literal');
		});

		it('should parse variable with number literal', () => {
			const source = '!num = 3.14';

			const parser = new Parser();
			const result = parser.parse(source);

			const varDecl = result.ast.body[0] as VariableDeclaration;
			expect(varDecl.initializer?.type).toBe('Literal');
		});
	});

	describe('Expressions', () => {
		it('should parse binary expression', () => {
			const source = '!result = !a + !b';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const varDecl = result.ast.body[0] as VariableDeclaration;
			expect(varDecl.initializer?.type).toBe('BinaryExpression');
		});

		it('should parse method call', () => {
			const source = '!result = .myMethod()';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const varDecl = result.ast.body[0] as VariableDeclaration;
			expect(varDecl.initializer?.type).toBe('CallExpression');
		});

		it('should parse member expression', () => {
			const source = '!result = !str.upcase()';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const varDecl = result.ast.body[0] as VariableDeclaration;
			expect(varDecl.initializer?.type).toBe('CallExpression');
		});

		it('should parse array access', () => {
			const source = '!item = !array[1]';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const varDecl = result.ast.body[0] as VariableDeclaration;
			expect(varDecl.initializer?.type).toBe('MemberExpression');
		});
	});

	describe('Control Flow', () => {
		it('should parse if statement', () => {
			const source = `
if (!x gt 0) then
	!result = |positive|
endif
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const ifStmt = result.ast.body[0] as IfStatement;
			expect(ifStmt.type).toBe('IfStatement');
			expect(ifStmt.test.type).toBe('BinaryExpression');
			expect(ifStmt.consequent).toHaveLength(1);
		});

		it('should parse if-else statement', () => {
			const source = `
if (!x gt 0) then
	!result = |positive|
else
	!result = |negative|
endif
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const ifStmt = result.ast.body[0] as IfStatement;
			expect(ifStmt.type).toBe('IfStatement');
			expect(ifStmt.consequent).toHaveLength(1);
			expect(Array.isArray(ifStmt.alternate)).toBe(true);
			expect((ifStmt.alternate as any[]).length).toBe(1);
		});

		it('should parse if-elseif-else statement', () => {
			const source = `
if (!x gt 0) then
	!result = |positive|
elseif (!x lt 0) then
	!result = |negative|
else
	!result = |zero|
endif
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const ifStmt = result.ast.body[0] as IfStatement;
			expect(ifStmt.type).toBe('IfStatement');
			expect(ifStmt.alternate).toBeDefined();
			expect((ifStmt.alternate as IfStatement).type).toBe('IfStatement');
		});

		it('should parse do values loop', () => {
			const source = `
do !item values !list
	!sum = !sum + !item
enddo
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const doStmt = result.ast.body[0] as DoStatement;
			expect(doStmt.type).toBe('DoStatement');
			expect(doStmt.variant).toBe('values');
			expect(doStmt.variable).toBeDefined();
			expect(doStmt.body).toHaveLength(1);
		});

		it('should parse do from-to loop', () => {
			const source = `
do !i from 1 to 10
	!sum = !sum + !i
enddo
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const doStmt = result.ast.body[0] as DoStatement;
			expect(doStmt.type).toBe('DoStatement');
			expect(doStmt.variant).toBe('from-to');
			expect(doStmt.from).toBeDefined();
			expect(doStmt.to).toBeDefined();
		});
	});

	describe('Error Recovery', () => {
		it('should recover from unclosed method', () => {
			const source = `
define method .test()
	!var = 123
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			// Should have errors but not crash
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.ast).toBeDefined();
		});

		it('should recover from missing parameters', () => {
			const source = `
define method .test
	!var = 123
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			// Should have errors but not crash
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.ast).toBeDefined();
		});
	});

	describe('Complex Scenarios', () => {
		it('should parse complete method with logic', () => {
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

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(1);

			const method = result.ast.body[0] as MethodDefinition;
			expect(method.name).toBe('calculateSum');
			expect(method.parameters).toHaveLength(1);
			expect(method.body).toHaveLength(3); // var decl, do loop, return
		});

		it('should parse multiple methods', () => {
			const source = `
define method .method1()
	!x = 1
endmethod

define method .method2()
	!y = 2
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(2);
			expect((result.ast.body[0] as MethodDefinition).name).toBe('method1');
			expect((result.ast.body[1] as MethodDefinition).name).toBe('method2');
		});
	});
});
