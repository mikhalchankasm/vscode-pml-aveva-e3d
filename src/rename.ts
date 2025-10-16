import * as vscode from 'vscode';

const PML_GLOB = '**/*.{pml,pmlobj,pmlfnc,pmlfrm,pmlmac,pmlcmd}';

export class PMLRenameProvider implements vscode.RenameProvider {
    async provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string, token: vscode.CancellationToken): Promise<vscode.WorkspaceEdit | undefined> {
        const range = document.getWordRangeAtPosition(position, /\.?[a-zA-Z_][a-zA-Z0-9_]*/);
        if (!range) return undefined;
        const word = document.getText(range);
        const oldName = word.startsWith('.') ? word.substring(1) : word;
        if (!/^\.?[a-zA-Z_][a-zA-Z0-9_]*$/.test(newName)) {
            vscode.window.showErrorMessage('Invalid method name');
            return undefined;
        }
        const targetName = newName.startsWith('.') ? newName.substring(1) : newName;

        const edit = new vscode.WorkspaceEdit();
        const files = await vscode.workspace.findFiles(PML_GLOB, undefined, 1000);

        const applyDoc = (doc: vscode.TextDocument) => {
            const defRe = new RegExp(`(^\\s*define\\s+method\\s+)\\.${oldName}(\\s*\\()`, 'i');
            const callRe = new RegExp(`\\.${oldName}(\\s*\\()`, 'g');

            for (let i = 0; i < doc.lineCount; i++) {
                const text = doc.lineAt(i).text;
                const defMatch = defRe.exec(text);
                if (defMatch) {
                    const start = new vscode.Position(i, defMatch[1].length + 1);
                    const end = new vscode.Position(i, defMatch[1].length + 1 + oldName.length);
                    edit.replace(doc.uri, new vscode.Range(start, end), targetName);
                    continue;
                }
                let m: RegExpExecArray | null;
                while ((m = callRe.exec(text)) !== null) {
                    const start = new vscode.Position(i, m.index + 1);
                    const end = new vscode.Position(i, m.index + 1 + oldName.length);
                    edit.replace(doc.uri, new vscode.Range(start, end), targetName);
                }
            }
        };

        // current document
        applyDoc(document);

        for (const file of files) {
            if (token.isCancellationRequested) break;
            if (file.toString() === document.uri.toString()) continue;
            try {
                const doc = await vscode.workspace.openTextDocument(file);
                applyDoc(doc);
            } catch {
                // ignore
            }
        }
        return edit;
    }
}

