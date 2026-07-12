import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { URI } from 'vscode-uri';
import { SymbolIndex } from '../../index/symbolIndex';
import { Parser, parserModeFromUri } from '../../parser/parser';
import { ReferencesProvider } from '../referencesProvider';

describe('ReferencesProvider filesystem fallback', () => {
	it('reads a closed indexed document from disk when cached text is unavailable', async () => {
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pml-references-disk-'));
		const filePath = path.join(tempDir, 'closed.pml');
		const uri = URI.file(filePath).toString();
		const source = [
			'define method .refresh()',
			'endmethod',
			'.refresh()'
		].join('\n');

		try {
			await fs.writeFile(filePath, source, 'utf-8');
			const parsed = new Parser().parse(source, { mode: parserModeFromUri(uri) });
			expect(parsed.errors).toHaveLength(0);
			const symbolIndex = new SymbolIndex();
			symbolIndex.indexFile(uri, parsed.ast, 1);
			const documents = { get: () => undefined };
			const provider = new ReferencesProvider(symbolIndex, documents as any);

			const result = await provider.getReferencePreviews('refresh', 5, true, uri);

			expect(result.total).toBe(2);
			expect(result.previews.map(preview => preview.lineText).sort()).toEqual([
				'.refresh()',
				'define method .refresh()'
			]);
		} finally {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});
});
