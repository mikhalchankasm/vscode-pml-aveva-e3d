/**
 * Symbol Index - Fast lookup of symbols across workspace
 */

import { Range } from 'vscode-languageserver/node';
import {
	Program,
	Statement,
	Expression,
	MethodDefinition,
	ObjectDefinition,
	FormDefinition,
	FrameDefinition,
	GadgetDeclaration,
	Identifier,
	MemberDeclaration,
	typeToString
} from '../ast/nodes';
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

export interface MethodReferenceInfo {
	name: string;
	uri: string;
	range: Range;
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
	frames: FrameInfo[]; // Frame hierarchy
	members: FormMemberInfo[];
	gadgets: GadgetInfo[]; // Top-level form gadgets
	callbacks: Record<string, string>; // gadget -> method
}

export interface FormMemberInfo {
	name: string;
	memberType: string;
	range: Range;
}

export interface FrameInfo {
	name: string;
	range: Range;
	frames: FrameInfo[];
	gadgets: GadgetInfo[];
}

export interface GadgetInfo {
	name: string;
	gadgetType: string;
	range: Range;
}

/**
 * File symbols - all symbols in a single file
 */
export interface FileSymbols {
	uri: string;
	version: number; // Document version for incremental updates
	methods: MethodInfo[];
	methodReferences: MethodReferenceInfo[];
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
	private methodReferenceIndex: Map<string, MethodReferenceInfo[]> = new Map();
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
			methodReferences: [],
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
				this.indexMethodReferences(node.body, uri, fileSymbols.methodReferences);
			} else if (node.type === 'FunctionDefinition') {
				this.indexMethodReferences(node.body, uri, fileSymbols.methodReferences);
			} else if (node.type === 'ObjectDefinition') {
				const objectInfo = this.extractObjectInfo(node, uri);
				fileSymbols.objects.push(objectInfo);
				this.addToIndex(this.objectIndex, objectInfo.name.toLowerCase(), objectInfo);

				// Index methods inside object
				for (const method of node.members) {
					const methodInfo = this.extractMethodInfo(method, uri, documentText, objectInfo.name);
					fileSymbols.methods.push(methodInfo);
					this.addToIndex(this.methodIndex, methodInfo.name.toLowerCase(), methodInfo);
					this.indexMethodReferences(method.body, uri, fileSymbols.methodReferences);
				}
			} else if (node.type === 'FormDefinition') {
				const formInfo = this.extractFormInfo(node, uri);
				fileSymbols.forms.push(formInfo);
				this.addToIndex(this.formIndex, formInfo.name.toLowerCase(), formInfo);
				this.indexMethodReferences(node.body, uri, fileSymbols.methodReferences);
			}
		}

		for (const reference of fileSymbols.methodReferences) {
			this.addToIndex(this.methodReferenceIndex, reference.name.toLowerCase(), reference);
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
		for (const reference of fileSymbols.methodReferences) {
			this.removeFromIndex(this.methodReferenceIndex, reference.name.toLowerCase(), reference);
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

		// Clean up LRU tracking
		const lruIndex = this.documentAccessOrder.indexOf(uri);
		if (lruIndex !== -1) {
			this.documentAccessOrder.splice(lruIndex, 1);
		}
	}

	/**
	 * Find method by name (case-insensitive)
	 */
	public findMethod(name: string): MethodInfo[] {
		return this.methodIndex.get(name.toLowerCase()) || [];
	}

	public findMethodReferences(name: string): MethodReferenceInfo[] {
		return this.methodReferenceIndex.get(name.toLowerCase()) || [];
	}

	public findMethodsInFile(uri: string, name: string): MethodInfo[] {
		const lowerName = name.toLowerCase();
		return (this.fileSymbols.get(uri)?.methods ?? [])
			.filter(method => method.name.toLowerCase() === lowerName);
	}

	public findMethodReferencesInFile(uri: string, name: string): MethodReferenceInfo[] {
		const lowerName = name.toLowerCase();
		return (this.fileSymbols.get(uri)?.methodReferences ?? [])
			.filter(reference => reference.name.toLowerCase() === lowerName);
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

	public isFileVersionIndexed(uri: string, version: number): boolean {
		return this.fileSymbols.get(uri)?.version === version;
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
		this.methodReferenceIndex.clear();
		this.objectIndex.clear();
		this.formIndex.clear();
		this.fileSymbols.clear();
		this.documentTexts.clear();
		this.documentAccessOrder = [];
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
			frames: node.frames.map(frame => this.extractFrameInfo(frame)),
			members: node.members.map(member => this.extractFormMemberInfo(member)),
			gadgets: node.body
				.filter((statement): statement is GadgetDeclaration => statement.type === 'GadgetDeclaration')
				.map(gadget => this.extractGadgetInfo(gadget)),
			callbacks: node.callbacks
		};
	}

	private extractFrameInfo(node: FrameDefinition): FrameInfo {
		return {
			name: node.name,
			range: node.range,
			frames: node.frames.map(frame => this.extractFrameInfo(frame)),
			gadgets: node.gadgets.map(gadget => this.extractGadgetInfo(gadget))
		};
	}

	private extractGadgetInfo(node: GadgetDeclaration): GadgetInfo {
		return {
			name: node.name,
			gadgetType: node.gadgetType,
			range: node.range
		};
	}

	private extractFormMemberInfo(node: MemberDeclaration): FormMemberInfo {
		return {
			name: node.name,
			memberType: typeToString(node.memberType),
			range: node.range
		};
	}

	private indexMethodReferences(statements: Statement[], uri: string, references: MethodReferenceInfo[]): void {
		for (const statement of statements) {
			this.visitStatementForMethodReferences(statement, uri, references);
		}
	}

	private visitStatementForMethodReferences(statement: Statement, uri: string, references: MethodReferenceInfo[]): void {
		switch (statement.type) {
			case 'MethodDefinition':
			case 'FunctionDefinition':
				this.indexMethodReferences(statement.body, uri, references);
				break;
			case 'FormDefinition':
				this.indexMethodReferences(statement.body, uri, references);
				break;
			case 'VariableDeclaration':
				if (statement.initializer) {
					this.visitExpressionForMethodReferences(statement.initializer, uri, references);
				}
				break;
			case 'ExpressionStatement':
				this.visitExpressionForMethodReferences(statement.expression, uri, references);
				break;
			case 'IfStatement':
				this.visitExpressionForMethodReferences(statement.test, uri, references);
				this.indexMethodReferences(statement.consequent, uri, references);
				if (Array.isArray(statement.alternate)) {
					this.indexMethodReferences(statement.alternate, uri, references);
				} else if (statement.alternate) {
					this.visitStatementForMethodReferences(statement.alternate, uri, references);
				}
				break;
			case 'DoStatement':
				if (statement.collection) {
					this.visitExpressionForMethodReferences(statement.collection, uri, references);
				}
				if (statement.from) {
					this.visitExpressionForMethodReferences(statement.from, uri, references);
				}
				if (statement.to) {
					this.visitExpressionForMethodReferences(statement.to, uri, references);
				}
				if (statement.by) {
					this.visitExpressionForMethodReferences(statement.by, uri, references);
				}
				if (statement.condition) {
					this.visitExpressionForMethodReferences(statement.condition, uri, references);
				}
				this.indexMethodReferences(statement.body, uri, references);
				break;
			case 'HandleStatement':
				this.indexMethodReferences(statement.body, uri, references);
				if (statement.alternate) {
					this.indexMethodReferences(statement.alternate, uri, references);
				}
				break;
			case 'ReturnStatement':
				if (statement.argument) {
					this.visitExpressionForMethodReferences(statement.argument, uri, references);
				}
				break;
			case 'BreakStatement':
			case 'ContinueStatement':
				if (statement.condition) {
					this.visitExpressionForMethodReferences(statement.condition, uri, references);
				}
				break;
		}
	}

	private visitExpressionForMethodReferences(expression: Expression, uri: string, references: MethodReferenceInfo[]): void {
		switch (expression.type) {
			case 'CallExpression':
				this.addCallReference(expression.callee, uri, references);
				this.visitExpressionForMethodReferences(expression.callee, uri, references);
				for (const argument of expression.arguments) {
					this.visitExpressionForMethodReferences(argument, uri, references);
				}
				break;
			case 'MemberExpression':
				this.visitExpressionForMethodReferences(expression.object, uri, references);
				this.visitExpressionForMethodReferences(expression.property, uri, references);
				break;
			case 'BinaryExpression':
				this.visitExpressionForMethodReferences(expression.left, uri, references);
				this.visitExpressionForMethodReferences(expression.right, uri, references);
				break;
			case 'UnaryExpression':
				this.visitExpressionForMethodReferences(expression.argument, uri, references);
				break;
			case 'ArrayExpression':
				for (const element of expression.elements) {
					this.visitExpressionForMethodReferences(element, uri, references);
				}
				break;
			case 'AssignmentExpression':
				this.visitExpressionForMethodReferences(expression.left, uri, references);
				this.visitExpressionForMethodReferences(expression.right, uri, references);
				break;
		}
	}

	private addCallReference(callee: Expression, uri: string, references: MethodReferenceInfo[]): void {
		const identifier = this.methodIdentifierFromCallee(callee);
		if (!identifier) {
			return;
		}

		references.push({
			name: identifier.name,
			uri,
			range: this.methodNameRange(identifier)
		});
	}

	private methodNameRange(identifier: Identifier): Range {
		if (identifier.range.start.line !== identifier.range.end.line) {
			return identifier.range;
		}

		const tokenLength = identifier.range.end.character - identifier.range.start.character;
		if (tokenLength <= identifier.name.length) {
			return identifier.range;
		}

		return {
			start: {
				line: identifier.range.end.line,
				character: identifier.range.end.character - identifier.name.length
			},
			end: identifier.range.end
		};
	}

	private methodIdentifierFromCallee(callee: Expression): Identifier | undefined {
		if (callee.type === 'Identifier' && callee.scope === 'method') {
			return callee;
		}

		if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
			return callee.property;
		}

		return undefined;
	}

	/**
	 * Helper: Add to index
	 */
	private addToIndex<T extends { uri: string }>(index: Map<string, T[]>, key: string, value: T): void {
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
	private removeFromIndex<T extends { uri: string }>(index: Map<string, T[]>, key: string, value: T): void {
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
