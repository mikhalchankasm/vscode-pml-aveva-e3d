export interface PmlSurroundPreset {
	id: string;
	label: string;
	description: string;
	opening: string;
	closing: string;
}

export const PML_SURROUND_PRESETS: readonly PmlSurroundPreset[] = [
	{
		id: 'markdb',
		label: "MARKDB '' / ENDMARKDB",
		description: 'Wrap selected lines in a MARKDB block.',
		opening: "markdb ''",
		closing: 'endmarkdb'
	},
	{
		id: 'do',
		label: 'DO / ENDDO',
		description: 'Wrap selected lines in a DO loop that requires BREAK or RETURN.',
		opening: 'do',
		closing: 'enddo'
	}
];

export function surroundPmlLines(
	selectedText: string,
	preset: PmlSurroundPreset,
	eol: string,
	indentUnit: string
): string {
	const lines = selectedText.split(/\r?\n/);
	const baseIndent = commonLeadingWhitespace(lines);
	const body = lines.map(line => {
		if (line.trim().length === 0) {
			return '';
		}
		const relativeText = line.startsWith(baseIndent) ? line.slice(baseIndent.length) : line;
		return `${baseIndent}${indentUnit}${relativeText}`;
	});

	return [
		`${baseIndent}${preset.opening}`,
		...body,
		`${baseIndent}${preset.closing}`
	].join(eol);
}

function commonLeadingWhitespace(lines: string[]): string {
	const indents = lines
		.filter(line => line.trim().length > 0)
		.map(line => line.match(/^\s*/)?.[0] ?? '');
	if (indents.length === 0) {
		return lines[0]?.match(/^\s*/)?.[0] ?? '';
	}

	let common = indents[0];
	for (const indent of indents.slice(1)) {
		let length = 0;
		while (length < common.length && length < indent.length && common[length] === indent[length]) {
			length++;
		}
		common = common.slice(0, length);
	}
	return common;
}
