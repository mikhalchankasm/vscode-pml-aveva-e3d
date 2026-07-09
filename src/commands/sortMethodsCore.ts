export interface MethodBlock {
    name: string;
    startLine: number;
    endLine: number;
    text: string;
    precedingComments: string;
}

export function extractMethodBlocksFromText(text: string, eol: string = '\n'): MethodBlock[] {
    const lines = text.split(/\r?\n/);
    const methods: MethodBlock[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        const methodMatch = line.match(/^define\s+method\s+\.([A-Za-z0-9_]+)/i);

        if (!methodMatch) {
            i++;
            continue;
        }

        const methodName = methodMatch[1];
        const methodStartLine = i;
        let commentStartLine = i;

        for (let j = i - 1; j >= 0; j--) {
            const prevLine = lines[j].trim();

            if (prevLine === '') {
                if (j > 0 && (lines[j - 1].trim().startsWith('--') || lines[j - 1].trim().startsWith('$*'))) {
                    continue;
                }
                break;
            }

            if (prevLine.startsWith('--') || prevLine.startsWith('$*')) {
                commentStartLine = j;
                continue;
            }

            break;
        }

        let methodEndLine = i;
        let depth = 1;
        for (let j = i + 1; j < lines.length; j++) {
            const currentLine = lines[j].trim();

            if (currentLine.match(/^define\s+method/i)) {
                depth++;
            } else if (currentLine.match(/^endmethod/i)) {
                depth--;
                if (depth === 0) {
                    methodEndLine = j;
                    break;
                }
            }
        }

        methods.push({
            name: methodName,
            startLine: commentStartLine,
            endLine: methodEndLine,
            text: lines.slice(methodStartLine, methodEndLine + 1).join(eol),
            precedingComments: commentStartLine < methodStartLine
                ? lines.slice(commentStartLine, methodStartLine).join(eol).trimEnd()
                : ''
        });

        i = methodEndLine + 1;
    }

    return methods;
}
