import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { addToArrayText, reindexArrayText } from './arrayCommandsCore';
import { buildReloadFormCommand, findFormReloadTargets } from './reloadFormUtils';
import {
    leadingSpacesToTabsText,
    removeConsecutiveDuplicateLinesText,
    removeDuplicateLinesText,
    removeEmptyLinesText,
    removeWhitespaceOnlyLinesText,
    sortLinesAscText,
    sortLinesByLengthText,
    sortLinesDescText,
    sortLinesSmartText,
    splitTextLines,
    trimTrailingWhitespaceText
} from './lineCommandsCore';

function getDocumentEol(document: vscode.TextDocument): string {
    return document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
}

export class PMLToolsProvider implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];

    constructor(private readonly extensionPath: string) {
        this.registerCommands();
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
    }

    private registerCommands() {
        // Sorting
        this.registerCommand('pml.sortLinesAsc', 'Sort Lines A-Z', this.sortLinesAsc);
        this.registerCommand('pml.sortLinesDesc', 'Sort Lines Z-A', this.sortLinesDesc);
        this.registerCommand('pml.sortLinesLength', 'Sort Lines by Length', this.sortLinesLength);
        this.registerCommand('pml.sortLinesSmart', 'Smart Natural Sort', this.sortLinesSmart);

        // Duplicates
        this.registerCommand('pml.removeDuplicates', 'Remove Duplicate Lines', this.removeDuplicates);
        this.registerCommand('pml.removeConsecutiveDuplicates', 'Remove Consecutive Duplicates', this.removeConsecutiveDuplicates);

        // Whitespace
        this.registerCommand('pml.removeEmptyLines', 'Remove Empty Lines', this.removeEmptyLines);
        this.registerCommand('pml.removeWhitespaceLines', 'Remove Whitespace-Only Lines', this.removeWhitespaceLines);
        this.registerCommand('pml.trimWhitespace', 'Trim Trailing Whitespace', this.trimWhitespace);
        this.registerCommand('pml.tabsToSpaces', 'Convert Tabs to Spaces', this.tabsToSpaces);
        this.registerCommand('pml.spacesToTabs', 'Convert Spaces to Tabs', this.spacesToTabs);

        // PML helpers
        this.registerCommand('pml.extractVariables', 'Extract Variables', this.extractVariables);
        this.registerCommand('pml.extractMethods', 'Extract Methods', this.extractMethods);
        this.registerCommand('pml.addComments', 'Add Comments', this.addComments);
        this.registerCommand('pml.removeComments', 'Remove Comments', this.removeComments);
        this.registerCommand('pml.alignPML', 'Align PML', this.alignPML);

        // Form helpers
        this.registerCommand('pml.reloadForm', 'Reload Form', this.reloadForm);
        this.registerCommand('pml.generateMethodsSummary', 'Generate Methods Summary', this.generateMethodsSummary);
        this.registerCommand('pml.updateMethodsSummary', 'Update Methods Summary', this.updateMethodsSummary);
        this.registerCommand('pml.insertMethodDocBlock', 'Insert Method Documentation Block', this.insertMethodDocBlock);

        // Array helpers
        this.registerCommand('pml.makeListBasic', 'Basic Array', this.makeListBasic);
        this.registerCommand('pml.makeListPath', 'Make Array (add /)', this.makeListPath);
        this.registerCommand('pml.makeListString', 'Make Array (add |....|)', this.makeListString);
        this.registerCommand('pml.makeListPathString', 'Make Array (add / and |....|)', this.makeListPathString);
        this.registerCommand('pml.reindexArray', 'Reindex Selected Array', this.reindexArray);
        this.registerCommand('pml.addToArray', 'Add to Array', this.addToArray);

        // Examples
        this.registerCommand('pml.openButtonExample', 'Button Gadgets Example', this.openButtonExample);
        this.registerCommand('pml.openFrameExample', 'Frame Gadgets Example', this.openFrameExample);
    }

    private registerCommand(command: string, _title: string, callback: () => void) {
        const disposable = vscode.commands.registerCommand(command, callback);
        this.disposables.push(disposable);
        return disposable;
    }

    private getActiveEditor(): vscode.TextEditor | undefined {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return undefined;
        }
        if (editor.document.languageId !== 'pml') {
            vscode.window.showErrorMessage('Not a PML document');
            return undefined;
        }
        return editor;
    }

    private getSelectedTextOrShowError(editor: vscode.TextEditor): { text: string; range: vscode.Range } | undefined {
        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select text to apply the command');
            return undefined;
        }
        const text = editor.document.getText(selection);
        return { text, range: selection };
    }

    private async applyChangesToSelection(editor: vscode.TextEditor, range: vscode.Range, newText: string, message: string) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, range, newText);
        
        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
            vscode.window.showInformationMessage(message);
        } else {
            vscode.window.showErrorMessage('Failed to apply changes');
        }
    }

    // Sorting
    private sortLinesAsc = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const newText = sortLinesAscText(selected.text);
        
        this.applyChangesToSelection(editor, selected.range, newText, 'Sorted lines A-Z');
    };

    private sortLinesDesc = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const newText = sortLinesDescText(selected.text);
        
        this.applyChangesToSelection(editor, selected.range, newText, 'Sorted lines Z-A');
    };

    private sortLinesLength = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const newText = sortLinesByLengthText(selected.text);
        
        this.applyChangesToSelection(editor, selected.range, newText, 'Sorted lines by length');
    };

    private sortLinesSmart = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        this.applyChangesToSelection(editor, selected.range, sortLinesSmartText(selected.text), 'Smart sorted lines');
    };

    // Duplicates & whitespace
    private removeDuplicates = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const result = removeDuplicateLinesText(selected.text);
        this.applyChangesToSelection(editor, selected.range, result.text, `Removed ${result.removed} duplicate lines`);
    };

    private removeConsecutiveDuplicates = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const result = removeConsecutiveDuplicateLinesText(selected.text);
        this.applyChangesToSelection(editor, selected.range, result.text, `Removed ${result.removed} consecutive duplicates`);
    };

    private removeEmptyLines = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const result = removeEmptyLinesText(selected.text);
        this.applyChangesToSelection(editor, selected.range, result.text, `Removed ${result.removed} empty lines`);
    };

    private removeWhitespaceLines = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const result = removeWhitespaceOnlyLinesText(selected.text);
        this.applyChangesToSelection(editor, selected.range, result.text, `Removed ${result.removed} whitespace-only lines`);
    };

    private trimWhitespace = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        this.applyChangesToSelection(editor, selected.range, trimTrailingWhitespaceText(selected.text), 'Trimmed trailing whitespace');
    };

    private tabsToSpaces = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const indentSize = vscode.workspace.getConfiguration('pml.formatter').get<number>('indentSize', 4);
        const spaces = ' '.repeat(indentSize);
        const newText = selected.text.replace(/\t/g, spaces);
        this.applyChangesToSelection(editor, selected.range, newText, 'Converted tabs to spaces');
    };

    private spacesToTabs = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const indentSize = vscode.workspace.getConfiguration('pml.formatter').get<number>('indentSize', 4);
        this.applyChangesToSelection(editor, selected.range, leadingSpacesToTabsText(selected.text, indentSize), 'Converted spaces to tabs');
    };

    // PML helpers
    private extractVariables = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const variables = new Set<string>();
        const varRegex = /!{1,2}[a-zA-Z_][a-zA-Z0-9_]*/g;
        let match: RegExpExecArray | null;
        while ((match = varRegex.exec(selected.text)) !== null) {
            variables.add(match[0]);
        }
        const varList = Array.from(variables).sort();
        if (varList.length === 0) {
            vscode.window.showInformationMessage('No variables found');
            return;
        }
        const eol = getDocumentEol(editor.document);
        const varText = `-- Extracted variables (${varList.length}):${eol}${varList.join(eol)}`;
        vscode.workspace.openTextDocument({ content: varText, language: 'pml' }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
        vscode.window.showInformationMessage(`Extracted ${varList.length} variables. Opened in a new document.`);
    };

    private extractMethods = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const methods = new Set<string>();
        const methodRegex = /define\s+method\s+\.?([a-zA-Z_][a-zA-Z0-9_]*)/gi;
        let match: RegExpExecArray | null;
        while ((match = methodRegex.exec(selected.text)) !== null) {
            methods.add(match[1]);
        }
        const list = Array.from(methods).sort();
        if (list.length === 0) {
            vscode.window.showInformationMessage('No methods found');
            return;
        }
        const eol = getDocumentEol(editor.document);
        const outText = `-- Extracted methods (${list.length}):${eol}${list.join(eol)}`;
        vscode.workspace.openTextDocument({ content: outText, language: 'pml' }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
        vscode.window.showInformationMessage(`Extracted ${list.length} methods. Opened in a new document.`);
    };

    private addComments = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selection = editor.selection;

        // Always work with full lines, regardless of cursor position
        const startLine = selection.start.line;
        const endLine = selection.end.line;

        // Build range from start of first line to end of last line
        const firstLine = editor.document.lineAt(startLine);
        const lastLine = editor.document.lineAt(endLine);
        const range = new vscode.Range(
            firstLine.range.start,
            lastLine.range.end
        );

        // Get all lines in range
        const lines: string[] = [];
        for (let i = startLine; i <= endLine; i++) {
            lines.push(editor.document.lineAt(i).text);
        }

        // Add -- at the beginning of each line
        const commented = lines.map(line => {
            // Skip empty lines
            if (line.trim() === '') return line;
            // Add -- at the beginning (after indentation)
            const match = line.match(/^(\s*)/);
            const indent = match ? match[1] : '';
            const rest = line.substring(indent.length);
            return `${indent}-- ${rest}`;
        });

        this.applyChangesToSelection(editor, range, commented.join(getDocumentEol(editor.document)), 'Added comments');
    };

    private removeComments = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selection = editor.selection;

        // Always work with full lines, regardless of cursor position
        const startLine = selection.start.line;
        const endLine = selection.end.line;

        // Build range from start of first line to end of last line
        const firstLine = editor.document.lineAt(startLine);
        const lastLine = editor.document.lineAt(endLine);
        const range = new vscode.Range(
            firstLine.range.start,
            lastLine.range.end
        );

        // Get all lines in range
        const lines: string[] = [];
        for (let i = startLine; i <= endLine; i++) {
            lines.push(editor.document.lineAt(i).text);
        }

        // Remove -- from the beginning of each line
        const uncommented = lines.map(line => {
            // Remove -- prefix (after optional indentation)
            // Pattern: optional spaces, then --, then optional space, then capture rest
            let result = line.replace(/^(\s*)--\s?/, '$1');
            // Also remove $* comments
            result = result.replace(/^(\s*)\$\*\s?/, '$1');
            return result;
        });

        this.applyChangesToSelection(editor, range, uncommented.join(getDocumentEol(editor.document)), 'Removed comments');
    };

    private alignPML = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const { lines } = splitTextLines(selected.text);

        // Smart multi-column alignment
        // Detects multiple alignment points: =, is, --, $*, etc.
        let aligned: string[];

        // Try smart multi-column alignment first
        if (this.hasMultipleAlignmentPoints(lines)) {
            aligned = this.alignSmartMultiColumn(lines);
        } else {
            // Fallback to single-column alignment
            const hasEquals = lines.some(line => line.includes('='));
            const hasIs = lines.some(line => /\s+is\s+/i.test(line));

            if (hasIs) {
                // Align by 'is' keyword (member declarations)
                aligned = this.alignByKeyword(lines, /\s+(is)\s+/i);
            } else if (hasEquals) {
                // Align by '=' operator
                aligned = this.alignByOperator(lines, '=');
            } else {
                vscode.window.showInformationMessage('No alignment target found (= or is)');
                return;
            }
        }

        this.applyChangesToSelection(editor, selected.range, aligned.join(getDocumentEol(editor.document)), 'Aligned PML');
    };

    private alignByOperator(lines: string[], operator: string): string[] {
        // Find the maximum position of the operator
        let maxPos = 0;
        const positions: number[] = [];

        for (const line of lines) {
            const trimmed = line.trimEnd();
            const idx = trimmed.indexOf(operator);
            if (idx >= 0) {
                // Find position before operator (trim right spaces before =)
                let pos = idx;
                while (pos > 0 && trimmed[pos - 1] === ' ') {
                    pos--;
                }
                positions.push(pos);
                maxPos = Math.max(maxPos, pos);
            } else {
                positions.push(-1); // no operator on this line
            }
        }

        // Align lines
        return lines.map((line, i) => {
            if (positions[i] < 0) return line;

            const trimmed = line.trimEnd();
            const idx = trimmed.indexOf(operator);

            // Get parts before and after operator
            const before = trimmed.substring(0, idx).trimEnd();
            const after = trimmed.substring(idx);

            // Calculate spaces needed
            const spacesNeeded = maxPos - before.length;
            const padding = ' '.repeat(Math.max(0, spacesNeeded));

            return before + padding + ' ' + after;
        });
    }

    private alignByKeyword(lines: string[], keywordRegex: RegExp): string[] {
        // Find the maximum position of the keyword
        let maxPos = 0;
        const matches: Array<{ before: string; keyword: string; after: string } | null> = [];

        for (const line of lines) {
            const trimmed = line.trimEnd();
            const match = trimmed.match(keywordRegex);

            if (match && match.index !== undefined) {
                const keywordStart = match.index;
                const before = trimmed.substring(0, keywordStart).trimEnd();
                const keyword = match[1];
                const after = trimmed.substring(keywordStart + match[0].length);

                matches.push({ before, keyword, after });
                maxPos = Math.max(maxPos, before.length);
            } else {
                matches.push(null);
            }
        }

        // Align lines
        return lines.map((line, i) => {
            const match = matches[i];
            if (!match) return line;

            const spacesNeeded = maxPos - match.before.length;
            const padding = ' '.repeat(Math.max(0, spacesNeeded));

            return match.before + padding + ' ' + match.keyword + ' ' + match.after;
        });
    }

    /**
     * Check if lines have multiple potential alignment points
     */
    private hasMultipleAlignmentPoints(lines: string[]): boolean {
        // Check if we have assignment lines with comments
        const linesWithBoth = lines.filter(line =>
            line.includes('=') && (line.includes('--') || line.includes('$*'))
        ).length;

        return linesWithBoth >= 2;
    }

    /**
     * Smart multi-column alignment
     * Aligns both assignments (=) and comments (--, $*) in separate columns
     */
    private alignSmartMultiColumn(lines: string[]): string[] {
        interface LineInfo {
            indent: string;
            beforeEqual: string;
            equal: string;
            afterEqual: string;
            comment: string;
            hasEqual: boolean;
            hasComment: boolean;
        }

        // Parse all lines
        const parsed: LineInfo[] = lines.map(line => {
            // Match indent
            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';
            const rest = line.substring(indent.length);

            // Check for comment
            const commentMatch = rest.match(/(--|\$\*)/);
            const hasComment = commentMatch !== null;
            let beforeComment = rest;
            let comment = '';

            if (hasComment && commentMatch) {
                const commentStart = commentMatch.index!;
                beforeComment = rest.substring(0, commentStart).trimEnd();
                comment = rest.substring(commentStart);
            }

            // Check for equals in the non-comment part
            const equalIdx = beforeComment.indexOf('=');
            const hasEqual = equalIdx >= 0;

            let beforeEqual = '';
            let equal = '';
            let afterEqual = '';

            if (hasEqual) {
                beforeEqual = beforeComment.substring(0, equalIdx).trimEnd();
                equal = '=';
                afterEqual = beforeComment.substring(equalIdx + 1).trimStart();
            } else {
                afterEqual = beforeComment;
            }

            return {
                indent,
                beforeEqual,
                equal,
                afterEqual,
                comment,
                hasEqual,
                hasComment
            };
        });

        // Find maximum positions
        let maxBeforeEqual = 0;
        let maxAfterEqual = 0;

        for (const info of parsed) {
            if (info.hasEqual) {
                maxBeforeEqual = Math.max(maxBeforeEqual, info.beforeEqual.length);
                if (info.hasComment) {
                    maxAfterEqual = Math.max(maxAfterEqual, info.afterEqual.length);
                }
            }
        }

        // Build aligned lines
        return parsed.map(info => {
            if (!info.hasEqual && !info.hasComment) {
                // Line without equals or comment - return as is
                return info.indent + info.afterEqual;
            }

            let result = info.indent;

            if (info.hasEqual) {
                // Align equals
                const paddingBeforeEqual = ' '.repeat(Math.max(0, maxBeforeEqual - info.beforeEqual.length));
                result += info.beforeEqual + paddingBeforeEqual + ' ' + info.equal + ' ' + info.afterEqual;

                if (info.hasComment) {
                    // Align comment
                    const currentLength = info.afterEqual.length;
                    const paddingBeforeComment = ' '.repeat(Math.max(1, maxAfterEqual - currentLength + 2));
                    result += paddingBeforeComment + info.comment;
                }
            } else if (info.hasComment) {
                // Only comment, no equals
                result += info.comment;
            }

            return result;
        });
    }

    // Form helpers
    private reloadForm = async () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const text = editor.document.getText();
        const targets = findFormReloadTargets(text);
        if (targets.length === 0) {
            const extension = path.extname(editor.document.uri.fsPath).toLowerCase();
            const message = extension === '.pmlfrm'
                ? 'This .pmlfrm file has no active "setup form" or "layout form" declaration.'
                : 'Reload Form requires a PML form document with an active "setup form" or "layout form" declaration.';
            vscode.window.showErrorMessage(message);
            return;
        }

        let target = targets[0];
        if (targets.length > 1) {
            const picked = await vscode.window.showQuickPick(
                targets.map(candidate => ({
                    label: candidate.name,
                    description: `Line ${candidate.line + 1}`,
                    target: candidate
                })),
                {
                    title: 'Select Form to Reload',
                    placeHolder: 'Choose the form whose AVEVA reload command should be copied'
                }
            );
            if (!picked) {
                return;
            }
            target = picked.target;
        }

        if (editor.document.isDirty && !(await editor.document.save())) {
            vscode.window.showErrorMessage(`Could not save ${path.basename(editor.document.uri.fsPath)} before preparing the reload command.`);
            return;
        }

        const reloadCommand = buildReloadFormCommand(target.name);
        await vscode.env.clipboard.writeText(reloadCommand);
        vscode.window.showInformationMessage(`AVEVA reload command for ${target.name} copied to the clipboard.`);
    };

    // Array helpers
    private makeListBasic = async () => {
        await this.makeListHelper('');
    };

    private makeListPath = async () => {
        await this.makeListHelper('/');
    };

    private makeListString = async () => {
        await this.makeListHelper("'");
    };

    private makeListPathString = async () => {
        await this.makeListHelper("'/");
    };

    private makeListHelper = async (prefix: string) => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        // Request the variable name.
        const varName = await vscode.window.showInputBox({
            prompt: 'Enter a variable name for the array',
            placeHolder: 'list',
            value: 'list'
        });

        if (!varName) {
            return; // The user cancelled the input.
        }

        // Normalize selected lines.
        const lines = splitTextLines(selected.text).lines
            .map(line => line.trim())
            .filter(line => line.length > 0); // Ignore empty lines.

        if (lines.length === 0) {
            vscode.window.showErrorMessage('No lines to process.');
            return;
        }

        // Determine the maximum index length for alignment.
        const maxIndexLength = lines.length.toString().length;

        // Generate the array assignments.
        const result = lines.map((line, index) => {
            const idx = (index + 1).toString().padEnd(maxIndexLength);
            
            // Determine the value format.
            let value: string;
            if (prefix === '/') {
                value = `/${line}`;
            } else if (prefix === "'") {
                value = `'${line}'`;
            } else if (prefix === "'/") {
                value = `'/${line}'`;
            } else {
                value = line;
            }

            return `!${varName}[${idx}] = ${value}`;
        });

        this.applyChangesToSelection(editor, selected.range, result.join(getDocumentEol(editor.document)), 'Created array list');
    };

    /**
     * Reindex selected array assignment lines from 1 within the current selection.
     */
    private reindexArray = async () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const result = reindexArrayText(selected.text);
        if (result === null) {
            vscode.window.showErrorMessage('No array assignments found in the selection');
            return;
        }

        await this.applyChangesToSelection(editor, selected.range, result, 'Array indices reindexed');
    };

    /**
     * Add selected lines as new array elements.
     */
    private addToArray = async () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const result = addToArrayText(selected.text);
        if (result === null) {
            vscode.window.showErrorMessage('No array assignments found in the selection.');
            return;
        }

        if (result.added === 0) {
            vscode.window.showInformationMessage('No lines to add to the array.');
            return;
        }

        await this.applyChangesToSelection(editor, selected.range, result.text,
            `Added ${result.added} items to array`);
    };

    // Form documentation helpers
    private generateMethodsSummary = async () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const document = editor.document;

        // Check if this is a form file
        if (!document.fileName.toLowerCase().endsWith('.pmlfrm')) {
            vscode.window.showWarningMessage('This command is designed for .pmlfrm files');
            return;
        }

        const methods = this.parseFormMethods(document);

        if (methods.length === 0) {
            vscode.window.showInformationMessage('No methods found in the form');
            return;
        }

        const summary = this.formatMethodsSummary(methods, getDocumentEol(document));

        // Insert at cursor position
        const position = editor.selection.active;
        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, position, summary);

        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
            vscode.window.showInformationMessage(`Generated summary for ${methods.length} methods`);
        } else {
            vscode.window.showErrorMessage('Failed to insert methods summary');
        }
    };

    private updateMethodsSummary = async () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const document = editor.document;

        // Check if this is a form file
        if (!document.fileName.toLowerCase().endsWith('.pmlfrm')) {
            vscode.window.showWarningMessage('This command is designed for .pmlfrm files');
            return;
        }

        const methods = this.parseFormMethods(document);

        if (methods.length === 0) {
            vscode.window.showInformationMessage('No methods found in the form');
            return;
        }

        const text = document.getText();
        const summaryRegex = /--\s*Methods defined:\s*--\s*\n--\s*Method call\s+Return\s+Description\s*\n--\s*===========\s+======\s+===========\s*\n((?:--\s+.*\n)*)/;
        const match = text.match(summaryRegex);

        if (!match) {
            vscode.window.showWarningMessage('No existing methods summary found. Use "Generate Methods Summary" instead.');
            return;
        }

        const newSummary = this.formatMethodsSummary(methods, getDocumentEol(document));
        const startIdx = match.index!;
        const endIdx = startIdx + match[0].length;

        const edit = new vscode.WorkspaceEdit();
        const startPos = document.positionAt(startIdx);
        const endPos = document.positionAt(endIdx);
        const range = new vscode.Range(startPos, endPos);

        edit.replace(document.uri, range, newSummary);

        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
            vscode.window.showInformationMessage(`Updated summary for ${methods.length} methods`);
        } else {
            vscode.window.showErrorMessage('Failed to update methods summary');
        }
    };

    private parseFormMethods(document: vscode.TextDocument): Array<{name: string, params: string, description: string}> {
        const text = document.getText();
        const methods: Array<{name: string, params: string, description: string}> = [];

        // Match method definitions: define method .methodName(params)
        const methodRegex = /define\s+method\s+\.(\w+)\s*\(([^)]*)\)/gi;
        let match;

        while ((match = methodRegex.exec(text)) !== null) {
            const methodName = match[1];
            const params = match[2].trim();
            const methodStartIdx = match.index;

            // Look for documentation comment before the method (within 5 lines)
            const beforeText = text.substring(Math.max(0, methodStartIdx - 500), methodStartIdx);
            const { lines } = splitTextLines(beforeText);

            let description = '-';

            // Search backwards for comment with $p marker or simple description
            for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
                const line = lines[i].trim();

                // Check for $p marker (AVEVA style)
                const pMatch = line.match(/^\$p\s+(.+)$/);
                if (pMatch) {
                    description = pMatch[1].trim();
                    break;
                }

                // Check for -- comment
                const commentMatch = line.match(/^--\s+(.+)$/);
                if (commentMatch && !commentMatch[1].match(/^=+$/)) {
                    description = commentMatch[1].trim();
                    break;
                }
            }

            methods.push({
                name: methodName,
                params: params,
                description: description
            });
        }

        return methods;
    }

    private formatMethodsSummary(
        methods: Array<{name: string, params: string, description: string}>,
        eol: string
    ): string {
        const lines: string[] = [];

        lines.push('--');
        lines.push('-- Methods defined:');
        lines.push('--');
        lines.push('--  Method call                      Return              Description');
        lines.push('--  ===========                      ======              ===========');

        // Calculate max lengths for alignment
        const maxMethodLength = Math.max(
            ...methods.map(m => {
                const call = m.params ? `.${m.name}(${m.params})` : `.${m.name}()`;
                return call.length;
            }),
            20 // minimum width
        );

        methods.forEach(method => {
            const call = method.params ? `.${method.name}(${method.params})` : `.${method.name}()`;
            const paddedCall = call.padEnd(maxMethodLength + 4);
            const returnType = '-'.padEnd(20);
            const description = method.description;

            lines.push(`--  ${paddedCall}${returnType}${description}`);
        });

        lines.push('--');
        lines.push('------------------------------------------------------------------------');
        lines.push('');

        return lines.join(eol);
    }

    /**
     * Insert AVEVA-standard method documentation block above method definition
     */
    private insertMethodDocBlock = async () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const position = editor.selection.active;
        const document = editor.document;

        // Check if we're on a method definition line or find next method below
        const currentLine = document.lineAt(position.line).text;
        let methodLine = position.line;
        let methodName = '';

        // Check current line for method definition
        const methodMatch = currentLine.match(/define\s+method\s+\.(\w+)\s*\(([^)]*)\)/i);
        if (methodMatch) {
            methodName = methodMatch[1];
        } else {
            // Search for next method definition below cursor
            for (let i = position.line + 1; i < document.lineCount; i++) {
                const line = document.lineAt(i).text;
                const match = line.match(/define\s+method\s+\.(\w+)\s*\(([^)]*)\)/i);
                if (match) {
                    methodLine = i;
                    methodName = match[1];
                    break;
                }
            }
        }

        if (!methodName) {
            vscode.window.showWarningMessage('No method definition found at or below cursor');
            return;
        }

        // Generate documentation block
        const indent = this.getIndentation(document, methodLine);
        const docBlock = [
            `${indent}------------------------------------------------------------------------`,
            `${indent}--`,
            `${indent}-- Method:      ${methodName}`,
            `${indent}--`,
            `${indent}-- Description: `,
            `${indent}--`,
            `${indent}-- Method Type: Function/Procedure`,
            `${indent}-- Arguments:`,
            `${indent}--   [#] [R/RW] [Data Type] [Description]`,
            `${indent}-- Return:`,
            `${indent}--   [Data Type] [Description]`,
            `${indent}--`,
            `${indent}------------------------------------------------------------------------`,
            ''
        ].join(getDocumentEol(document));

        // Insert documentation block above method definition
        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(methodLine, 0), docBlock);
        });

        // Move cursor to Description field for easy editing
        const descriptionLine = methodLine + 4; // Line with "-- Description: "
        const descriptionCol = indent.length + 16; // After "-- Description: "
        editor.selection = new vscode.Selection(
            new vscode.Position(descriptionLine, descriptionCol),
            new vscode.Position(descriptionLine, descriptionCol)
        );
        editor.revealRange(new vscode.Range(methodLine, 0, descriptionLine + 5, 0));

        vscode.window.showInformationMessage(`Documentation block inserted for method .${methodName}`);
    };

    /**
     * Get indentation (leading whitespace) from a line
     */
    private getIndentation(document: vscode.TextDocument, lineNumber: number): string {
        const line = document.lineAt(lineNumber).text;
        const match = line.match(/^(\s*)/);
        return match ? match[1] : '';
    }

    /**
     * Open Button Gadgets Example - loads tutorial from external file
     */
    private openButtonExample = async () => {
        try {
            // Load tutorial content from file
            const tutorialPath = path.join(this.extensionPath, 'examples', 'gadgets', 'ButtonGadgets_Tutorial.md');

            const content = await fs.readFile(tutorialPath, 'utf8');

            const document = await vscode.workspace.openTextDocument({
                content,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage('Button Gadgets example opened');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to load Button Gadgets tutorial: ${message}`);
        }
    };

    /**
     * Open Frame Gadgets Example - loads tutorial from external file
     */
    private openFrameExample = async () => {
        try {
            // Load tutorial content from file
            const tutorialPath = path.join(this.extensionPath, 'examples', 'gadgets', 'FrameGadgets_Tutorial.md');

            const content = await fs.readFile(tutorialPath, 'utf8');

            const document = await vscode.workspace.openTextDocument({
                content,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage('Frame Gadgets example opened');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to load Frame Gadgets tutorial: ${message}`);
        }
    };
}

