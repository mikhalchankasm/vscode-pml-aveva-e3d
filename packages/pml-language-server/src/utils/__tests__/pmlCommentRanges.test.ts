import { describe, expect, it } from 'vitest';
import { collectPmlInactiveTextRanges, isCursorInsidePmlInactiveText } from '../pmlCommentRanges';

function isInactiveAtCursor(text: string, cursorOffset: number): boolean {
	return isCursorInsidePmlInactiveText(text, collectPmlInactiveTextRanges(text), cursorOffset);
}

describe('pmlCommentRanges', () => {
	it('treats cursors inside open inactive text as inactive', () => {
		expect(isInactiveAtCursor('!text = "abc', '!text = "abc'.length)).toBe(true);
		expect(isInactiveAtCursor('!text = |abc', '!text = |abc'.length)).toBe(true);
		expect(isInactiveAtCursor('-- comment', '-- comment'.length)).toBe(true);
		expect(isInactiveAtCursor('$( comment', '$( comment'.length)).toBe(true);
	});

	it('treats cursors after closed delimiters as active', () => {
		expect(isInactiveAtCursor('!text = "abc"', '!text = "abc"'.length)).toBe(false);
		expect(isInactiveAtCursor('!text = |abc|', '!text = |abc|'.length)).toBe(false);
		expect(isInactiveAtCursor('$( comment $)', '$( comment $)'.length)).toBe(false);
	});

	it('treats the start of a line after a line comment as active', () => {
		const text = '-- comment\n!value = 1';

		expect(isInactiveAtCursor(text, '-- comment\n'.length)).toBe(false);
	});
});
