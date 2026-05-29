const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const vsixPath = path.join(root, `pml-aveva-e3d-${version}.vsix`);

if (!fs.existsSync(vsixPath)) {
    fail(`VSIX not found: ${vsixPath}`);
}

const result = spawnSync('tar', ['-tf', vsixPath], {
    cwd: root,
    encoding: 'utf8'
});

if (result.status !== 0) {
    fail(result.stderr || result.stdout || 'Failed to list VSIX contents.');
}

const entries = result.stdout
    .split(/\r?\n/)
    .map(entry => entry.trim())
    .filter(Boolean);

const required = [
    'extension/out/extension.js',
    'extension/packages/pml-language-server/out/server.js',
    'extension/packages/pml-language-server/out/cli.js',
    'extension/package.json',
    'extension.vsixmanifest'
];

const missing = required.filter(entry => !entries.includes(entry));
if (missing.length > 0) {
    fail(`VSIX is missing required files:\n${missing.map(entry => `- ${entry}`).join('\n')}`);
}

const blockedPattern = /(^|\/)(src|node_modules|manuals|objects|\.agents|\.codex|\.claude)\//;
const blocked = entries.filter(entry => blockedPattern.test(entry) || /\.tsx?$/.test(entry) || /\.map$/.test(entry));
if (blocked.length > 0) {
    fail(`VSIX contains blocked development files:\n${blocked.map(entry => `- ${entry}`).join('\n')}`);
}

console.log(`VSIX validation passed (${entries.length} files): ${path.basename(vsixPath)}`);

function fail(message) {
    console.error(message);
    process.exit(1);
}
