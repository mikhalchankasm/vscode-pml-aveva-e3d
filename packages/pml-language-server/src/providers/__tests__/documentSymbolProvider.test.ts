import { describe, expect, it } from 'vitest';
import { Parser } from '../../parser/parser';
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
});
