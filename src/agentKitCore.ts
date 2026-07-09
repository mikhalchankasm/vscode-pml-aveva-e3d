import type { ExecFileOptionsWithStringEncoding } from 'child_process';
import * as path from 'path';

export interface NpmExecution {
    command: string;
    args: string[];
    options: ExecFileOptionsWithStringEncoding;
}

export function createNpmExecutionOptions(platform: NodeJS.Platform, cwd: string, args: string[] = []): NpmExecution {
    const isWindows = platform === 'win32';

    return {
        command: isWindows ? 'npm.cmd' : 'npm',
        args: isWindows ? args.map(quoteCmdArgument) : args,
        options: {
            cwd,
            encoding: 'utf8',
            maxBuffer: 20 * 1024 * 1024,
            shell: isWindows
        }
    };
}

export function canRunAgentKit(workspaceTrusted: boolean): boolean {
    return workspaceTrusted;
}

export function quoteCmdArgument(argument: string): string {
    if (argument.length === 0) {
        return '""';
    }

    return `"${argument.replace(/(["^&|<>()%!])/g, '^$1')}"`;
}

export function getAgentKitDiscoveryCandidates(workspaceFolderPath: string): string[] {
    return [
        path.join(path.dirname(workspaceFolderPath), 'e3d-pml-agent-kit')
    ];
}
