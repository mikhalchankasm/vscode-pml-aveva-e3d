/**
 * Enhanced Hover Provider - Shows type information, method signatures, documentation
 */

import { Hover, HoverParams, MarkupKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getPdmsCommand } from '../data/pdmsCommands';
import { SymbolIndex } from '../index/symbolIndex';
import { isMethodDeclarationReference } from '../utils/methodReferencePatterns';
import { ReferencePreview, ReferencesProvider } from './referencesProvider';

export class HoverProvider {
	// Built-in PML methods documentation
	private builtInDocs: Map<string, Map<string, string>> = new Map([
		['STRING', new Map([
			['upcase', '**STRING.upcase()** → STRING\n\nConverts string to uppercase.\n\nExample:\n```pml\n!name = |hello|\n!upper = !name.upcase()  -- HELLO\n```'],
			['lowcase', '**STRING.lowcase()** → STRING\n\nConverts string to lowercase.\n\nExample:\n```pml\n!name = |HELLO|\n!lower = !name.lowcase()  -- hello\n```'],
			['trim', '**STRING.trim()** → STRING\n\nRemoves leading and trailing whitespace.\n\nExample:\n```pml\n!text = |  hello  |\n!trimmed = !text.trim()  -- |hello|\n```'],
			['length', '**STRING.length()** → REAL\n\nReturns the length of the string.\n\nExample:\n```pml\n!name = |hello|\n!len = !name.length()  -- 5\n```'],
			['substring', '**STRING.substring(start, length)** → STRING\n\nExtracts a substring.\n\nParameters:\n- start: REAL - Starting position (1-indexed)\n- length: REAL - Number of characters\n\nExample:\n```pml\n!text = |hello world|\n!sub = !text.substring(1, 5)  -- |hello|\n```'],
			['real', '**STRING.real()** → REAL\n\nConverts string to real number.\n\nExample:\n```pml\n!text = |123.45|\n!num = !text.real()  -- 123.45\n```'],
			['match', '**STRING.match(pattern)** → BOOLEAN\n\nChecks if string matches pattern.\n\nExample:\n```pml\n!name = |PIPE-100|\n!isPipe = !name.match(|PIPE*|)  -- true\n```'],
		])],
		['REAL', new Map([
			['abs', '**REAL.abs()** → REAL\n\nReturns absolute value.\n\nExample:\n```pml\n!num = -5.5\n!positive = !num.abs()  -- 5.5\n```'],
			['round', '**REAL.round()** → REAL\n\nRounds to nearest integer.\n\nExample:\n```pml\n!num = 3.7\n!rounded = !num.round()  -- 4\n```'],
			['floor', '**REAL.floor()** → REAL\n\nRounds down to integer.\n\nExample:\n```pml\n!num = 3.7\n!floored = !num.floor()  -- 3\n```'],
			['ceiling', '**REAL.ceiling()** → REAL\n\nRounds up to integer.\n\nExample:\n```pml\n!num = 3.2\n!ceiled = !num.ceiling()  -- 4\n```'],
			['string', '**REAL.string()** → STRING\n\nConverts number to string.\n\nExample:\n```pml\n!num = 123.45\n!text = !num.string()  -- |123.45|\n```'],
			['sin', '**REAL.sin()** → REAL\n\nCalculates sine (radians).\n\nExample:\n```pml\n!angle = 1.57  -- ~π/2\n!result = !angle.sin()  -- 1.0\n```'],
			['cos', '**REAL.cos()** → REAL\n\nCalculates cosine (radians).'],
			['sqrt', '**REAL.sqrt()** → REAL\n\nCalculates square root.\n\nExample:\n```pml\n!num = 16\n!root = !num.sqrt()  -- 4\n```'],
		])],
		['ARRAY', new Map([
			['size', '**ARRAY.size()** → REAL\n\nReturns number of elements.\n\n⚠️ PML arrays are 1-indexed!\n\nExample:\n```pml\n!arr = ARRAY()\n!arr.append(|a|)\n!count = !arr.size()  -- 1\n```'],
			['append', '**ARRAY.append(element)** → BOOLEAN\n\nAdds element to end of array.\n\nExample:\n```pml\n!arr = ARRAY()\n!arr.append(|hello|)\n!arr.append(|world|)\n-- !arr[1] = |hello|, !arr[2] = |world|\n```'],
			['first', '**ARRAY.first()** → ANY\n\nReturns first element (same as arr[1]).\n\nExample:\n```pml\n!arr = ARRAY()\n!arr.append(|hello|)\n!first = !arr.first()  -- |hello|\n```'],
			['last', '**ARRAY.last()** → ANY\n\nReturns last element.\n\nExample:\n```pml\n!arr = ARRAY()\n!arr.append(|a|)\n!arr.append(|b|)\n!last = !arr.last()  -- |b|\n```'],
			['empty', '**ARRAY.empty()** → BOOLEAN\n\nChecks if array is empty.\n\nExample:\n```pml\n!arr = ARRAY()\n!isEmpty = !arr.empty()  -- true\n```'],
		])],
		['DBREF', new Map([
			['query', '**DBREF.query(attribute)** → STRING\n\nQueries attribute value as string.\n\nExample:\n```pml\n!pipe = !!ce\n!name = !pipe.query(|NAME|)\n!type = !pipe.query(|TYPE|)\n```'],
			['qreal', '**DBREF.qreal(attribute)** → REAL\n\nQueries attribute value as real number.\n\nExample:\n```pml\n!pipe = !!ce\n!bore = !pipe.qreal(|BORE|)\n!length = !pipe.qreal(|LENGTH|)\n```'],
			['qboolean', '**DBREF.qboolean(attribute)** → BOOLEAN\n\nQueries attribute value as boolean.\n\nExample:\n```pml\n!pipe = !!ce\n!isIssued = !pipe.qboolean(|LISSUE|)\n```'],
			['attribute', '**DBREF.attribute(name)** -> ANY\n\nReturns the value of the named database attribute.\n\nExample:\n```pml\n!elem = !!CE\n!name = !elem.attribute(|NAME|)\n```'],
			['attributes', '**DBREF.attributes()** -> STRING[]\n\nLists attributes available on the referenced database element.'],
			['badref', '**DBREF.badRef()** -> BOOLEAN\n\nReturns TRUE when the DBREF is invalid or cannot be navigated to.'],
			['mcount', '**DBREF.mcount([type])** -> REAL\n\nCounts members of the referenced element, optionally filtered by element type.'],
			['line', '**DBREF.line([CUT|UNCUT])** -> LINE\n\nReturns the cut or uncut pline for supported SCTN/GENSEC elements.'],
			['delete', '**DBREF.delete()** -> NO RESULT\n\nDeletes the PML DBREF object, not the database element it points to.'],
		])],
		['ELEMENTTYPE', new Map([
			['isudet', '**ELEMENTTYPE.IsUdet()** -> BOOLEAN\n\nWhether the element type is a User Defined Element Type (UDET).'],
			['systemattributes', '**ELEMENTTYPE.systemAttributes()** -> ATTRIBUTE[]\n\nLists system attributes for this element type, excluding user-defined attributes (UDAs).'],
			['dbtypes', '**ELEMENTTYPE.DbTypes()** -> STRING[]\n\nLists valid database types for this element type.'],
			['changetype', '**ELEMENTTYPE.ChangeType()** -> STRING\n\nIndicates whether elements of this type may have their type changed.'],
			['systemtype', '**ELEMENTTYPE.SystemType()** -> ELEMENTTYPE\n\nFor UDETs, returns the base system element type.'],
			['udets', '**ELEMENTTYPE.UDETs()** -> ELEMENTTYPE[]\n\nLists UDETs derived from this element type.'],
			['primary', '**ELEMENTTYPE.Primary()** -> BOOLEAN\n\nWhether this element type is primary.'],
			['membertypes', '**ELEMENTTYPE.MemberTypes()** -> ELEMENTTYPE[]\n\nLists valid member element types, including UDETs.'],
			['parenttypes', '**ELEMENTTYPE.ParentTypes()** -> ELEMENTTYPE[]\n\nLists valid parent element types, including UDETs.'],
		])],
		['ATTRIBUTE', new Map([
			['ispseudo', '**ATTRIBUTE.IsPseudo()** -> BOOLEAN\n\nReturns TRUE when the attribute is a pseudo attribute.'],
			['isuda', '**ATTRIBUTE.IsUda()** -> BOOLEAN\n\nReturns TRUE when the attribute is a User Defined Attribute (UDA).'],
			['units', '**ATTRIBUTE.units()** -> STRING\n\nReturns the attribute unit category such as BORE, DIST, MASS, ANGL, or NONE.'],
			['category', '**ATTRIBUTE.Category()** -> STRING\n\nReturns the Attribute Utility grouping category.'],
			['noclaim', '**ATTRIBUTE.NoClaim()** -> BOOLEAN\n\nReturns whether the attribute can be changed without claiming the element.'],
			['elementtypes', '**ATTRIBUTE.ElementTypes()** -> ELEMENTTYPE[]\n\nLists element types for which the UDA is valid.'],
			['validvalues', '**ATTRIBUTE.ValidValues(elementType)** -> STRING[]\n\nLists valid text values for the supplied element type.'],
			['defaultvalue', '**ATTRIBUTE.DefaultValue(elementType)** -> STRING\n\nReturns the UDA default value for the supplied element type.'],
			['querytext', '**ATTRIBUTE.queryText()** -> STRING\n\nReturns the command-line query text for this attribute.'],
			['hyperlink', '**ATTRIBUTE.hyperlink()** -> BOOLEAN\n\nReturns TRUE when the attribute value refers to an external file.'],
			['connection', '**ATTRIBUTE.connection()** -> BOOLEAN\n\nReturns TRUE when the attribute value appears on the reference list form.'],
			['hidden', '**ATTRIBUTE.hidden()** -> BOOLEAN\n\nReturns TRUE when the attribute is hidden from Attribute Utility and Q ATT output.'],
			['protected', '**ATTRIBUTE.protected()** -> BOOLEAN\n\nReturns TRUE when the attribute is protected from normal visibility.'],
		])],
	]);

	// Global functions documentation
	private globalFunctionDocs: Map<string, string> = new Map([
		['array', '**ARRAY()** → ARRAY\n\nCreates a new empty array.\n\n⚠️ PML arrays are 1-indexed (start at 1, not 0)!\n\nExample:\n```pml\n!myArray = ARRAY()\n!myArray.append(|item1|)\n!myArray.append(|item2|)\n!first = !myArray[1]  -- OK\n!wrong = !myArray[0]  -- ERROR!\n```'],
		['object', '**OBJECT objectType** → Object\n\nCreates a new object instance.\n\nExample:\n```pml\n!processor = object MyDataProcessor()\n!processor.setup()\n```'],
		['collectallfor', '**collectallfor(type, condition)** → ARRAY of DBREF\n\nCollects all database elements of given type matching condition.\n\nParameters:\n- type: STRING - Element type (e.g., PIPE, ELBO, VALV)\n- condition: STRING - Selection criteria\n\nExample:\n```pml\n!pipes = !!collectallfor(|PIPE|, |BORE eq 100|)\ndo !pipe values !pipes\n    !name = !pipe.query(|NAME|)\nenddo\n```'],
		['getobject', '**getobject(type, name)** → DBREF\n\nFinds database element by type and name.\n\nExample:\n```pml\n!pipe = !!getobject(|PIPE|, |/PIPE-100|)\nif (!pipe.exists()) then\n    -- handle error\nendif\n```'],
	]);

	constructor(
		private symbolIndex: SymbolIndex,
		private referencesProvider?: Pick<ReferencesProvider, 'getReferencePreviews'>
	) {}

	public async provide(params: HoverParams, document: TextDocument): Promise<Hover | null> {
		const position = params.position;
		const wordRange = this.getWordRangeAtPosition(document, position);
		if (!wordRange) return null;

		const word = document.getText(wordRange);

		const pdmsCommandHover = this.getPdmsCommandHover(word, document, wordRange);
		if (pdmsCommandHover) {
			return pdmsCommandHover;
		}

		const globalVariableHover = this.getGlobalVariableHover(word, document, wordRange);
		if (globalVariableHover) {
			return globalVariableHover;
		}

		// Extract method name from patterns like .method, var.method, !obj.method
		let methodName: string | null = null;
		if (word.startsWith('.')) {
			methodName = word.substring(1);
		} else if (word.includes('.')) {
			const lastDotIndex = word.lastIndexOf('.');
			methodName = word.substring(lastDotIndex + 1);
		}

		if (methodName) {
			// First check built-in methods (they should have priority for common names)
			const builtInHover = this.getBuiltInMethodHover(methodName);
			if (builtInHover) {
				return { ...builtInHover, range: wordRange };
			}

			// Then check user-defined methods
			const userMethodHover = await this.getMethodHover(methodName, document, wordRange);
			if (userMethodHover) {
				return userMethodHover;
			}
		}

		// Check if it's a global function
		const funcDoc = this.globalFunctionDocs.get(word.toLowerCase());
		if (funcDoc) {
			return {
				contents: {
					kind: MarkupKind.Markdown,
					value: funcDoc
				},
				range: wordRange
			};
		}

		return null;
	}

	private getPdmsCommandHover(
		word: string,
		document: TextDocument,
		wordRange: { start: { line: number; character: number }; end: { line: number; character: number } }
	): Hover | null {
		let command = getPdmsCommand(word);
		let commandRange = wordRange;

		if (!command && wordRange.start.character > 0) {
			const prefixRange = {
				start: { line: wordRange.start.line, character: wordRange.start.character - 1 },
				end: wordRange.start
			};
			if (document.getText(prefixRange) === '$') {
				command = getPdmsCommand(`$${word}`);
				commandRange = {
					start: prefixRange.start,
					end: wordRange.end
				};
			}
		}

		if (
			!command ||
			!this.isFirstTokenOnLine(document, commandRange.start.line, commandRange.start.character) ||
			this.isPositionInComment(document, commandRange.start.line, commandRange.start.character)
		) {
			return null;
		}

		const content = [
			`### PDMS Command: ${command.name.toUpperCase()}`,
			'',
			`**Category:** ${command.category}`,
			'',
			this.getPdmsCommandBrief(command.name, document, commandRange.start.line),
			'',
			'Recognized as a line command only when it is the first non-whitespace token on the line.'
		].join('\n');

		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: content
			},
			range: commandRange
		};
	}

	private getGlobalVariableHover(
		word: string,
		document: TextDocument,
		wordRange: { start: { line: number; character: number }; end: { line: number; character: number } }
	): Hover | null {
		if (word.toLowerCase() !== 'ce' || wordRange.start.character < 2) {
			return null;
		}

		const prefixRange = {
			start: { line: wordRange.start.line, character: wordRange.start.character - 2 },
			end: wordRange.start
		};
		if (
			document.getText(prefixRange) !== '!!' ||
			this.isPositionInComment(document, wordRange.start.line, wordRange.start.character)
		) {
			return null;
		}

		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: this.joinCompactLines([
					'`!!CE`',
					'Type: `DBREF`',
					'Current Element: tracks the current database element and can be queried from PML.'
				])
			},
			range: {
				start: prefixRange.start,
				end: wordRange.end
			}
		};
	}

	private getPdmsCommandBrief(commandName: string, document: TextDocument, line: number): string {
		if (commandName.toLowerCase() === 'q' && this.isQAttCommandLine(document, line)) {
			return [
				'Queries attributes for the Current Element (CE).',
				'',
				'`Q ATT [AS ANY | <type>]` lists attribute values, including distributed attribute views such as `Q ATT AS :PROCESS`.',
				'Distributed attributes can use qualified names such as `:LOCAL\\:PROCESS` and optional instance indexes like `[2]`.'
			].join('\n');
		}

		const command = getPdmsCommand(commandName);
		return command?.brief ?? '';
	}

	private isQAttCommandLine(document: TextDocument, line: number): boolean {
		const lineText = document.getText().split(/\r?\n/)[line] ?? '';
		return /^\s*q\s+att\b/i.test(lineText);
	}

	private isFirstTokenOnLine(document: TextDocument, line: number, character: number): boolean {
		const lineText = document.getText({
			start: { line, character: 0 },
			end: { line, character }
		});

		return lineText.trim().length === 0;
	}

	private isPositionInComment(document: TextDocument, targetLine: number, targetCharacter: number): boolean {
		const lines = document.getText().split(/\r?\n/);
		let inBlockComment = false;

		for (let lineIndex = 0; lineIndex <= targetLine; lineIndex++) {
			const line = lines[lineIndex] ?? '';
			let pos = 0;

			while (pos < line.length) {
				if (inBlockComment) {
					const endPos = line.indexOf('$)', pos);
					if (lineIndex === targetLine && (endPos === -1 || targetCharacter < endPos + 2)) {
						return true;
					}
					if (endPos === -1) {
						break;
					}
					pos = endPos + 2;
					inBlockComment = false;
					continue;
				}

				const dashCommentPos = line.indexOf('--', pos);
				const dollarCommentPos = line.indexOf('$*', pos);
				const blockStartPos = line.indexOf('$(', pos);
				const commentPos = this.minNonNegative(dashCommentPos, dollarCommentPos, blockStartPos);

				if (commentPos === -1) {
					break;
				}

				if (commentPos === dashCommentPos || commentPos === dollarCommentPos) {
					if (lineIndex === targetLine && targetCharacter >= commentPos) {
						return true;
					}
					break;
				}

				const blockEndPos = line.indexOf('$)', commentPos + 2);
				if (lineIndex === targetLine && targetCharacter >= commentPos &&
					(blockEndPos === -1 || targetCharacter < blockEndPos + 2)) {
					return true;
				}

				if (blockEndPos === -1) {
					inBlockComment = true;
					break;
				}

				pos = blockEndPos + 2;
			}
		}

		return false;
	}

	private minNonNegative(...values: number[]): number {
		const candidates = values.filter(value => value >= 0);
		return candidates.length === 0 ? -1 : Math.min(...candidates);
	}

	/**
	 * Get hover for built-in method (STRING, REAL, ARRAY, DBREF methods)
	 */
	private getBuiltInMethodHover(methodName: string): Hover | null {
		const lowerName = methodName.toLowerCase();
		// Search in all type documentation
		for (const [, methods] of this.builtInDocs.entries()) {
			const doc = methods.get(lowerName);
			if (doc) {
				return {
					contents: {
						kind: MarkupKind.Markdown,
						value: doc
					}
				};
			}
		}
		return null;
	}

	/**
	 * Get hover for user-defined method
	 */
	private async getMethodHover(
		methodName: string,
		document: TextDocument,
		wordRange: { start: { line: number; character: number }; end: { line: number; character: number } }
	): Promise<Hover | null> {
		const methods = this.symbolIndex.findMethodsInFile(document.uri, methodName);

		if (methods.length === 0) {
			return null;
		}

		// Take first match
		const method = methods[0];
		const isDeclarationHover = this.isMethodDeclarationHover(document, wordRange);
		const description = this.extractMethodDescription(method.documentation);
		const sections: string[] = [];

		if (description) {
			sections.push(description);
		}

		if (isDeclarationHover) {
			const usages = await this.getMethodUsagesMarkdown(methodName, document.uri);
			if (usages) {
				sections.push(usages);
			}
		}

		if (sections.length === 0) {
			return null;
		}

		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: sections.join('\n\n')
			}
		};
	}

	private async getMethodUsagesMarkdown(methodName: string, uri: string): Promise<string> {
		if (!this.referencesProvider) {
			return '';
		}

		const { total, previews } = await this.referencesProvider.getReferencePreviews(methodName, 5, false, uri);
		if (total === 0) {
			return '`USAGES` none found';
		}

		const suffix = total > previews.length ? ` (showing first ${previews.length})` : '';
		const lines = [
			`\`USAGES\` ${total} location${total === 1 ? '' : 's'}${suffix}`
		];

		for (const preview of previews) {
			lines.push(this.formatReferenceLine(preview));
		}

		return this.joinCompactLines(lines);
	}

	private getFileName(uri: string): string {
		const match = uri.match(/[/\\]([^/\\]+)$/);
		return match ? decodeURIComponent(match[1]) : uri;
	}

	private truncateLine(line: string): string {
		const maxLength = 120;
		if (line.length <= maxLength) {
			return line;
		}

		const candidate = line.slice(0, maxLength - 3);
		const boundary = candidate.search(/\s+\S*$/);
		if (boundary >= Math.floor(maxLength * 0.75)) {
			return `${candidate.slice(0, boundary)}...`;
		}
		return `${candidate}...`;
	}

	private formatReferenceLine(preview: ReferencePreview): string {
		const line = preview.location.range.start.line + 1;
		const fileName = this.getFileName(preview.location.uri);
		const target = `${preview.location.uri}#L${line}`;
		const lineText = preview.lineText ? ` - \`${this.truncateLine(preview.lineText)}\`` : '';
		return `[${fileName}:${line}](${target})${lineText}`;
	}

	private extractMethodDescription(documentation?: string): string {
		if (!documentation) {
			return '';
		}

		const lines = documentation
			.split(/\r?\n/)
			.map(line => this.cleanDocumentationLine(line))
			.filter(line => line !== '' && !this.isDocumentationNoiseLine(line));

		if (lines.length === 0) {
			return '';
		}

		const explicitDescription = this.extractDescriptionBlock(lines);
		const description = explicitDescription || lines
			.filter(line => !this.isDocumentationHeadingLine(line))
			.join(' ');

		return this.compactDescription(description);
	}

	private extractDescriptionBlock(lines: string[]): string {
		const descriptionLines: string[] = [];
		let collecting = false;

		for (const line of lines) {
			const descriptionMatch = line.match(/^(?:Description|Purpose|Summary|Synopsis)\s*:\s*(.*)$/i);
			if (descriptionMatch) {
				collecting = true;
				const inlineDescription = descriptionMatch[1].trim();
				if (inlineDescription) {
					descriptionLines.push(inlineDescription);
				}
				continue;
			}

			if (collecting && this.isDocumentationHeadingLine(line)) {
				break;
			}

			if (collecting) {
				descriptionLines.push(line);
			}
		}

		return descriptionLines.join(' ');
	}

	private cleanDocumentationLine(line: string): string {
		let cleaned = line.trim();
		let previous: string;
		do {
			previous = cleaned;
			cleaned = cleaned.replace(/^(?:--|\$p|\$\*)\s*/i, '').trim();
		} while (cleaned !== previous);

		return cleaned.replace(/\*\*/g, '').trim();
	}

	private isDocumentationNoiseLine(line: string): boolean {
		return /^[-_=]{5,}$/.test(line) ||
			/^End\s+of\s+method\s+definition\b/i.test(line);
	}

	private isDocumentationHeadingLine(line: string): boolean {
		return /^Method\s*:/i.test(line) ||
			/^Method\s+Type\b/i.test(line) ||
			/^Parameters?\s*:/i.test(line) ||
			/^Arguments?\s*:/i.test(line) ||
			/^Returns?\s*:/i.test(line) ||
			/^Examples?\s*:/i.test(line) ||
			/^Purpose\s*:/i.test(line) ||
			/^Summary\s*:/i.test(line) ||
			/^Synopsis\s*:/i.test(line) ||
			/^Usage\s*:/i.test(line) ||
			/^Notes?\s*:/i.test(line) ||
			/^See\s+Also\s*:/i.test(line) ||
			/^Author\s*:/i.test(line) ||
			/^Created\s*:/i.test(line) ||
			/^Modified\s*:/i.test(line) ||
			/^Version\s*:/i.test(line) ||
			/^Status\s*:/i.test(line) ||
			/^@/.test(line);
	}

	private compactDescription(description: string): string {
		const compact = description
			.replace(/\s+/g, ' ')
			.trim();
		if (compact.length <= 240) {
			return compact;
		}

		const candidate = compact.slice(0, 237);
		const boundary = candidate.search(/\s+\S*$/);
		if (boundary >= 180) {
			return `${candidate.slice(0, boundary)}...`;
		}
		return `${candidate}...`;
	}

	private joinCompactLines(lines: string[]): string {
		return lines.filter(line => line !== '').join('  \n');
	}

	private isMethodDeclarationHover(
		document: TextDocument,
		wordRange: { start: { line: number; character: number }; end: { line: number; character: number } }
	): boolean {
		const text = document.getText();
		const word = document.getText(wordRange);
		const methodNameOffset = document.offsetAt(wordRange.start) + (word.startsWith('.') ? 1 : 0);
		return isMethodDeclarationReference(text, methodNameOffset);
	}

	/**
	 * Get word range at position
	 */
	private getWordRangeAtPosition(document: TextDocument, position: { line: number; character: number }) {
		const text = document.getText();
		const offset = document.offsetAt(position);

		// Find word boundaries
		let start = offset;
		let end = offset;

		// Expand backwards - stop at special characters like !, $, operators, etc.
		while (start > 0 && this.isWordChar(text[start - 1]) && !this.isStopChar(text[start - 1])) {
			start--;
		}

		// Expand forwards - include method name with dot
		while (end < text.length && this.isWordChar(text[end])) {
			end++;
		}

		if (start === end) return null;

		return {
			start: document.positionAt(start),
			end: document.positionAt(end)
		};
	}

	/**
	 * Check if character is part of word (including dot for methods)
	 */
	private isWordChar(char: string): boolean {
		return /[a-zA-Z0-9_.]/.test(char);
	}

	/**
	 * Check if character should stop backwards word expansion
	 * Stops at variable prefixes (!, $), operators, delimiters, whitespace
	 */
	private isStopChar(char: string): boolean {
		return /[!$:=+\-*/<>()[\]{},;\s]/.test(char);
	}
}
