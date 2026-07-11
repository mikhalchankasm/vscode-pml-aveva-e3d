import { Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { describe, expect, it } from 'vitest';
import { SymbolIndex } from '../../index/symbolIndex';
import { Parser, parserModeFromUri } from '../../parser/parser';
import { CallableSignatureRefactorProvider } from '../callableSignatureRefactorProvider';

function indexedDocument(source: string, uri = 'file:///signature.pml', index = new SymbolIndex()) {
	const parsed = new Parser().parse(source, { mode: parserModeFromUri(uri) });
	expect(parsed.errors).toHaveLength(0);
	index.indexFile(uri, parsed.ast, 1, source);
	return { index, parsed, document: TextDocument.create(uri, 'pml', 1, source) };
}

function actionAtDeclaration(source: string, uri = 'file:///signature.pml', index = new SymbolIndex()) {
	const fixture = indexedDocument(source, uri, index);
	const position = fixture.document.positionAt(source.indexOf('define') + 8);
	const actions = new CallableSignatureRefactorProvider(fixture.index).provide(
		fixture.document,
		Range.create(position, position),
		fixture.parsed.ast
	);
	return { ...fixture, actions };
}

describe('CallableSignatureRefactorProvider', () => {
	it('removes an unused trailing method parameter and every direct file-local call argument', () => {
		const source = [
			'define method .render(!title is STRING, !unused is REAL)',
			'  $P !title',
			'endmethod',
			'.render(|One|, 1)',
			'!this.render(|Two|, 2)'
		].join('\n');
		const { actions } = actionAtDeclaration(source);
		const action = actions[0];

		expect(action?.title).toBe('Remove unused trailing parameter !unused from .render and update 2 direct calls');
		expect(action?.kind).toBe('refactor.rewrite');
		expect(action?.edit?.changes?.['file:///signature.pml']).toHaveLength(3);
		expect(action?.edit?.changes?.['file:///signature.pml']?.map(edit => edit.newText)).toEqual(['', '', '']);
	});

	it('updates a uniquely indexed global function across indexed files', () => {
		const index = new SymbolIndex();
		const definitionUri = 'file:///functions/BuildReport.pmlfnc';
		const callerUri = 'file:///forms/caller.pml';
		const definition = 'define function !!BuildReport(!title is STRING, !unused is REAL)\n  return !title\nendfunction';
		indexedDocument('!!BuildReport(|Report|, 1)', callerUri, index);
		const { actions } = actionAtDeclaration(definition, definitionUri, index);
		const action = actions[0];

		expect(action?.title).toBe('Remove unused trailing parameter !unused from !!BuildReport and update 1 direct call');
		expect(action?.edit?.changes?.[definitionUri]).toHaveLength(1);
		expect(action?.edit?.changes?.[callerUri]).toHaveLength(1);
	});

	it('does not offer an edit for used, ambiguous, or arity-mismatched APIs', () => {
		expect(actionAtDeclaration('define method .render(!title is STRING, !unused is REAL)\n  !value = !unused\nendmethod\n.render(|One|, 1)').actions)
			.toEqual([]);
		expect(actionAtDeclaration('define method .render(!title is STRING, !unused is REAL)\nendmethod\n.render(|One|)').actions)
			.toEqual([]);

		const index = new SymbolIndex();
		indexedDocument('define function !!Duplicate(!unused is REAL)\nendfunction', 'file:///a.pmlfnc', index);
		expect(actionAtDeclaration('define function !!Duplicate(!unused is REAL)\nendfunction', 'file:///b.pmlfnc', index).actions)
			.toEqual([]);
	});

	it('refuses dynamic receivers, string substitutions, overlapping edits, and unparsable references', () => {
		expect(actionAtDeclaration('define method .render(!unused is REAL)\nendmethod\n!ref.render(1)').actions).toEqual([]);
		expect(actionAtDeclaration('define method .render(!unused is REAL)\n  !message = |value: $!unused|\nendmethod\n.render(1)').actions).toEqual([]);
		expect(actionAtDeclaration('define method .render(!first is REAL, !unused is REAL)\nendmethod\n.render(1, .render(2, 3))').actions).toEqual([]);

		const index = new SymbolIndex();
		const malformedUri = 'file:///malformed-caller.pml';
		const malformed = '!!BuildReport(1)\n!broken = ('; // Deliberately indexed despite parser recovery errors.
		const parsed = new Parser().parse(malformed, { mode: parserModeFromUri(malformedUri) });
		index.indexFile(malformedUri, parsed.ast, 1, malformed);
		expect(actionAtDeclaration('define function !!BuildReport(!unused is REAL)\nendfunction', 'file:///definition.pmlfnc', index).actions).toEqual([]);
	});

	it('supports methods declared inside objects but only offers the refactor on the signature line', () => {
		const uri = 'file:///object.pmlobj';
		const source = 'define object Sample\n  define method .render(!unused is REAL)\n  endmethod\nendobject\n.render(1)';
		const fixture = indexedDocument(source, uri);
		const provider = new CallableSignatureRefactorProvider(fixture.index);
		const signature = fixture.document.positionAt(source.indexOf('define method') + 8);
		const body = { line: 2, character: 2 };
		expect(provider.provide(fixture.document, Range.create(signature, signature), fixture.parsed.ast)).toHaveLength(1);
		expect(provider.provide(fixture.document, Range.create(body, body), fixture.parsed.ast)).toEqual([]);
	});

	it('respects requested Code Action kinds', () => {
		const source = 'define method .render(!unused is REAL)\nendmethod\n.render(1)';
		const fixture = indexedDocument(source);
		const position = fixture.document.positionAt(source.indexOf('define') + 8);
		const provider = new CallableSignatureRefactorProvider(fixture.index);
		expect(provider.provide(fixture.document, Range.create(position, position), fixture.parsed.ast, ['quickfix'])).toEqual([]);
		expect(provider.provide(fixture.document, Range.create(position, position), fixture.parsed.ast, ['refactor']))
			.toHaveLength(1);
	});
});
