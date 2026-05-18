import { describe, expect, it } from 'vitest';
import { Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { ReferencesProvider } from '../referencesProvider';
import { RenameProvider } from '../renameProvider';

function textInRange(text: string, range: Range): string {
	const lines = text.split(/\r?\n/);
	if (range.start.line === range.end.line) {
		return lines[range.start.line].slice(range.start.character, range.end.character);
	}
	return '';
}

describe('Method reference scanning', () => {
	const uri = 'file:///test.pmlfrm';
	const source = [
		'define method .refresh()',
		'endmethod',
		'track |SEL| call |!this.refresh|',
		'track |LOAD| call |!this.refresh()|',
		'track |ATTR| call |$/attr/sub.refresh|',
		'track |MIXED| call |$attr/sub.refresh|',
		'track |LOCALPATH| call |!a/b.refresh|',
		'!x = !obj.items[1].refresh()'
	].join('\r\n');

	function createProviderFixture() {
		const parser = new Parser();
		const result = parser.parse(source);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);

		const document = TextDocument.create(uri, 'pml', 1, source);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};

		return { document, documents, symbolIndex };
	}

	it('should provide workspace references through the public provider API', async () => {
		const { document, documents, symbolIndex } = createProviderFixture();
		const provider = new ReferencesProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('refresh'));

		const references = await provider.provide({
			textDocument: { uri },
			position,
			context: { includeDeclaration: false }
		});

		expect(references).toHaveLength(6);
		expect(references?.map(reference => textInRange(source, reference.range))).toEqual([
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh'
		]);
	});

	it('should not double-count declarations through the public provider API', async () => {
		const { document, documents, symbolIndex } = createProviderFixture();
		const provider = new ReferencesProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('refresh'));

		const references = await provider.provide({
			textDocument: { uri },
			position,
			context: { includeDeclaration: true }
		});

		expect(references).toHaveLength(7);
		expect(references?.filter(reference => reference.range.start.line === 0)).toHaveLength(1);
	});

	it('should provide workspace rename edits through the public provider API', async () => {
		const { document, documents, symbolIndex } = createProviderFixture();
		const provider = new RenameProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('refresh'));

		const edit = await provider.provide({
			textDocument: { uri },
			position,
			newName: 'reload'
		});

		expect(edit?.changes?.[uri]).toHaveLength(7);
		expect(edit?.changes?.[uri].map(change => change.newText)).toEqual([
			'reload',
			'reload',
			'reload',
			'reload',
			'reload',
			'reload',
			'reload'
		]);
		expect(edit?.changes?.[uri].map(change => textInRange(source, change.range))).toEqual([
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh'
		]);
	});

	it('should find method references in callback strings and indexed expressions', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const references = (provider as any).findReferencesInText(source, uri, 'refresh');

		expect(references).toHaveLength(7);
		expect(references.map((reference: any) => textInRange(source, reference.range))).toEqual([
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh'
		]);
	});

	it('should reuse cached reference patterns without missing repeated scans', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const shortSource = 'define method .refresh()\nendmethod';

		const first = (provider as any).findReferencesInText(source, uri, 'refresh');
		const second = (provider as any).findReferencesInText(shortSource, 'file:///short.pml', 'refresh');
		const third = (provider as any).findReferencesInText(source, uri, 'refresh');

		expect(first).toHaveLength(7);
		expect(second).toHaveLength(1);
		expect(third).toHaveLength(7);
	});

	it('should keep cached reference pattern scans stable across supported pattern shapes', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const cases = [
			'.refresh()',
			'!obj.refresh()',
			'!made = object refresh()',
			'define method .refresh()\nendmethod',
			'track |DIRECT| call |.refresh|',
			'track |EXPR| call |!this.refresh|'
		];

		for (const [index, text] of cases.entries()) {
			const uri = `file:///pattern-${index}.pml`;
			expect((provider as any).findReferencesInText(text, uri, 'refresh')).toHaveLength(1);
			expect((provider as any).findReferencesInText(text, uri, 'refresh')).toHaveLength(1);
		}
	});

	it('should honor includeDeclaration=false during text reference scans', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const text = [
			'define method .refresh()',
			'endmethod',
			'!this.refresh()',
			'track |CALL| call |!this.refresh|'
		].join('\n');

		const referencesOnly = (provider as any).findReferencesInText(text, uri, 'refresh', false);
		const withDeclaration = (provider as any).findReferencesInText(text, uri, 'refresh', true);

		expect(referencesOnly).toHaveLength(2);
		expect(withDeclaration).toHaveLength(3);
	});

	it('should ignore method references inside comments', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const text = [
			'define method .refresh()',
			'endmethod',
			'-- !this.refresh()',
			'$* |!this.refresh|',
			'$( block comment .refresh()',
			'!this.refresh()',
			'$)',
			'!this.refresh()',
			'track |CALL| call |!this.refresh|'
		].join('\n');

		const referencesOnly = (provider as any).findReferencesInText(text, uri, 'refresh', false);
		const withDeclaration = (provider as any).findReferencesInText(text, uri, 'refresh', true);

		expect(referencesOnly).toHaveLength(2);
		expect(withDeclaration).toHaveLength(3);
	});

	it('should ignore method references inside quoted strings while preserving pipe callbacks', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const text = [
			'define method .refresh()',
			'endmethod',
			'!single = \'!this.refresh()\'',
			'!double = "!this.refresh()"',
			'!commentText = "-- !this.refresh()"',
			'track |CALL| call |!this.refresh|',
			'!this.refresh()'
		].join('\n');

		const referencesOnly = (provider as any).findReferencesInText(text, uri, 'refresh', false);
		const withDeclaration = (provider as any).findReferencesInText(text, uri, 'refresh', true);

		expect(referencesOnly).toHaveLength(2);
		expect(withDeclaration).toHaveLength(3);
	});

	it('should not treat punctuation-only words as reference symbols', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);

		expect((provider as any).findReferencesInText('.refresh()', uri, '')).toEqual([]);
	});

	it('should not match member declarations inside larger words', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const text = 'remember .refresh';

		expect((provider as any).findReferencesInText(text, uri, 'refresh')).toEqual([]);
	});

	it('should bound and refresh the reference pattern cache', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);

		for (let index = 0; index < 100; index++) {
			(provider as any).getReferencePatternSet(`symbol${index}`);
		}
		(provider as any).getReferencePatternSet('symbol0');
		(provider as any).getReferencePatternSet('symbol100');

		const cache: Map<string, unknown> = (provider as any).referencePatternCache;
		expect(cache.size).toBe(100);
		expect(cache.has('symbol0')).toBe(true);
		expect(cache.has('symbol1')).toBe(false);
		expect(cache.has('symbol100')).toBe(true);
	});

	it('should keep the cached pre-filter non-global', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const patternSet = (provider as any).getReferencePatternSet('refresh');

		expect(patternSet.preFilterPattern.global).toBe(false);
	});

	it('should keep separate cached scans independent', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const first = (provider as any).findReferencesInText(source, uri, 'refresh');
		const second = (provider as any).findReferencesInText('!this.refresh()', 'file:///other.pml', 'refresh');

		expect(first).toHaveLength(7);
		expect(second).toHaveLength(1);
	});

	it('should document that method rename is intentionally broader than references', () => {
		const text = [
			'!callback = .refresh',
			'!this.refresh()'
		].join('\n');
		const referencesProvider = new ReferencesProvider(undefined as any, undefined as any);
		const renameProvider = new RenameProvider(undefined as any, undefined as any);

		const references = (referencesProvider as any).findReferencesInText(text, uri, 'refresh', false);
		const edits = (renameProvider as any).findAndReplaceMethod(text, 'refresh', 'reload');

		expect(references).toHaveLength(1);
		expect(edits).toHaveLength(2);
		expect(edits.length).toBeGreaterThanOrEqual(references.length);
	});

	it('should not rename method references inside comments', () => {
		const provider = new RenameProvider(undefined as any, undefined as any);
		const text = [
			'define method .refresh()',
			'endmethod',
			'-- !this.refresh()',
			'$* |!this.refresh|',
			'$( block comment .refresh()',
			'!this.refresh()',
			'$)',
			'!this.refresh()',
			'track |CALL| call |!this.refresh|'
		].join('\n');

		const edits = (provider as any).findAndReplaceMethod(text, 'refresh', 'reload');

		expect(edits).toHaveLength(3);
		expect(edits.map((edit: any) => textInRange(text, edit.range))).toEqual([
			'refresh',
			'refresh',
			'refresh'
		]);
	});

	it('should not rename method references inside quoted strings while preserving pipe callbacks', () => {
		const provider = new RenameProvider(undefined as any, undefined as any);
		const text = [
			'define method .refresh()',
			'endmethod',
			'!single = \'!this.refresh()\'',
			'!double = "!this.refresh()"',
			'!commentText = "-- !this.refresh()"',
			'track |CALL| call |!this.refresh|',
			'!this.refresh()'
		].join('\n');

		const edits = (provider as any).findAndReplaceMethod(text, 'refresh', 'reload');

		expect(edits).toHaveLength(3);
		expect(edits.map((edit: any) => textInRange(text, edit.range))).toEqual([
			'refresh',
			'refresh',
			'refresh'
		]);
	});

	it('should not rename object references inside inactive text', () => {
		const provider = new RenameProvider(undefined as any, undefined as any);
		const text = [
			'define object Pump',
			'endobject',
			'-- OBJECT Pump()',
			'!message = \'OBJECT Pump()\'',
			'track |CALL| call |OBJECT Pump()|',
			'$( block comment',
			'OBJECT Pump()',
			'$)',
			'!created = object Pump()',
			'!typed is Pump'
		].join('\n');

		const edits = (provider as any).findAndReplaceObject(text, 'Pump', 'Valve');

		expect(edits).toHaveLength(3);
		expect(edits.map((edit: any) => textInRange(text, edit.range))).toEqual([
			'Pump',
			'Pump',
			'Pump'
		]);
	});

	it('should not rename form references inside inactive text', () => {
		const provider = new RenameProvider(undefined as any, undefined as any);
		const text = [
			'setup form !!Main',
			'exit',
			'-- !!Main',
			'!message = "!!Main"',
			'track |CALL| call |!!Main|',
			'$( !!Main $)',
			'!!Main.show()'
		].join('\n');

		const edits = (provider as any).findAndReplaceForm(text, 'Main', 'Next');

		expect(edits).toHaveLength(2);
		expect(edits.map((edit: any) => textInRange(text, edit.range))).toEqual([
			'!!Main',
			'!!Main'
		]);
	});

	it('should not rename variable references inside inactive text', () => {
		const provider = new RenameProvider(undefined as any, undefined as any);
		const text = [
			'!value = 1',
			'-- !value',
			'!message = \'!value\'',
			'track |CALL| call |!value|',
			'$( block comment',
			'!value',
			'$)',
			'!value = !value + 1'
		].join('\n');
		const pattern = /(?<![!])!value(?![A-Za-z0-9_])/gi;

		const edits = (provider as any).findVariableOccurrences(text, pattern, '!next');

		expect(edits).toHaveLength(3);
		expect(edits.map((edit: any) => textInRange(text, edit.range))).toEqual([
			'!value',
			'!value',
			'!value'
		]);
	});

	it('should rename method references in callback strings and indexed expressions', () => {
		const provider = new RenameProvider(undefined as any, undefined as any);
		const edits = (provider as any).findAndReplaceMethod(source, 'refresh', 'reload');

		expect(edits).toHaveLength(7);
		expect(edits.map((edit: any) => edit.newText)).toEqual([
			'reload',
			'reload',
			'reload',
			'reload',
			'reload',
			'reload',
			'reload'
		]);
		expect(edits.map((edit: any) => textInRange(source, edit.range))).toEqual([
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh'
		]);
	});
});
