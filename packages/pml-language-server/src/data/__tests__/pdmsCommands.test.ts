import { describe, expect, it } from 'vitest';
import { getPdmsCommand, isPdmsCommandStarter, PDMS_COMMANDS, PDMS_COMMAND_STARTERS } from '../pdmsCommands';

describe('PDMS command data', () => {
	it('keeps command starters lowercase and unique', () => {
		const uniqueNames = new Set(PDMS_COMMAND_STARTERS);

		expect(uniqueNames.size).toBe(PDMS_COMMAND_STARTERS.length);
		expect(PDMS_COMMAND_STARTERS.every(name => name === name.toLowerCase())).toBe(true);
	});

	it('exposes categorized command metadata for hover and parser use', () => {
		const move = getPdmsCommand('MOVE');

		expect(move).toBeDefined();
		expect(move?.category).toBe('model');
		expect(move?.brief.length).toBeGreaterThan(0);
		expect(isPdmsCommandStarter('move')).toBe(true);
		expect(PDMS_COMMANDS.every(command => command.category && command.brief)).toBe(true);
	});

	it('documents common Q query forms in the generic command hover data', () => {
		const query = getPdmsCommand('Q');

		expect(query?.brief).toContain('Q VAR');
		expect(query?.brief).toContain('Q ATT [AS ANY | <type>]');
	});

	it('includes selected Common Commands starters from AVEVA UE help page 628', () => {
		expect(getPdmsCommand('PARAGON')?.category).toBe('system');
		expect(getPdmsCommand('SPECONMODE')?.category).toBe('system');
		expect(getPdmsCommand('FINISH')?.category).toBe('system');
		expect(isPdmsCommandStarter('paragon')).toBe(true);
		expect(isPdmsCommandStarter('speconmode')).toBe(true);
		expect(isPdmsCommandStarter('finish')).toBe(true);
	});
});
