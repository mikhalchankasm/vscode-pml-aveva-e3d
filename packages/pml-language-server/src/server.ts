/**
 * PML Language Server
 * Main entry point for LSP server
 */

import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	TextDocumentSyncKind,
	InitializeResult,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	Hover,
	MarkedString,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { Parser, ParseError } from './parser/parser';
import { Program } from './ast/nodes';
import { detectTypos } from './diagnostics/typoDetector';
import { SymbolIndex } from './index/symbolIndex';
import { WorkspaceIndexer } from './index/workspaceIndexer';
import { DocumentSymbolProvider } from './providers/documentSymbolProvider';
import { DefinitionProvider } from './providers/definitionProvider';
import { ReferencesProvider } from './providers/referencesProvider';
import { WorkspaceSymbolProvider } from './providers/workspaceSymbolProvider';
import { HoverProvider } from './providers/hoverProvider';
import { CompletionProvider } from './providers/completionProvider';
import { SignatureHelpProvider } from './providers/signatureHelpProvider';
import { ArrayIndexChecker } from './analysis/arrayIndexChecker';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Document AST cache - REMOVED: was never used, caused memory leak
// Providers use symbolIndex instead

// Symbol index for workspace
const symbolIndex = new SymbolIndex();
const workspaceIndexer = new WorkspaceIndexer(symbolIndex, connection);

// Providers
const documentSymbolProvider = new DocumentSymbolProvider(symbolIndex);
const definitionProvider = new DefinitionProvider(symbolIndex, documents);
const referencesProvider = new ReferencesProvider(symbolIndex, documents);
const workspaceSymbolProvider = new WorkspaceSymbolProvider(symbolIndex);
const hoverProvider = new HoverProvider(symbolIndex);
const completionProvider = new CompletionProvider(symbolIndex);
const signatureHelpProvider = new SignatureHelpProvider(symbolIndex);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Check client capabilities
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports:
			completionProvider: {
				triggerCharacters: ['.', '!', '|']
			},
			hoverProvider: true,
			// Phase 1.3: Workspace Indexing
			definitionProvider: true,
			referencesProvider: true,
			documentSymbolProvider: true,
			workspaceSymbolProvider: true,
			// Phase 1.5: Signature Help
			signatureHelpProvider: {
				triggerCharacters: ['(', ',']
			},
			// TODO: Implement these providers
			// renameProvider: true,
			// Future providers (Phase 2+)
			// semanticTokensProvider: {...},
			// inlayHintProvider: {...},
			// callHierarchyProvider: true,
			// codeLensProvider: {...},
		}
	};

	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}

	return result;
});

connection.onInitialized(async () => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}

	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}

	// Index workspace on startup
	try {
		const workspaceFolders = await connection.workspace.getWorkspaceFolders();
		if (workspaceFolders && workspaceFolders.length > 0) {
			const folders = workspaceFolders.map(f => {
				// Decode URI: file:///d%3A/path -> d:/path -> d:\path
				const decoded = decodeURIComponent(f.uri);
				return decoded.replace('file:///', '').replace(/\//g, '\\');
			});
			connection.console.log(`Indexing workspace: ${folders.join(', ')}`);
			await workspaceIndexer.indexWorkspace(folders);
			const stats = symbolIndex.getStats();
			connection.console.log(`Workspace indexed: ${stats.methods} methods, ${stats.objects} objects, ${stats.forms} forms in ${stats.files} files`);
		}
	} catch (error) {
		connection.console.error(`Failed to index workspace: ${error}`);
	}

	connection.console.log('PML Language Server initialized');
});

// PML Settings interface
interface PMLSettings {
	maxNumberOfProblems: number;
	trace: {
		server: string;
	};
	typeInference: {
		enabled: boolean;
		strictMode: boolean;
	};
	inlayHints: {
		variableTypes: boolean;
		parameterNames: boolean;
	};
	diagnostics: {
		typeChecking: 'error' | 'warning' | 'off';
		unusedVariables: 'warning' | 'off';
		arrayIndexZero: 'error' | 'warning' | 'off';
		typoDetection: 'warning' | 'off';
	};
}

// Default settings
const defaultSettings: PMLSettings = {
	maxNumberOfProblems: 1000,
	trace: {
		server: 'off'
	},
	typeInference: {
		enabled: true,
		strictMode: false
	},
	inlayHints: {
		variableTypes: true,
		parameterNames: true
	},
	diagnostics: {
		typeChecking: 'error',
		unusedVariables: 'warning',
		arrayIndexZero: 'error',
		typoDetection: 'off'  // Matches package.json default; detectTypos() currently disabled
	}
};

let globalSettings: PMLSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<PMLSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <PMLSettings>(
			(change.settings.pml || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<PMLSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'pml'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

// Document opened - validate immediately
documents.onDidOpen(event => {
	validateTextDocument(event.document);
});

// Document saved - revalidate
documents.onDidSave(event => {
	validateTextDocument(event.document);
});

/**
 * Validate document (AST-based diagnostics)
 */
async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	const settings = await getDocumentSettings(textDocument.uri);
	const text = textDocument.getText();

	const diagnostics: Diagnostic[] = [];

	try {
		// Parse document to AST
		const parser = new Parser();
		const parseResult = parser.parse(text);

		// Index document symbols (pass document text for comment extraction)
		// SymbolIndex stores the necessary information from AST
		symbolIndex.indexFile(textDocument.uri, parseResult.ast, textDocument.version, text);

		// Convert parse errors to diagnostics (skip for forms - they have special syntax)
		const isFormFile = textDocument.uri.endsWith('.pmlfrm');

		if (!isFormFile) {
			for (const error of parseResult.errors) {
				diagnostics.push({
					severity: DiagnosticSeverity.Error,
					range: {
						start: { line: error.token.line - 1, character: error.token.column - 1 },
						end: { line: error.token.line - 1, character: error.token.column + error.token.length }
					},
					message: error.message,
					source: 'pml-parser'
				});
			}
		} else {
			// For form files, only log errors but don't show them to user
			if (parseResult.errors.length > 0) {
				connection.console.log(`Form file ${textDocument.uri} has ${parseResult.errors.length} parse errors (suppressed - form syntax not fully supported)`);
			}
		}

		// Semantic diagnostics: typo detection
		// NOTE: Currently disabled (returns empty array) because:
		// - Parser already catches real syntax errors (e.g., "endiff" → parse error)
		// - Text-based heuristics caused too many false positives
		// - Default setting changed to 'off' for transparency
		// Future: Could re-enable with AST-based narrow checking
		if (settings.diagnostics.typoDetection !== 'off' && !isFormFile) {
			const typoDiagnostics = detectTypos(textDocument, parseResult.ast);
			diagnostics.push(...typoDiagnostics);
		}

		// Array index checking (arr[0] error)
		if (settings.diagnostics.arrayIndexZero !== 'off') {
			const arrayChecker = new ArrayIndexChecker();
			const arrayDiagnostics = arrayChecker.check(parseResult.ast);

			// Adjust severity based on settings
			for (const diag of arrayDiagnostics) {
				if (settings.diagnostics.arrayIndexZero === 'warning') {
					diag.severity = DiagnosticSeverity.Warning;
				}
				diagnostics.push(diag);
			}
		}

		connection.console.log(`Parsed ${textDocument.uri}: ${parseResult.errors.length} parse errors, ${diagnostics.length} total diagnostics, ${parseResult.ast.body.length} top-level statements`);

	} catch (error) {
		// Fallback: if parser crashes completely
		connection.console.error(`Parser crash on ${textDocument.uri}: ${error}`);

		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: {
				start: { line: 0, character: 0 },
				end: { line: 0, character: 0 }
			},
			message: `Parser error: ${error}`,
			source: 'pml-parser'
		});
	}

	// Send diagnostics to client
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

/**
 * Completion Provider - Enhanced context-aware completion
 */
connection.onCompletion(params => {
	const document = documents.get(params.textDocument.uri);
	if (!document) return [];

	return completionProvider.provide(params, document);
});

/**
 * Hover Provider - Enhanced with type info and documentation
 */
connection.onHover(params => {
	const document = documents.get(params.textDocument.uri);
	if (!document) return null;

	return hoverProvider.provide(params, document);
});

/**
 * Document Symbol Provider (Outline)
 */
connection.onDocumentSymbol(params => {
	return documentSymbolProvider.provide(params);
});

/**
 * Definition Provider (Go to Definition - F12)
 */
connection.onDefinition(params => {
	return definitionProvider.provide(params);
});

/**
 * References Provider (Find All References - Shift+F12)
 */
connection.onReferences(params => {
	return referencesProvider.provide(params);
});

/**
 * Workspace Symbol Provider (Search symbols - Ctrl+T)
 */
connection.onWorkspaceSymbol(params => {
	return workspaceSymbolProvider.provide(params);
});

/**
 * Signature Help Provider (Parameter hints while typing)
 */
connection.onSignatureHelp(params => {
	const document = documents.get(params.textDocument.uri);
	if (!document) return null;

	return signatureHelpProvider.provide(params, document);
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();

connection.console.log('PML Language Server started');
