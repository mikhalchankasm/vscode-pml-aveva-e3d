const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
    const extensionDevelopmentPath = path.resolve(__dirname, '..');
    const extensionTestsPath = path.resolve(__dirname, 'extension-host-smoke.cjs');

    await runTests({
        extensionDevelopmentPath,
        extensionTestsPath,
        launchArgs: [
            '--disable-workspace-trust',
            '--skip-welcome',
            '--skip-release-notes'
        ]
    });
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
