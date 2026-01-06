/**
 * Enhanced Error Messages for PML Parser
 * Provides context-aware error messages with suggestions
 */

import { Token, TokenType } from './tokens';

/**
 * Error context for generating helpful messages
 */
export interface ErrorContext {
	expected: string;
	got: Token;
	context?: 'method' | 'function' | 'object' | 'form' | 'loop' | 'condition' | 'expression' | 'array';
}

/**
 * Generate enhanced error message with suggestions
 */
export function getEnhancedErrorMessage(ctx: ErrorContext): string {
	const { expected, got, context } = ctx;
	const gotValue = got.value || TokenType[got.type] || 'unknown';

	// Base message
	let message = `Expected ${expected}, but found '${gotValue}'`;

	// Add context-specific suggestions
	const suggestion = getSuggestion(expected, got, context);
	if (suggestion) {
		message += `. ${suggestion}`;
	}

	return message;
}

/**
 * Get context-specific suggestion for common errors
 */
function getSuggestion(expected: string, got: Token, context?: string): string | undefined {
	const gotValue = got.value?.toLowerCase() || '';
	const gotType = got.type;

	// Array index errors
	if (expected.includes(']') && gotType === TokenType.NUMBER) {
		const num = parseFloat(got.value);
		if (num === 0) {
			return 'PML arrays are 1-indexed. Use arr[1] for the first element, not arr[0]';
		}
	}

	// Missing parentheses in method calls
	if (expected === "'('" && gotType === TokenType.NEWLINE) {
		return 'Method calls require parentheses: .methodName() or .methodName(!arg)';
	}

	// Missing quotes in strings
	if (expected === 'expression' && (gotType === TokenType.IDENTIFIER || gotType === TokenType.UNKNOWN)) {
		if (/^[a-z]+$/i.test(gotValue) && !isKeyword(gotValue)) {
			return `Did you mean '|${gotValue}|' (string) or !${gotValue} (variable)?`;
		}
	}

	// Common keyword typos
	const typoSuggestion = checkKeywordTypo(gotValue);
	if (typoSuggestion) {
		return `Did you mean '${typoSuggestion}'?`;
	}

	// Method definition errors
	if (context === 'method') {
		if (expected.includes('endmethod')) {
			return 'Every "define method" must end with "endmethod"';
		}
		if (expected.includes('method name')) {
			return 'Method names must start with a dot: .myMethodName';
		}
	}

	// Function definition errors
	if (context === 'function') {
		if (expected.includes('endfunction')) {
			return 'Every "define function" must end with "endfunction"';
		}
		if (expected.includes('function name')) {
			return 'Function names must start with !!: !!myFunction';
		}
	}

	// Object definition errors
	if (context === 'object') {
		if (expected.includes('endobject')) {
			return 'Every "define object" must end with "endobject"';
		}
	}

	// Loop errors
	if (context === 'loop') {
		if (expected.includes('enddo')) {
			return 'Every "do" loop must end with "enddo"';
		}
		if (expected.includes('values') || expected.includes('from')) {
			return 'Use "do !x values !array" or "do !i from 1 to 10"';
		}
	}

	// Condition errors
	if (context === 'condition') {
		if (expected.includes('endif')) {
			return 'Every "if" must end with "endif"';
		}
		if (expected.includes('then')) {
			return 'Use "if <condition> then" syntax';
		}
	}

	// Variable reference errors
	if (expected === 'expression' && gotType === TokenType.IDENTIFIER) {
		return 'Variables must start with ! (local) or !! (global): !' + gotValue;
	}

	// Assignment without variable
	if (gotType === TokenType.ASSIGN && expected === 'expression') {
		return 'Assignment target must be a variable: !varName = value';
	}

	return undefined;
}

/**
 * Check for common keyword typos
 */
function checkKeywordTypo(word: string): string | undefined {
	const typos: Record<string, string> = {
		// Method/Function
		'defne': 'define',
		'defien': 'define',
		'definee': 'define',
		'metod': 'method',
		'methd': 'method',
		'mehtod': 'method',
		'fucntion': 'function',
		'funciton': 'function',
		'funtion': 'function',
		'fucnction': 'function',
		'endmethd': 'endmethod',
		'endmetod': 'endmethod',
		'endfucntion': 'endfunction',
		'endfunciton': 'endfunction',

		// Control flow
		'fi': 'if',
		'esle': 'else',
		'elsefi': 'elseif',
		'elsief': 'elseif',
		'endf': 'endif',
		'ednif': 'endif',
		'thn': 'then',
		'hten': 'then',

		// Loops
		'od': 'do',
		'endo': 'enddo',
		'endd': 'enddo',
		'endoo': 'enddo',
		'vlues': 'values',
		'valeus': 'values',
		'fom': 'from',
		'form': 'from', // common confusion
		'too': 'to',

		// Objects
		'obejct': 'object',
		'objetc': 'object',
		'endobejct': 'endobject',

		// Error handling
		'hadnle': 'handle',
		'handel': 'handle',
		'endhadnle': 'endhandle',

		// Return
		'retrun': 'return',
		'reutrn': 'return',
		'retrn': 'return',

		// Skip/Break
		'sikp': 'skip',
		'braek': 'break',

		// Types
		'stirng': 'STRING',
		'strign': 'STRING',
		'sting': 'STRING',
		'rael': 'REAL',
		'boolen': 'BOOLEAN',
		'bolean': 'BOOLEAN',
		'booelean': 'BOOLEAN',
		'aray': 'ARRAY',
		'arry': 'ARRAY',
		'arrya': 'ARRAY',
	};

	return typos[word];
}

/**
 * Check if a word is a PML keyword
 */
function isKeyword(word: string): boolean {
	const keywords = new Set([
		'define', 'method', 'function', 'object', 'form',
		'endmethod', 'endfunction', 'endobject', 'exit',
		'if', 'then', 'else', 'elseif', 'endif',
		'do', 'enddo', 'values', 'from', 'to', 'by',
		'handle', 'endhandle', 'any', 'none',
		'return', 'skip', 'break',
		'is', 'of', 'eq', 'ne', 'lt', 'gt', 'le', 'ge',
		'and', 'or', 'not',
		'true', 'false', 'unset',
		'string', 'real', 'boolean', 'array', 'dbref',
		'member', 'frame', 'button', 'text', 'option', 'toggle',
		'setup', 'using', 'namespace'
	]);
	return keywords.has(word.toLowerCase());
}

/**
 * Error message templates for common scenarios
 */
export const ErrorTemplates = {
	// Structural errors
	UNCLOSED_METHOD: 'Method definition is not closed. Add "endmethod" at the end.',
	UNCLOSED_FUNCTION: 'Function definition is not closed. Add "endfunction" at the end.',
	UNCLOSED_OBJECT: 'Object definition is not closed. Add "endobject" at the end.',
	UNCLOSED_IF: 'If statement is not closed. Add "endif" at the end.',
	UNCLOSED_DO: 'Do loop is not closed. Add "enddo" at the end.',
	UNCLOSED_HANDLE: 'Handle block is not closed. Add "endhandle" at the end.',

	// Syntax errors
	MISSING_THEN: 'Missing "then" after if condition. Use: if <condition> then',
	MISSING_PAREN: 'Missing parentheses in method/function call',
	MISSING_BRACKET: 'Missing closing bracket "]" for array access',

	// Type errors
	ARRAY_ZERO_INDEX: 'PML arrays are 1-indexed. The first element is arr[1], not arr[0].',
	INVALID_TYPE: 'Invalid type. Valid types: STRING, REAL, BOOLEAN, ARRAY, DBREF',

	// Variable errors
	INVALID_VAR_NAME: 'Variable names must start with ! (local) or !! (global)',
	INVALID_METHOD_NAME: 'Method names must start with a dot: .methodName',
};
