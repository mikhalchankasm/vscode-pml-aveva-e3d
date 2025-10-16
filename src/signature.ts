import * as vscode from 'vscode';
import { ALL_TYPE_METHODS } from './pmlTypes';

export class PMLSignatureHelpProvider implements vscode.SignatureHelpProvider {
    provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.SignatureHelp> {
        const lineText = document.lineAt(position).text.substring(0, position.character);
        const callMatch = /\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)?$/.exec(lineText);
        if (!callMatch) return undefined;
        const methodName = callMatch[1];

        const candidates = Object.entries(ALL_TYPE_METHODS).flatMap(([type, methods]) =>
            methods.filter(m => m.name.toLowerCase() === methodName.toLowerCase()).map(m => ({ type, m }))
        );
        if (candidates.length === 0) return undefined;

        const help = new vscode.SignatureHelp();
        help.signatures = candidates.map(({ type, m }) => {
            const label = `.${m.name}(${m.params.join(', ')}) : ${m.returnType} [${type}]`;
            const sig = new vscode.SignatureInformation(label, m.description);
            sig.parameters = m.params.map(p => new vscode.ParameterInformation(p));
            return sig;
        });
        help.activeSignature = 0;
        help.activeParameter = this.countParams(callMatch[2] || '');
        return help;
    }

    private countParams(argText: string): number {
        // naive: count commas not inside strings
        let count = 0; let inStr = false; let quote: string | null = null;
        for (const ch of argText) {
            if ((ch === '"' || ch === "'") && !inStr) { inStr = true; quote = ch; continue; }
            if (inStr && ch === quote) { inStr = false; quote = null; continue; }
            if (!inStr && ch === ',') count++;
        }
        return Math.min(count, Math.max(0, 100));
    }
}

