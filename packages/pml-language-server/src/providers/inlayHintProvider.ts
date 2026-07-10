import {
	InlayHint,
	InlayHintKind,
	Position,
	Range
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
	BinaryExpression,
	CallExpression,
	Expression,
	FunctionDefinition,
	MethodDefinition,
	PMLType,
	Program,
	Statement,
	VariableDeclaration,
	typeToString
} from '../ast/nodes';
import { SymbolIndex } from '../index/symbolIndex';
import { Parser, parserModeFromUri } from '../parser/parser';

export interface InlayHintOptions {
	variableTypes: boolean;
	parameterNames: boolean;
}

export class InlayHintProvider {
	constructor(private readonly symbolIndex: SymbolIndex) {}

	public provide(document: TextDocument, requestedRange: Range, options: InlayHintOptions, ast?: Program): InlayHint[] {
		if (!options.variableTypes && !options.parameterNames) {
			return [];
		}

		const program = ast ?? new Parser().parse(document.getText(), { mode: parserModeFromUri(document.uri) }).ast;
		const hints: InlayHint[] = [];
		const lines = document.getText().split(/\r?\n/);
		const globalSeen = new Set<string>();
		this.visitStatements(
			program.body,
			document.uri,
			requestedRange,
			options,
			hints,
			lines,
			new Set<string>(),
			globalSeen
		);
		return hints.sort((left, right) => this.comparePositions(left.position, right.position));
	}

	private visitStatements(
		statements: Statement[],
		uri: string,
		requestedRange: Range,
		options: InlayHintOptions,
		hints: InlayHint[],
		lines: string[],
		localSeen: Set<string>,
		globalSeen: Set<string>
	): void {
		for (const statement of statements) {
			switch (statement.type) {
				case 'MethodDefinition':
				case 'FunctionDefinition':
					this.visitCallable(statement, uri, requestedRange, options, hints, lines, globalSeen);
					break;
				case 'ObjectDefinition':
					for (const method of statement.members) {
						this.visitCallable(method, uri, requestedRange, options, hints, lines, globalSeen);
					}
					break;
				case 'FormDefinition':
					this.visitStatements(statement.body, uri, requestedRange, options, hints, lines, localSeen, globalSeen);
					break;
				case 'VariableDeclaration':
					this.addVariableHint(statement, requestedRange, options, hints, lines, localSeen, globalSeen);
					if (statement.initializer) {
						this.visitExpression(statement.initializer, uri, requestedRange, options, hints);
					}
					break;
				case 'ExpressionStatement':
					this.visitExpression(statement.expression, uri, requestedRange, options, hints);
					break;
				case 'IfStatement':
					this.visitExpression(statement.test, uri, requestedRange, options, hints);
					this.visitStatements(statement.consequent, uri, requestedRange, options, hints, lines, localSeen, globalSeen);
					if (Array.isArray(statement.alternate)) {
						this.visitStatements(statement.alternate, uri, requestedRange, options, hints, lines, localSeen, globalSeen);
					} else if (statement.alternate) {
						this.visitStatements([statement.alternate], uri, requestedRange, options, hints, lines, localSeen, globalSeen);
					}
					break;
				case 'DoStatement':
					for (const expression of [statement.collection, statement.from, statement.to, statement.by, statement.condition]) {
						if (expression) this.visitExpression(expression, uri, requestedRange, options, hints);
					}
					this.visitStatements(statement.body, uri, requestedRange, options, hints, lines, localSeen, globalSeen);
					break;
				case 'HandleStatement':
					this.visitStatements(statement.body, uri, requestedRange, options, hints, lines, localSeen, globalSeen);
					if (statement.alternate) {
						this.visitStatements(statement.alternate, uri, requestedRange, options, hints, lines, localSeen, globalSeen);
					}
					break;
				case 'ReturnStatement':
					if (statement.argument) this.visitExpression(statement.argument, uri, requestedRange, options, hints);
					break;
				case 'BreakStatement':
				case 'ContinueStatement':
					if (statement.condition) this.visitExpression(statement.condition, uri, requestedRange, options, hints);
					break;
			}
		}
	}

	private visitCallable(
		callable: MethodDefinition | FunctionDefinition,
		uri: string,
		requestedRange: Range,
		options: InlayHintOptions,
		hints: InlayHint[],
		lines: string[],
		globalSeen: Set<string>
	): void {
		const localSeen = new Set(callable.parameters.map(parameter => parameter.name.toLowerCase()));
		this.visitStatements(callable.body, uri, requestedRange, options, hints, lines, localSeen, globalSeen);
	}

	private addVariableHint(
		declaration: VariableDeclaration,
		requestedRange: Range,
		options: InlayHintOptions,
		hints: InlayHint[],
		lines: string[],
		localSeen: Set<string>,
		globalSeen: Set<string>
	): void {
		const seen = declaration.scope === 'global' ? globalSeen : localSeen;
		const key = declaration.name.toLowerCase();
		if (!options.variableTypes || seen.has(key) || !declaration.initializer) {
			return;
		}

		const inferredType = this.inferExpressionType(declaration.initializer);
		const position = this.getVariableNameEnd(declaration, lines);
		if (!inferredType) {
			return;
		}
		seen.add(key);
		if (!position || !this.rangeContainsPosition(requestedRange, position)) {
			return;
		}

		hints.push({
			position,
			label: `: ${this.formatType(inferredType)}`,
			kind: InlayHintKind.Type,
			tooltip: 'Type inferred from the first assignment in this scope.'
		});
	}

	private visitExpression(
		expression: Expression,
		uri: string,
		requestedRange: Range,
		options: InlayHintOptions,
		hints: InlayHint[]
	): void {
		switch (expression.type) {
			case 'CallExpression':
				this.addParameterHints(expression, uri, requestedRange, options, hints);
				this.visitExpression(expression.callee, uri, requestedRange, options, hints);
				for (const argument of expression.arguments) {
					this.visitExpression(argument, uri, requestedRange, options, hints);
				}
				break;
			case 'MemberExpression':
				this.visitExpression(expression.object, uri, requestedRange, options, hints);
				this.visitExpression(expression.property, uri, requestedRange, options, hints);
				break;
			case 'BinaryExpression':
				this.visitExpression(expression.left, uri, requestedRange, options, hints);
				this.visitExpression(expression.right, uri, requestedRange, options, hints);
				break;
			case 'UnaryExpression':
				this.visitExpression(expression.argument, uri, requestedRange, options, hints);
				break;
			case 'ArrayExpression':
				for (const element of expression.elements) {
					this.visitExpression(element, uri, requestedRange, options, hints);
				}
				break;
			case 'AssignmentExpression':
				this.visitExpression(expression.left, uri, requestedRange, options, hints);
				this.visitExpression(expression.right, uri, requestedRange, options, hints);
				break;
		}
	}

	private addParameterHints(
		call: CallExpression,
		uri: string,
		requestedRange: Range,
		options: InlayHintOptions,
		hints: InlayHint[]
	): void {
		if (!options.parameterNames || call.arguments.length === 0) {
			return;
		}
		const parameters = this.resolveParameters(call.callee, uri);
		if (!parameters) {
			return;
		}

		for (let index = 0; index < Math.min(parameters.length, call.arguments.length); index++) {
			const parameter = parameters[index];
			const argument = call.arguments[index];
			if (!parameter || this.argumentMatchesParameter(argument, parameter)) {
				continue;
			}
			if (!this.rangeContainsPosition(requestedRange, argument.range.start)) {
				continue;
			}
			hints.push({
				position: argument.range.start,
				label: `!${parameter}:`,
				kind: InlayHintKind.Parameter,
				paddingRight: true
			});
		}
	}

	private resolveParameters(callee: Expression, uri: string): string[] | undefined {
		if (callee.type === 'Identifier') {
			if (callee.objectConstructor) {
				return undefined;
			}
			if (callee.scope === 'global') {
				const functions = this.symbolIndex.findFunction(callee.name);
				return functions.length === 1 ? functions[0].parameters : undefined;
			}
			if (callee.scope === 'method') {
				const methods = this.symbolIndex.findMethodsInFile(uri, callee.name);
				return methods.length === 1 ? methods[0].parameters : undefined;
			}
			return undefined;
		}
		if (
			callee.type === 'MemberExpression' &&
			!callee.computed &&
			callee.property.type === 'Identifier' &&
			callee.object.type === 'Identifier' &&
			callee.object.name.toLowerCase() === 'this'
		) {
			const methods = this.symbolIndex.findMethodsInFile(uri, callee.property.name);
			return methods.length === 1 ? methods[0].parameters : undefined;
		}
		return undefined;
	}

	private inferExpressionType(expression: Expression): PMLType | undefined {
		switch (expression.type) {
			case 'Literal':
				return expression.pmlType;
			case 'ArrayExpression': {
				const elementTypes = expression.elements
					.map(element => this.inferExpressionType(element))
					.filter((type): type is PMLType => Boolean(type));
				const first = elementTypes[0];
				const elementType = first && elementTypes.every(type => typeToString(type) === typeToString(first))
					? first
					: { kind: 'ANY' } as PMLType;
				return { kind: 'ARRAY', elementType };
			}
			case 'CallExpression': {
				const constructorName = this.getConstructorName(expression.callee);
				return constructorName ? this.constructorType(constructorName) : undefined;
			}
			case 'UnaryExpression':
				if (expression.operator.toLowerCase() === 'not') return { kind: 'BOOLEAN' };
				return this.inferExpressionType(expression.argument);
			case 'BinaryExpression':
				return this.inferBinaryType(expression);
			default:
				return undefined;
		}
	}

	private inferBinaryType(expression: BinaryExpression): PMLType | undefined {
		const operator = expression.operator.toLowerCase();
		if (['eq', 'ne', 'neq', 'gt', 'ge', 'geq', 'lt', 'le', 'leq', 'and', 'or', '==', '!=', '<>', '>', '>=', '<', '<='].includes(operator)) {
			return { kind: 'BOOLEAN' };
		}
		if (!['+', '-', '*', '/'].includes(operator)) {
			return undefined;
		}
		const left = this.inferExpressionType(expression.left);
		const right = this.inferExpressionType(expression.right);
		if (left && right && ['REAL', 'INTEGER'].includes(left.kind) && ['REAL', 'INTEGER'].includes(right.kind)) {
			return { kind: left.kind === 'REAL' || right.kind === 'REAL' ? 'REAL' : 'INTEGER' };
		}
		return undefined;
	}

	private getConstructorName(callee: Expression): string | undefined {
		return callee.type === 'Identifier' && (callee.objectConstructor || !callee.scope)
			? callee.name.toUpperCase()
			: undefined;
	}

	private constructorType(name: string): PMLType | undefined {
		switch (name) {
			case 'STRING': return { kind: 'STRING' };
			case 'REAL': return { kind: 'REAL' };
			case 'INTEGER': return { kind: 'INTEGER' };
			case 'BOOLEAN': return { kind: 'BOOLEAN' };
			case 'DBREF': return { kind: 'DBREF' };
			case 'ARRAY': return { kind: 'ARRAY', elementType: { kind: 'ANY' } };
			default: return undefined;
		}
	}

	private formatType(type: PMLType): string {
		return type.kind === 'ARRAY' && type.elementType.kind === 'ANY' ? 'ARRAY' : typeToString(type);
	}

	private getVariableNameEnd(declaration: VariableDeclaration, lines: string[]): Position | undefined {
		const line = lines[declaration.range.start.line];
		if (!line) return undefined;
		const marker = `${declaration.scope === 'global' ? '!!' : '!'}${declaration.name}`;
		const start = declaration.range.start.character;
		const candidate = line.slice(start, start + marker.length);
		const nextCharacter = line[start + marker.length] ?? '';
		return candidate.toLowerCase() === marker.toLowerCase() && !/[A-Za-z0-9_]/.test(nextCharacter)
			? Position.create(declaration.range.start.line, start + marker.length)
			: undefined;
	}

	private argumentMatchesParameter(argument: Expression, parameter: string): boolean {
		return argument.type === 'Identifier' && argument.name.toLowerCase() === parameter.toLowerCase();
	}

	private rangeContainsPosition(range: Range, position: Position): boolean {
		return this.comparePositions(range.start, position) <= 0 && this.comparePositions(position, range.end) <= 0;
	}

	private comparePositions(left: Position, right: Position): number {
		return left.line === right.line ? left.character - right.character : left.line - right.line;
	}
}
