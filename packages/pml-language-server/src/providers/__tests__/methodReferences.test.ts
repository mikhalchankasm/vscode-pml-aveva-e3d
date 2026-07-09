import { describe, expect, it } from 'vitest';
import { Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { ReferencesProvider } from '../referencesProvider';
import { RenameProvider } from '../renameProvider';
import { DefinitionProvider } from '../definitionProvider';

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

	function createTwoFileFixture() {
		const otherUri = 'file:///other.pmlfrm';
		const otherSource = [
			'define method .refresh()',
			'endmethod',
			'track |OTHER| call |!this.refresh|',
			'!this.refresh()'
		].join('\n');
		const parser = new Parser();
		const currentResult = parser.parse(source);
		const otherResult = parser.parse(otherSource);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, currentResult.ast, 1, source);
		symbolIndex.indexFile(otherUri, otherResult.ast, 1, otherSource);

		const document = TextDocument.create(uri, 'pml', 1, source);
		const otherDocument = TextDocument.create(otherUri, 'pml', 1, otherSource);
		const documents = {
			get: (requestedUri: string) => {
				if (requestedUri === uri) return document;
				if (requestedUri === otherUri) return otherDocument;
				return undefined;
			}
		};

		return { document, documents, otherUri, otherSource, symbolIndex };
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

	it('should not start references or rename from inactive text', async () => {
		const inactiveUri = 'file:///inactive-trigger.pmlfrm';
		const inactiveSource = [
			'define method .refresh()',
			'endmethod',
			'define method .run()',
			'	!this.refresh()',
			'	!text = "!this.refresh()"',
			'	-- !this.refresh()',
			'	$( !this.refresh()',
			'	$)',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(inactiveSource);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(inactiveUri, parseResult.ast, 1, inactiveSource);
		const document = TextDocument.create(inactiveUri, 'pml', 1, inactiveSource);
		const documents = {
			get: (requestedUri: string) => requestedUri === inactiveUri ? document : undefined
		};
		const referencesProvider = new ReferencesProvider(symbolIndex, documents as any);
		const renameProvider = new RenameProvider(symbolIndex, documents as any);
		const inactiveOffsets = [
			inactiveSource.indexOf('"!this.refresh()"') + '"!this.'.length,
			inactiveSource.indexOf('-- !this.refresh()') + '-- !this.'.length,
			inactiveSource.indexOf('$( !this.refresh()') + '$( !this.'.length
		];

		for (const offset of inactiveOffsets) {
			const position = document.positionAt(offset);
			await expect(referencesProvider.provide({
				textDocument: { uri: inactiveUri },
				position,
				context: { includeDeclaration: false }
			})).resolves.toBeNull();
			expect(renameProvider.prepareRename({
				textDocument: { uri: inactiveUri },
				position
			})).toBeNull();
			await expect(renameProvider.provide({
				textDocument: { uri: inactiveUri },
				position,
				newName: 'reload'
			})).resolves.toBeNull();
		}
	});

	it('should scope method references to the current file when another file defines the same method', async () => {
		const { document, documents, otherUri, symbolIndex } = createTwoFileFixture();
		const provider = new ReferencesProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('refresh'));

		const references = await provider.provide({
			textDocument: { uri },
			position,
			context: { includeDeclaration: false }
		});

		expect(references).toHaveLength(6);
		expect(references?.every(reference => reference.uri === uri)).toBe(true);
		expect(references?.some(reference => reference.uri === otherUri)).toBe(false);
	});

	it('should scope method definition lookup to the current file when another file defines the same method', () => {
		const { document, documents, symbolIndex } = createTwoFileFixture();
		const provider = new DefinitionProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.lastIndexOf('refresh'));

		const definition = provider.provide({
			textDocument: { uri },
			position
		});
		const definitions = Array.isArray(definition) ? definition : definition ? [definition] : [];

		expect(definitions).toHaveLength(1);
		expect(definitions[0].uri).toBe(uri);
		expect(definitions[0].range.start.line).toBe(0);
	});

	it('should index AST method call references for provider lookups', () => {
		const parser = new Parser();
		const methodSource = [
			'define method .refresh()',
			'endmethod',
			'',
			'define method .run(!items is ARRAY)',
			'	!this.refresh()',
			'	if (!items[1].refresh()) then',
			'		!value = .refresh()',
			'	endif',
			'endmethod'
		].join('\n');
		const parseResult = parser.parse(methodSource);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, methodSource);

		const references = symbolIndex.findMethodReferences('refresh');

		expect(references).toHaveLength(3);
		expect(references.map(reference => textInRange(methodSource, reference.range))).toEqual([
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

	it('should use indexed AST references for usage previews without duplicate fallback matches', async () => {
		const { documents, symbolIndex } = createProviderFixture();
		const provider = new ReferencesProvider(symbolIndex, documents as any);

		const { total, previews } = await provider.getReferencePreviews('refresh', 10, false);

		expect(total).toBe(6);
		expect(previews).toHaveLength(6);
		expect(previews.map(preview => textInRange(source, preview.location.range))).toEqual([
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh'
		]);
	});

	it('should scope usage previews to the requested file', async () => {
		const { documents, otherUri, symbolIndex } = createTwoFileFixture();
		const provider = new ReferencesProvider(symbolIndex, documents as any);

		const { total, previews } = await provider.getReferencePreviews('refresh', 10, false, uri);

		expect(total).toBe(6);
		expect(previews).toHaveLength(6);
		expect(previews.every(preview => preview.location.uri === uri)).toBe(true);
		expect(previews.some(preview => preview.location.uri === otherUri)).toBe(false);
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

	it('should scope method rename edits to the current file when another file defines the same method', async () => {
		const { document, documents, otherUri, symbolIndex } = createTwoFileFixture();
		const provider = new RenameProvider(symbolIndex, documents as any);
		const position = document.positionAt(source.indexOf('refresh'));

		const edit = await provider.provide({
			textDocument: { uri },
			position,
			newName: 'reload'
		});

		expect(Object.keys(edit?.changes ?? {})).toEqual([uri]);
		expect(edit?.changes?.[uri]).toHaveLength(7);
		expect(edit?.changes?.[otherUri]).toBeUndefined();
	});

	it('should use indexed AST method references for rename even when text fallback finds nothing', async () => {
		const parser = new Parser();
		const methodSource = [
			'define method .refresh()',
			'endmethod',
			'',
			'define method .run(!items is ARRAY)',
			'	!this.refresh()',
			'	if (!items[1].refresh()) then',
			'		!value = .refresh()',
			'	endif',
			'endmethod'
		].join('\n');
		const parseResult = parser.parse(methodSource);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, methodSource);
		const document = TextDocument.create(uri, 'pml', 1, methodSource);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};
		const provider = new RenameProvider(symbolIndex, documents as any);
		(provider as any).findAndReplaceMethod = () => [];

		const edit = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(methodSource.indexOf('refresh')),
			newName: 'reload'
		});

		expect(edit?.changes?.[uri]).toHaveLength(3);
		expect(edit?.changes?.[uri].map(change => textInRange(methodSource, change.range))).toEqual([
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

	it('should find method references through dynamic substitute callback paths', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const text = [
			'track |DYNAMIC| call |!this.$!<gadgetName>.refresh|',
			'track |ROOT| call |$!<formName>.refresh|',
			'track |CALL| call |!this.$!<gadgetName>.refresh()|'
		].join('\n');

		const references = (provider as any).findReferencesInText(text, uri, 'refresh', false);

		expect(references).toHaveLength(3);
		expect(references.map((reference: any) => textInRange(text, reference.range))).toEqual([
			'refresh',
			'refresh',
			'refresh'
		]);
	});

	it('should not match dynamic substitute callback paths across line breaks', () => {
		const provider = new ReferencesProvider(undefined as any, undefined as any);
		const text = [
			'track |BROKEN| call |!this.$!<gadgetName',
			'>.refresh|'
		].join('\n');

		expect((provider as any).findReferencesInText(text, uri, 'refresh', false)).toEqual([]);
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

	it('should rename bare method references before argument delimiters', () => {
		const text = [
			'!callbacks = object ARRAY(.refresh,.other)',
			'!handler = object HANDLER(.refresh)',
			'!unrelated = .refreshLater)'
		].join('\n');
		const provider = new RenameProvider(undefined as any, undefined as any);

		const edits = (provider as any).findAndReplaceMethod(text, 'refresh', 'reload');

		expect(edits).toHaveLength(2);
		expect(edits.map((edit: any) => textInRange(text, edit.range))).toEqual(['refresh', 'refresh']);
		expect(edits.every((edit: any) => edit.newText === 'reload')).toBe(true);
	});

	it('should rename bare method references before bracket and member delimiters', () => {
		const text = [
			'!callbacks = [.refresh]',
			'!next = .refresh.next',
			'!unrelated = .refreshLater]'
		].join('\n');
		const provider = new RenameProvider(undefined as any, undefined as any);

		const edits = (provider as any).findAndReplaceMethod(text, 'refresh', 'reload');

		expect(edits).toHaveLength(2);
		expect(edits.map((edit: any) => textInRange(text, edit.range))).toEqual(['refresh', 'refresh']);
		expect(edits.every((edit: any) => edit.newText === 'reload')).toBe(true);
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
			'track |OPEN| call |!!Main.show()|',
			'track |CTOR| call |!!Main(!target)|',
			'!label = |Open !!Main.show()|',
			'$( !!Main $)',
			'!!Main.show()'
		].join('\n');

		const edits = (provider as any).findAndReplaceForm(text, 'Main', 'Next');

		expect(edits).toHaveLength(4);
		expect(edits.map((edit: any) => textInRange(text, edit.range))).toEqual([
			'!!Main',
			'!!Main',
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

	it('should prefer global variable rename over same-name methods when cursor is on a !!variable', async () => {
		const variableSource = [
			'define method .value()',
			'endmethod',
			'',
			'define method .run()',
			'	!!value = 1',
			'	!next = !!value',
			'	.value()',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(variableSource);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, variableSource);
		const document = TextDocument.create(uri, 'pml', 1, variableSource);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};
		const provider = new RenameProvider(symbolIndex, documents as any);

		const edit = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(variableSource.indexOf('!!value =') + 2),
			newName: 'nextValue'
		});

		const edits = edit?.changes?.[uri] ?? [];
		expect(edits).toHaveLength(2);
		expect(edits.map(change => textInRange(variableSource, change.range))).toEqual([
			'!!value',
			'!!value'
		]);
		expect(edits.every(change => change.newText === '!!nextValue')).toBe(true);
	});

	it('should scope local variable rename edits to the containing method', async () => {
		const variableSource = [
			'define method .first()',
			'	!value = 1',
			'	!next = !value',
			'endmethod',
			'',
			'define method .second()',
			'	!value = 2',
			'	!next = !value',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(variableSource);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, variableSource);
		const document = TextDocument.create(uri, 'pml', 1, variableSource);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};
		const provider = new RenameProvider(symbolIndex, documents as any);

		const edit = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(variableSource.indexOf('!value = 1') + 1),
			newName: '!renamed'
		});

		const edits = edit?.changes?.[uri] ?? [];
		expect(edits).toHaveLength(2);
		expect(edits.map(change => textInRange(variableSource, change.range))).toEqual([
			'!value',
			'!value'
		]);
		expect(edits.every(change => change.newText === '!renamed')).toBe(true);
		expect(edits.map(change => change.range.start.line)).toEqual([1, 2]);
	});

	it('should preserve the local variable sigil when the new name omits it', async () => {
		const variableSource = [
			'define method .run()',
			'\t!value = 1',
			'\t!next = !value',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(variableSource);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, variableSource);
		const document = TextDocument.create(uri, 'pml', 1, variableSource);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};
		const provider = new RenameProvider(symbolIndex, documents as any);

		const edit = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(variableSource.indexOf('!value = 1') + 1),
			newName: 'renamed'
		});

		const edits = edit?.changes?.[uri] ?? [];
		expect(edits).toHaveLength(2);
		expect(edits.every(change => change.newText === '!renamed')).toBe(true);
	});

	it('should rename only the variable in a slash expression', async () => {
		const variableSource = [
			'define method .run()',
			'\t!result = !total/100',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(variableSource);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, variableSource);
		const document = TextDocument.create(uri, 'pml', 1, variableSource);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};
		const provider = new RenameProvider(symbolIndex, documents as any);
		const position = document.positionAt(variableSource.indexOf('!total') + 1);

		const prepared = provider.prepareRename({ textDocument: { uri }, position });
		expect(prepared && textInRange(variableSource, prepared.range)).toBe('!total');

		const edit = await provider.provide({
			textDocument: { uri },
			position,
			newName: 'subtotal'
		});

		const edits = edit?.changes?.[uri] ?? [];
		expect(edits).toHaveLength(1);
		expect(textInRange(variableSource, edits[0].range)).toBe('!total');
		expect(edits[0].newText).toBe('!subtotal');
	});

	it('should keep top-level local variable rename out of method bodies', async () => {
		const variableSource = [
			'!value = 1',
			'define method .run()',
			'\t!value = 2',
			'\t!other = !value',
			'endmethod',
			'!result = !value'
		].join('\n');
		const symbolIndex = new SymbolIndex();
		const document = TextDocument.create(uri, 'pml', 1, variableSource);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};
		const provider = new RenameProvider(symbolIndex, documents as any);

		const edit = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(variableSource.indexOf('!value') + 1),
			newName: 'other'
		});

		const edits = edit?.changes?.[uri] ?? [];
		expect(edits).toHaveLength(2);
		expect(edits.map(change => change.range.start.line)).toEqual([0, 5]);
		expect(edits.every(change => change.newText === '!other')).toBe(true);
	});

	it('should reject local variable rename when the target name already exists in the same method', async () => {
		const variableSource = [
			'define method .first()',
			'	!value = 1',
			'	!other = 2',
			'	!next = !value',
			'endmethod',
			'',
			'define method .second()',
			'	!other = 3',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(variableSource);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, variableSource);
		const document = TextDocument.create(uri, 'pml', 1, variableSource);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};
		const provider = new RenameProvider(symbolIndex, documents as any);

		const edit = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(variableSource.indexOf('!value = 1') + 1),
			newName: '!other'
		});

		expect(edit?.changes?.[uri] ?? []).toHaveLength(0);
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

	it('should rename method references through dynamic substitute callback paths', () => {
		const provider = new RenameProvider(undefined as any, undefined as any);
		const text = [
			'track |DYNAMIC| call |!this.$!<gadgetName>.refresh|',
			'track |ROOT| call |$!<formName>.refresh|',
			'track |CALL| call |!this.$!<gadgetName>.refresh()|'
		].join('\n');

		const edits = (provider as any).findAndReplaceMethod(text, 'refresh', 'reload');

		expect(edits).toHaveLength(3);
		expect(edits.map((edit: any) => edit.newText)).toEqual(['reload', 'reload', 'reload']);
		expect(edits.map((edit: any) => textInRange(text, edit.range))).toEqual([
			'refresh',
			'refresh',
			'refresh'
		]);
	});
});
