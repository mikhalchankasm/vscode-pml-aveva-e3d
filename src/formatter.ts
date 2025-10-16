import * as vscode from 'vscode';

export class PMLFormatter implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
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

        // 0. ╨Ш╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╨╡ ╨▒╨░╨╖╨╛╨▓╤Л╤Е ╨╛╤В╤Б╤В╤Г╨┐╨╛╨▓
        if (fixIndentation) {
            formattedText = this.fixIndentation(formattedText, indentSize);
        }

        // 1. ╨г╨┤╨░╨╗╨╡╨╜╨╕╨╡ ╨╝╨╜╨╛╨╢╨╡╤Б╤В╨▓╨╡╨╜╨╜╤Л╤Е ╨┐╤Г╤Б╤В╤Л╤Е ╤Б╤В╤А╨╛╨║
        if (removeMultipleEmptyLines) {
            formattedText = this.removeMultipleEmptyLines(formattedText);
        }

        // 2. ╨д╨╛╤А╨╝╨░╤В╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡ ╨▒╨╗╨╛╨║╨╛╨▓ method
        if (formatMethodBlocks) {
            formattedText = this.formatMethodBlocks(formattedText);
        }

        // 3. ╨д╨╛╤А╨╝╨░╤В╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡ ╨▒╨╗╨╛╨║╨╛╨▓ form/frame
        if (formatFormBlocks) {
            formattedText = this.formatFormBlocks(formattedText);
        }

        // 4. ╨Т╤Л╤А╨░╨▓╨╜╨╕╨▓╨░╨╜╨╕╨╡ ╨┐╤А╨╕╤Б╨▓╨░╨╕╨▓╨░╨╜╨╕╨╣ (= ╨▓ ╨╛╨┤╨╜╤Г ╨╗╨╕╨╜╨╕╤О)
        if (alignAssignments) {
            formattedText = this.alignAssignments(formattedText);
        }

        // ╨Т╨╛╨╖╨▓╤А╨░╤Й╨░╨╡╨╝ ╨╖╨░╨╝╨╡╨╜╤Г ╨▓╤Б╨╡╨│╨╛ ╨┤╨╛╨║╤Г╨╝╨╡╨╜╤В╨░
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
        );

        return [vscode.TextEdit.replace(fullRange, formattedText)];
    }

    /**
     * ╨Ш╤Б╨┐╤А╨░╨▓╨╗╤П╨╡╤В ╨▒╨░╨╖╨╛╨▓╤Л╨╡ ╨╛╤В╤Б╤В╤Г╨┐╤Л ╨▓ ╨║╨╛╨┤╨╡
     */
    private fixIndentation(text: string, indentSize: number): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        let currentIndent = 0;
        
        // ╨Ъ╨╗╤О╤З╨╡╨▓╤Л╨╡ ╤Б╨╗╨╛╨▓╨░, ╨║╨╛╤В╨╛╤А╤Л╨╡ ╤Г╨▓╨╡╨╗╨╕╤З╨╕╨▓╨░╤О╤В ╨╛╤В╤Б╤В╤Г╨┐
        const increaseIndentKeywords = [
            /^define\s+(method|object)/i,
            /^setup\s+form/i,
            /^layout\s+form/i,
            /^if\b/i,
            /^then\b/i,
            /^do\b/i,
            /^handle\b/i
        ];
        
        // ╨Ъ╨╗╤О╤З╨╡╨▓╤Л╨╡ ╤Б╨╗╨╛╨▓╨░, ╨║╨╛╤В╨╛╤А╤Л╨╡ ╤Г╨╝╨╡╨╜╤М╤И╨░╤О╤В ╨╛╤В╤Б╤В╤Г╨┐ (╨╖╨░╨║╤А╤Л╨▓╨░╤О╤Й╨╕╨╡ ╨▒╨╗╨╛╨║╨╕)
        const decreaseIndentKeywords = [
            /^endmethod\b/i,
            /^endobject\b/i,
            /^endif\b/i,
            /^enddo\b/i,
            /^endhandle\b/i
        ];
        
        // ╨Ъ╨╗╤О╤З╨╡╨▓╤Л╨╡ ╤Б╨╗╨╛╨▓╨░, ╨║╨╛╤В╨╛╤А╤Л╨╡ ╨┤╨╛╨╗╨╢╨╜╤Л ╨▒╤Л╤В╤М ╨╜╨░ ╤В╨╛╨╝ ╨╢╨╡ ╤Г╤А╨╛╨▓╨╜╨╡ ╤З╤В╨╛ ╨╕ ╤Б╨╛╨┤╨╡╤А╨╢╨╕╨╝╨╛╨╡ ╨▒╨╗╨╛╨║╨░
        const sameLevelKeywords = [
            /^exit\b/i
        ];
        
        // ╨Ъ╨╗╤О╤З╨╡╨▓╤Л╨╡ ╤Б╨╗╨╛╨▓╨░, ╨║╨╛╤В╨╛╤А╤Л╨╡ ╤Г╨╝╨╡╨╜╤М╤И╨░╤О╤В ╨╛╤В╤Б╤В╤Г╨┐ ╨┤╨╗╤П ╤Б╨╡╨▒╤П, ╨╜╨╛ ╨╜╨╡ ╨┤╨╗╤П ╤Б╨╗╨╡╨┤╤Г╤О╤Й╨╕╤Е
        // (else/elseif/elsehandle ╨┤╨╛╨╗╨╢╨╜╤Л ╨▒╤Л╤В╤М ╨╜╨░ ╤В╨╛╨╝ ╨╢╨╡ ╤Г╤А╨╛╨▓╨╜╨╡ ╤З╤В╨╛ ╨╕ if)
        const sameLineDecreaseKeywords = [
            /^else\b/i,
            /^elseif\b/i,
            /^elsehandle\b/i
        ];
        
        // ╨Ъ╨╗╤О╤З╨╡╨▓╤Л╨╡ ╤Б╨╗╨╛╨▓╨░, ╨║╨╛╤В╨╛╤А╤Л╨╡ ╤Г╨▓╨╡╨╗╨╕╤З╨╕╨▓╨░╤О╤В ╨╛╤В╤Б╤В╤Г╨┐ ╨┐╨╛╤Б╨╗╨╡ ╤Б╨╡╨▒╤П (╨╜╨╛ ╨╜╨╡ ╨┤╨╗╤П ╤Б╨╡╨▒╤П)
        const increaseAfterKeywords = [
            /^else\b/i,
            /^elseif\b/i,
            /^elsehandle\b/i
        ];
        
        // ╨б╨┐╨╡╤Ж╨╕╨░╨╗╤М╨╜╤Л╨╡ ╨║╨╛╨╜╤Б╤В╤А╤Г╨║╤Ж╨╕╨╕ PML (╨╜╨╡ ╨╕╨╖╨╝╨╡╨╜╤П╤О╤В ╨╛╤В╤Б╤В╤Г╨┐)
        const specialKeywords = [
            /^skip\s+if\s*\(/i,
            /^break\b/i,
            /^continue\b/i,
            /^return\b/i
        ];
        
        // ╨Ъ╨╗╤О╤З╨╡╨▓╤Л╨╡ ╤Б╨╗╨╛╨▓╨░, ╨║╨╛╤В╨╛╤А╤Л╨╡ ╨┤╨╛╨╗╨╢╨╜╤Л ╨▒╤Л╤В╤М ╨╜╨░ ╤В╨╛╨╝ ╨╢╨╡ ╤Г╤А╨╛╨▓╨╜╨╡ ╤З╤В╨╛ ╨╕ ╨┐╤А╨╡╨┤╤Л╨┤╤Г╤Й╨╕╨╣ frame
        const frameLevelKeywords = [
            /^frame\b/i
        ];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // ╨Я╤Г╤Б╤В╤Л╨╡ ╤Б╤В╤А╨╛╨║╨╕ ╨╛╤Б╤В╨░╨▓╨╗╤П╨╡╨╝ ╨║╨░╨║ ╨╡╤Б╤В╤М
            if (trimmed === '') {
                result.push('');
                continue;
            }
            
            // ╨Ъ╨╛╨╝╨╝╨╡╨╜╤В╨░╤А╨╕╨╕ ╤Б╨╛╤Е╤А╨░╨╜╤П╨╡╨╝ ╤Б ╤В╨╡╨║╤Г╤Й╨╕╨╝ ╨╛╤В╤Б╤В╤Г╨┐╨╛╨╝
            if (trimmed.startsWith('--') || trimmed.startsWith('$*')) {
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // ╨б╨┐╨╡╤Ж╨╕╨░╨╗╤М╨╜╤Л╨╡ ╨║╨╛╨╜╤Б╤В╤А╤Г╨║╤Ж╨╕╨╕ PML (skip if, break, continue, return)
            let isSpecialKeyword = false;
            for (const pattern of specialKeywords) {
                if (pattern.test(trimmed)) {
                    isSpecialKeyword = true;
                    break;
                }
            }
            
            if (isSpecialKeyword) {
                // ╨б╨┐╨╡╤Ж╨╕╨░╨╗╤М╨╜╤Л╨╡ ╨║╨╛╨╜╤Б╤В╤А╤Г╨║╤Ж╨╕╨╕ ╨┐╨╛╨╗╤Г╤З╨░╤О╤В ╤В╨╡╨║╤Г╤Й╨╕╨╣ ╨╛╤В╤Б╤В╤Г╨┐, ╨╜╨╛ ╨╜╨╡ ╨╕╨╖╨╝╨╡╨╜╤П╤О╤В ╨╡╨│╨╛
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ exit - ╨┤╨╛╨╗╨╢╨╡╨╜ ╨╖╨░╨║╤А╤Л╨▓╨░╤В╤М frame
            let isExitKeyword = false;
            for (const pattern of sameLevelKeywords) {
                if (pattern.test(trimmed)) {
                    isExitKeyword = true;
                    break;
                }
            }
            
            if (isExitKeyword) {
                // exit ╨╖╨░╨║╤А╤Л╨▓╨░╨╡╤В ╤В╨╡╨║╤Г╤Й╨╕╨╣ ╨▒╨╗╨╛╨║ (frame ╨╕╨╗╨╕ form)
                // exit ╨┤╨╛╨╗╨╢╨╡╨╜ ╨▒╤Л╤В╤М ╨╜╨░ ╤Г╤А╨╛╨▓╨╜╨╡ ╨▒╨╗╨╛╨║╨░ (frame/form), ╨░ ╨╜╨╡ ╤Б╨╛╨┤╨╡╤А╨╢╨╕╨╝╨╛╨│╨╛
                // ╨б╨╜╨░╤З╨░╨╗╨░ ╤Г╨╝╨╡╨╜╤М╤И╨░╨╡╨╝ ╨╛╤В╤Б╤В╤Г╨┐, ╨╖╨░╤В╨╡╨╝ ╨┤╨╛╨▒╨░╨▓╨╗╤П╨╡╨╝ ╤Б╤В╤А╨╛╨║╤Г
                currentIndent = Math.max(0, currentIndent - 1);
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                continue;
            }
            
            // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ frame - ╨╝╨╛╨╢╨╡╤В ╨▒╤Л╤В╤М ╨▓╨╜╤Г╤В╤А╨╕ form ╨╕╨╗╨╕ ╨┐╨╛╤Б╨╗╨╡ ╨┤╤А╤Г╨│╨╛╨│╨╛ frame
            let isFrameKeyword = false;
            for (const pattern of frameLevelKeywords) {
                if (pattern.test(trimmed)) {
                    isFrameKeyword = true;
                    break;
                }
            }
            
            if (isFrameKeyword) {
                // frame ╨┐╨╛╨╗╤Г╤З╨░╨╡╤В ╤В╨╡╨║╤Г╤Й╨╕╨╣ ╨╛╤В╤Б╤В╤Г╨┐ ╨╕ ╤Г╨▓╨╡╨╗╨╕╤З╨╕╨▓╨░╨╡╤В ╨╡╨│╨╛ ╨┤╨╗╤П ╤Б╨╛╨┤╨╡╤А╨╢╨╕╨╝╨╛╨│╨╛
                result.push(' '.repeat(currentIndent * indentSize) + trimmed);
                currentIndent++;
                continue;
            }
            
            // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╤Г╨╝╨╡╨╜╤М╤И╨╡╨╜╨╕╨╡ ╨╛╤В╤Б╤В╤Г╨┐╨░ ╨┐╨╡╤А╨╡╨┤ ╤Б╤В╤А╨╛╨║╨╛╨╣
            let decreaseBeforeLine = false;
            for (const pattern of decreaseIndentKeywords) {
                if (pattern.test(trimmed)) {
                    decreaseBeforeLine = true;
                    break;
                }
            }
            
            // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ else/elseif/elsehandle (╤Г╨╝╨╡╨╜╤М╤И╨░╤О╤В ╨┤╨╗╤П ╤Б╨╡╨▒╤П)
            let sameLevelDecrease = false;
            for (const pattern of sameLineDecreaseKeywords) {
                if (pattern.test(trimmed)) {
                    sameLevelDecrease = true;
                    break;
                }
            }
            
            // ╨Я╤А╨╕╨╝╨╡╨╜╤П╨╡╨╝ ╨╛╤В╤Б╤В╤Г╨┐
            let lineIndent = currentIndent;
            if (decreaseBeforeLine) {
                lineIndent = Math.max(0, currentIndent - 1);
                currentIndent = lineIndent;
            } else if (sameLevelDecrease) {
                // else/elseif/elsehandle получают отступ на 1 меньше (уровень if)
                // НЕ изменяем currentIndent - он будет увеличен в increaseAfterKeywords
                lineIndent = Math.max(0, currentIndent - 1);
            }
            
            // ╨Ф╨╛╨▒╨░╨▓╨╗╤П╨╡╨╝ ╤Б╤В╤А╨╛╨║╤Г ╤Б ╨┐╤А╨░╨▓╨╕╨╗╤М╨╜╤Л╨╝ ╨╛╤В╤Б╤В╤Г╨┐╨╛╨╝
            result.push(' '.repeat(lineIndent * indentSize) + trimmed);
            
            // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╤Г╨▓╨╡╨╗╨╕╤З╨╡╨╜╨╕╨╡ ╨╛╤В╤Б╤В╤Г╨┐╨░ ╨┐╨╛╤Б╨╗╨╡ ╤Б╤В╤А╨╛╨║╨╕
            for (const pattern of increaseIndentKeywords) {
                if (pattern.test(trimmed)) {
                    currentIndent++;
                    break;
                }
            }
            
            // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╤Г╨▓╨╡╨╗╨╕╤З╨╡╨╜╨╕╨╡ ╨╛╤В╤Б╤В╤Г╨┐╨░ ╨┐╨╛╤Б╨╗╨╡ else/elseif/elsehandle
            for (const pattern of increaseAfterKeywords) {
                if (pattern.test(trimmed)) {
                    currentIndent++;
                    break;
                }
            }
            
            // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╤Г╨╝╨╡╨╜╤М╤И╨╡╨╜╨╕╨╡ ╨╛╤В╤Б╤В╤Г╨┐╨░ ╨┐╨╛╤Б╨╗╨╡ ╤Б╤В╤А╨╛╨║╨╕ (endif, endmethod, etc.)
            for (const pattern of decreaseIndentKeywords) {
                if (pattern.test(trimmed)) {
                    currentIndent = Math.max(0, currentIndent - 1);
                    break;
                }
            }
        }
        
        return result.join('\n');
    }

    /**
     * ╨г╨┤╨░╨╗╤П╨╡╤В ╨╝╨╜╨╛╨╢╨╡╤Б╤В╨▓╨╡╨╜╨╜╤Л╨╡ ╨┐╤Г╤Б╤В╤Л╨╡ ╤Б╤В╤А╨╛╨║╨╕ (╨╛╤Б╤В╨░╨▓╨╗╤П╨╡╤В ╨╝╨░╨║╤Б╨╕╨╝╤Г╨╝ ╨╛╨┤╨╜╤Г)
     */
    private removeMultipleEmptyLines(text: string): string {
        return text.replace(/(\r?\n){3,}/g, '\n\n');
    }

    /**
     * ╨д╨╛╤А╨╝╨░╤В╨╕╤А╤Г╨╡╤В ╨▒╨╗╨╛╨║╨╕ define method ... endmethod
     * ╨Ы╨╛╨│╨╕╨║╨░ ╨╕╨╖ Python ╨║╨╛╨┤╨░:
     * - ╨г╨┤╨░╨╗╤П╨╡╤В ╨╗╨╕╤И╨╜╨╕╨╡ ╤Б╤В╤А╨╛╨║╨╕ ╨┐╨╡╤А╨╡╨┤ endmethod
     * - ╨Ф╨╛╨▒╨░╨▓╨╗╤П╨╡╤В ╨┐╤Г╤Б╤В╤Г╤О ╤Б╤В╤А╨╛╨║╤Г ╨┐╨╛╤Б╨╗╨╡ define method ╨╡╤Б╨╗╨╕ ╨╡╤С ╨╜╨╡╤В
     */
    private formatMethodBlocks(text: string): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        let inMethod = false;
        let methodIndent = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // ╨Э╨░╤З╨░╨╗╨╛ ╨╝╨╡╤В╨╛╨┤╨░
            if (/^define\s+method/i.test(trimmed)) {
                inMethod = true;
                methodIndent = line.length - line.trimStart().length;
                result.push(line);

                // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╤Б╨╗╨╡╨┤╤Г╤О╤Й╤Г╤О ╤Б╤В╤А╨╛╨║╤Г - ╨╡╤Б╨╗╨╕ ╨╜╨╡ ╨┐╤Г╤Б╤В╨░╤П, ╨┤╨╛╨▒╨░╨▓╨╗╤П╨╡╨╝ ╨┐╤Г╤Б╤В╤Г╤О
                if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
                    result.push('');
                }
                continue;
            }

            // ╨Ъ╨╛╨╜╨╡╤Ж ╨╝╨╡╤В╨╛╨┤╨░
            if (/^endmethod/i.test(trimmed) && inMethod) {
                // ╨г╨┤╨░╨╗╤П╨╡╨╝ ╨┐╤Г╤Б╤В╤Л╨╡ ╤Б╤В╤А╨╛╨║╨╕ ╨┐╨╡╤А╨╡╨┤ endmethod
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

        return result.join('\n');
    }

    /**
     * ╨д╨╛╤А╨╝╨░╤В╨╕╤А╤Г╨╡╤В ╨▒╨╗╨╛╨║╨╕ setup form ... exit ╨╕ frame ... exit
     * ╨Ы╨╛╨│╨╕╨║╨░ ╨╕╨╖ Python ╨║╨╛╨┤╨░:
     * - ╨Ф╨╛╨▒╨░╨▓╨╗╤П╨╡╤В ╨┐╤Г╤Б╤В╤Г╤О ╤Б╤В╤А╨╛╨║╤Г ╨┐╨╡╤А╨╡╨┤ exit ╨╡╤Б╨╗╨╕ ╨╡╤С ╨╜╨╡╤В
     */
    private formatFormBlocks(text: string): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        let inFormBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // ╨Э╨░╤З╨░╨╗╨╛ form/frame ╨▒╨╗╨╛╨║╨░
            if (/^(setup\s+form|frame)/i.test(trimmed)) {
                inFormBlock = true;
                result.push(line);
                continue;
            }

            // ╨Ъ╨╛╨╜╨╡╤Ж form/frame ╨▒╨╗╨╛╨║╨░
            if (/^exit/i.test(trimmed) && inFormBlock) {
                // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╨┐╤А╨╡╨┤╤Л╨┤╤Г╤Й╤Г╤О ╤Б╤В╤А╨╛╨║╤Г - ╨╡╤Б╨╗╨╕ ╨╜╨╡ ╨┐╤Г╤Б╤В╨░╤П, ╨┤╨╛╨▒╨░╨▓╨╗╤П╨╡╨╝ ╨┐╤Г╤Б╤В╤Г╤О
                if (result.length > 0 && result[result.length - 1].trim() !== '') {
                    result.push('');
                }
                result.push(line);
                inFormBlock = false;
                continue;
            }

            result.push(line);
        }

        return result.join('\n');
    }

    /**
     * ╨Т╤Л╤А╨░╨▓╨╜╨╕╨▓╨░╨╜╨╕╨╡ ╨┐╤А╨╕╤Б╨▓╨░╨╕╨▓╨░╨╜╨╕╨╣ (= ╨▓ ╨╛╨┤╨╜╤Г ╨╗╨╕╨╜╨╕╤О)
     * ╨Э╨░╤Е╨╛╨┤╨╕╤В ╨│╤А╤Г╨┐╨┐╤Л ╤Б╤В╤А╨╛╨║ ╨┐╨╛╨┤╤А╤П╨┤ ╤Б = ╨╕ ╨▓╤Л╤А╨░╨▓╨╜╨╕╨▓╨░╨╡╤В ╨╕╤Е
     */
    private alignAssignments(text: string): string {
        const lines = text.split(/\r?\n/);
        const result: string[] = [];
        
        let assignmentGroup: Array<{ index: number; line: string; indent: string; before: string; after: string }> = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // ╨Я╤А╨╛╨┐╤Г╤Б╨║╨░╨╡╨╝ ╨║╨╛╨╝╨╝╨╡╨╜╤В╨░╤А╨╕╨╕ ╨╕ ╨┐╤Г╤Б╤В╤Л╨╡ ╤Б╤В╤А╨╛╨║╨╕
            if (trimmed === '' || trimmed.startsWith('--') || trimmed.startsWith('$*')) {
                // ╨Х╤Б╨╗╨╕ ╨▒╤Л╨╗╨░ ╨│╤А╤Г╨┐╨┐╨░ ╨┐╤А╨╕╤Б╨▓╨░╨╕╨▓╨░╨╜╨╕╨╣ - ╨╛╨▒╤А╨░╨▒╨╛╤В╨░╤В╤М ╨╡╤С
                if (assignmentGroup.length >= 2) {
                    result.push(...this.processAssignmentGroup(assignmentGroup));
                } else if (assignmentGroup.length > 0) {
                    // ╨Х╤Б╨╗╨╕ ╨│╤А╤Г╨┐╨┐╨░ ╨╝╨╡╨╜╤М╤И╨╡ 2 - ╨┤╨╛╨▒╨░╨▓╨╕╤В╤М ╤Б╤В╤А╨╛╨║╨╕ ╨║╨░╨║ ╨╡╤Б╤В╤М
                    result.push(...assignmentGroup.map(g => g.line));
                }
                assignmentGroup = [];
                result.push(line);
                continue;
            }
            
            // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╨╡╤Б╤В╤М ╨╗╨╕ ╨┐╤А╨╕╤Б╨▓╨░╨╕╨▓╨░╨╜╨╕╨╡ (╤В╨╛╨╗╤М╨║╨╛ ╨╛╨┤╨╕╨╜ ╨╖╨╜╨░╨║ =)
            // ╨Ш╤Б╨║╨╗╤О╤З╨░╨╡╨╝ ╨╛╨┐╨╡╤А╨░╤В╨╛╤А╤Л ╤Б╤А╨░╨▓╨╜╨╡╨╜╨╕╤П (==, !=, >=, <=)
            const assignmentMatch = line.match(/^(\s*)([^=]*?)(\s*)(=)(\s*)(.*)$/);
            
            if (assignmentMatch) {
                const [, indent, before, , , , after] = assignmentMatch;
                
                // ╨Я╤А╨╛╨▓╨╡╤А╤П╨╡╨╝ ╤З╤В╨╛ ╤Н╤В╨╛ ╨╜╨╡ ╨╛╨┐╨╡╤А╨░╤В╨╛╤А ╤Б╤А╨░╨▓╨╜╨╡╨╜╨╕╤П
                const beforeTrimmed = before.trim();
                const afterTrimmed = after.trim();
                
                // ╨Х╤Б╨╗╨╕ ╨┐╨╛╤Б╨╗╨╡ = ╨╕╨┤╨╡╤В ╨╡╤Й╨╡ =, ╤В╨╛ ╤Н╤В╨╛ == (╨┐╤А╨╛╨┐╤Г╤Б╨║╨░╨╡╨╝)
                if (afterTrimmed.startsWith('=')) {
                    if (assignmentGroup.length >= 2) {
                        result.push(...this.processAssignmentGroup(assignmentGroup));
                    } else if (assignmentGroup.length > 0) {
                        result.push(...assignmentGroup.map(g => g.line));
                    }
                    assignmentGroup = [];
                    result.push(line);
                    continue;
                }
                
                // ╨Х╤Б╨╗╨╕ ╨┐╨╡╤А╨╡╨┤ = ╨▒╤Л╨╗ >, <, ! ╤В╨╛ ╤Н╤В╨╛ ╨╛╨┐╨╡╤А╨░╤В╨╛╤А ╤Б╤А╨░╨▓╨╜╨╡╨╜╨╕╤П (╨┐╤А╨╛╨┐╤Г╤Б╨║╨░╨╡╨╝)
                if (beforeTrimmed.endsWith('>') || beforeTrimmed.endsWith('<') || beforeTrimmed.endsWith('!')) {
                    if (assignmentGroup.length >= 2) {
                        result.push(...this.processAssignmentGroup(assignmentGroup));
                    } else if (assignmentGroup.length > 0) {
                        result.push(...assignmentGroup.map(g => g.line));
                    }
                    assignmentGroup = [];
                    result.push(line);
                    continue;
                }
                
                // ╨н╤В╨╛ ╨┐╤А╨╕╤Б╨▓╨░╨╕╨▓╨░╨╜╨╕╨╡ - ╨┤╨╛╨▒╨░╨▓╨╗╤П╨╡╨╝ ╨▓ ╨│╤А╤Г╨┐╨┐╤Г
                assignmentGroup.push({
                    index: i,
                    line: line,
                    indent: indent,
                    before: before.trimEnd(),
                    after: after
                });
            } else {
                // ╨Э╨╡ ╨┐╤А╨╕╤Б╨▓╨░╨╕╨▓╨░╨╜╨╕╨╡ - ╨╛╨▒╤А╨░╨▒╨╛╤В╨░╤В╤М ╨╜╨░╨║╨╛╨┐╨╗╨╡╨╜╨╜╤Г╤О ╨│╤А╤Г╨┐╨┐╤Г
                if (assignmentGroup.length >= 2) {
                    result.push(...this.processAssignmentGroup(assignmentGroup));
                } else if (assignmentGroup.length > 0) {
                    result.push(...assignmentGroup.map(g => g.line));
                }
                assignmentGroup = [];
                result.push(line);
            }
        }
        
        // ╨Ю╨▒╤А╨░╨▒╨╛╤В╨░╤В╤М ╨┐╨╛╤Б╨╗╨╡╨┤╨╜╤О╤О ╨│╤А╤Г╨┐╨┐╤Г ╨╡╤Б╨╗╨╕ ╨╡╤Б╤В╤М
        if (assignmentGroup.length >= 2) {
            result.push(...this.processAssignmentGroup(assignmentGroup));
        } else if (assignmentGroup.length > 0) {
            // ╨Х╤Б╨╗╨╕ ╨│╤А╤Г╨┐╨┐╨░ ╨╝╨╡╨╜╤М╤И╨╡ 2 - ╨┤╨╛╨▒╨░╨▓╨╕╤В╤М ╤Б╤В╤А╨╛╨║╨╕ ╨║╨░╨║ ╨╡╤Б╤В╤М
            result.push(...assignmentGroup.map(g => g.line));
        }
        
        return result.join('\n');
    }
    
    /**
     * ╨Ю╨▒╤А╨░╨▒╨╛╤В╨║╨░ ╨│╤А╤Г╨┐╨┐╤Л ╨┐╤А╨╕╤Б╨▓╨░╨╕╨▓╨░╨╜╨╕╨╣ - ╨▓╤Л╤А╨░╨▓╨╜╨╕╨▓╨░╨╜╨╕╨╡ ╨┐╨╛ =
     */
    private processAssignmentGroup(
        group: Array<{ index: number; line: string; indent: string; before: string; after: string }>
    ): string[] {
        // ╨Э╨░╨╣╤В╨╕ ╨╝╨░╨║╤Б╨╕╨╝╨░╨╗╤М╨╜╤Г╤О ╨┤╨╗╨╕╨╜╤Г ╤З╨░╤Б╤В╨╕ ╨┤╨╛ =
        const maxBeforeLength = Math.max(...group.map(g => g.before.length));
        
        // ╨Т╤Л╤А╨╛╨▓╨╜╤П╤В╤М ╨▓╤Б╨╡ ╤Б╤В╤А╨╛╨║╨╕
        return group.map(g => {
            const spacesNeeded = maxBeforeLength - g.before.length;
            const padding = ' '.repeat(spacesNeeded);
            return `${g.indent}${g.before}${padding} = ${g.after}`;
        });
    }
}


