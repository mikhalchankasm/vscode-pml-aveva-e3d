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
	});

	it('does not offer stubs for existing indexed callables', () => {
		const source = [
			'define method .existing(!value is REAL)',
			'endmethod',
			'define function !!ExistingFunction()',
			'endfunction',
			'.existing(1)',
			'!!ExistingFunction()'
		].join('\n');

		expect(provideAt(source, 'existing(1)').actions).toEqual([]);
		expect(provideAt(source, 'ExistingFunction()').actions).toEqual([]);
	});

	it('does not offer a function stub when the definition is indexed in another file', () => {
		const symbolIndex = new SymbolIndex();
		const definitionUri = 'file:///functions/BuildReport.pmlfnc';
		const definition = 'define function !!BuildReport(!items is ARRAY)\nendfunction';
		const definitionResult = new Parser().parse(definition);
		expect(definitionResult.errors).toHaveLength(0);
		symbolIndex.indexFile(definitionUri, definitionResult.ast, 1, definition);

		const source = '!!BuildReport(!items)';
		expect(provideAt(source, 'BuildReport', 'file:///caller.pml', symbolIndex).actions).toEqual([]);
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
		expect(provideAt(source, 'existing()').actions).toEqual([]);
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

		expect(provideAt(source, 'inner(1)').actions).toEqual([]);
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
