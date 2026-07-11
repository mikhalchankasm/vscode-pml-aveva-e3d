import { describe, expect, it } from 'vitest';
import { SymbolKind as LSPSymbolKind } from 'vscode-languageserver/node';
import { Parser, parserModeFromUri } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { DocumentSymbolProvider } from '../documentSymbolProvider';

describe('DocumentSymbolProvider', () => {
	it('should expose form frames and gadgets as nested document symbols', () => {
		const source = `
setup form !!OutlineForm dialog
	frame .outer |Outer|
		frame .inner |Inner|
			container .grid nobox PMLNETCONTROL |Grid|
		exit
		button .apply |Apply|
	exit
	menu .menuPopup popup
exit
		`.trim();

		const uri = 'file:///outline.pmlfrm';
		const parseResult = new Parser().parse(source);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, source);

		const provider = new DocumentSymbolProvider(symbolIndex);
		const symbols = provider.provide({ textDocument: { uri } });

		expect(symbols).toHaveLength(1);
		expect(symbols[0].name).toBe('!!OutlineForm');

		const formChildren = symbols[0].children ?? [];
		expect(formChildren.map(child => child.name)).toEqual(['.outer', '.menuPopup']);
		expect(formChildren[1].detail).toBe('menu');

		const outerChildren = formChildren[0].children ?? [];
		expect(outerChildren.map(child => child.name)).toEqual(['.inner', '.apply']);
		expect(outerChildren[1].detail).toBe('button');

		const innerChildren = outerChildren[0].children ?? [];
		expect(innerChildren.map(child => child.name)).toEqual(['.grid']);
		expect(innerChildren[0].detail).toBe('container');
	});

	it('shows form members and direct callback relationships in the outline', () => {
		const source = [
			'setup form !!OutlineForm dialog',
			'  member .title is STRING',
			"  !this.callback = '!this.init()'",
			'  button .apply |Apply| callback |!this.onApply()|',
			'exit'
		].join('\n');
		const uri = 'file:///outline-callbacks.pmlfrm';
		const parsed = new Parser().parse(source, { mode: parserModeFromUri(uri) });
		expect(parsed.errors).toHaveLength(0);
		const index = new SymbolIndex();
		index.indexFile(uri, parsed.ast, 1, source);

		const children = new DocumentSymbolProvider(index).provide({ textDocument: { uri } })[0].children ?? [];
		expect(children.map(child => child.name)).toEqual([
			'.title is STRING',
			'this.callback → .init',
			'.apply'
		]);
		expect(children[0].detail).toBe('form member');
		expect(children[2].children?.[0].name).toBe('callback → .onApply');
	});

	it('should expose object methods as top-level outline entries in .pmlobj files', () => {
		const source = `
define object SAMPLE
	member .name is STRING

	define method .init(!value is STRING)
		!this.name = !value
	endmethod

	define method .reset()
		!this.name = ||
	endmethod
endobject
		`.trim();

		const uri = 'file:///sample.pmlobj';
		const parseResult = new Parser().parse(source, { mode: parserModeFromUri(uri) });
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, source);

		const provider = new DocumentSymbolProvider(symbolIndex);
		const symbols = provider.provide({ textDocument: { uri } });

		expect(symbols.map(symbol => symbol.name)).toEqual([
			'.init(!value)',
			'.reset()',
			'SAMPLE'
		]);
		expect(symbols[0].detail).toBe('object SAMPLE');
		expect(symbols[2].children?.map(child => child.name)).toEqual(['.init(!value)', '.reset()']);
	});

	it('should expose command-file methods after setup command sections', () => {
		const source = `
setup command !!sample
	!x = 1
exit

define method .run()
	!x = 2
endmethod

define method .cleanup(!flag is BOOLEAN)
	!x = 0
endmethod
		`.trim();

		const uri = 'file:///sample.pmlcmd';
		const parseResult = new Parser().parse(source, { mode: parserModeFromUri(uri) });
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, source);

		const provider = new DocumentSymbolProvider(symbolIndex);
		const symbols = provider.provide({ textDocument: { uri } });

		expect(symbols.map(symbol => symbol.name)).toEqual(['.run()', '.cleanup(!flag)']);
		expect(symbols.every(symbol => symbol.kind === LSPSymbolKind.Method)).toBe(true);
	});

	it('should expose global functions as document symbols', () => {
		const source = `
define function !!buildReport(!items is ARRAY, !folder is STRING)
	return !items
endfunction
		`.trim();

		const uri = 'file:///report.pmlfnc';
		const parseResult = new Parser().parse(source, { mode: parserModeFromUri(uri) });
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, source);

		const provider = new DocumentSymbolProvider(symbolIndex);
		const symbols = provider.provide({ textDocument: { uri } });

		expect(symbols.map(symbol => ({
			name: symbol.name,
			kind: symbol.kind,
			detail: symbol.detail
		}))).toEqual([
			{
				name: '!!buildReport(!items, !folder)',
				kind: LSPSymbolKind.Function,
				detail: 'function'
			}
		]);
	});

	it('does not extract fallback methods from inactive text', () => {
		const source = [
			'$( define method .commented()',
			'endmethod',
			'$)',
			'!description = |',
			'define method .stringOnly()',
			'endmethod',
			'|',
			'define method .live()',
			'endmethod'
		].join('\n');
		const uri = 'file:///fallback-inactive.pmlfrm';
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, { body: [] } as any, 1, source);

		const provider = new DocumentSymbolProvider(symbolIndex);
		const symbols = provider.provide({ textDocument: { uri } });

		expect(symbols.map(symbol => symbol.name)).toEqual(['.live()']);
	});

	it('keeps fallback method ranges open past identifiers containing endmethod', () => {
		const source = [
			'define method .live()',
			'\t!endmethodology = 1',
			'\t!endmethod = 2',
			'endmethod'
		].join('\n');
		const uri = 'file:///fallback-endmethod-boundary.pmlfrm';
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, { body: [] } as any, 1, source);

		const provider = new DocumentSymbolProvider(symbolIndex);
		const [symbol] = provider.provide({ textDocument: { uri } });

		expect(symbol.name).toBe('.live()');
		expect(symbol.range.end.line).toBeGreaterThan(2);
	});

	it('selects the fallback method name instead of its declaration prefix', () => {
		const source = ['define method .live()', 'endmethod'].join('\n');
		const uri = 'file:///fallback-selection-range.pmlfrm';
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, { body: [] } as any, 1, source);

		const provider = new DocumentSymbolProvider(symbolIndex);
		const [symbol] = provider.provide({ textDocument: { uri } });

		expect(symbol.selectionRange).toEqual({
			start: { line: 0, character: 'define method '.length },
			end: { line: 0, character: 'define method .live'.length }
		});
	});
});
