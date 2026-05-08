import * as vscode from 'vscode';
import {
    commentPrintText,
    isPMLPrintLine,
    scanCommentedPMLPrintLines,
    scanPMLPrintLines,
    uncommentPrintText
} from './printCommandUtils';

interface PMLPrintLine {
    line: number;
    range: vscode.Range;
    commandRange: vscode.Range;
    text: string;
}

interface PMLPrintCacheEntry {
    version: number;
    prints: PMLPrintLine[];
    commentedPrints: PMLPrintLine[];
}

interface PMLPrintCommandTarget {
    line?: number;
    text?: string;
}

const REFRESH_DELAY_MS = 125;

export class PMLPrintTools implements vscode.Disposable, vscode.HoverProvider {
    private readonly disposables: vscode.Disposable[] = [];
    private readonly decorationType: vscode.TextEditorDecorationType;
    private readonly statusBarItem: vscode.StatusBarItem;
    private readonly cache = new Map<string, PMLPrintCacheEntry>();
    private refreshTimer: ReturnType<typeof setTimeout> | undefined;

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
            vscode.commands.registerCommand('pml.prints.commentLine', (target?: number | PMLPrintCommandTarget) => this.commentPrintLine(target)),
            vscode.commands.registerCommand('pml.prints.deleteLine', (target?: number | PMLPrintCommandTarget) => this.deletePrintLine(target)),
            vscode.window.onDidChangeActiveTextEditor(() => this.scheduleRefresh()),
            vscode.workspace.onDidChangeTextDocument(event => {
                if (event.document.languageId === 'pml') {
                    this.invalidateDocument(event.document);
                    if (this.isVisibleDocument(event.document)) {
                        this.scheduleRefresh();
                    }
                }
            }),
            vscode.window.onDidChangeVisibleTextEditors(() => this.scheduleRefresh())
        );

        context.subscriptions.push(this);
        this.refresh();
    }

    public dispose(): void {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.disposables.forEach(disposable => disposable.dispose());
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.Hover | undefined {
        const prints = this.getPrints(document);
        const index = prints.findIndex(print => print.line === position.line);
        if (index === -1) {
            return undefined;
        }

        const print = prints[index];
        const markdown = new vscode.MarkdownString(undefined, true);
        // Only static command links are trusted; print text is rendered as a code block.
        markdown.isTrusted = true;
        markdown.appendMarkdown(`**$P print ${index + 1}/${prints.length}**\n\n`);
        markdown.appendCodeblock(print.text.trim(), 'pml');
        markdown.appendMarkdown('\n');
        markdown.appendMarkdown([
            commandLink('Prev', 'pml.prints.previous'),
            commandLink('Next', 'pml.prints.next'),
            commandLink('Comment', 'pml.prints.commentLine', [{ line: print.line, text: print.text }]),
            commandLink('Delete', 'pml.prints.deleteLine', [{ line: print.line, text: print.text }]),
            commandLink('Actions', 'pml.prints.clear')
        ].join(' | '));

        return new vscode.Hover(markdown, print.range);
    }

    private refresh(): void {
        this.refreshTimer = undefined;
        this.updateDecorations();
        this.updateStatusBar();
    }

    private scheduleRefresh(): void {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        this.refreshTimer = setTimeout(() => this.refresh(), REFRESH_DELAY_MS);
    }

    private updateDecorations(): void {
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document.languageId !== 'pml') {
                editor.setDecorations(this.decorationType, []);
                continue;
            }

            const decorations = this.getPrints(editor.document).map(print => ({
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

        const count = this.getPrints(editor.document).length;
        this.statusBarItem.text = `$(output) $P ${count}`;
        this.statusBarItem.show();
    }

    private getPrints(document: vscode.TextDocument): PMLPrintLine[] {
        return this.getCacheEntry(document).prints;
    }

    private getCommentedPrints(document: vscode.TextDocument): PMLPrintLine[] {
        return this.getCacheEntry(document).commentedPrints;
    }

    private getCacheEntry(document: vscode.TextDocument): PMLPrintCacheEntry {
        const key = document.uri.toString();
        const cached = this.cache.get(key);
        if (cached && cached.version === document.version) {
            return cached;
        }

        const entry = {
            version: document.version,
            prints: findPMLPrintLines(document),
            commentedPrints: findCommentedPMLPrintLines(document)
        };
        this.cache.set(key, entry);
        return entry;
    }

    private invalidateDocument(document: vscode.TextDocument): void {
        this.cache.delete(document.uri.toString());
    }

    private isVisibleDocument(document: vscode.TextDocument): boolean {
        return vscode.window.visibleTextEditors.some(editor => editor.document.uri.toString() === document.uri.toString());
    }

    private async navigatePrint(direction: 'next' | 'previous'): Promise<void> {
        const editor = getActivePMLEditor();
        if (!editor) {
            return;
        }

        const prints = this.getPrints(editor.document);
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

        const count = this.getPrints(editor.document).length;
        const commentedCount = this.getCommentedPrints(editor.document).length;
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

        const prints = this.getPrints(editor.document);
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

        const prints = this.getCommentedPrints(editor.document);
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

        const prints = this.getPrints(editor.document);
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

    private async commentPrintLine(target?: number | PMLPrintCommandTarget): Promise<void> {
        const editor = getActivePMLEditor();
        if (!editor) {
            return;
        }

        const targetLine = getTargetLine(editor, target, this.getPrints(editor.document));
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

    private async deletePrintLine(target?: number | PMLPrintCommandTarget): Promise<void> {
        const editor = getActivePMLEditor();
        if (!editor) {
            return;
        }

        const targetLine = getTargetLine(editor, target, this.getPrints(editor.document));
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

function getTargetLine(
    editor: vscode.TextEditor,
    target?: number | PMLPrintCommandTarget,
    prints: PMLPrintLine[] = []
): number | undefined {
    if (target === undefined) {
        return editor.selection.active.line;
    }

    if (typeof target === 'number') {
        if (!isLineInRange(editor, target)) {
            vscode.window.showInformationMessage('Print command is no longer available');
            return undefined;
        }
        return target;
    }

    if (target.line !== undefined && isLineInRange(editor, target.line)) {
        const currentText = editor.document.lineAt(target.line).text;
        if (!target.text || currentText === target.text) {
            return target.line;
        }
    }

    if (target.text) {
        const matchingPrint = prints.find(print => print.text === target.text);
        if (matchingPrint) {
            return matchingPrint.line;
        }
    }

    vscode.window.showInformationMessage('Print command is no longer available');
    return undefined;
}

function isLineInRange(editor: vscode.TextEditor, line: number): boolean {
    return line >= 0 && line < editor.document.lineCount;
}

function commandLink(label: string, command: string, args: unknown[] = []): string {
    const encodedArgs = args.length > 0 ? `?${encodeURIComponent(JSON.stringify(args))}` : '';
    return `[${label}](command:${command}${encodedArgs})`;
}

function findPMLPrintLines(document: vscode.TextDocument): PMLPrintLine[] {
    return scanPMLPrintLines(getDocumentLines(document)).map(print => {
        const start = new vscode.Position(print.line, print.commandIndex);
        const end = new vscode.Position(print.line, print.commandIndex + 2);
        return {
            line: print.line,
            range: document.lineAt(print.line).range,
            commandRange: new vscode.Range(start, end),
            text: print.text
        };
    });
}

function findCommentedPMLPrintLines(document: vscode.TextDocument): PMLPrintLine[] {
    return scanCommentedPMLPrintLines(getDocumentLines(document)).map(print => ({
        line: print.line,
        range: document.lineAt(print.line).range,
        commandRange: document.lineAt(print.line).range,
        text: print.text
    }));
}

function getDocumentLines(document: vscode.TextDocument): string[] {
    const lines: string[] = [];
    for (let line = 0; line < document.lineCount; line++) {
        lines.push(document.lineAt(line).text);
    }
    return lines;
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
