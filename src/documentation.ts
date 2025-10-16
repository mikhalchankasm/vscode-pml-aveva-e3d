import * as vscode from 'vscode';

/**
 * JSDoc-style documentation model for PML methods
 */
export interface MethodDocumentation {
    description: string;
    params: Array<{ name: string; description: string }>;
    returnValue?: string;
    examples: string[];
    deprecated?: string;
    author?: string;
    since?: string;
    see?: string[];
    form?: string;
    callback?: string;
}

export class PMLDocumentationParser {
    /** Extract leading line comments above a method definition */
    static getMethodDocumentation(document: vscode.TextDocument, methodLine: number): MethodDocumentation | undefined {
        const commentLines: string[] = [];
        for (let i = methodLine - 1; i >= 0; i--) {
            const text = document.lineAt(i).text;
            const trimmed = text.trim();
            if (trimmed === '') continue; // skip empty lines
            if (trimmed.startsWith('--')) {
                commentLines.unshift(trimmed.substring(2).trim());
            } else {
                break; // stop at first non-comment
            }
        }
        if (commentLines.length === 0) return undefined;
        return this.parseDocComments(commentLines);
    }

    /** Parse doc-comment lines into documentation model */
    private static parseDocComments(lines: string[]): MethodDocumentation {
        const doc: MethodDocumentation = { description: '', params: [], examples: [], see: [] };
        let current: 'description' | 'other' = 'description';
        const desc: string[] = [];

        for (const raw of lines) {
            const line = raw.trim();
            if (line.startsWith('@param')) {
                current = 'other';
                const m = line.match(/@param\s+(!{1,2}\w+)\s*-?\s*(.*)$/);
                if (m) doc.params.push({ name: m[1], description: m[2] });
            } else if (line.startsWith('@return')) {
                current = 'other';
                doc.returnValue = line.substring(7).trim();
            } else if (line.startsWith('@example')) {
                current = 'other';
                doc.examples.push(line.substring(8).trim());
            } else if (line.startsWith('@deprecated')) {
                current = 'other';
                doc.deprecated = line.substring(11).trim();
            } else if (line.startsWith('@author')) {
                current = 'other';
                doc.author = line.substring(7).trim();
            } else if (line.startsWith('@since')) {
                current = 'other';
                doc.since = line.substring(6).trim();
            } else if (line.startsWith('@see')) {
                current = 'other';
                (doc.see ??= []).push(line.substring(4).trim());
            } else if (line.startsWith('@form')) {
                current = 'other';
                doc.form = line.substring(5).trim();
            } else if (line.startsWith('@callback')) {
                current = 'other';
                doc.callback = line.substring(9).trim();
            } else {
                if (current === 'description') desc.push(line);
            }
        }
        doc.description = desc.join('\n');
        return doc;
    }

    /** Render documentation as MarkdownString for hover */
    static formatAsMarkdown(methodName: string, doc: MethodDocumentation): vscode.MarkdownString {
        const md = new vscode.MarkdownString();
        md.appendCodeblock(`define method ${methodName}()`, 'pml');
        if (doc.description) md.appendMarkdown('\n' + doc.description + '\n');
        if (doc.deprecated) md.appendMarkdown('\n**Deprecated:** ' + doc.deprecated + '\n');
        if (doc.params.length > 0) {
            md.appendMarkdown('\n**Parameters:**\n');
            for (const p of doc.params) md.appendMarkdown(`- \`${p.name}\` - ${p.description}\n`);
        }
        if (doc.returnValue) md.appendMarkdown('\n**Returns:** ' + doc.returnValue + '\n');
        if (doc.examples.length > 0) {
            md.appendMarkdown('\n**Examples:**\n');
            for (const ex of doc.examples) md.appendCodeblock(ex, 'pml');
        }
        if (doc.form) md.appendMarkdown(`\n**Form:** \`${doc.form}\`\n`);
        if (doc.callback) md.appendMarkdown(`\n**Callback:** \`${doc.callback}\`\n`);
        if (doc.author) md.appendMarkdown(`\n*Author: ${doc.author}*\n`);
        if (doc.since) md.appendMarkdown(`\n*Since: ${doc.since}*\n`);
        if (doc.see && doc.see.length > 0) md.appendMarkdown('\n**See also:** ' + doc.see.join(', ') + '\n');
        md.isTrusted = true;
        return md;
    }
}

