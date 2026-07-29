import { CodeLens, Command, Range } from 'vscode-languageserver/node';
import { FormInfo, GadgetInfo, MethodInfo, SymbolIndex } from '../index/symbolIndex';
import { directCallbackReference, directCallbackTarget } from '../utils/directCallbackTarget';
import { ReferencesProvider } from './referencesProvider';

const SHOW_REFERENCES_COMMAND = 'pml.showCodeLensReferences';
const GO_TO_CALLABLE_COMMAND = 'pml.goToCallableDefinition';
const SHOW_FORM_REFACTORS_COMMAND = 'pml.showFormAuthoringRefactors';
const SHOW_FORM_QUICK_FIXES_COMMAND = 'pml.showFormAuthoringQuickFixes';

interface PmlCodeLensData {
	uri: string;
	symbolName: string;
	symbolKind: 'method' | 'function';
}

interface FormCodeLensData {
	kind: 'form-summary' | 'form-member' | 'form-callback' | 'missing-form-callback';
	uri: string;
	range: Range;
	methodName?: string;
	argumentCount?: number;
	memberName?: string;
	memberType?: string;
	callbackCount?: number;
}

export class CodeLensProvider {
	constructor(
		private readonly symbolIndex: SymbolIndex,
		private readonly referencesProvider: ReferencesProvider
	) {}

	public provide(uri: string): CodeLens[] {
		const fileSymbols = this.symbolIndex.getFileSymbols(uri);
		if (!fileSymbols) return [];

		const methodLenses = fileSymbols.methods.map(method => ({
			range: method.selectionRange,
			data: { uri, symbolName: method.name, symbolKind: 'method' } satisfies PmlCodeLensData
		}));
		const functionLenses = fileSymbols.functions.map(func => ({
			range: func.selectionRange,
			data: { uri, symbolName: func.name, symbolKind: 'function' } satisfies PmlCodeLensData
		}));

		return [...methodLenses, ...functionLenses, ...fileSymbols.forms.flatMap(form => this.formLenses(uri, form))];
	}

	public async resolve(codeLens: CodeLens): Promise<CodeLens> {
		const callable = codeLens.data as PmlCodeLensData | undefined;
		if (callable?.symbolKind === 'method' || callable?.symbolKind === 'function') {
			const references = callable.symbolKind === 'method'
				? await this.referencesProvider.getMethodReferenceLocations(callable.symbolName, callable.uri)
				: this.referencesProvider.getFunctionReferenceLocations(callable.symbolName);
			return this.createResolvedCodeLens(codeLens, callable.uri, references.length);
		}
		return this.resolveFormLens(codeLens, codeLens.data as FormCodeLensData | undefined);
	}

	private formLenses(uri: string, form: FormInfo): CodeLens[] {
		const gadgets = this.formGadgets(form);
		const callbackGadgets = gadgets.flatMap(gadget => {
			const reference = directCallbackReference(gadget.callback);
			const methodName = reference?.name ?? directCallbackTarget(gadget.callback);
			return methodName ? [{
				gadget,
				methodName,
				argumentCount: reference?.argumentCount
			}] : [];
		});
		const lenses: CodeLens[] = [{
			range: form.range,
			data: { kind: 'form-summary', uri, range: form.range, callbackCount: callbackGadgets.length } satisfies FormCodeLensData
		}];
		for (const member of form.members) {
			lenses.push({
				range: member.range,
				data: { kind: 'form-member', uri, range: member.range, memberName: member.name, memberType: member.memberType } satisfies FormCodeLensData
			});
		}
		for (const callback of callbackGadgets) {
			const method = this.callbackMethod(uri, callback.methodName, callback.argumentCount);
			const sameNameMethods = this.symbolIndex.findMethodsInFile(uri, callback.methodName);
			if (!method && sameNameMethods.length > 0) {
				continue;
			}
			lenses.push({
				range: callback.gadget.range,
				data: {
					kind: method ? 'form-callback' : 'missing-form-callback',
					uri,
					range: callback.gadget.range,
					methodName: callback.methodName,
					argumentCount: callback.argumentCount
				} satisfies FormCodeLensData
			});
		}
		return lenses;
	}

	private resolveFormLens(codeLens: CodeLens, data: FormCodeLensData | undefined): CodeLens {
		if (!data) return codeLens;
		switch (data.kind) {
			case 'form-summary':
				return {
					...codeLens,
					command: {
						title: `Form actions · ${data.callbackCount ?? 0} callbacks`,
						command: SHOW_FORM_REFACTORS_COMMAND,
						arguments: [data.uri, data.range.start]
					}
				};
			case 'form-member':
				return {
					...codeLens,
					command: {
						title: `member: ${data.memberType}`,
						command: 'pml.showFormMemberInfo',
						arguments: [data.memberName, data.memberType]
					}
				};
			case 'form-callback': {
				const method = this.callbackMethod(data.uri, data.methodName ?? '', data.argumentCount);
				if (!method) return codeLens;
				return {
					...codeLens,
					command: {
						title: `callback → .${method.name}`,
						command: GO_TO_CALLABLE_COMMAND,
						arguments: [data.uri, method.selectionRange.start]
					}
				};
			}
			case 'missing-form-callback':
				return {
					...codeLens,
					command: {
						title: `missing callback .${data.methodName}`,
						command: SHOW_FORM_QUICK_FIXES_COMMAND,
						arguments: [data.uri, data.range.start]
					}
				};
		}
	}

	private formGadgets(form: FormInfo): GadgetInfo[] {
		const collectFrame = (frame: FormInfo['frames'][number]): GadgetInfo[] => [
			...frame.gadgets,
			...frame.frames.flatMap(collectFrame)
		];
		return [...form.gadgets, ...form.frames.flatMap(collectFrame)];
	}

	private callbackMethod(uri: string, methodName: string, argumentCount?: number): MethodInfo | undefined {
		const methods = this.symbolIndex.findMethodsInFile(uri, methodName);
		if (argumentCount === undefined) {
			return methods.length === 1 ? methods[0] : undefined;
		}
		const matchingMethods = methods.filter(method => method.parameterCount === argumentCount);
		if (matchingMethods.length === 1) {
			return matchingMethods[0];
		}
		return methods.length === 1 ? methods[0] : undefined;
	}

	private createResolvedCodeLens(codeLens: CodeLens, uri: string, count: number): CodeLens {
		const title = count === 1 ? '1 reference' : `${count} references`;
		const command: Command = {
			title,
			command: SHOW_REFERENCES_COMMAND,
			arguments: [uri, codeLens.range.start]
		};
		return { ...codeLens, command };
	}
}
