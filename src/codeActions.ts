import * as vscode from 'vscode';

export class PMLCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.RefactorRewrite,
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        _range: vscode.Range | vscode.Selection,
        _context: vscode.CodeActionContext,
        _token: vscode.CancellationToken
    ): vscode.CodeAction[] | undefined {

        // Check if this is a PML document
        if (document.languageId !== 'pml') {
            return undefined;
        }

        return this.getCommentActions();
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
}

