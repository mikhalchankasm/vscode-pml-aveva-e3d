import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import {
	Expression,
	FormDefinition,
	FrameDefinition,
	GadgetDeclaration,
	MethodDefinition,
	PMLType,
	Program,
	Statement
} from '../ast/nodes';

const FORM_BUILTIN_MEMBERS = new Set([
	'callback',
	'initcall',
	'firstshowncall',
	'okcall',
	'cancelcall',
	'quitcall',
	'killcall',
	'killingcall',
	'formtitle',
	'icontitle',
	'setactive',
	'val',
	'active',
	'visible'
]);

export class FormReferenceValidator {
	public check(program: Program, severity: DiagnosticSeverity = DiagnosticSeverity.Warning): Diagnostic[] {
		const forms = program.body.filter((statement): statement is FormDefinition => statement.type === 'FormDefinition');
		if (forms.length === 0) {
			return [];
		}

		const methods = new Set(
			program.body
				.filter((statement): statement is MethodDefinition => statement.type === 'MethodDefinition')
				.map(method => method.name.toLowerCase())
		);
		const knownThisMembers = this.collectKnownThisMembers(forms, methods);
		const diagnostics: Diagnostic[] = [];

		for (const form of forms) {
			this.validateFormCallbacks(form, methods, severity, diagnostics);
			this.validateGadgetCallbacks(form, methods, severity, diagnostics);
		}

		for (const statement of program.body) {
			if (statement.type === 'MethodDefinition') {
				this.validateMethodReferences(statement, knownThisMembers, severity, diagnostics);
			}
		}

		for (const form of forms) {
			this.validateReliableMemberAssignments(form, program.body, severity, diagnostics);
		}

		return diagnostics;
	}

	private collectKnownThisMembers(forms: FormDefinition[], methods: Set<string>): Set<string> {
		const known = new Set(FORM_BUILTIN_MEMBERS);
		for (const method of methods) {
			known.add(method);
		}

		for (const form of forms) {
			for (const member of form.members) {
				known.add(member.name.toLowerCase());
			}
			for (const statement of form.body) {
				if (statement.type === 'GadgetDeclaration') {
					known.add(statement.name.toLowerCase());
				}
			}
			for (const frame of form.frames) {
				this.collectFrameMembers(frame, known);
			}
		}

		return known;
	}

	private collectFrameMembers(frame: FrameDefinition, known: Set<string>): void {
		known.add(frame.name.toLowerCase());
		for (const gadget of frame.gadgets) {
			known.add(gadget.name.toLowerCase());
		}
		for (const childFrame of frame.frames) {
			this.collectFrameMembers(childFrame, known);
		}
	}

	private validateFormCallbacks(
		form: FormDefinition,
		methods: Set<string>,
		severity: DiagnosticSeverity,
		diagnostics: Diagnostic[]
	): void {
		for (const [property, callback] of Object.entries(form.callbacks)) {
			this.validateCallbackTarget(callback, methods, form.range, severity, diagnostics, `Form callback '${property}'`);
		}
	}

	private validateGadgetCallbacks(
		form: FormDefinition,
		methods: Set<string>,
		severity: DiagnosticSeverity,
		diagnostics: Diagnostic[]
	): void {
		for (const statement of form.body) {
			if (statement.type === 'GadgetDeclaration') {
				this.validateGadgetCallback(statement, methods, severity, diagnostics);
			}
		}
		for (const frame of form.frames) {
			this.validateFrameGadgetCallbacks(frame, methods, severity, diagnostics);
		}
	}

	private validateFrameGadgetCallbacks(
		frame: FrameDefinition,
		methods: Set<string>,
		severity: DiagnosticSeverity,
		diagnostics: Diagnostic[]
	): void {
		for (const gadget of frame.gadgets) {
			this.validateGadgetCallback(gadget, methods, severity, diagnostics);
		}
		for (const childFrame of frame.frames) {
			this.validateFrameGadgetCallbacks(childFrame, methods, severity, diagnostics);
		}
	}

	private validateGadgetCallback(
		gadget: GadgetDeclaration,
		methods: Set<string>,
		severity: DiagnosticSeverity,
		diagnostics: Diagnostic[]
	): void {
		const call = gadget.properties.call;
		if (typeof call === 'string') {
			this.validateCallbackTarget(call, methods, gadget.range, severity, diagnostics, `Gadget '.${gadget.name}' callback`);
		}
	}

	private validateCallbackTarget(
		callback: string,
		methods: Set<string>,
		range: Diagnostic['range'],
		severity: DiagnosticSeverity,
		diagnostics: Diagnostic[],
		label: string
	): void {
		const methodName = this.extractDirectThisCallback(callback);
		if (!methodName || methods.has(methodName.toLowerCase())) {
			return;
		}

		diagnostics.push({
			severity,
			range,
			message: `${label} references missing method '.${methodName}()'. Define it or update the callback target.`,
			source: 'pml-form-references',
			code: 'missing-form-callback'
		});
	}

	private extractDirectThisCallback(callback: string): string | undefined {
		const match = callback.trim().match(/^(?:!this\.|\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
		return match?.[1];
	}

	private validateMethodReferences(
		method: MethodDefinition,
		knownThisMembers: Set<string>,
		severity: DiagnosticSeverity,
		diagnostics: Diagnostic[]
	): void {
		for (const statement of method.body) {
			this.validateStatementReferences(statement, knownThisMembers, severity, diagnostics);
		}
	}

	private validateReliableMemberAssignments(
		form: FormDefinition,
		statements: Statement[],
		severity: DiagnosticSeverity,
		diagnostics: Diagnostic[]
	): void {
		const members = new Map(form.members.map(member => [member.name.toLowerCase(), member]));
		const assignments = new Map<string, { type: PMLType; range: Diagnostic['range'] }[]>();
		const visit = (items: Statement[]): void => {
			for (const statement of items) {
				if (statement.type === 'ExpressionStatement' && statement.expression.type === 'AssignmentExpression') {
					const left = statement.expression.left;
					if (left.type === 'MemberExpression' && !left.computed &&
						left.object.type === 'Identifier' && left.object.name.toLowerCase() === 'this' &&
						left.property.type === 'Identifier') {
						const type = this.reliableExpressionType(statement.expression.right);
						const key = left.property.name.toLowerCase();
						if (type && members.has(key)) {
							const values = assignments.get(key) ?? [];
							values.push({ type, range: statement.expression.range });
							assignments.set(key, values);
						}
					}
				}
				this.statementChildren(statement).forEach(visit);
			}
		};
		visit(statements);

		for (const [key, values] of assignments) {
			const member = members.get(key);
			if (!member || !this.isConcreteMemberType(member.memberType)) continue;
			const inferredKinds = new Set(values.map(value => value.type.kind));
			if (inferredKinds.size !== 1 || inferredKinds.has(member.memberType.kind)) continue;
			const inferredType = values[0].type;
			for (const value of values) {
				diagnostics.push({
					severity,
					range: value.range,
					message: `Form member '.${member.name}' is ${member.memberType.kind} but assignment is ${inferredType.kind}. Change the declaration or assignment.`,
					source: 'pml-form-references',
					code: 'form-member-type-mismatch'
				});
			}
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

	private isConcreteMemberType(type: PMLType): boolean {
		return type.kind !== 'ANY' && type.kind !== 'UNDEFINED' && type.kind !== 'UNION';
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

	private validateStatementReferences(
		statement: Statement,
		knownThisMembers: Set<string>,
		severity: DiagnosticSeverity,
		diagnostics: Diagnostic[]
	): void {
		switch (statement.type) {
			case 'ExpressionStatement':
				this.validateExpressionReferences(statement.expression, knownThisMembers, severity, diagnostics);
				break;
			case 'VariableDeclaration':
				if (statement.initializer) {
					this.validateExpressionReferences(statement.initializer, knownThisMembers, severity, diagnostics);
				}
				break;
			case 'IfStatement':
				this.validateExpressionReferences(statement.test, knownThisMembers, severity, diagnostics);
				statement.consequent.forEach(child => this.validateStatementReferences(child, knownThisMembers, severity, diagnostics));
				if (Array.isArray(statement.alternate)) {
					statement.alternate.forEach(child => this.validateStatementReferences(child, knownThisMembers, severity, diagnostics));
				} else if (statement.alternate) {
					this.validateStatementReferences(statement.alternate, knownThisMembers, severity, diagnostics);
				}
				break;
			case 'DoStatement':
				if (statement.collection) {
					this.validateExpressionReferences(statement.collection, knownThisMembers, severity, diagnostics);
				}
				if (statement.condition) {
					this.validateExpressionReferences(statement.condition, knownThisMembers, severity, diagnostics);
				}
				statement.body.forEach(child => this.validateStatementReferences(child, knownThisMembers, severity, diagnostics));
				break;
			case 'HandleStatement':
				statement.body.forEach(child => this.validateStatementReferences(child, knownThisMembers, severity, diagnostics));
				statement.alternate?.forEach(child => this.validateStatementReferences(child, knownThisMembers, severity, diagnostics));
				break;
			case 'ReturnStatement':
				if (statement.argument) {
					this.validateExpressionReferences(statement.argument, knownThisMembers, severity, diagnostics);
				}
				break;
			case 'BreakStatement':
			case 'ContinueStatement':
				if (statement.condition) {
					this.validateExpressionReferences(statement.condition, knownThisMembers, severity, diagnostics);
				}
				break;
		}
	}

	private validateExpressionReferences(
		expression: Expression,
		knownThisMembers: Set<string>,
		severity: DiagnosticSeverity,
		diagnostics: Diagnostic[]
	): void {
		const firstThisMember = this.firstThisMember(expression);
		if (firstThisMember && !knownThisMembers.has(firstThisMember.toLowerCase())) {
			diagnostics.push({
				severity,
				range: expression.range,
				message: `Unknown form member or gadget '!this.${firstThisMember}'. Declare it or correct the reference.`,
				source: 'pml-form-references',
				code: 'unknown-form-member'
			});
			return;
		}

		switch (expression.type) {
			case 'AssignmentExpression':
				this.validateExpressionReferences(expression.left, knownThisMembers, severity, diagnostics);
				this.validateExpressionReferences(expression.right, knownThisMembers, severity, diagnostics);
				break;
			case 'CallExpression':
				this.validateExpressionReferences(expression.callee, knownThisMembers, severity, diagnostics);
				expression.arguments.forEach(argument => this.validateExpressionReferences(argument, knownThisMembers, severity, diagnostics));
				break;
			case 'MemberExpression':
				this.validateExpressionReferences(expression.object, knownThisMembers, severity, diagnostics);
				if (expression.computed) {
					this.validateExpressionReferences(expression.property, knownThisMembers, severity, diagnostics);
				}
				break;
			case 'BinaryExpression':
				this.validateExpressionReferences(expression.left, knownThisMembers, severity, diagnostics);
				this.validateExpressionReferences(expression.right, knownThisMembers, severity, diagnostics);
				break;
			case 'UnaryExpression':
				this.validateExpressionReferences(expression.argument, knownThisMembers, severity, diagnostics);
				break;
			case 'ArrayExpression':
				expression.elements.forEach(element => this.validateExpressionReferences(element, knownThisMembers, severity, diagnostics));
				break;
		}
	}

	private firstThisMember(expression: Expression): string | undefined {
		if (expression.type !== 'MemberExpression') {
			return undefined;
		}

		if (!expression.computed && expression.property.type === 'Identifier' &&
			expression.object.type === 'Identifier' && expression.object.scope === 'local' &&
			expression.object.name.toLowerCase() === 'this' && !expression.property.name.startsWith('$')) {
			return expression.property.name;
		}

		return this.firstThisMember(expression.object);
	}
}
