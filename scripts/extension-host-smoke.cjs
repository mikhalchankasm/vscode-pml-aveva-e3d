const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vscode = require('vscode');

const extensionId = 'mikhalchankasm.pml-aveva-e3d';

const requiredCommands = [
    'pml.quickActions.open',
    'pml.prints.actions',
    'pml.prints.next',
    'pml.prints.previous',
    'pml.agentKit.checkHealth',
    'pml.insertMethodDocBlock',
    'pml.generateMethodsSummary',
    'pml.updateMethodsSummary',
    'pml.formatDocument'
];

async function run() {
    const extension = vscode.extensions.getExtension(extensionId);
    assert(extension, `Extension ${extensionId} was not found in the extension host.`);

    await extension.activate();
    assert.strictEqual(extension.isActive, true, `Extension ${extensionId} did not activate.`);

    const commands = await vscode.commands.getCommands(true);
    for (const command of requiredCommands) {
        assert(commands.includes(command), `Command ${command} was not registered.`);
    }

    await assertFormCallbackQuickFix();
    await assertAgentKitSetupError();
    await assertPackagedCliAvailability(extension.extensionPath);
}

async function assertFormCallbackQuickFix() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pml-extension-smoke-'));
    const filePath = path.join(tempDir, 'SmokeForm.pmlfrm');
    fs.writeFileSync(
        filePath,
        [
            'setup form !!SmokeForm dialog',
            '    button .btnApply |Apply| callback |!this.apply()|',
            'exit'
        ].join('\n'),
        'utf8'
    );

    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
    await vscode.window.showTextDocument(document);

    const diagnostic = new vscode.Diagnostic(
        new vscode.Range(1, 4, 1, 12),
        "Gadget '.btnApply' callback references missing method '.apply()'",
        vscode.DiagnosticSeverity.Warning
    );
    diagnostic.code = 'missing-form-callback';
    diagnostic.source = 'pml-form-references';
    const diagnostics = vscode.languages.createDiagnosticCollection('pml-extension-smoke');
    diagnostics.set(document.uri, [diagnostic]);

    const actions = await vscode.commands.executeCommand(
        'vscode.executeCodeActionProvider',
        document.uri,
        diagnostic.range,
        vscode.CodeActionKind.QuickFix.value
    );

    assert(
        actions?.some(action => action.title === 'Generate callback method .apply()'),
        'Missing form callback Quick Fix was not provided.'
    );

    diagnostics.dispose();
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    fs.rmSync(tempDir, { recursive: true, force: true });
}

async function assertAgentKitSetupError() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pml-agent-kit-smoke-'));
    const configuration = vscode.workspace.getConfiguration('pml.agentKit');
    const originalPath = configuration.inspect('path')?.globalValue;
    const invalidPath = path.join(tempDir, 'missing-agent-kit');

    try {
        await configuration.update('path', invalidPath, vscode.ConfigurationTarget.Global);
        const result = await vscode.commands.executeCommand('pml.agentKit.checkHealth');

        assert.strictEqual(
            result,
            'PML Agent Kit is not configured. Set pml.agentKit.path to the e3d-pml-agent-kit repository, or open this workspace next to it.',
            'Agent Kit setup errors should explain how to configure a valid repository path.'
        );
    } finally {
        await configuration.update('path', originalPath, vscode.ConfigurationTarget.Global);
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

async function assertPackagedCliAvailability(extensionPath) {
    const cliPath = path.join(extensionPath, 'packages', 'pml-language-server', 'out', 'cli.js');
    assert(fs.existsSync(cliPath), `Packaged PML Assistant CLI was not found at ${cliPath}.`);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pml-extension-cli-smoke-'));
    const filePath = path.join(tempDir, 'SmokeCli.pml');
    fs.writeFileSync(
        filePath,
        [
            'define method .smokeCli()',
            'endmethod'
        ].join('\n'),
        'utf8'
    );

    try {
        const stdout = cp.execFileSync(
            process.execPath,
            [cliPath, 'parse', filePath, '--json'],
            {
                cwd: extensionPath,
                encoding: 'utf8',
                env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
                maxBuffer: 5 * 1024 * 1024
            }
        );
        const result = JSON.parse(stdout);

        assert.strictEqual(result.tool, 'vscode-pml-extension');
        assert.strictEqual(result.command, 'parse');
        assert.strictEqual(result.parse?.ok, true);
        assert.strictEqual(result.parse?.topLevelStatements, 1);
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

module.exports = { run };
