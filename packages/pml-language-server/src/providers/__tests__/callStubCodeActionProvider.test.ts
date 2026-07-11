import { describe, expect, it } from 'vitest';
import { CreateFile, DiagnosticSeverity, Range, TextDocumentEdit } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolIndex } from '../../index/symbolIndex';
import { Parser, parserModeFromUri } from '../../parser/parser';
import { CallStubCodeActionProvider } from '../callStubCodeActionProvider';

function provideAt(source: string, marker: string, uri = 'file:///call-stub.pml', symbolIndex = new SymbolIndex()) {
	const result = new Parser().parse(source, { mode: parserModeFromUri(uri) });
	expect(result.errors).toHaveLength(0);
	symbolIndex.indexFile(uri, result.ast, 1, source);
	const document = TextDocument.create(uri, 'pml', 1, source);
	const offset = source.lastIndexOf(marker);
	expect(offset).toBeGreaterThanOrEqual(0);
	const position = document.positionAt(offset + Math.max(1, marker.length - 1));
	const actions = new CallStubCodeActionProvider(symbolIndex).provide(
		document,
		Range.create(position, position),
		result.ast
	);
	return { actions, document };
}

describe('CallStubCodeActionProvider', () => {
	it('preserves the missing form callback Quick Fix through the LSP provider', () => {
		const uri = 'file:///callback.pmlfrm';
		const source = 'setup form !!Example dialog\n  button .apply |Apply| callback |!this.apply()|\nexit';
		const parsed = new Parser().parse(source, { mode: parserModeFromUri(uri) });
		const index = new SymbolIndex();
		index.indexFile(uri, parsed.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const diagnostic = {
			range: Range.create(1, 2, 1, 15),
			message: "Gadget '.apply' callback references missing method '.apply()'",
			severity: DiagnosticSeverity.Warning,
			code: 'missing-form-callback'
		};

		const actions = new CallStubCodeActionProvider(index).provide(document, diagnostic.range, parsed.ast, [diagnostic]);
		expect(actions[0]?.title).toBe('Generate callback method .apply()');
		const lineActions = new CallStubCodeActionProvider(index).provide(document, diagnostic.range, parsed.ast);
		expect(lineActions[0]?.title).toBe('Generate callback method .apply()');
	});

	it('recognizes bare and dotted gadget callbacks without diagnostics', () => {
		for (const callback of ['.apply()', 'apply()']) {
			const source = `setup form !!Example dialog\n  button .apply |Apply| callback |${callback}|\nexit`;
			const parsed = new Parser().parse(source, { mode: parserModeFromUri('file:///callback-style.pmlfrm') });
			const index = new SymbolIndex();
			const document = TextDocument.create('file:///callback-style.pmlfrm', 'pml', 1, source);
			index.indexFile(document.uri, parsed.ast, 1, source);
			const actions = new CallStubCodeActionProvider(index).provide(
				document,
				Range.create(1, 2, 1, 2),
				parsed.ast
			);
			expect(actions[0]?.title, callback).toBe('Generate callback method .apply()');
		}
	});

	it('generates a typed file-local method stub from safe argument evidence', () => {
		const source = [
			'define method .caller(!target is STRING)',
			'  !count = 1',
			'  !this.missing(!target, !count, |label|, true, object ARRAY())',
			'endmethod'
		].join('\n');
		const { actions } = provideAt(source, 'missing');

		expect(actions).toHaveLength(1);
		expect(actions[0].title).toBe('Generate method .missing(!target is STRING, !count is REAL, !text is STRING, !flag is BOOLEAN, !items is ARRAY)');
		expect(actions[0].edit?.changes?.['file:///call-stub.pml']?.[0].newText).toBe([
			'',
			'',
			'define method .missing(!target is STRING, !count is REAL, !text is STRING, !flag is BOOLEAN, !items is ARRAY)',
			'\t-- TODO: Implement.',
			'endmethod',
			''
		].join('\n'));
		expect(actions[0].command).toMatchObject({
			command: 'pml.goToCallableDefinition',
			arguments: ['file:///call-stub.pml', { line: 5, character: 0 }]
		});
	});

	it('generates a global function stub and keeps duplicate parameter names unique', () => {
		const source = [
			'define method .caller(!items is ARRAY)',
			'  !!BuildReport(!items, !items, 10)',
			'endmethod'
		].join('\n');
		const { actions } = provideAt(source, 'BuildReport');

		expect(actions).toHaveLength(1);
		expect(actions[0].title).toBe('Generate function !!BuildReport(!items is ARRAY, !items2 is ARRAY, !value is REAL) in BuildReport.pmlfnc');
		const changes = actions[0].edit?.documentChanges ?? [];
		expect((changes[0] as CreateFile).uri).toBe('file:///BuildReport.pmlfnc');
		const newText = (changes[1] as TextDocumentEdit).edits[0].newText;
		expect(newText).toContain(
			'define function !!BuildReport(!items is ARRAY, !items2 is ARRAY, !value is REAL)'
		);
		expect(newText).toContain('endfunction');
		expect(actions[0].command?.arguments?.[0]).toBe('file:///BuildReport.pmlfnc');
	});

	it('offers navigation but not stub generation for existing indexed callables', () => {
		const source = [
			'define method .existing(!value is REAL)',
			'endmethod',
			'define function !!ExistingFunction()',
			'endfunction',
			'.existing(1)',
			'!!ExistingFunction()'
		].join('\n');

		for (const marker of ['existing', 'ExistingFunction']) {
			const actions = provideAt(source, marker).actions;
			expect(actions.some(action => action.title.startsWith('Generate '))).toBe(false);
			expect(actions.some(action => action.title.startsWith('Go to definition of '))).toBe(true);
		}
	});

	it('adds missing arguments from an indexed method signature', () => {
		const source = [
			'define method .render(!target is STRING, !count is REAL, !options is ARRAY)',
			'endmethod',
			'.render(!target)'
		].join('\n');
		const { actions } = provideAt(source, 'render');
		const action = actions.find(candidate => candidate.title === 'Add missing arguments to .render');

		expect(action?.kind).toBe('quickfix');
		expect(action?.edit?.changes?.['file:///call-stub.pml']?.[0].newText).toBe(', !count, !options');
	});

	it('respects requested code action kinds', () => {
		const source = 'define method .render(!target is STRING)\nendmethod\n.render()';
		const parsed = new Parser().parse(source);
		const index = new SymbolIndex();
		const document = TextDocument.create('file:///kinds.pml', 'pml', 1, source);
		index.indexFile(document.uri, parsed.ast, 1, source);
		const position = document.positionAt(source.lastIndexOf('render') + 2);
		const provider = new CallStubCodeActionProvider(index);

		const quickFixes = provider.provide(document, Range.create(position, position), parsed.ast, [], ['quickfix']);
		expect(quickFixes.map(action => action.title)).toEqual(['Add missing arguments to .render']);
		const refactors = provider.provide(document, Range.create(position, position), parsed.ast, [], ['refactor']);
		expect(refactors.map(action => action.title)).toEqual(['Go to definition of .render']);
	});

	it('fills an empty indexed global call from its signature', () => {
		const index = new SymbolIndex();
		const definitionUri = 'file:///functions/BuildReport.pmlfnc';
		const definition = 'define function !!BuildReport(!items is ARRAY, !title is STRING)\nendfunction';
		const parsed = new Parser().parse(definition, { mode: parserModeFromUri(definitionUri) });
		index.indexFile(definitionUri, parsed.ast, 1, definition);
		const { actions } = provideAt('!!BuildReport()', 'BuildReport', 'file:///caller.pml', index);

		const action = actions.find(candidate => candidate.title === 'Add missing arguments to !!BuildReport');
		expect(action?.edit?.changes?.['file:///caller.pml']?.[0].newText).toBe('!items, !title');
	});

	it('updates only a generated empty method stub signature from a typed call', () => {
		const source = [
			'define method .generated()',
			'  -- TODO: Implement.',
			'endmethod',
			'define method .caller(!target is STRING)',
			'  .generated(!target, 1)',
			'endmethod'
		].join('\n');
		const { actions } = provideAt(source, 'generated');
		const action = actions.find(candidate => candidate.title === 'Update empty method .generated signature from call');

		expect(action?.kind).toBe('refactor.rewrite');
		expect(action?.edit?.changes?.['file:///call-stub.pml']?.[0].newText).toBe('!target is STRING, !value is REAL');
	});

	it('does not rewrite a user-authored empty callable', () => {
		const source = 'define method .manual()\nendmethod\n.manual(1)';
		const { actions } = provideAt(source, 'manual(1)');
		expect(actions.some(candidate => candidate.title.startsWith('Update empty'))).toBe(false);
	});

	it('does not offer argument edits for ambiguous global functions', () => {
		const index = new SymbolIndex();
		for (const uri of ['file:///a.pmlfnc', 'file:///b.pmlfnc']) {
			const source = 'define function !!Duplicate(!value is REAL)\nendfunction';
			const parsed = new Parser().parse(source, { mode: parserModeFromUri(uri) });
			index.indexFile(uri, parsed.ast, 1, source);
		}
		expect(provideAt('!!Duplicate()', 'Duplicate', 'file:///caller.pml', index).actions).toEqual([]);
	});

	it('does not offer a function stub when the definition is indexed in another file', () => {
		const symbolIndex = new SymbolIndex();
		const definitionUri = 'file:///functions/BuildReport.pmlfnc';
		const definition = 'define function !!BuildReport(!items is ARRAY)\nendfunction';
		const definitionResult = new Parser().parse(definition);
		expect(definitionResult.errors).toHaveLength(0);
		symbolIndex.indexFile(definitionUri, definitionResult.ast, 1, definition);

		const source = '!!BuildReport(!items)';
		const actions = provideAt(source, 'BuildReport', 'file:///caller.pml', symbolIndex).actions;
		expect(actions).toHaveLength(1);
		expect(actions[0]?.command?.command).toBe('pml.goToCallableDefinition');
		expect(actions[0]?.command?.arguments?.[0]).toBe(definitionUri);
	});

	it('uses indexed form member types for generated parameters', () => {
		const uri = 'file:///form-call-stub.pmlfrm';
		const source = [
			'setup form !!Example dialog',
			'  member .title is STRING',
			'exit',
			'define method .caller()',
			'  !this.missing(!this.title)',
			'endmethod'
		].join('\n');
		const { actions } = provideAt(source, 'missing', uri);

		expect(actions[0]?.title).toBe('Generate method .missing(!title is STRING)');
	});

	it('does not offer stubs for arbitrary receivers or known built-in functions', () => {
		const receiverSource = '!object.missing(1)';
		const builtInSource = '!!collectallfor(|PIPE|, |TRUE|)';

		expect(provideAt(receiverSource, 'missing').actions).toEqual([]);
		expect(provideAt(builtInSource, 'collectallfor').actions).toEqual([]);
		expect(provideAt('!!Alert(|message|)', 'Alert').actions).toEqual([]);
		expect(provideAt('!!fmsys()', 'fmsys').actions).toEqual([]);
	});

	it('does not offer method stubs in macro files', () => {
		expect(provideAt('.missing(1)', 'missing', 'file:///example.pmlmac').actions).toEqual([]);
	});

	it('does not offer a global function stub for an indexed form name', () => {
		const symbolIndex = new SymbolIndex();
		const formUri = 'file:///forms/Report.pmlfrm';
		const form = 'setup form !!Report dialog\nexit';
		const parsed = new Parser().parse(form, { mode: parserModeFromUri(formUri) });
		symbolIndex.indexFile(formUri, parsed.ast, 1, form);

		expect(provideAt('!!Report()', 'Report', 'file:///caller.pml', symbolIndex).actions).toEqual([]);
	});

	it('drops stale inferred types after a conditional assignment', () => {
		const source = '!value = 1\nif true then\n  !value = |text|\nendif\n.missing(!value)';
		expect(provideAt(source, 'missing').actions[0]?.title).toBe('Generate method .missing(!value)');
	});

	it('matches a selection that intersects the callee', () => {
		const source = '.missing(1)';
		const parsed = new Parser().parse(source);
		const document = TextDocument.create('file:///selection.pml', 'pml', 1, source);
		const index = new SymbolIndex();
		index.indexFile(document.uri, parsed.ast, 1, source);
		const actions = new CallStubCodeActionProvider(index).provide(
			document,
			Range.create(document.positionAt(0), document.positionAt(source.indexOf('missing') + 2)),
			parsed.ast
		);
		expect(actions).toHaveLength(1);
	});

	it('treats existing callable names case-insensitively', () => {
		const source = 'define method .Existing()\nendmethod\n.existing()';
		expect(provideAt(source, 'existing').actions[0]?.title).toBe('Go to definition of .existing');
	});

	it('does not detect calls inside inactive text', () => {
		for (const [source, marker] of [['-- .missing(1)', 'missing'], ['!text = |!!MissingFunction(1)|', 'MissingFunction']]) {
			expect(provideAt(source, marker, 'file:///inactive-call-stub.pml').actions).toEqual([]);
		}
	});

	it('uses the call under the cursor instead of an enclosing call', () => {
		const source = [
			'define method .inner(!value is REAL)',
			'endmethod',
			'.missing(.inner(1))'
		].join('\n');

		expect(provideAt(source, 'inner').actions[0]?.title).toBe('Go to definition of .inner');
		expect(provideAt(source, 'missing').actions[0]?.title).toBe('Generate method .missing(!arg1)');
	});

	it('preserves CRLF when appending a stub', () => {
		const source = 'define method .caller()\r\n\t.missing()\r\nendmethod';
		const { actions } = provideAt(source, 'missing');
		const newText = actions[0].edit?.changes?.['file:///call-stub.pml']?.[0].newText ?? '';

		expect(newText).toContain('\r\n\r\ndefine method .missing()\r\n');
		expect(newText.replace(/\r\n/g, '')).not.toContain('\n');
	});
});
