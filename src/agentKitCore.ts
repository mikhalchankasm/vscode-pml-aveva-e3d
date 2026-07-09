import type { ExecFileOptionsWithStringEncoding } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface NpmExecution {
    command: string;
    args: string[];
    options: ExecFileOptionsWithStringEncoding;
}

export interface NpmExecutionRuntime {
    executablePath?: string;
    npmCliPath?: string;
}

export function createNpmExecutionOptions(
    platform: NodeJS.Platform,
    cwd: string,
    args: string[] = [],
    runtime: NpmExecutionRuntime = {}
): NpmExecution {
    const isWindows = platform === 'win32';
    if (isWindows) {
        const npmCliPath = runtime.npmCliPath ?? resolveWindowsNpmCliPath();
        if (!npmCliPath) {
            throw new Error('Unable to locate npm-cli.js. Ensure Node.js and npm are installed and available on PATH.');
        }

        return {
            command: runtime.executablePath ?? process.execPath,
            args: [npmCliPath, ...args],
            options: {
                cwd,
                encoding: 'utf8',
                maxBuffer: 20 * 1024 * 1024,
                shell: false,
                env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
            }
        };
    }

    return {
        command: 'npm',
        args,
        options: {
            cwd,
            encoding: 'utf8',
            maxBuffer: 20 * 1024 * 1024,
            shell: false,
            env: process.env
        }
    };
}

export function canRunAgentKit(workspaceTrusted: boolean): boolean {
    return workspaceTrusted;
}

export function resolveWindowsNpmCliPath(
    pathValue = process.env.PATH ?? '',
    npmExecPath = process.env.npm_execpath,
    fileExists: (filePath: string) => boolean = fs.existsSync
): string | undefined {
    const candidates: string[] = npmExecPath ? [npmExecPath] : [];

    for (const directory of pathValue.split(';')) {
        const normalizedDirectory = directory.trim().replace(/^"|"$/g, '');
        if (normalizedDirectory.length > 0) {
            candidates.push(path.win32.join(normalizedDirectory, 'node_modules', 'npm', 'bin', 'npm-cli.js'));
        }
    }

    return candidates.find(candidate => fileExists(candidate));
}

export function getAgentKitDiscoveryCandidates(workspaceFolderPath: string): string[] {
    return [
        path.join(path.dirname(workspaceFolderPath), 'e3d-pml-agent-kit')
    ];
}
