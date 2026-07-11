import {
	CodeAction,
	CodeActionKind,
	CreateFile,
	Diagnostic,
	OptionalVersionedTextDocumentIdentifier,
	Position,
	Range,
	TextDocumentEdit,
	TextEdit
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI, Utils } from 'vscode-uri';
import {
	CallExpression,
	Expression,
	PMLType,
	Program,
	Statement
} from '../ast/nodes';
import { FunctionInfo, MethodInfo, SymbolIndex } from '../index/symbolIndex';
import { formatCallableParameter } from '../utils/callableSignature';

type StubKind = 'method' | 'function';

type StubTarget = {
	kind: StubKind;
	name: string;
};

type StubParameter = {
	name: string;
	type?: PMLType;
};

type IndexedCallable = MethodInfo | FunctionInfo;

const GO_TO_CALLABLE_COMMAND = 'pml.goToCallableDefinition';

const BUILT_IN_GLOBAL_FUNCTIONS = new Set([
	'alert',
	'collectallfor',
	'confirm',
	'error',
	'evaluate',
	'fmsys',
	'getobject',
	'message',
	'prompt',
	'system'
]);

export class CallStubCodeActionProvider {
	constructor(private readonly symbolIndex: SymbolIndex) {}

	public provide(
		document: TextDocument,
		requestedRange: Range,
		program: Program,
		diagnostics: Diagnostic[] = [],
		onlyKinds?: string[]
	): CodeAction[] {
		const callbackActions = this.missingCallbackActions(document, requestedRange, diagnostics);
		if (callbackActions.length > 0) return this.filterRequestedKinds(callbackActions, onlyKinds);

		const calls = this.collectCalls(program.body)
			.filter(call => this.rangesIntersect(call.callee.range, requestedRange))
			.sort((left, right) => this.rangeSize(left.range) - this.rangeSize(right.range));
		const call = calls[0];
		if (!call) return [];

		const target = this.resolveTarget(call.callee);
		if (!target) return [];

		const indexed = this.resolveIndexedCallable(target, document.uri);
		if (indexed) {
			return this.filterRequestedKinds(
				this.existingCallableActions(document, call, target, indexed, program),
				onlyKinds
			);
		}
		if (!this.isMissingTarget(target, document.uri)) return [];

		const knownTypes = new Map<string, PMLType>();
		this.collectTypesUntil(program.body, call.range.start, knownTypes);
		const parameters = this.buildParameters(call.arguments, knownTypes, document.uri);
		const signature = this.formatStubSignature(target, parameters);
		const edit = target.kind === 'method'
			? {
				changes: {
					[document.uri]: [TextEdit.insert(
						document.positionAt(document.getText().length),
						this.createStubText(document, target, parameters, true)
					)]
				}
			}
			: this.createFunctionFileEdit(document, target, parameters);
		const titleSuffix = target.kind === 'function' ? ` in ${target.name}.pmlfnc` : '';

		return this.filterRequestedKinds([{
			title: `Generate ${target.kind} ${signature}${titleSuffix}`,
			kind: CodeActionKind.QuickFix,
			isPreferred: true,
			edit,
			command: {
				title: `Open generated ${target.kind}`,
				command: GO_TO_CALLABLE_COMMAND,
				arguments: [
					target.kind === 'method' ? document.uri : this.functionTargetUri(document, target.name),
					target.kind === 'method' ? this.appendedMethodPosition(document) : Position.create(0, 0)
				]
			}
		}], onlyKinds);
	}

	private filterRequestedKinds(actions: CodeAction[], onlyKinds?: string[]): CodeAction[] {
		if (!onlyKinds || onlyKinds.length === 0) return actions;
		return actions.filter(action => {
			const kind = action.kind ?? '';
			return onlyKinds.some(requested => kind === requested || kind.startsWith(`${requested}.`));
		});
	}

	private resolveIndexedCallable(target: StubTarget, uri: string): IndexedCallable | undefined {
		const matches = target.kind === 'method'
			? this.symbolIndex.findMethodsInFile(uri, target.name)
			: this.symbolIndex.findFunction(target.name);
		return matches.length === 1 ? matches[0] : undefined;
	}

	private existingCallableActions(
		document: TextDocument,
		call: CallExpression,
		target: StubTarget,
		indexed: IndexedCallable,
		program: Program
	): CodeAction[] {
		const actions: CodeAction[] = [];
		actions.push({
			title: `Go to definition of ${this.targetLabel(target)}`,
			kind: CodeActionKind.Refactor,
			command: {
				title: `Go to definition of ${this.targetLabel(target)}`,
				command: GO_TO_CALLABLE_COMMAND,
				arguments: [indexed.uri, indexed.selectionRange.start]
			}
		});
		if (call.arguments.length < indexed.parameterCount) {
			const missingNames = indexed.parameters.slice(call.arguments.length)
				.map((name, index) => this.safeArgumentName(name, call.arguments.length + index));
			const insertion = this.callArgumentInsertion(document, call, missingNames);
			if (insertion) {
				actions.push({
					title: `Add missing arguments to ${this.targetLabel(target)}`,
					kind: CodeActionKind.QuickFix,
					isPreferred: true,
					edit: { changes: { [document.uri]: [insertion] } }
				});
			}
		}

		if (call.arguments.length > 0 && indexed.parameterCount === 0) {
			const knownTypes = new Map<string, PMLType>();
			this.collectTypesUntil(program.body, call.range.start, knownTypes);
			const parameters = this.buildParameters(call.arguments, knownTypes, document.uri);
			const signatureEdit = this.emptyStubSignatureEdit(indexed, parameters);
			if (signatureEdit) {
				actions.push({
					title: `Update empty ${target.kind} ${this.targetLabel(target)} signature from call`,
					kind: CodeActionKind.RefactorRewrite,
					edit: { changes: { [indexed.uri]: [signatureEdit] } }
				});
			}
		}
		return actions;
	}

	private callArgumentInsertion(document: TextDocument, call: CallExpression, missingNames: string[]): TextEdit | undefined {
		const callText = document.getText(call.range);
		const closingIndex = callText.lastIndexOf(')');
		if (closingIndex < 0) return undefined;
		const insertionOffset = document.offsetAt(call.range.start) + closingIndex;
		const prefix = call.arguments.length > 0 ? ', ' : '';
		return TextEdit.insert(document.positionAt(insertionOffset), prefix + missingNames.join(', '));
	}

	private emptyStubSignatureEdit(indexed: IndexedCallable, parameters: StubParameter[]): TextEdit | undefined {
		const source = this.symbolIndex.getDocumentText(indexed.uri);
		if (!source) return undefined;
		const document = TextDocument.create(indexed.uri, 'pml', 0, source);
		const definitionText = document.getText(indexed.range);
		const kind = indexed.kind === 'method' ? 'method' : 'function';
		const endKind = indexed.kind === 'method' ? 'endmethod' : 'endfunction';
		const emptyPattern = new RegExp(
			`^\\s*define\\s+${kind}\\b[^\\r\\n]*\\(\\s*\\)\\s*(?:is\\s+[A-Za-z_][A-Za-z0-9_]*\\s*)?(?:\\r?\\n)\\s*-- TODO: Implement\\.\\s*(?:\\r?\\n)\\s*${endKind}\\s*$`,
			'i'
		);
		if (!emptyPattern.test(definitionText)) return undefined;
		const declarationEnd = definitionText.search(/\r?\n/);
		const declaration = declarationEnd >= 0 ? definitionText.slice(0, declarationEnd) : definitionText;
		const openParen = declaration.indexOf('(');
		const closeParen = declaration.indexOf(')', openParen + 1);
		if (openParen < 0 || closeParen < 0) return undefined;
		const definitionOffset = document.offsetAt(indexed.range.start);
		return TextEdit.replace(
			Range.create(
				document.positionAt(definitionOffset + openParen + 1),
				document.positionAt(definitionOffset + closeParen)
			),
			parameters.map(parameter => formatCallableParameter(parameter.name, parameter.type)).join(', ')
		);
	}

	private safeArgumentName(name: string, index: number): string {
		const sanitized = this.sanitizeParameterName(name, index);
		return `!${sanitized}`;
	}

	private targetLabel(target: StubTarget): string {
		return `${target.kind === 'method' ? '.' : '!!'}${target.name}`;
	}

	private missingCallbackActions(document: TextDocument, requestedRange: Range, diagnostics: Diagnostic[]): CodeAction[] {
		if (!document.uri.toLowerCase().endsWith('.pmlfrm')) return [];
		const actions: CodeAction[] = [];
		const relevantDiagnostics = diagnostics.filter(diagnostic => String(diagnostic.code) === 'missing-form-callback');
		const line = document.getText(Range.create(requestedRange.start.line, 0, requestedRange.start.line + 1, 0));
		const lineCallback = line.match(/\b(?:callback|call)\s+\|\s*(?:!this\.|\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*\)\s*\|/i)?.[1];
		const candidates: Array<{ name?: string; diagnostic?: Diagnostic }> = relevantDiagnostics.length > 0
			? relevantDiagnostics.map(diagnostic => ({
				name: diagnostic.message.match(/missing method '\.([A-Za-z_][A-Za-z0-9_]*)\(\)'/i)?.[1],
				diagnostic
			}))
			: lineCallback ? [{ name: lineCallback }] : [];
		for (const candidate of candidates) {
			const diagnostic = candidate.diagnostic;
			const name = candidate.name;
			if (!name || this.symbolIndex.findMethodsInFile(document.uri, name).length > 0) continue;
			const target: StubTarget = { kind: 'method', name };
			actions.push({
				title: `Generate callback method .${name}()`,
				kind: CodeActionKind.QuickFix,
				diagnostics: diagnostic ? [diagnostic] : undefined,
				isPreferred: true,
				edit: {
					changes: {
						[document.uri]: [TextEdit.insert(
							document.positionAt(document.getText().length),
							this.createStubText(document, target, [], true)
						)]
					}
				}
			});
		}
		return actions;
	}

	private resolveTarget(callee: Expression): StubTarget | undefined {
		if (callee.type === 'Identifier') {
			if (callee.objectConstructor) return undefined;
			if (callee.scope === 'method') return { kind: 'method', name: callee.name };
			if (callee.scope === 'global' && !BUILT_IN_GLOBAL_FUNCTIONS.has(callee.name.toLowerCase())) {
				return { kind: 'function', name: callee.name };
			}
			return undefined;
		}
		if (
			callee.type === 'MemberExpression' &&
			!callee.computed &&
			callee.object.type === 'Identifier' &&
			callee.object.name.toLowerCase() === 'this' &&
			callee.property.type === 'Identifier'
		) {
			return { kind: 'method', name: callee.property.name };
		}
		return undefined;
	}

	private isMissingTarget(target: StubTarget, uri: string): boolean {
		if (target.kind === 'method') {
			const lowerUri = uri.toLowerCase();
			return !lowerUri.endsWith('.pmlmac') && !lowerUri.endsWith('.mac') &&
				this.symbolIndex.findMethodsInFile(uri, target.name).length === 0;
		}
		return this.symbolIndex.findFunction(target.name).length === 0 &&
			this.symbolIndex.findForm(target.name).length === 0;
	}

	private buildParameters(argumentsList: Expression[], knownTypes: Map<string, PMLType>, uri: string): StubParameter[] {
		const usedNames = new Set<string>();
		return argumentsList.map((argument, index) => {
			const type = argument.type === 'MemberExpression' &&
				argument.object.type === 'Identifier' &&
				argument.object.name.toLowerCase() === 'this' &&
				argument.property.type === 'Identifier'
				? this.formMemberType(uri, argument.property.name)
				: this.inferExpressionType(argument, knownTypes);
			const baseName = this.parameterBaseName(argument, type, index, uri);
			const name = this.uniqueParameterName(baseName, usedNames);
			return { name, type: this.reliableType(type) };
		});
	}

	private parameterBaseName(argument: Expression, type: PMLType | undefined, index: number, uri: string): string {
		if (argument.type === 'Identifier' && argument.name.toLowerCase() !== 'this') {
			return this.sanitizeParameterName(argument.name, index);
		}
		if (argument.type === 'MemberExpression' && argument.property.type === 'Identifier') {
			const memberName = this.sanitizeParameterName(argument.property.name, index);
			if (
				argument.object.type === 'Identifier' &&
				argument.object.name.toLowerCase() === 'this' &&
				this.formMemberType(uri, argument.property.name)
			) {
				return memberName;
			}
		}
		switch (type?.kind) {
			case 'STRING': return 'text';
			case 'REAL':
			case 'INTEGER': return 'value';
			case 'BOOLEAN': return 'flag';
			case 'ARRAY': return 'items';
			case 'DBREF': return 'element';
			default: return `arg${index + 1}`;
		}
	}

	private uniqueParameterName(baseName: string, usedNames: Set<string>): string {
		let candidate = baseName;
		let suffix = 2;
		while (usedNames.has(candidate.toLowerCase())) {
			candidate = `${baseName}${suffix++}`;
		}
		usedNames.add(candidate.toLowerCase());
		return candidate;
	}

	private sanitizeParameterName(name: string, index: number): string {
		const cleaned = name.replace(/^[!.]+/, '').replace(/[^A-Za-z0-9_]/g, '');
		return /^[A-Za-z_][A-Za-z0-9_]*$/.test(cleaned) ? cleaned : `arg${index + 1}`;
	}

	private inferExpressionType(expression: Expression, knownTypes: Map<string, PMLType>): PMLType | undefined {
		switch (expression.type) {
			case 'Literal': return expression.pmlType;
			case 'Identifier': return knownTypes.get(this.typeKey(expression.scope, expression.name));
			case 'ArrayExpression': return { kind: 'ARRAY', elementType: { kind: 'ANY' } };
			case 'UnaryExpression':
				return expression.operator.toLowerCase() === 'not'
					? { kind: 'BOOLEAN' }
					: this.inferExpressionType(expression.argument, knownTypes);
			case 'CallExpression': return this.constructorType(expression.callee);
			case 'MemberExpression': return undefined;
			default: return undefined;
		}
	}

	private constructorType(callee: Expression): PMLType | undefined {
		if (callee.type !== 'Identifier' || (!callee.objectConstructor && callee.scope)) return undefined;
		switch (callee.name.toUpperCase()) {
			case 'STRING': return { kind: 'STRING' };
			case 'REAL': return { kind: 'REAL' };
			case 'INTEGER': return { kind: 'INTEGER' };
			case 'BOOLEAN': return { kind: 'BOOLEAN' };
			case 'ARRAY': return { kind: 'ARRAY', elementType: { kind: 'ANY' } };
			case 'DBREF': return { kind: 'DBREF' };
			default: return undefined;
		}
	}

	private collectTypesUntil(statements: Statement[], target: Position, knownTypes: Map<string, PMLType>): boolean {
		for (const statement of statements) {
			if (this.comparePositions(statement.range.start, target) > 0) return false;
			if (statement.type === 'VariableDeclaration' && statement.initializer) {
				const type = this.reliableType(this.inferExpressionType(statement.initializer, knownTypes));
				const key = this.typeKey(statement.scope, statement.name);
				if (type) knownTypes.set(key, type); else knownTypes.delete(key);
			}
			if (!this.rangeContainsPosition(statement.range, target)) {
				if (['IfStatement', 'DoStatement', 'HandleStatement'].includes(statement.type)) {
					this.invalidateAssignedTypes(statement, knownTypes);
				}
				continue;
			}
			switch (statement.type) {
				case 'MethodDefinition':
				case 'FunctionDefinition':
					for (const parameter of statement.parameters) {
						const type = this.reliableType(parameter.paramType);
						if (type) knownTypes.set(this.typeKey('local', parameter.name), type);
					}
					return this.collectTypesUntil(statement.body, target, knownTypes);
				case 'ObjectDefinition':
					for (const method of statement.members) {
						if (this.rangeContainsPosition(method.range, target)) {
							for (const parameter of method.parameters) {
								const type = this.reliableType(parameter.paramType);
								if (type) knownTypes.set(this.typeKey('local', parameter.name), type);
							}
							return this.collectTypesUntil(method.body, target, knownTypes);
						}
					}
					return true;
				case 'FormDefinition': return this.collectTypesUntil(statement.body, target, knownTypes);
				case 'IfStatement':
					if (this.statementsContainPosition(statement.consequent, target)) {
						return this.collectTypesUntil(statement.consequent, target, knownTypes);
					}
					if (Array.isArray(statement.alternate)) return this.collectTypesUntil(statement.alternate, target, knownTypes);
					if (statement.alternate) return this.collectTypesUntil([statement.alternate], target, knownTypes);
					return true;
				case 'DoStatement': return this.collectTypesUntil(statement.body, target, knownTypes);
				case 'HandleStatement':
					if (this.statementsContainPosition(statement.body, target)) return this.collectTypesUntil(statement.body, target, knownTypes);
					return statement.alternate ? this.collectTypesUntil(statement.alternate, target, knownTypes) : true;
				default: return true;
			}
		}
		return false;
	}

	private invalidateAssignedTypes(statement: Statement, knownTypes: Map<string, PMLType>): void {
		const invalidate = (statements: Statement[]): void => {
			for (const nested of statements) {
				if (nested.type === 'VariableDeclaration') {
					knownTypes.delete(this.typeKey(nested.scope, nested.name));
				} else if (nested.type === 'IfStatement') {
					invalidate(nested.consequent);
					if (Array.isArray(nested.alternate)) invalidate(nested.alternate);
					else if (nested.alternate) invalidate([nested.alternate]);
				} else if (nested.type === 'DoStatement') {
					invalidate(nested.body);
				} else if (nested.type === 'HandleStatement') {
					invalidate(nested.body);
					if (nested.alternate) invalidate(nested.alternate);
				}
			}
		};
		if (statement.type === 'IfStatement') {
			invalidate(statement.consequent);
			if (Array.isArray(statement.alternate)) invalidate(statement.alternate);
			else if (statement.alternate) invalidate([statement.alternate]);
		} else if (statement.type === 'DoStatement') {
			invalidate(statement.body);
		} else if (statement.type === 'HandleStatement') {
			invalidate(statement.body);
			if (statement.alternate) invalidate(statement.alternate);
		}
	}

	private formMemberType(uri: string, name: string): PMLType | undefined {
		const lowerName = name.toLowerCase();
		for (const form of this.symbolIndex.getFileSymbols(uri)?.forms ?? []) {
			const member = form.members.find(candidate => candidate.name.toLowerCase() === lowerName);
			if (member) return this.pmlTypeFromName(member.memberType);
		}
		return undefined;
	}

	private pmlTypeFromName(typeName?: string): PMLType | undefined {
		switch (typeName?.toUpperCase()) {
			case 'STRING': return { kind: 'STRING' };
			case 'REAL': return { kind: 'REAL' };
			case 'INTEGER': return { kind: 'INTEGER' };
			case 'BOOLEAN': return { kind: 'BOOLEAN' };
			case 'ARRAY': return { kind: 'ARRAY', elementType: { kind: 'ANY' } };
			case 'DBREF': return { kind: 'DBREF' };
			default: return undefined;
		}
	}

	private reliableType(type?: PMLType): PMLType | undefined {
		return type && !['ANY', 'UNDEFINED', 'UNION'].includes(type.kind) ? type : undefined;
	}

	private typeKey(scope: 'local' | 'global' | 'method' | undefined, name: string): string {
		return `${scope === 'global' ? 'global' : 'local'}:${name.toLowerCase()}`;
	}

	private formatStubSignature(target: StubTarget, parameters: StubParameter[]): string {
		const prefix = target.kind === 'method' ? '.' : '!!';
		return `${prefix}${target.name}(${parameters.map(parameter => formatCallableParameter(parameter.name, parameter.type)).join(', ')})`;
	}

	private createStubText(document: TextDocument, target: StubTarget, parameters: StubParameter[], includePrefix: boolean): string {
		const newline = document.getText().includes('\r\n') ? '\r\n' : '\n';
		const source = document.getText();
		const prefix = !includePrefix || source.length === 0 ? '' : source.endsWith(newline) ? newline : newline + newline;
		const keyword = target.kind === 'method' ? 'method' : 'function';
		const endKeyword = target.kind === 'method' ? 'endmethod' : 'endfunction';
		return [
			`${prefix}define ${keyword} ${this.formatStubSignature(target, parameters)}`,
			'\t-- TODO: Implement.',
			endKeyword,
			''
		].join(newline);
	}

	private createFunctionFileEdit(document: TextDocument, target: StubTarget, parameters: StubParameter[]) {
		const targetUri = this.functionTargetUri(document, target.name);
		return {
			documentChanges: [
				CreateFile.create(targetUri, { overwrite: false, ignoreIfExists: false }),
				TextDocumentEdit.create(
					OptionalVersionedTextDocumentIdentifier.create(targetUri, null),
					[TextEdit.insert(Position.create(0, 0), this.createStubText(document, target, parameters, false))]
				)
			]
		};
	}

	private functionTargetUri(document: TextDocument, name: string): string {
		return Utils.joinPath(Utils.dirname(URI.parse(document.uri)), `${name}.pmlfnc`).toString();
	}

	private appendedMethodPosition(document: TextDocument): Position {
		const end = document.positionAt(document.getText().length);
		const source = document.getText();
		if (source.length === 0) return end;
		const trailingNewline = source.endsWith('\n');
		return Position.create(end.line + (trailingNewline ? 1 : 2), 0);
	}

	private collectCalls(statements: Statement[]): CallExpression[] {
		const calls: CallExpression[] = [];
		for (const statement of statements) this.collectCallsFromStatement(statement, calls);
		return calls;
	}

	private collectCallsFromStatement(statement: Statement, calls: CallExpression[]): void {
		switch (statement.type) {
			case 'MethodDefinition':
			case 'FunctionDefinition': this.collectCalls(statement.body).forEach(call => calls.push(call)); break;
			case 'ObjectDefinition': statement.members.forEach(method => this.collectCalls(method.body).forEach(call => calls.push(call))); break;
			case 'FormDefinition': this.collectCalls(statement.body).forEach(call => calls.push(call)); break;
			case 'VariableDeclaration': if (statement.initializer) this.collectCallsFromExpression(statement.initializer, calls); break;
			case 'ExpressionStatement': this.collectCallsFromExpression(statement.expression, calls); break;
			case 'IfStatement':
				this.collectCallsFromExpression(statement.test, calls);
				this.collectCalls(statement.consequent).forEach(call => calls.push(call));
				if (Array.isArray(statement.alternate)) this.collectCalls(statement.alternate).forEach(call => calls.push(call));
				else if (statement.alternate) this.collectCallsFromStatement(statement.alternate, calls);
				break;
			case 'DoStatement':
				for (const expression of [statement.collection, statement.from, statement.to, statement.by, statement.condition]) {
					if (expression) this.collectCallsFromExpression(expression, calls);
				}
				this.collectCalls(statement.body).forEach(call => calls.push(call));
				break;
			case 'HandleStatement':
				this.collectCalls(statement.body).forEach(call => calls.push(call));
				if (statement.alternate) this.collectCalls(statement.alternate).forEach(call => calls.push(call));
				break;
			case 'ReturnStatement': if (statement.argument) this.collectCallsFromExpression(statement.argument, calls); break;
			case 'BreakStatement':
			case 'ContinueStatement': if (statement.condition) this.collectCallsFromExpression(statement.condition, calls); break;
		}
	}

	private collectCallsFromExpression(expression: Expression, calls: CallExpression[]): void {
		switch (expression.type) {
			case 'CallExpression':
				calls.push(expression);
				this.collectCallsFromExpression(expression.callee, calls);
				expression.arguments.forEach(argument => this.collectCallsFromExpression(argument, calls));
				break;
			case 'MemberExpression':
				this.collectCallsFromExpression(expression.object, calls);
				this.collectCallsFromExpression(expression.property, calls);
				break;
			case 'BinaryExpression':
				this.collectCallsFromExpression(expression.left, calls);
				this.collectCallsFromExpression(expression.right, calls);
				break;
			case 'UnaryExpression': this.collectCallsFromExpression(expression.argument, calls); break;
			case 'ArrayExpression': expression.elements.forEach(element => this.collectCallsFromExpression(element, calls)); break;
			case 'AssignmentExpression':
				this.collectCallsFromExpression(expression.left, calls);
				this.collectCallsFromExpression(expression.right, calls);
				break;
		}
	}

	private statementsContainPosition(statements: Statement[], position: Position): boolean {
		return statements.some(statement => this.rangeContainsPosition(statement.range, position));
	}

	private rangeContainsPosition(range: Range, position: Position): boolean {
		return this.comparePositions(range.start, position) <= 0 && this.comparePositions(position, range.end) <= 0;
	}

	private rangesIntersect(left: Range, right: Range): boolean {
		return this.comparePositions(left.start, right.end) <= 0 && this.comparePositions(right.start, left.end) <= 0;
	}

	private comparePositions(left: Position, right: Position): number {
		return left.line === right.line ? left.character - right.character : left.line - right.line;
	}

	private rangeSize(range: Range): number {
		return (range.end.line - range.start.line) * 100000 + range.end.character - range.start.character;
	}
}
