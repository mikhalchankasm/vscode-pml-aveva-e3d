/**
 * Array Index Checker - Detects arr[0] errors (PML arrays are 1-indexed)
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { Program, Statement, Expression, MemberExpression } from '../ast/nodes';

// These patterns intentionally prefer fewer false positives for known zero-based .NET/PMLNET collections.
const EXTERNAL_TYPE_PATTERN = /(?:^net|net|pmlnet|csharp|dotnet|\.net|system\.|microsoft\.|control|grid|datatable|dataset|datarow|datacolumn)/i;
const EXTERNAL_NAME_PATTERN = /^(?:(?:net|dotnet|csharp|clr)(?:[A-Z_]|$)|.*(?:Grid|Control|Controls|DataTable|DataSet|DataRow|DataColumn|NetArray|DotNetArray|CSharpArray)$)/;
const EXTERNAL_COLLECTION_MEMBER_PATTERN = /^(?:GetRows|GetSelectedRows|GetColumns|GetItems|GetSelectedItems|Rows|Columns|Items|Controls|SelectedRows|SelectedItems|Children|Keys|Values|ToArray|Get.*Array)$/i;
const MEMBER_DECLARATION_PATTERN = /\bmember\s+\.([A-Za-z_][\w$]*)\s+is\s+([A-Za-z_][\w$.]*)/gi;
const PMLNET_GADGET_PATTERN = /\b[A-Za-z_][\w$]*\s+\.([A-Za-z_][\w$]*)\b[^\r\n]*(?:PMLNETCONTROL|\bNET[A-Za-z_]*CONTROL\b)/gi;
const EXTERNAL_ASSIGNMENT_PATTERN = /!([A-Za-z_][\w$]*)\s*=\s*(?:object\s+)?(?:!!)?([A-Za-z_][\w$.]*?(?:NET|DotNet|CSharp|Control|Grid|DataTable|DataSet)[A-Za-z_\w$.]*)\s*\(/gi;
const UI_CALLBACK_METHOD_PATTERN = /(?:^on[A-Za-z0-9_]*(?:callback|click|popup)|(?:callback|rightclick|leftclick|doubleclick|popup)(?:$|[A-Z_]))/i;
const UI_CALLBACK_PAYLOAD_PARAMETER_PATTERN = /^(?:data|event|args|arguments|callbackdata)$/i;

type ArrayIndexCheckContext = {
	zeroBasedCallbackPayloads: Set<string>;
};

export class ArrayIndexChecker {
	private diagnostics: Diagnostic[] = [];
	private zeroBasedExternalSymbols = new Set<string>();

	public check(program: Program, sourceText = ''): Diagnostic[] {
		this.diagnostics = [];
		this.zeroBasedExternalSymbols = this.collectZeroBasedExternalSymbols(program, sourceText);
		const rootContext: ArrayIndexCheckContext = { zeroBasedCallbackPayloads: new Set() };

		for (const statement of program.body) {
			this.checkStatement(statement, rootContext);
		}

		return this.diagnostics;
	}

	private checkStatement(stmt: Statement, context: ArrayIndexCheckContext): void {
		switch (stmt.type) {
			case 'ExpressionStatement':
				this.checkExpression((stmt as any).expression, context);
				break;

			case 'MethodDefinition': {
				const method = stmt as any;
				const methodContext = this.createMethodContext(method, context);
				if (method.body) {
					for (const bodyStmt of method.body) {
						this.checkStatement(bodyStmt, methodContext);
					}
				}
				break;
			}

			case 'FunctionDefinition': {
				const func = stmt as any;
				const functionContext = this.createMethodContext(func, context);
				if (func.body) {
					for (const bodyStmt of func.body) {
						this.checkStatement(bodyStmt, functionContext);
					}
				}
				break;
			}

			case 'ObjectDefinition': {
				const obj = stmt as any;
				// Check methods inside object
				if (obj.members) {
					for (const member of obj.members) {
						this.checkStatement(member, context);
					}
				}
				break;
			}

			case 'FormDefinition': {
				const form = stmt as any;
				// Check form body statements
				if (form.body) {
					for (const bodyStmt of form.body) {
						this.checkStatement(bodyStmt, context);
					}
				}
				break;
			}

			case 'HandleStatement': {
				const handle = stmt as any;
				// Check handler body
				if (handle.body) {
					for (const bodyStmt of handle.body) {
						this.checkStatement(bodyStmt, context);
					}
				}
				// Check elsehandle block (field is 'alternate' in AST)
				if (handle.alternate) {
					for (const elseStmt of handle.alternate) {
						this.checkStatement(elseStmt, context);
					}
				}
				break;
			}

			case 'IfStatement': {
				const ifStmt = stmt as any;
				this.checkExpression(ifStmt.test, context);
				for (const thenStmt of ifStmt.consequent) {
					this.checkStatement(thenStmt, context);
				}
				if (ifStmt.alternate) {
					// alternate can be either an IfStatement (elseif) or Statement[] (else)
					if (Array.isArray(ifStmt.alternate)) {
						for (const elseStmt of ifStmt.alternate) {
							this.checkStatement(elseStmt, context);
						}
					} else {
						// Handle elseif - alternate is an IfStatement
						this.checkStatement(ifStmt.alternate, context);
					}
				}
				break;
			}

			case 'DoStatement': {
				const doStmt = stmt as any;
				if (doStmt.collection) this.checkExpression(doStmt.collection, context);
				if (doStmt.condition) this.checkExpression(doStmt.condition, context);
				for (const bodyStmt of doStmt.body) {
					this.checkStatement(bodyStmt, context);
				}
				break;
			}

			case 'ReturnStatement': {
				const returnStmt = stmt as any;
				if (returnStmt.argument) {
					this.checkExpression(returnStmt.argument, context);
				}
				break;
			}

			case 'BreakStatement':
			case 'ContinueStatement': {
				const loopControl = stmt as any;
				if (loopControl.condition) {
					this.checkExpression(loopControl.condition, context);
				}
				break;
			}

			case 'VariableDeclaration': {
				const varDecl = stmt as any;
				if (varDecl.initializer) {
					this.checkExpression(varDecl.initializer, context);
				}
				break;
			}
		}
	}

	private checkExpression(expr: Expression, context: ArrayIndexCheckContext): void {
		if (!expr) return;

		switch (expr.type) {
			case 'MemberExpression': {
				const member = expr as MemberExpression;
				// Check if it's array access with [0]
				if (member.computed && member.property) {
					// property is now an Expression - check if it's a Literal with value 0
					if (member.property.type === 'Literal') {
						const literal = member.property as any;
						if ((literal.value === 0 || literal.value === '0') && !this.isLikelyZeroBasedExternalAccess(member, context)) {
							this.diagnostics.push({
								range: member.property.range,
								message: 'Array indices in PML start at 1, not 0. Accessing [0] will cause a runtime error.',
								severity: DiagnosticSeverity.Error,
								source: 'pml-array-index',
								code: 'array-index-zero'
							});
						}
					}
					// Recursively check the index expression
					this.checkExpression(member.property, context);
				}
				// Recursively check object
				this.checkExpression(member.object, context);
				break;
			}

			case 'CallExpression': {
				const call = expr as any;
				this.checkExpression(call.callee, context);
				for (const arg of call.arguments) {
					this.checkExpression(arg, context);
				}
				break;
			}

			case 'BinaryExpression': {
				const binary = expr as any;
				this.checkExpression(binary.left, context);
				this.checkExpression(binary.right, context);
				break;
			}

			case 'UnaryExpression': {
				const unary = expr as any;
				this.checkExpression(unary.argument, context);
				break;
			}

			case 'AssignmentExpression': {
				const assignment = expr as any;
				this.checkExpression(assignment.left, context);
				this.checkExpression(assignment.right, context);
				break;
			}

			case 'ArrayExpression': {
				const arrayExpr = expr as any;
				for (const element of arrayExpr.elements) {
					this.checkExpression(element, context);
				}
				break;
			}
		}
	}

	private collectZeroBasedExternalSymbols(program: Program, sourceText: string): Set<string> {
		const symbols = new Set<string>();

		this.collectZeroBasedExternalSymbolsFromStatements(program.body, symbols);
		for (const match of sourceText.matchAll(MEMBER_DECLARATION_PATTERN)) {
			if (EXTERNAL_TYPE_PATTERN.test(match[2])) {
				symbols.add(match[1].toLowerCase());
			}
		}
		for (const match of sourceText.matchAll(PMLNET_GADGET_PATTERN)) {
			symbols.add(match[1].toLowerCase());
		}
		for (const match of sourceText.matchAll(EXTERNAL_ASSIGNMENT_PATTERN)) {
			symbols.add(match[1].toLowerCase());
		}

		return symbols;
	}

	private collectZeroBasedExternalSymbolsFromStatements(statements: Statement[], symbols: Set<string>): void {
		for (const statement of statements) {
			switch (statement.type) {
				case 'FormDefinition': {
					const form = statement as any;
					for (const bodyStatement of form.body ?? []) {
						this.collectZeroBasedExternalSymbolsFromStatements([bodyStatement], symbols);
					}
					break;
				}

				case 'GadgetDeclaration': {
					const gadget = statement as any;
					if (String(gadget.properties?.controlType ?? '').toUpperCase() === 'PMLNETCONTROL') {
						symbols.add(String(gadget.name).toLowerCase());
					}
					break;
				}
			}
		}
	}

	private createMethodContext(method: any, parentContext: ArrayIndexCheckContext): ArrayIndexCheckContext {
		const zeroBasedCallbackPayloads = new Set(parentContext.zeroBasedCallbackPayloads);
		if (!UI_CALLBACK_METHOD_PATTERN.test(String(method.name ?? ''))) {
			return { zeroBasedCallbackPayloads };
		}

		for (const parameter of method.parameters ?? []) {
			if (
				UI_CALLBACK_PAYLOAD_PARAMETER_PATTERN.test(String(parameter.name ?? '')) &&
				String(parameter.paramType?.kind ?? '').toUpperCase() === 'ARRAY'
			) {
				zeroBasedCallbackPayloads.add(String(parameter.name).toLowerCase());
			}
		}

		return { zeroBasedCallbackPayloads };
	}

	private isLikelyZeroBasedExternalAccess(member: MemberExpression, context: ArrayIndexCheckContext): boolean {
		return this.isZeroBasedCallbackPayloadAccess(member.object, context) ||
			this.isLikelyZeroBasedExternalExpression(member.object);
	}

	private isLikelyZeroBasedExternalExpression(expr: Expression | undefined): boolean {
		if (!expr) {
			return false;
		}

		switch (expr.type) {
			case 'Identifier': {
				const name = (expr as any).name;
				return this.isZeroBasedExternalName(name);
			}

			case 'CallExpression': {
				const call = expr as any;
				const names = this.getExpressionNames(call.callee);
				return this.hasZeroBasedExternalName(names) ||
					(this.hasExternalOwnerName(names) && this.hasExternalCollectionMemberName(names));
			}

			case 'MemberExpression': {
				const member = expr as MemberExpression;
				const names = this.getExpressionNames(member);
				return this.hasZeroBasedExternalName(names) ||
					this.hasExternalOwnerName(names) ||
					(!member.computed && this.hasExternalCollectionMemberName(names) && this.isLikelyZeroBasedExternalExpression(member.object));
			}

			default:
				return false;
		}
	}

	private getExpressionNames(expr: Expression | undefined): string[] {
		if (!expr) {
			return [];
		}

		switch (expr.type) {
			case 'Identifier':
				return [(expr as any).name].filter(Boolean);

			case 'MemberExpression': {
				const member = expr as MemberExpression;
				return [
					...this.getExpressionNames(member.object),
					...this.getExpressionNames(member.property)
				];
			}

			case 'CallExpression':
				return this.getExpressionNames((expr as any).callee);

			default:
				return [];
		}
	}

	private hasZeroBasedExternalName(names: string[]): boolean {
		return names.some(name => this.isZeroBasedExternalName(name));
	}

	private isZeroBasedExternalName(name: string | undefined): boolean {
		return !!name && (
			this.zeroBasedExternalSymbols.has(name.toLowerCase()) ||
			EXTERNAL_NAME_PATTERN.test(name)
		);
	}

	private hasExternalOwnerName(names: string[]): boolean {
		return names.some(name => this.isZeroBasedExternalName(name));
	}

	private hasExternalCollectionMemberName(names: string[]): boolean {
		return names.some(name => EXTERNAL_COLLECTION_MEMBER_PATTERN.test(name));
	}

	private isZeroBasedCallbackPayloadAccess(expr: Expression | undefined, context: ArrayIndexCheckContext): boolean {
		return expr?.type === 'Identifier' &&
			context.zeroBasedCallbackPayloads.has(String((expr as any).name ?? '').toLowerCase());
	}
}
