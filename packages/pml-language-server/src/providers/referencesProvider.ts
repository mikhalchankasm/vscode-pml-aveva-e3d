/**
 * References Provider - Find All References (Shift+F12)
 */

import { Location, ReferenceParams, TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
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

		// Scan current document for references to this method
		if (methods.length > 0) {
			const currentFileRefs = this.findReferencesInDocument(document, symbolName);
			references.push(...currentFileRefs);
		}

		return references.length > 0 ? references : null;
	}

	/**
	 * Find all references to a symbol in a document
	 */
	private findReferencesInDocument(document: TextDocument, symbolName: string): Location[] {
		const text = document.getText();
		const references: Location[] = [];

		// Pattern to match method calls: .methodName( or variable.methodName(
		const patterns = [
			new RegExp(`\\.${symbolName}\\s*\\(`, 'gi'),  // Direct call: .methodName()
			new RegExp(`\\w+\\.${symbolName}\\s*\\(`, 'gi')  // Variable call: !var.methodName()
		];

		for (const pattern of patterns) {
			let match;
			while ((match = pattern.exec(text)) !== null) {
				// Find the exact position of the method name (not the dot or parenthesis)
				const matchText = match[0];
				const methodNameIndex = matchText.lastIndexOf(symbolName);
				const startOffset = match.index + methodNameIndex;
				const endOffset = startOffset + symbolName.length;

				references.push(Location.create(
					document.uri,
					{
						start: document.positionAt(startOffset),
						end: document.positionAt(endOffset)
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
}
