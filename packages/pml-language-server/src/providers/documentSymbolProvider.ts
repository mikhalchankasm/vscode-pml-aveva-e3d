/**
 * Document Symbol Provider - Provides outline/symbols for a document
 */

import { DocumentSymbol, DocumentSymbolParams, SymbolKind as LSPSymbolKind } from 'vscode-languageserver/node';
import { FrameInfo, GadgetInfo, SymbolIndex } from '../index/symbolIndex';
import { collectPmlInactiveTextRanges, isOffsetInTextRanges } from '../utils/pmlCommentRanges';

export class DocumentSymbolProvider {
	constructor(private symbolIndex: SymbolIndex) {}

	public provide(params: DocumentSymbolParams): DocumentSymbol[] {
		const uri = params.textDocument.uri;
		const isObjectFile = uri.toLowerCase().endsWith('.pmlobj');
		const fileSymbols = this.symbolIndex.getFileSymbols(uri);
		const symbols: DocumentSymbol[] = [];
		const methodSymbols: DocumentSymbol[] = [];
		const seenMethodNames = new Set<string>();

		// Add methods
		if (fileSymbols) {
			for (const method of fileSymbols.methods) {
				// Object files benefit from a flat method outline as well as nested object children.
				if (method.containerName && !isObjectFile) continue;

				seenMethodNames.add(method.name.toLowerCase());
				methodSymbols.push({
					name: `.${method.name}(${method.parameters.map(p => '!' + p).join(', ')})`,
					detail: method.containerName ? `object ${method.containerName}` : method.deprecated ? '(deprecated)' : undefined,
					kind: LSPSymbolKind.Method,
					range: method.range,
					selectionRange: method.range,
					children: []
				});
			}
		}

		// Fallback: extract missing methods from raw text (useful for .pmlfrm files where parser fails)
		const fallbackMethods = this.extractMethodsFromText(uri, seenMethodNames);
		if (fallbackMethods.length > 0) {
			methodSymbols.push(...fallbackMethods);
		}

		symbols.push(...methodSymbols);

		if (!fileSymbols) {
			return symbols;
		}

		for (const func of fileSymbols.functions) {
			symbols.push({
				name: `!!${func.name}(${func.parameters.map(p => '!' + p).join(', ')})`,
				detail: func.deprecated ? '(deprecated)' : 'function',
				kind: LSPSymbolKind.Function,
				range: func.range,
				selectionRange: func.range,
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
				children: [
					...form.members.map(member => ({
						name: `.${member.name} is ${member.memberType}`,
						detail: 'form member',
						kind: LSPSymbolKind.Property,
						range: member.range,
						selectionRange: member.range,
						children: []
					})),
					...this.createFormCallbackSymbols(form.callbacks, form.range),
					...form.frames.map(frame => this.createFrameSymbol(frame)),
					...form.gadgets.map(gadget => this.createGadgetSymbol(gadget))
				]
			};

			symbols.push(formSymbol);
		}

		return symbols;
	}

	private createFrameSymbol(frame: FrameInfo): DocumentSymbol {
		return {
			name: `.${frame.name}`,
			detail: 'frame',
			kind: LSPSymbolKind.Namespace,
			range: frame.range,
			selectionRange: frame.range,
			children: [
				...frame.frames.map(childFrame => this.createFrameSymbol(childFrame)),
				...frame.gadgets.map(gadget => this.createGadgetSymbol(gadget))
			]
		};
	}

	private createGadgetSymbol(gadget: GadgetInfo): DocumentSymbol {
		const callback = this.directCallbackTarget(gadget.callback);
		return {
			name: `.${gadget.name}`,
			detail: gadget.gadgetType,
			kind: LSPSymbolKind.Field,
			range: gadget.range,
			selectionRange: gadget.range,
			children: callback ? [{
				name: `callback → .${callback}`,
				detail: 'form callback',
				kind: LSPSymbolKind.Event,
				range: gadget.range,
				selectionRange: gadget.range,
				children: []
			}] : []
		};
	}

	private createFormCallbackSymbols(callbacks: Record<string, string>, range: DocumentSymbol['range']): DocumentSymbol[] {
		return Object.entries(callbacks).flatMap(([property, callback]) => {
			const target = this.directCallbackTarget(callback);
			return target ? [{
				name: `${property} → .${target}`,
				detail: 'form callback',
				kind: LSPSymbolKind.Event,
				range,
				selectionRange: range,
				children: []
			}] : [];
		});
	}

	private directCallbackTarget(callback?: string): string | undefined {
		return callback?.trim().match(/^(?:!this\.|\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/i)?.[1];
	}

	private extractMethodsFromText(uri: string, existing: Set<string>): DocumentSymbol[] {
		const text = this.symbolIndex.getDocumentText(uri);
		if (!text) {
			return [];
		}

		const methodRegex = /^\s*define\s+method\s+\.([A-Za-z0-9_]+)\s*(\(([^)]*)\))?/gim;
		const fallbackSymbols: DocumentSymbol[] = [];
		const lowerText = text.toLowerCase();
		const lineOffsets = this.buildLineOffsets(text);
		const inactiveRanges = collectPmlInactiveTextRanges(text);

		let match: RegExpExecArray | null;
		while ((match = methodRegex.exec(text)) !== null) {
			if (isOffsetInTextRanges(inactiveRanges, match.index)) {
				continue;
			}

			const methodName = match[1];
			const key = methodName.toLowerCase();

			if (existing.has(key)) {
				continue;
			}

			const params = (match[3] || '')
				.split(',')
				.map(param => param.trim())
				.filter(Boolean)
				.map(param => {
					const nameMatch = param.match(/!([A-Za-z0-9_]+)/);
					return nameMatch ? nameMatch[1] : param;
				});

			const startOffset = match.index;
			const endOffset = this.findActiveMethodEndOffset(lowerText, match.index, inactiveRanges) ?? (startOffset + match[0].length);

			const startPos = this.offsetToPosition(startOffset, lineOffsets);
			const endPos = this.offsetToPosition(endOffset, lineOffsets);
			const methodNameOffset = startOffset + match[0].lastIndexOf(`.${methodName}`);
			const methodNameStart = this.offsetToPosition(methodNameOffset, lineOffsets);
			const methodNameEnd = this.offsetToPosition(methodNameOffset + methodName.length + 1, lineOffsets);
			const signature = params.length ? `.${methodName}(${params.map(p => '!' + p).join(', ')})` : `.${methodName}()`;

			fallbackSymbols.push({
				name: signature,
				detail: 'Method',
				kind: LSPSymbolKind.Method,
				range: { start: startPos, end: endPos },
				selectionRange: { start: methodNameStart, end: methodNameEnd },
				children: []
			});

			existing.add(key);
		}

		return fallbackSymbols;
	}

	private findActiveMethodEndOffset(text: string, startOffset: number, inactiveRanges: ReturnType<typeof collectPmlInactiveTextRanges>): number | undefined {
		const endmethodPattern = /^\s*endmethod\b/gmi;
		endmethodPattern.lastIndex = startOffset;

		let match: RegExpExecArray | null;
		while ((match = endmethodPattern.exec(text)) !== null) {
			if (!isOffsetInTextRanges(inactiveRanges, match.index)) {
				return match.index + match[0].length;
			}
		}

		return undefined;
	}

	private buildLineOffsets(text: string): number[] {
		const offsets: number[] = [0];
		for (let i = 0; i < text.length; i++) {
			if (text[i] === '\n') {
				offsets.push(i + 1);
			}
		}
		offsets.push(text.length);
		return offsets;
	}

	private offsetToPosition(offset: number, lineOffsets: number[]): { line: number; character: number } {
		let low = 0;
		let high = lineOffsets.length - 1;

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			const lineStart = lineOffsets[mid];
			const nextLineStart = lineOffsets[mid + 1] ?? Number.MAX_SAFE_INTEGER;

			if (offset < lineStart) {
				high = mid - 1;
			} else if (offset >= nextLineStart) {
				low = mid + 1;
			} else {
				return {
					line: mid,
					character: offset - lineStart
				};
			}
		}

		// Fallback if binary search fails (should not happen)
		return { line: 0, character: offset };
	}
}
