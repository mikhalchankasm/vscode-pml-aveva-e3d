export interface TextRange {
	startOffset: number;
	endOffset: number;
}

export function collectPmlCommentRanges(text: string): TextRange[] {
	const ranges: TextRange[] = [];
	let offset = 0;

	while (offset < text.length) {
		const char = text[offset];
		const next = text[offset + 1];

		if (char === '|' || char === '\'' || char === '"') {
			offset = skipDelimitedText(text, offset, char);
			continue;
		}

		if (char === '-' && next === '-') {
			const endOffset = findLineEnd(text, offset + 2);
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		if (char === '$' && next === '*') {
			const endOffset = findLineEnd(text, offset + 2);
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		if (char === '$' && next === '(') {
			const endMarker = text.indexOf('$)', offset + 2);
			const endOffset = endMarker === -1 ? text.length : endMarker + 2;
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		offset++;
	}

	return ranges;
}

export function collectPmlInactiveTextRanges(text: string): TextRange[] {
	const ranges: TextRange[] = [];
	let offset = 0;

	while (offset < text.length) {
		const char = text[offset];
		const next = text[offset + 1];

		if (char === '|' || char === '\'' || char === '"') {
			const endOffset = skipDelimitedText(text, offset, char);
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		if (char === '-' && next === '-') {
			const endOffset = findLineEnd(text, offset + 2);
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		if (char === '$' && next === '*') {
			const endOffset = findLineEnd(text, offset + 2);
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		if (char === '$' && next === '(') {
			const endMarker = text.indexOf('$)', offset + 2);
			const endOffset = endMarker === -1 ? text.length : endMarker + 2;
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		offset++;
	}

	return ranges;
}

export function collectPmlMethodReferenceIgnoredRanges(text: string): TextRange[] {
	const ranges: TextRange[] = [];
	let offset = 0;

	while (offset < text.length) {
		const char = text[offset];
		const next = text[offset + 1];

		if (char === '|') {
			// Pipe strings can contain callback references such as |!this.refresh|.
			offset = skipDelimitedText(text, offset, char);
			continue;
		}

		if (char === '\'' || char === '"') {
			const endOffset = skipDelimitedText(text, offset, char);
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		if (char === '-' && next === '-') {
			const endOffset = findLineEnd(text, offset + 2);
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		if (char === '$' && next === '*') {
			const endOffset = findLineEnd(text, offset + 2);
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		if (char === '$' && next === '(') {
			const endMarker = text.indexOf('$)', offset + 2);
			const endOffset = endMarker === -1 ? text.length : endMarker + 2;
			ranges.push({ startOffset: offset, endOffset });
			offset = endOffset;
			continue;
		}

		offset++;
	}

	return ranges;
}

export function isOffsetInTextRanges(ranges: readonly TextRange[], offset: number): boolean {
	return findTextRangeContaining(ranges, offset) !== undefined;
}

export function findTextRangeContaining(ranges: readonly TextRange[], offset: number): TextRange | undefined {
	let low = 0;
	let high = ranges.length - 1;

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const range = ranges[mid];
		if (offset < range.startOffset) {
			high = mid - 1;
		} else if (offset >= range.endOffset) {
			low = mid + 1;
		} else {
			return range;
		}
	}

	return undefined;
}

function skipDelimitedText(text: string, startOffset: number, delimiter: string): number {
	const endOffset = text.indexOf(delimiter, startOffset + 1);
	return endOffset === -1 ? text.length : endOffset + 1;
}

function findLineEnd(text: string, startOffset: number): number {
	const newlineOffset = text.indexOf('\n', startOffset);
	return newlineOffset === -1 ? text.length : newlineOffset;
}
