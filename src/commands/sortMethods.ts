/**
 * Sort Methods Command
 * Sorts method definitions in PML files alphabetically
 */

import * as vscode from 'vscode';

interface MethodBlock {
	name: string;
	startLine: number;
	endLine: number;
	text: string;
	precedingComments: string;
}

/**
 * Extract all method blocks from a document
 */
function extractMethodBlocks(document: vscode.TextDocument): MethodBlock[] {
	const text = document.getText();
	const lines = text.split('\n');
	const methods: MethodBlock[] = [];

	let i = 0;
	while (i < lines.length) {
		const line = lines[i].trim();

		// Check for method definition
		const methodMatch = line.match(/^define\s+method\s+\.([A-Za-z0-9_]+)/i);
		if (methodMatch) {
			const methodName = methodMatch[1];
			const methodStartLine = i;

			// Look for preceding comments (JSDoc style or regular comments)
			let commentStartLine = i;
			let precedingComments = '';

			// Go backwards to find comments
			for (let j = i - 1; j >= 0; j--) {
				const prevLine = lines[j].trim();

				// Stop at empty line or non-comment
				if (prevLine === '') {
					// Empty line - check if there are more comments above
					if (j > 0 && (lines[j - 1].trim().startsWith('--') || lines[j - 1].trim().startsWith('$*'))) {
						continue; // Skip empty line and keep looking
					} else {
						break; // Stop at empty line
					}
				}

				if (prevLine.startsWith('--') || prevLine.startsWith('$*')) {
					commentStartLine = j;
					precedingComments = lines.slice(j, i).join('\n') + '\n' + precedingComments;
				} else {
					break; // Stop at non-comment line
				}
			}

			// Find endmethod
			let methodEndLine = i;
			let depth = 1;
			for (let j = i + 1; j < lines.length; j++) {
				const currentLine = lines[j].trim();

				// Track nested define...endmethod
				if (currentLine.match(/^define\s+method/i)) {
					depth++;
				} else if (currentLine.match(/^endmethod/i)) {
					depth--;
					if (depth === 0) {
						methodEndLine = j;
						break;
					}
				}
			}

			// Extract method text (without preceding comments)
			const methodText = lines.slice(methodStartLine, methodEndLine + 1).join('\n');

			methods.push({
				name: methodName,
				startLine: commentStartLine,
				endLine: methodEndLine,
				text: methodText,
				precedingComments: precedingComments.trimEnd()
			});

			// Skip to after this method
			i = methodEndLine + 1;
		} else {
			i++;
		}
	}

	return methods;
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
