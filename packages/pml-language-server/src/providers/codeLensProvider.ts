import { CodeLens, Command, Range } from 'vscode-languageserver/node';
import { FormInfo, GadgetInfo, SymbolIndex } from '../index/symbolIndex';
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
		const callbackGadgets = gadgets.filter(gadget => this.callbackMethod(gadget.callback));
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
		for (const gadget of callbackGadgets) {
			const methodName = this.callbackMethod(gadget.callback)!;
			lenses.push({
				range: gadget.range,
				data: {
					kind: this.symbolIndex.findMethodsInFile(uri, methodName).length === 1
						? 'form-callback'
						: 'missing-form-callback',
					uri,
					range: gadget.range,
					methodName
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
				const method = this.symbolIndex.findMethodsInFile(data.uri, data.methodName ?? '')[0];
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

	private callbackMethod(callback?: string): string | undefined {
		return callback?.trim().match(/^(?:!this\.|\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/i)?.[1];
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
