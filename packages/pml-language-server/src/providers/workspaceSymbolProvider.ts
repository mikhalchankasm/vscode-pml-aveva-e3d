/**
 * Workspace Symbol Provider - Search Symbols in Workspace (Ctrl+T)
 */

import { WorkspaceSymbolParams, SymbolInformation, SymbolKind } from 'vscode-languageserver/node';
import { SymbolIndex, SymbolInfo } from '../index/symbolIndex';

export class WorkspaceSymbolProvider {
	constructor(private symbolIndex: SymbolIndex) {}

	public provide(params: WorkspaceSymbolParams): SymbolInformation[] {
		const query = params.query.toLowerCase();
		const symbols: SymbolInformation[] = [];

		// Search all symbols
		const allSymbols = this.symbolIndex.searchSymbols(query);

		// Convert to LSP SymbolInformation
		for (const symbol of allSymbols) {
			symbols.push({
				name: symbol.name,
				kind: this.getSymbolKind(symbol.kind),
				location: {
					uri: symbol.uri,
					range: symbol.range
				},
				containerName: symbol.containerName // Show which object contains this method
			});
		}

		return symbols;
	}

	private getSymbolKind(kind: SymbolInfo['kind']): SymbolKind {
		switch (kind) {
			case 'method':
				return SymbolKind.Method;
			case 'object':
				return SymbolKind.Class;
			case 'form':
				return SymbolKind.Interface;
			default:
				return SymbolKind.Variable;
		}
	}
}
