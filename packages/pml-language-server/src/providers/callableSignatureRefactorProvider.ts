import { CodeAction, CodeActionKind, Position, Range, TextEdit } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
	CallExpression,
	Expression,
	FunctionDefinition,
	MethodDefinition,
	Parameter,
	Program,
	Statement
} from '../ast/nodes';
import { SymbolIndex } from '../index/symbolIndex';
import { Parser, parserModeFromUri } from '../parser/parser';

type CallableDefinition = MethodDefinition | FunctionDefinition;

type CallableTarget = {
	kind: 'method' | 'function';
	name: string;
};

type CallSite = {
	document: TextDocument;
	call: CallExpression;
};

/**
 * Provides deliberately narrow signature changes which can update every direct
 * call without inventing values or touching dynamic receivers.
 */
export class CallableSignatureRefactorProvider {
	constructor(private readonly symbolIndex: SymbolIndex) {}

	public provide(document: TextDocument, requestedRange: Range, program: Program, onlyKinds?: string[]): CodeAction[] {
		const definition = this.definitionAt(program, requestedRange.start);
		if (!definition || requestedRange.start.line !== definition.range.start.line || requestedRange.end.line !== definition.range.start.line) return [];
		const target: CallableTarget = {
			kind: definition.type === 'MethodDefinition' ? 'method' : 'function',
			name: definition.name
		};
		if (!this.isUnambiguous(target, document.uri) || definition.parameters.length === 0) return [];

		const calls = this.directCallSites(target, document.uri);
		if (!calls || calls.some(site => site.call.arguments.length !== definition.parameters.length) || this.hasNestedCallSites(calls)) return [];
		const label = `${target.kind === 'method' ? '.' : '!!'}${target.name}`;
		const actions: CodeAction[] = [];
		for (const [parameterIndex, parameter] of definition.parameters.entries()) {
			if (this.parameterIsUsed(definition.body, parameter.name)) continue;
			const definitionEdit = this.removeItemEdit(definition.parameters, parameterIndex);
			if (!definitionEdit) continue;
			const changes: Record<string, TextEdit[]> = { [document.uri]: [definitionEdit] };
			let safe = true;
			for (const site of calls) {
				const edit = this.removeItemEdit(site.call.arguments, parameterIndex);
				if (!edit) {
					safe = false;
					break;
				}
				(changes[site.document.uri] ??= []).push(edit);
			}
			if (!safe || this.hasOverlappingEdits(changes)) continue;
			actions.push({
				title: `Remove unused parameter !${parameter.name} from ${label} and update ${calls.length} direct call${calls.length === 1 ? '' : 's'}`,
				kind: CodeActionKind.RefactorRewrite,
				isPreferred: true,
				edit: { changes }
			});
		}
		return this.filterRequestedKinds(actions, onlyKinds);
	}

	private definitionAt(program: Program, position: Position): CallableDefinition | undefined {
		for (const statement of program.body) {
			if ((statement.type === 'MethodDefinition' || statement.type === 'FunctionDefinition') && this.rangeContains(statement.range, position)) return statement;
			if (statement.type === 'ObjectDefinition') {
				const method = statement.members.find(candidate => this.rangeContains(candidate.range, position));
				if (method) return method;
			}
		}
		return undefined;
	}

	private isUnambiguous(target: CallableTarget, uri: string): boolean {
		return target.kind === 'method'
			? this.symbolIndex.findMethodsInFile(uri, target.name).length === 1
			: this.symbolIndex.findFunction(target.name).length === 1;
	}

	private directCallSites(target: CallableTarget, definitionUri: string): CallSite[] | undefined {
		const references = target.kind === 'method'
			? this.symbolIndex.findMethodReferencesInFile(definitionUri, target.name)
			: this.symbolIndex.findFunctionReferences(target.name);
		const uris = Array.from(new Set(references.map(reference => reference.uri)));
		const callSites: CallSite[] = [];
		for (const uri of uris) {
			const source = this.symbolIndex.getDocumentText(uri);
			if (source === undefined) return undefined;
			const parsed = new Parser().parse(source, { mode: parserModeFromUri(uri) });
			if (parsed.errors.length > 0) return undefined;
			const document = TextDocument.create(uri, 'pml', 0, source);
			for (const call of this.collectCalls(parsed.ast.body)) {
				const candidate = this.directTarget(call.callee);
				if (candidate?.kind === target.kind && candidate.name.toLowerCase() === target.name.toLowerCase()) {
					callSites.push({ document, call });
				}
			}
		}
		return callSites.length === references.length ? callSites : undefined;
	}

	private directTarget(callee: Expression): CallableTarget | undefined {
		if (callee.type === 'Identifier') {
			if (callee.scope === 'method') return { kind: 'method', name: callee.name };
			if (callee.scope === 'global') return { kind: 'function', name: callee.name };
			return undefined;
		}
		if (callee.type === 'MemberExpression' && !callee.computed &&
			callee.object.type === 'Identifier' && callee.object.name.toLowerCase() === 'this' &&
			callee.property.type === 'Identifier') {
			return { kind: 'method', name: callee.property.name };
		}
		return undefined;
	}

	private parameterIsUsed(statements: Statement[], name: string): boolean {
		const uses = (expression: Expression): boolean => {
			switch (expression.type) {
				case 'Identifier': return expression.name.toLowerCase() === name.toLowerCase() ||
					new RegExp(`(?:^|[^A-Za-z0-9_])!?${this.escapeRegExp(name)}(?![A-Za-z0-9_])`, 'i').test(expression.name);
				case 'Literal': return expression.literalType === 'string' && typeof expression.value === 'string' && new RegExp(`\\$!${name}\\b`, 'i').test(expression.value);
				case 'CallExpression': return uses(expression.callee) || expression.arguments.some(uses);
				case 'MemberExpression': return uses(expression.object) || (expression.computed && uses(expression.property));
				case 'BinaryExpression':
				case 'AssignmentExpression': return uses(expression.left) || uses(expression.right);
				case 'UnaryExpression': return uses(expression.argument);
				case 'ArrayExpression': return expression.elements.some(uses);
				default: return true;
			}
		};
		const visit = (items: Statement[]): boolean => items.some(statement => {
			switch (statement.type) {
				case 'ExpressionStatement': return uses(statement.expression);
				case 'VariableDeclaration': return Boolean(statement.initializer && uses(statement.initializer));
				case 'ReturnStatement': return Boolean(statement.argument && uses(statement.argument));
				case 'IfStatement': return uses(statement.test) || visit(statement.consequent) || (Array.isArray(statement.alternate) ? visit(statement.alternate) : Boolean(statement.alternate && visit([statement.alternate])));
				case 'DoStatement': return Boolean((statement.collection && uses(statement.collection)) || (statement.from && uses(statement.from)) || (statement.to && uses(statement.to)) || (statement.by && uses(statement.by)) || (statement.condition && uses(statement.condition)) || visit(statement.body));
				case 'HandleStatement': return visit(statement.body) || Boolean(statement.alternate && visit(statement.alternate));
				case 'BreakStatement':
				case 'ContinueStatement': return Boolean(statement.condition && uses(statement.condition));
				default: return true;
			}
		});
		return visit(statements);
	}

	private removeItemEdit(items: Array<Parameter | Expression>, index: number): TextEdit | undefined {
		const item = items[index];
		if (!item) return undefined;
		if (items.length === 1) return TextEdit.replace(item.range, '');
		if (index === 0) return TextEdit.replace(Range.create(item.range.start, items[1].range.start), '');
		return TextEdit.replace(Range.create(items[index - 1].range.end, item.range.end), '');
	}

	private hasOverlappingEdits(changes: Record<string, TextEdit[]>): boolean {
		return Object.values(changes).some(edits => {
			const sorted = [...edits].sort((left, right) => this.compare(left.range.start, right.range.start));
			return sorted.some((edit, index) => index > 0 && this.compare(sorted[index - 1].range.end, edit.range.start) > 0);
		});
	}

	private hasNestedCallSites(calls: CallSite[]): boolean {
		return calls.some((outer, outerIndex) => calls.some((inner, innerIndex) =>
			outerIndex !== innerIndex && outer.document.uri === inner.document.uri &&
			this.compare(outer.call.range.start, inner.call.range.start) <= 0 &&
			this.compare(inner.call.range.end, outer.call.range.end) <= 0
		));
	}

	private escapeRegExp(value: string): string {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private collectCalls(statements: Statement[]): CallExpression[] {
		const calls: CallExpression[] = [];
		const expressions = (expression: Expression): void => {
			switch (expression.type) {
				case 'CallExpression': calls.push(expression); expressions(expression.callee); expression.arguments.forEach(expressions); break;
				case 'MemberExpression': expressions(expression.object); if (expression.computed) expressions(expression.property); break;
				case 'BinaryExpression':
				case 'AssignmentExpression': expressions(expression.left); expressions(expression.right); break;
				case 'UnaryExpression': expressions(expression.argument); break;
				case 'ArrayExpression': expression.elements.forEach(expressions); break;
			}
		};
		const visit = (items: Statement[]): void => items.forEach(statement => {
			switch (statement.type) {
				case 'MethodDefinition':
				case 'FunctionDefinition': visit(statement.body); break;
				case 'ObjectDefinition': statement.members.forEach(method => visit(method.body)); break;
				case 'FormDefinition': visit(statement.body); break;
				case 'ExpressionStatement': expressions(statement.expression); break;
				case 'VariableDeclaration': if (statement.initializer) expressions(statement.initializer); break;
				case 'ReturnStatement': if (statement.argument) expressions(statement.argument); break;
				case 'IfStatement': expressions(statement.test); visit(statement.consequent); if (Array.isArray(statement.alternate)) visit(statement.alternate); else if (statement.alternate) visit([statement.alternate]); break;
				case 'DoStatement': [statement.collection, statement.from, statement.to, statement.by, statement.condition].forEach(expression => { if (expression) expressions(expression); }); visit(statement.body); break;
				case 'HandleStatement': visit(statement.body); if (statement.alternate) visit(statement.alternate); break;
				case 'BreakStatement':
				case 'ContinueStatement': if (statement.condition) expressions(statement.condition); break;
			}
		});
		visit(statements);
		return calls;
	}

	private filterRequestedKinds(actions: CodeAction[], onlyKinds?: string[]): CodeAction[] {
		if (!onlyKinds?.length) return actions;
		return actions.filter(action => onlyKinds.some(kind => action.kind === kind || action.kind?.startsWith(`${kind}.`)));
	}

	private rangeContains(range: Range, position: Position): boolean {
		return this.compare(range.start, position) <= 0 && this.compare(position, range.end) <= 0;
	}

	private compare(left: Position, right: Position): number {
		return left.line === right.line ? left.character - right.character : left.line - right.line;
	}
}
