"use strict";
/**
 * PML Language Server
 * Main entry point for LSP server
 */
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const parser_1 = require("./parser/parser");
// Create a connection for the server
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a document manager
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
// Document AST cache
const documentASTs = new Map();
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    // Check client capabilities
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports:
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', '!', '|']
            },
            hoverProvider: true,
            definitionProvider: true,
            referencesProvider: true,
            documentSymbolProvider: true,
            workspaceSymbolProvider: true,
            renameProvider: true,
            signatureHelpProvider: {
                triggerCharacters: ['(', ',']
            },
            // Future providers
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
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
    connection.console.log('PML Language Server initialized');
});
// Default settings
const defaultSettings = {
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
        arrayIndexZero: 'error'
    }
};
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.pml || defaultSettings));
    }
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
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
/**
 * Validate document (AST-based diagnostics)
 */
async function validateTextDocument(textDocument) {
    const settings = await getDocumentSettings(textDocument.uri);
    const text = textDocument.getText();
    const diagnostics = [];
    try {
        // Parse document to AST
        const parser = new parser_1.Parser();
        const parseResult = parser.parse(text);
        // Cache AST for other providers
        documentASTs.set(textDocument.uri, parseResult.ast);
        // Convert parse errors to diagnostics
        for (const error of parseResult.errors) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: {
                    start: { line: error.token.line - 1, character: error.token.column - 1 },
                    end: { line: error.token.line - 1, character: error.token.column + error.token.length }
                },
                message: error.message,
                source: 'pml-parser'
            });
        }
        // TODO: Add semantic diagnostics
        // - Type checking
        // - Unused variables
        // - Array index validation (!arr[0] -> error)
        // - etc.
        connection.console.log(`Parsed ${textDocument.uri}: ${parseResult.errors.length} errors, ${parseResult.ast.body.length} top-level statements`);
    }
    catch (error) {
        // Fallback: if parser crashes completely
        connection.console.error(`Parser crash on ${textDocument.uri}: ${error}`);
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
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
 * Completion Provider
 * TODO: Replace with AST-based completion
 */
connection.onCompletion((_textDocumentPosition) => {
    // Basic completion for now
    // Will be replaced with type-aware completion from AST
    return [
        {
            label: 'define method',
            kind: node_1.CompletionItemKind.Snippet,
            data: 1
        },
        {
            label: 'if then else',
            kind: node_1.CompletionItemKind.Snippet,
            data: 2
        },
        {
            label: 'do values',
            kind: node_1.CompletionItemKind.Snippet,
            data: 3
        }
    ];
});
connection.onCompletionResolve((item) => {
    // Add detailed documentation for completion items
    if (item.data === 1) {
        item.detail = 'Define a new method';
        item.documentation = 'Creates a new method definition';
    }
    else if (item.data === 2) {
        item.detail = 'If-then-else statement';
        item.documentation = 'Conditional statement';
    }
    else if (item.data === 3) {
        item.detail = 'Do values loop';
        item.documentation = 'Iterate over collection';
    }
    return item;
});
/**
 * Hover Provider
 * TODO: Replace with AST-based hover
 */
connection.onHover((_params) => {
    // Basic hover for now
    return {
        contents: {
            kind: 'markdown',
            value: 'PML Language Server (Alpha)\n\nAST-based analysis coming soon...'
        }
    };
});
// Make the text document manager listen on the connection
documents.listen(connection);
// Listen on the connection
connection.listen();
connection.console.log('PML Language Server started');
//# sourceMappingURL=server.js.map