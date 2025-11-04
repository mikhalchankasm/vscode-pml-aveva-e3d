/**
 * Symbol Index - Fast lookup of symbols across workspace
 */

import { Range } from 'vscode-languageserver/node';
import { Program, MethodDefinition, ObjectDefinition, FormDefinition } from '../ast/nodes';
import { extractPrecedingComments, formatDocumentation } from '../utils/commentExtractor';

/**
 * Symbol information stored in index
 */
export interface SymbolInfo {
	name: string;
	kind: SymbolKind;
	uri: string;
	range: Range;
	containerName?: string; // For methods in objects: object name
	deprecated?: boolean;
	documentation?: string;
}

export enum SymbolKind {
	Method = 'method',
	Object = 'object',
	Form = 'form',
	Frame = 'frame',
	Variable = 'variable'
}

/**
 * Method-specific information
 */
export interface MethodInfo extends SymbolInfo {
	kind: SymbolKind.Method;
	parameters: string[]; // Parameter names
	parameterCount: number;
	signature: string; // .methodName(!param1, !param2)
}

/**
 * Object-specific information
 */
export interface ObjectInfo extends SymbolInfo {
	kind: SymbolKind.Object;
	methods: string[]; // Method names in this object
}

/**
 * Form-specific information
 */
export interface FormInfo extends SymbolInfo {
	kind: SymbolKind.Form;
	frames: string[]; // Frame names
	callbacks: Record<string, string>; // gadget -> method
}

/**
 * File symbols - all symbols in a single file
 */
export interface FileSymbols {
	uri: string;
	version: number; // Document version for incremental updates
	methods: MethodInfo[];
	objects: ObjectInfo[];
	forms: FormInfo[];
	lastIndexed: number; // Timestamp
}

/**
 * Workspace Symbol Index
 * Fast lookup of all symbols in workspace
 */
export class SymbolIndex {
	// Map: symbol name (lowercase) -> list of locations
	private methodIndex: Map<string, MethodInfo[]> = new Map();
	private objectIndex: Map<string, ObjectInfo[]> = new Map();
	private formIndex: Map<string, FormInfo[]> = new Map();

	// Map: file URI -> file symbols
	private fileSymbols: Map<string, FileSymbols> = new Map();

	// Map: file URI -> document text (for comment extraction)
	// Limited cache to prevent memory issues on large workspaces
	private documentTexts: Map<string, string> = new Map();
	private readonly MAX_CACHED_DOCUMENTS = 100;  // Limit to 100 most recent files
	private documentAccessOrder: string[] = [];  // LRU tracking

	/**
	 * Index a file's AST
	 */
	public indexFile(uri: string, ast: Program, version: number, documentText?: string): void {
		// Remove old symbols from this file
		this.removeFile(uri);

		// Store document text for comment extraction with LRU eviction
		if (documentText) {
			this.addDocumentTextWithLRU(uri, documentText);
		}

		const fileSymbols: FileSymbols = {
			uri,
			version,
			methods: [],
			objects: [],
			forms: [],
			lastIndexed: Date.now()
		};

		// Extract symbols from AST
		for (const node of ast.body) {
			if (node.type === 'MethodDefinition') {
				const methodInfo = this.extractMethodInfo(node, uri, documentText);
				fileSymbols.methods.push(methodInfo);
				this.addToIndex(this.methodIndex, methodInfo.name.toLowerCase(), methodInfo);
			} else if (node.type === 'ObjectDefinition') {
				const objectInfo = this.extractObjectInfo(node, uri);
				fileSymbols.objects.push(objectInfo);
				this.addToIndex(this.objectIndex, objectInfo.name.toLowerCase(), objectInfo);

				// Index methods inside object
				for (const method of node.members) {
					const methodInfo = this.extractMethodInfo(method, uri, documentText, objectInfo.name);
					fileSymbols.methods.push(methodInfo);
					this.addToIndex(this.methodIndex, methodInfo.name.toLowerCase(), methodInfo);
				}
			} else if (node.type === 'FormDefinition') {
				const formInfo = this.extractFormInfo(node, uri);
				fileSymbols.forms.push(formInfo);
				this.addToIndex(this.formIndex, formInfo.name.toLowerCase(), formInfo);
			}
		}

		// Store file symbols
		this.fileSymbols.set(uri, fileSymbols);
	}

	/**
	 * Remove file from index
	 */
	public removeFile(uri: string): void {
		const fileSymbols = this.fileSymbols.get(uri);
		if (!fileSymbols) return;

		// Remove from indexes
		for (const method of fileSymbols.methods) {
			this.removeFromIndex(this.methodIndex, method.name.toLowerCase(), method);
		}
		for (const object of fileSymbols.objects) {
			this.removeFromIndex(this.objectIndex, object.name.toLowerCase(), object);
		}
		for (const form of fileSymbols.forms) {
			this.removeFromIndex(this.formIndex, form.name.toLowerCase(), form);
		}

		// Remove file entry
		this.fileSymbols.delete(uri);
		this.documentTexts.delete(uri);
	}

	/**
	 * Find method by name (case-insensitive)
	 */
	public findMethod(name: string): MethodInfo[] {
		return this.methodIndex.get(name.toLowerCase()) || [];
	}

	/**
	 * Find object by name
	 */
	public findObject(name: string): ObjectInfo[] {
		return this.objectIndex.get(name.toLowerCase()) || [];
	}

	/**
	 * Find form by name
	 */
	public findForm(name: string): FormInfo[] {
		return this.formIndex.get(name.toLowerCase()) || [];
	}

	/**
	 * Get all methods (for workspace symbols)
	 */
	public getAllMethods(): MethodInfo[] {
		const all: MethodInfo[] = [];
		for (const methods of this.methodIndex.values()) {
			all.push(...methods);
		}
		return all;
	}

	/**
	 * Get all objects
	 */
	public getAllObjects(): ObjectInfo[] {
		const all: ObjectInfo[] = [];
		for (const objects of this.objectIndex.values()) {
			all.push(...objects);
		}
		return all;
	}

	/**
	 * Get all forms
	 */
	public getAllForms(): FormInfo[] {
		const all: FormInfo[] = [];
		for (const forms of this.formIndex.values()) {
			all.push(...forms);
		}
		return all;
	}

	/**
	 * Get symbols for a file (for document symbols)
	 */
	public getFileSymbols(uri: string): FileSymbols | undefined {
		return this.fileSymbols.get(uri);
	}

	/**
	 * Get all indexed file URIs
	 */
	public getAllFileUris(): string[] {
		return Array.from(this.fileSymbols.keys());
	}

	/**
	 * Get document text for a file (if cached)
	 */
	public getDocumentText(uri: string): string | undefined {
		return this.documentTexts.get(uri);
	}

	/**
	 * Search symbols by query (fuzzy)
	 */
	public searchSymbols(query: string): SymbolInfo[] {
		const lowerQuery = query.toLowerCase();
		const results: SymbolInfo[] = [];

		// Search methods
		for (const [name, methods] of this.methodIndex.entries()) {
			if (name.includes(lowerQuery)) {
				results.push(...methods);
			}
		}

		// Search objects
		for (const [name, objects] of this.objectIndex.entries()) {
			if (name.includes(lowerQuery)) {
				results.push(...objects);
			}
		}

		// Search forms
		for (const [name, forms] of this.formIndex.entries()) {
			if (name.includes(lowerQuery)) {
				results.push(...forms);
			}
		}

		return results;
	}

	/**
	 * Get statistics
	 */
	public getStats(): IndexStats {
		return {
			files: this.fileSymbols.size,
			methods: Array.from(this.methodIndex.values()).reduce((sum, arr) => sum + arr.length, 0),
			objects: Array.from(this.objectIndex.values()).reduce((sum, arr) => sum + arr.length, 0),
			forms: Array.from(this.formIndex.values()).reduce((sum, arr) => sum + arr.length, 0)
		};
	}

	/**
	 * Clear entire index
	 */
	public clear(): void {
		this.methodIndex.clear();
		this.objectIndex.clear();
		this.formIndex.clear();
		this.fileSymbols.clear();
	}

	/**
	 * Helper: Extract method info from AST node
	 */
	private extractMethodInfo(node: MethodDefinition, uri: string, documentText?: string, containerName?: string): MethodInfo {
		const parameters = node.parameters.map(p => p.name);
		const signature = `.${node.name}(${parameters.map(p => '!' + p).join(', ')})`;

		// Extract documentation from comments if available
		let documentation: string | undefined = node.documentation?.description;
		if (!documentation && documentText) {
			// Extract comments from document text
			const lineNumber = node.range.start.line;
			const rawComments = extractPrecedingComments(documentText, lineNumber);
			if (rawComments) {
				// Format documentation with parameter info
				documentation = formatDocumentation(rawComments, node.name, parameters.map(p => '!' + p));
			}
		}

		return {
			name: node.name,
			kind: SymbolKind.Method,
			uri,
			range: node.range,
			containerName,
			deprecated: node.deprecated,
			documentation,
			parameters,
			parameterCount: parameters.length,
			signature
		};
	}

	/**
	 * Helper: Extract object info
	 */
	private extractObjectInfo(node: ObjectDefinition, uri: string): ObjectInfo {
		return {
			name: node.name,
			kind: SymbolKind.Object,
			uri,
			range: node.range,
			documentation: node.documentation?.description,
			methods: node.members.map(m => m.name)
		};
	}

	/**
	 * Helper: Extract form info
	 */
	private extractFormInfo(node: FormDefinition, uri: string): FormInfo {
		return {
			name: node.name,
			kind: SymbolKind.Form,
			uri,
			range: node.range,
			frames: node.frames.map(f => f.name),
			callbacks: node.callbacks
		};
	}

	/**
	 * Helper: Add to index
	 */
	private addToIndex<T extends SymbolInfo>(index: Map<string, T[]>, key: string, value: T): void {
		const existing = index.get(key);
		if (existing) {
			existing.push(value);
		} else {
			index.set(key, [value]);
		}
	}

	/**
	 * Helper: Remove from index
	 */
	private removeFromIndex<T extends SymbolInfo>(index: Map<string, T[]>, key: string, value: T): void {
		const existing = index.get(key);
		if (!existing) return;

		const filtered = existing.filter(s => s.uri !== value.uri);
		if (filtered.length === 0) {
			index.delete(key);
		} else {
			index.set(key, filtered);
		}
	}

	/**
	 * Add document text with LRU eviction to limit memory usage
	 */
	private addDocumentTextWithLRU(uri: string, text: string): void {
		// Remove from access order if already exists
		const existingIndex = this.documentAccessOrder.indexOf(uri);
		if (existingIndex !== -1) {
			this.documentAccessOrder.splice(existingIndex, 1);
		}

		// Add to end (most recently used)
		this.documentAccessOrder.push(uri);
		this.documentTexts.set(uri, text);

		// Evict oldest if over limit
		if (this.documentTexts.size > this.MAX_CACHED_DOCUMENTS) {
			const oldestUri = this.documentAccessOrder.shift();
			if (oldestUri) {
				this.documentTexts.delete(oldestUri);
			}
		}
	}
}

/**
 * Index statistics
 */
export interface IndexStats {
	files: number;
	methods: number;
	objects: number;
	forms: number;
}
