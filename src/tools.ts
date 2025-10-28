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
        this.registerCommand('pml.addComments', 'Add Comments', this.addComments);
        this.registerCommand('pml.removeComments', 'Remove Comments', this.removeComments);
        this.registerCommand('pml.alignPML', 'Align PML', this.alignPML);

        // Form helpers
        this.registerCommand('pml.reloadForm', 'Reload Form', this.reloadForm);

        // Array helpers
        this.registerCommand('pml.makeListPath', 'Make List (Path)', this.makeListPath);
        this.registerCommand('pml.makeListString', 'Make List (String)', this.makeListString);
        this.registerCommand('pml.makeListPathString', 'Make List (Path String)', this.makeListPathString);
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

        const lines = selected.text.split('\n');
        const sortedLines = [...lines].sort((a, b) => a.localeCompare(b));
        const newText = sortedLines.join('\n');
        
        this.applyChangesToSelection(editor, selected.range, newText, 'Sorted lines A-Z');
    };

    private sortLinesDesc = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');
        const sortedLines = [...lines].sort((a, b) => b.localeCompare(a));
        const newText = sortedLines.join('\n');
        
        this.applyChangesToSelection(editor, selected.range, newText, 'Sorted lines Z-A');
    };

    private sortLinesLength = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');
        const sortedLines = [...lines].sort((a, b) => a.length - b.length);
        const newText = sortedLines.join('\n');
        
        this.applyChangesToSelection(editor, selected.range, newText, 'Sorted lines by length');
    };

    private sortLinesSmart = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');
        const sorted = [...lines].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        this.applyChangesToSelection(editor, selected.range, sorted.join('\n'), 'Smart sorted lines');
    };

    // Duplicates & whitespace
    private removeDuplicates = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');
        const seen = new Set<string>();
        const filtered = lines.filter(l => (seen.has(l) ? false : (seen.add(l), true)));
        this.applyChangesToSelection(editor, selected.range, filtered.join('\n'), `Removed ${lines.length - filtered.length} duplicate lines`);
    };

    private removeConsecutiveDuplicates = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');
        const filtered: string[] = [];
        for (const line of lines) {
            if (filtered.length === 0 || filtered[filtered.length - 1] !== line) {
                filtered.push(line);
            }
        }
        this.applyChangesToSelection(editor, selected.range, filtered.join('\n'), `Removed ${lines.length - filtered.length} consecutive duplicates`);
    };

    private removeEmptyLines = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');
        const filtered = lines.filter(line => line.length > 0);
        this.applyChangesToSelection(editor, selected.range, filtered.join('\n'), `Removed ${lines.length - filtered.length} empty lines`);
    };

    private removeWhitespaceLines = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');
        const filtered = lines.filter(line => !/^\s+$/.test(line));
        this.applyChangesToSelection(editor, selected.range, filtered.join('\n'), `Removed ${lines.length - filtered.length} whitespace-only lines`);
    };

    private trimWhitespace = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');
        const trimmed = lines.map(line => line.replace(/[ \t]+$/g, ''));
        this.applyChangesToSelection(editor, selected.range, trimmed.join('\n'), 'Trimmed trailing whitespace');
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

        const lines = selected.text.split('\n');
        const indentSize = vscode.workspace.getConfiguration('pml.formatter').get<number>('indentSize', 4);
        const converted = lines.map(line => {
            const m = line.match(/^( +)/);
            if (!m) return line;
            const len = m[1].length;
            const tabs = '\t'.repeat(Math.floor(len / indentSize));
            const rest = ' '.repeat(len % indentSize);
            return tabs + rest + line.slice(len);
        });
        this.applyChangesToSelection(editor, selected.range, converted.join('\n'), 'Converted spaces to tabs');
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
        const varText = `-- Extracted variables (${varList.length}):\n${varList.join('\n')}`;
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
        const outText = `-- Extracted methods (${list.length}):\n${list.join('\n')}`;
        vscode.workspace.openTextDocument({ content: outText, language: 'pml' }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
        vscode.window.showInformationMessage(`Extracted ${list.length} methods. Opened in a new document.`);
    };

    private addComments = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selection = editor.selection;
        let range: vscode.Range;
        let text: string;

        // If no selection, work with current line
        if (selection.isEmpty) {
            const line = editor.document.lineAt(selection.active.line);
            range = line.range;
            text = line.text;
        } else {
            // Work with selected text
            range = new vscode.Range(selection.start, selection.end);
            text = editor.document.getText(range);
        }

        // Add -- at the beginning of each line
        const lines = text.split('\n');
        const commented = lines.map(line => {
            // Skip empty lines
            if (line.trim() === '') return line;
            // Add -- with appropriate spacing
            const match = line.match(/^(\s*)/);
            const indent = match ? match[1] : '';
            const rest = line.substring(indent.length);
            return `${indent}-- ${rest}`;
        });

        this.applyChangesToSelection(editor, range, commented.join('\n'), 'Added comments');
    };

    private removeComments = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selection = editor.selection;
        let range: vscode.Range;
        let text: string;

        // If no selection, work with current line
        if (selection.isEmpty) {
            const line = editor.document.lineAt(selection.active.line);
            range = line.range;
            text = line.text;
        } else {
            // Work with selected text
            range = new vscode.Range(selection.start, selection.end);
            text = editor.document.getText(range);
        }

        const lines = text.split('\n');
        const uncommented = lines.map(line => {
            // Remove -- prefix (with optional leading spaces before --)
            // Pattern: optional spaces, then --, then optional space, then capture rest
            let result = line.replace(/^(\s*)--\s?/, '$1');
            // Also remove $* comments
            result = result.replace(/^(\s*)\$\*\s?/, '$1');
            return result;
        });

        this.applyChangesToSelection(editor, range, uncommented.join('\n'), 'Removed comment prefixes');
    };

    private alignPML = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');

        // Detect what to align by: '=' or 'is'
        const hasEquals = lines.some(line => line.includes('='));
        const hasIs = lines.some(line => /\s+is\s+/i.test(line));

        let aligned: string[];

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

        this.applyChangesToSelection(editor, selected.range, aligned.join('\n'), 'Aligned PML');
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

    // Form helpers
    private reloadForm = async () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const text = editor.document.getText();
        
        // Ищем setup form или layout form
        const formRegex = /(?:setup|layout)\s+form\s+(!!?[a-zA-Z_][a-zA-Z0-9_]*)/i;
        const match = text.match(formRegex);

        if (!match) {
            vscode.window.showErrorMessage('Это не файл формы. Не найдено "setup form" или "layout form".');
            return;
        }

        const formName = match[1];
        const reloadCommand = `kill  ${formName}\nshow  ${formName}`;

        // Копируем в буфер обмена
        await vscode.env.clipboard.writeText(reloadCommand);
        vscode.window.showInformationMessage(`Команда перезагрузки формы ${formName} скопирована в буфер обмена`);
    };

    // Array helpers
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

        // Запрашиваем имя переменной
        const varName = await vscode.window.showInputBox({
            prompt: 'Введите имя переменной для массива',
            placeHolder: 'list',
            value: 'list'
        });

        if (!varName) {
            return; // Пользователь отменил ввод
        }

        // Обработка строк
        const lines = selected.text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0); // Убираем пустые строки

        if (lines.length === 0) {
            vscode.window.showErrorMessage('Нет строк для обработки');
            return;
        }

        // Определяем максимальную длину индекса для выравнивания
        const maxIndexLength = lines.length.toString().length;

        // Генерируем массив
        const result = lines.map((line, index) => {
            const idx = (index + 1).toString().padEnd(maxIndexLength);
            
            // Определяем формат значения
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

        this.applyChangesToSelection(editor, selected.range, result.join('\n'), 'Created array list');
    };
}

