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

export class ArrayIndexChecker {
	private diagnostics: Diagnostic[] = [];
	private zeroBasedExternalSymbols = new Set<string>();

	public check(program: Program, sourceText = ''): Diagnostic[] {
		this.diagnostics = [];
		this.zeroBasedExternalSymbols = this.collectZeroBasedExternalSymbols(program, sourceText);

		for (const statement of program.body) {
			this.checkStatement(statement);
		}

		return this.diagnostics;
	}

	private checkStatement(stmt: Statement): void {
		switch (stmt.type) {
			case 'ExpressionStatement':
				this.checkExpression((stmt as any).expression);
				break;

			case 'MethodDefinition': {
				const method = stmt as any;
				if (method.body) {
					for (const bodyStmt of method.body) {
						this.checkStatement(bodyStmt);
					}
				}
				break;
			}

			case 'FunctionDefinition': {
				const func = stmt as any;
				if (func.body) {
					for (const bodyStmt of func.body) {
						this.checkStatement(bodyStmt);
					}
				}
				break;
			}

			case 'ObjectDefinition': {
				const obj = stmt as any;
				// Check methods inside object
				if (obj.members) {
					for (const member of obj.members) {
						this.checkStatement(member);
					}
				}
				break;
			}

			case 'FormDefinition': {
				const form = stmt as any;
				// Check form body statements
				if (form.body) {
					for (const bodyStmt of form.body) {
						this.checkStatement(bodyStmt);
					}
				}
				break;
			}

			case 'HandleStatement': {
				const handle = stmt as any;
				// Check handler body
				if (handle.body) {
					for (const bodyStmt of handle.body) {
						this.checkStatement(bodyStmt);
					}
				}
				// Check elsehandle block (field is 'alternate' in AST)
				if (handle.alternate) {
					for (const elseStmt of handle.alternate) {
						this.checkStatement(elseStmt);
					}
				}
				break;
			}

			case 'IfStatement': {
				const ifStmt = stmt as any;
				this.checkExpression(ifStmt.test);
				for (const thenStmt of ifStmt.consequent) {
					this.checkStatement(thenStmt);
				}
				if (ifStmt.alternate) {
					// alternate can be either an IfStatement (elseif) or Statement[] (else)
					if (Array.isArray(ifStmt.alternate)) {
						for (const elseStmt of ifStmt.alternate) {
							this.checkStatement(elseStmt);
						}
					} else {
						// Handle elseif - alternate is an IfStatement
						this.checkStatement(ifStmt.alternate);
					}
				}
				break;
			}

			case 'DoStatement': {
				const doStmt = stmt as any;
				if (doStmt.collection) this.checkExpression(doStmt.collection);
				if (doStmt.condition) this.checkExpression(doStmt.condition);
				for (const bodyStmt of doStmt.body) {
					this.checkStatement(bodyStmt);
				}
				break;
			}

			case 'ReturnStatement': {
				const returnStmt = stmt as any;
				if (returnStmt.argument) {
					this.checkExpression(returnStmt.argument);
				}
				break;
			}

			case 'BreakStatement':
			case 'ContinueStatement': {
				const loopControl = stmt as any;
				if (loopControl.condition) {
					this.checkExpression(loopControl.condition);
				}
				break;
			}

			case 'VariableDeclaration': {
				const varDecl = stmt as any;
				if (varDecl.initializer) {
					this.checkExpression(varDecl.initializer);
				}
				break;
			}
		}
	}

	private checkExpression(expr: Expression): void {
		if (!expr) return;

		switch (expr.type) {
			case 'MemberExpression': {
				const member = expr as MemberExpression;
				// Check if it's array access with [0]
				if (member.computed && member.property) {
					// property is now an Expression - check if it's a Literal with value 0
					if (member.property.type === 'Literal') {
						const literal = member.property as any;
						if ((literal.value === 0 || literal.value === '0') && !this.isLikelyZeroBasedExternalAccess(member)) {
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
					this.checkExpression(member.property);
				}
				// Recursively check object
				this.checkExpression(member.object);
				break;
			}

			case 'CallExpression': {
				const call = expr as any;
				this.checkExpression(call.callee);
				for (const arg of call.arguments) {
					this.checkExpression(arg);
				}
				break;
			}

			case 'BinaryExpression': {
				const binary = expr as any;
				this.checkExpression(binary.left);
				this.checkExpression(binary.right);
				break;
			}

			case 'UnaryExpression': {
				const unary = expr as any;
				this.checkExpression(unary.argument);
				break;
			}

			case 'AssignmentExpression': {
				const assignment = expr as any;
				this.checkExpression(assignment.left);
				this.checkExpression(assignment.right);
				break;
			}

			case 'ArrayExpression': {
				const arrayExpr = expr as any;
				for (const element of arrayExpr.elements) {
					this.checkExpression(element);
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

	private isLikelyZeroBasedExternalAccess(member: MemberExpression): boolean {
		return this.isLikelyZeroBasedExternalExpression(member.object);
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
}
