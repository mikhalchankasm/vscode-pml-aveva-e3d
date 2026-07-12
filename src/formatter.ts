import * as vscode from 'vscode';
import { alignAssignmentsText } from './formatterCore';

export class PMLFormatter implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        _token: vscode.CancellationToken
    ): vscode.TextEdit[] {
        const config = vscode.workspace.getConfiguration('pml.formatter');
        const removeMultipleEmptyLines = config.get<boolean>('removeMultipleEmptyLines', true);
        const formatMethodBlocks = config.get<boolean>('formatMethodBlocks', true);
        const formatFormBlocks = config.get<boolean>('formatFormBlocks', true);
        const alignAssignments = config.get<boolean>('alignAssignments', true);
        const fixIndentation = config.get<boolean>('fixIndentation', true);
        const indentSize = config.get<number>('indentSize', options.tabSize || 4);

        const text = document.getText();
        let formattedText = text;

        // Detect original EOL style (CRLF or LF)
        const hasCRLF = text.includes('\r\n');
        const eol = hasCRLF ? '\r\n' : '\n';

        // 0. Fix basic indentation
        if (fixIndentation) {
            formattedText = this.fixIndentation(formattedText, indentSize, eol);
        }

        // 1. Remove multiple empty lines
        if (removeMultipleEmptyLines) {
            formattedText = this.removeMultipleEmptyLines(formattedText, eol);
        }

        // 2. Format method blocks
        if (formatMethodBlocks) {
            formattedText = this.formatMethodBlocks(formattedText, eol);
        }

        // 3. Format form/frame blocks
        if (formatFormBlocks) {
            formattedText = this.formatFormBlocks(formattedText, eol);
        }

        // 4. Align assignments (= in same column)
        if (alignAssignments) {
            formattedText = this.alignAssignments(formattedText, eol);
        }

        // Replace the entire document.
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
        );

        return [vscode.TextEdit.replace(fullRange, formattedText)];
    }

    /**
     * Fix basic indentation in code
     */
    private fixIndentation(text: string, indentSize: number, eol: string = '\n'): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        let currentIndent = 0;
        const ifStack: number[] = []; // Indentation levels for if blocks.
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Preserve blank lines.
            if (trimmed === '') {
                result.push('');
                continue;
            }
            
            // Preserve comments at the current indentation level.
            if (trimmed.startsWith('--') || trimmed.startsWith('$*')) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // PML control-flow statements that do not change indentation.
            if (/^(skip\s+if\s*\(|break\b|continue\b|return\b)/i.test(trimmed)) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // exit closes a frame or form block.
            if (/^exit\b/i.test(trimmed)) {
                currentIndent = Math.max(0, currentIndent - 1);
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // frame starts a new block.
            if (/^frame\b/i.test(trimmed)) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                currentIndent++;
                continue;
            }
            
            // endif closes an if block.
            if (/^endif\b/i.test(trimmed)) {
                currentIndent = Math.max(0, currentIndent - 1);
                if (ifStack.length > 0) {
                    ifStack.pop();
                }
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // endmethod, endobject, enddo, and endhandle close blocks.
            if (/^(endmethod|endobject|enddo|endhandle)\b/i.test(trimmed)) {
                currentIndent = Math.max(0, currentIndent - 1);
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // elseif, else, and elsehandle stay at the parent if level.
            if (/^(elseif|else|elsehandle)\b/i.test(trimmed)) {
                // Restore the parent if indentation level from the stack.
                const ifLevel = ifStack.length > 0 ? ifStack[ifStack.length - 1] : currentIndent - 1;
                currentIndent = ifLevel;
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                // Indent the elseif or else body.
                currentIndent++;
                continue;
            }
            
            // if/then starts an if block.
            if (/^(if|then)\b/i.test(trimmed)) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                ifStack.push(currentIndent); // Remember the parent if level.
                currentIndent++;
                continue;
            }
            
            // define method/object, setup/layout form, do, and handle open blocks.
            if (/^(define\s+(method|object)|setup\s+form|layout\s+form|do\b|handle\b)/i.test(trimmed)) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                currentIndent++;
                continue;
            }
            
            // Regular line
            result.push(' '.repeat(currentIndent * indentSize) + trimmed);
        }

        return result.join(eol);
    }

    /**
     * Remove multiple empty lines (keep max one)
     */
    private removeMultipleEmptyLines(text: string, eol: string = '\n'): string {
        // Replace 3+ consecutive line breaks with 2
        return text.replace(/(\r?\n){3,}/g, eol + eol);
    }

    /**
     * Format define method ... endmethod blocks
     * - Remove extra lines before endmethod
     * - Add empty line after define method if none
     */
    private formatMethodBlocks(text: string, eol: string = '\n'): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        let inMethod = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Method start.
            if (/^define\s+method/i.test(trimmed)) {
                inMethod = true;
                // Store method indentation for future use if needed
                // const methodIndent = line.length - line.trimStart().length;
                result.push(line);

                // Insert a blank line after the method declaration when needed.
                if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
                    result.push('');
                }
                continue;
            }

            // Method end.
            if (/^endmethod/i.test(trimmed) && inMethod) {
                // Remove blank lines before endmethod.
                while (result.length > 0 && result[result.length - 1].trim() === '') {
                    result.pop();
                }
                result.push('');
                result.push(line);
                inMethod = false;
                continue;
            }

            result.push(line);
        }

        return result.join(eol);
    }

    /**
     * Format setup form ... exit and frame ... exit blocks
     * - Add empty line before exit if none
     */
    private formatFormBlocks(text: string, eol: string = '\n'): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        let inFormBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Form or frame block start.
            if (/^(setup\s+form|frame)/i.test(trimmed)) {
                inFormBlock = true;
                result.push(line);
                continue;
            }

            // Form or frame block end.
            if (/^exit/i.test(trimmed) && inFormBlock) {
                // Insert a blank line before exit when needed.
                if (result.length > 0 && result[result.length - 1].trim() !== '') {
                    result.push('');
                }
                result.push(line);
                inFormBlock = false;
                continue;
            }

            result.push(line);
        }

        return result.join(eol);
    }

    /**
     * Align assignments (= in same column)
     * Find groups of consecutive lines with = and align them
     */
    private alignAssignments(text: string, eol: string = '\n'): string {
        return alignAssignmentsText(text, eol);
    }
}


