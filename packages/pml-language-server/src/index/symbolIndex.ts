/**
 * Symbol Index - Fast lookup of symbols across workspace
 */

import { Range } from 'vscode-languageserver/node';
import {
	Program,
	Statement,
	Expression,
	MethodDefinition,
	FunctionDefinition,
	ObjectDefinition,
	FormDefinition,
	FrameDefinition,
	GadgetDeclaration,
	Identifier,
	MemberDeclaration,
	PMLType,
	typeToString
} from '../ast/nodes';
import { extractPrecedingComments, formatDocumentation } from '../utils/commentExtractor';
import { formatCallableSignature } from '../utils/callableSignature';

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
	Function = 'function',
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
	selectionRange: Range;
	parameters: string[]; // Parameter names
	parameterTypes: Array<PMLType | undefined>;
	parameterCount: number;
	signature: string; // .methodName(!param1, !param2)
	returnType?: PMLType;
}

export interface MethodReferenceInfo {
	name: string;
	uri: string;
	range: Range;
}

export interface FunctionInfo extends SymbolInfo {
	kind: SymbolKind.Function;
	selectionRange: Range;
	parameters: string[];
	parameterTypes: Array<PMLType | undefined>;
	parameterCount: number;
	signature: string;
	returnType?: PMLType;
}

export interface FunctionReferenceInfo {
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
	callback?: string;
}

/**
 * File symbols - all symbols in a single file
 */
export interface FileSymbols {
	uri: string;
	version: number; // Document version for incremental updates
	methods: MethodInfo[];
	methodReferences: MethodReferenceInfo[];
	functions: FunctionInfo[];
	functionReferences: FunctionReferenceInfo[];
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
	private functionIndex: Map<string, FunctionInfo[]> = new Map();
	private functionReferenceIndex: Map<string, FunctionReferenceInfo[]> = new Map();
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
			functions: [],
			functionReferences: [],
			objects: [],
			forms: [],
			lastIndexed: Date.now()
		};
		const documentLines = documentText?.split(/\r?\n/);

		// Extract symbols from AST
		for (const node of ast.body) {
			if (node.type === 'MethodDefinition') {
				const methodInfo = this.extractMethodInfo(node, uri, documentText, documentLines);
				fileSymbols.methods.push(methodInfo);
				this.addToIndex(this.methodIndex, methodInfo.name.toLowerCase(), methodInfo);
				this.indexCallReferences(node.body, uri, fileSymbols.methodReferences, fileSymbols.functionReferences);
			} else if (node.type === 'FunctionDefinition') {
				const functionInfo = this.extractFunctionInfo(node, uri, documentText, documentLines);
				fileSymbols.functions.push(functionInfo);
				this.addToIndex(this.functionIndex, functionInfo.name.toLowerCase(), functionInfo);
				this.indexCallReferences(node.body, uri, fileSymbols.methodReferences, fileSymbols.functionReferences);
			} else if (node.type === 'ObjectDefinition') {
				const objectInfo = this.extractObjectInfo(node, uri);
				fileSymbols.objects.push(objectInfo);
				this.addToIndex(this.objectIndex, objectInfo.name.toLowerCase(), objectInfo);

				// Index methods inside object
				for (const method of node.members) {
					const methodInfo = this.extractMethodInfo(method, uri, documentText, documentLines, objectInfo.name);
					fileSymbols.methods.push(methodInfo);
					this.addToIndex(this.methodIndex, methodInfo.name.toLowerCase(), methodInfo);
					this.indexCallReferences(method.body, uri, fileSymbols.methodReferences, fileSymbols.functionReferences);
				}
			} else if (node.type === 'FormDefinition') {
				const formInfo = this.extractFormInfo(node, uri);
				fileSymbols.forms.push(formInfo);
				this.addToIndex(this.formIndex, formInfo.name.toLowerCase(), formInfo);
				this.indexCallReferences(node.body, uri, fileSymbols.methodReferences, fileSymbols.functionReferences);
			} else {
				this.visitStatementForCallReferences(node, uri, fileSymbols.methodReferences, fileSymbols.functionReferences);
			}
		}

		for (const reference of fileSymbols.methodReferences) {
			this.addToIndex(this.methodReferenceIndex, reference.name.toLowerCase(), reference);
		}
		for (const reference of fileSymbols.functionReferences) {
			this.addToIndex(this.functionReferenceIndex, reference.name.toLowerCase(), reference);
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
		for (const func of fileSymbols.functions) {
			this.removeFromIndex(this.functionIndex, func.name.toLowerCase(), func);
		}
		for (const reference of fileSymbols.functionReferences) {
			this.removeFromIndex(this.functionReferenceIndex, reference.name.toLowerCase(), reference);
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

	public findFunction(name: string): FunctionInfo[] {
		return this.functionIndex.get(name.toLowerCase()) || [];
	}

	public findFunctionReferences(name: string): FunctionReferenceInfo[] {
		return this.functionReferenceIndex.get(name.toLowerCase()) || [];
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

	public findFunctionsInFile(uri: string, name: string): FunctionInfo[] {
		const lowerName = name.toLowerCase();
		return (this.fileSymbols.get(uri)?.functions ?? [])
			.filter(func => func.name.toLowerCase() === lowerName);
	}

	public findFunctionReferencesInFile(uri: string, name: string): FunctionReferenceInfo[] {
		const lowerName = name.toLowerCase();
		return (this.fileSymbols.get(uri)?.functionReferences ?? [])
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
		const lowerName = name.toLowerCase();
		return this.formIndex.get(lowerName) ||
			(!lowerName.startsWith('!!') ? this.formIndex.get(`!!${lowerName}`) : undefined) ||
			(lowerName.startsWith('!!') ? this.formIndex.get(lowerName.substring(2)) : undefined) ||
			[];
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

	public getAllFunctions(): FunctionInfo[] {
		const all: FunctionInfo[] = [];
		for (const functions of this.functionIndex.values()) {
			all.push(...functions);
		}
		return all;
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

		for (const [name, functions] of this.functionIndex.entries()) {
			if (name.includes(lowerQuery)) {
				results.push(...functions);
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
			functions: Array.from(this.functionIndex.values()).reduce((sum, arr) => sum + arr.length, 0),
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
		this.functionIndex.clear();
		this.functionReferenceIndex.clear();
		this.objectIndex.clear();
		this.formIndex.clear();
		this.fileSymbols.clear();
		this.documentTexts.clear();
		this.documentAccessOrder = [];
	}

	/**
	 * Helper: Extract method info from AST node
	 */
	private extractMethodInfo(
		node: MethodDefinition,
		uri: string,
		documentText?: string,
		documentLines?: string[],
		containerName?: string
	): MethodInfo {
		const parameters = node.parameters.map(p => p.name);
		const parameterTypes = node.parameters.map(p => p.paramType);
		const signature = formatCallableSignature('.', node.name, parameters, parameterTypes, node.returnType);

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
			selectionRange: this.getCallableSelectionRange(node.range, node.name, '.', documentLines),
			containerName,
			deprecated: node.deprecated,
			documentation,
			parameters,
			parameterTypes,
			parameterCount: parameters.length,
			signature,
			returnType: node.returnType
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

	private extractFunctionInfo(
		node: FunctionDefinition,
		uri: string,
		documentText?: string,
		documentLines?: string[]
	): FunctionInfo {
		const parameters = node.parameters.map(p => p.name);
		const parameterTypes = node.parameters.map(p => p.paramType);
		const signature = formatCallableSignature('!!', node.name, parameters, parameterTypes, node.returnType);

		let documentation: string | undefined = node.documentation?.description;
		if (!documentation && documentText) {
			const lineNumber = node.range.start.line;
			const rawComments = extractPrecedingComments(documentText, lineNumber);
			if (rawComments) {
				documentation = formatDocumentation(rawComments, node.name, parameters.map(p => '!' + p));
			}
		}

		return {
			name: node.name,
			kind: SymbolKind.Function,
			uri,
			range: node.range,
			selectionRange: this.getCallableSelectionRange(node.range, node.name, '!!', documentLines),
			deprecated: node.deprecated,
			documentation,
			parameters,
			parameterTypes,
			parameterCount: parameters.length,
			signature,
			returnType: node.returnType
		};
	}

	private getCallableSelectionRange(
		range: Range,
		name: string,
		prefix: '.' | '!!',
		documentLines?: string[]
	): Range {
		const line = documentLines?.[range.start.line];
		const markerIndex = line?.toLowerCase().indexOf(`${prefix}${name}`.toLowerCase()) ?? -1;
		if (markerIndex < 0) {
			return Range.create(range.start, range.start);
		}
		const nameStart = markerIndex + prefix.length;
		return Range.create(range.start.line, nameStart, range.start.line, nameStart + name.length);
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
			range: node.range,
			callback: typeof node.properties.call === 'string' ? node.properties.call : undefined
		};
	}

	private extractFormMemberInfo(node: MemberDeclaration): FormMemberInfo {
		return {
			name: node.name,
			memberType: typeToString(node.memberType),
			range: node.range
		};
	}

	private indexCallReferences(
		statements: Statement[],
		uri: string,
		methodReferences: MethodReferenceInfo[],
		functionReferences: FunctionReferenceInfo[]
	): void {
		for (const statement of statements) {
			this.visitStatementForCallReferences(statement, uri, methodReferences, functionReferences);
		}
	}

	private visitStatementForCallReferences(
		statement: Statement,
		uri: string,
		methodReferences: MethodReferenceInfo[],
		functionReferences: FunctionReferenceInfo[]
	): void {
		switch (statement.type) {
			case 'MethodDefinition':
			case 'FunctionDefinition':
				this.indexCallReferences(statement.body, uri, methodReferences, functionReferences);
				break;
			case 'FormDefinition':
				this.indexCallReferences(statement.body, uri, methodReferences, functionReferences);
				break;
			case 'VariableDeclaration':
				if (statement.initializer) {
					this.visitExpressionForCallReferences(statement.initializer, uri, methodReferences, functionReferences);
				}
				break;
			case 'ExpressionStatement':
				this.visitExpressionForCallReferences(statement.expression, uri, methodReferences, functionReferences);
				break;
			case 'IfStatement':
				this.visitExpressionForCallReferences(statement.test, uri, methodReferences, functionReferences);
				this.indexCallReferences(statement.consequent, uri, methodReferences, functionReferences);
				if (Array.isArray(statement.alternate)) {
					this.indexCallReferences(statement.alternate, uri, methodReferences, functionReferences);
				} else if (statement.alternate) {
					this.visitStatementForCallReferences(statement.alternate, uri, methodReferences, functionReferences);
				}
				break;
			case 'DoStatement':
				if (statement.collection) {
					this.visitExpressionForCallReferences(statement.collection, uri, methodReferences, functionReferences);
				}
				if (statement.from) {
					this.visitExpressionForCallReferences(statement.from, uri, methodReferences, functionReferences);
				}
				if (statement.to) {
					this.visitExpressionForCallReferences(statement.to, uri, methodReferences, functionReferences);
				}
				if (statement.by) {
					this.visitExpressionForCallReferences(statement.by, uri, methodReferences, functionReferences);
				}
				if (statement.condition) {
					this.visitExpressionForCallReferences(statement.condition, uri, methodReferences, functionReferences);
				}
				this.indexCallReferences(statement.body, uri, methodReferences, functionReferences);
				break;
			case 'HandleStatement':
				this.indexCallReferences(statement.body, uri, methodReferences, functionReferences);
				if (statement.alternate) {
					this.indexCallReferences(statement.alternate, uri, methodReferences, functionReferences);
				}
				break;
			case 'ReturnStatement':
				if (statement.argument) {
					this.visitExpressionForCallReferences(statement.argument, uri, methodReferences, functionReferences);
				}
				break;
			case 'BreakStatement':
			case 'ContinueStatement':
				if (statement.condition) {
					this.visitExpressionForCallReferences(statement.condition, uri, methodReferences, functionReferences);
				}
				break;
		}
	}

	private visitExpressionForCallReferences(
		expression: Expression,
		uri: string,
		methodReferences: MethodReferenceInfo[],
		functionReferences: FunctionReferenceInfo[]
	): void {
		switch (expression.type) {
			case 'CallExpression':
				this.addCallReferences(expression.callee, uri, methodReferences, functionReferences);
				this.visitExpressionForCallReferences(expression.callee, uri, methodReferences, functionReferences);
				for (const argument of expression.arguments) {
					this.visitExpressionForCallReferences(argument, uri, methodReferences, functionReferences);
				}
				break;
			case 'MemberExpression':
				this.visitExpressionForCallReferences(expression.object, uri, methodReferences, functionReferences);
				this.visitExpressionForCallReferences(expression.property, uri, methodReferences, functionReferences);
				break;
			case 'BinaryExpression':
				this.visitExpressionForCallReferences(expression.left, uri, methodReferences, functionReferences);
				this.visitExpressionForCallReferences(expression.right, uri, methodReferences, functionReferences);
				break;
			case 'UnaryExpression':
				this.visitExpressionForCallReferences(expression.argument, uri, methodReferences, functionReferences);
				break;
			case 'ArrayExpression':
				for (const element of expression.elements) {
					this.visitExpressionForCallReferences(element, uri, methodReferences, functionReferences);
				}
				break;
			case 'AssignmentExpression':
				this.visitExpressionForCallReferences(expression.left, uri, methodReferences, functionReferences);
				this.visitExpressionForCallReferences(expression.right, uri, methodReferences, functionReferences);
				break;
		}
	}

	private addCallReferences(
		callee: Expression,
		uri: string,
		methodReferences: MethodReferenceInfo[],
		functionReferences: FunctionReferenceInfo[]
	): void {
		const identifier = this.methodIdentifierFromCallee(callee);
		if (identifier) {
			methodReferences.push({
				name: identifier.name,
				uri,
				range: this.methodNameRange(identifier)
			});
		}

		if (callee.type === 'Identifier' && callee.scope === 'global') {
			functionReferences.push({
				name: callee.name,
				uri,
				range: callee.range
			});
		}
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
	functions: number;
	objects: number;
	forms: number;
}
