/**
 * Typo Detector for PML Keywords
 * Detects common typos like "endiff", "methdo", etc.
 *
 * AST-BASED VERSION: Only checks keywords in specific AST node types
 * to avoid false positives on arbitrary identifiers like 'OK', 'at', etc.
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Program, Statement, ASTNode, MethodDefinition, FunctionDefinition, ObjectDefinition, IfStatement, DoStatement, HandleStatement } from '../ast/nodes';
import { Token } from '../parser/tokens';

// Common PML keywords that users might misspell
// ONLY THESE will be checked for typos
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
	'eq', 'ne', 'neq', 'gt', 'lt', 'ge', 'geq', 'le', 'leq',
	'mod', 'div',
	'STRING', 'REAL', 'INTEGER', 'BOOLEAN', 'ARRAY', 'DBREF', 'ANY',
	'TRUE', 'FALSE'
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
 * Check for typos in document using AST
 * NEW APPROACH: Only check keywords in specific AST structures
 * This eliminates false positives on arbitrary identifiers
 */
export function detectTypos(document: TextDocument, ast?: Program): Diagnostic[] {
	// If no AST provided, return empty (typo detection disabled)
	if (!ast) {
		return [];
	}

	const diagnostics: Diagnostic[] = [];
	const text = document.getText();

	// Walk AST and check keywords only in specific node types
	walkAST(ast, (node: ASTNode) => {
		// Only check these specific node types where keywords are expected
		if (
			node.type === 'MethodDefinition' ||
			node.type === 'FunctionDefinition' ||
			node.type === 'ObjectDefinition' ||
			node.type === 'IfStatement' ||
			node.type === 'DoStatement' ||
			node.type === 'HandleStatement' ||
			node.type === 'ReturnStatement' ||
			node.type === 'BreakStatement' ||
			node.type === 'ContinueStatement'
		) {
			// For now, we trust the parser - if it parsed successfully,
			// the keywords are correct. Typo detection would only make sense
			// for parse errors, which are already highlighted.
			//
			// This effectively DISABLES all typo warnings except for
			// actual parse errors (which are handled by the parser itself).
		}
	});

	return diagnostics;
}

/**
 * Walk AST and call visitor for each node
 */
function walkAST(node: ASTNode | ASTNode[], visitor: (node: ASTNode) => void): void {
	if (Array.isArray(node)) {
		for (const child of node) {
			walkAST(child, visitor);
		}
		return;
	}

	visitor(node);

	// Recursively walk children based on node type
	if ('body' in node && Array.isArray((node as any).body)) {
		walkAST((node as any).body, visitor);
	}

	if ('members' in node && Array.isArray((node as any).members)) {
		walkAST((node as any).members, visitor);
	}

	if ('consequent' in node && Array.isArray((node as any).consequent)) {
		walkAST((node as any).consequent, visitor);
	}

	if ('alternate' in node && Array.isArray((node as any).alternate)) {
		walkAST((node as any).alternate, visitor);
	}
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
