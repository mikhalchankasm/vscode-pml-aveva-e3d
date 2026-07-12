import * as path from 'path';

export interface WorkspaceEnvironmentSettings {
	pmllibPaths: string[];
	uicPath: string;
	e3dVersion: string;
}

export function normalizeWorkspaceEnvironment(raw: unknown, workspaceRoot?: string): WorkspaceEnvironmentSettings {
	const source = isRecord(raw) ? raw : {};
	const pmllibPaths = Array.isArray(source.pmllibPaths)
		? source.pmllibPaths
			.filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0)
			.map(candidate => resolveConfiguredPath(candidate.trim(), workspaceRoot))
		: [];

	return {
		pmllibPaths: deduplicatePaths(pmllibPaths),
		uicPath: typeof source.uicPath === 'string' ? source.uicPath.trim() : '',
		e3dVersion: typeof source.e3dVersion === 'string' ? source.e3dVersion.trim() : ''
	};
}

export function workspaceEnvironmentFingerprint(settings: WorkspaceEnvironmentSettings): string {
	return JSON.stringify(settings);
}

function resolveConfiguredPath(candidate: string, workspaceRoot?: string): string {
	return path.resolve(path.isAbsolute(candidate) || !workspaceRoot ? candidate : path.join(workspaceRoot, candidate));
}

function deduplicatePaths(paths: string[]): string[] {
	const seen = new Set<string>();
	return paths.filter(candidate => {
		const key = process.platform === 'win32' ? candidate.toLowerCase() : candidate;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
