/**
 * Signature Help Provider - Shows parameter hints while typing method calls
 */

import {
	SignatureHelp,
	SignatureInformation,
	ParameterInformation,
	SignatureHelpParams
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolIndex } from '../index/symbolIndex';
import { collectPmlInactiveTextRanges, isCursorInsidePmlInactiveText } from '../utils/pmlCommentRanges';
import { formatCallableParameters, formatCallableSignature } from '../utils/callableSignature';

export class SignatureHelpProvider {
	constructor(private symbolIndex: SymbolIndex) {}

	public provide(params: SignatureHelpParams, document: TextDocument): SignatureHelp | null {
		const position = params.position;
		const text = document.getText();
		const cursorOffset = document.offsetAt(position);
		if (isCursorInsidePmlInactiveText(text, collectPmlInactiveTextRanges(text), cursorOffset)) {
			return null;
		}

		const line = document.getText({
			start: { line: position.line, character: 0 },
			end: position
		});

		const callContext = this.findActiveCallContext(line);
		if (!callContext) {
			return null;
		}

		const activeParameter = this.countTopLevelCommas(callContext.argumentsText);

		// Find method in symbol index
		const signaturesSource = callContext.kind === 'method'
			? this.symbolIndex.findMethodsInFile(document.uri, callContext.name)
			: this.symbolIndex.findFunction(callContext.name);
		if (signaturesSource.length === 0) {
			return null;
		}

		// Build signatures for all overloads
		const signatures: SignatureInformation[] = [];

		for (const symbol of signaturesSource) {
			const parameterLabels = formatCallableParameters(symbol.parameters, symbol.parameterTypes);
			const params = parameterLabels.map(parameter => {
				return ParameterInformation.create(parameter);
			});

			const prefix = callContext.kind === 'method' ? '.' : '!!';
			const label = symbol.signature || formatCallableSignature(prefix, symbol.name, symbol.parameters, symbol.parameterTypes, symbol.returnType);
			const documentation = symbol.documentation || `${callContext.kind === 'method' ? 'Method' : 'Function'}: ${prefix}${symbol.name}`;

			signatures.push({
				label,
				documentation,
				parameters: params
			});
		}

		const parameterCounts = signaturesSource.map(symbol => symbol.parameters.length);
		const activeSignature = this.selectActiveSignature(parameterCounts, activeParameter);

		return {
			signatures,
			activeSignature,
			activeParameter: this.clampActiveParameter(activeParameter, parameterCounts[activeSignature] ?? 0)
		};
	}

	private findActiveCallContext(lineBeforeCursor: string): { kind: 'method' | 'function'; name: string; argumentsText: string } | null {
		let depth = 0;
		for (let index = lineBeforeCursor.length - 1; index >= 0; index--) {
			const char = lineBeforeCursor[index];
			if (char === '|' || char === '\'' || char === '"') {
				index = this.skipDelimitedTextBackward(lineBeforeCursor, index, char);
				continue;
			}

			if (char === ')') {
				depth++;
			} else if (char === '(') {
				if (depth > 0) {
					depth--;
					continue;
				}

				const calleeText = lineBeforeCursor.slice(0, index);
				const functionMatch = calleeText.match(/!!(\w+)\s*$/);
				if (functionMatch) {
					return {
						kind: 'function',
						name: functionMatch[1],
						argumentsText: lineBeforeCursor.slice(index + 1)
					};
				}

				const methodMatch = calleeText.match(/\.(\w+)\s*$/);
				if (methodMatch) {
					return {
						kind: 'method',
						name: methodMatch[1],
						argumentsText: lineBeforeCursor.slice(index + 1)
					};
				}
			}
		}

		return null;
	}

	private countTopLevelCommas(argumentsText: string): number {
		let depth = 0;
		let commas = 0;
		for (let index = 0; index < argumentsText.length; index++) {
			const char = argumentsText[index];
			if (char === '|' || char === '\'' || char === '"') {
				index = this.skipDelimitedText(argumentsText, index, char);
				continue;
			}

			if (char === '(') {
				depth++;
			} else if (char === ')') {
				depth = Math.max(0, depth - 1);
			} else if (char === ',' && depth === 0) {
				commas++;
			}
		}

		return commas;
	}

	private skipDelimitedText(text: string, startIndex: number, delimiter: string): number {
		const endIndex = text.indexOf(delimiter, startIndex + 1);
		return endIndex === -1 ? text.length - 1 : endIndex;
	}

	private skipDelimitedTextBackward(text: string, endIndex: number, delimiter: string): number {
		const startIndex = text.lastIndexOf(delimiter, endIndex - 1);
		return startIndex === -1 ? -1 : startIndex;
	}

	private selectActiveSignature(parameterCounts: number[], activeParameter: number): number {
		const desiredParameterCount = activeParameter + 1;
		let bestIndex = 0;
		let bestCount = Number.MAX_SAFE_INTEGER;

		for (let i = 0; i < parameterCounts.length; i++) {
			const count = parameterCounts[i];
			if (count >= desiredParameterCount && count < bestCount) {
				bestIndex = i;
				bestCount = count;
			}
		}

		if (bestCount !== Number.MAX_SAFE_INTEGER) {
			return bestIndex;
		}

		let largestIndex = 0;
		let largestCount = -1;
		for (let i = 0; i < parameterCounts.length; i++) {
			if (parameterCounts[i] > largestCount) {
				largestIndex = i;
				largestCount = parameterCounts[i];
			}
		}

		return largestIndex;
	}

	private clampActiveParameter(activeParameter: number, parameterCount: number): number {
		if (parameterCount <= 0) {
			return 0;
		}

		return Math.min(Math.max(0, activeParameter), parameterCount - 1);
	}

}
