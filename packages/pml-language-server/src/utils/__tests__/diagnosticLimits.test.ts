import { describe, expect, it } from 'vitest';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { limitDiagnostics } from '../diagnosticLimits';

function diagnostic(message: string): Diagnostic {
	return {
		severity: DiagnosticSeverity.Error,
		range: {
			start: { line: 0, character: 0 },
			end: { line: 0, character: 1 }
		},
		message,
		source: 'test'
	};
}

describe('diagnostic limits', () => {
	it('limits diagnostics to maxNumberOfProblems while preserving order', () => {
		const diagnostics = [diagnostic('first'), diagnostic('second'), diagnostic('third')];

		expect(limitDiagnostics(diagnostics, 2).map(item => item.message)).toEqual(['first', 'second']);
	});

	it('returns the original diagnostics array when it is already within the limit', () => {
		const diagnostics = [diagnostic('first')];

		expect(limitDiagnostics(diagnostics, 2)).toBe(diagnostics);
	});

	it('treats zero and fractional limits predictably', () => {
		const diagnostics = [diagnostic('first'), diagnostic('second')];

		expect(limitDiagnostics(diagnostics, 0)).toEqual([]);
		expect(limitDiagnostics(diagnostics, 1.8).map(item => item.message)).toEqual(['first']);
	});
});
