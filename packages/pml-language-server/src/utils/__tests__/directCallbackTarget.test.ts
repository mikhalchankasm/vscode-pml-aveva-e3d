import { describe, expect, it } from 'vitest';

import { directCallbackReference, directCallbackTarget } from '../directCallbackTarget';

describe('directCallbackTarget', () => {
	it('returns the name and arity of a direct callback', () => {
		expect(directCallbackReference('!this.mirrorPlane()')).toEqual({
			name: 'mirrorPlane',
			argumentCount: 0
		});
		expect(directCallbackReference('.apply(!value, !options)')).toEqual({
			name: 'apply',
			argumentCount: 2
		});
	});

	it('ignores commas inside nested expressions and strings', () => {
		expect(directCallbackReference("!this.apply(!values[1, 2], 'left,right', !make(1, 2))")).toEqual({
			name: 'apply',
			argumentCount: 3
		});
	});

	it('rejects malformed or dynamic callback expressions', () => {
		expect(directCallbackReference('!this.apply(!value')).toBeUndefined();
		expect(directCallbackReference('!receiver.apply()')).toBeUndefined();
		expect(directCallbackReference('!this.apply() + !other')).toBeUndefined();
		expect(directCallbackReference('!this.apply(,)')).toBeUndefined();
		expect(directCallbackReference('!this.apply(!value,)')).toBeUndefined();
		expect(directCallbackTarget('|!this.apply()|')).toBeUndefined();
	});

	it('keeps name-only consumers compatible with trailing callback text', () => {
		expect(directCallbackTarget('!this.apply() $* callback note')).toBe('apply');
		expect(directCallbackReference('!this.apply() $* callback note')).toBeUndefined();
	});
});
