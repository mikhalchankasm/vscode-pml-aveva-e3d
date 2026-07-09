import { Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface PmlGlobalSymbolAtPosition {
	range: Range;
	text: string;
	hasMemberAccess: boolean;
}

export function getPmlGlobalSymbolAtPosition(
	document: TextDocument,
	position: { line: number; character: number }
): PmlGlobalSymbolAtPosition | null {
	const text = document.getText();
	const offset = document.offsetAt(position);
	const lineStart = text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
	const lineEndIndex = text.indexOf('\n', offset);
	const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
	const lineText = text.slice(lineStart, lineEnd);
	const lineOffset = offset - lineStart;

	const pattern = /!![A-Za-z_][A-Za-z0-9_]*/g;
	let match;
	while ((match = pattern.exec(lineText)) !== null) {
		const start = match.index;
		const end = start + match[0].length;
		if (lineOffset < start || lineOffset > end) {
			continue;
		}
		return {
			range: {
				start: document.positionAt(lineStart + start),
				end: document.positionAt(lineStart + end)
			},
			text: match[0],
			hasMemberAccess: lineText[end] === '.'
		};
	}

	return null;
}
