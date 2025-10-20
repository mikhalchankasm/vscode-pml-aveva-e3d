/**
 * Type Inference Engine - Infers types of variables and expressions
 *
 * Features:
 * - Variable type inference from assignments
 * - Method return type inference
 * - Expression type analysis
 */

import {
	Program,
	Statement,
	Expression,
	MethodDefinition,
	PMLType,
	VariableDeclaration,
	AssignmentStatement,
	Identifier,
	CallExpression
} from '../ast/nodes';
import { createAnyType, createStringType, createRealType, createArrayType, createBooleanType } from '../ast/nodes';

/**
 * Type context for a scope
 */
export interface TypeContext {
	variables: Map<string, PMLType>;
	parent?: TypeContext;
}

/**
 * Type inference result
 */
export interface InferenceResult {
	type: PMLType;
	confidence: 'certain' | 'likely' | 'guess';
	reason?: string;
}

/**
 * Type Inference Engine
 */
export class TypeInferenceEngine {
	private globalContext: TypeContext;
	private currentContext: TypeContext;
	private builtInMethods: Map<string, Map<string, PMLType>>;
	private globalFunctions: Map<string, PMLType>;

	constructor() {
		this.globalContext = { variables: new Map() };
		this.currentContext = this.globalContext;
		this.builtInMethods = new Map();
		this.globalFunctions = new Map();

		this.initializeBuiltInTypes();
	}

	/**
	 * Initialize built-in method return types
	 */
	private initializeBuiltInTypes(): void {
		// STRING methods
		const stringMethods = new Map<string, PMLType>();
		stringMethods.set('upcase', createStringType());
		stringMethods.set('lowcase', createStringType());
		stringMethods.set('trim', createStringType());
		stringMethods.set('length', createRealType());
		stringMethods.set('substring', createStringType());
		stringMethods.set('real', createRealType());
		stringMethods.set('empty', createBooleanType());
		stringMethods.set('eqnocase', createBooleanType());
		stringMethods.set('match', createRealType());
		stringMethods.set('replace', createStringType());
		stringMethods.set('split', createArrayType(createStringType()));
		this.builtInMethods.set('STRING', stringMethods);

		// REAL methods
		const realMethods = new Map<string, PMLType>();
		realMethods.set('abs', createRealType());
		realMethods.set('round', createRealType());
		realMethods.set('floor', createRealType());
		realMethods.set('ceiling', createRealType());
		realMethods.set('string', createStringType());
		realMethods.set('sin', createRealType());
		realMethods.set('cos', createRealType());
		realMethods.set('sqrt', createRealType());
		this.builtInMethods.set('REAL', realMethods);

		// ARRAY methods
		const arrayMethods = new Map<string, PMLType>();
		arrayMethods.set('size', createRealType());
		arrayMethods.set('append', { kind: 'VOID' });
		arrayMethods.set('first', createAnyType());
		arrayMethods.set('last', createAnyType());
		arrayMethods.set('empty', createBooleanType());
		arrayMethods.set('remove', createAnyType());
		arrayMethods.set('clear', { kind: 'VOID' });
		arrayMethods.set('sort', { kind: 'VOID' });
		this.builtInMethods.set('ARRAY', arrayMethods);

		// BOOLEAN methods
		const booleanMethods = new Map<string, PMLType>();
		booleanMethods.set('string', createStringType());
		this.builtInMethods.set('BOOLEAN', booleanMethods);

		// DBREF methods
		const dbrefMethods = new Map<string, PMLType>();
		dbrefMethods.set('query', createStringType());
		dbrefMethods.set('qreal', createRealType());
		dbrefMethods.set('qboolean', createBooleanType());
		dbrefMethods.set('delete', createBooleanType());
		this.builtInMethods.set('DBREF', dbrefMethods);

		// Global functions
		this.globalFunctions.set('array', createArrayType(createAnyType()));
		this.globalFunctions.set('string', createStringType());
		this.globalFunctions.set('object', createAnyType()); // Will be refined based on argument
		this.globalFunctions.set('collectallfor', createArrayType({ kind: 'DBREF' }));
		this.globalFunctions.set('getobject', { kind: 'DBREF' });
	}

	/**
	 * Analyze program and build type context
	 */
	public analyzeProgram(program: Program): TypeContext {
		this.currentContext = this.globalContext;

		for (const statement of program.body) {
			this.analyzeStatement(statement);
		}

		return this.globalContext;
	}

	/**
	 * Analyze method definition
	 */
	public analyzeMethod(method: MethodDefinition): TypeContext {
		// Create new context for method scope
		const methodContext: TypeContext = {
			variables: new Map(),
			parent: this.globalContext
		};

		this.currentContext = methodContext;

		// Add parameters to context
		for (const param of method.parameters) {
			if (param.paramType) {
				methodContext.variables.set(param.name, param.paramType);
			}
		}

		// Analyze method body
		for (const statement of method.body) {
			this.analyzeStatement(statement);
		}

		this.currentContext = this.globalContext;
		return methodContext;
	}

	/**
	 * Infer type of expression
	 */
	public inferExpressionType(expr: Expression, context?: TypeContext): InferenceResult {
		const ctx = context || this.currentContext;

		switch (expr.type) {
			case 'Identifier':
				return this.inferIdentifierType(expr as Identifier, ctx);

			case 'StringLiteral':
				return { type: createStringType(), confidence: 'certain' };

			case 'NumericLiteral':
				return { type: createRealType(), confidence: 'certain' };

			case 'BooleanLiteral':
				return { type: createBooleanType(), confidence: 'certain' };

			case 'ArrayLiteral':
				return { type: createArrayType(createAnyType()), confidence: 'certain' };

			case 'CallExpression':
				return this.inferCallExpressionType(expr as CallExpression, ctx);

			case 'MemberExpression':
				return this.inferMemberExpressionType(expr as any, ctx);

			case 'BinaryExpression':
				return this.inferBinaryExpressionType(expr as any, ctx);

			case 'UnaryExpression':
				return this.inferUnaryExpressionType(expr as any, ctx);

			default:
				return { type: createAnyType(), confidence: 'guess' };
		}
	}

	/**
	 * Get variable type from context
	 */
	public getVariableType(name: string, context?: TypeContext): PMLType | undefined {
		const ctx = context || this.currentContext;

		// Look in current context
		const type = ctx.variables.get(name);
		if (type) {
			return type;
		}

		// Look in parent context
		if (ctx.parent) {
			return this.getVariableType(name, ctx.parent);
		}

		return undefined;
	}

	/**
	 * Analyze statement and update context
	 */
	private analyzeStatement(stmt: Statement): void {
		switch (stmt.type) {
			case 'VariableDeclaration':
				this.analyzeVariableDeclaration(stmt as VariableDeclaration);
				break;

			case 'AssignmentStatement':
				this.analyzeAssignment(stmt as AssignmentStatement);
				break;

			case 'IfStatement':
				this.analyzeIfStatement(stmt as any);
				break;

			case 'DoStatement':
				if ((stmt as any).variant === 'values') {
					this.analyzeDoValuesLoop(stmt as any);
				} else if ((stmt as any).variant === 'while') {
					this.analyzeDoWhileLoop(stmt as any);
				}
				break;

			default:
				// Other statements don't affect type context
				break;
		}
	}

	/**
	 * Analyze variable declaration
	 */
	private analyzeVariableDeclaration(decl: VariableDeclaration): void {
		const varName = decl.name.name;

		// If has explicit type, use it
		if (decl.varType) {
			this.currentContext.variables.set(varName, decl.varType);
			return;
		}

		// If has initializer, infer from it
		if (decl.initializer) {
			const result = this.inferExpressionType(decl.initializer);
			this.currentContext.variables.set(varName, result.type);
		}
	}

	/**
	 * Analyze assignment
	 */
	private analyzeAssignment(assign: AssignmentStatement): void {
		if (assign.variable.type === 'Identifier') {
			const varName = (assign.variable as Identifier).name;
			const result = this.inferExpressionType(assign.value);
			this.currentContext.variables.set(varName, result.type);
		}
	}

	/**
	 * Analyze if statement (control flow)
	 */
	private analyzeIfStatement(ifStmt: any): void {
		// Analyze then branch
		for (const stmt of ifStmt.thenBranch) {
			this.analyzeStatement(stmt);
		}

		// Analyze else branch
		if (ifStmt.elseBranch) {
			for (const stmt of ifStmt.elseBranch) {
				this.analyzeStatement(stmt);
			}
		}
	}

	/**
	 * Analyze do values loop (infer iteration variable type)
	 */
	private analyzeDoValuesLoop(doStmt: any): void {
		if (doStmt.variable && doStmt.collection) {
			const collectionType = this.inferExpressionType(doStmt.collection);

			// If iterating over array, element type is array's element type
			if (collectionType.type.kind === 'ARRAY') {
				const arrayType = collectionType.type as any;
				if (arrayType.elementType) {
					this.currentContext.variables.set(doStmt.variable.name, arrayType.elementType);
				}
			}
		}

		// Analyze loop body
		for (const stmt of doStmt.body) {
			this.analyzeStatement(stmt);
		}
	}

	/**
	 * Analyze do while loop
	 */
	private analyzeDoWhileLoop(doStmt: any): void {
		// Analyze loop body
		for (const stmt of doStmt.body) {
			this.analyzeStatement(stmt);
		}
	}

	/**
	 * Infer identifier type
	 */
	private inferIdentifierType(ident: Identifier, context: TypeContext): InferenceResult {
		const type = this.getVariableType(ident.name, context);

		if (type) {
			return { type, confidence: 'certain' };
		}

		// Unknown variable - guess ANY
		return {
			type: createAnyType(),
			confidence: 'guess',
			reason: `Variable '${ident.name}' not found in context`
		};
	}

	/**
	 * Infer call expression type
	 */
	private inferCallExpressionType(call: CallExpression, context: TypeContext): InferenceResult {
		const calleeName = this.getCalleeName(call.callee);

		if (!calleeName) {
			return { type: createAnyType(), confidence: 'guess' };
		}

		// Check if it's a global function
		const globalFuncType = this.globalFunctions.get(calleeName.toLowerCase());
		if (globalFuncType) {
			// Special case: object ARRAY() / object STRING()
			if (calleeName.toLowerCase() === 'object' && call.arguments.length > 0) {
				const firstArg = call.arguments[0];
				if (firstArg.type === 'CallExpression') {
					const typeCall = firstArg as CallExpression;
					const typeName = this.getCalleeName(typeCall.callee);
					if (typeName) {
						const upperTypeName = typeName.toUpperCase();
						if (upperTypeName === 'ARRAY') {
							return { type: createArrayType(createAnyType()), confidence: 'certain' };
						} else if (upperTypeName === 'STRING') {
							return { type: createStringType(), confidence: 'certain' };
						}
					}
				}
			}

			return { type: globalFuncType, confidence: 'certain' };
		}

		// Otherwise, unknown function
		return { type: createAnyType(), confidence: 'guess' };
	}

	/**
	 * Infer member expression type (.methodName on object)
	 */
	private inferMemberExpressionType(member: any, context: TypeContext): InferenceResult {
		// Get object type
		const objectType = this.inferExpressionType(member.object, context);

		// Get property name
		const propertyName = this.getPropertyName(member.property);
		if (!propertyName) {
			return { type: createAnyType(), confidence: 'guess' };
		}

		// Check if it's a built-in method
		const objectTypeKind = objectType.type.kind;
		const methods = this.builtInMethods.get(objectTypeKind);

		if (methods) {
			const methodReturnType = methods.get(propertyName.toLowerCase());
			if (methodReturnType) {
				return { type: methodReturnType, confidence: 'certain' };
			}
		}

		return { type: createAnyType(), confidence: 'guess' };
	}

	/**
	 * Infer binary expression type
	 */
	private inferBinaryExpressionType(binary: any, context: TypeContext): InferenceResult {
		const operator = binary.operator;

		// Comparison operators return BOOLEAN
		if (['eq', 'ne', 'lt', 'le', 'gt', 'ge', 'and', 'or'].includes(operator)) {
			return { type: createBooleanType(), confidence: 'certain' };
		}

		// Arithmetic operators - infer from operands
		if (['+', '-', '*', '/', 'mod'].includes(operator)) {
			const leftType = this.inferExpressionType(binary.left, context);
			const rightType = this.inferExpressionType(binary.right, context);

			// If both are REAL, result is REAL
			if (leftType.type.kind === 'REAL' && rightType.type.kind === 'REAL') {
				return { type: createRealType(), confidence: 'certain' };
			}

			// If both are STRING and operator is +, result is STRING
			if (leftType.type.kind === 'STRING' && rightType.type.kind === 'STRING' && operator === '+') {
				return { type: createStringType(), confidence: 'likely' };
			}

			return { type: createAnyType(), confidence: 'guess' };
		}

		return { type: createAnyType(), confidence: 'guess' };
	}

	/**
	 * Infer unary expression type
	 */
	private inferUnaryExpressionType(unary: any, context: TypeContext): InferenceResult {
		const operator = unary.operator;

		// 'not' returns BOOLEAN
		if (operator === 'not') {
			return { type: createBooleanType(), confidence: 'certain' };
		}

		// '+' and '-' preserve REAL type
		if (operator === '+' || operator === '-') {
			const argType = this.inferExpressionType(unary.argument, context);
			if (argType.type.kind === 'REAL') {
				return { type: createRealType(), confidence: 'certain' };
			}
		}

		return { type: createAnyType(), confidence: 'guess' };
	}

	/**
	 * Helper: Get callee name from expression
	 */
	private getCalleeName(callee: Expression): string | null {
		if (callee.type === 'Identifier') {
			return (callee as Identifier).name;
		}
		return null;
	}

	/**
	 * Helper: Get property name from expression
	 */
	private getPropertyName(property: Expression): string | null {
		if (property.type === 'Identifier') {
			return (property as Identifier).name;
		}
		return null;
	}
}
