/**
 * Rename Provider - Rename Symbol (F2)
 * Provides workspace-wide symbol renaming for methods, objects, forms, and variables
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
import * as fs from 'fs';
import { SymbolIndex } from '../index/symbolIndex';

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

		// Check if symbol exists in index (method, object, form, or variable)
		const methods = this.symbolIndex.findMethod(symbolName);
		const objects = this.symbolIndex.findObject(symbolName);
		const forms = this.symbolIndex.findForm(symbolName);
		// Only treat as variable if it's !var without a method call (!obj.method is a method call)
		const isVariable = word.startsWith('!') && !word.includes('.');

		// If not a known symbol and not a variable, can't rename
		if (methods.length === 0 && objects.length === 0 && forms.length === 0 && !isVariable) {
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
	public provide(params: RenameParams): WorkspaceEdit | null {
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
		const methods = this.symbolIndex.findMethod(symbolName);
		const objects = this.symbolIndex.findObject(symbolName);
		const forms = this.symbolIndex.findForm(symbolName);
		// Only treat as variable if it's !var without a method call (!obj.method is a method call)
		const isVariable = word.startsWith('!') && !word.includes('.');

		if (methods.length > 0) {
			// Renaming a method
			this.collectMethodRenames(symbolName, newName, changes);
		} else if (objects.length > 0) {
			// Renaming an object
			this.collectObjectRenames(symbolName, newName, changes);
		} else if (forms.length > 0) {
			// Renaming a form
			this.collectFormRenames(symbolName, newName, changes);
		} else if (isVariable) {
			// Renaming a variable - local scope only (current document)
			this.collectVariableRenames(document, word, newName, changes);
		} else {
			return null;
		}

		return { changes };
	}

	/**
	 * Collect all edits needed to rename a method
	 */
	private collectMethodRenames(
		oldName: string,
		newName: string,
		changes: { [uri: string]: TextEdit[] }
	): void {
		// Extract new name without leading dot if present
		const newMethodName = newName.startsWith('.') ? newName.substring(1) : newName;

		const allFileUris = this.symbolIndex.getAllFileUris();

		for (const fileUri of allFileUris) {
			const text = this.getFileText(fileUri);
			if (!text) continue;

			const edits = this.findAndReplaceMethod(text, oldName, newMethodName);
			if (edits.length > 0) {
				changes[fileUri] = edits;
			}
		}
	}

	/**
	 * Find and replace method references in text
	 */
	private findAndReplaceMethod(text: string, oldName: string, newName: string): TextEdit[] {
		const edits: TextEdit[] = [];

		// Pattern to match method definitions and calls: .methodName
		// Must be case-insensitive since PML is case-insensitive
		const pattern = new RegExp(`\\.${this.escapeRegex(oldName)}(?=\\s*\\(|\\s*$|\\s+)`, 'gi');

		let match;
		while ((match = pattern.exec(text)) !== null) {
			const startOffset = match.index + 1; // Skip the dot
			const endOffset = startOffset + oldName.length;

			const range = this.offsetToRange(text, startOffset, endOffset);
			edits.push(TextEdit.replace(range, newName));
		}

		return edits;
	}

	/**
	 * Collect all edits needed to rename an object
	 */
	private collectObjectRenames(
		oldName: string,
		newName: string,
		changes: { [uri: string]: TextEdit[] }
	): void {
		const allFileUris = this.symbolIndex.getAllFileUris();

		for (const fileUri of allFileUris) {
			const text = this.getFileText(fileUri);
			if (!text) continue;

			const edits = this.findAndReplaceObject(text, oldName, newName);
			if (edits.length > 0) {
				changes[fileUri] = edits;
			}
		}
	}

	/**
	 * Find and replace object references in text
	 */
	private findAndReplaceObject(text: string, oldName: string, newName: string): TextEdit[] {
		const edits: TextEdit[] = [];

		// Patterns for object references:
		// 1. define object ObjectName
		// 2. OBJECT ObjectName()
		// 3. is ObjectName
		const patterns = [
			new RegExp(`(define\\s+object\\s+)${this.escapeRegex(oldName)}(?=\\s|$)`, 'gi'),
			new RegExp(`(OBJECT\\s+)${this.escapeRegex(oldName)}(?=\\s*\\()`, 'gi'),
			new RegExp(`(is\\s+)${this.escapeRegex(oldName)}(?=\\s|$)`, 'gi')
		];

		for (const pattern of patterns) {
			let match;
			while ((match = pattern.exec(text)) !== null) {
				const prefix = match[1];
				const startOffset = match.index + prefix.length;
				const endOffset = startOffset + oldName.length;

				const range = this.offsetToRange(text, startOffset, endOffset);
				edits.push(TextEdit.replace(range, newName));
			}
		}

		return edits;
	}

	/**
	 * Collect all edits needed to rename a form
	 */
	private collectFormRenames(
		oldName: string,
		newName: string,
		changes: { [uri: string]: TextEdit[] }
	): void {
		const allFileUris = this.symbolIndex.getAllFileUris();

		for (const fileUri of allFileUris) {
			const text = this.getFileText(fileUri);
			if (!text) continue;

			const edits = this.findAndReplaceForm(text, oldName, newName);
			if (edits.length > 0) {
				changes[fileUri] = edits;
			}
		}
	}

	/**
	 * Find and replace form references in text
	 */
	private findAndReplaceForm(text: string, oldName: string, newName: string): TextEdit[] {
		const edits: TextEdit[] = [];

		// Forms are global variables (!!FormName)
		// Pattern: !!formName (case-insensitive)
		const pattern = new RegExp(`!!${this.escapeRegex(oldName)}(?=\\s|\\.|\\(|$)`, 'gi');

		let match;
		while ((match = pattern.exec(text)) !== null) {
			const startOffset = match.index;
			const endOffset = startOffset + match[0].length;

			const range = this.offsetToRange(text, startOffset, endOffset);

			// Ensure new name has !! prefix
			const fullNewName = newName.startsWith('!!') ? newName : '!!' + newName;
			edits.push(TextEdit.replace(range, fullNewName));
		}

		return edits;
	}

	/**
	 * Collect all edits needed to rename a variable (local scope only)
	 */
	private collectVariableRenames(
		document: TextDocument,
		oldName: string,
		newName: string,
		changes: { [uri: string]: TextEdit[] }
	): void {
		const text = document.getText();
		const edits: TextEdit[] = [];

		// Variables: !localVar or !!globalVar
		// Need to match exact variable name
		const isGlobal = oldName.startsWith('!!');
		const varName = isGlobal ? oldName.substring(2) : oldName.substring(1);
		const prefix = isGlobal ? '!!' : '!';

		// Pattern to match variable (avoid partial matches)
		const pattern = new RegExp(`${this.escapeRegex(prefix)}${this.escapeRegex(varName)}(?![A-Za-z0-9_])`, 'gi');

		let match;
		while ((match = pattern.exec(text)) !== null) {
			const startOffset = match.index;
			const endOffset = startOffset + match[0].length;

			const range = this.offsetToRange(text, startOffset, endOffset);
			edits.push(TextEdit.replace(range, newName));
		}

		if (edits.length > 0) {
			changes[document.uri] = edits;
		}
	}

	/**
	 * Get file text from cache, open document, or disk
	 */
	private getFileText(fileUri: string): string | undefined {
		// Try cached text first
		const cached = this.symbolIndex.getDocumentText(fileUri);
		if (cached) return cached;

		// Try open document
		const openDoc = this.documents.get(fileUri);
		if (openDoc) return openDoc.getText();

		// Read from disk
		try {
			const filePath = URI.parse(fileUri).fsPath;
			return fs.readFileSync(filePath, 'utf-8');
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
	 * Convert offset range to LSP Range
	 */
	private offsetToRange(text: string, startOffset: number, endOffset: number): Range {
		const lines = text.split('\n');
		let currentOffset = 0;
		let startLine = 0, startChar = 0;
		let endLine = 0, endChar = 0;

		for (let i = 0; i < lines.length; i++) {
			const lineLength = lines[i].length + 1; // +1 for newline

			if (currentOffset + lineLength > startOffset && startLine === 0 && startChar === 0) {
				startLine = i;
				startChar = startOffset - currentOffset;
			}

			if (currentOffset + lineLength > endOffset) {
				endLine = i;
				endChar = endOffset - currentOffset;
				break;
			}

			currentOffset += lineLength;
		}

		return {
			start: { line: startLine, character: startChar },
			end: { line: endLine, character: endChar }
		};
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
		return /[a-zA-Z0-9_.]/.test(char) || char === '!';
	}

	private escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}
