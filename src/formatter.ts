import * as vscode from 'vscode';

export class PMLFormatter implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.TextEdit[] {
        const config = vscode.workspace.getConfiguration('pml.formatter');
        const removeMultipleEmptyLines = config.get<boolean>('removeMultipleEmptyLines', true);
        const formatMethodBlocks = config.get<boolean>('formatMethodBlocks', true);
        const formatFormBlocks = config.get<boolean>('formatFormBlocks', true);
        const alignAssignments = config.get<boolean>('alignAssignments', true);
        const fixIndentation = config.get<boolean>('fixIndentation', true);
        const indentSize = config.get<number>('indentSize', options.tabSize || 4);

        const text = document.getText();
        let formattedText = text;

        // 0. Исправление базовых отступов
        if (fixIndentation) {
            formattedText = this.fixIndentation(formattedText, indentSize);
        }

        // 1. Удаление множественных пустых строк
        if (removeMultipleEmptyLines) {
            formattedText = this.removeMultipleEmptyLines(formattedText);
        }

        // 2. Форматирование блоков method
        if (formatMethodBlocks) {
            formattedText = this.formatMethodBlocks(formattedText);
        }

        // 3. Форматирование блоков form/frame
        if (formatFormBlocks) {
            formattedText = this.formatFormBlocks(formattedText);
        }

        // 4. Выравнивание присваиваний (= в одну линию)
        if (alignAssignments) {
            formattedText = this.alignAssignments(formattedText);
        }

        // Возвращаем замену всего документа
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
        );

        return [vscode.TextEdit.replace(fullRange, formattedText)];
    }

    /**
     * Исправляет базовые отступы в коде
     */
    private fixIndentation(text: string, indentSize: number): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        let currentIndent = 0;
        const ifStack: number[] = []; // Стек уровней для if-блоков
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Пустые строки оставляем как есть
            if (trimmed === '') {
                result.push('');
                continue;
            }
            
            // Комментарии сохраняем с текущим отступом
            if (trimmed.startsWith('--') || trimmed.startsWith('$*')) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // Специальные конструкции PML (skip if, break, continue, return)
            if (/^(skip\s+if\s*\(|break\b|continue\b|return\b)/i.test(trimmed)) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // exit закрывает frame/form блок
            if (/^exit\b/i.test(trimmed)) {
                currentIndent = Math.max(0, currentIndent - 1);
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // frame начинает новый блок
            if (/^frame\b/i.test(trimmed)) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                currentIndent++;
                continue;
            }
            
            // endif - закрывает if блок
            if (/^endif\b/i.test(trimmed)) {
                currentIndent = Math.max(0, currentIndent - 1);
                if (ifStack.length > 0) {
                    ifStack.pop();
                }
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // endmethod, endobject, enddo, endhandle - закрывающие блоки
            if (/^(endmethod|endobject|enddo|endhandle)\b/i.test(trimmed)) {
                currentIndent = Math.max(0, currentIndent - 1);
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // elseif/else/elsehandle - на уровне if
            if (/^(elseif|else|elsehandle)\b/i.test(trimmed)) {
                // Получаем уровень родительского if из стека
                const ifLevel = ifStack.length > 0 ? ifStack[ifStack.length - 1] : currentIndent - 1;
                currentIndent = ifLevel;
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                // После elseif/else увеличиваем отступ для содержимого
                currentIndent++;
                continue;
            }
            
            // if/then - начинает if блок
            if (/^(if|then)\b/i.test(trimmed)) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                ifStack.push(currentIndent); // Запоминаем уровень if
                currentIndent++;
                continue;
            }
            
            // define method/object, setup/layout form, do, handle - открывающие блоки
            if (/^(define\s+(method|object)|setup\s+form|layout\s+form|do\b|handle\b)/i.test(trimmed)) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                currentIndent++;
                continue;
            }
            
            // Обычная строка
            result.push(' '.repeat(currentIndent * indentSize) + trimmed);
        }
        
        return result.join('\n');
    }

    /**
     * Удаляет множественные пустые строки (оставляет максимум одну)
     */
    private removeMultipleEmptyLines(text: string): string {
        return text.replace(/(\r?\n){3,}/g, '\n\n');
    }

    /**
     * Форматирует блоки define method ... endmethod
     * Логика из Python кода:
     * - Удаляет лишние строки перед endmethod
     * - Добавляет пустую строку после define method если её нет
     */
    private formatMethodBlocks(text: string): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        let inMethod = false;
        let methodIndent = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Начало метода
            if (/^define\s+method/i.test(trimmed)) {
                inMethod = true;
                methodIndent = line.length - line.trimStart().length;
                result.push(line);

                // Проверяем следующую строку - если не пустая, добавляем пустую
                if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
                    result.push('');
                }
                continue;
            }

            // Конец метода
            if (/^endmethod/i.test(trimmed) && inMethod) {
                // Удаляем пустые строки перед endmethod
                while (result.length > 0 && result[result.length - 1].trim() === '') {
                    result.pop();
                }
                result.push('');
                result.push(line);
                inMethod = false;
                continue;
            }

            result.push(line);
        }

        return result.join('\n');
    }

    /**
     * Форматирует блоки setup form ... exit и frame ... exit
     * Логика из Python кода:
     * - Добавляет пустую строку перед exit если её нет
     */
    private formatFormBlocks(text: string): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        let inFormBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Начало form/frame блока
            if (/^(setup\s+form|frame)/i.test(trimmed)) {
                inFormBlock = true;
                result.push(line);
                continue;
            }

            // Конец form/frame блока
            if (/^exit/i.test(trimmed) && inFormBlock) {
                // Проверяем предыдущую строку - если не пустая, добавляем пустую
                if (result.length > 0 && result[result.length - 1].trim() !== '') {
                    result.push('');
                }
                result.push(line);
                inFormBlock = false;
                continue;
            }

            result.push(line);
        }

        return result.join('\n');
    }

    /**
     * Выравнивание присваиваний (= в одну линию)
     * Находит группы строк подряд с = и выравнивает их
     */
    private alignAssignments(text: string): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        
        let assignmentGroup: Array<{ index: number; line: string; indent: string; before: string; after: string }> = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Пропускаем комментарии и пустые строки
            if (trimmed === '' || trimmed.startsWith('--') || trimmed.startsWith('$*')) {
                // Если была группа присваиваний - обработать её
                if (assignmentGroup.length >= 2) {
                    result.push(...this.processAssignmentGroup(assignmentGroup));
                } else if (assignmentGroup.length > 0) {
                    // Если группа меньше 2 - добавить строки как есть
                    result.push(...assignmentGroup.map(g => g.line));
                }
                assignmentGroup = [];
                result.push(line);
                continue;
            }
            
            // Проверяем есть ли присваивание (только один знак =)
            // Исключаем операторы сравнения (==, !=, >=, <=)
            const assignmentMatch = line.match(/^(\s*)([^=]*?)(\s*)(=)(\s*)(.*)$/);
            
            if (assignmentMatch) {
                const [, indent, before, , , , after] = assignmentMatch;
                
                // Проверяем что это не оператор сравнения
                const beforeTrimmed = before.trim();
                const afterTrimmed = after.trim();
                
                // Если после = идет еще =, то это == (пропускаем)
                if (afterTrimmed.startsWith('=')) {
                    if (assignmentGroup.length >= 2) {
                        result.push(...this.processAssignmentGroup(assignmentGroup));
                    } else if (assignmentGroup.length > 0) {
                        result.push(...assignmentGroup.map(g => g.line));
                    }
                    assignmentGroup = [];
                    result.push(line);
                    continue;
                }
                
                // Если перед = был >, <, ! то это оператор сравнения (пропускаем)
                if (beforeTrimmed.endsWith('>') || beforeTrimmed.endsWith('<') || beforeTrimmed.endsWith('!')) {
                    if (assignmentGroup.length >= 2) {
                        result.push(...this.processAssignmentGroup(assignmentGroup));
                    } else if (assignmentGroup.length > 0) {
                        result.push(...assignmentGroup.map(g => g.line));
                    }
                    assignmentGroup = [];
                    result.push(line);
                    continue;
                }
                
                // Это присваивание - добавляем в группу
                assignmentGroup.push({
                    index: i,
                    line: line,
                    indent: indent,
                    before: before.trimEnd(),
                    after: after
                });
            } else {
                // Не присваивание - обработать накопленную группу
                if (assignmentGroup.length >= 2) {
                    result.push(...this.processAssignmentGroup(assignmentGroup));
                } else if (assignmentGroup.length > 0) {
                    result.push(...assignmentGroup.map(g => g.line));
                }
                assignmentGroup = [];
                result.push(line);
            }
        }
        
        // Обработать последнюю группу если есть
        if (assignmentGroup.length >= 2) {
            result.push(...this.processAssignmentGroup(assignmentGroup));
        } else if (assignmentGroup.length > 0) {
            // Если группа меньше 2 - добавить строки как есть
            result.push(...assignmentGroup.map(g => g.line));
        }
        
        return result.join('\n');
    }
    
    /**
     * Обработка группы присваиваний - выравнивание по =
     */
    private processAssignmentGroup(
        group: Array<{ index: number; line: string; indent: string; before: string; after: string }>
    ): string[] {
        // Найти максимальную длину части до =
        const maxBeforeLength = Math.max(...group.map(g => g.before.length));
        
        // Выровнять все строки
        return group.map(g => {
            const spacesNeeded = maxBeforeLength - g.before.length;
            const padding = ' '.repeat(spacesNeeded);
            return `${g.indent}${g.before}${padding} = ${g.after}`;
        });
    }
}


