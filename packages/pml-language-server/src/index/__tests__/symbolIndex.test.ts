import { describe, expect, it } from 'vitest';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../symbolIndex';

describe('SymbolIndex', () => {
	it('reports whether a file version is already indexed', () => {
		const source = [
			'define method .NavigateTo()',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(source);
		const symbolIndex = new SymbolIndex();
		const uri = 'file:///forms/Main.pmlfrm';

		expect(symbolIndex.isFileVersionIndexed(uri, 1)).toBe(false);

		symbolIndex.indexFile(uri, parseResult.ast, 1, source);

		expect(symbolIndex.isFileVersionIndexed(uri, 1)).toBe(true);
		expect(symbolIndex.isFileVersionIndexed(uri, 2)).toBe(false);
	});

	it('clears cached document text during full reset', () => {
		const source = [
			'define method .NavigateTo()',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(source);
		const symbolIndex = new SymbolIndex();
		const uri = 'file:///forms/Main.pmlfrm';

		symbolIndex.indexFile(uri, parseResult.ast, 1, source);

		expect(symbolIndex.getDocumentText(uri)).toBe(source);

		symbolIndex.clear();

		expect(symbolIndex.getDocumentText(uri)).toBeUndefined();
		expect(symbolIndex.isFileVersionIndexed(uri, 1)).toBe(false);
	});
});
