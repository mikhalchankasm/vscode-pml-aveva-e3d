/**
 * References Provider - Find All References (Shift+F12)
 */

import { Location, ReferenceParams, TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import * as fs from 'fs';
import { SymbolIndex } from '../index/symbolIndex';

export class ReferencesProvider {
	constructor(
		private symbolIndex: SymbolIndex,
		private documents: TextDocuments<TextDocument>
	) {}

	public provide(params: ReferenceParams): Location[] | null {
		const document = this.documents.get(params.textDocument.uri);
		if (!document) return null;

		// Get word at position
		const wordRange = this.getWordRangeAtPosition(document, params.position);
		if (!wordRange) return null;

		const word = document.getText(wordRange);

		// Extract method name (remove leading dot if present)
		const symbolName = word.startsWith('.') ? word.substring(1) : word;

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
			const workspaceRefs = this.findReferencesInWorkspace(symbolName);
			references.push(...workspaceRefs);
		}

		return references.length > 0 ? references : null;
	}

	/**
	 * Find all references to a symbol across the entire workspace
	 */
	private findReferencesInWorkspace(symbolName: string): Location[] {
		const references: Location[] = [];
		const allFileUris = this.symbolIndex.getAllFileUris();

		for (const fileUri of allFileUris) {
			// Try to get cached document text first
			const cachedText = this.symbolIndex.getDocumentText(fileUri);

			// If text is cached, search it
			if (cachedText) {
				const fileRefs = this.findReferencesInText(cachedText, fileUri, symbolName);
				references.push(...fileRefs);
			} else {
				// Fallback: try to get open document
				const openDoc = this.documents.get(fileUri);
				if (openDoc) {
					const fileRefs = this.findReferencesInText(openDoc.getText(), fileUri, symbolName);
					references.push(...fileRefs);
				} else {
					// Last resort: read file from disk
					const fileText = this.readFileFromDisk(fileUri);
					if (fileText) {
						const fileRefs = this.findReferencesInText(fileText, fileUri, symbolName);
						references.push(...fileRefs);
					}
				}
			}
		}

		return references;
	}

	/**
	 * Find all references to a symbol in text
	 */
	private findReferencesInText(text: string, fileUri: string, symbolName: string): Location[] {
		const references: Location[] = [];

		// Pattern to match method calls: .methodName( or variable.methodName(
		// Also match object instantiations: OBJECT ObjectName()
		const patterns = [
			new RegExp(`\\.${symbolName}\\s*\\(`, 'gi'),  // Direct call: .methodName()
			new RegExp(`\\w+\\.${symbolName}\\s*\\(`, 'gi'),  // Variable call: !var.methodName()
			new RegExp(`\\bOBJECT\\s+${symbolName}\\s*\\(`, 'gi')  // Object instantiation: OBJECT MyObject()
		];

		for (const pattern of patterns) {
			let match;
			while ((match = pattern.exec(text)) !== null) {
				// Find the exact position of the symbol name (not the dot or parenthesis)
				const matchText = match[0];
				const methodNameIndex = matchText.lastIndexOf(symbolName);
				const startOffset = match.index + methodNameIndex;
				const endOffset = startOffset + symbolName.length;

				// Calculate line and character position manually
				const lines = text.substring(0, startOffset).split('\n');
				const line = lines.length - 1;
				const character = lines[lines.length - 1].length;

				const endLines = text.substring(0, endOffset).split('\n');
				const endLine = endLines.length - 1;
				const endCharacter = endLines[endLines.length - 1].length;

				references.push(Location.create(
					fileUri,
					{
						start: { line, character },
						end: { line: endLine, character: endCharacter }
					}
				));
			}
		}

		return references;
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
		return /[a-zA-Z0-9_.]/.test(char) || char === '!';
	}

	/**
	 * Read file content from disk as fallback when not cached
	 */
	private readFileFromDisk(fileUri: string): string | undefined {
		try {
			const filePath = URI.parse(fileUri).fsPath;
			return fs.readFileSync(filePath, 'utf-8');
		} catch {
			// File doesn't exist or can't be read
			return undefined;
		}
	}
}
