import { CodeAction, CodeActionKind, Diagnostic, Position, Range, TextEdit } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
	Expression,
	FormDefinition,
	FrameDefinition,
	GadgetDeclaration,
	MemberDeclaration,
	MethodDefinition,
	PMLType,
	Program,
	Statement
} from '../ast/nodes';
import { SymbolIndex } from '../index/symbolIndex';

const GO_TO_CALLABLE_COMMAND = 'pml.goToCallableDefinition';

type CallbackBinding = {
	methodName: string;
	range: Range;
	label: string;
	navigable: boolean;
};

type TypedMemberCandidate = {
	name: string;
	type: PMLType;
	range: Range;
};

type MemberTypeAlignment = {
	member: MemberDeclaration;
	type: PMLType;
};

const FORM_BUILTIN_MEMBERS = new Set([
	'callback', 'initcall', 'firstshowncall', 'okcall', 'cancelcall', 'quitcall',
	'killcall', 'killingcall', 'formtitle', 'icontitle', 'setactive', 'val', 'active', 'visible'
]);

export class FormAuthoringCodeActionProvider {
	constructor(private readonly symbolIndex: SymbolIndex) {}

	public provide(
		document: TextDocument,
		requestedRange: Range,
		program: Program,
		diagnostics: Diagnostic[] = [],
		onlyKinds?: string[]
	): CodeAction[] {
		if (!document.uri.toLowerCase().endsWith('.pmlfrm')) return [];
		const forms = program.body.filter((statement): statement is FormDefinition => statement.type === 'FormDefinition');
		if (forms.length !== 1) return [];

		const actions = [
			...this.callbackNavigationActions(document, requestedRange, program, forms[0]),
			...this.memberDeclarationActions(document, program, forms[0], diagnostics),
			...this.memberTypeMismatchActions(document, forms[0], diagnostics),
			...this.lifecycleActions(document, requestedRange, program, forms[0]),
			...this.batchAuthoringActions(document, requestedRange, program, forms[0])
		];
		return this.filterRequestedKinds(actions, onlyKinds);
	}

	private memberTypeMismatchActions(document: TextDocument, form: FormDefinition, diagnostics: Diagnostic[]): CodeAction[] {
		const actions: CodeAction[] = [];
		const offeredNames = new Set<string>();
		for (const diagnostic of diagnostics) {
			if (String(diagnostic.code) !== 'form-member-type-mismatch') continue;
			const match = diagnostic.message.match(/^Form member '\.([A-Za-z_][A-Za-z0-9_]*)' is \w+ but assignment is (STRING|REAL|INTEGER|BOOLEAN|ARRAY|DBREF)\./);
			if (!match || offeredNames.has(match[1].toLowerCase())) continue;
			const member = form.members.find(candidate => candidate.name.toLowerCase() === match[1].toLowerCase());
			if (!member) continue;
			const edit = this.memberTypeEdit(document, member, match[2]);
			if (!edit) continue;
			actions.push({
				title: `Change form member .${member.name} type to ${match[2]}`,
				kind: CodeActionKind.QuickFix,
				diagnostics: [diagnostic],
				isPreferred: true,
				edit: { changes: { [document.uri]: [edit] } }
			});
			offeredNames.add(member.name.toLowerCase());
		}
		return actions;
	}

	private callbackNavigationActions(
		document: TextDocument,
		requestedRange: Range,
		program: Program,
		form: FormDefinition
	): CodeAction[] {
		const bindings = this.collectCallbackBindings(form);
		for (const binding of bindings) {
			if (!binding.navigable) continue;
			if (!this.rangesIntersect(binding.range, requestedRange)) continue;
			const methods = this.symbolIndex.findMethodsInFile(document.uri, binding.methodName);
			if (methods.length !== 1) return [];
			return [this.navigationAction(
				`Go to callback method .${binding.methodName}`,
				document.uri,
				methods[0].selectionRange.start
			)];
		}

		const method = program.body.find((statement): statement is MethodDefinition =>
			statement.type === 'MethodDefinition' &&
			statement.range.start.line === requestedRange.start.line &&
			this.rangeContains(statement.range, requestedRange.start)
		);
		if (!method) return [];
		const methodBindings = bindings.filter(candidate =>
			candidate.navigable && candidate.methodName.toLowerCase() === method.name.toLowerCase()
		);
		return methodBindings.map(binding => this.navigationAction(
			methodBindings.length === 1
				? `Go to callback declaration for .${method.name}`
				: `Go to ${binding.label} callback for .${method.name}`,
			document.uri,
			binding.range.start
		));
	}

	private memberDeclarationActions(
		document: TextDocument,
		program: Program,
		form: FormDefinition,
		diagnostics: Diagnostic[]
	): CodeAction[] {
		const actions: CodeAction[] = [];
		const offeredNames = new Set<string>();
		for (const diagnostic of diagnostics) {
			if (String(diagnostic.code) !== 'unknown-form-member') continue;
			const name = diagnostic.message.match(/'!this\.([A-Za-z_][A-Za-z0-9_]*)'/)?.[1];
			if (!name || this.formHasMember(form, name) || offeredNames.has(name.toLowerCase())) continue;
			const assignment = this.findDirectThisAssignment(program.body, name, diagnostic.range);
			const type = assignment ? this.reliableExpressionType(assignment) : undefined;
			if (!type) continue;
			const insertion = this.formBodyInsertion(document, form, `member .${name} is ${this.typeLabel(type)}`);
			if (!insertion) continue;
			actions.push({
				title: `Declare form member .${name} as ${this.typeLabel(type)}`,
				kind: CodeActionKind.QuickFix,
				diagnostics: [diagnostic],
				isPreferred: true,
				edit: { changes: { [document.uri]: [insertion] } }
			});
			offeredNames.add(name.toLowerCase());
		}
		return actions;
	}

	private lifecycleActions(
		document: TextDocument,
		requestedRange: Range,
		program: Program,
		form: FormDefinition
	): CodeAction[] {
		if (requestedRange.start.line !== form.range.start.line) return [];
		const hasInitBinding = Object.entries(form.callbacks).some(([property, callback]) =>
			/(?:^|\.)callback$/i.test(property) || /!this\.init\s*\(/i.test(callback)
		);
		if (hasInitBinding) return [];
		const bindingEdit = this.formBodyInsertion(document, form, "!this.callback = '!this.init()'");
		if (!bindingEdit) return [];
		const edits = [bindingEdit];
		if (this.symbolIndex.findMethodsInFile(document.uri, 'init').length === 0) {
			edits.push(TextEdit.insert(
				document.positionAt(document.getText().length),
				this.methodStubText(document, 'init')
			));
		}
		return [{
			title: 'Add form init callback',
			kind: CodeActionKind.RefactorRewrite,
			edit: { changes: { [document.uri]: edits } },
			command: {
				title: 'Open form init callback',
				command: GO_TO_CALLABLE_COMMAND,
				arguments: [document.uri, this.initMethodPosition(document, program)]
			}
		}];
	}

	private batchAuthoringActions(
		document: TextDocument,
		requestedRange: Range,
		program: Program,
		form: FormDefinition
	): CodeAction[] {
		if (requestedRange.start.line !== form.range.start.line) return [];
		const actions: CodeAction[] = [];
		const missingCallbacks = this.uniqueMissingCallbacks(document.uri, this.collectCallbackBindings(form));
		if (missingCallbacks.length > 0) {
			const stubText = missingCallbacks.map(binding => this.methodStubText(document, binding.methodName, false)).join('');
			actions.push({
				title: `Generate all missing callback methods (${missingCallbacks.length})`,
				kind: CodeActionKind.RefactorRewrite,
				edit: { changes: { [document.uri]: [TextEdit.insert(
					document.positionAt(document.getText().length),
					this.appendPrefix(document) + stubText
				)] } },
				command: {
					title: 'Open first generated callback',
					command: GO_TO_CALLABLE_COMMAND,
					arguments: [document.uri, this.appendedMethodPosition(document)]
				}
			});
		}

		const lifecycleAction = this.lifecyclePackAction(document, program, form);
		if (lifecycleAction) actions.push(lifecycleAction);

		const memberCandidates = this.typedMemberCandidates(program.body, form);
		if (memberCandidates.length > 0) {
			const insertion = this.formBodyInsertion(
				document,
				form,
				memberCandidates.map(candidate => `member .${candidate.name} is ${this.typeLabel(candidate.type)}`)
			);
			if (insertion) {
				actions.push({
					title: `Declare all reliably typed form members (${memberCandidates.length})`,
					kind: CodeActionKind.RefactorRewrite,
					edit: { changes: { [document.uri]: [insertion] } }
				});
			}
		}

		const alignments = this.memberTypeAlignments(program.body, form);
		if (alignments.length > 0) {
			const edits = alignments
				.map(alignment => this.memberTypeEdit(document, alignment.member, this.typeLabel(alignment.type)))
				.filter((edit): edit is TextEdit => Boolean(edit));
			if (edits.length > 0) {
				actions.push({
					title: `Align form member types with reliable assignments (${edits.length})`,
					kind: CodeActionKind.RefactorRewrite,
					edit: { changes: { [document.uri]: edits } }
				});
			}
		}
		return actions;
	}

	private lifecyclePackAction(document: TextDocument, program: Program, form: FormDefinition): CodeAction | undefined {
		const lifecycle = [
			{ property: 'callback', method: 'init' },
			{ property: 'okcall', method: 'onOk' },
			{ property: 'cancelcall', method: 'onCancel' }
		];
		const existingProperties = new Set(Object.keys(form.callbacks).map(property => property.split('.').pop()?.toLowerCase()));
		const missingBindings = lifecycle.filter(item => !existingProperties.has(item.property));
		const missingMethods = missingBindings.filter(item =>
			this.symbolIndex.findMethodsInFile(document.uri, item.method).length === 0
		);
		if (missingBindings.length === 0 && missingMethods.length === 0) return undefined;
		const edits: TextEdit[] = [];
		if (missingBindings.length > 0) {
			const bindingEdit = this.formBodyInsertion(document, form, missingBindings.map(item =>
				`!this.${item.property} = '!this.${item.method}()'`
			));
			if (bindingEdit) edits.push(bindingEdit);
		}
		if (missingMethods.length > 0) {
			edits.push(TextEdit.insert(
				document.positionAt(document.getText().length),
				this.appendPrefix(document) + missingMethods.map(item => this.methodStubText(document, item.method, false)).join('')
			));
		}
		if (edits.length === 0) return undefined;
		const firstMethod = missingMethods[0]?.method ?? lifecycle[0].method;
		const existing = this.symbolIndex.findMethodsInFile(document.uri, firstMethod)[0];
		return {
			title: 'Add form lifecycle pack (init, OK, cancel)',
			kind: CodeActionKind.RefactorRewrite,
			edit: { changes: { [document.uri]: edits } },
			command: {
				title: 'Open first lifecycle callback',
				command: GO_TO_CALLABLE_COMMAND,
				arguments: [document.uri, existing?.selectionRange.start ?? this.appendedMethodPosition(document)]
			}
		};
	}

	private collectCallbackBindings(form: FormDefinition): CallbackBinding[] {
		const bindings: CallbackBinding[] = [];
		const addGadget = (gadget: GadgetDeclaration): void => {
			const callback = gadget.properties.call;
			const methodName = typeof callback === 'string' ? this.directCallbackMethod(callback) : undefined;
			if (methodName) bindings.push({ methodName, range: gadget.range, label: `.${gadget.name}`, navigable: true });
		};
		form.body.forEach(statement => { if (statement.type === 'GadgetDeclaration') addGadget(statement); });
		const visitFrame = (frame: FrameDefinition): void => {
			frame.gadgets.forEach(addGadget);
			frame.frames.forEach(visitFrame);
		};
		form.frames.forEach(visitFrame);
		for (const [property, callback] of Object.entries(form.callbacks)) {
			const methodName = this.directCallbackMethod(callback);
			if (methodName) bindings.push({ methodName, range: form.range, label: property, navigable: false });
		}
		return bindings.sort((left, right) => this.compare(left.range.start, right.range.start));
	}

	private uniqueMissingCallbacks(uri: string, bindings: CallbackBinding[]): CallbackBinding[] {
		const seen = new Set<string>();
		return bindings.filter(binding => {
			const key = binding.methodName.toLowerCase();
			if (seen.has(key) || this.symbolIndex.findMethodsInFile(uri, binding.methodName).length > 0) return false;
			seen.add(key);
			return true;
		});
	}

	private directCallbackMethod(callback: string): string | undefined {
		return callback.trim().match(/^(?:!this\.|\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/i)?.[1];
	}

	private navigationAction(title: string, uri: string, position: Position): CodeAction {
		return {
			title,
			kind: CodeActionKind.Refactor,
			command: { title, command: GO_TO_CALLABLE_COMMAND, arguments: [uri, position] }
		};
	}

	private findDirectThisAssignment(statements: Statement[], name: string, range: Range): Expression | undefined {
		for (const statement of statements) {
			if (!this.rangesIntersect(statement.range, range)) continue;
			if (statement.type === 'ExpressionStatement' && statement.expression.type === 'AssignmentExpression') {
				const left = statement.expression.left;
				if (left.type === 'MemberExpression' && !left.computed &&
					left.object.type === 'Identifier' && left.object.name.toLowerCase() === 'this' &&
					left.property.type === 'Identifier' && left.property.name.toLowerCase() === name.toLowerCase()) {
					return statement.expression.right;
				}
			}
			for (const children of this.statementChildren(statement)) {
				const found = this.findDirectThisAssignment(children, name, range);
				if (found) return found;
			}
		}
		return undefined;
	}

	private statementChildren(statement: Statement): Statement[][] {
		switch (statement.type) {
			case 'MethodDefinition':
			case 'FunctionDefinition': return [statement.body];
			case 'IfStatement': return [statement.consequent, ...(Array.isArray(statement.alternate) ? [statement.alternate] : statement.alternate ? [[statement.alternate]] : [])];
			case 'DoStatement': return [statement.body];
			case 'HandleStatement': return [statement.body, ...(statement.alternate ? [statement.alternate] : [])];
			default: return [];
		}
	}

	private reliableExpressionType(expression: Expression): PMLType | undefined {
		if (expression.type === 'Literal') return expression.pmlType;
		if (expression.type === 'ArrayExpression') return { kind: 'ARRAY', elementType: { kind: 'ANY' } };
		if (expression.type === 'CallExpression' && expression.callee.type === 'Identifier' && expression.callee.objectConstructor) {
			switch (expression.callee.name.toUpperCase()) {
				case 'STRING': return { kind: 'STRING' };
				case 'REAL': return { kind: 'REAL' };
				case 'INTEGER': return { kind: 'INTEGER' };
				case 'BOOLEAN': return { kind: 'BOOLEAN' };
				case 'ARRAY': return { kind: 'ARRAY', elementType: { kind: 'ANY' } };
				case 'DBREF': return { kind: 'DBREF' };
			}
		}
		return undefined;
	}

	private typeLabel(type: PMLType): string {
		return type.kind;
	}

	private formHasMember(form: FormDefinition, name: string): boolean {
		return form.members.some(member => member.name.toLowerCase() === name.toLowerCase());
	}

	private typedMemberCandidates(statements: Statement[], form: FormDefinition): TypedMemberCandidate[] {
		const known = new Set<string>(FORM_BUILTIN_MEMBERS);
		form.members.forEach(member => known.add(member.name.toLowerCase()));
		this.collectFormStructuralNames(form, known);
		statements.forEach(statement => {
			if (statement.type === 'MethodDefinition') known.add(statement.name.toLowerCase());
		});
		const candidates = new Map<string, TypedMemberCandidate>();
		const visit = (items: Statement[]): void => {
			for (const statement of items) {
				if (statement.type === 'ExpressionStatement' && statement.expression.type === 'AssignmentExpression') {
					const left = statement.expression.left;
					if (left.type === 'MemberExpression' && !left.computed &&
						left.object.type === 'Identifier' && left.object.name.toLowerCase() === 'this' &&
						left.property.type === 'Identifier') {
						const name = left.property.name;
						const key = name.toLowerCase();
						const type = this.reliableExpressionType(statement.expression.right);
						if (!known.has(key) && !candidates.has(key) && type) {
							candidates.set(key, { name, type, range: statement.range });
						}
					}
				}
				this.statementChildren(statement).forEach(visit);
			}
		};
		visit(statements);
		return Array.from(candidates.values()).sort((left, right) => this.compare(left.range.start, right.range.start));
	}

	private memberTypeAlignments(statements: Statement[], form: FormDefinition): MemberTypeAlignment[] {
		const values = new Map<string, { type: PMLType; range: Range }[]>();
		const visit = (items: Statement[]): void => {
			for (const statement of items) {
				if (statement.type === 'ExpressionStatement' && statement.expression.type === 'AssignmentExpression') {
					const left = statement.expression.left;
					if (left.type === 'MemberExpression' && !left.computed &&
						left.object.type === 'Identifier' && left.object.name.toLowerCase() === 'this' &&
						left.property.type === 'Identifier') {
						const type = this.reliableExpressionType(statement.expression.right);
						const key = left.property.name.toLowerCase();
						if (type && this.formHasMember(form, key)) {
							const assignments = values.get(key) ?? [];
							assignments.push({ type, range: statement.range });
							values.set(key, assignments);
						}
					}
				}
				this.statementChildren(statement).forEach(visit);
			}
		};
		visit(statements);
		return form.members.flatMap(member => {
			if (!this.isConcreteMemberType(member.memberType)) return [];
			const assignments = values.get(member.name.toLowerCase()) ?? [];
			const kinds = new Set(assignments.map(assignment => assignment.type.kind));
			if (kinds.size !== 1 || kinds.has(member.memberType.kind)) return [];
			return [{ member, type: assignments[0].type }];
		});
	}

	private memberTypeEdit(document: TextDocument, member: MemberDeclaration, type: string): TextEdit | undefined {
		const source = document.getText(member.range);
		const match = /\bis\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(source);
			if (!match || match.index === undefined) return undefined;
		const offset = document.offsetAt(member.range.start) + match.index + match[0].lastIndexOf(match[1]);
		return TextEdit.replace(Range.create(document.positionAt(offset), document.positionAt(offset + match[1].length)), type);
	}

	private isConcreteMemberType(type: PMLType): boolean {
		return type.kind !== 'ANY' && type.kind !== 'UNDEFINED' && type.kind !== 'UNION';
	}

	private collectFormStructuralNames(form: FormDefinition, known: Set<string>): void {
		form.body.forEach(statement => { if (statement.type === 'GadgetDeclaration') known.add(statement.name.toLowerCase()); });
		const visitFrame = (frame: FrameDefinition): void => {
			known.add(frame.name.toLowerCase());
			frame.gadgets.forEach(gadget => known.add(gadget.name.toLowerCase()));
			frame.frames.forEach(visitFrame);
		};
		form.frames.forEach(visitFrame);
	}

	private formBodyInsertion(document: TextDocument, form: FormDefinition, text: string | string[]): TextEdit | undefined {
		const source = document.getText(form.range);
		const exitPattern = /^[ \t]*exit\b/gim;
		let match: RegExpExecArray | null;
		let last: RegExpExecArray | null = null;
		while ((match = exitPattern.exec(source))) last = match;
		if (!last) return undefined;
		const offset = document.offsetAt(form.range.start) + last.index;
		const newline = document.getText().includes('\r\n') ? '\r\n' : '\n';
		const lines = Array.isArray(text) ? text : [text];
		return TextEdit.insert(document.positionAt(offset), lines.map(line => `\t${line}${newline}`).join(''));
	}

	private methodStubText(document: TextDocument, name: string, includePrefix = true): string {
		const newline = document.getText().includes('\r\n') ? '\r\n' : '\n';
		const prefix = includePrefix ? this.appendPrefix(document) : '';
		return `${prefix}define method .${name}()${newline}\t-- TODO: Implement.${newline}endmethod${newline}`;
	}

	private appendPrefix(document: TextDocument): string {
		const newline = document.getText().includes('\r\n') ? '\r\n' : '\n';
		const source = document.getText();
		return source.length === 0 ? '' : source.endsWith(newline) ? newline : newline + newline;
	}

	private appendedMethodPosition(document: TextDocument): Position {
		const end = document.positionAt(document.getText().length);
		if (document.getText().length === 0) return end;
		return Position.create(end.line + (document.getText().endsWith('\n') ? 1 : 2), 0);
	}

	private initMethodPosition(document: TextDocument, program: Program): Position {
		const existing = program.body.find((statement): statement is MethodDefinition =>
			statement.type === 'MethodDefinition' && statement.name.toLowerCase() === 'init'
		);
		if (existing) return existing.range.start;
		const end = document.positionAt(document.getText().length);
		if (document.getText().length === 0) return end;
		return Position.create(end.line + (document.getText().endsWith('\n') ? 1 : 2), 0);
	}

	private filterRequestedKinds(actions: CodeAction[], onlyKinds?: string[]): CodeAction[] {
		if (!onlyKinds?.length) return actions;
		return actions.filter(action => onlyKinds.some(kind => action.kind === kind || action.kind?.startsWith(`${kind}.`)));
	}

	private rangeContains(range: Range, position: Position): boolean {
		return this.compare(range.start, position) <= 0 && this.compare(position, range.end) <= 0;
	}

	private rangesIntersect(left: Range, right: Range): boolean {
		return this.compare(left.start, right.end) <= 0 && this.compare(right.start, left.end) <= 0;
	}

	private compare(left: Position, right: Position): number {
		return left.line === right.line ? left.character - right.character : left.line - right.line;
	}
}
