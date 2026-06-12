import { describe, expect, it, vi } from 'vitest';
import { Connection } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolIndex } from '../symbolIndex';
import { WorkspaceIndexer } from '../workspaceIndexer';

function createConnectionStub(): Connection {
	return {
		console: {
			log: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		},
		workspace: {
			getConfiguration: vi.fn()
		}
	} as unknown as Connection;
}

describe('WorkspaceIndexer', () => {
	it('skips re-indexing an unchanged document version', () => {
		const symbolIndex = new SymbolIndex();
		const indexFileSpy = vi.spyOn(symbolIndex, 'indexFile');
		const indexer = new WorkspaceIndexer(symbolIndex, createConnectionStub());
		const source = [
			'define method .refresh()',
			'endmethod'
		].join('\n');
		const uri = 'file:///workspace/forms/main.pml';
		const firstDocument = TextDocument.create(uri, 'pml', 1, source);

		indexer.indexDocument(firstDocument);
		indexer.indexDocument(firstDocument);

		expect(indexFileSpy).toHaveBeenCalledTimes(1);
		expect(symbolIndex.isFileVersionIndexed(uri, 1)).toBe(true);

		const updatedDocument = TextDocument.create(uri, 'pml', 2, `${source}\n!value = |updated|`);
		indexer.indexDocument(updatedDocument);

		expect(indexFileSpy).toHaveBeenCalledTimes(2);
		expect(symbolIndex.isFileVersionIndexed(uri, 2)).toBe(true);
	});
});
