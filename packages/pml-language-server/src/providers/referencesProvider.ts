/**
 * References Provider - Find All References (Shift+F12)
 */

import { Location, ReferenceParams, TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import * as fs from 'fs/promises';
import { SymbolIndex } from '../index/symbolIndex';
import { computeLineOffsets, offsetToPosition } from '../utils/offsetUtils';
import {
	MethodReferencePatternCache,
	isMethodDeclarationReference
} from '../utils/methodReferencePatterns';
import { collectPmlMethodReferenceIgnoredRanges, isOffsetInTextRanges, TextRange } from '../utils/pmlCommentRanges';

export class ReferencesProvider {
	private readonly referencePatternCache = new MethodReferencePatternCache();

	constructor(
		private symbolIndex: SymbolIndex,
		private documents: TextDocuments<TextDocument>
	) {}

	public async provide(params: ReferenceParams): Promise<Location[] | null> {
		const document = this.documents.get(params.textDocument.uri);
		if (!document) return null;

		// Get word at position
		const wordRange = this.getWordRangeAtPosition(document, params.position);
		if (!wordRange) return null;

		const word = document.getText(wordRange);

		// Extract method name: handle patterns like !obj.method, !this.method, .method
		// Take only the part after the last dot
		let symbolName = word;
		if (word.includes('.')) {
			const lastDotIndex = word.lastIndexOf('.');
			symbolName = word.substring(lastDotIndex + 1);
		}
		// Remove leading ! or $ if still present
		symbolName = symbolName.replace(/^[!$]+/, '');
		if (symbolName.length === 0) return null;

		const references: Location[] = [];

		// Find definition
		const methods = this.symbolIndex.findMethod(symbolName);
		const objects = this.symbolIndex.findObject(symbolName);
		const forms = this.symbolIndex.findForm(symbolName);

		// Add definitions to references (if includeDeclaration is true)
		if (params.context.includeDeclaration) {
			for (const method of methods) {
				references.push(Location.create(method.uri, method.range));
			}
			for (const object of objects) {
				references.push(Location.create(object.uri, object.range));
			}
			for (const form of forms) {
				references.push(Location.create(form.uri, form.range));
			}
		}

		// Scan all workspace files for references (not just current document)
		if (methods.length > 0 || objects.length > 0 || forms.length > 0) {
			// Indexed definitions are added above, so text scanning must not add declaration matches again.
			const workspaceRefs = await this.findReferencesInWorkspace(symbolName, false);
			references.push(...workspaceRefs);
		}

		return references.length > 0 ? references : null;
	}

	/**
	 * Find all references to a symbol across the entire workspace
	 */
	private async findReferencesInWorkspace(symbolName: string, includeDeclaration = true): Promise<Location[]> {
		const references: Location[] = [];
		const allFileUris = this.symbolIndex.getAllFileUris();

		// Process files in parallel batches for better performance
		const batchSize = 10;
		for (let i = 0; i < allFileUris.length; i += batchSize) {
			const batch = allFileUris.slice(i, i + batchSize);
			const batchResults = await Promise.all(
				batch.map(fileUri => this.findReferencesInFile(fileUri, symbolName, includeDeclaration))
			);
			for (const fileRefs of batchResults) {
				references.push(...fileRefs);
			}
		}

		return references;
	}

	/**
	 * Find references in a single file
	 */
	private async findReferencesInFile(fileUri: string, symbolName: string, includeDeclaration = true): Promise<Location[]> {
		// Try to get cached document text first
		const cachedText = this.symbolIndex.getDocumentText(fileUri);
		if (cachedText) {
			return this.findReferencesInText(cachedText, fileUri, symbolName, includeDeclaration);
		}

		// Fallback: try to get open document
		const openDoc = this.documents.get(fileUri);
		if (openDoc) {
			return this.findReferencesInText(openDoc.getText(), fileUri, symbolName, includeDeclaration);
		}

		// Last resort: read file from disk asynchronously
		const fileText = await this.readFileFromDisk(fileUri);
		if (fileText) {
			return this.findReferencesInText(fileText, fileUri, symbolName, includeDeclaration);
		}

		return [];
	}

	/**
	 * Find all references to a symbol in text
	 */
	private findReferencesInText(text: string, fileUri: string, symbolName: string, includeDeclaration = true): Location[] {
		const references: Location[] = [];
		if (symbolName.length === 0) {
			return references;
		}
		const patternSet = this.getReferencePatternSet(symbolName);

		// Quick pre-filter: skip regex scans when symbol is absent (optimization)
		if (!patternSet.preFilterPattern.test(text)) {
			return references;
		}

		// Lazy line offsets: only compute after first match found
		let lineOffsets: number[] | null = null;
		let ignoredRanges: TextRange[] | null = null;

		const foundOffsets = new Set<number>();  // Deduplicate overlapping matches

		for (const pattern of patternSet.patterns) {
			if (pattern.includeDeclaration && !includeDeclaration) {
				continue;
			}
			// Shared global regex objects keep state between exec loops.
			pattern.regex.lastIndex = 0;
			let match;
			while ((match = pattern.regex.exec(text)) !== null) {
				// Find the exact position of the symbol name (case-insensitive search)
				const matchText = match[0];
				const lowerMatch = matchText.toLowerCase();
				const methodNameIndex = lowerMatch.lastIndexOf(patternSet.symbolLower);
				const startOffset = match.index + methodNameIndex;
				if (!ignoredRanges) {
					ignoredRanges = collectPmlMethodReferenceIgnoredRanges(text);
				}
				if (isOffsetInTextRanges(ignoredRanges, startOffset)) {
					continue;
				}
				if (!includeDeclaration && isMethodDeclarationReference(text, startOffset)) {
					continue;
				}

				// Skip if we've already found this location
				if (foundOffsets.has(startOffset)) continue;
				foundOffsets.add(startOffset);

				// Lazy computation of line offsets on first actual match
				if (!lineOffsets) {
					lineOffsets = computeLineOffsets(text);
				}

				const endOffset = startOffset + symbolName.length;

				// O(log n) position lookup using pre-computed line offsets
				const startPos = offsetToPosition(lineOffsets, startOffset);
				const endPos = offsetToPosition(lineOffsets, endOffset);

				references.push(Location.create(
					fileUri,
					{
						start: startPos,
						end: endPos
					}
				));
			}
		}

		return references;
	}

	private getReferencePatternSet(symbolName: string) {
		return this.referencePatternCache.get(symbolName);
	}

	/**
	 * Get word range at position
	 */
	private getWordRangeAtPosition(document: TextDocument, position: { line: number; character: number }) {
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

	/**
	 * Read file content from disk asynchronously
	 */
	private async readFileFromDisk(fileUri: string): Promise<string | undefined> {
		try {
			const filePath = URI.parse(fileUri).fsPath;
			return await fs.readFile(filePath, 'utf-8');
		} catch {
			// File doesn't exist or can't be read
			return undefined;
		}
	}
}
