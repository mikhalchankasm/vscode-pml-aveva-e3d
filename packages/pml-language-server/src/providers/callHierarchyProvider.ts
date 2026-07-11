import {
	CallHierarchyIncomingCall,
	CallHierarchyItem,
	CallHierarchyOutgoingCall,
	Position,
	Range,
	SymbolKind as LspSymbolKind
} from 'vscode-languageserver/node';
import {
	FunctionInfo,
	FormInfo,
	FrameInfo,
	MethodInfo,
	SymbolIndex,
	SymbolKind
} from '../index/symbolIndex';

type CallableSymbol = MethodInfo | FunctionInfo;

interface CallableCallHierarchyData {
	name: string;
	kind: 'method' | 'function';
}

interface FormCallbackCallHierarchyData {
	kind: 'form-callback';
	methodName: string;
}

type PmlCallHierarchyData = CallableCallHierarchyData | FormCallbackCallHierarchyData;

export class CallHierarchyProvider {
	constructor(private readonly symbolIndex: SymbolIndex) {}

	public prepare(uri: string, position: Position): CallHierarchyItem[] | null {
		const fileSymbols = this.symbolIndex.getFileSymbols(uri);
		if (!fileSymbols) {
			return null;
		}

		const declaration = [...fileSymbols.methods, ...fileSymbols.functions]
			.find(symbol => this.rangeContainsPosition(symbol.selectionRange, position));
		if (declaration) {
			return [this.createItem(declaration)];
		}

		const methodReference = fileSymbols.methodReferences.find(reference =>
			this.rangeContainsPosition(reference.range, position)
		);
		if (methodReference) {
			const methods = this.symbolIndex.findMethodsInFile(uri, methodReference.name);
			return methods.length > 0 ? methods.map(method => this.createItem(method)) : null;
		}

		const functionReference = fileSymbols.functionReferences.find(reference =>
			this.rangeContainsPosition(reference.range, position)
		);
		if (functionReference) {
			const functions = this.symbolIndex.findFunction(functionReference.name);
			return functions.length > 0 ? functions.map(func => this.createItem(func)) : null;
		}

		const formCallbacks = this.formCallbackItemsAt(uri, position);
		if (formCallbacks.length > 0) return formCallbacks;

		return null;
	}

	public incomingCalls(item: CallHierarchyItem): CallHierarchyIncomingCall[] | null {
		const target = this.getItemData(item);
		if (!target || target.kind === 'form-callback') {
			return null;
		}

		const references = target.kind === 'method'
			? this.symbolIndex.findMethodReferencesInFile(item.uri, target.name)
			: this.symbolIndex.findFunctionReferences(target.name);
		const grouped = new Map<string, CallHierarchyIncomingCall>();

		for (const reference of references) {
			const caller = this.findContainingCallable(reference.uri, reference.range);
			if (!caller) {
				continue;
			}
			const callerItem = this.createItem(caller);
			const key = this.itemKey(callerItem);
			const existing = grouped.get(key);
			if (existing) {
				existing.fromRanges.push(reference.range);
			} else {
				grouped.set(key, { from: callerItem, fromRanges: [reference.range] });
			}
		}
		if (target.kind === 'method') {
			for (const callback of this.formCallbackItemsForMethod(item.uri, target.name)) {
				const key = this.itemKey(callback);
				grouped.set(key, { from: callback, fromRanges: [callback.selectionRange] });
			}
		}

		return grouped.size > 0 ? Array.from(grouped.values()) : null;
	}

	public outgoingCalls(item: CallHierarchyItem): CallHierarchyOutgoingCall[] | null {
		const data = this.getItemData(item);
		if (data?.kind === 'form-callback') {
			const targets = this.symbolIndex.findMethodsInFile(item.uri, data.methodName);
			return targets.length === 1 ? [{ to: this.createItem(targets[0]), fromRanges: [item.selectionRange] }] : null;
		}
		const caller = this.findItemSymbol(item);
		if (!caller) {
			return null;
		}

		const fileSymbols = this.symbolIndex.getFileSymbols(caller.uri);
		if (!fileSymbols) {
			return null;
		}
		const grouped = new Map<string, CallHierarchyOutgoingCall>();

		for (const reference of fileSymbols.methodReferences) {
			if (!this.rangeContainsRange(caller.range, reference.range)) {
				continue;
			}
			for (const target of this.symbolIndex.findMethodsInFile(caller.uri, reference.name)) {
				this.addOutgoingCall(grouped, target, reference.range);
			}
		}
		for (const reference of fileSymbols.functionReferences) {
			if (!this.rangeContainsRange(caller.range, reference.range)) {
				continue;
			}
			for (const target of this.symbolIndex.findFunction(reference.name)) {
				this.addOutgoingCall(grouped, target, reference.range);
			}
		}

		return grouped.size > 0 ? Array.from(grouped.values()) : null;
	}

	private addOutgoingCall(
		grouped: Map<string, CallHierarchyOutgoingCall>,
		target: CallableSymbol,
		fromRange: Range
	): void {
		const targetItem = this.createItem(target);
		const key = this.itemKey(targetItem);
		const existing = grouped.get(key);
		if (existing) {
			existing.fromRanges.push(fromRange);
		} else {
			grouped.set(key, { to: targetItem, fromRanges: [fromRange] });
		}
	}

	private findContainingCallable(uri: string, range: Range): CallableSymbol | undefined {
		const fileSymbols = this.symbolIndex.getFileSymbols(uri);
		return [...(fileSymbols?.methods ?? []), ...(fileSymbols?.functions ?? [])]
			.filter(symbol => this.rangeContainsRange(symbol.range, range))
			.sort((left, right) => this.rangeSize(left.range) - this.rangeSize(right.range))[0];
	}

	private findItemSymbol(item: CallHierarchyItem): CallableSymbol | undefined {
		const data = this.getItemData(item);
		if (!data || data.kind === 'form-callback') {
			return undefined;
		}
		const candidates = data.kind === 'method'
			? this.symbolIndex.findMethodsInFile(item.uri, data.name)
			: this.symbolIndex.findFunction(data.name).filter(func => func.uri === item.uri);
		const exact = candidates.find(candidate => this.rangesEqual(candidate.range, item.range));
		if (exact || candidates.length === 0) {
			return exact;
		}
		if (candidates.length === 1) {
			return candidates[0];
		}
		return [...candidates].sort((left, right) =>
			Math.abs(left.range.start.line - item.range.start.line) -
			Math.abs(right.range.start.line - item.range.start.line)
		)[0];
	}

	private createItem(symbol: CallableSymbol): CallHierarchyItem {
		const isMethod = symbol.kind === SymbolKind.Method;
		return {
			name: isMethod ? `.${symbol.name}` : `!!${symbol.name}`,
			kind: isMethod ? LspSymbolKind.Method : LspSymbolKind.Function,
			detail: isMethod ? symbol.containerName ?? 'PML method' : 'PML global function',
			uri: symbol.uri,
			range: symbol.range,
			selectionRange: symbol.selectionRange,
			data: {
				name: symbol.name,
				kind: isMethod ? 'method' : 'function'
			} satisfies PmlCallHierarchyData
		};
	}

	private getItemData(item: CallHierarchyItem): PmlCallHierarchyData | undefined {
		const data = item.data as PmlCallHierarchyData | undefined;
		return data && (data.kind === 'method' || data.kind === 'function' || data.kind === 'form-callback') ? data : undefined;
	}

	private formCallbackItemsAt(uri: string, position: Position): CallHierarchyItem[] {
		const fileSymbols = this.symbolIndex.getFileSymbols(uri);
		return (fileSymbols?.forms ?? []).flatMap(form => this.formCallbackItems(form)
			.filter(item => this.rangeContainsPosition(item.range, position)));
	}

	private formCallbackItemsForMethod(uri: string, methodName: string): CallHierarchyItem[] {
		const fileSymbols = this.symbolIndex.getFileSymbols(uri);
		return (fileSymbols?.forms ?? []).flatMap(form => this.formCallbackItems(form)
			.filter(item => (item.data as FormCallbackCallHierarchyData).methodName.toLowerCase() === methodName.toLowerCase()));
	}

	private formCallbackItems(form: FormInfo): CallHierarchyItem[] {
		const items: CallHierarchyItem[] = [];
		const add = (name: string, detail: string, range: Range, callback?: string): void => {
			const methodName = this.directCallbackMethod(callback);
			if (!methodName) return;
			items.push({
				name: `${form.name} · ${name} callback`,
				kind: LspSymbolKind.Event,
				detail: `${detail} → .${methodName}`,
				uri: form.uri,
				range,
				selectionRange: range,
				data: { kind: 'form-callback', methodName } satisfies FormCallbackCallHierarchyData
			});
		};
		form.gadgets.forEach(gadget => add(`.${gadget.name}`, gadget.gadgetType, gadget.range, gadget.callback));
		const visitFrame = (frame: FrameInfo): void => {
			frame.gadgets.forEach(gadget => add(`.${gadget.name}`, gadget.gadgetType, gadget.range, gadget.callback));
			frame.frames.forEach(visitFrame);
		};
		form.frames.forEach(visitFrame);
		Object.entries(form.callbacks).forEach(([property, callback]) => add(property, 'form', form.range, callback));
		return items;
	}

	private directCallbackMethod(callback?: string): string | undefined {
		return callback?.trim().match(/^(?:!this\.|\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/i)?.[1];
	}

	private rangeContainsPosition(range: Range, position: Position): boolean {
		return this.comparePositions(range.start, position) <= 0 && this.comparePositions(position, range.end) < 0;
	}

	private rangeContainsRange(container: Range, candidate: Range): boolean {
		return this.comparePositions(container.start, candidate.start) <= 0 &&
			this.comparePositions(candidate.end, container.end) <= 0;
	}

	private rangesEqual(left: Range, right: Range): boolean {
		return this.comparePositions(left.start, right.start) === 0 &&
			this.comparePositions(left.end, right.end) === 0;
	}

	private comparePositions(left: Position, right: Position): number {
		return left.line === right.line ? left.character - right.character : left.line - right.line;
	}

	private rangeSize(range: Range): number {
		return (range.end.line - range.start.line) * 1_000_000 + range.end.character - range.start.character;
	}

	private itemKey(item: CallHierarchyItem): string {
		return `${item.uri}:${item.range.start.line}:${item.range.start.character}:${item.name.toLowerCase()}`;
	}
}
