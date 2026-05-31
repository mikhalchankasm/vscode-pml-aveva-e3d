import * as vscode from 'vscode';

export class PMLCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.RefactorRewrite,
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        _range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        _token: vscode.CancellationToken
    ): vscode.CodeAction[] | undefined {

        // Check if this is a PML document
        if (document.languageId !== 'pml') {
            return undefined;
        }

        return [
            ...this.getFormCallbackQuickFixes(document, context),
            ...this.getCommentActions()
        ];
    }

    private getFormCallbackQuickFixes(
        document: vscode.TextDocument,
        context: vscode.CodeActionContext
    ): vscode.CodeAction[] {
        if (!document.fileName.toLowerCase().endsWith('.pmlfrm')) {
            return [];
        }

        const actions: vscode.CodeAction[] = [];
        const missingCallbackDiagnostics = context.diagnostics.filter(diagnostic =>
            diagnostic.code === 'missing-form-callback' ||
            String(diagnostic.code) === 'missing-form-callback'
        );

        for (const diagnostic of missingCallbackDiagnostics) {
            const methodName = this.extractMissingCallbackMethodName(diagnostic.message);
            if (!methodName || this.documentDefinesMethod(document, methodName)) {
                continue;
            }

            const action = new vscode.CodeAction(
                `Generate callback method .${methodName}()`,
                vscode.CodeActionKind.QuickFix
            );
            action.diagnostics = [diagnostic];
            action.isPreferred = true;
            action.edit = new vscode.WorkspaceEdit();
            action.edit.insert(
                document.uri,
                this.endOfDocumentPosition(document),
                this.createCallbackStub(document, methodName)
            );
            actions.push(action);
        }

        return actions;
    }

    /**
     * Returns Code Actions for comment operations
     */
    private getCommentActions(): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        // 1. Add Comments
        const addCommentsAction = new vscode.CodeAction(
            '💬 Add Comments',
            vscode.CodeActionKind.RefactorRewrite
        );
        addCommentsAction.command = {
            command: 'pml.addComments',
            title: 'Add Comments',
            arguments: []
        };
        addCommentsAction.isPreferred = true;
        actions.push(addCommentsAction);

        // 2. Remove Comments
        const removeCommentsAction = new vscode.CodeAction(
            '💬 Remove Comments',
            vscode.CodeActionKind.RefactorRewrite
        );
        removeCommentsAction.command = {
            command: 'pml.removeComments',
            title: 'Remove Comments',
            arguments: []
        };
        actions.push(removeCommentsAction);

        return actions;
    }

    private extractMissingCallbackMethodName(message: string): string | undefined {
        const match = message.match(/missing method '\.([A-Za-z_][A-Za-z0-9_]*)\(\)'/i);
        return match?.[1];
    }

    private documentDefinesMethod(document: vscode.TextDocument, methodName: string): boolean {
        const escapedMethodName = this.escapeRegex(methodName);
        const pattern = new RegExp(`^\\s*define\\s+method\\s+\\.${escapedMethodName}\\s*(?:\\(|$)`, 'im');
        return pattern.test(document.getText());
    }

    private createCallbackStub(document: vscode.TextDocument, methodName: string): string {
        const newline = document.getText().includes('\r\n') ? '\r\n' : '\n';
        const prefix = document.lineCount > 0 && document.lineAt(document.lineCount - 1).text.length > 0
            ? newline + newline
            : newline;

        return [
            prefix + `define method .${methodName}()`,
            '\t',
            'endmethod',
            ''
        ].join(newline);
    }

    private endOfDocumentPosition(document: vscode.TextDocument): vscode.Position {
        const lastLine = Math.max(document.lineCount - 1, 0);
        return new vscode.Position(lastLine, document.lineAt(lastLine).text.length);
    }

    private escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

