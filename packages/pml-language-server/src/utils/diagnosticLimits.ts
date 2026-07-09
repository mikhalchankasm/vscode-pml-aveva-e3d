import { Diagnostic } from 'vscode-languageserver/node';

export function limitDiagnostics(diagnostics: Diagnostic[], maxNumberOfProblems: number): Diagnostic[] {
	const normalizedLimit = Math.max(0, Math.floor(maxNumberOfProblems));
	if (diagnostics.length <= normalizedLimit) {
		return diagnostics;
	}

	return diagnostics.slice(0, normalizedLimit);
}
