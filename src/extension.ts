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
import { PMLCodeActionProvider } from './codeActions';
import { activateLanguageServer, deactivateLanguageServer } from './languageClient';

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ PML extension activated');
    console.log('Extension path:', context.extensionPath);

    // Activate Language Server (Phase 1 - LSP)
    // TODO: Once LSP is fully implemented, this will replace the providers below
    try {
        const client = activateLanguageServer(context);
        console.log('✅ PML Language Server client started');
    } catch (error) {
        console.error('❌ Failed to start PML Language Server:', error);
        vscode.window.showErrorMessage(`PML Language Server failed to start: ${error}`);
    }

    // Регистрация форматтера
    const formatter = vscode.languages.registerDocumentFormattingEditProvider('pml', new PMLFormatter());
    context.subscriptions.push(formatter);

    // Регистрация автодополнения
    // TEMPORARILY DISABLED: LSP provides this now
    // const completionProvider = vscode.languages.registerCompletionItemProvider(
    //     'pml',
    //     new PMLCompletionProvider(),
    //     '.', '!', '|'  // Триггерные символы
    // );
    // context.subscriptions.push(completionProvider);

    // Регистрация подсказок при наведении
    // TEMPORARILY DISABLED: LSP provides this now
    // const hoverProvider = vscode.languages.registerHoverProvider('pml', new PMLHoverProvider());
    // context.subscriptions.push(hoverProvider);

    // Регистрация навигации по символам (Outline)
    // TEMPORARILY DISABLED: LSP provides this now
    // const symbolProvider = vscode.languages.registerDocumentSymbolProvider('pml', new PMLDocumentSymbolProvider());
    // context.subscriptions.push(symbolProvider);

    // Definition / References / Rename / Signature Help
    // TEMPORARILY DISABLED: LSP provides these now (or will soon)
    // context.subscriptions.push(vscode.languages.registerDefinitionProvider('pml', new PMLDefinitionProvider()));
    // context.subscriptions.push(vscode.languages.registerReferenceProvider('pml', new PMLReferenceProvider()));
    // context.subscriptions.push(vscode.languages.registerRenameProvider('pml', new PMLRenameProvider()));
    // context.subscriptions.push(vscode.languages.registerSignatureHelpProvider('pml', new PMLSignatureHelpProvider(), '(', ','));

    // Регистрация диагностики
    // TEMPORARILY DISABLED: LSP provides diagnostics now
    // const diagnostics = new PMLDiagnostics();
    // context.subscriptions.push(diagnostics);

    // Регистрация PML Tools команд
    const toolsProvider = new PMLToolsProvider();
    context.subscriptions.push(toolsProvider);

    // Регистрация команд методов
    PMLMethodCommands.registerCommands(context);

    // Регистрация Code Actions (быстрые действия при выделении текста)
    const codeActionProvider = vscode.languages.registerCodeActionsProvider(
        'pml',
        new PMLCodeActionProvider(),
        {
            providedCodeActionKinds: PMLCodeActionProvider.providedCodeActionKinds
        }
    );
    context.subscriptions.push(codeActionProvider);

    // Diagnostics event handlers
    // TEMPORARILY DISABLED: LSP handles diagnostics automatically now
    // if (vscode.window.activeTextEditor) {
    //     diagnostics.updateDiagnostics(vscode.window.activeTextEditor.document);
    // }
    // context.subscriptions.push(
    //     vscode.window.onDidChangeActiveTextEditor(editor => {
    //         if (editor) {
    //             diagnostics.updateDiagnostics(editor.document);
    //         }
    //     })
    // );
    // context.subscriptions.push(
    //     vscode.workspace.onDidChangeTextDocument(event => {
    //         if (event.document.languageId === 'pml') {
    //             diagnostics.updateDiagnostics(event.document);
    //         }
    //     })
    // );
    // context.subscriptions.push(
    //     vscode.workspace.onDidSaveTextDocument(document => {
    //         if (document.languageId === 'pml') {
    //             diagnostics.updateDiagnostics(document);
    //         }
    //     })
    // );

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

export function deactivate(): Thenable<void> | undefined {
    console.log('PML extension deactivated');
    return deactivateLanguageServer();
}




