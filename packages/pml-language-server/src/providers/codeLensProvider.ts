import { CodeLens, Command } from 'vscode-languageserver/node';
import { SymbolIndex } from '../index/symbolIndex';
import { ReferencesProvider } from './referencesProvider';

const SHOW_REFERENCES_COMMAND = 'pml.showCodeLensReferences';

interface PmlCodeLensData {
	uri: string;
	symbolName: string;
	symbolKind: 'method' | 'function';
}

export class CodeLensProvider {
	constructor(
		private readonly symbolIndex: SymbolIndex,
		private readonly referencesProvider: ReferencesProvider
	) {}

	public provide(uri: string): CodeLens[] {
		const fileSymbols = this.symbolIndex.getFileSymbols(uri);
		if (!fileSymbols) {
			return [];
		}

		const methodLenses = fileSymbols.methods.map(method => ({
			range: method.selectionRange,
			data: { uri, symbolName: method.name, symbolKind: 'method' } satisfies PmlCodeLensData
		}));
		const functionLenses = fileSymbols.functions.map(func => ({
			range: func.selectionRange,
			data: { uri, symbolName: func.name, symbolKind: 'function' } satisfies PmlCodeLensData
		}));

		return [...methodLenses, ...functionLenses];
	}

	public async resolve(codeLens: CodeLens): Promise<CodeLens> {
		const data = codeLens.data as PmlCodeLensData | undefined;
		if (!data || (data.symbolKind !== 'method' && data.symbolKind !== 'function')) {
			return codeLens;
		}

		const references = data.symbolKind === 'method'
			? await this.referencesProvider.getMethodReferenceLocations(data.symbolName, data.uri)
			: this.referencesProvider.getFunctionReferenceLocations(data.symbolName);

		return this.createResolvedCodeLens(codeLens, data.uri, references.length);
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
