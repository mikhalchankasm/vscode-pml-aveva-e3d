import { describe, expect, it, vi } from 'vitest';
import { Connection } from 'vscode-languageserver/node';
import { WorkDoneProgressServerReporter } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { URI } from 'vscode-uri';
import { SymbolIndex } from '../symbolIndex';
import { WORKSPACE_INDEX_BATCH_SIZE, WorkspaceIndexer } from '../workspaceIndexer';

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

	it('does not overwrite an open document with disk content during workspace indexing', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pml-workspace-indexer-'));
		const filePath = path.join(tempDir, 'main.pml');
		const uri = URI.file(filePath).toString();
		const diskSource = [
			'define method .diskVersion()',
			'endmethod'
		].join('\n');
		const openSource = [
			'define method .openVersion()',
			'endmethod'
		].join('\n');
		await fs.writeFile(filePath, diskSource, 'utf-8');

		const symbolIndex = new SymbolIndex();
		const indexer = new WorkspaceIndexer(symbolIndex, createConnectionStub(), openUri => openUri === uri);
		const openDocument = TextDocument.create(uri, 'pml', 7, openSource);

		try {
			indexer.indexDocument(openDocument);
			await indexer.indexWorkspace([tempDir]);

			expect(symbolIndex.findMethodsInFile(uri, 'openVersion')).toHaveLength(1);
			expect(symbolIndex.findMethodsInFile(uri, 'diskVersion')).toHaveLength(0);
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});

	it('reports discovered file counts and completion duration while indexing a workspace', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pml-workspace-indexer-progress-'));
		const report = vi.fn();
		const progress = { report } as unknown as WorkDoneProgressServerReporter;

		try {
			await fs.writeFile(path.join(tempDir, 'first.pml'), 'define method .first()\nendmethod', 'utf-8');
			await fs.writeFile(path.join(tempDir, 'second.pml'), 'define method .second()\nendmethod', 'utf-8');

			const indexer = new WorkspaceIndexer(new SymbolIndex(), createConnectionStub());
			await indexer.indexWorkspace([tempDir], progress);

			expect(report).toHaveBeenCalledWith(0, 'Found 2 PML files. Indexing...');
			expect(report).toHaveBeenCalledWith(100, 'Indexed 2/2 files');
			expect(report).toHaveBeenLastCalledWith(100, expect.stringMatching(/^Indexed 2 PML files in (?:\d+ ms|\d+\.\d s)\.$/));
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});

	it('indexes files concurrently without exceeding the bounded batch size', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pml-workspace-indexer-batch-'));
		let activeReads = 0;
		let maxActiveReads = 0;
		const readFile = async (filePath: string, encoding: BufferEncoding): Promise<string> => {
			activeReads++;
			maxActiveReads = Math.max(maxActiveReads, activeReads);
			await new Promise(resolve => setTimeout(resolve, 5));
			const content = await fs.readFile(filePath, encoding);
			activeReads--;
			return content;
		};

		try {
			for (let index = 0; index < WORKSPACE_INDEX_BATCH_SIZE + 3; index++) {
				await fs.writeFile(path.join(tempDir, `method-${index}.pml`), `define method .method${index}()\nendmethod`, 'utf-8');
			}
			const symbolIndex = new SymbolIndex();
			const indexer = new WorkspaceIndexer(symbolIndex, createConnectionStub(), () => false, readFile);
			await indexer.indexWorkspace([tempDir]);

			expect(maxActiveReads).toBeGreaterThan(1);
			expect(maxActiveReads).toBeLessThanOrEqual(WORKSPACE_INDEX_BATCH_SIZE);
			expect(symbolIndex.getStats().files).toBe(WORKSPACE_INDEX_BATCH_SIZE + 3);
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});

	it('deduplicates files when configured roots overlap the workspace', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pml-workspace-indexer-overlap-'));
		const nestedDir = path.join(tempDir, 'pmllib');
		await fs.mkdir(nestedDir);
		const filePath = path.join(nestedDir, 'shared.pml');
		await fs.writeFile(filePath, 'define method .shared()\nendmethod', 'utf-8');
		const readFile = vi.fn(async (candidate: string, encoding: BufferEncoding) => fs.readFile(candidate, encoding));

		try {
			const symbolIndex = new SymbolIndex();
			const indexer = new WorkspaceIndexer(symbolIndex, createConnectionStub(), () => false, readFile);
			await indexer.indexWorkspace([tempDir, nestedDir]);

			expect(readFile).toHaveBeenCalledTimes(1);
			expect(symbolIndex.getStats().files).toBe(1);
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});
});
