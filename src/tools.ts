import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
        this.registerCommand('pml.generateMethodsSummary', 'Generate Methods Summary', this.generateMethodsSummary);
        this.registerCommand('pml.updateMethodsSummary', 'Update Methods Summary', this.updateMethodsSummary);
        this.registerCommand('pml.insertMethodDocBlock', 'Insert Method Documentation Block', this.insertMethodDocBlock);

        // Array helpers
        this.registerCommand('pml.makeListPath', 'Make Array (add /)', this.makeListPath);
        this.registerCommand('pml.makeListString', 'Make Array (add |....|)', this.makeListString);
        this.registerCommand('pml.makeListPathString', 'Make Array (add / and |....|)', this.makeListPathString);
        this.registerCommand('pml.reindexArray', 'ReIndex', this.reindexArray);
        this.registerCommand('pml.addToArray', 'Add to Array', this.addToArray);

        // Examples
        this.registerCommand('pml.openButtonExample', 'Button Gadgets Example', this.openButtonExample);
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

        this.applyChangesToSelection(editor, range, commented.join('\n'), 'Added comments');
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

        this.applyChangesToSelection(editor, range, uncommented.join('\n'), 'Removed comments');
    };

    private alignPML = () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');

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

    /**
     * ReIndex - перенумеровывает индексы массива, начиная с текущего максимального индекса + 1
     */
    private reindexArray = async () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');

        // Находим все строки с массивами и определяем максимальный индекс
        const arrayPattern = /^(\s*)(![\w.]+)\[\s*(\d+)\s*\](\s*=.*)$/;
        let maxIndex = 0;
        let arrayVarName = '';
        let indentSize = '';

        // Сначала проходим по всем строкам и находим максимальный индекс
        for (const line of lines) {
            const match = line.match(arrayPattern);
            if (match) {
                const index = parseInt(match[3], 10);
                if (index > maxIndex) {
                    maxIndex = index;
                }
                if (!arrayVarName) {
                    arrayVarName = match[2];
                    indentSize = match[1];
                }
            }
        }

        // Если массивов не найдено, пробуем найти в контексте выше выделения
        if (!arrayVarName) {
            const textAbove = editor.document.getText(
                new vscode.Range(
                    new vscode.Position(Math.max(0, selected.range.start.line - 50), 0),
                    selected.range.start
                )
            );
            const aboveLines = textAbove.split('\n').reverse();
            for (const line of aboveLines) {
                const match = line.match(arrayPattern);
                if (match) {
                    maxIndex = parseInt(match[3], 10);
                    arrayVarName = match[2];
                    indentSize = match[1];
                    break;
                }
            }
        }

        if (!arrayVarName) {
            vscode.window.showErrorMessage('Не найдено массивов в выделенном тексте или выше');
            return;
        }

        // Перенумеровываем строки
        let currentIndex = maxIndex + 1;
        const maxIndexLength = (maxIndex + lines.length).toString().length;

        const result = lines.map(line => {
            const match = line.match(arrayPattern);
            if (match) {
                const idx = currentIndex.toString().padEnd(maxIndexLength);
                const newLine = `${indentSize}${arrayVarName}[${idx}]${match[4]}`;
                currentIndex++;
                return newLine;
            }
            return line;
        });

        await this.applyChangesToSelection(editor, selected.range, result.join('\n'), 'Array indices reindexed');
    };

    /**
     * Add to Array - добавляет выделенные строки как новые элементы массива
     */
    private addToArray = async () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const selected = this.getSelectedTextOrShowError(editor);
        if (!selected) return;

        const lines = selected.text.split('\n');

        // Находим существующие массивы и определяем параметры
        const arrayPattern = /^(\s*)(![\w.]+)\[\s*(\d+)\s*\](\s*=\s*)(.*)$/;
        let maxIndex = 0;
        let arrayVarName = '';
        let indentSize = '';
        let hasPath = false;
        let hasString = false;

        const arrayLines: string[] = [];
        const nonArrayLines: string[] = [];

        // Разделяем строки на массивы и не-массивы
        for (const line of lines) {
            const match = line.match(arrayPattern);
            if (match) {
                arrayLines.push(line);
                const index = parseInt(match[3], 10);
                if (index > maxIndex) {
                    maxIndex = index;
                }
                if (!arrayVarName) {
                    arrayVarName = match[2];
                    indentSize = match[1];
                    // Определяем формат по значению
                    const value = match[5];
                    hasPath = value.startsWith('/') || value.startsWith("'/");
                    hasString = value.startsWith("'") || value.startsWith('|');
                }
            } else if (line.trim().length > 0) {
                nonArrayLines.push(line);
            }
        }

        if (!arrayVarName) {
            vscode.window.showErrorMessage('Не найдено массивов в выделенном тексте');
            return;
        }

        if (nonArrayLines.length === 0) {
            vscode.window.showInformationMessage('Нет строк для добавления в массив');
            return;
        }

        // Создаем новые элементы массива
        const maxIndexLength = (maxIndex + nonArrayLines.length).toString().length;
        let currentIndex = maxIndex + 1;

        const newArrayElements = nonArrayLines.map(line => {
            const trimmedLine = line.trim();
            const idx = currentIndex.toString().padEnd(maxIndexLength);

            // Определяем формат значения
            let value: string;
            if (hasPath && hasString) {
                value = `'/${trimmedLine}'`;
            } else if (hasPath) {
                value = `/${trimmedLine}`;
            } else if (hasString) {
                value = `'${trimmedLine}'`;
            } else {
                value = trimmedLine;
            }

            currentIndex++;
            return `${indentSize}${arrayVarName}[${idx}] = ${value}`;
        });

        // Объединяем существующие массивы и новые элементы
        const result = [...arrayLines, ...newArrayElements];

        await this.applyChangesToSelection(editor, selected.range, result.join('\n'),
            `Added ${nonArrayLines.length} items to array`);
    };

    // Form documentation helpers
    private generateMethodsSummary = async () => {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const document = editor.document;

        // Check if this is a form file
        if (!document.fileName.endsWith('.pmlfrm')) {
            vscode.window.showWarningMessage('This command is designed for .pmlfrm files');
        }

        const methods = this.parseFormMethods(document);

        if (methods.length === 0) {
            vscode.window.showInformationMessage('No methods found in the form');
            return;
        }

        const summary = this.formatMethodsSummary(methods);

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
        if (!document.fileName.endsWith('.pmlfrm')) {
            vscode.window.showWarningMessage('This command is designed for .pmlfrm files');
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

        const newSummary = this.formatMethodsSummary(methods);
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
            const lines = beforeText.split('\n');

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

    private formatMethodsSummary(methods: Array<{name: string, params: string, description: string}>): string {
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

        return lines.join('\n');
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
        ].join('\n');

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
            // Find the extension path
            const extensionPath = vscode.extensions.getExtension('mikhalchankasm.pml-aveva-e3d')?.extensionPath;
            if (!extensionPath) {
                vscode.window.showErrorMessage('Could not locate extension path');
                return;
            }

            // Load tutorial content from file
            const tutorialPath = path.join(extensionPath, 'examples', 'gadgets', 'ButtonGadgets_Tutorial.md');

            const content = fs.readFileSync(tutorialPath, 'utf8');

            const document = await vscode.workspace.openTextDocument({
                content,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage('Button Gadgets example opened');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load Button Gadgets tutorial: ${error}`);
        }
    };
}

