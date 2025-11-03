/**
 * Document Symbol Provider - Provides outline/symbols for a document
 */

import { DocumentSymbol, DocumentSymbolParams, SymbolKind as LSPSymbolKind } from 'vscode-languageserver/node';
import { SymbolIndex } from '../index/symbolIndex';

export class DocumentSymbolProvider {
	constructor(private symbolIndex: SymbolIndex) {}

	public provide(params: DocumentSymbolParams): DocumentSymbol[] {
		const fileSymbols = this.symbolIndex.getFileSymbols(params.textDocument.uri);
		if (!fileSymbols) {
			return [];
		}

		const symbols: DocumentSymbol[] = [];

		// Add methods
		for (const method of fileSymbols.methods) {
			// Skip methods inside objects (they'll be nested)
			if (method.containerName) continue;

			symbols.push({
				name: `.${method.name}(${method.parameters.map(p => '!' + p).join(', ')})`,
				detail: method.deprecated ? '(deprecated)' : undefined,
				kind: LSPSymbolKind.Method,
				range: method.range,
				selectionRange: method.range,
				children: []
			});
		}

		// Add objects (with methods as children)
		for (const object of fileSymbols.objects) {
			const objectSymbol: DocumentSymbol = {
				name: object.name,
				detail: 'object',
				kind: LSPSymbolKind.Class,
				range: object.range,
				selectionRange: object.range,
				children: []
			};

			// Add object methods as children
			const objectMethods = fileSymbols.methods.filter(m => m.containerName === object.name);
			for (const method of objectMethods) {
				objectSymbol.children!.push({
					name: `.${method.name}(${method.parameters.map(p => '!' + p).join(', ')})`,
					detail: method.deprecated ? '(deprecated)' : undefined,
					kind: LSPSymbolKind.Method,
					range: method.range,
					selectionRange: method.range,
					children: []
				});
			}

			symbols.push(objectSymbol);
		}

		// Add forms
		for (const form of fileSymbols.forms) {
			const formSymbol: DocumentSymbol = {
				name: form.name,
				detail: 'form',
				kind: LSPSymbolKind.Interface,
				range: form.range,
				selectionRange: form.range,
				children: []
			};

			symbols.push(formSymbol);
		}

		return symbols;
	}
}
