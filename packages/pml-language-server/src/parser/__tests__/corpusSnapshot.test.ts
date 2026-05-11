/**
 * Optional installed AVEVA PMLLIB corpus snapshot.
 *
 * Set AVEVA_PMLLIB_PATH to run this locally. CI skips it by default because the
 * proprietary AVEVA corpus is not available in the repository.
 */

import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Parser, parserModeFromUri } from '../parser';

interface CorpusBucket {
	files: number;
	filesWithErrors: number;
	errors: number;
}

const corpusRoot = process.env.AVEVA_PMLLIB_PATH;
const maybeIt = corpusRoot ? it : it.skip;

const extensions = new Set(['.pmlcmd', '.pmlfnc', '.pmlfrm', '.pmlmac', '.pmlobj']);
const errorBudgets: Record<string, number> = {
	pmlcmd: 0,
	pmlfnc: 1077,
	pmlfrm: 919,
	pmlmac: 3,
	pmlobj: 1597
};

function createEmptySummary(): Record<string, CorpusBucket> {
	return Object.fromEntries(
		Object.keys(errorBudgets).map(ext => [ext, { files: 0, filesWithErrors: 0, errors: 0 }])
	) as Record<string, CorpusBucket>;
}

function walkCorpus(dir: string, onFile: (filePath: string) => void): void {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkCorpus(fullPath, onFile);
			continue;
		}

		if (extensions.has(path.extname(entry.name).toLowerCase())) {
			onFile(fullPath);
		}
	}
}

describe('AVEVA PMLLIB corpus snapshot', () => {
	maybeIt('should stay within the v0.12.26 parser error budget', () => {
		expect(corpusRoot).toBeDefined();
		expect(fs.existsSync(corpusRoot as string)).toBe(true);

		const summary = createEmptySummary();
		walkCorpus(corpusRoot as string, filePath => {
			const ext = path.extname(filePath).slice(1).toLowerCase();
			const text = fs.readFileSync(filePath, 'utf8');
			const result = new Parser().parse(text, { mode: parserModeFromUri(filePath) });
			const bucket = summary[ext];

			bucket.files++;
			if (result.errors.length > 0) {
				bucket.filesWithErrors++;
			}
			bucket.errors += result.errors.length;
		});

		for (const [ext, budget] of Object.entries(errorBudgets)) {
			expect(summary[ext].errors, `${ext} parser errors`).toBeLessThanOrEqual(budget);
		}
	});
});
