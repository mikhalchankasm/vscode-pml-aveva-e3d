const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const quickActionsPath = path.join(root, 'src', 'quickActions.ts');
const packagePath = path.join(root, 'package.json');
const srcDir = path.join(root, 'src');

const quickActionsSource = fs.readFileSync(quickActionsPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const quickActionCommands = collectMatches(quickActionsSource, /command:\s*'([^']+)'/g);
const contributedCommands = new Set(
    (packageJson.contributes?.commands ?? []).map(command => command.command)
);
const registeredCommands = new Set();

for (const filePath of collectTypeScriptFiles(srcDir)) {
    const source = fs.readFileSync(filePath, 'utf8');
    for (const command of collectMatches(source, /registerCommand\(\s*'([^']+)'/g)) {
        registeredCommands.add(command);
    }
}

const missing = quickActionCommands
    .filter(command => !contributedCommands.has(command) && !registeredCommands.has(command));

if (missing.length > 0) {
    console.error('Quick Actions reference command IDs that are not contributed or registered:');
    for (const command of missing) {
        console.error(`- ${command}`);
    }
    process.exit(1);
}

console.log(`Quick Actions command validation passed (${quickActionCommands.length} references).`);

function collectMatches(source, pattern) {
    const matches = [];
    for (const match of source.matchAll(pattern)) {
        matches.push(match[1]);
    }
    return [...new Set(matches)];
}

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
