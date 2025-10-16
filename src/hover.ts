import * as vscode from 'vscode';
import { PMLDocumentationParser } from './documentation';

export class PMLHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.Hover | undefined {
        // Проверяем не метод ли это
        const line = document.lineAt(position.line).text;
        const methodCallMatch = line.match(/\.([a-zA-Z0-9_]+)\s*\(/);
        
        if (methodCallMatch) {
            const methodName = methodCallMatch[1];
            
            // Ищем определение метода в документе
            const methodDoc = this.findMethodInDocument(document, methodName);
            if (methodDoc) {
                return new vscode.Hover(methodDoc);
            }
        }
        
        // Стандартная документация для ключевых слов
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return undefined;
        }

        const word = document.getText(range);
        const hoverInfo = this.getHoverInfo(word);

        if (hoverInfo) {
            return new vscode.Hover(hoverInfo);
        }

        return undefined;
    }
    
    /**
     * Ищет метод в документе и возвращает его документацию
     */
    private findMethodInDocument(document: vscode.TextDocument, methodName: string): vscode.MarkdownString | undefined {
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const methodDefMatch = line.match(new RegExp(`define\\s+method\\s+\\.${methodName}\\s*\\(`, 'i'));
            
            if (methodDefMatch) {
                // Нашли определение метода - парсим документацию
                const methodDoc = PMLDocumentationParser.getMethodDocumentation(document, i);
                
                if (methodDoc) {
                    return PMLDocumentationParser.formatAsMarkdown(`.${methodName}`, methodDoc);
                } else {
                    // Если нет документации, покажем хотя бы сигнатуру
                    const md = new vscode.MarkdownString();
                    md.appendCodeblock(`define method .${methodName}()`, 'pml');
                    md.appendMarkdown('\n*Нет документации. Добавьте комментарии перед методом.*\n');
                    return md;
                }
            }
        }
        
        return undefined;
    }

    private getHoverInfo(word: string): vscode.MarkdownString | undefined {
        const docs = this.getDocumentation();
        const info = docs[word.toLowerCase()];

        if (info) {
            const md = new vscode.MarkdownString();
            md.appendCodeblock(info.signature || word, 'pml');
            md.appendMarkdown(info.description);
            if (info.example) {
                md.appendMarkdown('\n\n**Пример:**\n');
                md.appendCodeblock(info.example, 'pml');
            }
            md.isTrusted = true;
            return md;
        }

        return undefined;
    }

        private getDocumentation(): { [key: string]: { signature?: string; description: string; example?: string } } {
        return {
            // Keywords
            "method": {
                signature: 'define method .methodName()',
                description: 'Declare an object method. Methods are callable blocks defined on objects.',
                example: 'define method .calculate()\n    !result = 0\n    return !result\nendmethod'
            },
            "object": {
                signature: 'define object OBJECTNAME',
                description: 'Declare a new object and its members/methods.',
                example: 'define object MYOBJECT\n    member .name is STRING\n    member .value is REAL\nendobject'
            },
            "if": {
                signature: 'if (condition) then',
                description: 'Conditional statement. Executes the block when condition is true.',
                example: 'if (!value gt 10) then\n    |Value is large|.output()\nendif'
            },
            "do": {
                signature: 'do !var values / index / from ... to ...',
                description: 'Loop statement. Iterate over lists or numeric ranges.',
                example: 'do !item values !list\n    !item.process()\nenddo'
            },

            // Types
            "string": { signature: 'STRING()', description: 'Text value type.', example: '!name = STRING()\n!name = |John Doe|' },
            "real": { signature: 'REAL()', description: 'Numeric (floating point) value.', example: '!value = REAL()\n!value = 3.14159' },
            "boolean": { signature: 'BOOLEAN()', description: 'Logical TRUE/FALSE value.', example: '!flag = BOOLEAN()\n!flag = TRUE' },
            "array": { signature: 'ARRAY()', description: 'Ordered collection. Common methods: .append(item), .remove(item), .size()', example: '!list = ARRAY()\n!list.append(|item1|)\n!first = !list[1]' },

            // Globals
            "!!ce": { description: '**Current Element** — current DB element in AVEVA E3D.', example: '!currentName = !!ce.query(|NAME|)\n!elements = !!collectallfor(|PIPE|, ||, !!ce)' },
            "!!fmsys": { description: '**Form System** — system object for forms and progress.', example: '!!FMSYS.setProgress(50)\n!!FMSYS.setProgress(0)' },

            // Operators
            "eq": { description: 'Equality (equal).', example: 'if (!value eq 10) then' },
            "ne": { description: 'Inequality (not equal).', example: 'if (!value ne 0) then' },
            "gt": { description: 'Greater than.', example: 'if (!value gt 100) then' },
            "lt": { description: 'Less than.', example: 'if (!value lt 10) then' },
            "ge": { description: 'Greater or equal.', example: 'if (!value ge 100) then' },
            "le": { description: 'Less or equal.', example: 'if (!value le 10) then' },
            "and": { description: 'Logical AND.', example: 'if (!a gt 0 and !b lt 10) then' },
            "or": { description: 'Logical OR.', example: 'if (!a eq 1 or !b eq 2) then' },
            "not": { description: 'Logical NOT.', example: 'if (not !flag) then' },

            // Constants
            "true": { description: 'Logical TRUE.', example: '!flag = TRUE' },
            "false": { description: 'Logical FALSE.', example: '!flag = FALSE' },
            "unset": { description: 'Special unset value.', example: 'if (!variable eq UNSET) then' },
            "pi": { description: 'Mathematical constant π = 3.14159265359', example: '!circumference = 2 * PI * !radius' }
        };
    }
}



