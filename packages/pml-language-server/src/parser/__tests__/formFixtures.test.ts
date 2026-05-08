import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Parser } from '../parser';

const repoRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');

const FORM_FIXTURES: Array<{ relativePath: string; maxErrors: number }> = [
	{ relativePath: 'examples/ceposition.pmlfrm', maxErrors: 0 },
	{ relativePath: 'examples/test-button-snippets.pmlfrm', maxErrors: 0 },
	{ relativePath: 'examples/test.pmlfrm', maxErrors: 0 },
	{ relativePath: 'examples/test2.pmlfrm', maxErrors: 3 },
	{ relativePath: 'examples/test2form.pmlfrm', maxErrors: 2 },
	{ relativePath: 'examples/test_methods.pmlfrm', maxErrors: 0 },
	{ relativePath: 'hide_examples/Button Gadget/traExampleButtons.pmlfrm', maxErrors: 0 },
	{ relativePath: 'hide_examples/forms/equibasic.pmlfrm', maxErrors: 0 },
	{ relativePath: 'hide_examples/forms/traExampleCallback.pmlfrm', maxErrors: 0 }
];

describe('PML form fixture parser smoke tests', () => {
	for (const { relativePath, maxErrors } of FORM_FIXTURES) {
		it(`keeps ${relativePath} at or below the parser error baseline`, () => {
			const filePath = path.join(repoRoot, ...relativePath.split('/'));
			const source = fs.readFileSync(filePath, 'utf8');
			const result = new Parser().parse(source);

			expect(result.errors.length).toBeLessThanOrEqual(maxErrors);
		});
	}
});
