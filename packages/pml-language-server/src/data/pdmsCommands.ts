export type PdmsCommandCategory = 'navigation' | 'query' | 'model' | 'drawing' | 'system';

export interface PdmsCommandDefinition {
	name: string;
	category: PdmsCommandCategory;
	brief: string;
}

/**
 * PDMS command line starters.
 *
 * These are command starters for manual PDMS/AVEVA command lines that should be
 * treated as a whole physical line instead of parsed as strict PML expressions.
 * Keep entries lowercase. Add only the first command word, not full examples.
 */
export const PDMS_COMMANDS: readonly PdmsCommandDefinition[] = [
	// Already observed in project PML files.
	{ name: '$m', category: 'system', brief: 'Runs or loads a PML macro file from the command stream.' },
	{ name: 'autocolour', category: 'drawing', brief: 'Applies or removes automatic colour representation settings.' },
	{ name: 'call', category: 'system', brief: 'Calls a PML function or command from command-style syntax.' },
	{ name: 'export', category: 'system', brief: 'Exports model data or configured output from the current session.' },
	{ name: 'exit', category: 'system', brief: 'Leaves the current command mode or AVEVA module context.' },
	{ name: 'getwork', category: 'system', brief: 'Gets the current writable work context.' },
	{ name: 'goto', category: 'navigation', brief: 'Navigates to a database element or module context.' },
	{ name: 'import', category: 'system', brief: 'Imports an external PML module, .NET control, or support file.' },
	{ name: 'kill', category: 'system', brief: 'Closes or removes a form, command object, or session object.' },
	{ name: 'map', category: 'system', brief: 'Runs spatial map or database map commands from the command stream.' },
	{ name: 'ori', category: 'model', brief: 'Sets model element orientation from command-style syntax.' },
	{ name: 'pml', category: 'system', brief: 'Runs PML command actions such as loading forms or macros.' },
	{ name: 'quit', category: 'system', brief: 'Leaves the current module or command context.' },
	{ name: 'representation', category: 'drawing', brief: 'Sets or queries graphical representation options.' },
	{ name: 'system', category: 'system', brief: 'Runs AVEVA system/display commands from command-style syntax.' },
	{ name: 'syscom', category: 'system', brief: 'Runs a system command from the PML command stream.' },
	{ name: 'tolerance', category: 'model', brief: 'Sets tolerance values used by later modelling commands.' },
	{ name: 'trace', category: 'system', brief: 'Enables or disables trace output.' },
	{ name: 'claim', category: 'system', brief: 'Claims database elements for modification.' },
	{ name: 'unclaim', category: 'system', brief: 'Releases claimed database elements.' },
	{ name: 'unlock', category: 'system', brief: 'Unlocks locked database elements or command state.' },
	{ name: 'using', category: 'system', brief: 'Declares a namespace or external API scope for subsequent PML/.NET calls.' },

	// Common examples from PDMS Commands.pdf.
	{ name: 'add', category: 'model', brief: 'Adds an element, item, or selection to the current context.' },
	{ name: 'aid', category: 'drawing', brief: 'Controls aid graphics or drafting aids.' },
	{ name: 'alpha', category: 'drawing', brief: 'Controls alpha or transparency-related display settings.' },
	{ name: 'axes', category: 'drawing', brief: 'Controls axes display or axes-related commands.' },
	{ name: 'axe', category: 'drawing', brief: 'Controls an axis or axes-related command variant.' },
	{ name: 'btext', category: 'drawing', brief: 'Creates or modifies block text.' },
	{ name: 'by', category: 'navigation', brief: 'Supplies a relative movement or selection qualifier.' },
	{ name: 'col', category: 'drawing', brief: 'Sets colour or colour-related representation.' },
	{ name: 'conn', category: 'model', brief: 'Connects model elements or connection references.' },
	{ name: 'copy', category: 'model', brief: 'Copies elements or data in the active context.' },
	{ name: 'delete', category: 'model', brief: 'Deletes elements or data in the active context.' },
	{ name: 'desp', category: 'drawing', brief: 'Controls display or descriptive drawing output.' },
	{ name: 'enhance', category: 'drawing', brief: 'Adjusts enhanced graphical display settings.' },
	{ name: 'include', category: 'system', brief: 'Includes an external command or macro file.' },
	{ name: 'mark', category: 'drawing', brief: 'Marks elements or positions in the display.' },
	{ name: 'move', category: 'model', brief: 'Moves the current element or selection.' },
	{ name: 'new', category: 'model', brief: 'Creates a new element in the current context.' },
	{ name: 'options', category: 'system', brief: 'Sets or restores command options for the current module.' },
	{ name: 'plan', category: 'drawing', brief: 'Selects or configures a plan view.' },
	{ name: 'plane', category: 'drawing', brief: 'Selects or configures a working plane.' },
	{ name: 'pos', category: 'navigation', brief: 'Sets, queries, or uses a position.' },
	{ name: 'prec', category: 'system', brief: 'Sets precision for numeric output or commands.' },
	{ name: 'q', category: 'query', brief: 'Queries the current element, attribute, or command state.' },
	{ name: 'refresh', category: 'drawing', brief: 'Refreshes the display or current view.' },
	{ name: 'rem', category: 'system', brief: 'Adds a command-stream remark or comment.' },
	{ name: 'repre', category: 'drawing', brief: 'Short form for representation commands.' },
	{ name: 'repres', category: 'drawing', brief: 'Short form for representation commands.' },
	{ name: 'rot', category: 'model', brief: 'Rotates the current element, view, or selection.' },
	{ name: 'rotate', category: 'model', brief: 'Rotates the current element, view, or selection.' },
	{ name: 'show', category: 'system', brief: 'Shows a form or command UI, optionally at a screen position.' },
	{ name: 'unenhance', category: 'drawing', brief: 'Removes enhanced graphical display settings from elements or classes.' },
	{ name: 'unmark', category: 'drawing', brief: 'Removes marks from elements or display positions.' },
	{ name: 'world', category: 'navigation', brief: 'Returns command context to the world element.' }
] as const;

export const PDMS_COMMAND_STARTERS = PDMS_COMMANDS.map(command => command.name);

const PDMS_COMMAND_BY_NAME = new Map<string, PdmsCommandDefinition>(
	PDMS_COMMANDS.map(command => [command.name, command])
);

export function isPdmsCommandStarter(word: string): boolean {
	return PDMS_COMMAND_BY_NAME.has(word.toLowerCase());
}

export function getPdmsCommand(word: string): PdmsCommandDefinition | undefined {
	return PDMS_COMMAND_BY_NAME.get(word.toLowerCase());
}
