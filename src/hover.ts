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
            // Ключевые слова
            'method': {
                signature: 'define method .methodName()',
                description: 'Определяет метод объекта. Методы — это функции, которые можно вызывать на объектах.',
                example: 'define method .calculate()\n    !result = 0\n    return !result\nendmethod'
            },
            'object': {
                signature: 'define object OBJECTNAME',
                description: 'Определяет новый класс объекта с членами и методами.',
                example: 'define object MYOBJECT\n    member .name is STRING\n    member .value is REAL\nendobject'
            },
            'if': {
                signature: 'if (condition) then',
                description: 'Условный оператор. Выполняет код если условие истинно.',
                example: 'if (!value gt 10) then\n    |Value is large|.output()\nendif'
            },
            'do': {
                signature: 'do !var values/index/from',
                description: 'Цикл. Может перебирать значения, индексы или числовой диапазон.',
                example: 'do !item values !list\n    !item.process()\nenddo'
            },
            'handle': {
                signature: 'handle any',
                description: 'Обработка ошибок. Перехватывает исключения в блоке кода.',
                example: 'handle any\n    !file.open()\nelsehandle\n    !error = !!error\nendhandle'
            },

            // Встроенные функции
            'collectallfor': {
                signature: '!!collectallfor(types, filter, place)',
                description: 'Собирает элементы из базы данных по типу и фильтру.\n\n**Параметры:**\n- `types` — типы элементов (напр. |PIPE|)\n- `filter` — условие фильтрации (напр. |NAME eq \'TEST\'|)\n- `place` — место поиска (напр. !!ce)',
                example: '!types = |PIPE|\n!filt = |NAME eq \'TEST\'|\n!elements = !!collectallfor(!types, !filt, !!ce)'
            },
            'evaluate': {
                signature: 'list.Evaluate(object Block(expression))',
                description: 'Создает новый список на основе выражения, применяемого к каждому элементу исходного списка.',
                example: '!names = !elements.Evaluate(object Block(|!elements[!evalIndex].NAME|))'
            },
            'query': {
                signature: 'element.query(attribute)',
                description: 'Запрашивает значение атрибута у элемента базы данных.\n\n**Распространенные атрибуты:**\n- NAME, TYPE, OWNER, POSITION\n- BORE, HBORE, PSPEC, PTUBE',
                example: '!elementName = !element.query(|NAME|)\n!bore = !pipe.query(|BORE|)'
            },
            'output': {
                signature: 'string.output()',
                description: 'Выводит строку в консоль PML.',
                example: '|Hello World|.output()\n(!message & | Done|).output()'
            },
            'alert': {
                signature: '!alert(message)',
                description: 'Показывает всплывающее окно с сообщением.',
                example: '!alert(|Operation completed successfully|)'
            },
            'size': {
                signature: 'array.size()',
                description: 'Возвращает количество элементов в массиве или коллекции.',
                example: '!count = !list.size()\nif (!list.size() gt 0) then'
            },
            'file': {
                signature: 'object FILE(filepath)',
                description: 'Создает объект для работы с файлом.\n\n**Методы:**\n- .open(mode) — открыть (\'read\'/\'write\'/\'append\')\n- .close() — закрыть\n- .writeline(text) — записать строку\n- .readline() — прочитать строку',
                example: '!file = object FILE(|C:\\\\temp\\\\data.txt|)\n!file.open(\'write\')\n!file.writeline(|Hello|)\n!file.close()'
            },

            // Типы данных
            'string': {
                signature: 'STRING()',
                description: 'Строковый тип данных. Хранит текстовые значения.',
                example: '!name = STRING()\n!name = |John Doe|'
            },
            'real': {
                signature: 'REAL()',
                description: 'Вещественное число (с плавающей точкой).',
                example: '!value = REAL()\n!value = 3.14159'
            },
            'boolean': {
                signature: 'BOOLEAN()',
                description: 'Логический тип. Может быть TRUE или FALSE.',
                example: '!flag = BOOLEAN()\n!flag = TRUE'
            },
            'array': {
                signature: 'ARRAY()',
                description: 'Массив — коллекция элементов.\n\n**Методы:**\n- .append(item) — добавить\n- .remove(item) — удалить\n- .size() — размер\n- [index] — доступ по индексу',
                example: '!list = ARRAY()\n!list.append(|item1|)\n!first = !list[1]'
            },

            // Глобальные переменные
            '!!ce': {
                description: '**Current Element** — текущий выбранный элемент в AVEVA E3D.\n\nИспользуется как контекст для операций с базой данных.',
                example: '!currentName = !!ce.query(|NAME|)\n!elements = !!collectallfor(|PIPE|, ||, !!ce)'
            },
            '!!fmsys': {
                description: '**Form System** — системный объект для работы с формами и интерфейсом.\n\n**Методы:**\n- .setProgress(percent) — установить прогресс-бар',
                example: '!!FMSYS.setProgress(50)\n!!FMSYS.setProgress(0)'
            },

            // Операторы
            'eq': {
                description: 'Оператор равенства (equal). Проверяет равны ли два значения.',
                example: 'if (!value eq 10) then\nif (!name eq |TEST|) then'
            },
            'ne': {
                description: 'Оператор неравенства (not equal). Проверяет не равны ли два значения.',
                example: 'if (!value ne 0) then'
            },
            'gt': {
                description: 'Оператор больше (greater than).',
                example: 'if (!value gt 100) then'
            },
            'lt': {
                description: 'Оператор меньше (less than).',
                example: 'if (!value lt 10) then'
            },
            'ge': {
                description: 'Оператор больше или равно (greater or equal).',
                example: 'if (!value ge 100) then'
            },
            'le': {
                description: 'Оператор меньше или равно (less or equal).',
                example: 'if (!value le 10) then'
            },
            'and': {
                description: 'Логический оператор И. Оба условия должны быть истинны.',
                example: 'if (!a gt 0 and !b lt 10) then'
            },
            'or': {
                description: 'Логический оператор ИЛИ. Хотя бы одно условие должно быть истинно.',
                example: 'if (!a eq 1 or !b eq 2) then'
            },
            'not': {
                description: 'Логический оператор НЕ. Инвертирует логическое значение.',
                example: 'if (not !flag) then'
            },

            // Константы
            'true': {
                description: 'Логическая константа — истина.',
                example: '!flag = TRUE\nif (!condition eq TRUE) then'
            },
            'false': {
                description: 'Логическая константа — ложь.',
                example: '!flag = FALSE'
            },
            'unset': {
                description: 'Специальное значение — неустановленная переменная.',
                example: 'if (!variable eq UNSET) then'
            },
            'pi': {
                description: 'Математическая константа π (пи) ≈ 3.14159265359',
                example: '!circumference = 2 * PI * !radius'
            },
        };
    }
}


