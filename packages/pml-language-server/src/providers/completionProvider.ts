/**
 * Enhanced Completion Provider - Context-aware code completion
 */

import {
	CompletionItem,
	CompletionItemKind,
	CompletionParams,
	InsertTextFormat
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolIndex } from '../index/symbolIndex';

type LightweightMethod = {
	name: string;
	parameters: string[];
	documentation?: string;
};

export class CompletionProvider {
	constructor(private symbolIndex: SymbolIndex) {}

	public provide(params: CompletionParams, document: TextDocument): CompletionItem[] {
		const position = params.position;
		const textBeforeCursor = document.getText({
			start: { line: position.line, character: 0 },
			end: position
		});

		const items: CompletionItem[] = [];

		// Check if typing after a variable (for method calls)
		const memberMatch = textBeforeCursor.match(/([!$]?\w+)\s*\.\s*$/);
		if (memberMatch) {
			// Always show only current document methods + built-ins
			// This prevents pollution from workspace methods
			const currentMethods = this.getCurrentDocumentMethodCompletions(document);
			const builtInItems = this.getBuiltInMethodCompletions();
			return [...currentMethods, ...builtInItems];
		}

		// If cursor is after a bare dot, do not spam unrelated completions
		const trimmedText = textBeforeCursor.trimEnd();
		if (trimmedText.endsWith('.')) {
			return [];
		}

		// Keywords and snippets
		items.push(...this.getKeywordCompletions());
		items.push(...this.getSnippetCompletions());

		// Global functions
		items.push(...this.getGlobalFunctionCompletions());

		// Workspace symbols (methods, objects)
		items.push(...this.getWorkspaceSymbolCompletions());

		return items;
	}

	/**
	 * Get user-defined method completions
	 */
	private getMethodCompletions(): CompletionItem[] {
		const methods = this.symbolIndex.getAllMethods();
		return methods.map(method => ({
			label: `.${method.name}`,
			kind: CompletionItemKind.Method,
			detail: `Method (${method.parameters.join(', ')})`,
			documentation: method.documentation,
			insertText: method.name,
			filterText: method.name
		}));
	}

	/**
	 * Get built-in method completions (STRING, REAL, ARRAY, DBREF)
	 */
	private getBuiltInMethodCompletions(): CompletionItem[] {
		return [
			// STRING methods
			{ label: 'upcase', kind: CompletionItemKind.Method, detail: 'STRING -> STRING', documentation: 'Convert to uppercase' },
			{ label: 'lowcase', kind: CompletionItemKind.Method, detail: 'STRING -> STRING', documentation: 'Convert to lowercase' },
			{ label: 'trim', kind: CompletionItemKind.Method, detail: 'STRING -> STRING', documentation: 'Remove whitespace' },
			{ label: 'length', kind: CompletionItemKind.Method, detail: 'STRING -> REAL', documentation: 'Get string length' },
			{ label: 'substring', kind: CompletionItemKind.Method, detail: 'STRING -> STRING', documentation: 'Extract substring', insertText: 'substring($1, $2)$0', insertTextFormat: InsertTextFormat.Snippet },
			{ label: 'real', kind: CompletionItemKind.Method, detail: 'STRING -> REAL', documentation: 'Convert to number' },
			{ label: 'match', kind: CompletionItemKind.Method, detail: 'STRING -> BOOLEAN', documentation: 'Pattern matching', insertText: 'match($1)$0', insertTextFormat: InsertTextFormat.Snippet },

			// REAL methods
			{ label: 'abs', kind: CompletionItemKind.Method, detail: 'REAL -> REAL', documentation: 'Absolute value' },
			{ label: 'round', kind: CompletionItemKind.Method, detail: 'REAL -> REAL', documentation: 'Round to integer' },
			{ label: 'floor', kind: CompletionItemKind.Method, detail: 'REAL -> REAL', documentation: 'Round down' },
			{ label: 'ceiling', kind: CompletionItemKind.Method, detail: 'REAL -> REAL', documentation: 'Round up' },
			{ label: 'string', kind: CompletionItemKind.Method, detail: 'REAL -> STRING', documentation: 'Convert to string' },
			{ label: 'sin', kind: CompletionItemKind.Method, detail: 'REAL -> REAL', documentation: 'Sine (radians)' },
			{ label: 'cos', kind: CompletionItemKind.Method, detail: 'REAL -> REAL', documentation: 'Cosine (radians)' },
			{ label: 'sqrt', kind: CompletionItemKind.Method, detail: 'REAL -> REAL', documentation: 'Square root' },

			// ARRAY methods
			{ label: 'size', kind: CompletionItemKind.Method, detail: 'ARRAY -> REAL', documentation: 'Number of elements' },
			{ label: 'append', kind: CompletionItemKind.Method, detail: 'ARRAY -> BOOLEAN', documentation: 'Add element to end', insertText: 'append($1)$0', insertTextFormat: InsertTextFormat.Snippet },
			{ label: 'first', kind: CompletionItemKind.Method, detail: 'ARRAY -> ANY', documentation: 'Get first element (arr[1])' },
			{ label: 'last', kind: CompletionItemKind.Method, detail: 'ARRAY -> ANY', documentation: 'Get last element' },
			{ label: 'empty', kind: CompletionItemKind.Method, detail: 'ARRAY -> BOOLEAN', documentation: 'Check if empty' },

			// DBREF methods
			{ label: 'query', kind: CompletionItemKind.Method, detail: 'DBREF -> STRING', documentation: 'Query attribute as string', insertText: 'query(|$1|)$0', insertTextFormat: InsertTextFormat.Snippet },
			{ label: 'qreal', kind: CompletionItemKind.Method, detail: 'DBREF -> REAL', documentation: 'Query attribute as number', insertText: 'qreal(|$1|)$0', insertTextFormat: InsertTextFormat.Snippet },
			{ label: 'qboolean', kind: CompletionItemKind.Method, detail: 'DBREF -> BOOLEAN', documentation: 'Query attribute as boolean', insertText: 'qboolean(|$1|)$0', insertTextFormat: InsertTextFormat.Snippet },
			{ label: 'delete', kind: CompletionItemKind.Method, detail: 'DBREF -> BOOLEAN', documentation: 'Delete element (use with caution!)' },
		];
	}

	/**
	 * Get keyword completions
	 */
	private getKeywordCompletions(): CompletionItem[] {
		return [
			{ label: 'define', kind: CompletionItemKind.Keyword },
			{ label: 'method', kind: CompletionItemKind.Keyword },
			{ label: 'endmethod', kind: CompletionItemKind.Keyword },
			{ label: 'object', kind: CompletionItemKind.Keyword },
			{ label: 'endobject', kind: CompletionItemKind.Keyword },
			{ label: 'if', kind: CompletionItemKind.Keyword },
			{ label: 'then', kind: CompletionItemKind.Keyword },
			{ label: 'else', kind: CompletionItemKind.Keyword },
			{ label: 'elseif', kind: CompletionItemKind.Keyword },
			{ label: 'endif', kind: CompletionItemKind.Keyword },
			{ label: 'do', kind: CompletionItemKind.Keyword },
			{ label: 'values', kind: CompletionItemKind.Keyword },
			{ label: 'index', kind: CompletionItemKind.Keyword },
			{ label: 'enddo', kind: CompletionItemKind.Keyword },
			{ label: 'return', kind: CompletionItemKind.Keyword },
			{ label: 'break', kind: CompletionItemKind.Keyword },
			{ label: 'continue', kind: CompletionItemKind.Keyword },
			{ label: 'handle', kind: CompletionItemKind.Keyword },
			{ label: 'any', kind: CompletionItemKind.Keyword },
			{ label: 'endhandle', kind: CompletionItemKind.Keyword },
			{ label: 'is', kind: CompletionItemKind.Keyword },
			{ label: 'STRING', kind: CompletionItemKind.TypeParameter },
			{ label: 'REAL', kind: CompletionItemKind.TypeParameter },
			{ label: 'BOOLEAN', kind: CompletionItemKind.TypeParameter },
			{ label: 'ARRAY', kind: CompletionItemKind.TypeParameter },
			{ label: 'DBREF', kind: CompletionItemKind.TypeParameter },
			{ label: 'eq', kind: CompletionItemKind.Operator, detail: 'Equal to' },
			{ label: 'ne', kind: CompletionItemKind.Operator, detail: 'Not equal to' },
			{ label: 'lt', kind: CompletionItemKind.Operator, detail: 'Less than' },
			{ label: 'le', kind: CompletionItemKind.Operator, detail: 'Less than or equal' },
			{ label: 'gt', kind: CompletionItemKind.Operator, detail: 'Greater than' },
			{ label: 'ge', kind: CompletionItemKind.Operator, detail: 'Greater than or equal' },
			{ label: 'and', kind: CompletionItemKind.Operator },
			{ label: 'or', kind: CompletionItemKind.Operator },
			{ label: 'not', kind: CompletionItemKind.Operator },
			{ label: 'mod', kind: CompletionItemKind.Operator, detail: 'Modulo' },
		];
	}

	/**
	 * Get snippet completions
	 */
	private getSnippetCompletions(): CompletionItem[] {
		return [
			{
				label: 'method',
				kind: CompletionItemKind.Snippet,
				detail: 'Define method',
				insertText: 'define method .$1($2)\n\t$0\nendmethod',
				insertTextFormat: InsertTextFormat.Snippet,
				documentation: 'Create a new method definition'
			},
			{
				label: 'if',
				kind: CompletionItemKind.Snippet,
				detail: 'If statement',
				insertText: 'if ($1) then\n\t$0\nendif',
				insertTextFormat: InsertTextFormat.Snippet
			},
			{
				label: 'ifelse',
				kind: CompletionItemKind.Snippet,
				detail: 'If-else statement',
				insertText: 'if ($1) then\n\t$2\nelse\n\t$0\nendif',
				insertTextFormat: InsertTextFormat.Snippet
			},
			{
				label: 'do',
				kind: CompletionItemKind.Snippet,
				detail: 'Do values loop',
				insertText: 'do $1 values $2\n\t$0\nenddo',
				insertTextFormat: InsertTextFormat.Snippet
			},
			{
				label: 'object',
				kind: CompletionItemKind.Snippet,
				detail: 'Define object',
				insertText: 'define object $1\n\t$0\nendobject',
				insertTextFormat: InsertTextFormat.Snippet
			},
			{
				label: 'handle',
				kind: CompletionItemKind.Snippet,
				detail: 'Error handler',
				insertText: 'handle any\n\t$0\nendhandle',
				insertTextFormat: InsertTextFormat.Snippet
			},
		];
	}

	/**
	 * Get global function completions
	 */
	private getGlobalFunctionCompletions(): CompletionItem[] {
		return [
			{
				label: 'ARRAY',
				kind: CompletionItemKind.Function,
				detail: '() → ARRAY',
				documentation: 'Create new array (1-indexed!)',
				insertText: 'ARRAY()',
			},
			{
				label: 'OBJECT',
				kind: CompletionItemKind.Function,
				detail: '(type) → Object',
				documentation: 'Create object instance',
				insertText: 'OBJECT $1()',
				insertTextFormat: InsertTextFormat.Snippet
			},
			{
				label: 'collectallfor',
				kind: CompletionItemKind.Function,
				detail: '(type, condition) → ARRAY of DBREF',
				documentation: 'Collect database elements',
				insertText: 'collectallfor(|$1|, |$2|)',
				insertTextFormat: InsertTextFormat.Snippet
			},
			{
				label: 'getobject',
				kind: CompletionItemKind.Function,
				detail: '(type, name) → DBREF',
				documentation: 'Get element by name',
				insertText: 'getobject(|$1|, |$2|)',
				insertTextFormat: InsertTextFormat.Snippet
			},
		];
	}

	/**
	 * Get workspace symbol completions (user-defined methods and objects)
	 */
	private getWorkspaceSymbolCompletions(): CompletionItem[] {
		const items: CompletionItem[] = [];

		// Add methods
		const methods = this.symbolIndex.getAllMethods();
		for (const method of methods) {
			items.push({
				label: `.${method.name}`,
				kind: CompletionItemKind.Method,
				detail: `Method (${method.parameters.join(', ')})`,
				documentation: method.documentation,
				filterText: `workspace:${method.name}`,
				sortText: `0${method.name}` // Sort workspace methods first
			});
		}

		// Add objects
		const objects = this.symbolIndex.getAllObjects();
		for (const obj of objects) {
			items.push({
				label: obj.name,
				kind: CompletionItemKind.Class,
				detail: 'Object',
				documentation: obj.documentation,
				sortText: `1${obj.name}`
			});
		}

		return items;
	}

	/**
	 * Get methods defined in the current document (used for !this.)
	 */
	private getCurrentDocumentMethodCompletions(document: TextDocument): CompletionItem[] {
		const fileSymbols = this.symbolIndex.getFileSymbols(document.uri);

		const methodMap: Map<string, LightweightMethod> = new Map();

		if (fileSymbols) {
			for (const method of fileSymbols.methods) {
				methodMap.set(method.name.toLowerCase(), {
					name: method.name,
					parameters: method.parameters,
					documentation: method.documentation
				});
			}
		}

		// Enrich with regexp extraction to catch methods missed by parser (common for forms)
		for (const method of this.extractMethodsFromDocument(document)) {
			const key = method.name.toLowerCase();
			if (!methodMap.has(key)) {
				methodMap.set(key, method);
			}
		}

		const methods = Array.from(methodMap.values());
		if (methods.length === 0) {
			return [];
		}

		return methods.map(method => ({
			label: `.${method.name}`,
			kind: CompletionItemKind.Method,
			detail: method.parameters.length
				? `Method (${method.parameters.map(param => '!' + param).join(', ')})`
				: 'Method',
			documentation: method.documentation,
			insertText: method.name,
			filterText: method.name,
			sortText: `0${method.name}`
		}));
	}

	/**
	 * Fallback: extract methods from the current document text
	 * when the symbol index is not yet populated.
	 */
	private extractMethodsFromDocument(document: TextDocument): LightweightMethod[] {
		const text = document.getText();
		const methodRegex = /^\s*define\s+method\s+\.([A-Za-z0-9_]+)\s*(\(([^)]*)\))?/gim;
		const methods: LightweightMethod[] = [];

		let match: RegExpExecArray | null;
		while ((match = methodRegex.exec(text)) !== null) {
			const params = (match[3] || '')
				.split(',')
				.map(param => param.trim())
				.filter(Boolean)
				.map(param => {
					// Parameter name always starts with !
					const nameMatch = param.match(/!([A-Za-z0-9_]+)/);
					return nameMatch ? nameMatch[1] : param;
				});

			methods.push({
				name: match[1],
				parameters: params
			});
		}

		return methods;
	}
}
