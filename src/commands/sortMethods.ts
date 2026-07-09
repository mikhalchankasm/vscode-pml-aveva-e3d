/**
 * Sort Methods Command
 * Sorts method definitions in PML files alphabetically
 */

import * as vscode from 'vscode';
import { extractMethodBlocksFromText, MethodBlock } from './sortMethodsCore';

/**
 * Extract all method blocks from a document
 */
function extractMethodBlocks(document: vscode.TextDocument): MethodBlock[] {
	const text = document.getText();
	const eol = text.includes('\r\n') ? '\r\n' : '\n';
	return extractMethodBlocksFromText(text, eol);
}

/**
 * Sort methods in ascending order (A→Z)
 */
export async function sortMethodsAscending() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor');
		return;
	}

	const document = editor.document;
	if (document.languageId !== 'pml') {
		vscode.window.showInformationMessage('This command only works with PML files');
		return;
	}

	const methods = extractMethodBlocks(document);
	if (methods.length === 0) {
		vscode.window.showInformationMessage('No methods found in this file');
		return;
	}

	// Sort methods by name (case-insensitive)
	const sortedMethods = [...methods].sort((a, b) =>
		a.name.toLowerCase().localeCompare(b.name.toLowerCase())
	);

	// Check if already sorted
	const isSorted = methods.every((method, index) =>
		method.name === sortedMethods[index].name
	);

	if (isSorted) {
		vscode.window.showInformationMessage('Methods are already sorted A→Z');
		return;
	}

	await applyMethodSort(editor, methods, sortedMethods);
	vscode.window.showInformationMessage(`Sorted ${methods.length} methods (A→Z)`);
}

/**
 * Sort methods in descending order (Z→A)
 */
export async function sortMethodsDescending() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor');
		return;
	}

	const document = editor.document;
	if (document.languageId !== 'pml') {
		vscode.window.showInformationMessage('This command only works with PML files');
		return;
	}

	const methods = extractMethodBlocks(document);
	if (methods.length === 0) {
		vscode.window.showInformationMessage('No methods found in this file');
		return;
	}

	// Sort methods by name (case-insensitive, descending)
	const sortedMethods = [...methods].sort((a, b) =>
		b.name.toLowerCase().localeCompare(a.name.toLowerCase())
	);

	// Check if already sorted
	const isSorted = methods.every((method, index) =>
		method.name === sortedMethods[index].name
	);

	if (isSorted) {
		vscode.window.showInformationMessage('Methods are already sorted Z→A');
		return;
	}

	await applyMethodSort(editor, methods, sortedMethods);
	vscode.window.showInformationMessage(`Sorted ${methods.length} methods (Z→A)`);
}

/**
 * Apply the sorted methods to the document
 */
async function applyMethodSort(
	editor: vscode.TextEditor,
	originalMethods: MethodBlock[],
	sortedMethods: MethodBlock[]
) {
	await editor.edit(editBuilder => {
		// Process methods in reverse order to avoid line number shifts
		for (let i = originalMethods.length - 1; i >= 0; i--) {
			const original = originalMethods[i];
			const sorted = sortedMethods[i];

			// Create range for the entire method block (including comments)
			const range = new vscode.Range(
				original.startLine,
				0,
				original.endLine,
				editor.document.lineAt(original.endLine).text.length
			);

			// Build replacement text (comments + method)
			let replacementText = '';
			if (sorted.precedingComments) {
				replacementText = sorted.precedingComments + '\n';
			}
			replacementText += sorted.text;

			editBuilder.replace(range, replacementText);
		}
	});
}
