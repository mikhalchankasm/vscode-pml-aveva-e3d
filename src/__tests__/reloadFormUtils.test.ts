import { describe, expect, it } from 'vitest';
import { buildReloadFormCommand, findFormReloadTargets } from '../reloadFormUtils';

describe('reloadFormUtils', () => {
    it('finds setup and layout form declarations with source lines', () => {
        const text = [
            '-- header',
            'setup form !!Main dialog',
            'exit',
            'layout form !Legacy',
            'exit'
        ].join('\n');

        expect(findFormReloadTargets(text)).toEqual([
            { name: '!!Main', line: 1 },
            { name: '!Legacy', line: 3 }
        ]);
    });

    it('ignores commented declarations and deduplicates names case-insensitively', () => {
        const text = [
            '-- setup form !!Commented',
            '$* layout form !!AlsoCommented',
            'setup form !!Actual',
            'layout form !!actual'
        ].join('\n');

        expect(findFormReloadTargets(text)).toEqual([{ name: '!!Actual', line: 2 }]);
    });

    it('builds the AVEVA reload command without changing the declared name', () => {
        expect(buildReloadFormCommand('!!Sample')).toBe('kill  !!Sample\nshow  !!Sample');
    });
});
