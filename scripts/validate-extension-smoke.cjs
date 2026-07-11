const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const srcDir = path.join(root, 'src');

const contributedCommands = new Set(
    (packageJson.contributes?.commands ?? []).map(command => command.command)
);
const packageScripts = packageJson.scripts ?? {};
const source = collectTypeScriptFiles(srcDir)
    .map(filePath => fs.readFileSync(filePath, 'utf8'))
    .join('\n');

const criticalCommands = [
    'pml.quickActions.open',
    'pml.agentKit.reviewCurrentFile',
    'pml.agentKit.explainCurrentFinding',
    'pml.agentKit.openHelpForFinding',
    'pml.agentKit.checkHealth',
    'pml.agentKit.checkLiveE3dAvoxStatus',
    'pml.prints.actions',
    'pml.prints.next',
    'pml.prints.previous',
    'pml.prints.commentAll',
    'pml.prints.uncommentAll',
    'pml.prints.deleteAll',
    'pml.insertMethodDocBlock',
    'pml.generateMethodsSummary',
    'pml.updateMethodsSummary',
    'pml.formatDocument'
];

const requiredSourceSnippets = [
    'missing-form-callback',
    'Generate callback method .',
	'pml.goToCallableDefinition',
    'PMLCodeActionProvider.providedCodeActionKinds',
    'vscode.CodeActionKind.QuickFix'
];

const requiredScripts = [
    'pml:parse',
    'pml:diagnose',
    'pml:symbols',
    'pml:scope',
    'test:extension-smoke',
    'test:vsix-install-smoke',
    'validate:quick-actions',
    'validate:vsix'
];

const missingContributions = criticalCommands.filter(command => !contributedCommands.has(command));
const missingSourceReferences = criticalCommands.filter(command => !source.includes(command));
const missingSourceSnippets = requiredSourceSnippets.filter(snippet => !source.includes(snippet));
const missingScripts = requiredScripts.filter(script => typeof packageScripts[script] !== 'string');

if (
    missingContributions.length > 0 ||
    missingSourceReferences.length > 0 ||
    missingSourceSnippets.length > 0 ||
    missingScripts.length > 0
) {
    if (missingContributions.length > 0) {
        console.error('Critical commands are missing package.json contributions:');
        for (const command of missingContributions) {
            console.error(`- ${command}`);
        }
    }

    if (missingSourceReferences.length > 0) {
        console.error('Critical commands are missing source registrations/references:');
        for (const command of missingSourceReferences) {
            console.error(`- ${command}`);
        }
    }

    if (missingScripts.length > 0) {
        console.error('Required package scripts are missing:');
        for (const script of missingScripts) {
            console.error(`- ${script}`);
        }
    }

    if (missingSourceSnippets.length > 0) {
        console.error('Required extension smoke source markers are missing:');
        for (const snippet of missingSourceSnippets) {
            console.error(`- ${snippet}`);
        }
    }

    process.exit(1);
}

console.log(`Extension smoke validation passed (${criticalCommands.length} commands, ${requiredScripts.length} scripts, ${requiredSourceSnippets.length} source markers).`);

function collectTypeScriptFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const filePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectTypeScriptFiles(filePath));
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            files.push(filePath);
        }
    }
    return files;
}
