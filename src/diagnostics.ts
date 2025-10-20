import * as vscode from 'vscode';

export class PMLDiagnostics {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('pml');
    }

    public updateDiagnostics(document: vscode.TextDocument): void {
        if (document.languageId !== 'pml') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split(/\r?\n/);

        // Проверки
        this.checkUnclosedBlocks(lines, diagnostics, document);
        this.checkMethodParentheses(lines, diagnostics, document);
        // checkVariableUsage отключена - глобальные переменные это норма в PML

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    /**
     * Проверка незакрытых блоков (method, object, if, do, form, frame)
     */
    private checkUnclosedBlocks(lines: string[], diagnostics: vscode.Diagnostic[], _document: vscode.TextDocument): void {
        const stack: Array<{ type: string; line: number; keyword: string }> = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Пропускаем комментарии
            if (trimmed.startsWith('--') || trimmed.startsWith('$*')) {
                continue;
            }

            // Открывающие блоки
            if (/^define\s+method\s+/i.test(trimmed)) {
                stack.push({ type: 'method', line: i, keyword: 'define method' });
            } else if (/^define\s+object\s+/i.test(trimmed)) {
                stack.push({ type: 'object', line: i, keyword: 'define object' });
            } else if (/^if\s+.*\s+then/i.test(trimmed)) {
                stack.push({ type: 'if', line: i, keyword: 'if' });
            } else if (/^do\s+/i.test(trimmed)) {
                stack.push({ type: 'do', line: i, keyword: 'do' });
            } else if (/^setup\s+form\s+/i.test(trimmed)) {
                stack.push({ type: 'form', line: i, keyword: 'setup form' });
            } else if (/^frame\s+/i.test(trimmed)) {
                stack.push({ type: 'frame', line: i, keyword: 'frame' });
            } else if (/^handle\s+/i.test(trimmed)) {
                stack.push({ type: 'handle', line: i, keyword: 'handle' });
            }

            // Закрывающие блоки
            else if (/^endmethod/i.test(trimmed)) {
                if (stack.length === 0 || stack[stack.length - 1].type !== 'method') {
                    this.addDiagnostic(diagnostics, i, 'Найден endmethod без соответствующего define method', vscode.DiagnosticSeverity.Error);
                } else {
                    stack.pop();
                }
            } else if (/^endobject/i.test(trimmed)) {
                if (stack.length === 0 || stack[stack.length - 1].type !== 'object') {
                    this.addDiagnostic(diagnostics, i, 'Найден endobject без соответствующего define object', vscode.DiagnosticSeverity.Error);
                } else {
                    stack.pop();
                }
            } else if (/^endif/i.test(trimmed)) {
                if (stack.length === 0 || stack[stack.length - 1].type !== 'if') {
                    this.addDiagnostic(diagnostics, i, 'Найден endif без соответствующего if', vscode.DiagnosticSeverity.Error);
                } else {
                    stack.pop();
                }
            } else if (/^enddo/i.test(trimmed)) {
                if (stack.length === 0 || stack[stack.length - 1].type !== 'do') {
                    this.addDiagnostic(diagnostics, i, 'Найден enddo без соответствующего do', vscode.DiagnosticSeverity.Error);
                } else {
                    stack.pop();
                }
            } else if (/^exit/i.test(trimmed)) {
                if (stack.length > 0 && (stack[stack.length - 1].type === 'form' || stack[stack.length - 1].type === 'frame')) {
                    stack.pop();
                }
            } else if (/^endhandle/i.test(trimmed)) {
                if (stack.length === 0 || stack[stack.length - 1].type !== 'handle') {
                    this.addDiagnostic(diagnostics, i, 'Найден endhandle без соответствующего handle', vscode.DiagnosticSeverity.Error);
                } else {
                    stack.pop();
                }
            }
        }

        // Проверяем незакрытые блоки
        for (const block of stack) {
            this.addDiagnostic(
                diagnostics,
                block.line,
                `Незакрытый блок: ${block.keyword}. Ожидается закрывающий оператор.`,
                vscode.DiagnosticSeverity.Error
            );
        }
    }

    /**
     * Проверка методов на наличие скобок
     */
    private checkMethodParentheses(lines: string[], diagnostics: vscode.Diagnostic[], _document: vscode.TextDocument): void {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Пропускаем комментарии
            if (trimmed.startsWith('--') || trimmed.startsWith('$*')) {
                continue;
            }

            // Проверяем определения методов
            const methodDefMatch = trimmed.match(/^define\s+method\s+\.(\w+)/i);
            if (methodDefMatch) {
                if (!trimmed.includes('(') || !trimmed.includes(')')) {
                    this.addDiagnostic(
                        diagnostics,
                        i,
                        `Метод ${methodDefMatch[1]} должен иметь скобки (), даже если нет параметров`,
                        vscode.DiagnosticSeverity.Warning
                    );
                }
            }
        }
    }

    /**
     * Проверка использования переменных
     */
    private checkVariableUsage(_lines: string[], _diagnostics: vscode.Diagnostic[], _document: vscode.TextDocument): void {
        // Эта проверка пока не используется
        // В PML глобальные переменные (!!var) - это нормальная практика
        // Оставлено для будущих проверок переменных
    }

    /**
     * Вспомогательная функция для добавления диагностики
     */
    private addDiagnostic(
        diagnostics: vscode.Diagnostic[],
        line: number,
        message: string,
        severity: vscode.DiagnosticSeverity
    ): void {
        const range = new vscode.Range(
            new vscode.Position(line, 0),
            new vscode.Position(line, Number.MAX_SAFE_INTEGER)
        );
        const diagnostic = new vscode.Diagnostic(range, message, severity);
        diagnostics.push(diagnostic);
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}



