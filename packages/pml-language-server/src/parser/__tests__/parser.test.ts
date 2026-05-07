/**
 * Parser Tests
 * Test suite for PML parser
 */

import { describe, it, expect } from 'vitest';
import { Parser } from '../parser';
import {
	MethodDefinition,
	FunctionDefinition,
	VariableDeclaration,
	IfStatement,
	DoStatement,
	FormDefinition,
	GadgetDeclaration,
	MemberDeclaration,
	ExpressionStatement,
	Identifier
} from '../../ast/nodes';

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

	describe('Function Definitions', () => {
		it('should parse global function definitions with typed parameters', () => {
			const source = `
define function !!proreport(!inlist is any, !folder is string)
	$!site
	do !item values !inlist
		!target = $!site
	enddo
endfunction
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(1);

			const func = result.ast.body[0] as FunctionDefinition;
			expect(func.type).toBe('FunctionDefinition');
			expect(func.name).toBe('proreport');
			expect(func.parameters).toHaveLength(2);
			expect(func.parameters[0].name).toBe('inlist');
			expect(func.parameters[0].paramType?.kind).toBe('ANY');
			expect(func.parameters[1].name).toBe('folder');
			expect(func.parameters[1].paramType?.kind).toBe('STRING');
			expect(func.body).toHaveLength(2);
			expect(func.body[1].type).toBe('DoStatement');
		});

		it('should parse PML attributes, concatenation, and print commands inside functions', () => {
			const source = `
define function !!proreport(!inlist is any, !folder is string)
	!csvFolder = !folder & '\\'
	do !j index !sites
		!site = !sites[!j]
		$!site
		!t[1] = :Шифр_комплекта_РД of $!site
		var !alltubi collect all tubi for bran
		!filename = object file(!csvFolder & !!generatefilename(namn of $!site) & '.csv')
		$P выгружено: $!j из $!size $!!CE.NAME
	enddo
endfunction
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(1);

			const func = result.ast.body[0] as FunctionDefinition;
			expect(func.type).toBe('FunctionDefinition');
			expect(func.body.some(statement => statement.type === 'DoStatement')).toBe(true);
		});

		it('should parse DB paths, line commands, and empty global function calls in export functions', () => {
			const source = `
define function !!exportifczones()
	GETWORK
	trace off
	!zones = array()
	!zones[1] = /240000-АС14_Фр1
	do !i index !zones
		!zone = !zones[!i]
		$!zone
		unlock all
		EXPORT AUTOCOLOUR REMOVE $!i
		!exporter.setTolerance(1mm)
		!!autoColourgnp()
	enddo
endfunction
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(1);

			const func = result.ast.body[0] as FunctionDefinition;
			expect(func.type).toBe('FunctionDefinition');
			expect(func.body.some(statement => statement.type === 'DoStatement')).toBe(true);
		});

		it('should parse bare return without consuming the next statement', () => {
			const source = `
define function !!earlyExit()
	return
	!after = 1
endfunction
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const func = result.ast.body[0] as FunctionDefinition;
			expect(func.body).toHaveLength(2);
			expect(func.body[0].type).toBe('ReturnStatement');
			expect(func.body[1].type).toBe('VariableDeclaration');
		});

		it('should ignore PML block comments between dollar parens', () => {
			const source = `
define function !!commented()
$(
	this is not valid pml /
	return )
$)
	!after = 1
endfunction
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const func = result.ast.body[0] as FunctionDefinition;
			expect(func.body).toHaveLength(1);
			expect(func.body[0].type).toBe('VariableDeclaration');
		});
	});

	describe('Form Definitions', () => {
		it('should parse combo gadgets and track callbacks in forms', () => {
			const source = `
setup form !!TestForm dialog
	member .title is string
	combo .mode |Mode| at x5 width 18 tooltip |Pick a mode|
	track |DESICE| call |!this.onTrack()|
exit
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(1);

			const form = result.ast.body[0] as FormDefinition;
			expect(form.type).toBe('FormDefinition');
			expect(form.name).toBe('!!TestForm');
			expect(form.formType).toBe('DIALOG');
			expect(form.members).toHaveLength(1);
			expect((form.members[0] as MemberDeclaration).memberType.kind).toBe('STRING');
			expect(form.callbacks.DESICE).toBe('!this.onTrack()');

			const combo = form.body.find(
				(statement): statement is GadgetDeclaration =>
					statement.type === 'GadgetDeclaration' && statement.gadgetType === 'combo'
			);
			expect(combo).toBeDefined();
			expect(combo?.name).toBe('mode');
			expect(combo?.label).toBe('Mode');
			expect(combo?.position).toBe(5);
			expect(combo?.width).toBe(18);
			expect(combo?.properties.tooltip).toBe('Pick a mode');
		});

		it('should parse uppercase type keyword tokens in member declarations', () => {
			const source = `
setup form !!TestForm
	member .count is INTEGER
exit
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const form = result.ast.body[0] as FormDefinition;
			expect(form.members[0].memberType.kind).toBe('INTEGER');
		});

		it('should keep gadget modifiers scoped to the declaration line', () => {
			const source = `
setup form !!TestForm
	combo .mode |Mode| at x5
	tooltip |Form tooltip|
	button .apply |Apply| pixmap /apply.png callback !this.apply()
exit
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const form = result.ast.body[0] as FormDefinition;
			const gadgets = form.body.filter(
				(statement): statement is GadgetDeclaration => statement.type === 'GadgetDeclaration'
			);

			expect(gadgets).toHaveLength(2);
			expect(gadgets[0].name).toBe('mode');
			expect(gadgets[0].properties.tooltip).toBeUndefined();
			expect(gadgets[1].name).toBe('apply');
			expect(gadgets[1].properties.pixmap).toBe('/apply.png');
			expect(gadgets[1].properties.call).toBe('!this.apply()');
		});

		it('should preserve inline width precedence and parse same-line modifiers in any order', () => {
			const source = `
setup form !!TestForm
	text .name 18 width 20
	combo .mode |Mode| wid 12 hei 4 at x5 tooltip |Pick a mode|
	combo .empty at x8 width 18
exit
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const form = result.ast.body[0] as FormDefinition;
			const gadgets = form.body.filter(
				(statement): statement is GadgetDeclaration => statement.type === 'GadgetDeclaration'
			);

			expect(gadgets[0].name).toBe('name');
			expect(gadgets[0].width).toBe(18);
			expect(gadgets[1].name).toBe('mode');
			expect(gadgets[1].width).toBe(12);
			expect(gadgets[1].position).toBe(5);
			expect(gadgets[1].properties.height).toBe(4);
			expect(gadgets[1].properties.tooltip).toBe('Pick a mode');
			expect(gadgets[2].name).toBe('empty');
			expect(gadgets[2].label).toBeUndefined();
			expect(gadgets[2].position).toBe(8);
			expect(gadgets[2].width).toBe(18);
		});

		it('should parse multiple track callbacks with and without call keyword', () => {
			const source = `
setup form !!TestForm
	track |SEL| call |!this.select()| at x10
	track |EVT| |!this.event()|
exit
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const form = result.ast.body[0] as FormDefinition;
			expect(form.callbacks).toEqual({
				SEL: '!this.select()',
				EVT: '!this.event()'
			});
		});

		it('should parse empty forms and custom member types', () => {
			const emptyResult = new Parser().parse('setup form !!Empty exit');
			expect(emptyResult.errors).toHaveLength(0);

			const emptyForm = emptyResult.ast.body[0] as FormDefinition;
			expect(emptyForm.body).toHaveLength(0);
			expect(emptyForm.members).toHaveLength(0);
			expect(emptyForm.callbacks).toEqual({});

			const customTypeResult = new Parser().parse(`
setup form !!Typed
	member .ref is MyCustomType
exit
			`.trim());
			expect(customTypeResult.errors).toHaveLength(0);

			const typedForm = customTypeResult.ast.body[0] as FormDefinition;
			expect(typedForm.members[0].memberType.kind).toBe('ANY');
		});
	});

	describe('Expressions', () => {
		it('should parse variable substitution as an expression', () => {
			const source = '$!site';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(1);

			const statement = result.ast.body[0] as ExpressionStatement;
			const identifier = statement.expression as Identifier;
			expect(statement.type).toBe('ExpressionStatement');
			expect(identifier.type).toBe('Identifier');
			expect(identifier.name).toBe('$!site');
		});

		it('should parse variable substitution as an assignment value', () => {
			const source = '!target = $!site';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const varDecl = result.ast.body[0] as VariableDeclaration;
			const initializer = varDecl.initializer as Identifier;
			expect(varDecl.type).toBe('VariableDeclaration');
			expect(initializer.type).toBe('Identifier');
			expect(initializer.name).toBe('$!site');
		});

		it('should report incomplete variable substitution', () => {
			const source = '$!';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors.length).toBeGreaterThan(0);
		});

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
