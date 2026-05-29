import { describe, expect, it } from 'vitest';
import { Parser } from '../parser/parser';
import { createCliSemanticDiagnostics } from '../cli';

describe('PML Assistant CLI helpers', () => {
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
