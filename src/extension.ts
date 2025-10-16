import * as vscode from 'vscode';
import { PMLFormatter } from './formatter';
import { PMLDiagnostics } from './diagnostics';
import { PMLCompletionProvider } from './completion';
import { PMLHoverProvider } from './hover';
import { PMLDocumentSymbolProvider } from './symbols';
import { PMLDefinitionProvider } from './definition';
import { PMLReferenceProvider } from './references';
import { PMLRenameProvider } from './rename';
import { PMLSignatureHelpProvider } from './signature';
import { PMLToolsProvider } from './tools';
import { PMLMethodCommands } from './methodCommands';

export function activate(context: vscode.ExtensionContext) {
    console.log('PML extension activated');

    // Регистрация форматтера
    const formatter = vscode.languages.registerDocumentFormattingEditProvider('pml', new PMLFormatter());
    context.subscriptions.push(formatter);

    // Регистрация автодополнения
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'pml',
        new PMLCompletionProvider(),
        '.', '!', '|'  // Триггерные символы
    );
    context.subscriptions.push(completionProvider);

    // Регистрация подсказок при наведении
    const hoverProvider = vscode.languages.registerHoverProvider('pml', new PMLHoverProvider());
    context.subscriptions.push(hoverProvider);

    // Регистрация навигации по символам (Outline)
    const symbolProvider = vscode.languages.registerDocumentSymbolProvider('pml', new PMLDocumentSymbolProvider());
    context.subscriptions.push(symbolProvider);

    // Definition / References / Rename / Signature Help
    context.subscriptions.push(vscode.languages.registerDefinitionProvider('pml', new PMLDefinitionProvider()));
    context.subscriptions.push(vscode.languages.registerReferenceProvider('pml', new PMLReferenceProvider()));
    context.subscriptions.push(vscode.languages.registerRenameProvider('pml', new PMLRenameProvider()));
    context.subscriptions.push(vscode.languages.registerSignatureHelpProvider('pml', new PMLSignatureHelpProvider(), '(', ','));

    // Регистрация диагностики
    const diagnostics = new PMLDiagnostics();
    context.subscriptions.push(diagnostics);

    // Регистрация PML Tools команд
    const toolsProvider = new PMLToolsProvider();
    context.subscriptions.push(toolsProvider);

    // Регистрация команд методов
    PMLMethodCommands.registerCommands(context);

    // Проверка при открытии документа
    if (vscode.window.activeTextEditor) {
        diagnostics.updateDiagnostics(vscode.window.activeTextEditor.document);
    }

    // Проверка при изменении активного редактора
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                diagnostics.updateDiagnostics(editor.document);
            }
        })
    );

    // Проверка при изменении документа
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'pml') {
                diagnostics.updateDiagnostics(event.document);
            }
        })
    );

    // Проверка при сохранении документа
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(document => {
            if (document.languageId === 'pml') {
                diagnostics.updateDiagnostics(document);
            }
        })
    );

    // Регистрация команды форматирования
    const formatCommand = vscode.commands.registerCommand('pml.formatDocument', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Нет активного редактора');
            return;
        }

        if (editor.document.languageId !== 'pml') {
            vscode.window.showErrorMessage('Это не PML файл');
            return;
        }

        await vscode.commands.executeCommand('editor.action.formatDocument');
        vscode.window.showInformationMessage('PML документ отформатирован');
    });

    context.subscriptions.push(formatCommand);
}

export function deactivate() {
    console.log('PML extension deactivated');
}




