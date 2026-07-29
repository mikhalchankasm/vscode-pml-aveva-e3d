import * as vscode from 'vscode';
import { PML_SURROUND_PRESETS, PmlSurroundPreset, surroundPmlLines } from './surroundWithCore';

interface SurroundQuickPickItem extends vscode.QuickPickItem {
	preset: PmlSurroundPreset;
}

export function registerPmlSurroundWith(context: vscode.ExtensionContext): void {
	context.subscriptions.push(vscode.commands.registerCommand('pml.surroundWith', surroundWith));
}

async function surroundWith(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor || editor.document.languageId !== 'pml') {
		void vscode.window.showErrorMessage('Open a PML file to use Surround With');
		return;
	}

	const selectedRanges = wholeLineRanges(editor);
	if (selectedRanges.length === 0) {
		void vscode.window.showInformationMessage('Select one or more PML lines to surround');
		return;
	}
	if (hasOverlappingRanges(selectedRanges)) {
		void vscode.window.showErrorMessage('Surround With cannot use overlapping selections');
		return;
	}
	const document = editor.document;
	const documentVersion = document.version;

	const picked = await vscode.window.showQuickPick<SurroundQuickPickItem>(
		PML_SURROUND_PRESETS.map(preset => ({
			label: preset.label,
			description: preset.description,
			preset
		})),
		{
			title: 'PML: Surround With',
			placeHolder: 'Choose a PML block'
		}
	);
	if (!picked) {
		return;
	}
	if (document.isClosed || document.version !== documentVersion) {
		void vscode.window.showInformationMessage('The PML document changed; select the lines and run Surround With again');
		return;
	}

	const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
	const indentUnit = editor.options.insertSpaces === true
		? ' '.repeat(typeof editor.options.tabSize === 'number' ? editor.options.tabSize : 4)
		: '\t';
	try {
		const applied = await editor.edit(editBuilder => {
			for (const range of selectedRanges) {
				editBuilder.replace(
					range,
					surroundPmlLines(document.getText(range), picked.preset, eol, indentUnit)
				);
			}
		});
		if (!applied) {
			void vscode.window.showErrorMessage('Failed to surround the selected PML lines');
		}
	} catch {
		void vscode.window.showErrorMessage('Failed to surround the selected PML lines');
	}
}

function wholeLineRanges(editor: vscode.TextEditor): vscode.Range[] {
	const unique = new Map<string, vscode.Range>();
	for (const selection of editor.selections) {
		if (selection.isEmpty) {
			continue;
		}
		const endLine = selection.end.character === 0 && selection.end.line > selection.start.line
			? selection.end.line - 1
			: selection.end.line;
		const range = new vscode.Range(
			selection.start.line,
			0,
			endLine,
			editor.document.lineAt(endLine).text.length
		);
		unique.set(`${range.start.line}:${range.end.line}`, range);
	}
	return [...unique.values()].sort((left, right) => left.start.compareTo(right.start));
}

function hasOverlappingRanges(ranges: readonly vscode.Range[]): boolean {
	return ranges.some((range, index) => index > 0 && range.start.isBeforeOrEqual(ranges[index - 1].end));
}
