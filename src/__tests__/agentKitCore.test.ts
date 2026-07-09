import { describe, expect, it } from 'vitest';
import * as path from 'path';
import {
	canRunAgentKit,
	createNpmExecutionOptions,
	getAgentKitDiscoveryCandidates,
	quoteCmdArgument
} from '../agentKitCore';

describe('Agent Kit core helpers', () => {
	it('runs npm.cmd through a shell on Windows', () => {
		const execution = createNpmExecutionOptions('win32', 'C:\\agent-kit', [
			'run',
			'pml:review',
			'--',
			'C:\\Users\\First Last\\file & name.pml'
		]);

		expect(execution.command).toBe('npm.cmd');
		expect(execution.args).toEqual([
			'"run"',
			'"pml:review"',
			'"--"',
			'"C:\\Users\\First Last\\file & name.pml"'
		]);
		expect(execution.options).toMatchObject({
			cwd: 'C:\\agent-kit',
			shell: true
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

	it('quotes empty and shell-sensitive Windows npm arguments without changing their child values', () => {
		expect(quoteCmdArgument('')).toBe('""');
		expect(quoteCmdArgument('file & name (x86) 100%!.pml')).toBe('"file & name (x86) 100^%!.pml"');
		expect(quoteCmdArgument('file %TEMP%.pml')).toBe('"file ^%TEMP^%.pml"');
	});
});
