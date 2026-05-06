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

		expect(references).toHaveLength(7);
		expect(references?.map(reference => textInRange(source, reference.range))).toEqual([
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh',
			'refresh'
		]);
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
