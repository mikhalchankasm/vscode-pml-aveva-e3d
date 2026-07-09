export function splitTextLines(text: string): { lines: string[]; eol: string } {
    return {
        lines: text.split(/\r?\n/),
        eol: text.includes('\r\n') ? '\r\n' : '\n'
    };
}

function mapLines(text: string, transform: (lines: string[]) => string[]): string {
    const { lines, eol } = splitTextLines(text);
    return transform(lines).join(eol);
}

export function sortLinesAscText(text: string): string {
    return mapLines(text, lines => [...lines].sort((a, b) => a.localeCompare(b)));
}

export function sortLinesDescText(text: string): string {
    return mapLines(text, lines => [...lines].sort((a, b) => b.localeCompare(a)));
}

export function sortLinesByLengthText(text: string): string {
    return mapLines(text, lines => [...lines].sort((a, b) => a.length - b.length));
}

export function sortLinesSmartText(text: string): string {
    return mapLines(text, lines => [...lines].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })));
}

export function removeDuplicateLinesText(text: string): { text: string; removed: number } {
    const { lines, eol } = splitTextLines(text);
    const seen = new Set<string>();
    const filtered = lines.filter(line => (seen.has(line) ? false : (seen.add(line), true)));
    return {
        text: filtered.join(eol),
        removed: lines.length - filtered.length
    };
}

export function removeConsecutiveDuplicateLinesText(text: string): { text: string; removed: number } {
    const { lines, eol } = splitTextLines(text);
    const filtered: string[] = [];

    for (const line of lines) {
        if (filtered.length === 0 || filtered[filtered.length - 1] !== line) {
            filtered.push(line);
        }
    }

    return {
        text: filtered.join(eol),
        removed: lines.length - filtered.length
    };
}

export function removeEmptyLinesText(text: string): { text: string; removed: number } {
    const { lines, eol } = splitTextLines(text);
    const filtered = lines.filter(line => line.length > 0);
    return {
        text: filtered.join(eol),
        removed: lines.length - filtered.length
    };
}

export function removeWhitespaceOnlyLinesText(text: string): { text: string; removed: number } {
    const { lines, eol } = splitTextLines(text);
    const filtered = lines.filter(line => !/^\s+$/.test(line));
    return {
        text: filtered.join(eol),
        removed: lines.length - filtered.length
    };
}

export function trimTrailingWhitespaceText(text: string): string {
    return mapLines(text, lines => lines.map(line => line.replace(/[ \t]+$/g, '')));
}

export function leadingSpacesToTabsText(text: string, indentSize: number): string {
    const normalizedIndentSize = Number.isFinite(indentSize) && indentSize > 0
        ? Math.floor(indentSize)
        : 4;

    return mapLines(text, lines => lines.map(line => {
        const match = line.match(/^( +)/);
        if (!match) {
            return line;
        }

        const length = match[1].length;
        const tabs = '\t'.repeat(Math.floor(length / normalizedIndentSize));
        const rest = ' '.repeat(length % normalizedIndentSize);
        return tabs + rest + line.slice(length);
    }));
}
