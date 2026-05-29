import { describe, expect, it } from 'vitest';
import { CompletionItemKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionProvider } from '../completionProvider';
import { SymbolIndex } from '../../index/symbolIndex';
import { Parser } from '../../parser/parser';

describe('CompletionProvider', () => {
	it('suggests current form methods after !this without built-in method noise', () => {
		const source = [
			'setup form !!TestForm dialog',
			'exit',
			'',
			'define method .refresh(!target is STRING)',
			'endmethod',
			'',
			'!this.'
		].join('\n');
		const document = TextDocument.create('file:///test.pmlfrm', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.map(item => item.label)).toEqual(['.refresh']);
		expect(completions[0]).toMatchObject({
			kind: CompletionItemKind.Event,
			detail: 'Form method (!target)',
			insertText: 'refresh',
			filterText: 'refresh'
		});
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
	});

	it('suggests built-in methods for non-!this receivers in form files', () => {
		const source = [
			'setup form !!TestForm dialog',
			'exit',
			'',
			'define method .refresh()',
			'endmethod',
			'',
			'!attr = object attribute(|XLEN|)',
			'!attr.'
		].join('\n');
		const document = TextDocument.create('file:///test.pmlfrm', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.find(item => item.label === '.refresh')).toMatchObject({
			kind: CompletionItemKind.Event,
			detail: 'Form method'
		});
		expect(completions.find(item => item.label === 'ispseudo')).toMatchObject({
			kind: CompletionItemKind.Method,
			detail: 'ATTRIBUTE -> BOOLEAN'
		});
		expect(completions.find(item => item.label === 'validvalues')).toMatchObject({
			kind: CompletionItemKind.Method,
			detail: 'ATTRIBUTE -> STRING[]'
		});
		expect(completions.some(item => item.label === 'upcase')).toBe(true);
	});

	it('suggests methods after indexed and dynamic member receivers', () => {
		const source = [
			'define method .refresh(!target is STRING)',
			'endmethod',
			'',
			'!items[1].'
		].join('\n');
		const document = TextDocument.create('file:///test.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === '.refresh')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(true);

		const dynamicSource = '$!<formName>.';
		const dynamicDocument = TextDocument.create('file:///dynamic.pml', 'pml', 1, dynamicSource);
		const dynamicCompletions = provider.provide({
			textDocument: { uri: dynamicDocument.uri },
			position: dynamicDocument.positionAt(dynamicSource.length)
		}, dynamicDocument);

		expect(dynamicCompletions.some(item => item.label === 'upcase')).toBe(true);

		const numericPathSource = '!path.SREF.1.';
		const numericPathDocument = TextDocument.create('file:///numeric-path.pml', 'pml', 1, numericPathSource);
		const numericPathCompletions = provider.provide({
			textDocument: { uri: numericPathDocument.uri },
			position: numericPathDocument.positionAt(numericPathSource.length)
		}, numericPathDocument);

		expect(numericPathCompletions.some(item => item.label === 'upcase')).toBe(true);

		const chainSource = '!obj.field.subfield.';
		const chainDocument = TextDocument.create('file:///member-chain.pml', 'pml', 1, chainSource);
		const chainCompletions = provider.provide({
			textDocument: { uri: chainDocument.uri },
			position: chainDocument.positionAt(chainSource.length)
		}, chainDocument);

		expect(chainCompletions.some(item => item.label === 'upcase')).toBe(true);
	});

	it('suggests selected ELEMENTTYPE metadata methods after member receivers', () => {
		const source = '!elementType.';
		const document = TextDocument.create('file:///elementtype-completion.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.find(item => item.label === 'isudet')).toMatchObject({
			detail: 'ELEMENTTYPE -> BOOLEAN'
		});
		expect(completions.find(item => item.label === 'systemtype')).toMatchObject({
			detail: 'ELEMENTTYPE -> ELEMENTTYPE'
		});
		expect(completions.find(item => item.label === 'membertypes')).toMatchObject({
			detail: 'ELEMENTTYPE -> ELEMENTTYPE[]'
		});
		expect(completions.some(item => item.label === 'name')).toBe(false);
	});

	it('suggests selected DBREF object methods after member receivers', () => {
		const source = '!element.';
		const document = TextDocument.create('file:///dbref-completion.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.find(item => item.label === 'attribute')).toMatchObject({
			detail: 'DBREF -> ANY',
			insertText: 'attribute(|$1|)$0'
		});
		expect(completions.find(item => item.label === 'attributes')).toMatchObject({
			detail: 'DBREF -> STRING[]'
		});
		expect(completions.find(item => item.label === 'badref')).toMatchObject({
			detail: 'DBREF -> BOOLEAN'
		});
		expect(completions.find(item => item.label === 'mcount')).toMatchObject({
			detail: 'DBREF -> REAL'
		});
		expect(completions.find(item => item.label === 'line')).toMatchObject({
			detail: 'DBREF -> LINE'
		});
		expect(completions.find(item => item.label === 'delete')).toMatchObject({
			detail: 'DBREF -> NO RESULT'
		});
	});

	it('suggests selected ATTRIBUTE metadata methods after member receivers', () => {
		const source = '!attribute.';
		const document = TextDocument.create('file:///attribute-completion.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.find(item => item.label === 'ispseudo')).toMatchObject({
			detail: 'ATTRIBUTE -> BOOLEAN'
		});
		expect(completions.find(item => item.label === 'isuda')).toMatchObject({
			detail: 'ATTRIBUTE -> BOOLEAN'
		});
		expect(completions.find(item => item.label === 'validvalues')).toMatchObject({
			detail: 'ATTRIBUTE -> STRING[]',
			insertText: 'validValues($1)$0'
		});
		expect(completions.find(item => item.label === 'defaultvalue')).toMatchObject({
			detail: 'ATTRIBUTE -> STRING',
			insertText: 'defaultValue($1)$0'
		});
		expect(completions.find(item => item.label === 'hidden')).toMatchObject({
			detail: 'ATTRIBUTE -> BOOLEAN'
		});
		expect(completions.some(item => item.label === 'name')).toBe(false);
		expect(completions.some(item => item.label === 'type')).toBe(false);
	});

	it('formats workspace method parameters with PML markers', () => {
		const uri = 'file:///workspace-completion.pml';
		const source = [
			'define method .refresh(!target is STRING, !count is REAL)',
			'endmethod',
			'',
			're'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new CompletionProvider(symbolIndex);

		const completions = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.find(item => item.label === '.refresh')).toMatchObject({
			detail: 'Method (!target, !count)'
		});
	});

	it('does not treat non-member dots as member completion receivers', () => {
		const provider = new CompletionProvider(new SymbolIndex());
		const sources = [
			'define method .',
			'foo.',
			'-- !comment.',
			"'!string.",
			'|!pipeString.'
		];

		for (const source of sources) {
			const document = TextDocument.create('file:///non-member-dot.pml', 'pml', 1, source);
			const completions = provider.provide({
				textDocument: { uri: document.uri },
				position: document.positionAt(source.length)
			}, document);

			expect(completions, source).toEqual([]);
		}
	});
});
