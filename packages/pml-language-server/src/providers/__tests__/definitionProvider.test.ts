import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { DefinitionProvider } from '../definitionProvider';

describe('DefinitionProvider', () => {
	it('does not resolve symbols from comments or string literals', () => {
		const uri = 'file:///definition-inactive-text.pmlfnc';
		const source = [
			'define function !!Process(!target is STRING)',
			'	return !target',
			'endfunction',
			'',
			'define object Pump',
			'	define method .Run()',
			'	endmethod',
			'endobject',
			'',
			'define method .Run()',
			'	!text = "!!Process .Run Pump"',
			'	-- !!Process .Run Pump',
			'	$* !!Process .Run Pump',
			'	$(',
			'	!!Process .Run Pump',
			'	$)',
			'	!!Process(!target)',
			'endmethod'
		].join('\n');
		const parseResult = new Parser().parse(source);
		expect(parseResult.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, parseResult.ast, 1, source);
		const document = TextDocument.create(uri, 'pml', 1, source);
		const provider = new DefinitionProvider(symbolIndex, {
			get: (requestedUri: string) => requestedUri === uri ? document : undefined
		} as any);

		const inactiveTargets = [
			source.indexOf('!!Process .Run Pump') + 2,
			source.indexOf('.Run Pump') + 1,
			source.indexOf('Pump"'),
			source.indexOf('-- !!Process') + 5,
			source.indexOf('$* !!Process') + 5,
			source.indexOf('\t!!Process .Run Pump') + 3
		];

		for (const offset of inactiveTargets) {
			expect(provider.provide({
				textDocument: { uri },
				position: document.positionAt(offset)
			})).toBeNull();
		}

		const activeDefinition = provider.provide({
			textDocument: { uri },
			position: document.positionAt(source.lastIndexOf('!!Process') + 2)
		});
		const activeDefinitions = Array.isArray(activeDefinition) ? activeDefinition : activeDefinition ? [activeDefinition] : [];
		expect(activeDefinitions).toHaveLength(1);
		expect(activeDefinitions[0].range.start.line).toBe(0);
	});
});
