export interface PMLPrintLineInfo {
    line: number;
    text: string;
    commandIndex: number;
}

const PRINT_LINE_PATTERN = /^\s*\$[Pp](?=$|\s).*/;
const PRINT_COMMAND_PATTERN = /\$[Pp](?=$|\s)/;
const COMMENTED_PRINT_LINE_PATTERN = /^(\s*)\$\*\s*(\$[Pp](?=$|\s).*)$/;

export function scanPMLPrintLines(lines: readonly string[]): PMLPrintLineInfo[] {
    const prints: PMLPrintLineInfo[] = [];
    let inBlockComment = false;

    lines.forEach((text, line) => {
        if (inBlockComment || !isPMLPrintLine(text)) {
            inBlockComment = scanBlockCommentState(text, inBlockComment);
            return;
        }

        prints.push({
            line,
            text,
            commandIndex: text.search(PRINT_COMMAND_PATTERN)
        });
    });

    return prints;
}

export function scanCommentedPMLPrintLines(lines: readonly string[]): PMLPrintLineInfo[] {
    return lines.flatMap((text, line) =>
        isCommentedPMLPrintLine(text)
            ? [{ line, text, commandIndex: text.search(PRINT_COMMAND_PATTERN) }]
            : []
    );
}

export function isPMLPrintLine(text: string): boolean {
    return PRINT_LINE_PATTERN.test(text);
}

export function isCommentedPMLPrintLine(text: string): boolean {
    return COMMENTED_PRINT_LINE_PATTERN.test(text);
}

export function commentPrintText(text: string): string {
    const indent = text.match(/^\s*/)?.[0] ?? '';
    return `${indent}$* ${text.slice(indent.length)}`;
}

export function uncommentPrintText(text: string): string {
    return text.replace(COMMENTED_PRINT_LINE_PATTERN, '$1$2');
}

export function scanBlockCommentState(text: string, inBlockComment: boolean): boolean {
    let index = 0;
    while (index < text.length) {
        if (inBlockComment) {
            const closeIndex = text.indexOf('$)', index);
            if (closeIndex === -1) {
                return true;
            }
            inBlockComment = false;
            index = closeIndex + 2;
            continue;
        }

        const openIndex = text.indexOf('$(', index);
        if (openIndex === -1) {
            return false;
        }
        inBlockComment = true;
        index = openIndex + 2;
    }

    return inBlockComment;
}
