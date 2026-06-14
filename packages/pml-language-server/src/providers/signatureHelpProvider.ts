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

export class SignatureHelpProvider {
	constructor(private symbolIndex: SymbolIndex) {}

	public provide(params: SignatureHelpParams, document: TextDocument): SignatureHelp | null {
		const position = params.position;
		const line = document.getText({
			start: { line: position.line, character: 0 },
			end: position
		});

		const methodMatch = line.match(/\.(\w+)\s*\(([^)]*)$/);
		const functionMatch = methodMatch ? null : line.match(/!!(\w+)\s*\(([^)]*)$/);
		if (!methodMatch && !functionMatch) {
			return null;
		}

		const symbolName = (methodMatch ?? functionMatch)![1];
		const currentParams = (methodMatch ?? functionMatch)![2];

		// Count how many parameters already entered (by counting commas)
		const activeParameter = currentParams.split(',').length - 1;

		// Find method in symbol index
		const signaturesSource = methodMatch
			? this.symbolIndex.findMethodsInFile(document.uri, symbolName)
			: this.symbolIndex.findFunction(symbolName);
		if (signaturesSource.length === 0) {
			return null;
		}

		// Build signatures for all overloads
		const signatures: SignatureInformation[] = [];

		for (const symbol of signaturesSource) {
			const parameterLabels = symbol.parameters.map(parameter => this.formatParameterName(parameter));
			const params = parameterLabels.map(parameter => {
				return ParameterInformation.create(parameter);
			});

			const label = symbol.signature || `${methodMatch ? '.' : '!!'}${symbol.name}(${parameterLabels.join(', ')})`;
			const documentation = symbol.documentation || `${methodMatch ? 'Method' : 'Function'}: ${methodMatch ? '.' : '!!'}${symbol.name}`;

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

	private formatParameterName(parameter: string): string {
		return parameter.startsWith('!') ? parameter : `!${parameter}`;
	}
}
