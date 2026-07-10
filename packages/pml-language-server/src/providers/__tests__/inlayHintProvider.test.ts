import { describe, expect, it } from 'vitest';
import { Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { InlayHintProvider } from '../inlayHintProvider';

const fullRange = Range.create(0, 0, 100, 0);

function indexSource(symbolIndex: SymbolIndex, uri: string, source: string): void {
	const result = new Parser().parse(source);
	expect(result.errors).toHaveLength(0);
	symbolIndex.indexFile(uri, result.ast, 1, source);
}

function provide(source: string, symbolIndex = new SymbolIndex(), uri = 'file:///hints.pml') {
	indexSource(symbolIndex, uri, source);
	const document = TextDocument.create(uri, 'pml', 1, source);
	return new InlayHintProvider(symbolIndex).provide(document, fullRange, {
		variableTypes: true,
		parameterNames: true
	});
}

describe('InlayHintProvider', () => {
	it('shows reliable types only on the first assignment in a scope', () => {
		const hints = provide([
			'define method .example()',
			'  !count = 12',
			'  !count = 24',
			'  !title = |Hello|',
			'  !items = object ARRAY()',
			'  !alias = !title',
			'  !later = !alias',
			'  !later = true',
			'endmethod'
		].join('\n'));

		expect(hints.map(hint => hint.label)).toEqual([': REAL', ': STRING', ': ARRAY', ': STRING', ': STRING']);
		expect(hints.map(hint => hint.position.line)).toEqual([1, 3, 4, 5, 6]);
	});

	it('propagates explicit parameter and user-call return types', () => {
		const hints = provide([
			'define function !!loadName() is STRING',
			'endfunction',
			'define method .newItems() is ARRAY',
			'endmethod',
			'define method .example(!source is DBREF)',
			'  !copy = !source',
			'  !name = !!loadName()',
			'  !items = !this.newItems()',
			'endmethod'
		].join('\n'));

		expect(hints.map(hint => hint.label)).toEqual([': DBREF', ': STRING', ': ARRAY']);
		expect(hints.map(hint => hint.position.line)).toEqual([5, 6, 7]);
	});

	it('propagates a prior top-level global type into a callable', () => {
		const hints = provide([
			'!!shared = |value|',
			'define method .example()',
			'  !copy = !!shared',
			'endmethod'
		].join('\n'));

		expect(hints.map(hint => hint.label)).toEqual([': STRING', ': STRING']);
		expect(hints.map(hint => hint.position.line)).toEqual([0, 2]);
	});

	it('does not leak conditional assignments or guess ambiguous return types', () => {
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, 'file:///first.pmlfnc', 'define function !!lookup() is STRING\nendfunction');
		indexSource(symbolIndex, 'file:///second.pmlfnc', 'define function !!lookup() is ARRAY\nendfunction');
		const source = [
			'define method .example()',
			'  if true then',
			'    !conditional = |value|',
			'  endif',
			'  !after = !conditional',
			'  !ambiguous = !!lookup()',
			'endmethod'
		].join('\n');
		const uri = 'file:///ambiguous.pml';
		indexSource(symbolIndex, uri, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const hints = new InlayHintProvider(symbolIndex).provide(document, fullRange, {
			variableTypes: true,
			parameterNames: true
		});

		expect(hints.map(hint => hint.label)).toEqual([': STRING']);
		expect(hints[0].position.line).toBe(2);
	});

	it('shows parameter names for unambiguous method and global function calls', () => {
		const hints = provide([
			'define method .resize(!width is REAL, !height is REAL)',
			'endmethod',
			'define function !!report(!path is STRING)',
			'endfunction',
			'define method .caller()',
			'  .resize(10, 20)',
			'  !!report(|C:/tmp|)',
			'endmethod'
		].join('\n'));

		expect(hints.map(hint => hint.label)).toEqual(['!width:', '!height:', '!path:']);
		expect(hints.map(hint => hint.position.line)).toEqual([5, 5, 6]);
	});

	it('suppresses redundant and ambiguous parameter hints', () => {
		const hints = provide([
			'define method .resize(!width is REAL)',
			'endmethod',
			'define method .resize(!value is STRING)',
			'endmethod',
			'define method .single(!width is REAL)',
			'endmethod',
			'define method .caller(!width is REAL)',
			'  .resize(10)',
			'  .single(!width)',
			'endmethod'
		].join('\n'));

		expect(hints).toEqual([]);
	});

	it('resolves global function parameters across files case-insensitively', () => {
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, 'file:///report.pmlfnc', 'define function !!report(!path is STRING)\nendfunction');
		const source = '!!REPORT(|C:/tmp|)';
		indexSource(symbolIndex, 'file:///caller.pml', source);
		const document = TextDocument.create('file:///caller.pml', 'pml', 1, source);
		const hints = new InlayHintProvider(symbolIndex).provide(document, fullRange, {
			variableTypes: true,
			parameterNames: true
		});

		expect(hints.map(hint => hint.label)).toEqual(['!path:']);
	});

	it('honors the requested range and independent hint settings', () => {
		const source = 'define method .example()\n!first = 1\n!second = |x|\nendmethod';
		const uri = 'file:///range.pml';
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, uri, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new InlayHintProvider(symbolIndex);

		const hints = provider.provide(document, Range.create(2, 0, 2, 50), {
			variableTypes: true,
			parameterNames: false
		});
		expect(hints.map(hint => hint.label)).toEqual([': STRING']);
		expect(provider.provide(document, fullRange, { variableTypes: false, parameterNames: false })).toEqual([]);
	});

	it('does not move a first-assignment hint into the requested viewport', () => {
		const source = 'define method .example()\n!count = 1\n!count = 2\nendmethod';
		const uri = 'file:///viewport.pml';
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, uri, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const hints = new InlayHintProvider(symbolIndex).provide(
			document,
			Range.create(2, 0, 2, 50),
			{ variableTypes: true, parameterNames: false }
		);

		expect(hints).toEqual([]);
	});

	it('handles global variables and suppresses later global assignments across callables', () => {
		const hints = provide([
			'define method .first()',
			'  !!shared = |first|',
			'endmethod',
			'define method .second()',
			'  !!shared = |second|',
			'endmethod'
		].join('\n'));

		expect(hints.map(hint => hint.label)).toEqual([': STRING']);
		expect(hints[0].position.character).toBe(10);
	});

	it('keeps comparisons boolean and unknown numeric operators untyped', () => {
		const hints = provide([
			'define method .example()',
			'  !flag = 1 lt 2',
			'  !unknown = 1 of 2',
			'endmethod'
		].join('\n'));

		expect(hints.map(hint => hint.label)).toEqual([': BOOLEAN']);
	});

	it('does not guess parameter names for arbitrary receivers or constructors', () => {
		const hints = provide([
			'define method .resize(!width is REAL)',
			'endmethod',
			'define method .caller()',
			'  !other.resize(10)',
			'  !items = object ARRAY()',
			'endmethod'
		].join('\n'));

		expect(hints.map(hint => hint.label)).toEqual([': ARRAY']);
	});

	it('uses AST calls only and handles nested calls', () => {
		const hints = provide([
			'define method .inner(!value is REAL)',
			'endmethod',
			'define method .outer(!result is REAL)',
			'endmethod',
			'define method .caller()',
			'  -- .outer(99)',
			'  .outer(.inner(10))',
			'  !text = |.outer(88)|',
			'endmethod'
		].join('\n'));

		expect(hints.map(hint => hint.label)).toEqual(['!result:', '!value:', ': STRING']);
		expect(hints.map(hint => hint.position.line)).toEqual([6, 6, 7]);
	});

	it('traverses object methods and remains safe on recovered parser output', () => {
		const objectHints = provide([
			'define object Box',
			'  member .name is STRING',
			'  define method .make()',
			'    !value = 1',
			'  endmethod',
			'endobject'
		].join('\n'));
		expect(objectHints.map(hint => hint.label)).toEqual([': REAL']);

		const brokenSource = 'define method .broken()\n!x = 1\nif true then\n!y = |a|';
		const uri = 'file:///broken.pml';
		const result = new Parser().parse(brokenSource);
		expect(result.errors.length).toBeGreaterThan(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, brokenSource);
		const document = TextDocument.create(uri, 'pml', 1, brokenSource);
		const hints = new InlayHintProvider(symbolIndex).provide(
			document,
			fullRange,
			{ variableTypes: true, parameterNames: true },
			result.ast
		);
		expect(hints.map(hint => hint.label)).toEqual([': REAL', ': STRING']);
	});
});
