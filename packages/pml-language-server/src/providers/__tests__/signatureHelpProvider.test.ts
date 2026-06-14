import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { SignatureHelpProvider } from '../signatureHelpProvider';

describe('SignatureHelpProvider', () => {
	it('indexes method parameter names without PML markers', () => {
		const uri = 'file:///signature-index.pml';
		const definitions = [
			'define method .resize(!width is REAL, !height is REAL)',
			'endmethod'
		].join('\n');
		const result = new Parser().parse(definitions);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, definitions);

		const method = symbolIndex.findMethod('resize')[0];
		expect(method.parameters).toEqual(['width', 'height']);
		expect(method.signature).toBe('.resize(!width, !height)');
	});

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

	it('shows PML parameter markers for indexed global function signatures', () => {
		const uri = 'file:///function-signature.pmlfnc';
		const definitions = [
			'define function !!ProcessItems(!items is ARRAY, !mode is STRING)',
			'endfunction'
		].join('\n');
		const result = new Parser().parse(definitions);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, definitions);

		const source = `${definitions}\n\n!result = !!ProcessItems(!items, `;
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new SignatureHelpProvider(symbolIndex);

		const help = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(help).not.toBeNull();
		expect(help?.activeParameter).toBe(1);
		expect(help?.signatures[0]).toMatchObject({
			label: '!!ProcessItems(!items, !mode)',
			parameters: [
				{ label: '!items' },
				{ label: '!mode' }
			]
		});
	});


	it('does not show signatures from another file with the same method name', () => {
		const uri = 'file:///signature-current.pml';
		const otherUri = 'file:///signature-other.pml';
		const currentDefinitions = [
			'define method .refresh(!target is STRING)',
			'endmethod'
		].join('\n');
		const otherDefinitions = [
			'define method .refresh(!width is REAL, !height is REAL)',
			'endmethod'
		].join('\n');
		const parser = new Parser();
		const currentResult = parser.parse(currentDefinitions);
		const otherResult = parser.parse(otherDefinitions);
		expect(currentResult.errors).toHaveLength(0);
		expect(otherResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, currentResult.ast, 1, currentDefinitions);
		symbolIndex.indexFile(otherUri, otherResult.ast, 1, otherDefinitions);

		const source = `${currentDefinitions}\n\n!this.refresh(`;
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new SignatureHelpProvider(symbolIndex);

		const help = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(help?.signatures.map(signature => signature.label)).toEqual([
			'.refresh(!target)'
		]);
	});


	it('selects the overload that covers the active argument', () => {
		const uri = 'file:///signature-overloads.pml';
		const definitions = [
			'define object Box',
			'	define method .resize(!width is REAL)',
			'	endmethod',
			'	define method .resize(!width is REAL, !height is REAL)',
			'	endmethod',
			'endobject'
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

		expect(help?.activeSignature).toBe(1);
		expect(help?.activeParameter).toBe(1);
		expect(help?.signatures.map(signature => signature.label)).toEqual([
			'.resize(!width)',
			'.resize(!width, !height)'
		]);
	});

	it('keeps the active parameter inside the selected signature range', () => {
		const uri = 'file:///signature-overrun.pml';
		const definitions = [
			'define method .resize(!width is REAL, !height is REAL)',
			'endmethod'
		].join('\n');
		const result = new Parser().parse(definitions);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, definitions);

		const source = `${definitions}\n\n!this.resize(10, 20, `;
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new SignatureHelpProvider(symbolIndex);

		const help = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(help?.activeSignature).toBe(0);
		expect(help?.activeParameter).toBe(1);
	});

	it('keeps zero-parameter signatures selectable at the opening parenthesis', () => {
		const uri = 'file:///signature-zero-param.pml';
		const definitions = [
			'define method .ping()',
			'endmethod'
		].join('\n');
		const result = new Parser().parse(definitions);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, definitions);

		const source = `${definitions}\n\n!this.ping(`;
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new SignatureHelpProvider(symbolIndex);

		const help = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(help?.activeSignature).toBe(0);
		expect(help?.activeParameter).toBe(0);
		expect(help?.signatures[0]).toMatchObject({
			label: '.ping()',
			parameters: []
		});
	});
});
