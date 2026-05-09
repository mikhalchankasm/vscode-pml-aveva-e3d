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
	Identifier,
	CallExpression
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
	ADD CE
	MOVE N45E DIST 1500
	Q REPRES
	BY ID@ IDP@
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

		it('should keep whitelisted command starters parseable as calls', () => {
			const source = 'add(1, 2)';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(1);

			const statement = result.ast.body[0] as ExpressionStatement;
			const call = statement.expression as CallExpression;
			const callee = call.callee as Identifier;

			expect(call.type).toBe('CallExpression');
			expect(callee.name).toBe('add');
			expect(call.arguments).toHaveLength(2);
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

		it('should parse nested frames and numeric handle headers used by form imports', () => {
			const source = `
import |GridControl|
handle (1000,0)
endhandle

setup form !!NestedForm dialog resize
	frame .tabs tabset at xmin form ymax form
		frame .inner |Inner| at xmin ymin
			button .ok |OK| at x0 ymin
		exit
	exit
exit
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body.some(statement => statement.type === 'FormDefinition')).toBe(true);
		});

		it('should parse container, menu, para, and paragraph gadgets in forms', () => {
			const source = `
setup form !!AdvancedForm dialog
	frame .gridFrame |Grid|
		container .gridFramePipe nobox PMLNETCONTROL |TablePipe| at xmin.gridFrame + 0.25 wid 78 hei 13
	exit
	menu .menuPopup popup
	para .lock anchor right + top text |Lock|
	paragraph .offsetTag text |Offset|
exit
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const form = result.ast.body[0] as FormDefinition;
			const gadgets = form.body.filter(
				(statement): statement is GadgetDeclaration => statement.type === 'GadgetDeclaration'
			);

			expect(form.frames[0].gadgets[0].gadgetType).toBe('container');
			expect(form.frames[0].gadgets[0].properties.nobox).toBe(true);
			expect(form.frames[0].gadgets[0].properties.controlType).toBe('PMLNETCONTROL');
			expect(gadgets.map(gadget => gadget.gadgetType)).toEqual(['menu', 'para', 'paragraph']);
			expect(gadgets[0].properties.popup).toBe(true);
		});

		it('should parse using namespace as a command-style statement', () => {
			const source = `
define method .firstShown()
	using namespace |Aveva.Pdms.Presentation|
	!this.grid.BindToDataSource(!nds)
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
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

		it('should parse form member assignments and extract callback bindings', () => {
			const source = `
setup form !!CallbackForm dialog resize
	!this.iconTitle = 'Position CE'
	!this.callback = '!this.init()'
	!this.Quitcall = '!this.quit()'
	!this.wrt.callback = |!this.changeWrt(|
exit
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const form = result.ast.body[0] as FormDefinition;
			expect(form.callbacks['this.callback']).toBe('!this.init()');
			expect(form.callbacks['this.Quitcall']).toBe('!this.quit()');
			expect(form.callbacks['this.wrt.callback']).toBe('!this.changeWrt(');
		});

		it('should not extract unrelated form assignments that merely contain call', () => {
			const source = `
setup form !!CallbackForm
	!this.recall = '!this.notCallback()'
	!this.callRegistry = '!this.notCallbackEither()'
exit
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);

			const form = result.ast.body[0] as FormDefinition;
			expect(form.callbacks).toEqual({});
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

		it('should parse angle-bracket variable substitution', () => {
			const source = '!target = $!<this.name>';

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
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

		it('should parse member access after method calls in PML chains', () => {
			const source = `
define method .trackce()
	if ( !this.link.Unset().Not() ) then
		!cepos = !!ce.Position.Wrt(!this.link)
	endif
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(1);
		});

		it('should recover from draft member access that ends after a dot', () => {
			const source = `
!draft.
!after = 1
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(2);
		});

		it('should parse PML attribute member access and inset comparisons', () => {
			const source = `
define method .check()
	!locList.Append(!pipeRef.:IsoDrNo)
	if (!!ce.own.type inset ( |CABLE|, |RPATH|)) then
		CABLE
	endif
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
		});

		it('should keep pipe-string substitution fragments inside call arguments', () => {
			const source = `
define method .collect()
	!coll = !!collectallfor(|pipe|, |matchwild(:IsoDrNo, |$!fileName|)|, world)
	!collDr = !!collectallfor(|pipe|, |:IsoDrNo eq |$!dr||, world)
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
		});

		it('should parse do-to loops and claim command lines used by form exports', () => {
			const source = `
define method .export()
	claim all from !claimList
	options default
	do !plot to $!isoCount
		var !plotFile isodraw plotfile $!plot filename
	enddo
	exit
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
		});

		it('should parse setup command files', () => {
			const source = `
setup command !!myCommand

exit

define method .myCommand()
	!this.key = 'Example.Command'
	!this.execute = 'execute'
endmethod

define method .execute(!args is ARRAY)
	call !!doSomething(!!ce)
	goto frstw DESI
	pml load form !!myForm
	show !!myForm at xr0.2 yr0.14
	kill !!myForm
	$M "%PMLLIB%/limbo/functions/moduleswitch.pmlfnc" $<EXIT$>
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
			expect(result.ast.body).toHaveLength(3);
			expect(result.ast.body[1].type).toBe('MethodDefinition');
		});

		it('should parse indices loops and indexed property assignments from command controllers', () => {
			const source = `
define method .collectApplications()
	!this.applicationList = !!appCntrl.getApplicationList(true)
	!this.applicationTitles = ARRAY()
	do !index indices !this.applicationList
		!this.applicationTitles[!index] = !!appCntrl.getApplic(!this.applicationList[!index]).title
	enddo
	!this.viewDirection[1] = 'SW'
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
		});

		it('should parse AVEVA command controller idioms from shipped PMLLIB files', () => {
			const source = `
define method .execute(!args is ARRAY)
	$T8+
	system sgl /effect_ao off
	!!gphViewOpt.edges = false
	MAP BUILD MDB
	handle (69,97)
		!!alert.message('Spatial map build complete')
	elsehandle any
		!!alert.warning('Spatial map build failed')
	elsehandle none
		!!alert.message('Spatial map build complete')
	endhandle
	world
	!graphicalView.owner().clipBox.set()
	!!fmSys.loadForm('mdsAlignSupport').alignSupports()
	!!gphViews.limits(!graphicalView, /* )
	ORI Z IS TOWARDS $!elementEnd
	$T8-
endmethod

define method .continued(!data is ANY, $
                         !element is DBREF)
	if ((!!ce.type eq 'WORL') or $
	    (!!ce.parent.list.findFirst('XGEOM').unset())) then
		UNENHANCE ALL GRIDPLANE
	endif
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
		});

		it('should parse define calls and dynamic substitute member access in forms', () => {
			const source = `
define method .check()
	if (define(!!isopipelist) and !!isopipelist.shown()) then
		!!isopipelist.hide()
	endif
	!this.$!<name>.EditableGrid(false)
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
		});

		it('should recover nested pipe text fragments with non-ascii text in arguments', () => {
			const source = `
define method .saveSettings()
	!add1 = iftrue(!this.togRev.Val, |!!report.bnIso.Tag = |Изометрия+R||, |!!report.bnIso.Tag = |Изометрия||)
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
		});

		it('should report malformed setup command controllers instead of swallowing the file', () => {
			const source = `
setup command !!brokenController
	garbage tokens here
	unclosed
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors.some(error => error.message.includes("Expected 'exit' or 'define'"))).toBe(true);
		});

		it('should keep trace controls narrow and reject malformed line commands with assignment', () => {
			const parser = new Parser();

			expect(parser.parse('$T8+').errors).toHaveLength(0);
			expect(parser.parse('!x = $T8').errors).toHaveLength(0);
			expect(parser.parse('$T8 = 5').errors.length).toBeGreaterThan(0);
			expect(parser.parse('goto target =').errors.length).toBeGreaterThan(0);
		});

		it('should still report broken indexed assignments and chained calls', () => {
			const parser = new Parser();

			expect(parser.parse('!this.values[ = 1').errors.length).toBeGreaterThan(0);
			expect(parser.parse('!this.owner().clipBox.set(').errors.length).toBeGreaterThan(0);
		});

		it('should parse function return types and PML1 wildcard path arguments from real library patterns', () => {
			const source = `
define function !!makeForm(!number is REAL) is FORM
	!form = '!!makeForm' & !number
endfunction

define function !!exportMember(!item is STRING, $
                               !messages is ARRAY) is BOCERROROBJ
	!dbs = ARRAY()
	!dbs.append( /*MDS/CATA )
	!offset = !ptDir.cross( u wrt /* )
endfunction
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
		});

		it('should parse DBREF literals and command-style toolbar/object lines used in object files', () => {
			const source = `
define method .toolbars()
	!this.drwg = =0/0
	frame .sampleToolbar toolbar 'Sample Toolbar'
	option .sampleOption 'Sample' at xmin ymin+0.1 call '!!sample()' width 19
	button .sampleButton 'Run' call '!!run()'
	text .sampleText 'Ready'
	RENAME ALL $!!ce.name $!this.name
	LIMITS FROM E $!l[1] N $!l[2] U $!l[3] to E $!l[4] N $!l[5] U $!l[6]
	FUNCTION |$!task.function|
	PMLFunction |$!task.execute|
	SpPURP $!task.purpose
	do !x from 1 to !entries
		var !line compose |$!this.name[$!x]| width $!w1 Left spaces 2 $
		                  |$!this.desc[$!x]| width $!w2 Left spaces 2
	enddo
endmethod
			`.trim();

			const parser = new Parser();
			const result = parser.parse(source);

			expect(result.errors).toHaveLength(0);
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
