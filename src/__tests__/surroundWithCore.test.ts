import { describe, expect, it } from 'vitest';
import { PML_SURROUND_PRESETS, surroundPmlLines } from '../surroundWithCore';

describe('PML Surround With transforms', () => {
	it('wraps selected lines in MARKDB while preserving relative indentation', () => {
		const preset = PML_SURROUND_PRESETS.find(candidate => candidate.id === 'markdb')!;
		const source = [
			'    !item = !items[1]',
			'    if (!item.set()) then',
			'        !item.delete()',
			'    endif'
		].join('\n');

		expect(surroundPmlLines(source, preset, '\n', '    ')).toBe([
			"    markdb ''",
			'        !item = !items[1]',
			'        if (!item.set()) then',
			'            !item.delete()',
			'        endif',
			'    endmarkdb'
		].join('\n'));
	});

	it('wraps a DO block with CRLF and tab indentation', () => {
		const preset = PML_SURROUND_PRESETS.find(candidate => candidate.id === 'do')!;

		expect(surroundPmlLines('\t!value = 1\r\n\t!next = 2', preset, '\r\n', '\t')).toBe([
			'\tdo',
			'\t\t!value = 1',
			'\t\t!next = 2',
			'\tenddo'
		].join('\r\n'));
	});

	it('keeps blank selected lines inside the generated block', () => {
		const preset = PML_SURROUND_PRESETS[0];

		expect(surroundPmlLines('!first = 1\n\n!second = 2', preset, '\n', '  ')).toBe([
			"markdb ''",
			'  !first = 1',
			'',
			'  !second = 2',
			'endmarkdb'
		].join('\n'));
	});
});
