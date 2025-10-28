import * as vscode from 'vscode';
import { PMLDocumentationParser } from './documentation';

export class PMLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    // Кэш документации методов для использования в hover
    private static methodDocsCache = new Map<string, { line: number; doc: ReturnType<typeof PMLDocumentationParser.getMethodDocumentation> }>();

    static getMethodDocs(documentUri: string) {
        return this.methodDocsCache.get(documentUri);
    }
    provideDocumentSymbols(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.DocumentSymbol[] {
        const symbols: vscode.DocumentSymbol[] = [];

        // Regex для поиска методов и объектов
        const methodRegex = /^[ \t]*define[ \t]+method[ \t]+\.([a-zA-Z0-9_]+)\s*\(/im;
        const objectRegex = /^[ \t]*define[ \t]+object[ \t]+([a-zA-Z0-9_]+)/im;
        const formRegex = /^[ \t]*setup[ \t]+form[ \t]+(!!?[a-zA-Z0-9_]+)/im;
        const frameRegex = /^[ \t]*frame[ \t]+\.([a-zA-Z0-9_]+)/im;

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text;

            // Пропускаем комментарии
            const trimmed = text.trim();
            if (trimmed.startsWith('--') || trimmed.startsWith('$*')) {
                continue;
            }

            // Поиск методов
            let match = text.match(methodRegex);
            if (match) {
                const methodName = match[1];
                const startPos = new vscode.Position(i, 0);
                
                // Парсим документацию метода
                const methodDoc = PMLDocumentationParser.getMethodDocumentation(document, i);
                
                // Ищем endmethod
                let endLine = i;
                for (let j = i + 1; j < document.lineCount; j++) {
                    if (/^\s*endmethod\b/i.test(document.lineAt(j).text)) {
                        endLine = j;
                        break;
                    }
                }
                
                const endPos = new vscode.Position(endLine, document.lineAt(endLine).text.length);
                const range = new vscode.Range(startPos, endPos);
                const selectionRange = new vscode.Range(startPos, new vscode.Position(i, text.length));

                // Формируем название с описанием для Outline
                let symbolName = `.${methodName}()`;
                if (methodDoc && methodDoc.description) {
                    const shortDesc = methodDoc.description.split('\n')[0].substring(0, 50);
                    symbolName = `.${methodName}() — ${shortDesc}`;
                }

                const symbol = new vscode.DocumentSymbol(
                    symbolName,
                    methodDoc?.deprecated ? '⚠️ Deprecated' : 'Method',
                    vscode.SymbolKind.Method,
                    range,
                    selectionRange
                );
                
                symbols.push(symbol);
                continue;
            }

            // Поиск объектов
            match = text.match(objectRegex);
            if (match) {
                const objectName = match[1];
                const startPos = new vscode.Position(i, 0);
                
                // Ищем endobject
                let endLine = i;
                for (let j = i + 1; j < document.lineCount; j++) {
                    if (/^\s*endobject\b/i.test(document.lineAt(j).text)) {
                        endLine = j;
                        break;
                    }
                }
                
                const endPos = new vscode.Position(endLine, document.lineAt(endLine).text.length);
                const range = new vscode.Range(startPos, endPos);
                const selectionRange = new vscode.Range(startPos, new vscode.Position(i, text.length));

                const symbol = new vscode.DocumentSymbol(
                    objectName,
                    'Object',
                    vscode.SymbolKind.Class,
                    range,
                    selectionRange
                );
                
                symbols.push(symbol);
                continue;
            }

            // Поиск форм
            match = text.match(formRegex);
            if (match) {
                const formName = match[1];
                const startPos = new vscode.Position(i, 0);
                
                // Ищем exit
                let endLine = i;
                for (let j = i + 1; j < document.lineCount; j++) {
                    const lineText = document.lineAt(j).text;
                    if (/^\s*exit\b/i.test(lineText)) {
                        endLine = j;
                        break;
                    }
                }
                
                const endPos = new vscode.Position(endLine, document.lineAt(endLine).text.length);
                const range = new vscode.Range(startPos, endPos);
                const selectionRange = new vscode.Range(startPos, new vscode.Position(i, text.length));

                const symbol = new vscode.DocumentSymbol(
                    formName,
                    'Form',
                    vscode.SymbolKind.Interface,
                    range,
                    selectionRange
                );
                
                symbols.push(symbol);
                continue;
            }

            // Поиск фреймов
            match = text.match(frameRegex);
            if (match) {
                const frameName = match[1];
                const startPos = new vscode.Position(i, 0);
                
                // Ищем exit
                let endLine = i;
                for (let j = i + 1; j < document.lineCount; j++) {
                    const lineText = document.lineAt(j).text;
                    if (/^\s*exit\b/i.test(lineText)) {
                        endLine = j;
                        break;
                    }
                }
                
                const endPos = new vscode.Position(endLine, document.lineAt(endLine).text.length);
                const range = new vscode.Range(startPos, endPos);
                const selectionRange = new vscode.Range(startPos, new vscode.Position(i, text.length));

                const symbol = new vscode.DocumentSymbol(
                    frameName,
                    'Frame',
                    vscode.SymbolKind.Property,
                    range,
                    selectionRange
                );
                
                symbols.push(symbol);
            }
        }

        return symbols;
    }
}


