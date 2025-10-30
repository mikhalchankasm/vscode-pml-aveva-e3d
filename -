/**
 * esbuild configuration for PML AVEVA E3D Extension
 * Bundles both the extension and language server into single files
 */

const esbuild = require('esbuild');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd(result => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	}
};

async function main() {
	const ctx = await esbuild.context({
		// Extension entry point
		entryPoints: [
			'src/extension.ts',
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'out/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			esbuildProblemMatcherPlugin,
		],
		loader: {
			'.ts': 'ts'
		},
		define: {
			'process.env.NODE_ENV': production ? '"production"' : '"development"'
		}
	});

	// Language Server bundle
	const ctxServer = await esbuild.context({
		entryPoints: [
			'packages/pml-language-server/src/server.ts',
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'packages/pml-language-server/out/server.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			esbuildProblemMatcherPlugin,
		],
		loader: {
			'.ts': 'ts'
		},
		define: {
			'process.env.NODE_ENV': production ? '"production"' : '"development"'
		}
	});

	if (watch) {
		await ctx.watch();
		await ctxServer.watch();
		console.log('[watch] Watching for changes...');
	} else {
		await ctx.rebuild();
		await ctxServer.rebuild();
		await ctx.dispose();
		await ctxServer.dispose();
		console.log('[build] Build complete');
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
