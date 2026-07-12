export interface FormReloadTarget {
    name: string;
    line: number;
}

const FORM_DECLARATION = /(?:^|\r?\n)[ \t]*(?:setup|layout)\s+form\s+(!!?[A-Za-z_][A-Za-z0-9_]*)\b/gi;

export function findFormReloadTargets(text: string): FormReloadTarget[] {
    const targets: FormReloadTarget[] = [];
    const seen = new Set<string>();

    for (const match of text.matchAll(FORM_DECLARATION)) {
        const name = match[1];
        const key = name.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        targets.push({
            name,
            line: countLinesBefore(text, (match.index ?? 0) + match[0].lastIndexOf(name))
        });
    }

    return targets;
}

export function buildReloadFormCommand(formName: string): string {
    return `kill  ${formName}\nshow  ${formName}`;
}

function countLinesBefore(text: string, offset: number): number {
    let line = 0;
    for (let index = 0; index < offset; index++) {
        if (text[index] === '\n') {
            line++;
        }
    }
    return line;
}
