import { describe, expect, it } from 'vitest';
import { Parser } from '../../parser/parser';
import { SymbolIndex } from '../../index/symbolIndex';
import { CallHierarchyProvider } from '../callHierarchyProvider';

function indexSource(symbolIndex: SymbolIndex, uri: string, source: string): void {
	const result = new Parser().parse(source);
	expect(result.errors).toHaveLength(0);
	symbolIndex.indexFile(uri, result.ast, 1, source);
}

describe('CallHierarchyProvider', () => {
	it('prepares hierarchy items from declarations and indexed call sites', () => {
		const uri = 'file:///workspace/controller.pml';
		const source = [
			'define method .target()',
			'endmethod',
			'define method .caller()',
			'  .target()',
			'endmethod'
		].join('\n');
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, uri, source);
		const provider = new CallHierarchyProvider(symbolIndex);

		expect(provider.prepare(uri, { line: 0, character: 16 })?.[0].name).toBe('.target');
		expect(provider.prepare(uri, { line: 3, character: 5 })?.[0].name).toBe('.target');
	});

	it('prepares a global function from a cross-file call site case-insensitively', () => {
		const callerUri = 'file:///workspace/caller.pml';
		const functionUri = 'file:///workspace/report.pmlfnc';
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, functionUri, 'define function !!report()\nendfunction');
		indexSource(symbolIndex, callerUri, '!!REPORT()');
		const provider = new CallHierarchyProvider(symbolIndex);

		const prepared = provider.prepare(callerUri, { line: 0, character: 4 });
		expect(prepared).toHaveLength(1);
		expect(prepared?.[0].name).toBe('!!report');
		expect(prepared?.[0].uri).toBe(functionUri);
	});

	it('does not let a missing selection range swallow call sites', () => {
		const uri = 'file:///workspace/no-text.pml';
		const source = 'define method .target()\nendmethod\ndefine method .caller()\n.target()\nendmethod';
		const result = new Parser().parse(source);
		expect(result.errors).toHaveLength(0);
		const symbolIndex = new SymbolIndex();
		symbolIndex.indexFile(uri, result.ast, 1);
		const provider = new CallHierarchyProvider(symbolIndex);

		expect(provider.prepare(uri, { line: 3, character: 3 })?.[0].name).toBe('.target');
	});

	it('groups incoming and outgoing method and global-function calls', () => {
		const controllerUri = 'file:///workspace/controller.pml';
		const functionUri = 'file:///workspace/report.pmlfnc';
		const controllerSource = [
			'define method .target()',
			'endmethod',
			'define method .caller()',
			'  .target()',
			'  .target()',
			'  !!report()',
			'endmethod'
		].join('\n');
		const functionSource = [
			'define function !!report()',
			'endfunction',
			'define function !!runReport()',
			'  !!report()',
			'endfunction'
		].join('\n');
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, controllerUri, controllerSource);
		indexSource(symbolIndex, functionUri, functionSource);
		const provider = new CallHierarchyProvider(symbolIndex);

		const target = provider.prepare(controllerUri, { line: 0, character: 16 })?.[0];
		const caller = provider.prepare(controllerUri, { line: 2, character: 16 })?.[0];
		const report = provider.prepare(functionUri, { line: 0, character: 20 })?.[0];
		expect(target).toBeDefined();
		expect(caller).toBeDefined();
		expect(report).toBeDefined();

		const incomingTarget = provider.incomingCalls(target!);
		expect(incomingTarget).toHaveLength(1);
		expect(incomingTarget?.[0].from.name).toBe('.caller');
		expect(incomingTarget?.[0].fromRanges).toHaveLength(2);

		const outgoingCaller = provider.outgoingCalls(caller!);
		expect(outgoingCaller?.map(call => call.to.name)).toEqual(['.target', '!!report']);
		expect(outgoingCaller?.[0].fromRanges).toHaveLength(2);

		const incomingReport = provider.incomingCalls(report!);
		expect(incomingReport?.map(call => call.from.name)).toEqual(['.caller', '!!runReport']);
	});

	it('keeps same-named method hierarchy file-scoped', () => {
		const firstUri = 'file:///workspace/first.pml';
		const secondUri = 'file:///workspace/second.pml';
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, firstUri, 'define method .show()\nendmethod\ndefine method .first()\n.show()\nendmethod');
		indexSource(symbolIndex, secondUri, 'define method .show()\nendmethod\ndefine method .second()\n.show()\nendmethod');
		const provider = new CallHierarchyProvider(symbolIndex);
		const firstShow = provider.prepare(firstUri, { line: 0, character: 16 })?.[0];

		const incoming = provider.incomingCalls(firstShow!);
		expect(incoming).toHaveLength(1);
		expect(incoming?.[0].from.name).toBe('.first');
		expect(incoming?.[0].from.uri).toBe(firstUri);
	});

	it('resolves outgoing calls after the prepared item range becomes stale', () => {
		const uri = 'file:///workspace/stale.pml';
		const original = 'define method .target()\nendmethod\ndefine method .caller()\n.target()\nendmethod';
		const updated = '-- shifted\ndefine method .target()\nendmethod\ndefine method .caller()\n.target()\nendmethod';
		const symbolIndex = new SymbolIndex();
		indexSource(symbolIndex, uri, original);
		const provider = new CallHierarchyProvider(symbolIndex);
		const caller = provider.prepare(uri, { line: 2, character: 16 })?.[0];
		expect(caller).toBeDefined();

		const updatedResult = new Parser().parse(updated);
		expect(updatedResult.errors).toHaveLength(0);
		symbolIndex.indexFile(uri, updatedResult.ast, 2, updated);

		expect(provider.outgoingCalls(caller!)?.[0].to.name).toBe('.target');
	});

	it('treats form gadgets and lifecycle bindings as callback hierarchy entrypoints', () => {
		const uri = 'file:///workspace/form.pmlfrm';
		const source = [
			'setup form !!Example dialog',
			"  !this.callback = '!this.init()'",
			'  frame .tools',
			'    button .apply |Apply| callback |!this.onApply()|',
			'  exit',
			'exit',
			'define method .init()',
			'endmethod',
			'define method .onApply()',
			'endmethod'
		].join('\n');
		const index = new SymbolIndex();
		indexSource(index, uri, source);
		const provider = new CallHierarchyProvider(index);

		const callback = provider.prepare(uri, { line: 3, character: 8 })?.[0];
		expect(callback?.name).toBe('!!Example · .apply callback');
		expect(provider.outgoingCalls(callback!)?.[0].to.name).toBe('.onApply');

		const method = provider.prepare(uri, { line: 8, character: 16 })?.[0];
		const incoming = provider.incomingCalls(method!);
		expect(incoming?.map(call => call.from.name)).toEqual(['!!Example · .apply callback']);
		expect(provider.prepare(uri, { line: 4, character: 2 })).toEqual(null);
		expect(provider.prepare(uri, { line: 1, character: 4 })?.[0].name).toBe('!!Example · this.callback callback');
	});
});
