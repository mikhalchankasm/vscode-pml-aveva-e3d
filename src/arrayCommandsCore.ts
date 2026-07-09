export function reindexArrayText(selectedText: string, contextAbove: string = ''): string | null {
    const eol = selectedText.includes('\r\n') ? '\r\n' : '\n';
    const lines = selectedText.replace(/\r/g, '').split('\n');

    while (lines.length > 0 && lines[0].trim() === '') {
        lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }

    const arrayPattern = /^(\s*)(![\w.]+)\[\s*(\d+)\s*\](\s*=\s*)(.*)$/;
    let fallbackArrayName = '';

    for (const line of contextAbove.split(/\r?\n/).reverse()) {
        const match = line.match(arrayPattern);
        if (match) {
            fallbackArrayName = match[2];
            break;
        }
    }

    const arrayLinesCount = lines.filter(line => line.match(arrayPattern)).length;
    if (arrayLinesCount === 0 && !fallbackArrayName) {
        return null;
    }

    const maxIndexLength = Math.max(1, arrayLinesCount.toString().length);
    let currentIndex = 1;

    const result = lines.map(line => {
        const match = line.match(arrayPattern);
        if (!match) {
            return line;
        }

        const idx = currentIndex.toString().padStart(maxIndexLength);
        currentIndex++;
        return `${match[1]}${match[2] || fallbackArrayName}[${idx}]${match[4]}${match[5]}`;
    });

    return result.join(eol);
}

export interface AddToArrayResult {
    text: string;
    added: number;
}

export function addToArrayText(selectedText: string): AddToArrayResult | null {
    const eol = selectedText.includes('\r\n') ? '\r\n' : '\n';
    const lines = selectedText.replace(/\r/g, '').split('\n');

    while (lines.length > 0 && lines[0].trim() === '') {
        lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }

    const arrayPattern = /^(\s*)(![\w.]+)\[\s*(\d+)\s*\](\s*=\s*)(.*)$/;
    let maxIndex = 0;
    let arrayVarName = '';
    let indentSize = '';
    let hasPath = false;
    let hasString = false;

    for (const line of lines) {
        const match = line.match(arrayPattern);
        if (!match) {
            continue;
        }

        const index = parseInt(match[3], 10);
        if (index > maxIndex) {
            maxIndex = index;
        }

        if (!arrayVarName) {
            arrayVarName = match[2];
            indentSize = match[1];
            const value = match[5].trim();
            hasPath = value.startsWith('/') || value.startsWith("'/");
            hasString = value.startsWith("'") || value.startsWith('|');
        }
    }

    if (!arrayVarName) {
        return null;
    }

    const dataLineIndexes: number[] = [];
    let inBlockComment = false;
    for (let index = 0; index < lines.length; index++) {
        const trimmed = lines[index].trim();

        if (inBlockComment) {
            if (trimmed.includes('$)')) {
                inBlockComment = false;
            }
            continue;
        }

        if (trimmed.startsWith('$(')) {
            if (!trimmed.includes('$)')) {
                inBlockComment = true;
            }
            continue;
        }

        if (
            trimmed.length === 0 ||
            trimmed.startsWith('--') ||
            trimmed.startsWith('$*') ||
            lines[index].match(arrayPattern)
        ) {
            continue;
        }

        dataLineIndexes.push(index);
    }

    if (dataLineIndexes.length === 0) {
        return { text: lines.join(eol), added: 0 };
    }

    const maxIndexLength = (maxIndex + dataLineIndexes.length).toString().length;
    let currentIndex = maxIndex + 1;

    for (const lineIndex of dataLineIndexes) {
        const trimmedLine = lines[lineIndex].trim();
        const idx = currentIndex.toString().padStart(maxIndexLength);

        let value: string;
        if (hasPath && hasString) {
            value = `'/${trimmedLine}'`;
        } else if (hasPath) {
            value = `/${trimmedLine}`;
        } else if (hasString) {
            value = `'${trimmedLine}'`;
        } else {
            value = trimmedLine;
        }

        lines[lineIndex] = `${indentSize}${arrayVarName}[${idx}] = ${value}`;
        currentIndex++;
    }

    return { text: lines.join(eol), added: dataLineIndexes.length };
}
