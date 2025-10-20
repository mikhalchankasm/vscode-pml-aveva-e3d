/**
 * Built-In Methods Loader - Loads method definitions from knowledge base MD files
 *
 * Parses objects/*.md files to extract method signatures, parameters, and documentation
 */

import * as fs from 'fs';
import * as path from 'path';
import { CompletionItem, CompletionItemKind, InsertTextFormat, MarkupKind } from 'vscode-languageserver/node';

export interface MethodInfo {
	name: string;
	signature: string;
	result: string;
	purpose: string;
	documentation?: string;
	insertText?: string;
	hasSnippet?: boolean;
}

export interface TypeMethods {
	typeName: string; // STRING, ARRAY, REAL, etc.
	methods: MethodInfo[];
}

/**
 * Built-In Methods Loader
 */
export class BuiltInMethodsLoader {
	private knowledgeBasePath: string;
	private typeMethodsCache: Map<string, MethodInfo[]>;

	constructor(workspaceRoot?: string, extensionPath?: string) {
		// Try to find knowledge base path in order of priority:
		// 1. Workspace root (for development/testing with local objects/)
		// 2. Extension path (for bundled VSIX)
		// 3. Relative to compiled JS (__dirname)

		if (workspaceRoot) {
			const workspacePath = path.join(workspaceRoot, 'objects');
			if (fs.existsSync(workspacePath)) {
				this.knowledgeBasePath = workspacePath;
			} else if (extensionPath) {
				// Use bundled knowledge base from extension
				this.knowledgeBasePath = path.join(extensionPath, 'objects');
			} else {
				// Fallback: relative to compiled JS
				this.knowledgeBasePath = path.join(__dirname, '..', '..', '..', '..', 'objects');
			}
		} else if (extensionPath) {
			this.knowledgeBasePath = path.join(extensionPath, 'objects');
		} else {
			this.knowledgeBasePath = path.join(__dirname, '..', '..', '..', '..', 'objects');
		}

		this.typeMethodsCache = new Map();
	}

	/**
	 * Load all built-in methods from knowledge base
	 */
	public loadAllMethods(): void {
		const typesToLoad = ['STRING', 'ARRAY', 'REAL', 'BOOLEAN', 'DBREF'];

		for (const typeName of typesToLoad) {
			const methods = this.loadMethodsForType(typeName);
			if (methods.length > 0) {
				this.typeMethodsCache.set(typeName, methods);
			}
		}
	}

	/**
	 * Get methods for a specific type
	 */
	public getMethodsForType(typeName: string): MethodInfo[] {
		// Check cache first
		if (this.typeMethodsCache.has(typeName)) {
			return this.typeMethodsCache.get(typeName)!;
		}

		// Load from file
		const methods = this.loadMethodsForType(typeName);
		this.typeMethodsCache.set(typeName, methods);
		return methods;
	}

	/**
	 * Get completion items for a specific type
	 */
	public getCompletionItemsForType(typeName: string): CompletionItem[] {
		const methods = this.getMethodsForType(typeName);

		return methods.map(method => {
			const item: CompletionItem = {
				label: method.name,
				kind: CompletionItemKind.Method,
				detail: method.result ? `${typeName} → ${method.result}` : typeName,
				documentation: {
					kind: MarkupKind.Markdown,
					value: this.formatDocumentation(method)
				}
			};

			// Add snippet if method has parameters
			if (method.hasSnippet && method.insertText) {
				item.insertText = method.insertText;
				item.insertTextFormat = InsertTextFormat.Snippet;
			}

			return item;
		});
	}

	/**
	 * Load methods from MD file for specific type
	 */
	private loadMethodsForType(typeName: string): MethodInfo[] {
		const fileName = `${typeName.toLowerCase()} object.md`;
		const filePath = path.join(this.knowledgeBasePath, fileName);

		if (!fs.existsSync(filePath)) {
			return [];
		}

		try {
			const content = fs.readFileSync(filePath, 'utf-8');
			return this.parseMethods(content, typeName);
		} catch (error) {
			console.error(`Error loading methods from ${filePath}:`, error);
			return [];
		}
	}

	/**
	 * Parse methods from MD file content
	 */
	private parseMethods(content: string, typeName: string): MethodInfo[] {
		const methods: MethodInfo[] = [];

		// Look for methods table (| Name | Result | Purpose |)
		const tableMatch = content.match(/\|\s*Name\s*\|\s*Result\s*\|\s*Purpose\s*\|([\s\S]*?)(?=\n\n|```|$)/);

		if (!tableMatch) {
			return methods;
		}

		const tableContent = tableMatch[1];
		const lines = tableContent.split('\n');

		for (const line of lines) {
			// Skip separator lines (|---|---|---|)
			if (line.match(/^\s*\|[\s:-]+\|[\s:-]+\|[\s:-]+\|\s*$/)) {
				continue;
			}

			// Parse table row: | Name | Result | Purpose |
			const match = line.match(/^\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
			if (!match) {
				continue;
			}

			const [, nameCell, resultCell, purposeCell] = match;

			// Extract method name (may include parameters)
			const methodMatch = nameCell.match(/^(\w+)/);
			if (!methodMatch) {
				continue;
			}

			const methodName = methodMatch[1];
			const signature = nameCell.trim();
			const result = resultCell.trim();
			const purpose = purposeCell.trim();

			// Determine if method needs parameters (has parentheses with content)
			const hasParams = /\([^)]+\)/.test(signature);
			const hasSnippet = hasParams;

			// Create snippet for methods with parameters
			let insertText = methodName;
			if (hasSnippet) {
				// Extract parameter names from signature
				const paramsMatch = signature.match(/\(([^)]+)\)/);
				if (paramsMatch) {
					const params = paramsMatch[1].split(',').map(p => p.trim());
					const snippetParams = params.map((_, i) => `\${${i + 1}}`).join(', ');
					insertText = `${methodName}(${snippetParams})$0`;
				} else {
					insertText = `${methodName}($1)$0`;
				}
			}

			methods.push({
				name: methodName,
				signature,
				result,
				purpose,
				insertText,
				hasSnippet
			});
		}

		return methods;
	}

	/**
	 * Format method documentation for hover/completion
	 */
	private formatDocumentation(method: MethodInfo): string {
		let doc = `**${method.signature}**\n\n`;

		if (method.result && method.result !== 'NO RESULT') {
			doc += `**Returns:** \`${method.result}\`\n\n`;
		}

		doc += method.purpose;

		return doc;
	}

	/**
	 * Check if knowledge base is available
	 */
	public isKnowledgeBaseAvailable(): boolean {
		return fs.existsSync(this.knowledgeBasePath);
	}

	/**
	 * Get available types in knowledge base
	 */
	public getAvailableTypes(): string[] {
		if (!fs.existsSync(this.knowledgeBasePath)) {
			return [];
		}

		const files = fs.readdirSync(this.knowledgeBasePath);
		const types: string[] = [];

		for (const file of files) {
			const match = file.match(/^(\w+) object\.md$/);
			if (match) {
				types.push(match[1].toUpperCase());
			}
		}

		return types;
	}
}
