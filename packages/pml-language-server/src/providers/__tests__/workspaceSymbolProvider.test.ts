import { describe, expect, it } from 'vitest';
import { SymbolKind } from 'vscode-languageserver/node';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { WorkspaceSymbolProvider } from '../workspaceSymbolProvider';

describe('WorkspaceSymbolProvider', () => {
	it('returns methods, objects, and forms with LSP symbol kinds', () => {
		const uri = 'file:///workspace-symbols.pml';
		const source = [
			'define object PumpController',
			'	define method .pumpStart()',
			'	endmethod',
			'endobject',
			'',
			'define function !!pumpReport(!target is STRING)',
			'endfunction',
			'',
			'setup form !!PumpForm dialog',
			'exit'
		].join('\n');
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);

		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1, source);

		const provider = new WorkspaceSymbolProvider(symbolIndex);
		const symbols = provider.provide({ query: 'pump' });

		expect(symbols.map(symbol => ({
			name: symbol.name,
			kind: symbol.kind,
			containerName: symbol.containerName
		}))).toEqual([
			{ name: 'pumpStart', kind: SymbolKind.Method, containerName: 'PumpController' },
			{ name: 'pumpReport', kind: SymbolKind.Function, containerName: undefined },
			{ name: 'PumpController', kind: SymbolKind.Class, containerName: undefined },
			{ name: '!!PumpForm', kind: SymbolKind.Interface, containerName: undefined }
		]);
		expect(symbols.every(symbol => symbol.location.uri === uri)).toBe(true);
	});

	it('searches form members, nested gadgets, and direct callbacks across the project', () => {
		const uri = 'file:///workspace/forms/Report.pmlfrm';
		const source = [
			'setup form !!Report dialog',
			'  member .reportTitle is STRING',
			'  frame .tools',
			'    button .export |Export| callback |!this.exportReport()|',
			'  exit',
			'exit'
		].join('\n');
		const parsed = new Parser().parse(source);
		expect(parsed.errors).toHaveLength(0);
		const index = new SymbolIndex();
		index.indexFile(uri, parsed.ast, 1, source);

		const provider = new WorkspaceSymbolProvider(index);
		expect(provider.provide({ query: 'report' }).map(symbol => ({ name: symbol.name, kind: symbol.kind, containerName: symbol.containerName })))
			.toEqual([
				{ name: '!!Report', kind: SymbolKind.Interface, containerName: undefined },
				{ name: '.reportTitle', kind: SymbolKind.Property, containerName: '!!Report · member STRING' },
				{ name: '.exportReport', kind: SymbolKind.Event, containerName: '!!Report · .export callback' }
			]);
	});
});
