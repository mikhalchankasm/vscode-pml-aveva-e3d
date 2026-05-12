import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { SignatureHelpProvider } from '../signatureHelpProvider';

describe('SignatureHelpProvider', () => {
	it('shows PML parameter markers and active argument for indexed method signatures', () => {
		const uri = 'file:///signature.pml';
		const definitions = [
			'define method .resize(!width is REAL, !height is REAL)',
			'endmethod'
		].join('\n');
		const result = new Parser().parse(definitions);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, definitions);

		const source = `${definitions}\n\n!this.resize(10, `;
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new SignatureHelpProvider(symbolIndex);

		const help = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(help).not.toBeNull();
		expect(help?.activeParameter).toBe(1);
		expect(help?.signatures[0]).toMatchObject({
			label: '.resize(!width, !height)',
			parameters: [
				{ label: '!width' },
				{ label: '!height' }
			]
		});
	});
});
