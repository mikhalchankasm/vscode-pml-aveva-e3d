const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
    downloadAndUnzipVSCode,
    resolveCliPathFromVSCodeExecutablePath
} = require('@vscode/test-electron');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const extensionId = `${packageJson.publisher}.${packageJson.name}`;
const vsixPath = path.join(root, `${packageJson.name}-${packageJson.version}.vsix`);

async function main() {
    assert(fs.existsSync(vsixPath), `VSIX was not found: ${vsixPath}`);

    const profileRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pml-vsix-install-smoke-'));
    const extensionsDir = path.join(profileRoot, 'extensions');
    const userDataDir = path.join(profileRoot, 'user-data');

    try {
        const vscodeExecutablePath = await downloadAndUnzipVSCode();
        const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);
        const profileArgs = [
            `--extensions-dir=${extensionsDir}`,
            `--user-data-dir=${userDataDir}`
        ];

        runVsCodeCli(cliPath, ['--install-extension', vsixPath, '--force', ...profileArgs]);
        const installed = runVsCodeCli(cliPath, ['--list-extensions', '--show-versions', ...profileArgs]);
        const expectedEntry = `${extensionId}@${packageJson.version}`.toLowerCase();

        assert(
            installed.stdout.toLowerCase().split(/\r?\n/).includes(expectedEntry),
            `Disposable VS Code profile did not report ${extensionId}@${packageJson.version} as installed.\n${installed.stdout}\n${installed.stderr}`
        );

        console.log(`Disposable VSIX install smoke passed: ${expectedEntry}`);
    } finally {
        fs.rmSync(profileRoot, { recursive: true, force: true });
    }
}

function runVsCodeCli(cliPath, args) {
    const usesWindowsShell = process.platform === 'win32';
    const command = usesWindowsShell ? `"${cliPath}"` : cliPath;
    const result = cp.spawnSync(command, args, {
        cwd: root,
        encoding: 'utf8',
        shell: usesWindowsShell,
        windowsHide: true
    });

    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(`VS Code CLI failed with exit code ${result.status}.\n${result.stdout ?? ''}\n${result.stderr ?? ''}`);
    }

    return {
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? ''
    };
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
