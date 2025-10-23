/**
 * Definition Provider - Go to Definition (F12)
 */

import { Definition, DefinitionParams, Location, TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolIndex } from '../index/symbolIndex';

export class DefinitionProvider {
	constructor(
		private symbolIndex: SymbolIndex,
		private documents: TextDocuments<TextDocument>
	) {}

	public provide(params: DefinitionParams): Definition | null {
		const document = this.documents.get(params.textDocument.uri);
		if (!document) return null;

		// Get word at position
		const wordRange = this.getWordRangeAtPosition(document, params.position);
		if (!wordRange) return null;

		const word = document.getText(wordRange);

		// Check if it's a method call (.methodName or just methodName after .)
		if (word.startsWith('.')) {
			const methodName = word.substring(1);
			return this.findMethodDefinition(methodName);
		}

		// Check if previous character before word is a dot (for .methodName() calls)
		const text = document.getText();
		const wordStartOffset = document.offsetAt(wordRange.start);
		if (wordStartOffset > 0 && text[wordStartOffset - 1] === '.') {
			// This is a method call after dot: !var.methodName()
			return this.findMethodDefinition(word);
		}

		// Check if it's just a method name without dot
		// (e.g., in "define method .test" -> cursor on "test")
		const methods = this.symbolIndex.findMethod(word);
		if (methods.length > 0) {
			// Return first match (could be multiple)
			return Location.create(methods[0].uri, methods[0].range);
		}

		// Check for object
		const objects = this.symbolIndex.findObject(word);
		if (objects.length > 0) {
			return Location.create(objects[0].uri, objects[0].range);
		}

		// Check for form
		const forms = this.symbolIndex.findForm(word);
		if (forms.length > 0) {
			return Location.create(forms[0].uri, forms[0].range);
		}

		return null;
	}

	/**
	 * Find method definition
	 */
	private findMethodDefinition(methodName: string): Definition | null {
		const methods = this.symbolIndex.findMethod(methodName);

		if (methods.length === 0) {
			return null;
		}

		// If multiple definitions, return all
		if (methods.length === 1) {
			return Location.create(methods[0].uri, methods[0].range);
		}

		// Multiple definitions - return all
		return methods.map(m => Location.create(m.uri, m.range));
	}

	/**
	 * Get word range at position (simple implementation)
	 */
	private getWordRangeAtPosition(document: TextDocument, position: { line: number; character: number }) {
		const text = document.getText();
		const offset = document.offsetAt(position);

		// Find word boundaries
		let start = offset;
		let end = offset;

		// Expand backwards
		while (start > 0 && this.isWordChar(text[start - 1])) {
			start--;
		}

		// Expand forwards
		while (end < text.length && this.isWordChar(text[end])) {
			end++;
		}

		if (start === end) return null;

		return {
			start: document.positionAt(start),
			end: document.positionAt(end)
		};
	}

	/**
	 * Check if character is part of word
	 */
	private isWordChar(char: string): boolean {
		return /[a-zA-Z0-9_.]/.test(char) || char === '!';
	}
}
