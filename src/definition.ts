import * as vscode from 'vscode';

const PML_GLOB = '**/*.{pml,pmlobj,pmlfnc,pmlfrm,pmlmac,pmlcmd}';

export class PMLDefinitionProvider implements vscode.DefinitionProvider {
    async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition | undefined> {
        const range = document.getWordRangeAtPosition(position, /\.?[a-zA-Z_][a-zA-Z0-9_]*/);
        if (!range) return undefined;
        const word = document.getText(range);
        const name = word.startsWith('.') ? word.substring(1) : word;

        // 1) Search in current document first
        const defRange = this.findMethodDefinitionInDocument(document, name);
        if (defRange) {
            return new vscode.Location(document.uri, defRange.start);
        }

        // 2) Search workspace
        const files = await vscode.workspace.findFiles(PML_GLOB, undefined, 200);
        for (const file of files) {
            if (token.isCancellationRequested) return undefined;
            try {
                const textDoc = await vscode.workspace.openTextDocument(file);
                const r = this.findMethodDefinitionInDocument(textDoc, name);
                if (r) {
                    return new vscode.Location(file, r.start);
                }
            } catch {
                // ignore
            }
        }
        return undefined;
    }

    private findMethodDefinitionInDocument(document: vscode.TextDocument, methodName: string): vscode.Range | undefined {
        const regex = new RegExp(`^\\s*define\\s+method\\s+\\.${methodName}\\s*\\(`, 'i');
        for (let i = 0; i < document.lineCount; i++) {
            const text = document.lineAt(i).text;
            if (regex.test(text)) {
                return new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, text.length));
            }
        }
        return undefined;
    }
}

