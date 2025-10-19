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

		// Find method call: .methodName(
		const methodMatch = line.match(/\.(\w+)\s*\(([^)]*)$/);
		if (!methodMatch) {
			return null;
		}

		const methodName = methodMatch[1];
		const currentParams = methodMatch[2];

		// Count how many parameters already entered (by counting commas)
		const activeParameter = currentParams.split(',').length - 1;

		// Find method in symbol index
		const methods = this.symbolIndex.findMethod(methodName);
		if (methods.length === 0) {
			return null;
		}

		// Build signatures for all overloads
		const signatures: SignatureInformation[] = [];

		for (const method of methods) {
			const params = method.parameters.map(p => {
				return ParameterInformation.create(p);
			});

			const label = `.${method.name}(${method.parameters.join(', ')})`;
			const documentation = method.documentation || `Method: .${method.name}`;

			signatures.push({
				label,
				documentation,
				parameters: params
			});
		}

		return {
			signatures,
			activeSignature: 0,
			activeParameter: Math.max(0, activeParameter)
		};
	}
}
