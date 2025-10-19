/**
 * Array Index Checker - Detects arr[0] errors (PML arrays are 1-indexed)
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { Program, Statement, Expression, MemberExpression, Literal } from '../ast/nodes';

export class ArrayIndexChecker {
	private diagnostics: Diagnostic[] = [];

	public check(program: Program): Diagnostic[] {
		this.diagnostics = [];

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

			case 'MethodDefinition':
				const method = stmt as any;
				for (const bodyStmt of method.body) {
					this.checkStatement(bodyStmt);
				}
				break;

			case 'IfStatement':
				const ifStmt = stmt as any;
				this.checkExpression(ifStmt.test);
				for (const thenStmt of ifStmt.consequent) {
					this.checkStatement(thenStmt);
				}
				if (ifStmt.alternate) {
					for (const elseStmt of ifStmt.alternate) {
						this.checkStatement(elseStmt);
					}
				}
				break;

			case 'DoStatement':
				const doStmt = stmt as any;
				if (doStmt.collection) this.checkExpression(doStmt.collection);
				if (doStmt.condition) this.checkExpression(doStmt.condition);
				for (const bodyStmt of doStmt.body) {
					this.checkStatement(bodyStmt);
				}
				break;

			case 'ReturnStatement':
				const returnStmt = stmt as any;
				if (returnStmt.argument) {
					this.checkExpression(returnStmt.argument);
				}
				break;

			case 'VariableDeclaration':
				const varDecl = stmt as any;
				if (varDecl.init) {
					this.checkExpression(varDecl.init);
				}
				break;
		}
	}

	private checkExpression(expr: Expression): void {
		if (!expr) return;

		switch (expr.type) {
			case 'MemberExpression':
				const member = expr as MemberExpression;
				// Check if it's array access with [0]
				if (member.computed) {
					// In computed mode: property is an Identifier containing the index
					// For !arr[0], property.name will be "0"
					const indexValue = member.property.name;
					if (indexValue === '0') {
						this.diagnostics.push({
							range: expr.range,
							message: 'Array indices in PML start at 1, not 0. Accessing [0] will cause a runtime error.',
							severity: DiagnosticSeverity.Error,
							source: 'pml-array-index',
							code: 'array-index-zero'
						});
					}
				}
				// Recursively check object
				this.checkExpression(member.object);
				break;

			case 'CallExpression':
				const call = expr as any;
				this.checkExpression(call.callee);
				for (const arg of call.arguments) {
					this.checkExpression(arg);
				}
				break;

			case 'BinaryExpression':
				const binary = expr as any;
				this.checkExpression(binary.left);
				this.checkExpression(binary.right);
				break;

			case 'UnaryExpression':
				const unary = expr as any;
				this.checkExpression(unary.argument);
				break;

			case 'AssignmentExpression':
				const assignment = expr as any;
				this.checkExpression(assignment.left);
				this.checkExpression(assignment.right);
				break;

			case 'ArrayExpression':
				const arrayExpr = expr as any;
				for (const element of arrayExpr.elements) {
					this.checkExpression(element);
				}
				break;
		}
	}
}
