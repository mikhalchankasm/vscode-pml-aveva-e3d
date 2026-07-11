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

interface CodeLensPositionArgument {
    line: number;
    character: number;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ PML extension activated');
    console.log('Extension path:', context.extensionPath);

    // Activate Language Server (LSP)
    try {
        const client = activateLanguageServer(context);
        console.log('✅ PML Language Server client started');

        // Monitor client state for unexpected shutdowns
        let hasReachedRunningState = false;
        client.onDidChangeState((event) => {
            if (event.newState === ClientState.Running) {
                hasReachedRunningState = true;
            } else if (event.newState === ClientState.Stopped && hasReachedRunningState) {
                hasReachedRunningState = false;
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
    const toolsProvider = new PMLToolsProvider(context.extensionPath);
    context.subscriptions.push(toolsProvider);

    // Register $P print helpers
    new PMLPrintTools(context);

    // Register the unified action launcher
    registerPMLQuickActions(context);

    // Register Agent Kit review and help commands
    registerAgentKitCommands(context);

    context.subscriptions.push(vscode.commands.registerCommand(
        'pml.showCodeLensReferences',
        async (uriValue: string, positionValue: CodeLensPositionArgument) => {
            const uri = vscode.Uri.parse(uriValue);
            const position = new vscode.Position(positionValue.line, positionValue.character);
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uri,
                position
            ) ?? [];

            if (locations.length === 0) {
                void vscode.window.showInformationMessage('No references found');
                return;
            }

            await vscode.commands.executeCommand('editor.action.showReferences', uri, position, locations);
        }
    ));

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

	context.subscriptions.push(vscode.commands.registerCommand(
		'pml.goToCallableDefinition',
		async (uri: string, position: { line: number; character: number }) => {
			if (typeof uri !== 'string' || !position || !Number.isInteger(position.line) || !Number.isInteger(position.character)) {
				return;
			}
			const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
			const editor = await vscode.window.showTextDocument(document);
			const target = new vscode.Position(position.line, position.character);
			editor.selection = new vscode.Selection(target, target);
			editor.revealRange(new vscode.Range(target, target), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
		}
	));

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




