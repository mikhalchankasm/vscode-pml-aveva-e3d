export interface DirectCallbackReference {
	name: string;
	argumentCount: number;
}

/** Returns only a statically direct form callback target; dynamic callback text is intentionally excluded. */
export function directCallbackTarget(callback?: string): string | undefined {
	return callback?.trim().match(/^(?:!this\.|\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/i)?.[1];
}

export function directCallbackReference(callback?: string): DirectCallbackReference | undefined {
	const text = callback?.trim();
	const match = text?.match(/^(?:!this\.|\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/i);
	if (!text || !match) {
		return undefined;
	}

	const openIndex = match[0].lastIndexOf('(');
	const argumentCount = countDirectCallArguments(text, openIndex);
	return argumentCount === undefined ? undefined : {
		name: match[1],
		argumentCount
	};
}

function countDirectCallArguments(text: string, openIndex: number): number | undefined {
	const nesting: string[] = ['('];
	let delimiter: "'" | '"' | '|' | undefined;
	let argumentCount = 0;
	let hasCurrentArgumentText = false;

	for (let index = openIndex + 1; index < text.length; index++) {
		const char = text[index];
		if (delimiter) {
			if (char === delimiter) {
				delimiter = undefined;
			}
			hasCurrentArgumentText = true;
			continue;
		}
		if (char === "'" || char === '"' || char === '|') {
			delimiter = char;
			hasCurrentArgumentText = true;
			continue;
		}
		if (char === '(' || char === '[' || char === '{') {
			nesting.push(char);
			hasCurrentArgumentText = true;
			continue;
		}
		if (char === ')' || char === ']' || char === '}') {
			const expectedOpen = char === ')' ? '(' : char === ']' ? '[' : '{';
			if (nesting.pop() !== expectedOpen) {
				return undefined;
			}
			if (nesting.length === 0) {
				if (text.slice(index + 1).trim().length > 0) {
					return undefined;
				}
				if (!hasCurrentArgumentText) {
					return argumentCount === 0 ? 0 : undefined;
				}
				return argumentCount + 1;
			}
			hasCurrentArgumentText = true;
			continue;
		}
		if (char === ',' && nesting.length === 1) {
			if (!hasCurrentArgumentText) {
				return undefined;
			}
			argumentCount++;
			hasCurrentArgumentText = false;
			continue;
		}
		if (!/\s/.test(char)) {
			hasCurrentArgumentText = true;
		}
	}

	return undefined;
}
