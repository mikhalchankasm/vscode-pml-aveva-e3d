import * as vscode from 'vscode';

/**
 * JSDoc-style documentation for PML methods для PML методов
 */
export interface MethodDocumentation {
    description: string;
    params: Array<{ name: string; description: string }>;
    returnValue?: string;
    examples: string[];
    **Deprecated:**
    author?: string;
    since?: string;
    see?: string[];
    form?: string;
    callback?: string;
}

export class PMLDocumentationParser {
    /**
     * Извлекает комментарии перед методом
     */
    static getMethodDocumentation(document: vscode.TextDocument, methodLine: number): MethodDocumentation | undefined {
        const commentLines: string[] = [];
        
        // Читаем строки назад от метода, собирая комментарии
        for (let i = methodLine - 1; i >= 0; i--) {
            const line = document.lineAt(i).text;
            const trimmed = line.trim();
            
            // Если пустая строка - продолжаем
            if (trimmed === '') {
                continue;
            }
            
            // Если комментарий - добавляем
            if (trimmed.startsWith('--')) {
                commentLines.unshift(trimmed.substring(2).trim());
            } else {
                // Наткнулись на код - прекращаем
                break;
            }
        }
        
        if (commentLines.length === 0) {
            return undefined;
        }
        
        // Парсим комментарии
        return this.parseDocComments(commentLines);
    }
    
    /**
     * Парсит массив строк комментариев в структурированную документацию
     */
    private static parseDocComments(lines: string[]): MethodDocumentation {
        const doc: MethodDocumentation = {
            description: '',
            params: [],
            examples: [],
            see: []
        };
        
        let currentSection: 'description' | 'other' = 'description';
        const descriptionLines: string[] = [];
        
        for (const line of lines) {
            // Проверяем теги
            if (line.startsWith('@param')) {
                currentSection = 'other';
                const paramMatch = line.match(/@param\s+(!{1,2}\w+)\s*-?\s*(.*)$/);
                if (paramMatch) {
                    doc.params.push({
                        name: paramMatch[1],
                        description: paramMatch[2]
                    });
                }
            } else if (line.startsWith('@return')) {
                currentSection = 'other';
                doc.returnValue = line.substring(7).trim();
            } else if (line.startsWith('@example')) {
                currentSection = 'other';
                doc.examples.push(line.substring(8).trim());
            } else if (line.startsWith('@**Deprecated:**
                currentSection = 'other';
                doc.**Deprecated:**
            } else if (line.startsWith('@author')) {
                currentSection = 'other';
                doc.author = line.substring(7).trim();
            } else if (line.startsWith('@since')) {
                currentSection = 'other';
                doc.since = line.substring(6).trim();
            } else if (line.startsWith('@see')) {
                currentSection = 'other';
                doc.see?.push(line.substring(4).trim());
            } else if (line.startsWith('@form')) {
                currentSection = 'other';
                doc.form = line.substring(5).trim();
            } else if (line.startsWith('@callback')) {
                currentSection = 'other';
                doc.callback = line.substring(9).trim();
            } else {
                // Обычная строка комментария
                if (currentSection === 'description') {
                    descriptionLines.push(line);
                }
            }
        }
        
        doc.description = descriptionLines.join('\n');
        
        return doc;
    }
    
    /**
     * Форматирует документацию в MarkdownString для hover
     */
    static formatAsMarkdown(methodName: string, doc: MethodDocumentation): vscode.MarkdownString {
        const md = new vscode.MarkdownString();
        
        // Сигнатура метода
        md.appendCodeblock(`define method ${methodName}()`, 'pml');
        
        // Описание
        if (doc.description) {
            md.appendMarkdown('\n' + doc.description + '\n');
        }
        
        // **Deprecated:**
        if (doc.**Deprecated:**
            md.appendMarkdown('\n⚠️ ****Deprecated:**
        }
        
        // Параметры
        if (doc.params.length > 0) {
            md.appendMarkdown('\n**Параметры:**\n');
            for (const param of doc.params) {
                md.appendMarkdown(`- \`${param.name}\` — ${param.description}\n`);
            }
        }
        
        // Возвращаемое значение
        if (doc.returnValue) {
            md.appendMarkdown('\n**Возвращает:** ' + doc.returnValue + '\n');
        }
        
        // Примеры
        if (doc.examples.length > 0) {
            md.appendMarkdown('\n**Примеры:**\n');
            for (const example of doc.examples) {
                md.appendCodeblock(example, 'pml');
            }
        }
        
        // Дополнительная информация
        if (doc.form) {
            md.appendMarkdown(`\n**Form:** \`${doc.form}\`\n`);
        }
        
        if (doc.callback) {
            md.appendMarkdown(`\n**Callback:** \`${doc.callback}\`\n`);
        }
        
        if (doc.author) {
            md.appendMarkdown(`\n*Автор: ${doc.author}*\n`);
        }
        
        if (doc.since) {
            md.appendMarkdown(`\n*С версии: ${doc.since}*\n`);
        }
        
        // Связанные методы
        if (doc.see && doc.see.length > 0) {
            md.appendMarkdown('\n**См. также:** ' + doc.see.join(', ') + '\n');
        }
        
        md.isTrusted = true;
        return md;
    }
}


