import { Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface ProviderWordRangeOptions {
	includeVariablePrefixes?: boolean;
	includeSlash?: boolean;
	stopBackwardAtSpecialCharacters?: boolean;
}

export function getProviderWordRangeAtPosition(
	document: TextDocument,
	position: { line: number; character: number },
	options: ProviderWordRangeOptions = {}
): Range | null {
	const text = document.getText();
	const offset = document.offsetAt(position);

	let start = offset;
	let end = offset;

	while (start > 0 && isProviderWordChar(text[start - 1], options)) {
		if (options.stopBackwardAtSpecialCharacters && isBackwardStopChar(text[start - 1])) {
			break;
		}
		start--;
	}

	while (end < text.length && isProviderWordChar(text[end], options)) {
		end++;
	}

	if (start === end) {
		return null;
	}

	return {
		start: document.positionAt(start),
		end: document.positionAt(end)
	};
}

function isProviderWordChar(char: string, options: ProviderWordRangeOptions): boolean {
	return /[a-zA-Z0-9_.]/.test(char) ||
		(options.includeVariablePrefixes === true && (char === '!' || char === '$')) ||
		(options.includeSlash === true && char === '/');
}

function isBackwardStopChar(char: string): boolean {
	return /[!$:=+\-*/<>()[\]{},;\s]/.test(char);
}
