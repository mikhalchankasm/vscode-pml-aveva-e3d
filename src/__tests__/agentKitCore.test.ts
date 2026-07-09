import { describe, expect, it } from 'vitest';
import * as path from 'path';
import {
	canRunAgentKit,
	createNpmExecutionOptions,
	getAgentKitDiscoveryCandidates,
	resolveWindowsNpmCliPath
} from '../agentKitCore';

describe('Agent Kit core helpers', () => {
	it('runs npm through npm-cli.js without a shell on Windows', () => {
		const npmCliPath = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
		const execution = createNpmExecutionOptions('win32', 'C:\\agent-kit', [
			'run',
			'pml:review',
			'--',
			'C:\\Users\\First Last\\file & name 100%!.pml'
		], {
			executablePath: 'C:\\Program Files\\Microsoft VS Code\\Code.exe',
			npmCliPath
		});

		expect(execution.command).toBe('C:\\Program Files\\Microsoft VS Code\\Code.exe');
		expect(execution.args).toEqual([
			npmCliPath,
			'run',
			'pml:review',
			'--',
			'C:\\Users\\First Last\\file & name 100%!.pml'
		]);
		expect(execution.options).toMatchObject({
			cwd: 'C:\\agent-kit',
			shell: false,
			env: expect.objectContaining({ ELECTRON_RUN_AS_NODE: '1' })
		});
	});

	it('does not use a shell for npm on non-Windows platforms', () => {
		const execution = createNpmExecutionOptions('linux', '/agent-kit', [
			'run',
			'pml:review',
			'--',
			'/tmp/file name.pml'
		]);

		expect(execution.command).toBe('npm');
		expect(execution.args).toEqual(['run', 'pml:review', '--', '/tmp/file name.pml']);
		expect(execution.options).toMatchObject({
			cwd: '/agent-kit',
			shell: false
		});
	});

	it('requires workspace trust before running Agent Kit scripts', () => {
		expect(canRunAgentKit(true)).toBe(true);
		expect(canRunAgentKit(false)).toBe(false);
	});

	it('auto-discovers only the sibling Agent Kit folder, not the current workspace', () => {
		const workspace = path.join('D:', 'GitHub', 'some-project');
		const candidates = getAgentKitDiscoveryCandidates(workspace);

		expect(candidates).toEqual([
			path.join('D:', 'GitHub', 'e3d-pml-agent-kit')
		]);
		expect(candidates).not.toContain(workspace);
	});

	it('locates npm-cli.js next to an npm command directory on Windows', () => {
		const npmCliPath = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';

		expect(resolveWindowsNpmCliPath(
			'C:\\Other;C:\\Program Files\\nodejs',
			undefined,
			candidate => candidate === npmCliPath
		)).toBe(npmCliPath);
	});

	it('does not fall back to shell execution when npm-cli.js is unavailable', () => {
		expect(() => createNpmExecutionOptions('win32', 'C:\\agent-kit', [], {
			npmCliPath: ''
		})).toThrow('Unable to locate npm-cli.js');
	});
});
