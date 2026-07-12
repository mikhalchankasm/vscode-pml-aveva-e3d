import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { normalizeWorkspaceEnvironment, workspaceEnvironmentFingerprint } from '../workspaceEnvironment';

describe('workspaceEnvironment', () => {
	it('normalizes configured PMLLIB roots and environment metadata', () => {
		const root = path.resolve('workspace');
		const environment = normalizeWorkspaceEnvironment({
			pmllibPaths: [' libraries ', 'libraries', '', 42],
			uicPath: ' C:/AVEVA/uic ',
			e3dVersion: ' 3.1 '
		}, root);

		expect(environment).toEqual({
			pmllibPaths: [path.resolve(root, 'libraries')],
			uicPath: 'C:/AVEVA/uic',
			e3dVersion: '3.1'
		});
	});

	it('produces a stable fingerprint and defaults invalid input', () => {
		const environment = normalizeWorkspaceEnvironment(undefined);
		expect(environment).toEqual({ pmllibPaths: [], uicPath: '', e3dVersion: '' });
		expect(workspaceEnvironmentFingerprint(environment)).toBe('{"pmllibPaths":[],"uicPath":"","e3dVersion":""}');
	});
});
