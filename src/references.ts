import * as vscode from 'vscode';

const PML_GLOB = '**/*.{pml,pmlobj,pmlfnc,pmlfrm,pmlmac,pmlcmd}';

export class PMLReferenceProvider implements vscode.ReferenceProvider {
    async provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): Promise<vscode.Location[]> {
        const range = document.getWordRangeAtPosition(position, /\.?[a-zA-Z_][a-zA-Z0-9_]*/);
        if (!range) return [];
        const word = document.getText(range);
        const name = word.startsWith('.') ? word.substring(1) : word;

        const locs: vscode.Location[] = [];

        // include current document
        this.collectReferencesInDocument(document, name, locs);

        // scan workspace
        const files = await vscode.workspace.findFiles(PML_GLOB, undefined, 500);
        for (const file of files) {
            if (token.isCancellationRequested) break;
            if (file.toString() === document.uri.toString()) continue;
            try {
                const textDoc = await vscode.workspace.openTextDocument(file);
                this.collectReferencesInDocument(textDoc, name, locs);
            } catch {
                // ignore
            }
        }
        return locs;
    }

    private collectReferencesInDocument(doc: vscode.TextDocument, methodName: string, out: vscode.Location[]) {
        const callRe = new RegExp(`\\.${methodName}\\s*\\(`, 'g');
        const defRe = new RegExp(`^\\s*define\\s+method\\s+\\.${methodName}\\s*\\(`, 'i');

        for (let i = 0; i < doc.lineCount; i++) {
            const text = doc.lineAt(i).text;
            if (defRe.test(text)) {
                out.push(new vscode.Location(doc.uri, new vscode.Position(i, text.indexOf('.') >= 0 ? text.indexOf('.') : 0)));
                continue;
            }
            let m: RegExpExecArray | null;
            while ((m = callRe.exec(text)) !== null) {
                out.push(new vscode.Location(doc.uri, new vscode.Position(i, m.index + 1)));
            }
        }
    }
}

