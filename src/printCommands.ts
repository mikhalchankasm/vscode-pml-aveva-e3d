import * as vscode from 'vscode';

interface PMLPrintLine {
    line: number;
    range: vscode.Range;
    commandRange: vscode.Range;
    text: string;
}

const PRINT_LINE_PATTERN = /^\s*\$[Pp](?=$|\s).*/;
const PRINT_COMMAND_PATTERN = /\$[Pp](?=$|\s)/;
const COMMENTED_PRINT_LINE_PATTERN = /^(\s*)\$\*\s*(\$[Pp](?=$|\s).*)$/;

export class PMLPrintTools implements vscode.Disposable, vscode.HoverProvider {
    private readonly disposables: vscode.Disposable[] = [];
    private readonly decorationType: vscode.TextEditorDecorationType;
    private readonly statusBarItem: vscode.StatusBarItem;

    constructor(context: vscode.ExtensionContext) {
        this.decorationType = vscode.window.createTextEditorDecorationType({
            isWholeLine: true,
            color: new vscode.ThemeColor('terminal.ansiGreen'),
            backgroundColor: new vscode.ThemeColor('editor.wordHighlightStrongBackground'),
            overviewRulerColor: new vscode.ThemeColor('terminal.ansiGreen'),
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            fontWeight: '700'
        });

        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 80);
        this.statusBarItem.command = 'pml.prints.clear';
        this.statusBarItem.tooltip = 'PML print commands in the active file';

        this.disposables.push(
            this.decorationType,
            this.statusBarItem,
            vscode.languages.registerHoverProvider('pml', this),
            vscode.commands.registerCommand('pml.prints.next', () => this.navigatePrint('next')),
            vscode.commands.registerCommand('pml.prints.previous', () => this.navigatePrint('previous')),
            vscode.commands.registerCommand('pml.prints.clear', () => this.showPrintActions()),
            vscode.commands.registerCommand('pml.prints.commentAll', () => this.commentAllPrints()),
            vscode.commands.registerCommand('pml.prints.uncommentAll', () => this.uncommentAllPrints()),
            vscode.commands.registerCommand('pml.prints.deleteAll', () => this.deleteAllPrints()),
            vscode.commands.registerCommand('pml.prints.commentLine', (line?: number) => this.commentPrintLine(line)),
            vscode.commands.registerCommand('pml.prints.deleteLine', (line?: number) => this.deletePrintLine(line)),
            vscode.window.onDidChangeActiveTextEditor(() => this.refresh()),
            vscode.workspace.onDidChangeTextDocument(event => {
                if (event.document.languageId === 'pml') {
                    this.refresh();
                }
            }),
            vscode.window.onDidChangeVisibleTextEditors(() => this.refresh())
        );

        context.subscriptions.push(this);
        this.refresh();
    }

    public dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.Hover | undefined {
        const prints = findPMLPrintLines(document);
        const index = prints.findIndex(print => print.line === position.line);
        if (index === -1) {
            return undefined;
        }

        const print = prints[index];
        const markdown = new vscode.MarkdownString(undefined, true);
        markdown.isTrusted = true;
        markdown.appendMarkdown(`**$P print ${index + 1}/${prints.length}**\n\n`);
        markdown.appendCodeblock(print.text.trim(), 'pml');
        markdown.appendMarkdown('\n');
        markdown.appendMarkdown([
            commandLink('Prev', 'pml.prints.previous'),
            commandLink('Next', 'pml.prints.next'),
            commandLink('Comment', 'pml.prints.commentLine', [print.line]),
            commandLink('Delete', 'pml.prints.deleteLine', [print.line]),
            commandLink('Actions', 'pml.prints.clear')
        ].join(' | '));

        return new vscode.Hover(markdown, print.range);
    }

    private refresh(): void {
        this.updateDecorations();
        this.updateStatusBar();
    }

    private updateDecorations(): void {
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document.languageId !== 'pml') {
                editor.setDecorations(this.decorationType, []);
                continue;
            }

            const decorations = findPMLPrintLines(editor.document).map(print => ({
                range: print.range,
                hoverMessage: new vscode.MarkdownString(`PML print output: \`${print.text.trim()}\``)
            }));
            editor.setDecorations(this.decorationType, decorations);
        }
    }

    private updateStatusBar(): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'pml') {
            this.statusBarItem.hide();
            return;
        }

        const count = findPMLPrintLines(editor.document).length;
        this.statusBarItem.text = `$(output) $P ${count}`;
        this.statusBarItem.show();
    }

    private async navigatePrint(direction: 'next' | 'previous'): Promise<void> {
        const editor = getActivePMLEditor();
        if (!editor) {
            return;
        }

        const prints = findPMLPrintLines(editor.document);
        if (prints.length === 0) {
            vscode.window.showInformationMessage('No $P print commands found');
            return;
        }

        const currentLine = editor.selection.active.line;
        const target = direction === 'next'
            ? prints.find(print => print.line > currentLine) ?? prints[0]
            : [...prints].reverse().find(print => print.line < currentLine) ?? prints[prints.length - 1];

        editor.selection = new vscode.Selection(target.commandRange.start, target.commandRange.start);
        editor.revealRange(target.range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    }

    private async showPrintActions(): Promise<void> {
        const editor = getActivePMLEditor();
        if (!editor) {
            return;
        }

        const count = findPMLPrintLines(editor.document).length;
        const commentedCount = findCommentedPMLPrintLines(editor.document).length;
        if (count === 0 && commentedCount === 0) {
            vscode.window.showInformationMessage('No $P print commands found');
            return;
        }

        const action = await vscode.window.showQuickPick([
            {
                label: 'Go to next $P print',
                description: `${count} in file`,
                command: 'pml.prints.next'
            },
            {
                label: 'Go to previous $P print',
                description: `${count} in file`,
                command: 'pml.prints.previous'
            },
            {
                label: 'Comment all $P prints',
                description: 'Prefix every print line with $*',
                command: 'pml.prints.commentAll'
            },
            {
                label: 'Uncomment all $P prints',
                description: `Restore ${commentedCount} commented print line(s)`,
                command: 'pml.prints.uncommentAll'
            },
            {
                label: 'Delete all $P prints',
                description: 'Remove every print line from this file',
                command: 'pml.prints.deleteAll'
            }
        ]);

        if (action) {
            await vscode.commands.executeCommand(action.command);
        }
    }

    private async commentAllPrints(): Promise<void> {
        const editor = getActivePMLEditor();
        if (!editor) {
            return;
        }

        const prints = findPMLPrintLines(editor.document);
        if (prints.length === 0) {
            vscode.window.showInformationMessage('No $P print commands found');
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        for (const print of prints) {
            const line = editor.document.lineAt(print.line);
            edit.replace(editor.document.uri, line.range, commentPrintText(line.text));
        }

        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
            vscode.window.showInformationMessage(`Commented ${prints.length} $P print command(s)`);
        }
    }

    private async uncommentAllPrints(): Promise<void> {
        const editor = getActivePMLEditor();
        if (!editor) {
            return;
        }

        const prints = findCommentedPMLPrintLines(editor.document);
        if (prints.length === 0) {
            vscode.window.showInformationMessage('No commented $P print commands found');
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        for (const print of prints) {
            const line = editor.document.lineAt(print.line);
            edit.replace(editor.document.uri, line.range, uncommentPrintText(line.text));
        }

        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
            vscode.window.showInformationMessage(`Uncommented ${prints.length} $P print command(s)`);
        }
    }

    private async deleteAllPrints(): Promise<void> {
        const editor = getActivePMLEditor();
        if (!editor) {
            return;
        }

        const prints = findPMLPrintLines(editor.document);
        if (prints.length === 0) {
            vscode.window.showInformationMessage('No $P print commands found');
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Delete ${prints.length} $P print command(s) from this file?`,
            { modal: true },
            'Delete'
        );
        if (confirm !== 'Delete') {
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        for (const print of [...prints].reverse()) {
            edit.delete(editor.document.uri, getFullLineRange(editor.document, print.line));
        }

        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
            vscode.window.showInformationMessage(`Deleted ${prints.length} $P print command(s)`);
        }
    }

    private async commentPrintLine(line?: number): Promise<void> {
        const editor = getActivePMLEditor();
        if (!editor) {
            return;
        }

        const targetLine = getTargetLine(editor, line);
        if (targetLine === undefined) {
            return;
        }
        if (!isPMLPrintLine(editor.document.lineAt(targetLine).text)) {
            vscode.window.showInformationMessage('Current line is not a $P print command');
            return;
        }

        const textLine = editor.document.lineAt(targetLine);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, textLine.range, commentPrintText(textLine.text));
        await vscode.workspace.applyEdit(edit);
    }

    private async deletePrintLine(line?: number): Promise<void> {
        const editor = getActivePMLEditor();
        if (!editor) {
            return;
        }

        const targetLine = getTargetLine(editor, line);
        if (targetLine === undefined) {
            return;
        }
        if (!isPMLPrintLine(editor.document.lineAt(targetLine).text)) {
            vscode.window.showInformationMessage('Current line is not a $P print command');
            return;
        }

        const edit = new vscode.WorkspaceEdit();
        edit.delete(editor.document.uri, getFullLineRange(editor.document, targetLine));
        await vscode.workspace.applyEdit(edit);
    }
}

function getActivePMLEditor(): vscode.TextEditor | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'pml') {
        vscode.window.showErrorMessage('No active PML editor');
        return undefined;
    }
    return editor;
}

function getTargetLine(editor: vscode.TextEditor, line?: number): number | undefined {
    const targetLine = typeof line === 'number' ? line : editor.selection.active.line;
    if (targetLine < 0 || targetLine >= editor.document.lineCount) {
        vscode.window.showInformationMessage('Print command is no longer available');
        return undefined;
    }
    return targetLine;
}

function commandLink(label: string, command: string, args: unknown[] = []): string {
    const encodedArgs = args.length > 0 ? `?${encodeURIComponent(JSON.stringify(args))}` : '';
    return `[${label}](command:${command}${encodedArgs})`;
}

function findPMLPrintLines(document: vscode.TextDocument): PMLPrintLine[] {
    const prints: PMLPrintLine[] = [];
    let inBlockComment = false;

    for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
        const line = document.lineAt(lineNumber);
        if (inBlockComment) {
            if (line.text.includes('$)')) {
                inBlockComment = false;
            }
            continue;
        }

        const blockCommentStart = line.text.indexOf('$(');
        const commandIndex = line.text.search(PRINT_COMMAND_PATTERN);
        if (blockCommentStart !== -1 && line.text.indexOf('$)', blockCommentStart + 2) === -1) {
            inBlockComment = true;
        }

        if (!isPMLPrintLine(line.text)) {
            continue;
        }

        if (blockCommentStart !== -1 && blockCommentStart < commandIndex) {
            continue;
        }

        const start = new vscode.Position(lineNumber, commandIndex);
        const end = new vscode.Position(lineNumber, commandIndex + 2);
        prints.push({
            line: lineNumber,
            range: line.range,
            commandRange: new vscode.Range(start, end),
            text: line.text
        });
    }

    return prints;
}

function isPMLPrintLine(text: string): boolean {
    return PRINT_LINE_PATTERN.test(text);
}

function isCommentedPMLPrintLine(text: string): boolean {
    return COMMENTED_PRINT_LINE_PATTERN.test(text);
}

function commentPrintText(text: string): string {
    const indent = text.match(/^\s*/)?.[0] ?? '';
    return `${indent}$* ${text.slice(indent.length)}`;
}

function uncommentPrintText(text: string): string {
    return text.replace(COMMENTED_PRINT_LINE_PATTERN, '$1$2');
}

function findCommentedPMLPrintLines(document: vscode.TextDocument): PMLPrintLine[] {
    const prints: PMLPrintLine[] = [];

    for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
        const line = document.lineAt(lineNumber);
        if (!isCommentedPMLPrintLine(line.text)) {
            continue;
        }

        prints.push({
            line: lineNumber,
            range: line.range,
            commandRange: line.range,
            text: line.text
        });
    }

    return prints;
}

function getFullLineRange(document: vscode.TextDocument, line: number): vscode.Range {
    if (line < document.lineCount - 1) {
        return new vscode.Range(line, 0, line + 1, 0);
    }

    if (line === 0) {
        return document.lineAt(line).range;
    }

    const previousLine = document.lineAt(line - 1);
    const currentLine = document.lineAt(line);
    return new vscode.Range(previousLine.range.end, currentLine.range.end);
}
