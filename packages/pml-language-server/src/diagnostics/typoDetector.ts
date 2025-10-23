/**
 * Typo Detector for PML Keywords
 * Detects common typos like "endiff", "methdo", etc.
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

// Common PML keywords that users might misspell
const PML_KEYWORDS = [
	'define', 'enddefine',
	'method', 'endmethod',
	'function', 'endfunction',
	'object', 'endobject',
	'if', 'then', 'else', 'elseif', 'endif',
	'do', 'enddo',
	'while', 'endwhile',
	'for', 'endfor',
	'handle', 'elsehandle', 'endhandle',
	'setup', 'form', 'frame', 'exit',
	'return', 'break', 'continue', 'goto',
	'values', 'index', 'from', 'to', 'by',
	'member', 'is', 'var',
	'and', 'or', 'not',
	'eq', 'ne', 'gt', 'lt', 'ge', 'le',
	'mod', 'div',
	'STRING', 'REAL', 'INTEGER', 'BOOLEAN', 'ARRAY', 'DBREF', 'ANY',
	'TRUE', 'FALSE'
];

// Valid identifiers that should NOT trigger typo detection
const VALID_IDENTIFIERS = [
	'this',      // Form context: !this
	'ce',        // Current Element
	'world',     // Common variable names
	'owner',
	'name',
	'type',
	'result',
	'error',
	'value',
	'data',
	'item',
	'list',
	'count',
	// Common PML built-in functions/keywords
	'trace',     // trace on/off
	'off',       // trace off
	'on',        // trace on
	'of',        // of operator (e.g., "name of zone")
	'file',      // file operations
	'zone',      // zone attribute
	'clock',     // clock type
	'namn',      // AVEVA attribute (name in Swedish)
	'flnn'       // AVEVA attribute (full name)
];

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					matrix[i][j - 1] + 1,     // insertion
					matrix[i - 1][j] + 1      // deletion
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

/**
 * Find closest matching keyword
 */
function findClosestKeyword(word: string): { keyword: string; distance: number } | null {
	const lowerWord = word.toLowerCase();
	let closest: { keyword: string; distance: number } | null = null;

	for (const keyword of PML_KEYWORDS) {
		const distance = levenshteinDistance(lowerWord, keyword.toLowerCase());

		// Only suggest if distance is small (1-2 characters different)
		if (distance <= 2 && distance > 0) {
			if (!closest || distance < closest.distance) {
				closest = { keyword, distance };
			}
		}
	}

	return closest;
}

/**
 * Check for typos in document
 */
export function detectTypos(document: TextDocument): Diagnostic[] {
	const diagnostics: Diagnostic[] = [];
	const text = document.getText();
	const lines = text.split(/\r?\n/);

	// Pattern to match identifiers (not variables, not methods, not strings)
	const identifierPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex];

		// Skip comments
		if (line.trim().startsWith('--') || line.trim().startsWith('$*')) {
			continue;
		}

		// Skip strings
		const withoutStrings = line.replace(/\|[^|]*\|/g, '').replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');

		let match;
		while ((match = identifierPattern.exec(withoutStrings)) !== null) {
			const word = match[1];
			const startColumn = match.index;

			// Skip single character identifiers (likely part of names like Шифр_комплекта)
			if (word.length === 1) {
				continue;
			}

			// Skip variables (start with !)
			if (withoutStrings[startColumn - 1] === '!') {
				continue;
			}

			// Skip method calls (preceded by .)
			if (withoutStrings[startColumn - 1] === '.') {
				continue;
			}

			// Skip $P, $*, $$ directives
			if (withoutStrings[startColumn - 1] === '$') {
				continue;
			}

			// Skip attribute access (preceded by :)
			if (withoutStrings[startColumn - 1] === ':') {
				continue;
			}

			// Check if it's a known keyword (case-insensitive)
			const isKnownKeyword = PML_KEYWORDS.some(kw => kw.toLowerCase() === word.toLowerCase());

			if (isKnownKeyword) {
				continue; // Valid keyword, no typo
			}

			// Check if it's a valid identifier that should be ignored
			const isValidIdentifier = VALID_IDENTIFIERS.some(id => id.toLowerCase() === word.toLowerCase());

			if (isValidIdentifier) {
				continue; // Known valid identifier, no typo
			}

			// Only check for typos if word is VERY similar to a keyword (distance <= 2)
			const closest = findClosestKeyword(word);

			if (closest && closest.distance <= 2) {
				diagnostics.push({
					severity: DiagnosticSeverity.Warning,
					range: {
						start: { line: lineIndex, character: startColumn },
						end: { line: lineIndex, character: startColumn + word.length }
					},
					message: `Possible typo: '${word}'. Did you mean '${closest.keyword}'?`,
					source: 'pml-typo-detector'
				});
			}
		}
	}

	return diagnostics;
}

/**
 * Common typos and their corrections
 */
export const COMMON_TYPOS: Record<string, string> = {
	'endiff': 'endif',
	'enddif': 'endif',
	'endfi': 'endif',
	'methdo': 'method',
	'mehtod': 'method',
	'metod': 'method',
	'endmethdo': 'endmethod',
	'endmehtod': 'endmethod',
	'endmetod': 'endmethod',
	'objet': 'object',
	'objct': 'object',
	'endobjet': 'endobject',
	'endobjct': 'endobject',
	'handl': 'handle',
	'hendle': 'handle',
	'endhandl': 'endhandle',
	'endhendle': 'endhandle',
	'retrun': 'return',
	'retur': 'return',
	'contineu': 'continue',
	'continu': 'continue',
	'brake': 'break',
	'breka': 'break',
	'valeus': 'values',
	'vlaues': 'values',
	'indx': 'index',
	'idex': 'index'
};
