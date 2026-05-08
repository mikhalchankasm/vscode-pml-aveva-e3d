import { describe, expect, it } from 'vitest';
import {
	commentPrintText,
	scanCommentedPMLPrintLines,
	scanPMLPrintLines,
	uncommentPrintText
} from '../../../../../src/printCommandUtils';

describe('PML print command utilities', () => {
	it('should find active print lines and ignore block comments', () => {
		const prints = scanPMLPrintLines([
			'$P active one',
			'$(',
			'$P commented out',
			'$)',
			'  $p active two'
		]);

		expect(prints.map(print => ({ line: print.line, text: print.text }))).toEqual([
			{ line: 0, text: '$P active one' },
			{ line: 4, text: '  $p active two' }
		]);
	});

	it('should handle multiple block comment openers and closers on one line', () => {
		const prints = scanPMLPrintLines([
			'$( closed $) $( still open',
			'$P still commented',
			'$) $P not line-start',
			'$P active'
		]);

		expect(prints.map(print => print.line)).toEqual([3]);
	});

	it('should round-trip commented print lines without touching plain comments', () => {
		const commented = commentPrintText('    $P debug');

		expect(commented).toBe('    $* $P debug');
		expect(uncommentPrintText(commented)).toBe('    $P debug');
		expect(uncommentPrintText('    $* normal comment')).toBe('    $* normal comment');
		expect(scanCommentedPMLPrintLines([commented, '    $* normal comment'])).toHaveLength(1);
	});
});
