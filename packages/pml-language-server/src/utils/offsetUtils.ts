/**
 * Offset Utilities - Shared functions for converting between offsets and positions
 * Used by references and rename providers for consistent CRLF handling
 */

import { Range } from 'vscode-languageserver/node';

export interface Position {
	line: number;
	character: number;
}

/**
 * Pre-compute line start offsets for O(1) offset-to-position conversion
 * Handles both LF and CRLF line endings correctly
 */
export function computeLineOffsets(text: string): number[] {
	const offsets: number[] = [0];  // First line starts at offset 0
	for (let i = 0; i < text.length; i++) {
		if (text[i] === '\n') {
			offsets.push(i + 1);
		} else if (text[i] === '\r') {
			// Handle CRLF
			if (text[i + 1] === '\n') {
				i++;  // Skip the \n
			}
			offsets.push(i + 1);
		}
	}
	return offsets;
}

/**
 * Convert offset to Position using pre-computed line offsets (binary search)
 * O(log n) complexity
 */
export function offsetToPosition(lineOffsets: number[], offset: number): Position {
	// Binary search for the line
	let low = 0;
	let high = lineOffsets.length - 1;
	while (low < high) {
		const mid = Math.ceil((low + high) / 2);
		if (lineOffsets[mid] > offset) {
			high = mid - 1;
		} else {
			low = mid;
		}
	}
	return { line: low, character: offset - lineOffsets[low] };
}

/**
 * Convert offset range to LSP Range using pre-computed line offsets
 */
export function offsetToRange(lineOffsets: number[], startOffset: number, endOffset: number): Range {
	return {
		start: offsetToPosition(lineOffsets, startOffset),
		end: offsetToPosition(lineOffsets, endOffset)
	};
}
