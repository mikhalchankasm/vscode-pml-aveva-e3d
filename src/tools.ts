import * as vscode from 'vscode';

export class PMLToolsProvider implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];

    constructor() {
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
        this.registerCommand('pml.removeComments', 'Remove Comments', this.removeComments);
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

    private async applyChanges(editor: vscode.TextEditor, newText: string, message: string) {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(editor.document.getText().length)
        );
        edit.replace(editor.document.uri, fullRange, newText);
        
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

        const text = editor.document.getText();
        const lines = text.split('\n');
        const sortedLines = [...lines].sort((a, b) => a.localeCompare(b));
        const newText = sortedLines.join('\n');
        
        this.applyChanges(editor, newText, 'Sorted lines A-Z');
    };

    private sortLinesDesc = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const text = editor.document.getText();
        const lines = text.split('\n');
        const sortedLines = [...lines].sort((a, b) => b.localeCompare(a));
        const newText = sortedLines.join('\n');
        
        this.applyChanges(editor, newText, 'Sorted lines Z-A');
    };

    private sortLinesLength = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const text = editor.document.getText();
        const lines = text.split('\n');
        const sortedLines = [...lines].sort((a, b) => a.length - b.length);
        const newText = sortedLines.join('\n');
        
        this.applyChanges(editor, newText, 'Sorted lines by length');
    };

    private sortLinesSmart = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        const lines = text.split('\n');
        const sorted = [...lines].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        this.applyChanges(editor, sorted.join('\n'), 'Smart sorted lines');
    };

    // Duplicates & whitespace
    private removeDuplicates = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        const lines = text.split('\n');
        const seen = new Set<string>();
        const filtered = lines.filter(l => (seen.has(l) ? false : (seen.add(l), true)));
        this.applyChanges(editor, filtered.join('\n'), `Removed ${lines.length - filtered.length} duplicate lines`);
    };

    private removeConsecutiveDuplicates = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        const lines = text.split('\n');
        const filtered: string[] = [];
        for (const line of lines) {
            if (filtered.length === 0 || filtered[filtered.length - 1] !== line) {
                filtered.push(line);
            }
        }
        this.applyChanges(editor, filtered.join('\n'), `Removed ${lines.length - filtered.length} consecutive duplicates`);
    };

    private removeEmptyLines = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        const lines = text.split('\n');
        const filtered = lines.filter(line => line.length > 0);
        this.applyChanges(editor, filtered.join('\n'), `Removed ${lines.length - filtered.length} empty lines`);
    };

    private removeWhitespaceLines = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        const lines = text.split('\n');
        const filtered = lines.filter(line => !/^\s+$/.test(line));
        this.applyChanges(editor, filtered.join('\n'), `Removed ${lines.length - filtered.length} whitespace-only lines`);
    };

    private trimWhitespace = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        const lines = text.split('\n');
        const trimmed = lines.map(line => line.replace(/[ \t]+$/g, ''));
        this.applyChanges(editor, trimmed.join('\n'), 'Trimmed trailing whitespace');
    };

    private tabsToSpaces = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        const indentSize = vscode.workspace.getConfiguration('pml.formatter').get<number>('indentSize', 4);
        const spaces = ' '.repeat(indentSize);
        const newText = text.replace(/\t/g, spaces);
        this.applyChanges(editor, newText, 'Converted tabs to spaces');
    };

    private spacesToTabs = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        const lines = text.split('\n');
        const indentSize = vscode.workspace.getConfiguration('pml.formatter').get<number>('indentSize', 4);
        const converted = lines.map(line => {
            const m = line.match(/^( +)/);
            if (!m) return line;
            const len = m[1].length;
            const tabs = '\t'.repeat(Math.floor(len / indentSize));
            const rest = ' '.repeat(len % indentSize);
            return tabs + rest + line.slice(len);
        });
        this.applyChanges(editor, converted.join('\n'), 'Converted spaces to tabs');
    };

    // PML helpers
    private extractVariables = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        const variables = new Set<string>();
        const varRegex = /!{1,2}[a-zA-Z_][a-zA-Z0-9_]*/g;
        let match: RegExpExecArray | null;
        while ((match = varRegex.exec(text)) !== null) {
            variables.add(match[0]);
        }
        const varList = Array.from(variables).sort();
        if (varList.length === 0) {
            vscode.window.showInformationMessage('No variables found');
            return;
        }
        const varText = `-- Extracted variables (${varList.length}):\n${varList.join('\n')}`;
        vscode.workspace.openTextDocument({ content: varText, language: 'pml' }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
        vscode.window.showInformationMessage(`Extracted ${varList.length} variables. Opened in a new document.`);
    };

    private extractMethods = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        const methods = new Set<string>();
        const methodRegex = /define\s+method\s+\.?([a-zA-Z_][a-zA-Z0-9_]*)/gi;
        let match: RegExpExecArray | null;
        while ((match = methodRegex.exec(text)) !== null) {
            methods.add(match[1]);
        }
        const list = Array.from(methods).sort();
        if (list.length === 0) {
            vscode.window.showInformationMessage('No methods found');
            return;
        }
        const outText = `-- Extracted methods (${list.length}):\n${list.join('\n')}`;
        vscode.workspace.openTextDocument({ content: outText, language: 'pml' }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
        vscode.window.showInformationMessage(`Extracted ${list.length} methods. Opened in a new document.`);
    };

    private removeComments = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;
        const text = editor.document.getText();
        let newText = text;
        // remove comments: lines starting with -- and $*
        newText = newText.replace(/--.*$/gm, '');
        newText = newText.replace(/\$\*.*$/gm, '');
        // collapse multiple blank lines introduced by stripping comments
        const filtered = newText.split('\n').filter(line => line.trim() !== '');
        this.applyChanges(editor, filtered.join('\n'), 'Removed comments');
    };
}

