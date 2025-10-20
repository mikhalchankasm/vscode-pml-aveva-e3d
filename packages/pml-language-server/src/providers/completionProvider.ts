/**
 * Enhanced Completion Provider - Context-aware code completion with type inference
 */

import {
	CompletionItem,
	CompletionItemKind,
	CompletionParams,
	InsertTextFormat
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolIndex } from '../index/symbolIndex';
import { TypeInferenceEngine } from '../analysis/typeInference';
import { BuiltInMethodsLoader } from '../knowledge/builtInMethodsLoader';
import { Parser } from '../parser/parser';
import { Lexer } from '../parser/lexer';

export class CompletionProvider {
	private typeInference: TypeInferenceEngine;
	private methodsLoader: BuiltInMethodsLoader;

	constructor(private symbolIndex: SymbolIndex, workspaceRoot?: string) {
		this.typeInference = new TypeInferenceEngine();
		this.methodsLoader = new BuiltInMethodsLoader(workspaceRoot);

		// Pre-load knowledge base
		try {
			this.methodsLoader.loadAllMethods();
		} catch (error) {
			console.error('Failed to load knowledge base:', error);
		}
	}

	public provide(params: CompletionParams, document: TextDocument): CompletionItem[] {
		const position = params.position;
		const textBeforeCursor = document.getText({
			start: { line: position.line, character: 0 },
			end: position
		});

		const items: CompletionItem[] = [];

		// Check if we're typing after a dot (method completion)
		if (textBeforeCursor.endsWith('.')) {
			// Method completion - offer all workspace methods
			return this.getMethodCompletions();
		}

		// Check if typing after a variable (for method calls)
		// Match: !variable. or !!global. or identifier.
		const memberMatch = textBeforeCursor.match(/(!{1,2})?(\w+)\.\s*$/);
		if (memberMatch) {
			const varName = memberMatch[2];
			const isVariable = !!memberMatch[1]; // Has ! or !!

			// Try to infer variable type
			const varType = this.inferVariableType(varName, document);

			if (varType && varType !== 'ANY') {
				// Offer type-specific methods from knowledge base
				const typeMethods = this.methodsLoader.getCompletionItemsForType(varType);
				if (typeMethods.length > 0) {
					return typeMethods;
				}
			}

			// Fallback: offer all built-in methods
			items.push(...this.getBuiltInMethodCompletions());
			return items;
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
	 * Infer variable type from document context
	 */
	private inferVariableType(varName: string, document: TextDocument): string | null {
		try {
			// Parse the document
			const text = document.getText();
			const lexer = new Lexer(text);
			const tokens = lexer.scanTokens();
			const parser = new Parser(tokens);
			const program = parser.parse();

			// Analyze program to build type context
			const context = this.typeInference.analyzeProgram(program);

			// Get variable type
			const type = this.typeInference.getVariableType(varName, context);

			if (type) {
				return type.kind;
			}

			return null;
		} catch (error) {
			// Parse error - gracefully fall back
			console.error('Type inference failed:', error);
			return null;
		}
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
			{ label: 'upcase', kind: CompletionItemKind.Method, detail: 'STRING → STRING', documentation: 'Convert to uppercase' },
			{ label: 'lowcase', kind: CompletionItemKind.Method, detail: 'STRING → STRING', documentation: 'Convert to lowercase' },
			{ label: 'trim', kind: CompletionItemKind.Method, detail: 'STRING → STRING', documentation: 'Remove whitespace' },
			{ label: 'length', kind: CompletionItemKind.Method, detail: 'STRING → REAL', documentation: 'Get string length' },
			{ label: 'substring', kind: CompletionItemKind.Method, detail: 'STRING → STRING', documentation: 'Extract substring', insertText: 'substring($1, $2)$0', insertTextFormat: InsertTextFormat.Snippet },
			{ label: 'real', kind: CompletionItemKind.Method, detail: 'STRING → REAL', documentation: 'Convert to number' },
			{ label: 'match', kind: CompletionItemKind.Method, detail: 'STRING → BOOLEAN', documentation: 'Pattern matching', insertText: 'match($1)$0', insertTextFormat: InsertTextFormat.Snippet },

			// REAL methods
			{ label: 'abs', kind: CompletionItemKind.Method, detail: 'REAL → REAL', documentation: 'Absolute value' },
			{ label: 'round', kind: CompletionItemKind.Method, detail: 'REAL → REAL', documentation: 'Round to integer' },
			{ label: 'floor', kind: CompletionItemKind.Method, detail: 'REAL → REAL', documentation: 'Round down' },
			{ label: 'ceiling', kind: CompletionItemKind.Method, detail: 'REAL → REAL', documentation: 'Round up' },
			{ label: 'string', kind: CompletionItemKind.Method, detail: 'REAL → STRING', documentation: 'Convert to string' },
			{ label: 'sin', kind: CompletionItemKind.Method, detail: 'REAL → REAL', documentation: 'Sine (radians)' },
			{ label: 'cos', kind: CompletionItemKind.Method, detail: 'REAL → REAL', documentation: 'Cosine (radians)' },
			{ label: 'sqrt', kind: CompletionItemKind.Method, detail: 'REAL → REAL', documentation: 'Square root' },

			// ARRAY methods
			{ label: 'size', kind: CompletionItemKind.Method, detail: 'ARRAY → REAL', documentation: 'Number of elements' },
			{ label: 'append', kind: CompletionItemKind.Method, detail: 'ARRAY → BOOLEAN', documentation: 'Add element to end', insertText: 'append($1)$0', insertTextFormat: InsertTextFormat.Snippet },
			{ label: 'first', kind: CompletionItemKind.Method, detail: 'ARRAY → ANY', documentation: 'Get first element (arr[1])' },
			{ label: 'last', kind: CompletionItemKind.Method, detail: 'ARRAY → ANY', documentation: 'Get last element' },
			{ label: 'empty', kind: CompletionItemKind.Method, detail: 'ARRAY → BOOLEAN', documentation: 'Check if empty' },

			// DBREF methods
			{ label: 'query', kind: CompletionItemKind.Method, detail: 'DBREF → STRING', documentation: 'Query attribute as string', insertText: 'query(|$1|)$0', insertTextFormat: InsertTextFormat.Snippet },
			{ label: 'qreal', kind: CompletionItemKind.Method, detail: 'DBREF → REAL', documentation: 'Query attribute as number', insertText: 'qreal(|$1|)$0', insertTextFormat: InsertTextFormat.Snippet },
			{ label: 'qboolean', kind: CompletionItemKind.Method, detail: 'DBREF → BOOLEAN', documentation: 'Query attribute as boolean', insertText: 'qboolean(|$1|)$0', insertTextFormat: InsertTextFormat.Snippet },
			{ label: 'delete', kind: CompletionItemKind.Method, detail: 'DBREF → BOOLEAN', documentation: 'Delete element (use with caution!)' },
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
				filterText: method.name,
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
}
