const { spawnSync } = require('child_process');
const { readdirSync, rmSync } = require('fs');
const { join } = require('path');

for (const entry of readdirSync(process.cwd())) {
	if (/^pml-aveva-e3d-.*\.vsix(?:\.sha256)?$/i.test(entry)) {
		rmSync(join(process.cwd(), entry), { force: true });
	}
}

const result = spawnSync('npx', ['@vscode/vsce', 'package', '--no-yarn'], {
	stdio: 'inherit',
	shell: process.platform === 'win32'
});

if (result.error) {
	console.error(result.error.message);
}

process.exit(result.status ?? 1);
