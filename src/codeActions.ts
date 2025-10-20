import * as vscode from 'vscode';

export class PMLCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.RefactorRewrite,
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        _context: vscode.CodeActionContext,
        _token: vscode.CancellationToken
    ): vscode.CodeAction[] | undefined {
        
        // Проверяем что это PML документ
        if (document.languageId !== 'pml') {
            return undefined;
        }

        // Проверяем что есть выделение
        if (range.isEmpty) {
            return undefined;
        }

        const selectedText = document.getText(range);
        const lines = selectedText.split('\n').filter(line => line.trim().length > 0);

        // Если выделено несколько строк - предлагаем Array команды
        if (lines.length >= 2) {
            return this.getArrayActions(document, range, lines);
        }

        return undefined;
    }

    /**
     * Возвращает Code Actions для создания массивов
     */
    private getArrayActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        lines: string[]
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        // === Array команды ===
        
        // 1. Make List (Path)
        const makeListPathAction = new vscode.CodeAction(
            `📋 Array: Make List (Path) — ${lines.length} items`,
            vscode.CodeActionKind.RefactorRewrite
        );
        makeListPathAction.command = {
            command: 'pml.makeListPath',
            title: 'Make List (Path)',
            arguments: []
        };
        makeListPathAction.isPreferred = true; // Показывать первым
        actions.push(makeListPathAction);

        // 2. Make List (String)
        const makeListStringAction = new vscode.CodeAction(
            `📋 Array: Make List (String) — ${lines.length} items`,
            vscode.CodeActionKind.RefactorRewrite
        );
        makeListStringAction.command = {
            command: 'pml.makeListString',
            title: 'Make List (String)',
            arguments: []
        };
        actions.push(makeListStringAction);

        // 3. Make List (Path String)
        const makeListPathStringAction = new vscode.CodeAction(
            `📋 Array: Make List (Path String) — ${lines.length} items`,
            vscode.CodeActionKind.RefactorRewrite
        );
        makeListPathStringAction.command = {
            command: 'pml.makeListPathString',
            title: 'Make List (Path String)',
            arguments: []
        };
        actions.push(makeListPathStringAction);

        // === Сортировка ===
        
        // 4. Sort A-Z
        const sortAscAction = new vscode.CodeAction(
            `🔤 Sort: A → Z`,
            vscode.CodeActionKind.RefactorRewrite
        );
        sortAscAction.command = {
            command: 'pml.sortLinesAsc',
            title: 'Sort Lines A-Z',
            arguments: []
        };
        actions.push(sortAscAction);

        // 5. Sort Z-A
        const sortDescAction = new vscode.CodeAction(
            `🔤 Sort: Z → A`,
            vscode.CodeActionKind.RefactorRewrite
        );
        sortDescAction.command = {
            command: 'pml.sortLinesDesc',
            title: 'Sort Lines Z-A',
            arguments: []
        };
        actions.push(sortDescAction);

        // 6. Smart Sort
        const sortSmartAction = new vscode.CodeAction(
            `🔤 Sort: Smart Natural`,
            vscode.CodeActionKind.RefactorRewrite
        );
        sortSmartAction.command = {
            command: 'pml.sortLinesSmart',
            title: 'Smart Natural Sort',
            arguments: []
        };
        actions.push(sortSmartAction);

        // === Очистка ===
        
        // 7. Remove Duplicates
        const removeDuplicatesAction = new vscode.CodeAction(
            `🗑️ Remove: Duplicate Lines`,
            vscode.CodeActionKind.RefactorRewrite
        );
        removeDuplicatesAction.command = {
            command: 'pml.removeDuplicates',
            title: 'Remove Duplicate Lines',
            arguments: []
        };
        actions.push(removeDuplicatesAction);

        // 8. Remove Empty Lines
        const removeEmptyAction = new vscode.CodeAction(
            `🗑️ Remove: Empty Lines`,
            vscode.CodeActionKind.RefactorRewrite
        );
        removeEmptyAction.command = {
            command: 'pml.removeEmptyLines',
            title: 'Remove Empty Lines',
            arguments: []
        };
        actions.push(removeEmptyAction);

        // 9. Trim Whitespace
        const trimWhitespaceAction = new vscode.CodeAction(
            `✂️ Trim: Trailing Whitespace`,
            vscode.CodeActionKind.RefactorRewrite
        );
        trimWhitespaceAction.command = {
            command: 'pml.trimWhitespace',
            title: 'Trim Trailing Whitespace',
            arguments: []
        };
        actions.push(trimWhitespaceAction);

        return actions;
    }
}

