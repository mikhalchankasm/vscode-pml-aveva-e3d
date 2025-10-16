import * as vscode from 'vscode';
import { ALL_TYPE_METHODS } from './pmlTypes';

export class PMLCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        
        // Проверяем контекст - после точки показываем методы типов
        const line = document.lineAt(position.line).text;
        const beforeCursor = line.substring(0, position.character);
        
        // Если после точки - показываем методы объектов
        if (beforeCursor.match(/[!a-zA-Z0-9_]+\.$/)) {
            const varMatch = beforeCursor.match(/([!]{1,2}[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)\.$/);
            if (varMatch) {
                const varName = varMatch[1];
                
                // Пытаемся определить тип переменной
                const inferredType = this.inferVariableType(document, varName, position.line);
                
                // Отладочная информация
                // console.log(`PML Completion: varName=${varName}, inferredType=${inferredType}`);
                
                if (inferredType) {
                    // Показываем только методы для этого типа
                    const typeMethods = this.getTypeMethods(inferredType);
                    // console.log(`PML Completion: Found ${typeMethods.length} methods for ${inferredType}`);
                    completions.push(...typeMethods);
                } else {
                    // Не смогли определить тип - показываем все базовые методы
                    const allMethods = this.getAllTypeMethods();
                    // console.log(`PML Completion: Showing all ${allMethods.length} methods (type unknown)`);
                    completions.push(...allMethods);
                }
                
                // Также добавляем слова из документа (могут быть методы/атрибуты)
                const wordCompletions = this.getWordsFromDocument(document, position);
                completions.push(...wordCompletions);
                
                return completions;
            }
        }

        // Ключевые слова
        completions.push(...this.getKeywordCompletions());

        // Встроенные функции
        completions.push(...this.getBuiltInFunctionCompletions());

        // Типы данных
        completions.push(...this.getTypeCompletions());

        // Глобальные переменные
        completions.push(...this.getGlobalVariableCompletions());

        // Атрибуты AVEVA E3D
        completions.push(...this.getAttributeCompletions());

        // Слова из текущего документа (как в Notepad++)
        const wordCompletions = this.getWordsFromDocument(document, position);
        
        // Отладка
        const trace = vscode.workspace.getConfiguration('pml').get<string>('trace', 'off');
        if (trace !== 'off' && wordCompletions.length > 0) {
            console.log(`PML Word Completion: Found ${wordCompletions.length} words from document`);
        }
        
        completions.push(...wordCompletions);

        return completions;
    }

    private getKeywordCompletions(): vscode.CompletionItem[] {
        const keywords = [
            { label: 'define method', detail: 'Определить метод', snippet: 'define method .${1:methodName}()\n\t${2}\nendmethod' },
            { label: 'define object', detail: 'Определить объект', snippet: 'define object ${1:OBJECTNAME}\n\t${2}\nendobject' },
            { label: 'if then else', detail: 'Условный оператор', snippet: 'if (${1:condition}) then\n\t${2}\nelse\n\t${3}\nendif' },
            { label: 'do values', detail: 'Цикл по значениям', snippet: 'do !${1:item} values !${2:list}\n\t${3}\nenddo' },
            { label: 'do index', detail: 'Цикл по индексу', snippet: 'do !${1:i} index !${2:list}\n\t${3}\nenddo' },
            { label: 'do from to', detail: 'Цикл от до', snippet: 'do !${1:i} from ${2:1} to ${3:10}\n\t${4}\nenddo' },
            { label: 'handle', detail: 'Обработка ошибок', snippet: 'handle any\n\t${1}\nelsehandle\n\t!error = !!error\n\t|Error: | & !error.message().output()\nendhandle' },
            { label: 'setup form', detail: 'Создать форму', snippet: 'setup form !!${1:FormName} dialog docking ${2:right}\n\t${3}\nexit' },
            { label: 'frame', detail: 'Создать фрейм', snippet: 'frame .${1:frameName} width ${2:50}\n\t${3}\nexit' },
        ];

        return keywords.map(kw => {
            const item = new vscode.CompletionItem(kw.label, vscode.CompletionItemKind.Keyword);
            item.detail = kw.detail;
            if (kw.snippet) {
                item.insertText = new vscode.SnippetString(kw.snippet);
            }
            return item;
        });
    }

    private getBuiltInFunctionCompletions(): vscode.CompletionItem[] {
        const functions = [
            { label: 'object', detail: 'Создать объект', snippet: 'object ${1:TYPE}(${2})' },
            { label: 'Block', detail: 'Создать блок кода', snippet: 'Block(|${1:code}|)' },
            { label: 'Evaluate', detail: 'Вычислить выражение для списка', snippet: '.Evaluate(object Block(|${1:expression}|))' },
            { label: 'collectallfor', detail: 'Собрать элементы из БД', snippet: '!!collectallfor(|${1:type}|, |${2:filter}|, ${3:!!ce})' },
            { label: 'output', detail: 'Вывести сообщение', snippet: '.output()' },
            { label: 'query', detail: 'Запросить атрибут', snippet: '.query(|${1:attribute}|)' },
            { label: 'alert', detail: 'Показать предупреждение', snippet: '!alert(|${1:message}|)' },
            { label: 'size', detail: 'Размер коллекции', snippet: '.size()' },
            { label: 'gettype', detail: 'Получить тип', snippet: '.gettype()' },
            { label: 'FILE', detail: 'Работа с файлом', snippet: 'FILE(|${1:filepath}|)' },
            { label: 'ERROR', detail: 'Объект ошибки', snippet: 'ERROR()' },
            { label: 'append', detail: 'Добавить в массив', snippet: '.append(${1:item})' },
            { label: 'remove', detail: 'Удалить из массива', snippet: '.remove(${1:item})' },
            { label: 'show', detail: 'Показать форму', snippet: '.show()' },
            { label: 'close', detail: 'Закрыть форму', snippet: '.close()' },
            { label: 'setProgress', detail: 'Установить прогресс', snippet: '!!FMSYS.setProgress(${1:percent})' },
        ];

        return functions.map(fn => {
            const item = new vscode.CompletionItem(fn.label, vscode.CompletionItemKind.Function);
            item.detail = fn.detail;
            if (fn.snippet) {
                item.insertText = new vscode.SnippetString(fn.snippet);
            }
            return item;
        });
    }

    private getTypeCompletions(): vscode.CompletionItem[] {
        const types = [
            { label: 'STRING', detail: 'Строковый тип', snippet: 'STRING()' },
            { label: 'REAL', detail: 'Вещественное число', snippet: 'REAL()' },
            { label: 'INTEGER', detail: 'Целое число', snippet: 'INTEGER()' },
            { label: 'BOOLEAN', detail: 'Логический тип', snippet: 'BOOLEAN()' },
            { label: 'ARRAY', detail: 'Массив', snippet: 'ARRAY()' },
            { label: 'DBREF', detail: 'Ссылка на БД', snippet: 'DBREF()' },
            { label: 'ANY', detail: 'Любой тип', snippet: 'ANY()' },
        ];

        return types.map(type => {
            const item = new vscode.CompletionItem(type.label, vscode.CompletionItemKind.Class);
            item.detail = type.detail;
            if (type.snippet) {
                item.insertText = new vscode.SnippetString(type.snippet);
            }
            return item;
        });
    }

    private getGlobalVariableCompletions(): vscode.CompletionItem[] {
        const globals = [
            { label: '!!ce', detail: 'Текущий элемент (Current Element)', kind: vscode.CompletionItemKind.Variable },
            { label: '!!FMSYS', detail: 'Системные функции', kind: vscode.CompletionItemKind.Variable },
            { label: '!!error', detail: 'Последняя ошибка', kind: vscode.CompletionItemKind.Variable },
            { label: '!!currentelement', detail: 'Текущий элемент', kind: vscode.CompletionItemKind.Variable },
            { label: '!!owner', detail: 'Владелец элемента', kind: vscode.CompletionItemKind.Variable },
            { label: '!!world', detail: 'Мировой объект', kind: vscode.CompletionItemKind.Variable },
        ];

        return globals.map(g => {
            const item = new vscode.CompletionItem(g.label, g.kind);
            item.detail = g.detail;
            return item;
        });
    }

    private getAttributeCompletions(): vscode.CompletionItem[] {
        const attributes = [
            'NAME', 'TYPE', 'OWNER', 'POSITION', 'ORIENTATION', 'DIRECTION',
            'XLEN', 'YLEN', 'ZLEN', 'BORE', 'HBORE', 'HEIGHT', 'DIAMETER',
            'PSPEC', 'PTUBE', 'CATE', 'PURPOSE', 'FLUIDCODE', 'INSULATION',
            'TEMPERATURE', 'PRESSURE', 'MATERIAL', 'RATING', 'SCHEDULE',
            'PTREF', 'LEVEL', 'FUNCTION', 'DETAIL', 'SPREF', 'STREF',
            'P1', 'P2', 'P3', 'ARRIVE', 'LEAVE', 'GTYPE', 'CATREF',
        ];

        return attributes.map(attr => {
            const item = new vscode.CompletionItem(attr, vscode.CompletionItemKind.Property);
            item.detail = `AVEVA E3D Attribute`;
            item.insertText = attr;
            return item;
        });
    }

    /**
     * Автодополнение слов из текущего документа (как в Notepad++)
     * Извлекает уникальные слова длиной >= 3 символа
     * Включая слова внутри строк ('DRAWLIST', |NAME| и т.д.)
     */
    private getWordsFromDocument(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
        const text = document.getText();
        const currentLine = document.lineAt(position.line).text;
        const currentWordMatch = currentLine.substring(0, position.character).match(/[a-zA-Z0-9_!]+$/);
        const currentWord = currentWordMatch ? currentWordMatch[0] : '';

        // Убираем комментарии перед обработкой
        const lines = text.split(/\r?\n/);
        const codeWithoutComments = lines
            .map(line => {
                // Удаляем комментарии -- и $*
                return line.replace(/--.*$/, '').replace(/\$\*.*$/, '');
            })
            .join('\n');

        // Regex для поиска слов: буквы, цифры, подчеркивания, восклицательные знаки
        // Минимум 2 символа для более ранней подсказки
        const wordRegex = /[a-zA-Z0-9_!]{2,}/g;
        const matches = codeWithoutComments.matchAll(wordRegex);
        
        const uniqueWords = new Set<string>();
        
        for (const match of matches) {
            const word = match[0];
            
            // Пропускаем текущее слово (которое печатаем)
            if (word === currentWord) {
                continue;
            }
            
            // Пропускаем ключевые слова PML (они уже есть в других completions)
            const keywords = [
                'if', 'then', 'else', 'elseif', 'endif', 'do', 'enddo', 'while',
                'define', 'method', 'endmethod', 'object', 'endobject',
                'string', 'real', 'boolean', 'array', 'integer',
                'true', 'false', 'unset', 'and', 'or', 'not',
                'eq', 'ne', 'gt', 'lt', 'ge', 'le'
            ];
            
            if (keywords.includes(word.toLowerCase())) {
                continue;
            }
            
            uniqueWords.add(word);
        }
        
        // Конвертируем в CompletionItems
        const wordCompletions: vscode.CompletionItem[] = [];
        
        for (const word of uniqueWords) {
            const item = new vscode.CompletionItem(word, vscode.CompletionItemKind.Text);
            item.detail = 'Word from document';
            item.sortText = `z${word}`; // Показывать после ключевых слов, но выше встроенных VS Code
            
            // Определяем тип по префиксу
            if (word.startsWith('!!')) {
                item.kind = vscode.CompletionItemKind.Variable;
                item.detail = 'From document';
            } else if (word.startsWith('!')) {
                item.kind = vscode.CompletionItemKind.Variable;
                item.detail = 'From document';
            } else if (word.startsWith('.')) {
                item.kind = vscode.CompletionItemKind.Method;
                item.detail = 'From document';
            } else if (word === word.toUpperCase() && word.length > 2) {
                // Вероятно константа или атрибут
                item.kind = vscode.CompletionItemKind.Constant;
                item.detail = 'From document';
            }
            
            wordCompletions.push(item);
        }
        
        return wordCompletions;
    }

    /**
     * Пытается определить тип переменной
     */
    private inferVariableType(document: vscode.TextDocument, varName: string, currentLine: number): string | null {
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        
        // Поиск type hints в комментариях
        // Формат 1: -- @type STRING
        // Формат 2: !var = value  -- STRING
        for (let i = currentLine - 1; i >= Math.max(0, currentLine - 50); i--) {
            const line = lines[i];
            
            // Проверяем упоминается ли наша переменная
            if (line.includes(varName)) {
                // Формат 1: -- @type STRING (перед объявлением)
                if (i > 0) {
                    const prevLine = lines[i - 1];
                    const typeHintMatch = prevLine.match(/--\s*@type\s+(STRING|REAL|BOOLEAN|ARRAY|DBREF)/i);
                    if (typeHintMatch) {
                        return typeHintMatch[1].toUpperCase();
                    }
                }
                
                // Формат 2: !var = value -- STRING (inline)
                const inlineTypeMatch = line.match(/--\s*(STRING|REAL|BOOLEAN|ARRAY|DBREF)/i);
                if (inlineTypeMatch) {
                    return inlineTypeMatch[1].toUpperCase();
                }
                
                // Простой вывод типа по присваиванию
                if (line.includes('STRING()')) return 'STRING';
                if (line.includes('REAL()')) return 'REAL';
                if (line.includes('BOOLEAN()')) return 'BOOLEAN';
                if (line.includes('ARRAY()')) return 'ARRAY';
                if (line.includes('= |')) return 'STRING';  // |string|
                if (line.includes("= '")) return 'STRING';  // 'string'
                if (line.includes('= "')) return 'STRING';  // "string"
                if (line.match(/=\s*\d+\.\d+/)) return 'REAL';  // 3.14
                if (line.match(/=\s*\d+$/)) return 'REAL';  // 42
                if (line.match(/=\s*(TRUE|FALSE)/i)) return 'BOOLEAN';
                if (line.includes('.string()') || line.includes('.String()')) return 'STRING';
                
                // Умное определение по контексту
                if (line.includes('.query(')) return 'STRING';  // .query() всегда возвращает STRING
                if (line.includes('.size()')) return 'REAL';    // .size() всегда возвращает REAL
                if (line.includes('.first()') || line.includes('.last()')) return 'ANY'; // .first()/.last() возвращают ANY
                
                // Если нашли переменную, но не смогли определить тип - выходим
                break;
            }
        }
        
        // Дополнительный поиск: ищем type hint ПОСЛЕ объявления переменной
        for (let i = currentLine - 1; i >= Math.max(0, currentLine - 20); i--) {
            const line = lines[i];
            if (line.includes(varName)) {
                // Ищем в следующих строках type hint
                for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
                    const nextLine = lines[j];
                    const typeHintMatch = nextLine.match(/--\s*@type\s+(STRING|REAL|BOOLEAN|ARRAY|DBREF)/i);
                    if (typeHintMatch) {
                        return typeHintMatch[1].toUpperCase();
                    }
                }
                break;
            }
        }
        
        // Определение типа для переменных в циклах
        for (let i = currentLine - 1; i >= Math.max(0, currentLine - 10); i--) {
            const line = lines[i];
            
            // do !element values !collection
            if (line.match(/do\s+!(\w+)\s+values\s+!/) && line.includes(varName)) {
                return 'DBREF';  // В цикле values переменная всегда DBREF
            }
            
            // do !item values !array  
            if (line.match(/do\s+!(\w+)\s+values\s+!(\w+)/) && line.includes(varName)) {
                // Проверяем тип коллекции
                const collectionMatch = line.match(/do\s+!\w+\s+values\s+!(\w+)/);
                if (collectionMatch) {
                    const collectionName = collectionMatch[1];
                    // Ищем объявление коллекции
                    for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
                        const prevLine = lines[j];
                        if (prevLine.includes(collectionName)) {
                            if (prevLine.includes('ARRAY()')) return 'ANY';  // ARRAY содержит ANY
                            if (prevLine.includes('STRING()')) return 'STRING';
                            if (prevLine.includes('REAL()')) return 'REAL';
                            break;
                        }
                    }
                }
                return 'ANY';  // По умолчанию ANY для циклов
            }
        }
        
        return null;
    }

    /**
     * Получает методы для конкретного типа
     */
    private getTypeMethods(typeName: string): vscode.CompletionItem[] {
        const methods = ALL_TYPE_METHODS[typeName as keyof typeof ALL_TYPE_METHODS];
        if (!methods) return [];
        
        return methods.map(method => {
            const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
            
            // Формируем красивый detail
            const params = method.params.length > 0 ? `(${method.params.join(', ')})` : '()';
            item.detail = `AVEVA E3D Attribute`;
            item.documentation = method.description;
            
            // Вставляем с скобками
            if (method.params.length > 0) {
                const placeholders = method.params.map((p, i) => `\${${i + 1}:${p}}`).join(', ');
                item.insertText = new vscode.SnippetString(`${method.name}(${placeholders})`);
            } else {
                item.insertText = `${method.name}()`;
            }
            
            item.sortText = `0_${method.name}`; // Показывать первыми
            
            return item;
        });
    }

    /**
     * Получает методы для всех типов (когда тип неизвестен)
     */
    private getAllTypeMethods(): vscode.CompletionItem[] {
        const allMethods: vscode.CompletionItem[] = [];
        
        // Группируем по типам
        for (const [typeName, methods] of Object.entries(ALL_TYPE_METHODS)) {
            for (const method of methods) {
                const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
                
                const params = method.params.length > 0 ? `(${method.params.join(', ')})` : '()';
                item.detail = `AVEVA E3D Attribute`;
                item.documentation = method.description;
                
                if (method.params.length > 0) {
                    const placeholders = method.params.map((p, i) => `\${${i + 1}:${p}}`).join(', ');
                    item.insertText = new vscode.SnippetString(`${method.name}(${placeholders})`);
                } else {
                    item.insertText = `${method.name}()`;
                }
                
                item.sortText = `1_${typeName}_${method.name}`; // После type-specific
                
                allMethods.push(item);
            }
        }
        
        return allMethods;
    }
}




