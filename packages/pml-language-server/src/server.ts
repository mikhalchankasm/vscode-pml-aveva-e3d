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
	WorkDoneProgressServerReporter,
	DidChangeWatchedFilesParams,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { Parser, parserModeFromUri } from './parser/parser';
import { detectTypos } from './diagnostics/typoDetector';
import { FileChangeDebouncer } from './index/fileChangeDebouncer';
import { SymbolIndex } from './index/symbolIndex';
import { WatchedFileIndexer } from './index/watchedFileIndexer';
import { WorkspaceIndexer } from './index/workspaceIndexer';
import { DocumentSymbolProvider } from './providers/documentSymbolProvider';
import { DefinitionProvider } from './providers/definitionProvider';
import { ReferencesProvider } from './providers/referencesProvider';
import { WorkspaceSymbolProvider } from './providers/workspaceSymbolProvider';
import { HoverProvider } from './providers/hoverProvider';
import { CompletionProvider } from './providers/completionProvider';
import { SignatureHelpProvider } from './providers/signatureHelpProvider';
import { RenameProvider } from './providers/renameProvider';
import { SemanticTokensProvider, semanticTokensLegend } from './providers/semanticTokensProvider';
import { ArrayIndexChecker } from './analysis/arrayIndexChecker';
import { FormReferenceValidator } from './analysis/formReferenceValidator';
import { limitDiagnostics } from './utils/diagnosticLimits';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Document AST cache - REMOVED: was never used, caused memory leak
// Providers use symbolIndex instead

// Symbol index for workspace
const symbolIndex = new SymbolIndex();
const workspaceIndexer = new WorkspaceIndexer(symbolIndex, connection, uri => documents.get(uri) !== undefined);

// Providers
const documentSymbolProvider = new DocumentSymbolProvider(symbolIndex);
const definitionProvider = new DefinitionProvider(symbolIndex, documents);
const referencesProvider = new ReferencesProvider(symbolIndex, documents);
const workspaceSymbolProvider = new WorkspaceSymbolProvider(symbolIndex);
const hoverProvider = new HoverProvider(symbolIndex, referencesProvider);
const completionProvider = new CompletionProvider(symbolIndex);
const signatureHelpProvider = new SignatureHelpProvider(symbolIndex);
const renameProvider = new RenameProvider(symbolIndex, documents);
const semanticTokensProvider = new SemanticTokensProvider(documents);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let hasDiagnosticRelatedInformationCapability = false;
let pendingWorkspaceRefresh: { reason: string; progressMessage: string } | undefined;

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
			// Rename Provider (F2)
			renameProvider: {
				prepareProvider: true
			},
			// Semantic Tokens (enhanced syntax highlighting)
			semanticTokensProvider: {
				legend: semanticTokensLegend,
				full: true
			},
			// Future providers (Phase 2+)
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
		try {
			await connection.client.register(DidChangeConfigurationNotification.type, undefined);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			connection.console.warn(`Unable to register configuration-change notifications: ${message}`);
		}
	}

	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(event => {
			connection.console.log('Workspace folder change event received.');
			void refreshWorkspaceIndex(
				`workspace folders changed: +${event.added.length}, -${event.removed.length}`,
				'Re-indexing workspace...'
			);
		});
	}

	// Index workspace on startup with progress indicator
	await refreshWorkspaceIndex('startup', 'Scanning workspace...');

	connection.console.log('PML Language Server initialized');
});

function workspaceFolderToPath(folder: { uri: string }): string {
	// Parse URI properly to handle both local paths and UNC paths.
	// file:///d:/path -> d:\path (Windows local)
	// file://server/share/path -> \\server\share\path (UNC)
	return URI.parse(folder.uri).fsPath;
}

async function refreshWorkspaceIndex(reason: string, progressMessage: string): Promise<void> {
	if (workspaceIndexer.isIndexing()) {
		connection.console.warn(`Skipped workspace re-index (${reason}): indexing already in progress`);
		pendingWorkspaceRefresh = { reason, progressMessage };
		return;
	}

	let progress: WorkDoneProgressServerReporter | undefined;
	let workspaceScanCompleted = false;
	try {
		const workspaceFolders = await connection.workspace.getWorkspaceFolders();
		symbolIndex.clear();

		if (workspaceFolders && workspaceFolders.length > 0) {
			const folders = workspaceFolders.map(workspaceFolderToPath);
			connection.console.log(`Indexing workspace (${reason}): ${folders.join(', ')}`);

			progress = await connection.window.createWorkDoneProgress();
			progress.begin('PML', 0, progressMessage, false);

			await workspaceIndexer.indexWorkspace(folders, progress);
		} else {
			connection.console.log(`No workspace folders to index (${reason})`);
		}

		workspaceScanCompleted = true;
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		connection.console.error(`Failed to index workspace (${reason}): ${message}`);
	} finally {
		for (const document of documents.all()) {
			workspaceIndexer.indexDocument(document);
		}

		const stats = symbolIndex.getStats();
		const status = workspaceScanCompleted ? 'Workspace indexed' : 'Open documents re-indexed after workspace indexing failure';
		connection.console.log(`${status} (${reason}): ${stats.methods} methods, ${stats.functions} functions, ${stats.objects} objects, ${stats.forms} forms in ${stats.files} files`);

		if (progress) {
			try {
				progress.done();
			} catch {
				// ignore secondary errors
			}
		}

		const pendingRefresh = pendingWorkspaceRefresh;
		pendingWorkspaceRefresh = undefined;
		if (pendingRefresh) {
			void refreshWorkspaceIndex(pendingRefresh.reason, pendingRefresh.progressMessage);
		}
	}
}

/**
 * File Watcher - Handle changes to files on disk (not opened in editor)
 * This ensures the index stays up-to-date when files are modified externally
 */
const FILE_WATCHER_DEBOUNCE_MS = 250;
const watchedFileIndexer = new WatchedFileIndexer({
	symbolIndex,
	isDocumentOpen: uri => Boolean(documents.get(uri)),
	logger: connection.console
});
const watchedFileChangeDebouncer = new FileChangeDebouncer(
	FILE_WATCHER_DEBOUNCE_MS,
	changes => watchedFileIndexer.process(changes)
);

connection.onDidChangeWatchedFiles((params: DidChangeWatchedFilesParams) => {
	watchedFileChangeDebouncer.enqueue(params.changes);
});

// PML Settings interface
interface PMLSettings {
	maxNumberOfProblems: number;
	trace: {
		server: string;
	};
	diagnostics: {
		typeChecking: 'error' | 'warning' | 'off';
		unusedVariables: 'warning' | 'off';
		arrayIndexZero: 'error' | 'warning' | 'off';
		typoDetection: 'warning' | 'off';
		formErrors: 'error' | 'warning' | 'off';
		formReferences: 'error' | 'warning' | 'off';
	};
}

// Default settings
const defaultSettings: PMLSettings = {
	maxNumberOfProblems: 1000,
	trace: {
		server: 'off'
	},
	diagnostics: {
		typeChecking: 'error',
		unusedVariables: 'warning',
		arrayIndexZero: 'error',
		typoDetection: 'off',  // Default off; when enabled, uses Levenshtein distance on parse errors
		formErrors: 'off',
		formReferences: 'off'
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
	connection.sendDiagnostics({ uri: e.document.uri, diagnostics: [] });
	// Cancel pending validation for closed document
	const timer = validationTimers.get(e.document.uri);
	if (timer) {
		clearTimeout(timer);
		validationTimers.delete(e.document.uri);
	}
});

// Debounce validation to avoid excessive revalidation (max 3-5/s)
const validationTimers: Map<string, NodeJS.Timeout> = new Map();
const VALIDATION_DEBOUNCE_MS = 200; // 200ms = max 5 validations/second

// The content of a text document has changed
documents.onDidChangeContent(change => {
	// Cancel previous validation timer
	const existingTimer = validationTimers.get(change.document.uri);
	if (existingTimer) {
		clearTimeout(existingTimer);
	}

	// Schedule new validation after debounce period
	const timer = setTimeout(() => {
		validationTimers.delete(change.document.uri);
		validateTextDocument(change.document);
	}, VALIDATION_DEBOUNCE_MS);

	validationTimers.set(change.document.uri, timer);
});

// Document opened - validate immediately
documents.onDidOpen(event => {
	validateTextDocument(event.document);
});

// Document saved - validate immediately (bypass debounce)
documents.onDidSave(event => {
	// Cancel any pending debounced validation
	const timer = validationTimers.get(event.document.uri);
	if (timer) {
		clearTimeout(timer);
		validationTimers.delete(event.document.uri);
	}
	// Validate immediately on save
	validateTextDocument(event.document);
});

/**
 * Validate document (AST-based diagnostics)
 */
async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	const text = textDocument.getText();

	const diagnostics: Diagnostic[] = [];
	let maxNumberOfProblems = defaultSettings.maxNumberOfProblems;

	try {
		const parseResult = parseAndIndexDocument(textDocument, text);
		const settings = await getDocumentSettings(textDocument.uri);
		maxNumberOfProblems = settings.maxNumberOfProblems ?? defaultSettings.maxNumberOfProblems;

		// Convert parse errors to diagnostics. Form files use a broader DSL, so
		// diagnostics stay opt-in until the form parser is first-class.
		const isFormFile = textDocument.uri.toLowerCase().endsWith('.pmlfrm');
		const formErrors = settings.diagnostics.formErrors ?? defaultSettings.diagnostics.formErrors;
		const shouldReportParseErrors = !isFormFile || formErrors !== 'off';

		if (shouldReportParseErrors) {
			const parseErrorSeverity = isFormFile && formErrors === 'warning'
				? DiagnosticSeverity.Warning
				: DiagnosticSeverity.Error;
			for (const error of parseResult.errors) {
				diagnostics.push({
					severity: parseErrorSeverity,
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
		// Analyzes parse errors to suggest corrections for common keyword typos
		// Uses Levenshtein distance to find similar keywords
		// Only checks tokens that caused parse errors to avoid false positives
		if (settings.diagnostics.typoDetection !== 'off' && !isFormFile) {
			const typoDiagnostics = detectTypos(textDocument, parseResult.errors);
			diagnostics.push(...typoDiagnostics);
		}

		// Array index checking (arr[0] error)
		if (settings.diagnostics.arrayIndexZero !== 'off') {
			const arrayChecker = new ArrayIndexChecker();
			const arrayDiagnostics = arrayChecker.check(parseResult.ast, textDocument.getText());

			// Adjust severity based on settings
			for (const diag of arrayDiagnostics) {
				if (settings.diagnostics.arrayIndexZero === 'warning') {
					diag.severity = DiagnosticSeverity.Warning;
				}
				diagnostics.push(diag);
			}
		}

		if (isFormFile && settings.diagnostics.formReferences !== 'off' && parseResult.errors.length === 0) {
			const formReferenceSeverity = settings.diagnostics.formReferences === 'error'
				? DiagnosticSeverity.Error
				: DiagnosticSeverity.Warning;
			const formReferenceValidator = new FormReferenceValidator();
			diagnostics.push(...formReferenceValidator.check(parseResult.ast, formReferenceSeverity));
		}

		connection.console.log(`Parsed ${textDocument.uri}: ${parseResult.errors.length} parse errors, ${diagnostics.length} total diagnostics, ${parseResult.ast.body.length} top-level statements`);

	} catch (error: unknown) {
		// Fallback: if parser crashes completely
		const message = error instanceof Error ? error.message : String(error);
		connection.console.error(`Parser crash on ${textDocument.uri}: ${message}`);

		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: {
				start: { line: 0, character: 0 },
				end: { line: 0, character: 0 }
			},
			message: `Parser error: ${message}`,
			source: 'pml-parser'
		});
	}

	// Send diagnostics to client
	connection.sendDiagnostics({
		uri: textDocument.uri,
		diagnostics: limitDiagnostics(diagnostics, maxNumberOfProblems)
	});
}

function parseAndIndexDocument(textDocument: TextDocument, text = textDocument.getText()): ReturnType<Parser['parse']> {
	const parser = new Parser();
	const parseResult = parser.parse(text, { mode: parserModeFromUri(textDocument.uri) });

	// Keep Outline and navigation responsive before slower diagnostics settings resolve.
	symbolIndex.indexFile(textDocument.uri, parseResult.ast, textDocument.version, text);

	return parseResult;
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
	const document = documents.get(params.textDocument.uri);
	if (document && !symbolIndex.isFileVersionIndexed(document.uri, document.version)) {
		parseAndIndexDocument(document);
	}
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

/**
 * Rename Provider (F2)
 */
connection.onPrepareRename(params => {
	return renameProvider.prepareRename(params);
});

connection.onRenameRequest(params => {
	return renameProvider.provide(params);
});

/**
 * Semantic Tokens Provider (enhanced syntax highlighting)
 */
connection.languages.semanticTokens.on(params => {
	return semanticTokensProvider.provideFull(params);
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();

connection.console.log('PML Language Server started');
