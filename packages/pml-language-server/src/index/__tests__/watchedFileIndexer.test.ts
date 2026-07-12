import { describe, expect, it, vi } from 'vitest';
import { FileChangeType } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../symbolIndex';
import { WatchedFileIndexer } from '../watchedFileIndexer';

function createLogger() {
	return {
		log: vi.fn(),
		warn: vi.fn()
	};
}

describe('WatchedFileIndexer', () => {
	it('skips external changed events for documents open in the editor', () => {
		const symbolIndex = new SymbolIndex();
		const indexFileSpy = vi.spyOn(symbolIndex, 'indexFile');
		const readFileSync = vi.fn(() => [
			'define method .external()',
			'endmethod'
		].join('\n'));
		const uri = 'file:///workspace/open.pml';
		const indexer = new WatchedFileIndexer({
			symbolIndex,
			isDocumentOpen: candidate => candidate === uri,
			logger: createLogger(),
			readFileSync
		});

		indexer.process([{ uri, type: FileChangeType.Changed }]);

		expect(readFileSync).not.toHaveBeenCalled();
		expect(indexFileSpy).not.toHaveBeenCalled();
	});

	it('indexes changed PML files that are not open in the editor', () => {
		const symbolIndex = new SymbolIndex();
		const logger = createLogger();
		const source = [
			'define method .external()',
			'endmethod'
		].join('\n');
		const filePath = 'D:/workspace/external.pml';
		const uri = URI.file(filePath).toString();
		const readFileSync = vi.fn(() => source);
		const indexer = new WatchedFileIndexer({
			symbolIndex,
			isDocumentOpen: () => false,
			logger,
			readFileSync
		});

		indexer.process([{ uri, type: FileChangeType.Changed }]);

		expect(readFileSync).toHaveBeenCalledWith(expect.stringMatching(/external\.pml$/), 'utf-8');
		expect(symbolIndex.findMethod('external')).toHaveLength(1);
		expect(logger.log).toHaveBeenCalledWith(`File changed, reindexed: ${uri}`);
	});

	it('removes deleted PML files from the index without reading from disk', () => {
		const symbolIndex = new SymbolIndex();
		const source = [
			'define method .stale()',
			'endmethod'
		].join('\n');
		const uri = 'file:///workspace/stale.pml';
		const indexer = new WatchedFileIndexer({
			symbolIndex,
			isDocumentOpen: () => false,
			logger: createLogger(),
			readFileSync: vi.fn()
		});
		const parserResult = new Parser().parse(source);
		symbolIndex.indexFile(uri, parserResult.ast, 0, source);

		expect(symbolIndex.findMethod('stale')).toHaveLength(1);

		indexer.process([{ uri, type: FileChangeType.Deleted }]);

		expect(symbolIndex.findMethod('stale')).toHaveLength(0);
	});

	it('ignores non-PML watched files', () => {
		const symbolIndex = new SymbolIndex();
		const readFileSync = vi.fn();
		const indexer = new WatchedFileIndexer({
			symbolIndex,
			isDocumentOpen: () => false,
			logger: createLogger(),
			readFileSync
		});

		indexer.process([{ uri: 'file:///workspace/readme.md', type: FileChangeType.Changed }]);

		expect(readFileSync).not.toHaveBeenCalled();
		expect(symbolIndex.getStats().files).toBe(0);
	});

	it('ignores watched URIs without a file extension', () => {
		const readFileSync = vi.fn();
		const indexer = new WatchedFileIndexer({
			symbolIndex: new SymbolIndex(),
			isDocumentOpen: () => false,
			logger: createLogger(),
			readFileSync
		});

		indexer.process([{ uri: 'file:///workspace/extensionless-file', type: FileChangeType.Changed }]);

		expect(readFileSync).not.toHaveBeenCalled();
	});
});
