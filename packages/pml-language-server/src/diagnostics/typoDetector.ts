/**
 * Typo Detector for PML Keywords
 *
 * AST-BASED IMPLEMENTATION:
 * Analyzes parser errors to detect common typos in PML keywords.
 * Only checks tokens that caused parse errors, avoiding false positives.
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ParseError } from '../parser/parser';

// PML keywords that are commonly misspelled
const PML_KEYWORDS = [
	// Control flow
	'if', 'then', 'else', 'elseif', 'endif',
	'do', 'enddo', 'while',
	'for', 'endfor',
	'handle', 'endhandle', 'any', 'values',
	'return', 'break', 'continue',

	// Definitions
	'define', 'endmethod', 'object', 'member',
	'is', 'using', 'setup', 'form',

	// Types
	'string', 'real', 'integer', 'boolean', 'array', 'dbref',

	// Operators
	'and', 'or', 'not', 'eq', 'ne', 'gt', 'lt', 'ge', 'le', 'mod', 'of',

	// Special
	'var', 'global', 'skip', 'compose', 'space'
];

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
	const len1 = str1.length;
	const len2 = str2.length;
	const matrix: number[][] = [];

	// Initialize matrix
	for (let i = 0; i <= len1; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= len2; j++) {
		matrix[0][j] = j;
	}

	// Fill matrix
	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			const cost = str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase() ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,      // deletion
				matrix[i][j - 1] + 1,      // insertion
				matrix[i - 1][j - 1] + cost // substitution
			);
		}
	}

	return matrix[len1][len2];
}

/**
 * Find the closest matching keyword for a potential typo
 */
function findClosestKeyword(word: string): { keyword: string; distance: number } | null {
	let closest: { keyword: string; distance: number } | null = null;
	const wordLower = word.toLowerCase();

	// Only check words that are reasonably close in length
	for (const keyword of PML_KEYWORDS) {
		const lengthDiff = Math.abs(word.length - keyword.length);
		if (lengthDiff > 3) continue; // Skip if too different in length

		const distance = levenshteinDistance(wordLower, keyword);

		// Consider it a potential typo if distance is 1-2 and word is close to keyword
		if (distance > 0 && distance <= 2) {
			if (!closest || distance < closest.distance) {
				closest = { keyword, distance };
			}
		}
	}

	return closest;
}

/**
 * Extract potential typos from parse error context
 * Returns all words from the line that might be misspelled
 */
function extractPotentialTypos(errorMessage: string, line: string): string[] {
	const potentialTypos: string[] = [];

	// Try to find quoted word in error message (this is what parser found)
	const quotedMatch = errorMessage.match(/'([a-zA-Z_][a-zA-Z0-9_]*)'/);
	if (quotedMatch) {
		potentialTypos.push(quotedMatch[1]);
	}

	// Extract all identifiers from the line
	const identifierMatches = line.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g);
	for (const match of identifierMatches) {
		const word = match[1];
		// Skip common variable patterns (!x, $y) and very short words
		if (word.length >= 3 && !potentialTypos.includes(word)) {
			potentialTypos.push(word);
		}
	}

	return potentialTypos;
}

/**
 * Check for typos in document based on parse errors
 *
 * This function analyzes parser errors and suggests corrections for
 * common keyword typos using Levenshtein distance.
 *
 * @param document - The document to check
 * @param parseErrors - Parse errors from the parser
 * @returns Array of typo diagnostics
 */
export function detectTypos(document: TextDocument, parseErrors: ParseError[]): Diagnostic[] {
	const diagnostics: Diagnostic[] = [];

	// If no parse errors, nothing to check
	if (!parseErrors || parseErrors.length === 0) {
		return diagnostics;
	}

	const lines = document.getText().split('\n');

	// Analyze each parse error
	for (const error of parseErrors) {
		// Skip if we don't have position information
		if (!error.token || typeof error.token.line !== 'number') {
			continue;
		}

		const lineIndex = error.token.line - 1;
		if (lineIndex < 0 || lineIndex >= lines.length) {
			continue;
		}

		const line = lines[lineIndex];
		const potentialTypos = extractPotentialTypos(error.message, line);

		if (potentialTypos.length === 0) {
			continue;
		}

		// Check each potential typo to see if it matches a known keyword
		for (const potentialTypo of potentialTypos) {
			const match = findClosestKeyword(potentialTypo);

			if (match) {
				// Found a potential typo!
				const diagnostic: Diagnostic = {
					severity: DiagnosticSeverity.Warning,
					range: {
						start: { line: lineIndex, character: 0 },
						end: { line: lineIndex, character: line.length }
					},
					message: `Possible typo: '${potentialTypo}' might be '${match.keyword}'`,
					source: 'pml-typo'
				};

				// Try to get more precise range if we can find the word in the line
				const wordIndex = line.toLowerCase().indexOf(potentialTypo.toLowerCase());
				if (wordIndex !== -1) {
					diagnostic.range = {
						start: { line: lineIndex, character: wordIndex },
						end: { line: lineIndex, character: wordIndex + potentialTypo.length }
					};
				}

				diagnostics.push(diagnostic);
				// Only report the first typo found on this line to avoid spam
				break;
			}
		}
	}

	return diagnostics;
}
