/**
 * Workspace Symbol Provider - Search Symbols in Workspace (Ctrl+T)
 */

import { WorkspaceSymbolParams, SymbolInformation, SymbolKind } from 'vscode-languageserver/node';
import { FrameInfo, GadgetInfo, SymbolIndex, SymbolInfo } from '../index/symbolIndex';
import { directCallbackTarget } from '../utils/directCallbackTarget';

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

		for (const file of this.symbolIndex.getAllFileSymbols()) {
			for (const form of file.forms) {
				const containerName = form.name;
				for (const member of form.members) {
					this.addIfMatches(symbols, query, `.${member.name}`, SymbolKind.Property, file.uri, member.range, `${containerName} · member ${member.memberType}`);
				}
				const addGadget = (gadget: GadgetInfo): void => {
					this.addIfMatches(symbols, query, `.${gadget.name}`, SymbolKind.Field, file.uri, gadget.range, `${containerName} · ${gadget.gadgetType}`);
					const callback = directCallbackTarget(gadget.callback);
					if (callback) this.addIfMatches(symbols, query, `.${callback}`, SymbolKind.Event, file.uri, gadget.range, `${containerName} · .${gadget.name} callback`);
				};
				form.gadgets.forEach(addGadget);
				const visitFrame = (frame: FrameInfo): void => {
					frame.gadgets.forEach(addGadget);
					frame.frames.forEach(visitFrame);
				};
				form.frames.forEach(visitFrame);
				for (const [property, callbackValue] of Object.entries(form.callbacks)) {
					const callback = directCallbackTarget(callbackValue);
					const range = form.callbackRanges[property];
					if (callback && range) this.addIfMatches(symbols, query, `.${callback}`, SymbolKind.Event, file.uri, range, `${containerName} · ${property}`);
				}
			}
		}

		return symbols;
	}

	private addIfMatches(
		symbols: SymbolInformation[],
		query: string,
		name: string,
		kind: SymbolKind,
		uri: string,
		range: SymbolInformation['location']['range'],
		containerName: string
	): void {
		if (query && !name.toLowerCase().includes(query.toLowerCase())) return;
		symbols.push({ name, kind, location: { uri, range }, containerName });
	}


	private getSymbolKind(kind: SymbolInfo['kind']): SymbolKind {
		switch (kind) {
			case 'method':
				return SymbolKind.Method;
			case 'function':
				return SymbolKind.Function;
			case 'object':
				return SymbolKind.Class;
			case 'form':
				return SymbolKind.Interface;
			default:
				return SymbolKind.Variable;
		}
	}
}
