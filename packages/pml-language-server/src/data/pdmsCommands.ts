/**
 * PDMS command line starters.
 *
 * These are command starters for manual PDMS/AVEVA command lines that should be
 * treated as a whole physical line instead of parsed as strict PML expressions.
 * Keep entries lowercase. Add only the first command word, not full examples.
 */
export const PDMS_COMMAND_STARTERS = [
	// Already observed in project PML files.
	'autocolour',
	'export',
	'getwork',
	'quit',
	'representation',
	'syscom',
	'tolerance',
	'trace',
	'unclaim',
	'unlock',

	// Common examples from PDMS Commands.pdf.
	'add',
	'aid',
	'alpha',
	'axes',
	'axe',
	'btext',
	'by',
	'col',
	'conn',
	'copy',
	'delete',
	'desp',
	'enhance',
	'include',
	'mark',
	'move',
	'new',
	'plan',
	'plane',
	'pos',
	'prec',
	'q',
	'refresh',
	'rem',
	'repre',
	'repres',
	'rot',
	'rotate',
	'unmark'
] as const;

const PDMS_COMMAND_STARTER_SET = new Set<string>(PDMS_COMMAND_STARTERS);

export function isPdmsCommandStarter(word: string): boolean {
	return PDMS_COMMAND_STARTER_SET.has(word.toLowerCase());
}
