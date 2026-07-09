import { Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

export function isObjectSymbolSyntaxAt(document: TextDocument, wordRange: Range): boolean {
	const text = document.getText();
	const startOffset = document.offsetAt(wordRange.start);
	const lineStart = text.lastIndexOf('\n', Math.max(0, startOffset - 1)) + 1;
	const linePrefix = text.slice(lineStart, startOffset);

	return /\b(?:OBJECT|IS)\s+$/i.test(linePrefix);
}
