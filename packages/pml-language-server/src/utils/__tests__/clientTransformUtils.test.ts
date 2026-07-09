import { describe, expect, it } from 'vitest';
import { addToArrayText, reindexArrayText } from '../../../../../src/arrayCommandsCore';
import { extractMethodBlocksFromText } from '../../../../../src/commands/sortMethodsCore';
import { alignAssignmentsText } from '../../../../../src/formatterCore';
import {
	leadingSpacesToTabsText,
	removeDuplicateLinesText,
	removeEmptyLinesText,
	sortLinesAscText,
	trimTrailingWhitespaceText
} from '../../../../../src/lineCommandsCore';

describe('client text transform utilities', () => {
	it('does not treat equals signs inside PML string literals as assignments', () => {
		const text = [
			'!short = 1',
			'button .b |Save=OK|',
			'!longName = 2'
		].join('\n');

		expect(alignAssignmentsText(text)).toBe([
			'!short = 1',
			'button .b |Save=OK|',
			'!longName = 2'
		].join('\n'));
	});

	it('still aligns real assignments whose values contain equals signs in strings', () => {
		const text = [
			'!a = |x=y|',
			'!longName = 2'
		].join('\n');

		expect(alignAssignmentsText(text)).toBe([
			'!a        = |x=y|',
			'!longName = 2'
		].join('\n'));
	});

	it('keeps preceding method comments without duplicating them', () => {
		const text = [
			'-- first comment',
			'-- second comment',
			'$* third comment',
			'define method .zeta()',
			'endmethod'
		].join('\n');

		const methods = extractMethodBlocksFromText(text);

		expect(methods).toHaveLength(1);
		expect(methods[0].precedingComments).toBe([
			'-- first comment',
			'-- second comment',
			'$* third comment'
		].join('\n'));
	});

	it('reindexes each selected array without replacing later array names', () => {
		const text = [
			'!first[10] = |a|',
			'!second[20] = |b|'
		].join('\n');

		expect(reindexArrayText(text)).toBe([
			'!first[1] = |a|',
			'!second[2] = |b|'
		].join('\n'));
	});

	it('preserves CRLF when reindexing arrays', () => {
		const text = '!first[10] = |a|\r\n!second[20] = |b|';

		expect(reindexArrayText(text)).toBe('!first[1] = |a|\r\n!second[2] = |b|');
	});

	it('adds array items in place without converting comments into elements', () => {
		const text = [
			'!items[1] = |existing|',
			'-- keep this comment',
			'first new value',
			'$* keep this comment too',
			'$(',
			'block comment line',
			'$)',
			'second new value'
		].join('\n');

		expect(addToArrayText(text)).toEqual({
			added: 2,
			text: [
				'!items[1] = |existing|',
				'-- keep this comment',
				"!items[2] = 'first new value'",
				'$* keep this comment too',
				'$(',
				'block comment line',
				'$)',
				"!items[3] = 'second new value'"
			].join('\n')
		});
	});

	it('preserves block order and CRLF when adding array items', () => {
		const text = '!items[9] = /existing\r\nfirst\r\n-- comment\r\n!items[10] = /later\r\nsecond';

		expect(addToArrayText(text)).toEqual({
			added: 2,
			text: '!items[9] = /existing\r\n!items[11] = /first\r\n-- comment\r\n!items[10] = /later\r\n!items[12] = /second'
		});
	});

	it('removes empty CRLF lines without leaving carriage returns behind', () => {
		const result = removeEmptyLinesText('!a = 1\r\n\r\n!b = 2');

		expect(result.text).toBe('!a = 1\r\n!b = 2');
		expect(result.removed).toBe(1);
	});

	it('deduplicates CRLF lines without treating carriage returns as content', () => {
		const result = removeDuplicateLinesText('!a = 1\r\n!b = 2\r\n!a = 1');

		expect(result.text).toBe('!a = 1\r\n!b = 2');
		expect(result.removed).toBe(1);
	});

	it('preserves CRLF when sorting and trimming line commands', () => {
		expect(sortLinesAscText('!b = 2\r\n!a = 1')).toBe('!a = 1\r\n!b = 2');
		expect(trimTrailingWhitespaceText('!a = 1  \r\n!b = 2\t')).toBe('!a = 1\r\n!b = 2');
	});

	it('preserves CRLF when converting leading spaces to tabs', () => {
		expect(leadingSpacesToTabsText('    !a = 1\r\n  !b = 2', 4)).toBe('\t!a = 1\r\n  !b = 2');
	});

	it('falls back to a safe indent size when converting spaces to tabs', () => {
		expect(leadingSpacesToTabsText('    !a = 1', 0)).toBe('\t!a = 1');
		expect(leadingSpacesToTabsText('    !a = 1', Number.NaN)).toBe('\t!a = 1');
	});
});
