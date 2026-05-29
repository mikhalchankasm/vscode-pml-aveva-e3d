import * as vscode from 'vscode';
import { PMLFormatter } from './formatter';
import { PMLToolsProvider } from './tools';
import { PMLMethodCommands } from './methodCommands';
import { PMLCodeActionProvider } from './codeActions';
import { activateLanguageServer, deactivateLanguageServer, ClientState } from './languageClient';
import { sortMethodsAscending, sortMethodsDescending } from './commands/sortMethods';
import { PMLPrintTools } from './printCommands';
import { registerPMLQuickActions } from './quickActions';
import { registerAgentKitCommands } from './agentKit';

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ PML extension activated');
    console.log('Extension path:', context.extensionPath);

    // Activate Language Server (LSP)
    try {
        const client = activateLanguageServer(context);
        console.log('✅ PML Language Server client started');

        // Monitor client state for unexpected shutdowns
        client.onDidChangeState((event) => {
            if (event.newState === ClientState.Stopped) {
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

    // Register PML Tools commands
    const toolsProvider = new PMLToolsProvider();
    context.subscriptions.push(toolsProvider);

    // Register $P print helpers
    new PMLPrintTools(context);

    // Register the unified action launcher
    registerPMLQuickActions(context);

    // Register Agent Kit review and help commands
    registerAgentKitCommands(context);

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




