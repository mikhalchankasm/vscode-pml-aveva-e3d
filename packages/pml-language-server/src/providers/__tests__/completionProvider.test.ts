import { describe, expect, it } from 'vitest';
import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node';
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
			detail: 'Form method (!target is STRING)',
			insertText: 'refresh(${1:!target})$0',
			insertTextFormat: InsertTextFormat.Snippet,
			filterText: 'refresh'
		});
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
	});

	it('filters built-in methods for typed non-!this receivers in form files', () => {
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
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
	});

	it('keeps built-in fallback methods for untyped non-!this receivers in form files', () => {
		const source = [
			'setup form !!TestForm dialog',
			'exit',
			'',
			'define method .refresh()',
			'endmethod',
			'',
			'!unknown.'
		].join('\n');
		const document = TextDocument.create('file:///untyped-form-receiver.pmlfrm', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.find(item => item.label === '.refresh')).toMatchObject({
			kind: CompletionItemKind.Event,
			detail: 'Form method'
		});
		expect(completions.some(item => item.label === 'upcase')).toBe(true);
		expect(completions.some(item => item.label === 'qreal')).toBe(true);
	});

	it('preserves typed callable details in the unindexed document fallback', () => {
		const source = [
			'define method .build(!name is STRING) is ARRAY',
			'endmethod',
			'!receiver.'
		].join('\n');
		const document = TextDocument.create('file:///fallback-signature.pml', 'pml', 1, source);
		const completions = new CompletionProvider(new SymbolIndex()).provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.find(item => item.label === '.build')).toMatchObject({
			detail: 'Method (!name is STRING) → ARRAY'
		});
	});

	it('does not treat DBREF attribute value calls as ATTRIBUTE object receivers', () => {
		const source = [
			'!val = !ce.attribute(|XLEN|)',
			'!val.'
		].join('\n');
		const document = TextDocument.create('file:///attribute-value-call.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'upcase')).toBe(true);
		expect(completions.some(item => item.label === 'qreal')).toBe(true);
	});

	it('suggests form members, frames, and gadgets after !this in form files', () => {
		const uri = 'file:///form-members.pmlfrm';
		const source = [
			'setup form !!TestForm dialog',
			'	member .title is STRING',
			'	button .btnApply |Apply| callback |!this.apply()|',
			'	frame .main',
			'		text .nameField |20|',
			'	exit',
			'exit',
			'',
			'define method .apply()',
			'endmethod',
			'',
			'!this.'
		].join('\n');
		const parser = new Parser();
		const parseResult = parser.parse(source, { mode: 'form' });
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new CompletionProvider(symbolIndex);

		const completions = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.find(item => item.label === '.apply')).toMatchObject({
			kind: CompletionItemKind.Event,
			detail: 'Form method'
		});
		expect(completions.find(item => item.label === '.title')).toMatchObject({
			kind: CompletionItemKind.Property,
			detail: 'Form member STRING'
		});
		expect(completions.find(item => item.label === '.btnApply')).toMatchObject({
			kind: CompletionItemKind.Field,
			detail: 'button gadget'
		});
		expect(completions.find(item => item.label === '.main')).toMatchObject({
			kind: CompletionItemKind.Field,
			detail: 'frame'
		});
		expect(completions.find(item => item.label === '.nameField')).toMatchObject({
			kind: CompletionItemKind.Field,
			detail: 'text gadget'
		});
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
	});

	it('filters member completions by indexed form member type after !this.member', () => {
		const uri = 'file:///form-member-type.pmlfrm';
		const source = [
			'setup form !!TestForm dialog',
			'	member .title is STRING',
			'	member .items is ARRAY',
			'exit',
			'',
			'define method .refresh()',
			'	!this.title.',
			'endmethod'
		].join('\n');
		const parser = new Parser();
		const parseResult = parser.parse(source, { mode: 'form' });
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new CompletionProvider(symbolIndex);
		const position = document.positionAt(source.indexOf('!this.title.') + '!this.title.'.length);

		const completions = provider.provide({
			textDocument: { uri },
			position
		}, document);

		expect(completions.some(item => item.label === 'upcase')).toBe(true);
		expect(completions.some(item => item.label === 'substring')).toBe(true);
		expect(completions.some(item => item.label === 'append')).toBe(false);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
	});

	it('filters member completions by text form member type before indexing catches up', () => {
		const source = [
			'setup form !!TestForm dialog',
			'	member .items is ARRAY',
			'exit',
			'',
			'define method .refresh()',
			'	!this.items.',
			'endmethod'
		].join('\n');
		const document = TextDocument.create('file:///unindexed-form-member-type.pmlfrm', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());
		const position = document.positionAt(source.indexOf('!this.items.') + '!this.items.'.length);

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'size')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
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

	it('filters built-in member completions for explicit STRING receivers', () => {
		const source = [
			'define method .format(!name is STRING)',
			'	!name.'
		].join('\n');
		const document = TextDocument.create('file:///string-completion.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'upcase')).toBe(true);
		expect(completions.some(item => item.label === 'substring')).toBe(true);
		expect(completions.some(item => item.label === 'append')).toBe(false);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
	});

	it('does not suggest keywords or statement snippets after a member receiver', () => {
		const source = '!value.';
		const document = TextDocument.create('file:///member-context.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'define')).toBe(false);
		expect(completions.some(item => item.label === 'if')).toBe(false);
		expect(completions.some(item => item.kind === CompletionItemKind.Snippet)).toBe(false);
	});

	it('filters built-in member completions for obvious ARRAY constructors', () => {
		const source = [
			'!items = object ARRAY()',
			'!items.'
		].join('\n');
		const document = TextDocument.create('file:///array-completion.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'size')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
	});

	it('filters built-in member completions through a direct variable alias', () => {
		const source = [
			'!items = object ARRAY()',
			'!working = !items',
			'!working.'
		].join('\n');
		const document = TextDocument.create('file:///alias-array-completion.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'size')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
	});

	it('filters member completions from an explicit global function return type', () => {
		const uri = 'file:///function-result-completion.pml';
		const source = [
			'define function !!newItems() is ARRAY',
			'endfunction',
			'!items = !!newItems()',
			'!items.'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const completions = new CompletionProvider(symbolIndex).provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
	});

	it('filters member completions from an explicit local method return type', () => {
		const uri = 'file:///method-result-completion.pml';
		const source = [
			'define method .label() is STRING',
			'endmethod',
			'!value = !this.label()',
			'!value.'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const completions = new CompletionProvider(symbolIndex).provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'upcase')).toBe(true);
		expect(completions.some(item => item.label === 'append')).toBe(false);
	});

	it('filters member completions directly after a typed global function call', () => {
		const uri = 'file:///direct-function-result-completion.pml';
		const source = [
			'define function !!newItems() is ARRAY',
			'endfunction',
			'!!newItems().'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const completions = new CompletionProvider(symbolIndex).provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
	});

	it('filters member completions directly after a typed method call with nested arguments', () => {
		const uri = 'file:///direct-method-result-completion.pml';
		const source = [
			'define method .label(!value is REAL) is STRING',
			'endmethod',
			'!this.label(.other(1, 2)).'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const completions = new CompletionProvider(symbolIndex).provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'upcase')).toBe(true);
		expect(completions.some(item => item.label === 'append')).toBe(false);
	});

	it('propagates receiver types through a typed user call and built-in call chain', () => {
		const uri = 'file:///chained-call-completion.pml';
		const source = [
			'define function !!element() is DBREF',
			'endfunction',
			'!!element().query(|NAME|).'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const completions = new CompletionProvider(symbolIndex).provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'upcase')).toBe(true);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
	});

	it('uses a known variable receiver type before same-name user methods', () => {
		const uri = 'file:///built-in-method-collision.pml';
		const source = [
			'define method .upcase() is ARRAY',
			'endmethod',
			'!value = |name|',
			'!value.upcase().'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const completions = new CompletionProvider(symbolIndex).provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'trim')).toBe(true);
		expect(completions.some(item => item.label === 'append')).toBe(false);
	});

	it('does not chain a line-leading dot onto a call from the previous line', () => {
		const uri = 'file:///line-leading-dot-completion.pml';
		const definitions = 'define function !!newItems() is ARRAY\nendfunction';
		const result = new Parser().parse(definitions);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, definitions);
		const source = `${definitions}\n!!newItems()\n.`;
		const document = TextDocument.create(uri, 'pml', 1, source);
		const completions = new CompletionProvider(symbolIndex).provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions).toEqual([]);
	});

	it('filters direct constructor-call completions', () => {
		const source = 'ARRAY().';
		const document = TextDocument.create('file:///constructor-chain.pml', 'pml', 1, source);
		const completions = new CompletionProvider(new SymbolIndex()).provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
	});

	it('keeps direct-call completions broad for ambiguous return types', () => {
		const uri = 'file:///ambiguous-direct-call-completion.pml';
		const source = [
			'define function !!load() is STRING',
			'endfunction',
			'define function !!load() is ARRAY',
			'endfunction',
			'!!load().'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const completions = new CompletionProvider(symbolIndex).provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(true);
	});

	it('does not retain a stale receiver type after an ambiguous user call', () => {
		const uri = 'file:///ambiguous-result-completion.pml';
		const source = [
			'define function !!load() is STRING',
			'endfunction',
			'define function !!load() is ARRAY',
			'endfunction',
			'!value = object ARRAY()',
			'!value = !!load()',
			'!value.'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const completions = new CompletionProvider(symbolIndex).provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(true);
	});

	it('does not treat equality comparisons as assignments', () => {
		const source = [
			'!items = object ARRAY()',
			'if !items == 2 then',
			'endif',
			'!items.'
		].join('\n');
		const document = TextDocument.create('file:///comparison-completion.pml', 'pml', 1, source);
		const completions = new CompletionProvider(new SymbolIndex()).provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
	});

	it('clears a receiver type after an unrecognized reassignment', () => {
		const source = [
			'!value = object ARRAY()',
			'!value = !value + 1',
			'!value.'
		].join('\n');
		const document = TextDocument.create('file:///unknown-reassignment-completion.pml', 'pml', 1, source);
		const completions = new CompletionProvider(new SymbolIndex()).provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(true);
	});

	it('prefers the latest direct alias over an earlier receiver assignment', () => {
		const source = [
			'!items = object ARRAY()',
			'!working = |temporary value|',
			'!working = !items',
			'!working.'
		].join('\n');
		const document = TextDocument.create('file:///latest-alias-completion.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'size')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
	});

	it('filters built-in member completions through a typed form member alias', () => {
		const source = [
			'setup form !!TestForm dialog',
			'\tmember .items is ARRAY',
			'exit',
			'',
			'!working = !this.items',
			'!working.'
		].join('\n');
		const document = TextDocument.create('file:///form-member-alias-completion.pmlfrm', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'size')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
	});

	it('filters built-in member completions for obvious string literal assignments', () => {
		const source = [
			'!label = |Pump A|',
			'!label.'
		].join('\n');
		const document = TextDocument.create('file:///string-literal-completion.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'upcase')).toBe(true);
		expect(completions.some(item => item.label === 'substring')).toBe(true);
		expect(completions.some(item => item.label === 'append')).toBe(false);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
	});

	it('filters built-in member completions for obvious numeric literal assignments', () => {
		const source = [
			'!distance = 42.5',
			'!distance.'
		].join('\n');
		const document = TextDocument.create('file:///numeric-literal-completion.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'abs')).toBe(true);
		expect(completions.some(item => item.label === 'sqrt')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(false);
		expect(completions.some(item => item.label === 'append')).toBe(false);
		expect(completions.some(item => item.label === 'qreal')).toBe(false);
	});

	it('does not infer receiver types from assignments after the cursor', () => {
		const source = [
			'!items.',
			'!items = object ARRAY()'
		].join('\n');
		const document = TextDocument.create('file:///future-type-completion.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt('!items.'.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(true);
	});

	it('does not infer receiver types from inactive string content before the cursor', () => {
		const source = [
			'!note = | !working is ARRAY |',
			'!working.'
		].join('\n');
		const document = TextDocument.create('file:///inactive-receiver-inference.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(true);
	});

	it('does not infer receiver types from inline comments before the cursor', () => {
		const source = [
			'!note = 1 -- !working is ARRAY',
			'!working.'
		].join('\n');
		const document = TextDocument.create('file:///comment-receiver-inference.pml', 'pml', 1, source);
		const provider = new CompletionProvider(new SymbolIndex());

		const completions = provider.provide({
			textDocument: { uri: document.uri },
			position: document.positionAt(source.length)
		}, document);

		expect(completions.some(item => item.label === 'append')).toBe(true);
		expect(completions.some(item => item.label === 'upcase')).toBe(true);
	});

	it('formats workspace method parameters with PML markers', () => {
		const uri = 'file:///workspace-completion.pml';
		const source = [
			'define method .refresh(!target is STRING, !count is REAL) is BOOLEAN',
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
			detail: 'Method (!target is STRING, !count is REAL) → BOOLEAN',
			insertText: '.refresh(${1:!target}, ${2:!count})$0',
			insertTextFormat: InsertTextFormat.Snippet
		});
	});

	it('does not suggest methods from other files in bare identifier completions', () => {
		const uri = 'file:///current-completion.pml';
		const otherUri = 'file:///other-completion.pml';
		const currentSource = [
			'define method .refresh(!target is STRING)',
			'endmethod',
			'',
			're'
		].join('\n');
		const otherSource = [
			'define method .remoteRefresh()',
			'endmethod'
		].join('\n');
		const parser = new Parser();
		const currentResult = parser.parse(currentSource);
		const otherResult = parser.parse(otherSource);
		expect(currentResult.errors).toHaveLength(0);
		expect(otherResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, currentResult.ast, 1, currentSource);
		symbolIndex.indexFile(otherUri, otherResult.ast, 1, otherSource);
		const document = TextDocument.create(uri, 'pml', 1, currentSource);
		const provider = new CompletionProvider(symbolIndex);

		const completions = provider.provide({
			textDocument: { uri },
			position: document.positionAt(currentSource.length)
		}, document);

		expect(completions.some(item => item.label === '.refresh')).toBe(true);
		expect(completions.some(item => item.label === '.remoteRefresh')).toBe(false);
	});

	it('suggests indexed global functions only after !! prefix', () => {
		const uri = 'file:///function-completion.pmlfnc';
		const source = [
			'define function !!ProcessItems(!items is ARRAY) is STRING',
			'endfunction',
			'',
			'!!Pro'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new CompletionProvider(symbolIndex);

		const functionCompletions = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document);

		expect(functionCompletions.find(item => item.label === '!!ProcessItems')).toMatchObject({
			kind: CompletionItemKind.Function,
			detail: 'Function (!items is ARRAY) → STRING',
			insertText: '!!ProcessItems(${1:!items})$0',
			insertTextFormat: InsertTextFormat.Snippet
		});

		const bareSource = `${source}\n\nPro`;
		const bareDocument = TextDocument.create(uri, 'pml', 1, bareSource);
		const bareCompletions = provider.provide({
			textDocument: { uri },
			position: bareDocument.positionAt(bareSource.length)
		}, bareDocument);

		expect(bareCompletions.some(item => item.label === '!!ProcessItems')).toBe(false);
	});

	it('uses plain callable text when the client does not support snippets', () => {
		const uri = 'file:///plain-function-completion.pmlfnc';
		const source = 'define function !!ProcessItems(!items is ARRAY)\nendfunction\n!!Pro';
		const parsed = new Parser().parse(source);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parsed.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new CompletionProvider(symbolIndex);
		provider.setSnippetSupport(false);

		const completion = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.length)
		}, document).find(item => item.label === '!!ProcessItems');

		expect(completion).toMatchObject({
			insertText: '!!ProcessItems()',
			insertTextFormat: InsertTextFormat.PlainText
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

	it('does not provide completions inside comments or string literals', () => {
		const provider = new CompletionProvider(new SymbolIndex());
		const sources = [
			'!text = "def',
			'!pipe = |def',
			'-- def',
			'$* def',
			'$( def'
		];

		for (const source of sources) {
			const document = TextDocument.create('file:///inactive-completion.pml', 'pml', 1, source);
			const completions = provider.provide({
				textDocument: { uri: document.uri },
				position: document.positionAt(source.length)
			}, document);

			expect(completions, source).toEqual([]);
		}
	});

	it('provides completions after closed string and block comment delimiters', () => {
		const provider = new CompletionProvider(new SymbolIndex());
		const sources = [
			'!text = "closed" def',
			'!pipe = |closed| def',
			'$( closed $) def'
		];

		for (const source of sources) {
			const document = TextDocument.create('file:///post-inactive-completion.pml', 'pml', 1, source);
			const completions = provider.provide({
				textDocument: { uri: document.uri },
				position: document.positionAt(source.length)
			}, document);

			expect(completions.some(item => item.label === 'define'), source).toBe(true);
		}
	});
});
