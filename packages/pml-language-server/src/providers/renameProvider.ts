/**
 * Rename Provider - Rename Symbol (F2)
 * Provides symbol renaming for methods, objects, forms, and variables.
 * User-defined methods are file-scoped; objects, forms, and global variables remain workspace-scoped.
 */

import {
	RenameParams,
	WorkspaceEdit,
	TextEdit,
	TextDocuments,
	PrepareRenameParams,
	Range
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import * as fs from 'fs/promises';
import { SymbolIndex } from '../index/symbolIndex';
import { computeLineOffsets, offsetToRange } from '../utils/offsetUtils';
import { createMethodRenamePatterns, escapeRegex } from '../utils/methodReferencePatterns';
import {
	collectPmlInactiveTextRanges,
	collectPmlMethodReferenceIgnoredRanges,
	findTextRangeContaining,
	isOffsetInTextRanges,
	TextRange
} from '../utils/pmlCommentRanges';

export class RenameProvider {
	constructor(
		private symbolIndex: SymbolIndex,
		private documents: TextDocuments<TextDocument>
	) {}

	/**
	 * Prepare rename - validate that rename is possible at this location
	 * Returns the range of the symbol to be renamed
	 */
	public prepareRename(params: PrepareRenameParams): { range: Range; placeholder: string } | null {
		const document = this.documents.get(params.textDocument.uri);
		if (!document) return null;

		const wordRange = this.getWordRangeAtPosition(document, params.position);
		if (!wordRange) return null;

		const word = document.getText(wordRange);

		// Check if it's a valid symbol to rename
		const symbolName = this.extractSymbolName(word);
		if (!symbolName) return null;

		// Check if symbol exists in index (method, function, object, form, or variable)
		const functions = this.isGlobalFunctionSymbolAt(document, wordRange, symbolName)
			? this.symbolIndex.findFunction(symbolName)
			: [];
		const methods = functions.length > 0 ? [] : this.symbolIndex.findMethodsInFile(document.uri, symbolName);
		const objects = functions.length > 0 ? [] : this.symbolIndex.findObject(symbolName);
		const forms = functions.length > 0 ? [] : this.symbolIndex.findForm(symbolName);
		// Only treat as variable if it's !var without a method call (!obj.method is a method call)
		const isVariable = functions.length === 0 && word.startsWith('!') && !word.includes('.');

		// If not a known symbol and not a variable, can't rename
		if (methods.length === 0 && functions.length === 0 && objects.length === 0 && forms.length === 0 && !isVariable) {
			return null;
		}

		return {
			range: wordRange,
			placeholder: word
		};
	}

	/**
	 * Perform rename - return all text edits needed
	 */
	public async provide(params: RenameParams): Promise<WorkspaceEdit | null> {
		const document = this.documents.get(params.textDocument.uri);
		if (!document) return null;

		const wordRange = this.getWordRangeAtPosition(document, params.position);
		if (!wordRange) return null;

		const word = document.getText(wordRange);
		const newName = params.newName;

		// Validate new name
		if (!this.isValidName(word, newName)) {
			return null;
		}

		const symbolName = this.extractSymbolName(word);
		if (!symbolName) return null;

		const changes: { [uri: string]: TextEdit[] } = {};

		// Check what kind of symbol we're renaming
		const functions = this.isGlobalFunctionSymbolAt(document, wordRange, symbolName)
			? this.symbolIndex.findFunction(symbolName)
			: [];
		const methods = functions.length > 0 ? [] : this.symbolIndex.findMethodsInFile(document.uri, symbolName);
		const objects = functions.length > 0 ? [] : this.symbolIndex.findObject(symbolName);
		const forms = functions.length > 0 ? [] : this.symbolIndex.findForm(symbolName);
		// Only treat as variable if it's !var without a method call (!obj.method is a method call)
		const isVariable = functions.length === 0 && word.startsWith('!') && !word.includes('.');

		if (methods.length > 0) {
			// Renaming a method
			await this.collectMethodRenames(document.uri, symbolName, newName, changes);
		} else if (functions.length > 0) {
			// Renaming a global function
			await this.collectFunctionRenames(symbolName, newName, changes);
		} else if (objects.length > 0) {
			// Renaming an object
			await this.collectObjectRenames(symbolName, newName, changes);
		} else if (forms.length > 0) {
			// Renaming a form
			await this.collectFormRenames(symbolName, newName, changes);
		} else if (isVariable) {
			// Renaming a variable
			await this.collectVariableRenames(document, word, newName, changes);
		} else {
			return null;
		}

		return { changes };
	}

	/**
	 * Collect all edits needed to rename a method
	 */
	private async collectMethodRenames(
		fileUri: string,
		oldName: string,
		newName: string,
		changes: { [uri: string]: TextEdit[] }
	): Promise<void> {
		// Extract new name without leading dot if present
		const newMethodName = newName.startsWith('.') ? newName.substring(1) : newName;

		const indexedEditsByUri = this.groupTextEditsByUri(
			this.symbolIndex
				.findMethodReferencesInFile(fileUri, oldName)
				.map(reference => ({
					uri: reference.uri,
					edit: TextEdit.replace(reference.range, newMethodName)
				}))
		);

		const text = await this.getFileText(fileUri);
		if (!text) return;

		const edits = this.deduplicateTextEdits([
			...(indexedEditsByUri.get(fileUri) ?? []),
			...this.findAndReplaceMethod(text, oldName, newMethodName)
		]);
		if (edits.length > 0) {
			changes[fileUri] = edits;
		}
	}

	private async collectFunctionRenames(
		oldName: string,
		newName: string,
		changes: { [uri: string]: TextEdit[] }
	): Promise<void> {
		const fullNewName = this.normalizeGlobalFunctionName(newName);
		const editsByUri = this.groupTextEditsByUri(
			this.symbolIndex
				.findFunctionReferences(oldName)
				.map(reference => ({
					uri: reference.uri,
					edit: TextEdit.replace(reference.range, fullNewName)
				}))
		);

		for (const func of this.symbolIndex.findFunction(oldName)) {
			const text = await this.getFileText(func.uri);
			if (!text) {
				continue;
			}
			const edits = editsByUri.get(func.uri) ?? [];
			edits.push(...this.findAndReplaceFunctionDefinitions(text, oldName, fullNewName));
			const uniqueEdits = this.deduplicateTextEdits(edits);
			if (uniqueEdits.length > 0) {
				changes[func.uri] = uniqueEdits;
			}
		}

		for (const [uri, edits] of editsByUri) {
			if (changes[uri]) {
				continue;
			}
			const uniqueEdits = this.deduplicateTextEdits(edits);
			if (uniqueEdits.length > 0) {
				changes[uri] = uniqueEdits;
			}
		}
	}

	private findAndReplaceFunctionDefinitions(text: string, oldName: string, newName: string): TextEdit[] {
		const edits: TextEdit[] = [];
		const preFilterPattern = new RegExp(escapeRegex(oldName), 'i');
		if (!preFilterPattern.test(text)) {
			return edits;
		}

		const pattern = new RegExp(`(^[ \\t]*define\\s+function\\s+)!!${escapeRegex(oldName)}(?=\\s*\\()`, 'gmi');
		let lineOffsets: number[] | null = null;
		let ignoredRanges: TextRange[] | null = null;

		let match;
		while ((match = pattern.exec(text)) !== null) {
			const prefix = match[1];
			const startOffset = match.index + prefix.length;
			if (!ignoredRanges) {
				ignoredRanges = collectPmlInactiveTextRanges(text);
			}
			if (isOffsetInTextRanges(ignoredRanges, startOffset)) {
				continue;
			}
			if (!lineOffsets) {
				lineOffsets = computeLineOffsets(text);
			}

			const endOffset = startOffset + oldName.length + 2;
			edits.push(TextEdit.replace(offsetToRange(lineOffsets, startOffset, endOffset), newName));
		}

		return edits;
	}

	/**
	 * Find and replace method references in text
	 */
	private findAndReplaceMethod(text: string, oldName: string, newName: string): TextEdit[] {
		const edits: TextEdit[] = [];

		// Quick pre-filter: skip if symbol is absent (optimization)
		// Use case-insensitive regex test to avoid text.toLowerCase() allocation
		const preFilterPattern = new RegExp(escapeRegex(oldName), 'i');
		if (!preFilterPattern.test(text)) {
			return edits;
		}

		// Lazy line offsets: only compute on first match
		let lineOffsets: number[] | null = null;
		let ignoredRanges: TextRange[] | null = null;

		const patterns = createMethodRenamePatterns(oldName);
		const foundOffsets = new Set<number>();

		for (const pattern of patterns) {
			let match;
			while ((match = pattern.exec(text)) !== null) {
				// Find the position of the method name within the match
				const matchText = match[0];
				const lowerMatch = matchText.toLowerCase();
				const lowerOldName = oldName.toLowerCase();
				const methodNameIndex = lowerMatch.lastIndexOf(lowerOldName);
				const startOffset = match.index + methodNameIndex;
				if (!ignoredRanges) {
					ignoredRanges = collectPmlMethodReferenceIgnoredRanges(text);
				}
				if (isOffsetInTextRanges(ignoredRanges, startOffset)) {
					continue;
				}
				if (foundOffsets.has(startOffset)) continue;
				foundOffsets.add(startOffset);

				// Lazy computation of line offsets on first actual match
				if (!lineOffsets) {
					lineOffsets = computeLineOffsets(text);
				}

				const endOffset = startOffset + oldName.length;

				const range = offsetToRange(lineOffsets, startOffset, endOffset);
				edits.push(TextEdit.replace(range, newName));
			}
		}

		return edits;
	}

	/**
	 * Collect all edits needed to rename an object
	 */
	private async collectObjectRenames(
		oldName: string,
		newName: string,
		changes: { [uri: string]: TextEdit[] }
	): Promise<void> {
		const allFileUris = this.symbolIndex.getAllFileUris();

		// Process files in parallel batches
		const batchSize = 10;
		for (let i = 0; i < allFileUris.length; i += batchSize) {
			const batch = allFileUris.slice(i, i + batchSize);
			await Promise.all(batch.map(async (fileUri) => {
				const text = await this.getFileText(fileUri);
				if (!text) return;

				const edits = this.findAndReplaceObject(text, oldName, newName);
				if (edits.length > 0) {
					changes[fileUri] = edits;
				}
			}));
		}
	}

	/**
	 * Find and replace object references in text
	 */
	private findAndReplaceObject(text: string, oldName: string, newName: string): TextEdit[] {
		const edits: TextEdit[] = [];

		// Quick pre-filter: skip if symbol is absent (optimization)
		// Use case-insensitive regex test to avoid text.toLowerCase() allocation
		const preFilterPattern = new RegExp(escapeRegex(oldName), 'i');
		if (!preFilterPattern.test(text)) {
			return edits;
		}

		// Lazy line offsets: only compute on first match
		let lineOffsets: number[] | null = null;
		let ignoredRanges: TextRange[] | null = null;

		// Patterns for object references:
		// 1. define object ObjectName
		// 2. OBJECT ObjectName()
		// 3. is ObjectName
		const patterns = [
			new RegExp(`(define\\s+object\\s+)${escapeRegex(oldName)}(?=\\s|$)`, 'gi'),
			new RegExp(`(OBJECT\\s+)${escapeRegex(oldName)}(?=\\s*\\()`, 'gi'),
			new RegExp(`(is\\s+)${escapeRegex(oldName)}(?=\\s|$)`, 'gi')
		];

		for (const pattern of patterns) {
			let match;
			while ((match = pattern.exec(text)) !== null) {
				const prefix = match[1];
				const startOffset = match.index + prefix.length;
				if (!ignoredRanges) {
					ignoredRanges = collectPmlInactiveTextRanges(text);
				}
				if (isOffsetInTextRanges(ignoredRanges, startOffset)) {
					continue;
				}

				// Lazy computation of line offsets on first actual match
				if (!lineOffsets) {
					lineOffsets = computeLineOffsets(text);
				}

				const endOffset = startOffset + oldName.length;

				const range = offsetToRange(lineOffsets, startOffset, endOffset);
				edits.push(TextEdit.replace(range, newName));
			}
		}

		return edits;
	}

	/**
	 * Collect all edits needed to rename a form
	 */
	private async collectFormRenames(
		oldName: string,
		newName: string,
		changes: { [uri: string]: TextEdit[] }
	): Promise<void> {
		const allFileUris = this.symbolIndex.getAllFileUris();

		// Process files in parallel batches
		const batchSize = 10;
		for (let i = 0; i < allFileUris.length; i += batchSize) {
			const batch = allFileUris.slice(i, i + batchSize);
			await Promise.all(batch.map(async (fileUri) => {
				const text = await this.getFileText(fileUri);
				if (!text) return;

				const edits = this.findAndReplaceForm(text, oldName, newName);
				if (edits.length > 0) {
					changes[fileUri] = edits;
				}
			}));
		}
	}

	/**
	 * Find and replace form references in text
	 */
	private findAndReplaceForm(text: string, oldName: string, newName: string): TextEdit[] {
		const edits: TextEdit[] = [];

		// Quick pre-filter: skip if symbol is absent (optimization)
		// Use case-insensitive regex test to avoid text.toLowerCase() allocation
		const preFilterPattern = new RegExp(escapeRegex(oldName), 'i');
		if (!preFilterPattern.test(text)) {
			return edits;
		}

		// Lazy line offsets: only compute on first match
		let lineOffsets: number[] | null = null;
		let ignoredRanges: TextRange[] | null = null;

		// Forms are global variables (!!FormName)
		// Pattern: !!formName (case-insensitive)
		const pattern = new RegExp(`!!${escapeRegex(oldName)}(?=\\s|\\.|\\(|$)`, 'gi');

		let match;
		while ((match = pattern.exec(text)) !== null) {
			const startOffset = match.index;
			const endOffset = startOffset + match[0].length;
			if (!ignoredRanges) {
				ignoredRanges = collectPmlInactiveTextRanges(text);
			}
			const ignoredRange = findTextRangeContaining(ignoredRanges, startOffset);
			if (ignoredRange && !this.isPipeFormCallbackReference(text, startOffset, endOffset, ignoredRange)) {
				continue;
			}

			// Lazy computation of line offsets on first actual match
			if (!lineOffsets) {
				lineOffsets = computeLineOffsets(text);
			}

			const range = offsetToRange(lineOffsets, startOffset, endOffset);

			// Ensure new name has !! prefix
			const fullNewName = newName.startsWith('!!') ? newName : '!!' + newName;
			edits.push(TextEdit.replace(range, fullNewName));
		}

		return edits;
	}

	/**
	 * Collect all edits needed to rename a variable
	 * Local variables (!var) are scoped to current document
	 * Global variables (!!var) are searched across entire workspace
	 */
	private async collectVariableRenames(
		document: TextDocument,
		oldName: string,
		newName: string,
		changes: { [uri: string]: TextEdit[] }
	): Promise<void> {
		// Variables: !localVar or !!globalVar
		// Need to match exact variable name
		const isGlobal = oldName.startsWith('!!');
		const varName = isGlobal ? oldName.substring(2) : oldName.substring(1);

		// Pattern to match variable (avoid partial matches)
		// For local variables (!var), use negative lookbehind to avoid matching !!var
		// For global variables (!!var), match exactly two exclamation marks
		const pattern = isGlobal
			? new RegExp(`!!${escapeRegex(varName)}(?![A-Za-z0-9_])`, 'gi')
			: new RegExp(`(?<![!])!${escapeRegex(varName)}(?![A-Za-z0-9_])`, 'gi');

		if (isGlobal) {
			// Global variables: search across entire workspace
			const allFileUris = this.symbolIndex.getAllFileUris();

			// Process files in parallel batches
			const batchSize = 10;
			for (let i = 0; i < allFileUris.length; i += batchSize) {
				const batch = allFileUris.slice(i, i + batchSize);
				await Promise.all(batch.map(async (fileUri) => {
					const text = await this.getFileText(fileUri);
					if (!text) return;

					const edits = this.findVariableOccurrences(text, pattern, newName);
					if (edits.length > 0) {
						changes[fileUri] = edits;
					}
				}));
			}
		} else {
			// Local variables: current document only
			const text = document.getText();
			const edits = this.findVariableOccurrences(text, pattern, newName);
			if (edits.length > 0) {
				changes[document.uri] = edits;
			}
		}
	}

	/**
	 * Find all occurrences of a variable pattern in text
	 */
	private findVariableOccurrences(text: string, pattern: RegExp, newName: string): TextEdit[] {
		const edits: TextEdit[] = [];
		// Reset lastIndex for global regex
		pattern.lastIndex = 0;

		// Lazy line offsets: only compute on first match
		let lineOffsets: number[] | null = null;
		let ignoredRanges: TextRange[] | null = null;

		let match;
		while ((match = pattern.exec(text)) !== null) {
			const startOffset = match.index;
			if (!ignoredRanges) {
				ignoredRanges = collectPmlInactiveTextRanges(text);
			}
			if (isOffsetInTextRanges(ignoredRanges, startOffset)) {
				continue;
			}

			// Lazy computation of line offsets on first actual match
			if (!lineOffsets) {
				lineOffsets = computeLineOffsets(text);
			}

			const endOffset = startOffset + match[0].length;

			const range = offsetToRange(lineOffsets, startOffset, endOffset);
			edits.push(TextEdit.replace(range, newName));
		}

		return edits;
	}

	private isPipeFormCallbackReference(text: string, startOffset: number, endOffset: number, range: TextRange): boolean {
		if (text[range.startOffset] !== '|') {
			return false;
		}

		const prefix = text.slice(range.startOffset + 1, startOffset);
		if (prefix.trim().length > 0) {
			return false;
		}

		let nextOffset = endOffset;
		while (nextOffset < range.endOffset && /\s/.test(text[nextOffset])) {
			nextOffset++;
		}

		return text[nextOffset] === '.' || text[nextOffset] === '(';
	}

	private isGlobalFunctionSymbolAt(document: TextDocument, wordRange: Range, symbolName: string): boolean {
		const text = document.getText();
		const startOffset = document.offsetAt(wordRange.start);
		const endOffset = document.offsetAt(wordRange.end);
		const word = text.slice(startOffset, endOffset);

		if (!word.startsWith('!!') || word.includes('.') || this.symbolIndex.findFunction(symbolName).length === 0) {
			return false;
		}

		const lineStart = text.lastIndexOf('\n', Math.max(0, startOffset - 1)) + 1;
		const linePrefix = text.slice(lineStart, startOffset);
		if (/^\s*define\s+function\s+$/i.test(linePrefix)) {
			return true;
		}

		let nextOffset = endOffset;
		while (nextOffset < text.length && /[ \t]/.test(text[nextOffset])) {
			nextOffset++;
		}

		return text[nextOffset] === '(';
	}

	private normalizeGlobalFunctionName(name: string): string {
		if (name.startsWith('!!')) {
			return name;
		}
		if (name.startsWith('!')) {
			return '!!' + name.substring(1);
		}
		return '!!' + name;
	}

	private deduplicateTextEdits(edits: TextEdit[]): TextEdit[] {
		const seen = new Set<string>();
		const unique: TextEdit[] = [];

		for (const edit of edits) {
			const key = `${this.rangeKey(edit.range)}:${edit.newText}`;
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			unique.push(edit);
		}

		return unique;
	}

	private rangeKey(range: Range): string {
		return [
			range.start.line,
			range.start.character,
			range.end.line,
			range.end.character
		].join(':');
	}

	private groupTextEditsByUri(entries: { uri: string; edit: TextEdit }[]): Map<string, TextEdit[]> {
		const grouped = new Map<string, TextEdit[]>();

		for (const entry of entries) {
			const group = grouped.get(entry.uri) ?? [];
			group.push(entry.edit);
			grouped.set(entry.uri, group);
		}

		return grouped;
	}

	/**
	 * Get file text from cache, open document, or disk (async)
	 */
	private async getFileText(fileUri: string): Promise<string | undefined> {
		// Try cached text first
		const cached = this.symbolIndex.getDocumentText(fileUri);
		if (cached) return cached;

		// Try open document
		const openDoc = this.documents.get(fileUri);
		if (openDoc) return openDoc.getText();

		// Read from disk asynchronously
		try {
			const filePath = URI.parse(fileUri).fsPath;
			return await fs.readFile(filePath, 'utf-8');
		} catch {
			return undefined;
		}
	}

	/**
	 * Extract symbol name from word (remove prefixes like . or !)
	 * Handles patterns like !obj.method, !!global.method, .method
	 */
	private extractSymbolName(word: string): string | null {
		// Handle method call patterns: !obj.method, !!global.method
		if (word.includes('.')) {
			const lastDotIndex = word.lastIndexOf('.');
			return word.substring(lastDotIndex + 1);
		}
		if (word.startsWith('!!')) {
			return word.substring(2);
		}
		if (word.startsWith('!')) {
			return word.substring(1);
		}
		return word;
	}

	/**
	 * Validate that new name is appropriate for the symbol type
	 */
	private isValidName(oldName: string, newName: string): boolean {
		// Check for empty name
		if (!newName || newName.trim() === '') return false;

		// Method: should start with . or be a valid identifier
		if (oldName.startsWith('.')) {
			const name = newName.startsWith('.') ? newName.substring(1) : newName;
			return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
		}

		// Global variable/form: should start with !! or be a valid identifier
		if (oldName.startsWith('!!')) {
			const name = newName.startsWith('!!') ? newName.substring(2) :
				newName.startsWith('!') ? newName.substring(1) : newName;
			return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
		}

		// Local variable: should start with ! or be a valid identifier
		if (oldName.startsWith('!')) {
			const name = newName.startsWith('!') ? newName.substring(1) : newName;
			return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
		}

		// Plain identifier
		return /^[A-Za-z_][A-Za-z0-9_]*$/.test(newName);
	}

	/**
	 * Get word range at position
	 */
	private getWordRangeAtPosition(document: TextDocument, position: { line: number; character: number }): Range | null {
		const text = document.getText();
		const offset = document.offsetAt(position);

		let start = offset;
		let end = offset;

		while (start > 0 && this.isWordChar(text[start - 1])) {
			start--;
		}

		while (end < text.length && this.isWordChar(text[end])) {
			end++;
		}

		if (start === end) return null;

		return {
			start: document.positionAt(start),
			end: document.positionAt(end)
		};
	}

	private isWordChar(char: string): boolean {
		// Include ! $ / . for PML expressions like !var, !!global, $/attr.method
		return /[a-zA-Z0-9_.]/.test(char) || char === '!' || char === '$' || char === '/';
	}

}
