import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Parser } from '../parser';

const repoRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');

const FORM_FIXTURES: Record<string, number> = {
	'ceposition.pmlfrm': 0,
	'test-button-snippets.pmlfrm': 0,
	'test.pmlfrm': 0,
	'test2.pmlfrm': 3,
	'test2form.pmlfrm': 86,
	'test_methods.pmlfrm': 0
};

describe('PML form fixture parser smoke tests', () => {
	for (const [fixtureName, maxErrors] of Object.entries(FORM_FIXTURES)) {
		it(`keeps ${fixtureName} at or below the parser error baseline`, () => {
			const filePath = path.join(repoRoot, 'examples', fixtureName);
			const source = fs.readFileSync(filePath, 'utf8');
			const result = new Parser().parse(source);

			expect(result.errors.length).toBeLessThanOrEqual(maxErrors);
		});
	}
});
