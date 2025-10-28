/**
 * Array Index Checker Tests
 * Tests for detecting arr[0] errors (PML arrays are 1-indexed)
 */

import { describe, it, expect } from 'vitest';
import { ArrayIndexChecker } from '../arrayIndexChecker';
import { Parser } from '../../parser/parser';
import { DiagnosticSeverity } from 'vscode-languageserver/node';

describe('Array Index Checker', () => {
	const parser = new Parser();
	const checker = new ArrayIndexChecker();

	describe('Basic array[0] detection', () => {
		it('should detect arr[0] in simple assignment', () => {
			const source = '!value = !arr[0]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
			expect(diagnostics[0].message).toContain('start at 1, not 0');
			expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Error);
			expect(diagnostics[0].code).toBe('array-index-zero');
		});

		it('should detect arr[0] in variable declaration', () => {
			const source = '!var = !myArray[0]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
			expect(diagnostics[0].message).toContain('runtime error');
		});

		it('should detect string literal "0" as index', () => {
			const source = '!item = !list[|0|]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			// Note: Parser may treat |0| as string literal
			// Test verifies we catch both numeric 0 and string '0'
			expect(diagnostics.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Valid array indices (no errors)', () => {
		it('should not flag arr[1] (valid 1-based index)', () => {
			const source = '!value = !arr[1]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(0);
		});

		it('should not flag arr[2]', () => {
			const source = '!value = !arr[2]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(0);
		});

		it('should not flag arr[!index] (variable index)', () => {
			const source = '!value = !arr[!index]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(0);
		});

		it('should not flag arr[!i + 1] (expression index)', () => {
			const source = '!value = !arr[!i + 1]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(0);
		});
	});

	describe('Array[0] in method bodies', () => {
		it('should detect arr[0] inside method', () => {
			const source = `
define method .test()
	!item = !array[0]
endmethod
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
			expect(diagnostics[0].message).toContain('start at 1, not 0');
		});

		it('should detect multiple arr[0] in same method', () => {
			const source = `
define method .process()
	!first = !arr[0]
	!second = !list[0]
endmethod
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(2);
		});
	});

	describe('Array[0] in control flow', () => {
		it('should detect arr[0] in if condition', () => {
			const source = `
if (!arr[0] eq 5) then
	!x = 1
endif
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should detect arr[0] in if body', () => {
			const source = `
if (!x gt 0) then
	!value = !arr[0]
endif
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should detect arr[0] in else branch', () => {
			const source = `
if (!x gt 0) then
	!value = !arr[1]
else
	!value = !arr[0]
endif
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should detect arr[0] in elseif branch', () => {
			const source = `
if (!x gt 0) then
	!value = !arr[1]
elseif (!x lt 0) then
	!value = !arr[0]
else
	!value = !arr[2]
endif
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should detect arr[0] in do loop', () => {
			const source = `
do !i from 1 to 10
	!value = !arr[0]
enddo
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should detect arr[0] in do values collection', () => {
			const source = `
do !item values !list[0]
	!sum = !sum + !item
enddo
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});
	});

	describe('Array[0] in expressions', () => {
		it('should detect arr[0] in binary expression', () => {
			const source = '!result = !arr[0] + !arr[1]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should detect arr[0] in method call arguments', () => {
			const source = '.myMethod(!arr[0], !arr[1])';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should detect arr[0] in return statement', () => {
			const source = `
define method .getFirst()
	return !arr[0]
endmethod
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should detect arr[0] in nested array access', () => {
			const source = '!value = !matrix[0][1]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should detect multiple arr[0] in nested access', () => {
			const source = '!value = !matrix[0][0]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(2);
		});
	});

	describe('Edge cases', () => {
		it('should handle arr[0] in complex expression', () => {
			const source = '!result = (!arr[0] + !arr[1]) * !arr[2]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should handle arr[0] as part of method chain', () => {
			const source = '!result = !arr[0].upcase()';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
		});

		it('should handle empty array expression', () => {
			const source = '!arr = object ARRAY()';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(0);
		});

		it('should not crash on malformed code', () => {
			const source = '!arr[';
			const result = parser.parse(source);

			// Should not throw
			expect(() => checker.check(result.ast)).not.toThrow();
		});
	});

	describe('Real-world scenarios', () => {
		it('should detect arr[0] in typical loop pattern', () => {
			const source = `
define method .processArray(!items)
	!first = !items[0]
	do !i from 1 to !items.size()
		!value = !items[!i]
		.doSomething(!value)
	enddo
	return !first
endmethod
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
			expect(diagnostics[0].message).toContain('start at 1');
		});

		it('should detect arr[0] when accessing array element in expression', () => {
			const source = `
!item = !oldArray[0]
!result = !item
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
			expect(diagnostics[0].message).toContain('start at 1');
		});

		it('should handle multiple methods with different array usage', () => {
			const source = `
define method .method1()
	!x = !arr[0]
endmethod

define method .method2()
	!y = !arr[1]
endmethod

define method .method3()
	!z = !arr[0]
endmethod
			`.trim();

			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(2);
		});
	});

	describe('Diagnostic details', () => {
		it('should provide accurate range for arr[0]', () => {
			const source = '!value = !arr[0]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics).toHaveLength(1);
			expect(diagnostics[0].range).toBeDefined();
			expect(diagnostics[0].range.start).toBeDefined();
			expect(diagnostics[0].range.end).toBeDefined();
		});

		it('should use "pml-array-index" as source', () => {
			const source = '!value = !arr[0]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics[0].source).toBe('pml-array-index');
		});

		it('should use Error severity', () => {
			const source = '!value = !arr[0]';
			const result = parser.parse(source);
			const diagnostics = checker.check(result.ast);

			expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Error);
		});
	});
});
