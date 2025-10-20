/**
 * PML Language Server Client
 * Manages connection between VSCode extension and PML Language Server
 */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export function activateLanguageServer(context: ExtensionContext): LanguageClient {
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('packages', 'pml-language-server', 'out', 'server.js')
	);

	console.log('PML LSP Server path:', serverModule);

	// Check if server.js exists
	const fs = require('fs');
	if (!fs.existsSync(serverModule)) {
		console.error('❌ LSP server.js NOT FOUND at:', serverModule);
		throw new Error(`LSP server.js not found at: ${serverModule}`);
	} else {
		console.log('✅ LSP server.js found');
	}

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { execArgv: ['--nolazy', '--inspect=6009'] }
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for PML documents
		documentSelector: [
			{ scheme: 'file', language: 'pml' },
			{ scheme: 'file', pattern: '**/*.pml' },
			{ scheme: 'file', pattern: '**/*.pmlobj' },
			{ scheme: 'file', pattern: '**/*.pmlfnc' },
			{ scheme: 'file', pattern: '**/*.pmlfrm' },
			{ scheme: 'file', pattern: '**/*.pmlmac' },
			{ scheme: 'file', pattern: '**/*.pmlcmd' }
		],
		synchronize: {
			// Notify the server about file changes to '.pml files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/*.{pml,pmlobj,pmlfnc,pmlfrm,pmlmac,pmlcmd}')
		}
	};

	// Create the language client and start the client
	client = new LanguageClient(
		'pmlLanguageServer',
		'PML Language Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();

	console.log('PML Language Server client activated');

	return client;
}

export function deactivateLanguageServer(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

export function getLanguageClient(): LanguageClient | undefined {
	return client;
}
