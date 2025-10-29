/**
 * Comment Extractor - Extract documentation comments from source code
 */

/**
 * Extract documentation comments before a line
 * Collects all comment lines (starting with --) before the target line
 * until a non-comment, non-empty line is encountered
 *
 * @param text - Full document text
 * @param lineNumber - Line number (0-indexed) where the definition starts
 * @returns Documentation string or undefined
 */
export function extractPrecedingComments(text: string, lineNumber: number): string | undefined {
	const lines = text.split(/\r?\n/);

	if (lineNumber < 0 || lineNumber >= lines.length) {
		return undefined;
	}

	const commentLines: string[] = [];
	let currentLine = lineNumber - 1;

	// Walk backwards collecting comment lines
	while (currentLine >= 0) {
		const line = lines[currentLine].trim();

		// Empty line - stop collecting
		if (line === '') {
			currentLine--;
			continue; // Allow empty lines between comments and definition
		}

		// Comment line starting with --
		if (line.startsWith('--')) {
			// Remove the leading -- and trim
			const commentText = line.substring(2).trim();
			commentLines.unshift(commentText);
			currentLine--;
			continue;
		}

		// AVEVA-style $p marker (method description)
		if (line.startsWith('$p')) {
			const commentText = line.substring(2).trim();
			commentLines.unshift(commentText);
			currentLine--;
			continue;
		}

		// Non-comment, non-empty line - stop
		break;
	}

	// If we found comments, join them
	if (commentLines.length > 0) {
		return commentLines.join('\n');
	}

	return undefined;
}

/**
 * Extract JSDoc-style parameter documentation
 * Looks for lines like: -- @param1 - description
 *
 * @param documentation - Full documentation text
 * @returns Map of parameter name to description
 */
export function extractParameterDocs(documentation: string): Map<string, string> {
	const paramDocs = new Map<string, string>();

	const lines = documentation.split('\n');
	for (const line of lines) {
		// Match: @paramName - description or @paramName description
		const match = line.match(/^@(\w+)\s*[-:]?\s*(.*)$/);
		if (match) {
			const paramName = match[1];
			const description = match[2].trim();
			paramDocs.set(paramName, description);
		}
	}

	return paramDocs;
}

/**
 * Format documentation for hover display
 *
 * @param documentation - Raw documentation text
 * @param methodName - Method name for context
 * @param parameters - Parameter names
 * @returns Formatted markdown documentation
 */
export function formatDocumentation(
	documentation: string,
	methodName: string,
	parameters: string[]
): string {
	const paramDocs = extractParameterDocs(documentation);

	let formatted = '';

	// Add description (lines that don't start with @)
	const descriptionLines = documentation
		.split('\n')
		.filter(line => !line.trim().startsWith('@'))
		.join('\n')
		.trim();

	if (descriptionLines) {
		formatted += descriptionLines + '\n\n';
	}

	// Add parameter documentation
	if (paramDocs.size > 0 && parameters.length > 0) {
		formatted += '**Parameters:**\n';
		for (const param of parameters) {
			const paramName = param.startsWith('!') ? param.substring(1) : param;
			const doc = paramDocs.get(paramName);
			if (doc) {
				formatted += `- \`${param}\` — ${doc}\n`;
			} else {
				formatted += `- \`${param}\`\n`;
			}
		}
	}

	return formatted;
}
