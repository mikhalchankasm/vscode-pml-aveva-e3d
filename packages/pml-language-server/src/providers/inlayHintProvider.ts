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

type TypeEnvironment = {
	local: Map<string, PMLType>;
	global: Map<string, PMLType>;
};

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
		const environment: TypeEnvironment = { local: new Map(), global: new Map() };
		this.visitStatements(
			program.body,
			document.uri,
			requestedRange,
			options,
			hints,
			lines,
			new Set<string>(),
			globalSeen,
			environment
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
		globalSeen: Set<string>,
		environment: TypeEnvironment
	): void {
		for (const statement of statements) {
			switch (statement.type) {
				case 'MethodDefinition':
				case 'FunctionDefinition':
					this.visitCallable(statement, uri, requestedRange, options, hints, lines, globalSeen, environment.global);
					break;
				case 'ObjectDefinition':
					for (const method of statement.members) {
						this.visitCallable(method, uri, requestedRange, options, hints, lines, globalSeen, environment.global);
					}
					break;
				case 'FormDefinition':
					this.visitStatements(statement.body, uri, requestedRange, options, hints, lines, localSeen, globalSeen, environment);
					break;
				case 'VariableDeclaration':
					this.addVariableHint(statement, uri, requestedRange, options, hints, lines, localSeen, globalSeen, environment);
					if (statement.initializer) {
						this.visitExpression(statement.initializer, uri, requestedRange, options, hints);
					}
					break;
				case 'ExpressionStatement':
					this.visitExpression(statement.expression, uri, requestedRange, options, hints);
					break;
				case 'IfStatement':
					this.visitExpression(statement.test, uri, requestedRange, options, hints);
					this.visitStatements(statement.consequent, uri, requestedRange, options, hints, lines, localSeen, globalSeen, this.cloneEnvironment(environment));
					if (Array.isArray(statement.alternate)) {
						this.visitStatements(statement.alternate, uri, requestedRange, options, hints, lines, localSeen, globalSeen, this.cloneEnvironment(environment));
					} else if (statement.alternate) {
						this.visitStatements([statement.alternate], uri, requestedRange, options, hints, lines, localSeen, globalSeen, this.cloneEnvironment(environment));
					}
					break;
				case 'DoStatement':
					for (const expression of [statement.collection, statement.from, statement.to, statement.by, statement.condition]) {
						if (expression) this.visitExpression(expression, uri, requestedRange, options, hints);
					}
					this.visitStatements(statement.body, uri, requestedRange, options, hints, lines, localSeen, globalSeen, this.cloneEnvironment(environment));
					break;
				case 'HandleStatement':
					this.visitStatements(statement.body, uri, requestedRange, options, hints, lines, localSeen, globalSeen, this.cloneEnvironment(environment));
					if (statement.alternate) {
						this.visitStatements(statement.alternate, uri, requestedRange, options, hints, lines, localSeen, globalSeen, this.cloneEnvironment(environment));
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
		globalSeen: Set<string>,
		knownGlobals: Map<string, PMLType>
	): void {
		const localSeen = new Set(callable.parameters.map(parameter => parameter.name.toLowerCase()));
		const local = new Map<string, PMLType>();
		for (const parameter of callable.parameters) {
			if (parameter.paramType && this.isReliableType(parameter.paramType)) {
				local.set(parameter.name.toLowerCase(), parameter.paramType);
			}
		}
		this.visitStatements(callable.body, uri, requestedRange, options, hints, lines, localSeen, globalSeen, {
			local,
			global: new Map(knownGlobals)
		});
	}

	private addVariableHint(
		declaration: VariableDeclaration,
		uri: string,
		requestedRange: Range,
		options: InlayHintOptions,
		hints: InlayHint[],
		lines: string[],
		localSeen: Set<string>,
		globalSeen: Set<string>,
		environment: TypeEnvironment
	): void {
		const seen = declaration.scope === 'global' ? globalSeen : localSeen;
		const types = declaration.scope === 'global' ? environment.global : environment.local;
		const key = declaration.name.toLowerCase();
		if (!declaration.initializer) {
			return;
		}

		const inferredType = this.inferExpressionType(declaration.initializer, uri, environment);
		if (inferredType && this.isReliableType(inferredType)) {
			types.set(key, inferredType);
		} else {
			types.delete(key);
		}
		if (!options.variableTypes || seen.has(key)) {
			return;
		}
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

	private inferExpressionType(expression: Expression, uri: string, environment: TypeEnvironment): PMLType | undefined {
		switch (expression.type) {
			case 'Literal':
				return expression.pmlType;
			case 'Identifier':
				return expression.scope === 'global'
					? environment.global.get(expression.name.toLowerCase())
					: environment.local.get(expression.name.toLowerCase());
			case 'ArrayExpression': {
				const elementTypes = expression.elements
					.map(element => this.inferExpressionType(element, uri, environment))
					.filter((type): type is PMLType => Boolean(type));
				const first = elementTypes[0];
				const elementType = first && elementTypes.every(type => typeToString(type) === typeToString(first))
					? first
					: { kind: 'ANY' } as PMLType;
				return { kind: 'ARRAY', elementType };
			}
			case 'CallExpression': {
				const constructorName = this.getConstructorName(expression.callee);
				return constructorName
					? this.constructorType(constructorName)
					: this.resolveReturnType(expression.callee, uri);
			}
			case 'UnaryExpression':
				if (expression.operator.toLowerCase() === 'not') return { kind: 'BOOLEAN' };
				return this.inferExpressionType(expression.argument, uri, environment);
			case 'BinaryExpression':
				return this.inferBinaryType(expression, uri, environment);
			default:
				return undefined;
		}
	}

	private inferBinaryType(expression: BinaryExpression, uri: string, environment: TypeEnvironment): PMLType | undefined {
		const operator = expression.operator.toLowerCase();
		if (['eq', 'ne', 'neq', 'gt', 'ge', 'geq', 'lt', 'le', 'leq', 'and', 'or', '==', '!=', '<>', '>', '>=', '<', '<='].includes(operator)) {
			return { kind: 'BOOLEAN' };
		}
		if (!['+', '-', '*', '/'].includes(operator)) {
			return undefined;
		}
		const left = this.inferExpressionType(expression.left, uri, environment);
		const right = this.inferExpressionType(expression.right, uri, environment);
		if (left && right && ['REAL', 'INTEGER'].includes(left.kind) && ['REAL', 'INTEGER'].includes(right.kind)) {
			return { kind: left.kind === 'REAL' || right.kind === 'REAL' ? 'REAL' : 'INTEGER' };
		}
		return undefined;
	}

	private resolveReturnType(callee: Expression, uri: string): PMLType | undefined {
		if (callee.type === 'Identifier') {
			if (callee.scope === 'global') {
				const functions = this.symbolIndex.findFunction(callee.name);
				return functions.length === 1 ? this.reliableType(functions[0].returnType) : undefined;
			}
			if (callee.scope === 'method') {
				const methods = this.symbolIndex.findMethodsInFile(uri, callee.name);
				return methods.length === 1 ? this.reliableType(methods[0].returnType) : undefined;
			}
		}
		if (
			callee.type === 'MemberExpression' &&
			!callee.computed &&
			callee.object.type === 'Identifier' &&
			callee.object.name.toLowerCase() === 'this' &&
			callee.property.type === 'Identifier'
		) {
			const methods = this.symbolIndex.findMethodsInFile(uri, callee.property.name);
			return methods.length === 1 ? this.reliableType(methods[0].returnType) : undefined;
		}
		return undefined;
	}

	private reliableType(type: PMLType | undefined): PMLType | undefined {
		return type && this.isReliableType(type) ? type : undefined;
	}

	private isReliableType(type: PMLType): boolean {
		return type.kind !== 'ANY' && type.kind !== 'UNDEFINED' && type.kind !== 'UNION';
	}

	private cloneEnvironment(environment: TypeEnvironment): TypeEnvironment {
		return { local: new Map(environment.local), global: new Map(environment.global) };
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
