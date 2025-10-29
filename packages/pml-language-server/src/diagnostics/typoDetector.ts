/**
 * Typo Detector for PML Keywords
 *
 * PARSE-ERROR-BASED IMPLEMENTATION:
 * Analyzes parser errors to detect common typos in PML keywords using Levenshtein distance.
 * Only checks tokens that caused parse errors, avoiding false positives on valid identifiers.
 *
 * Algorithm:
 * - Receives ParseError[] from parser
 * - Extracts identifiers from error lines
 * - Compares against 40+ known PML keywords using edit distance
 * - Suggests corrections for typos with distance 1-2
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ParseError } from '../parser/parser';
import { KEYWORDS } from '../parser/tokens';

// PML keywords that are commonly misspelled - loaded from authoritative tokens.ts
const PML_KEYWORDS = Object.keys(KEYWORDS).map(k => k.toLowerCase());

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
 * Uses smart scoring to prefer the most likely match:
 * 1. Shorter edit distance is better
 * 2. When distances are equal, prefer similar-length keywords
 * 3. When both are equal, prefer longer keywords (less ambiguous)
 */
function findClosestKeyword(word: string): { keyword: string; distance: number } | null {
	let closest: { keyword: string; distance: number; score: number } | null = null;
	const wordLower = word.toLowerCase();

	// Only check words that are reasonably close in length
	for (const keyword of PML_KEYWORDS) {
		const lengthDiff = Math.abs(word.length - keyword.length);
		if (lengthDiff > 3) continue; // Skip if too different in length

		const distance = levenshteinDistance(wordLower, keyword);

		// Consider it a potential typo if distance is 1-2 and word is close to keyword
		if (distance > 0 && distance <= 2) {
			// Calculate a score: lower is better
			// Primary: distance (0-2)
			// Secondary: length difference (0-3)
			// Tertiary: prefer longer keywords (negate keyword length)
			const score = distance * 100 + lengthDiff * 10 - keyword.length;

			if (!closest || score < closest.score) {
				closest = { keyword, distance, score };
			}
		}
	}

	return closest ? { keyword: closest.keyword, distance: closest.distance } : null;
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

	const lines = document.getText().split(/\r?\n/);
	const reportedLines = new Set<number>(); // Track lines we've already reported typos for

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

		// Skip if we already reported a typo for this line
		if (reportedLines.has(lineIndex)) {
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
				// Try to get precise range using document positions (handles tabs/multibyte correctly)
				const wordIndex = line.toLowerCase().indexOf(potentialTypo.toLowerCase());

				let startPos, endPos;
				if (wordIndex !== -1) {
					// Calculate byte offset for the line start
					const lineStartOffset = document.offsetAt({ line: lineIndex, character: 0 });
					const wordStartOffset = lineStartOffset + wordIndex;
					const wordEndOffset = wordStartOffset + potentialTypo.length;

					// Convert byte offsets to positions (handles tabs/multibyte)
					startPos = document.positionAt(wordStartOffset);
					endPos = document.positionAt(wordEndOffset);
				} else {
					// Fallback: highlight whole line
					startPos = { line: lineIndex, character: 0 };
					endPos = document.positionAt(document.offsetAt({ line: lineIndex + 1, character: 0 }) - 1);
				}

				const diagnostic: Diagnostic = {
					severity: DiagnosticSeverity.Warning,
					range: {
						start: startPos,
						end: endPos
					},
					message: `Possible typo: '${potentialTypo}' might be '${match.keyword}'`,
					source: 'pml-typo'
				};

				diagnostics.push(diagnostic);
				reportedLines.add(lineIndex); // Mark this line as reported
				// Only report the first typo found on this line to avoid spam
				break;
			}
		}
	}

	return diagnostics;
}
