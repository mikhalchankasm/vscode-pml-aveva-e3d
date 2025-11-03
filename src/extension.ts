import * as vscode from 'vscode';
import { PMLFormatter } from './formatter';
// Legacy providers - replaced by Language Server Protocol (LSP)
// import { PMLDiagnostics } from './diagnostics';
// import { PMLCompletionProvider } from './completion';
// import { PMLHoverProvider } from './hover';
// import { PMLDocumentSymbolProvider } from './symbols';
// import { PMLDefinitionProvider } from './definition';
// import { PMLReferenceProvider } from './references';
// import { PMLRenameProvider } from './rename';
// import { PMLSignatureHelpProvider } from './signature';
import { PMLToolsProvider } from './tools';
import { PMLMethodCommands } from './methodCommands';
import { PMLCodeActionProvider } from './codeActions';
import { activateLanguageServer, deactivateLanguageServer } from './languageClient';
import { sortMethodsAscending, sortMethodsDescending } from './commands/sortMethods';

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ PML extension activated');
    console.log('Extension path:', context.extensionPath);

    // Activate Language Server (LSP)
    try {
        const client = activateLanguageServer(context);
        console.log('✅ PML Language Server client started');

        // Monitor client state for unexpected shutdowns
        client.onDidChangeState((event) => {
            if (event.newState === 2) { // ClientState.Stopped
                console.error('Language Server stopped unexpectedly');
                vscode.window.showWarningMessage(
                    'PML Language Server stopped. Some features may be unavailable.',
                    'View Output'
                ).then(selection => {
                    if (selection === 'View Output') {
                        vscode.commands.executeCommand('workbench.action.output.toggleOutput');
                    }
                });
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        console.error('❌ Failed to start PML Language Server:', message, stack);

        // Show detailed error message with action
        vscode.window.showErrorMessage(
            `PML Language Server failed to start: ${message}. ` +
            `Please check the Output panel for details.`,
            'View Output'
        ).then(selection => {
            if (selection === 'View Output') {
                vscode.commands.executeCommand('workbench.action.output.toggleOutput');
            }
        });

        // Continue with basic functionality (formatter, tools) even if LSP fails
    }

    // Register formatter
    const formatter = vscode.languages.registerDocumentFormattingEditProvider('pml', new PMLFormatter());
    context.subscriptions.push(formatter);

    // Register completion provider
    // TEMPORARILY DISABLED: LSP provides this now
    // const completionProvider = vscode.languages.registerCompletionItemProvider(
    //     'pml',
    //     new PMLCompletionProvider(),
    //     '.', '!', '|'  // Trigger characters
    // );
    // context.subscriptions.push(completionProvider);

    // Register hover provider
    // TEMPORARILY DISABLED: LSP provides this now
    // const hoverProvider = vscode.languages.registerHoverProvider('pml', new PMLHoverProvider());
    // context.subscriptions.push(hoverProvider);

    // Register document symbol provider (Outline)
    // TEMPORARILY DISABLED: LSP provides this now
    // const symbolProvider = vscode.languages.registerDocumentSymbolProvider('pml', new PMLDocumentSymbolProvider());
    // context.subscriptions.push(symbolProvider);

    // Definition / References / Rename / Signature Help
    // TEMPORARILY DISABLED: LSP provides these now (or will soon)
    // context.subscriptions.push(vscode.languages.registerDefinitionProvider('pml', new PMLDefinitionProvider()));
    // context.subscriptions.push(vscode.languages.registerReferenceProvider('pml', new PMLReferenceProvider()));
    // context.subscriptions.push(vscode.languages.registerRenameProvider('pml', new PMLRenameProvider()));
    // context.subscriptions.push(vscode.languages.registerSignatureHelpProvider('pml', new PMLSignatureHelpProvider(), '(', ','));

    // Register diagnostics
    // TEMPORARILY DISABLED: LSP provides diagnostics now
    // const diagnostics = new PMLDiagnostics();
    // context.subscriptions.push(diagnostics);

    // Register PML Tools commands
    const toolsProvider = new PMLToolsProvider();
    context.subscriptions.push(toolsProvider);

    // Register method commands
    PMLMethodCommands.registerCommands(context);

    // Register Sort Methods commands
    context.subscriptions.push(
        vscode.commands.registerCommand('pml.sortMethodsAscending', sortMethodsAscending),
        vscode.commands.registerCommand('pml.sortMethodsDescending', sortMethodsDescending)
    );

    // Register Code Actions (quick fixes on text selection)
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

    // Register format command
    const formatCommand = vscode.commands.registerCommand('pml.formatDocument', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        if (editor.document.languageId !== 'pml') {
            vscode.window.showErrorMessage('This is not a PML file');
            return;
        }

        await vscode.commands.executeCommand('editor.action.formatDocument');
        vscode.window.showInformationMessage('PML document formatted');
    });

    context.subscriptions.push(formatCommand);
}

export function deactivate(): Thenable<void> | undefined {
    console.log('PML extension deactivated');
    return deactivateLanguageServer();
}




