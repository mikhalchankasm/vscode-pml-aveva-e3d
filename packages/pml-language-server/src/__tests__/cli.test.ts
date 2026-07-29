import { describe, expect, it } from 'vitest';
import { Parser } from '../parser/parser';
import { createCliSemanticDiagnostics } from '../cli';

describe('PML Assistant CLI helpers', () => {
	it('allows zero-based indices in the default diagnostic contract', () => {
		const source = '!value = !items[0]';
		const parseResult = new Parser().parse(source);

		const diagnostics = createCliSemanticDiagnostics(parseResult.ast, source, 'pml', false);

		expect(parseResult.errors).toHaveLength(0);
		expect(diagnostics.some(diagnostic => diagnostic.code === 'array-index-zero')).toBe(false);
	});

	it('skips form reference diagnostics when parse errors are present', () => {
		const source = [
			'setup form !!Test dialog',
			'    button .btnApply |Apply| callback |!this.missing()|',
			'exit'
		].join('\n');
		const parseResult = new Parser().parse(source, { mode: 'form' });
		expect(parseResult.errors).toHaveLength(0);

		const cleanDiagnostics = createCliSemanticDiagnostics(parseResult.ast, source, 'pmlfrm', false);
		const parseErrorDiagnostics = createCliSemanticDiagnostics(parseResult.ast, source, 'pmlfrm', true);

		expect(cleanDiagnostics.some(diagnostic => diagnostic.code === 'missing-form-callback')).toBe(true);
		expect(parseErrorDiagnostics.some(diagnostic => diagnostic.code === 'missing-form-callback')).toBe(false);
	});
});
