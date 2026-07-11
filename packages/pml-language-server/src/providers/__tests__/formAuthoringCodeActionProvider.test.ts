import { DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { describe, expect, it } from 'vitest';
import { SymbolIndex } from '../../index/symbolIndex';
import { Parser, parserModeFromUri } from '../../parser/parser';
import { FormAuthoringCodeActionProvider } from '../formAuthoringCodeActionProvider';

const uri = 'file:///FormAuthoring.pmlfrm';

function fixture(source: string) {
	const parsed = new Parser().parse(source, { mode: parserModeFromUri(uri) });
	expect(parsed.errors).toHaveLength(0);
	const index = new SymbolIndex();
	index.indexFile(uri, parsed.ast, 1, source);
	const document = TextDocument.create(uri, 'pml', 1, source);
	return { parsed, index, document, provider: new FormAuthoringCodeActionProvider(index) };
}

function cursorAt(document: TextDocument, source: string, marker: string): Range {
	const offset = source.lastIndexOf(marker);
	const position = document.positionAt(offset + 1);
	return Range.create(position, position);
}

describe('FormAuthoringCodeActionProvider', () => {
	it('navigates from a gadget callback to its method', () => {
		const source = [
			'setup form !!Example dialog',
			'  button .apply |Apply| callback |!this.onApply()|',
			'exit',
			'define method .onApply()',
			'endmethod'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		const actions = provider.provide(document, cursorAt(document, source, 'button .apply'), parsed.ast);

		expect(actions[0]?.title).toBe('Go to callback method .onApply');
		expect(actions[0]?.command?.arguments?.[1]).toEqual({ line: 3, character: 15 });
	});

	it('navigates back from a callback method to its gadget declaration', () => {
		const source = [
			'setup form !!Example dialog',
			'  button .apply |Apply| callback |!this.onApply()|',
			'exit',
			'define method .onApply()',
			'endmethod'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		const actions = provider.provide(document, cursorAt(document, source, 'define method .onApply'), parsed.ast);

		expect(actions[0]?.title).toBe('Go to callback declaration for .onApply');
		expect(actions[0]?.command?.arguments?.[1]).toEqual({ line: 1, character: 2 });
	});

	it('declares an unknown form member only from a reliable direct assignment', () => {
		const source = [
			'setup form !!Example dialog',
			'exit',
			'define method .init()',
			'  !this.title = |Report|',
			'endmethod'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		const range = Range.create(3, 2, 3, 24);
		const diagnostic = {
			range,
			message: "Unknown form member or gadget '!this.title'. Declare it or correct the reference.",
			code: 'unknown-form-member',
			severity: DiagnosticSeverity.Warning
		};
		const actions = provider.provide(document, range, parsed.ast, [diagnostic], ['quickfix']);

		expect(actions[0]?.title).toBe('Declare form member .title as STRING');
		expect(actions[0]?.edit?.changes?.[uri]?.[0]).toMatchObject({
			newText: '\tmember .title is STRING\n',
			range: { start: { line: 1, character: 0 } }
		});
	});

	it('does not guess a member declaration from an untyped property access', () => {
		const source = 'setup form !!Example dialog\nexit\ndefine method .run()\n  !this.grid.active = true\nendmethod';
		const { parsed, document, provider } = fixture(source);
		const range = Range.create(3, 2, 3, 26);
		const diagnostic = {
			range,
			message: "Unknown form member or gadget '!this.grid'. Declare it or correct the reference.",
			code: 'unknown-form-member'
		};
		expect(provider.provide(document, range, parsed.ast, [diagnostic])).toEqual([]);
	});

	it('adds a form init binding and generated method from the form header', () => {
		const source = 'setup form !!Example dialog\nexit';
		const { parsed, document, provider } = fixture(source);
		const actions = provider.provide(document, Range.create(0, 2, 0, 2), parsed.ast, [], ['refactor']);
		const edits = actions[0]?.edit?.changes?.[uri] ?? [];

		expect(actions[0]?.title).toBe('Add form init callback');
		expect(edits.map(edit => edit.newText)).toEqual([
			"\t!this.callback = '!this.init()'\n",
			'\n\ndefine method .init()\n\t-- TODO: Implement.\nendmethod\n'
		]);
		expect(actions[0]?.command?.arguments?.[1]).toEqual({ line: 3, character: 0 });
	});

	it('adds only the binding when an init method already exists', () => {
		const source = 'setup form !!Example dialog\nexit\ndefine method .init()\nendmethod';
		const { parsed, document, provider } = fixture(source);
		const actions = provider.provide(document, Range.create(0, 2, 0, 2), parsed.ast);
		const edits = actions.find(action => action.title === 'Add form init callback')?.edit?.changes?.[uri] ?? [];

		expect(edits).toHaveLength(1);
		expect(actions.find(action => action.title === 'Add form init callback')?.command?.arguments?.[1]).toEqual({ line: 2, character: 0 });
	});

	it('navigates nested frame gadget callbacks', () => {
		const source = [
			'setup form !!Example dialog',
			'  frame .tools',
			'    button .save |Save| callback |!this.onSave()|',
			'  exit',
			'exit',
			'define method .onSave()',
			'endmethod'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		expect(provider.provide(document, cursorAt(document, source, 'button .save'), parsed.ast)[0]?.title)
			.toBe('Go to callback method .onSave');
	});

	it('navigates bare direct callback targets accepted by validation', () => {
		const source = 'setup form !!Example dialog\n  button .apply |Apply| callback |onApply()|\nexit\ndefine method .onApply()\nendmethod';
		const { parsed, document, provider } = fixture(source);
		expect(provider.provide(document, cursorAt(document, source, 'button .apply'), parsed.ast)[0]?.title)
			.toBe('Go to callback method .onApply');
	});

	it('infers ARRAY members from object constructors', () => {
		const source = 'setup form !!Example dialog\nexit\ndefine method .init()\n  !this.items = object ARRAY()\nendmethod';
		const { parsed, document, provider } = fixture(source);
		const range = Range.create(3, 2, 3, 36);
		const diagnostic = {
			range,
			message: "Unknown form member or gadget '!this.items'. Declare it or correct the reference.",
			code: 'unknown-form-member'
		};
		expect(provider.provide(document, range, parsed.ast, [diagnostic])[0]?.title)
			.toBe('Declare form member .items as ARRAY');
	});

	it('does not duplicate an existing lifecycle callback', () => {
		const source = "setup form !!Example dialog\n  !this.callback = '!this.start()'\nexit";
		const { parsed, document, provider } = fixture(source);
		expect(provider.provide(document, Range.create(0, 2, 0, 2), parsed.ast)
			.some(action => action.title === 'Add form init callback')).toBe(false);
	});

	it('preserves CRLF for inserted form members', () => {
		const source = 'setup form !!Example dialog\r\nexit\r\ndefine method .init()\r\n  !this.title = |Report|\r\nendmethod';
		const { parsed, document, provider } = fixture(source);
		const range = Range.create(3, 2, 3, 24);
		const diagnostic = {
			range,
			message: "Unknown form member or gadget '!this.title'. Declare it or correct the reference.",
			code: 'unknown-form-member'
		};
		const edit = provider.provide(document, range, parsed.ast, [diagnostic])[0]?.edit?.changes?.[uri]?.[0];
		expect(edit?.newText).toBe('\tmember .title is STRING\r\n');
	});

	it('batch-generates all missing callback methods once in source order', () => {
		const source = [
			'setup form !!Example dialog',
			'  button .first |First| callback |!this.shared()|',
			'  button .second |Second| callback |!this.shared()|',
			'  frame .tools',
			'    button .save |Save| callback |!this.onSave()|',
			'  exit',
			'exit'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		const action = provider.provide(document, Range.create(0, 2, 0, 2), parsed.ast)
			.find(candidate => candidate.title === 'Generate all missing callback methods (2)');
		const text = action?.edit?.changes?.[uri]?.[0].newText ?? '';

		expect(text.match(/define method \.shared\(\)/g)).toHaveLength(1);
		expect(text.match(/define method \.onSave\(\)/g)).toHaveLength(1);
		expect(text.indexOf('.shared()')).toBeLessThan(text.indexOf('.onSave()'));
	});

	it('offers every declaration when a callback method is reused', () => {
		const source = [
			'setup form !!Example dialog',
			'  button .first |First| callback |!this.shared()|',
			'  button .second |Second| callback |!this.shared()|',
			'exit',
			'define method .shared()',
			'endmethod'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		const actions = provider.provide(document, cursorAt(document, source, 'define method .shared'), parsed.ast);

		expect(actions.map(action => action.title)).toEqual([
			'Go to .first callback for .shared',
			'Go to .second callback for .shared'
		]);
	});

	it('does not let a form-level callback range shadow gadget navigation', () => {
		const source = [
			'setup form !!Example dialog',
			"  !this.callback = '!this.init()'",
			'  button .apply |Apply| callback |!this.onApply()|',
			'exit',
			'define method .init()',
			'endmethod',
			'define method .onApply()',
			'endmethod'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		const action = provider.provide(document, cursorAt(document, source, 'button .apply'), parsed.ast)[0];

		expect(action?.title).toBe('Go to callback method .onApply');
	});

	it('adds a lifecycle pack without overwriting existing bindings', () => {
		const source = [
			'setup form !!Example dialog',
			"  !this.okcall = '!this.accept()'",
			'exit',
			'define method .accept()',
			'endmethod'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		const action = provider.provide(document, Range.create(0, 2, 0, 2), parsed.ast)
			.find(candidate => candidate.title === 'Add form lifecycle pack (init, OK, cancel)');
		const edits = action?.edit?.changes?.[uri] ?? [];
		const combined = edits.map(edit => edit.newText).join('\n');

		expect(combined).toContain("!this.callback = '!this.init()'");
		expect(combined).toContain("!this.cancelcall = '!this.onCancel()'");
		expect(combined).not.toContain('!this.okcall');
		expect(combined).toContain('define method .init()');
		expect(combined).toContain('define method .onCancel()');
		expect(combined).not.toContain('define method .onOk()');
	});

	it('batch-declares reliable members while excluding gadgets and built-ins', () => {
		const source = [
			'setup form !!Example dialog',
			'  button .apply |Apply|',
			'exit',
			'define method .setup()',
			'  !this.caption = |Report|',
			'  !this.count = 1',
			'  !this.apply = true',
			'  !this.formTitle = |Example|',
			'endmethod'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		const action = provider.provide(document, Range.create(0, 2, 0, 2), parsed.ast)
			.find(candidate => candidate.title === 'Declare all reliably typed form members (2)');
		const text = action?.edit?.changes?.[uri]?.[0].newText ?? '';

		expect(text).toBe('\tmember .caption is STRING\n\tmember .count is REAL\n');
	});

	it('offers a safe Quick Fix for a reliably inferred member type mismatch', () => {
		const source = [
			'setup form !!Example dialog',
			'  member .count is STRING',
			'exit',
			'define method .setup()',
			'  !this.count = 1',
			'endmethod'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		const diagnostic = {
			range: Range.create(4, 2, 4, 17),
			message: "Form member '.count' is STRING but assignment is REAL. Change the declaration or assignment.",
			code: 'form-member-type-mismatch'
		};
		const action = provider.provide(document, diagnostic.range, parsed.ast, [diagnostic], ['quickfix'])[0];

		expect(action?.title).toBe('Change form member .count type to REAL');
		expect(action?.edit?.changes?.[uri]?.[0]).toMatchObject({
			newText: 'REAL',
			range: { start: { line: 1, character: 19 }, end: { line: 1, character: 25 } }
		});
	});

	it('batch-aligns only members with one reliable inferred type', () => {
		const source = [
			'setup form !!Example dialog',
			'  member .count is STRING',
			'  member .mixed is STRING',
			'exit',
			'define method .setup()',
			'  !this.count = 1',
			'  !this.mixed = |first|',
			'  !this.mixed = 2',
			'endmethod'
		].join('\n');
		const { parsed, document, provider } = fixture(source);
		const action = provider.provide(document, Range.create(0, 2, 0, 2), parsed.ast)
			.find(candidate => candidate.title === 'Align form member types with reliable assignments (1)');

		expect(action?.edit?.changes?.[uri]).toEqual([expect.objectContaining({ newText: 'REAL' })]);
	});
});
