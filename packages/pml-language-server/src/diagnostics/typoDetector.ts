/**
 * Typo Detector for PML Keywords
 *
 * AST-BASED IMPLEMENTATION:
 * Currently DISABLED - we trust the parser to catch actual syntax errors.
 * Typo detection on arbitrary identifiers causes too many false positives.
 *
 * Future: Could be re-enabled for specific parse error cases.
 */

import { Diagnostic } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Program } from '../ast/nodes';

/**
 * Check for typos in document using AST
 *
 * CURRENTLY DISABLED: Returns empty array.
 * The parser already highlights syntax errors, which catches actual typos.
 * Checking arbitrary identifiers leads to false positives (UI labels, etc.)
 *
 * @param document - The document to check
 * @param ast - Parsed AST (currently unused)
 * @returns Empty array (typo detection disabled)
 */
export function detectTypos(document: TextDocument, ast?: Program): Diagnostic[] {
	// Typo detection is currently disabled.
	// The parser catches real syntax errors (e.g., "endiff" instead of "endif").
	// Heuristic checking of arbitrary identifiers causes too many false positives.
	return [];
}
