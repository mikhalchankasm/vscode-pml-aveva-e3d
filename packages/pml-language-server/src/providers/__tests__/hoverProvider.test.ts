import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { HoverProvider } from '../hoverProvider';

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
		const provider = new HoverProvider({} as any);

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
		const provider = new HoverProvider({} as any);

		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 4 } }, document)).resolves.toBeNull();
		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 1, character: 4 } }, document)).resolves.toBeNull();
		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 3, character: 1 } }, document)).resolves.toBeNull();
		await expect(provider.provide({ textDocument: { uri: document.uri }, position: { line: 5, character: 1 } }, document)).resolves.not.toBeNull();
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

	it('shows user method usages on declaration hover and definition links on call hover', async () => {
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
		const longUsage = '|!!Main.NavigateTo(!target, !source, !destination, !mode, !context, !selection)|';
		const provider = new HoverProvider(
			{
				findMethod: (name: string) => name === 'NavigateTo'
					? [{
						name: 'NavigateTo',
						uri: document.uri,
						range: {
							start: { line: 0, character: 0 },
							end: { line: 1, character: 9 }
						},
						parameters: ['target'],
						documentation: undefined
					}]
					: []
			} as any,
			{
				getReferencePreviews: async () => ({
					total: 2,
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
						},
						{
							location: {
								uri: 'file:///forms/Other.pmlfrm',
								range: {
									start: { line: 10, character: 8 },
									end: { line: 10, character: 18 }
								}
							},
							lineText: longUsage
						}
					]
				})
			}
		);

		const hover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 0, character: 16 } }, document);
		const value = String((hover?.contents as any).value);
		const callHover = await provider.provide({ textDocument: { uri: document.uri }, position: { line: 2, character: 9 } }, document);
		const callValue = String((callHover?.contents as any).value);

		expect(value).toContain('`.NavigateTo(!target)`');
		expect(value).toContain('`PARAMS` `!target`');
		expect(value).toContain('`USAGES` 2 locations');
		expect(value).toContain('[Main.pmlfrm:3]');
		expect(value).toContain('[Other.pmlfrm:11]');
		expect(value).toContain('`!this.NavigateTo(!target)`');
		expect(value).toContain(`\`${longUsage}\``);
		expect(value).not.toContain('`DEFINED`');
		expect(callValue).toContain('`.NavigateTo(!target)`');
		expect(callValue).toContain('`PARAMS` `!target`');
		expect(callValue).toContain('`DEFINED` [Main.pmlfrm:1](file:///forms/Main.pmlfrm#L1)');
		expect(callValue).not.toContain('`USAGES`');
		expect(value).not.toContain('###');
		expect(value).not.toContain('```');
		expect(value).not.toContain('|-');
	});
});
