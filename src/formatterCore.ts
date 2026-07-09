interface AssignmentEntry {
    line: string;
    indent: string;
    before: string;
    after: string;
}

function findAssignmentOperator(line: string): number {
    let inPipeString = false;
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let index = 0; index < line.length; index++) {
        const char = line[index];

        if (char === '|' && !inSingleQuote && !inDoubleQuote) {
            inPipeString = !inPipeString;
            continue;
        }
        if (char === '\'' && !inPipeString && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
            continue;
        }
        if (char === '"' && !inPipeString && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
            continue;
        }
        if (char !== '=' || inPipeString || inSingleQuote || inDoubleQuote) {
            continue;
        }

        const before = line[index - 1];
        const after = line[index + 1];
        if (before === '>' || before === '<' || before === '!' || after === '=') {
            return -1;
        }
        return index;
    }

    return -1;
}

function parseAssignment(line: string): AssignmentEntry | null {
    const operatorIndex = findAssignmentOperator(line);
    if (operatorIndex < 0) {
        return null;
    }

    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch?.[0] ?? '';
    const before = line.slice(indent.length, operatorIndex).trimEnd();
    const after = line.slice(operatorIndex + 1).trimStart();
    if (!before) {
        return null;
    }

    return { line, indent, before, after };
}

function processAssignmentGroup(group: AssignmentEntry[]): string[] {
    const maxBeforeLength = Math.max(...group.map(entry => entry.before.length));

    return group.map(entry => {
        const padding = ' '.repeat(maxBeforeLength - entry.before.length);
        return `${entry.indent}${entry.before}${padding} = ${entry.after}`;
    });
}

export function alignAssignmentsText(text: string, eol: string = '\n'): string {
    const lines = text.split(/\r?\n/);
    const result: string[] = [];
    let assignmentGroup: AssignmentEntry[] = [];

    const flushGroup = () => {
        if (assignmentGroup.length >= 2) {
            result.push(...processAssignmentGroup(assignmentGroup));
        } else if (assignmentGroup.length > 0) {
            result.push(...assignmentGroup.map(entry => entry.line));
        }
        assignmentGroup = [];
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('--') || trimmed.startsWith('$*')) {
            flushGroup();
            result.push(line);
            continue;
        }

        const assignment = parseAssignment(line);
        if (assignment) {
            assignmentGroup.push(assignment);
            continue;
        }

        flushGroup();
        result.push(line);
    }

    flushGroup();
    return result.join(eol);
}
