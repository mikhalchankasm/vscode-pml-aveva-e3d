import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { HoverProvider } from '../hoverProvider';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { ReferencesProvider } from '../referencesProvider';

describe('HoverProvider', () => {
	it('shows PDMS command hover only for line-start command starters', async () => {
		const document = TextDocument.create(
			'file:///pdms-hover.pml',
			'pml',
			1,
			[
				'MOVE N45E DIST 1500',
				'!result = move'
			].join('\n')
		);
		const provider = new HoverProvider({ findMethodsInFile: () => [] } as any);

		const commandHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 1 } }, document);
		const expressionHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 11 } }, document);

		expect(commandHover?.contents).toMatchObject({
			kind: 'markdown',
			value: expect.stringContaining('PDMS Command: MOVE')
		});
		expect(expressionHover).toBeNull();
	});

	it('does not show PDMS command hover inside comments', async () => {
		const document = TextDocument.create(
			'file:///pdms-hover-comments.pml',
			'pml',
			1,
			[
				'-- MOVE N45E DIST 1500',
				'$* MOVE N45E DIST 1500',
				'$(',
				'MOVE N45E DIST 1500',
				'$)',
				'MOVE N45E DIST 1500'
			].join('\n')
		);
		const provider = new HoverProvider({ findMethodsInFile: () => [] } as any);

		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 4 } }, document)).resolves.toBeNull();
		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 4 } }, document)).resolves.toBeNull();
		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 3, character: 1 } }, document)).resolves.toBeNull();
		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 5, character: 1 } }, document)).resolves.not.toBeNull();
	});

	it('does not treat comment markers inside strings as active hover comments', async () => {
		const document = TextDocument.create(
			'file:///hover-string-comment-markers.pml',
			'pml',
			1,
			[
				'!text = "-- not a comment" !current = !!CE',
				'!macro = "$* not a comment" !current = !!CE',
				'!block = "$( not a comment $)" !current = !!CE'
			].join('\n')
		);
		const provider = new HoverProvider({} as any);

		const dashHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 40 } }, document);
		const dollarHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 41 } }, document);
		const blockHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 2, character: 44 } }, document);

		expect(String((dashHover?.contents as any).value)).toContain('`!!CE`');
		expect(String((dollarHover?.contents as any).value)).toContain('`!!CE`');
		expect(String((blockHover?.contents as any).value)).toContain('`!!CE`');
	});

	it('does not show hover help inside string literals', async () => {
		const document = TextDocument.create(
			'file:///hover-inactive-strings.pml',
			'pml',
			1,
			[
				'!text = "!!CE"',
				'!pipe = |!item.Attribute(|',
				'!quote = \'!!collectallfor\''
			].join('\n')
		);
		const provider = new HoverProvider({} as any);

		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 11 } }, document)).resolves.toBeNull();
		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 15 } }, document)).resolves.toBeNull();
		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 2, character: 12 } }, document)).resolves.toBeNull();
	});

	it('shows PDMS command hover for dollar-prefixed starters', async () => {
		const document = TextDocument.create(
			'file:///pdms-hover-dollar.pml',
			'pml',
			1,
			'$m "%PMLLIB%/command.pmlmac"'
		);
		const provider = new HoverProvider({} as any);

		const hover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 1 } }, document);

		expect(hover?.contents).toMatchObject({
			kind: 'markdown',
			value: expect.stringContaining('PDMS Command: $M')
		});
		expect(hover?.range).toEqual({
			start: { line: 0, character: 0 },
			end: { line: 0, character: 2 }
		});
	});

	it('shows PDMS command hover for selected Common Commands starters', async () => {
		const document = TextDocument.create(
			'file:///pdms-hover-common.pml',
			'pml',
			1,
			'SPECONMODE'
		);
		const provider = new HoverProvider({} as any);

		const hover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 1 } }, document);

		expect(hover?.contents).toMatchObject({
			kind: 'markdown',
			value: expect.stringContaining('PDMS Command: SPECONMODE')
		});
		expect(String((hover?.contents as any).value)).toContain('Specon command mode');
	});

	it('shows focused hover help for Q ATT query attribute commands', async () => {
		const document = TextDocument.create(
			'file:///q-att-hover.pml',
			'pml',
			1,
			[
				'Q ATT AS :PROCESS',
				'!value = q',
				'-- Q ATT AS :PROCESS'
			].join('\n')
		);
		const provider = new HoverProvider({} as any);

		const hover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 0 } }, document);
		const expressionHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 9 } }, document);
		const commentHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 2, character: 3 } }, document);
		const value = String((hover?.contents as any).value);

		expect(value).toContain('PDMS Command: Q');
		expect(value).toContain('Q ATT [AS ANY | <type>]');
		expect(value).toContain(':LOCAL\\:PROCESS');
		expect(value).toContain('[2]');
		expect(expressionHover).toBeNull();
		expect(commentHover).toBeNull();
	});

	it('shows compact hover help for the built-in !!CE DBREF variable', async () => {
		const document = TextDocument.create(
			'file:///dbref-hover.pml',
			'pml',
			1,
			[
				'!current = !!CE',
				'-- !!CE'
			].join('\n')
		);
		const provider = new HoverProvider({} as any);

		const hover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 13 } }, document);
		const commentHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 5 } }, document);
		const value = String((hover?.contents as any).value);

		expect(value).toContain('`!!CE`');
		expect(value).toContain('Type: `DBREF`');
		expect(value).toContain('Current Element');
		expect(hover?.range).toEqual({
			start: { line: 0, character: 11 },
			end: { line: 0, character: 15 }
		});
		expect(commentHover).toBeNull();
	});

	it('shows hover help for selected ELEMENTTYPE metadata methods', async () => {
		const document = TextDocument.create(
			'file:///elementtype-hover.pml',
			'pml',
			1,
			'!base = !elementType.SystemType()'
		);
		const provider = new HoverProvider({} as any);

		const hover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 23 } }, document);
		const value = String((hover?.contents as any).value);

		expect(value).toContain('ELEMENTTYPE.SystemType()');
		expect(value).toContain('ELEMENTTYPE');
		expect(value).toContain('base system element type');
	});

	it('shows hover help for selected DBREF object methods', async () => {
		const document = TextDocument.create(
			'file:///dbref-method-hover.pml',
			'pml',
			1,
			[
				'!name = !element.Attribute(|NAME|)',
				'!invalid = !element.BadRef()',
				'!count = !element.MCount(|BRAN|)',
				'!element.Delete()'
			].join('\n')
		);
		const provider = new HoverProvider({} as any);

		const attributeHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 18 } }, document);
		const badRefHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 21 } }, document);
		const mcountHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 2, character: 20 } }, document);
		const deleteHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 3, character: 11 } }, document);

		expect(String((attributeHover?.contents as any).value)).toContain('DBREF.attribute(name)');
		expect(String((badRefHover?.contents as any).value)).toContain('invalid or cannot be navigated');
		expect(String((mcountHover?.contents as any).value)).toContain('Counts members');
		const deleteValue = String((deleteHover?.contents as any).value);
		expect(deleteValue).toContain('PML DBREF object');
		expect(deleteValue).not.toContain('Deletes the database element');
	});

	it('shows hover help for selected ATTRIBUTE metadata methods', async () => {
		const document = TextDocument.create(
			'file:///attribute-method-hover.pml',
			'pml',
			1,
			[
				'!isPseudo = !attribute.IsPseudo()',
				'!values = !attribute.ValidValues(!elementType)',
				'!hidden = !attribute.Hidden()'
			].join('\n')
		);
		const provider = new HoverProvider({ findMethodsInFile: () => [] } as any);

		const isPseudoHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 24 } }, document);
		const validValuesHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 22 } }, document);
		const hiddenHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 2, character: 22 } }, document);
		const nameDocument = TextDocument.create('file:///attribute-name-hover.pml', 'pml', 1, '!name = !attribute.Name()');
		const nameHover = await provider.provide({
			textDocument: { uri: nameDocument.uri },
			position: { line: 0, character: 20 }
		}, nameDocument);

		expect(String((isPseudoHover?.contents as any).value)).toContain('ATTRIBUTE.IsPseudo()');
		expect(String((isPseudoHover?.contents as any).value)).toContain('pseudo attribute');
		expect(String((validValuesHover?.contents as any).value)).toContain('ATTRIBUTE.ValidValues(elementType)');
		expect(String((validValuesHover?.contents as any).value)).toContain('valid text values');
		expect(String((hiddenHover?.contents as any).value)).toContain('Q ATT output');
		expect(nameHover).toBeNull();
	});

	it('shows compact user method descriptions and declaration usages', async () => {
		const document = TextDocument.create(
			'file:///forms/Main.pmlfrm',
			'pml',
			1,
			[
				'define method .NavigateTo(!target is STRING)',
				'endmethod',
				'!this.NavigateTo(!target)'
			].join('\n')
		);
		let previewScopeUri = '';
		const provider = new HoverProvider(
			{
				findMethodsInFile: (uri: string, name: string) => uri === document.uri && name === 'NavigateTo'
					? [{
						name: 'NavigateTo',
						uri: document.uri,
						range: {
							start: { line: 0, character: 0 },
							end: { line: 1, character: 9 }
						},
						parameters: ['target'],
						parameterTypes: [{ kind: 'STRING' }],
						returnType: { kind: 'BOOLEAN' },
						documentation: [
							'End of method definition for .RunCommand() ----------------------------------------------------------------------',
							'Method: NavigateTo',
							'-- $P Description:',
							'-- $P Moves the active selection to the requested target.',
							'-- $P Method Type: Action',
							'-- @target - Target name'
						].join('\n')
					}]
					: []
			} as any,
			{
				getReferencePreviews: async (_name: string, _limit: number, _includeDeclaration: boolean, fileUri?: string) => {
					previewScopeUri = fileUri ?? '';
					return {
						total: 1,
						previews: [
							{
								location: {
									uri: document.uri,
									range: {
										start: { line: 2, character: 6 },
										end: { line: 2, character: 16 }
									}
								},
								lineText: '!this.NavigateTo(!target)'
							}
						]
					};
				}
			}
		);

		const hover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 16 } }, document);
		const value = String((hover?.contents as any).value);
		const callHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 2, character: 9 } }, document);
		const callValue = String((callHover?.contents as any).value);

		expect(value.startsWith('`.NavigateTo(!target is STRING) is BOOLEAN`\n\nMoves the active selection to the requested target.')).toBe(true);
		expect(value).toContain('Moves the active selection to the requested target.\n\n`USAGES` 1 location');
		expect(value).toContain('`USAGES` 1 location');
		expect(value).toContain('[Main.pmlfrm:3]');
		expect(value).toContain('`!this.NavigateTo(!target)`');
		expect(value).not.toContain('[Other.pmlfrm');
		expect(previewScopeUri).toBe(document.uri);
		expect(value).toContain('`.NavigateTo(!target is STRING) is BOOLEAN`');
		expect(value).not.toContain('`PARAMS`');
		expect(value).not.toContain('`DOC`');
		expect(value).not.toContain('`DEFINED`');
		expect(value).not.toContain('End of method definition');
		expect(value).not.toContain('Method Type');
		expect(value).not.toContain('Method: NavigateTo');
		expect(value).not.toContain('$P');
		expect(value).not.toContain('@target');
		expect(callValue).toBe('`.NavigateTo(!target is STRING) is BOOLEAN`\n\nMoves the active selection to the requested target.');
		expect(callValue).not.toContain('`DEFINED`');
		expect(callValue).not.toContain('`USAGES`');
		expect(value).not.toContain('###');
		expect(value).not.toContain('```');
		expect(value).not.toContain('|-');
	});

	it('does not show hover documentation from another file with the same method name', async () => {
		const uri = 'file:///forms/Main.pmlfrm';
		const otherUri = 'file:///forms/Other.pmlfrm';
		const source = [
			'-- $P Description: Current form refresh.',
			'define method .Refresh()',
			'endmethod',
			'!this.Refresh()'
		].join('\n');
		const otherSource = [
			'-- $P Description: Other form refresh.',
			'define method .Refresh()',
			'endmethod'
		].join('\n');
		const parser = new Parser();
		const currentResult = parser.parse(source);
		const otherResult = parser.parse(otherSource);
		expect(currentResult.errors).toHaveLength(0);
		expect(otherResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, currentResult.ast, 1, source);
		symbolIndex.indexFile(otherUri, otherResult.ast, 1, otherSource);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new HoverProvider(symbolIndex);

		const hover = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.lastIndexOf('Refresh'))
		}, document);
		const value = String((hover?.contents as any).value);

		expect(value).toContain('Current form refresh.');
		expect(value).not.toContain('Other form refresh.');
	});

	it('shows compact global function descriptions and declaration usages', async () => {
		const uri = 'file:///functions.pmlfnc';
		const source = [
			'-- $P Description: Builds report data.',
			'define function !!BuildReport(!items is ARRAY) is ARRAY',
			'	return !items',
			'endfunction',
			'',
			'!result = !!BuildReport(!items)'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const documents = {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		};
		const referencesProvider = new ReferencesProvider(symbolIndex, documents as any);
		const provider = new HoverProvider(symbolIndex, referencesProvider);

		const declarationHover = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.indexOf('BuildReport'))
		}, document);
		const callHover = await provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.lastIndexOf('BuildReport'))
		}, document);

		const declarationValue = String((declarationHover?.contents as any).value);
		const callValue = String((callHover?.contents as any).value);

		expect(declarationValue).toContain('Builds report data.');
		expect(declarationValue).toContain('`!!BuildReport(!items is ARRAY) is ARRAY`');
		expect(declarationValue).toContain('`USAGES` 1 location');
		expect(declarationValue).toContain('[functions.pmlfnc:6]');
		expect(callValue).toBe('`!!BuildReport(!items is ARRAY) is ARRAY`\n\nBuilds report data.');
	});

	it('shows an indexed typed signature even without documentation', async () => {
		const uri = 'file:///typed-signature-hover.pml';
		const source = [
			'define method .items(!limit is REAL) is ARRAY',
			'endmethod',
			'.items(10)'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const hover = await new HoverProvider(symbolIndex).provide({
			textDocument: { uri },
			position: document.positionAt(source.lastIndexOf('items'))
		}, document);

		expect(String((hover?.contents as any).value)).toBe('`.items(!limit is REAL) is ARRAY`');
	});
});
