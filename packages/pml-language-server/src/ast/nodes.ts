/**
 * AST Node definitions for PML Language
 */

import { Range } from 'vscode-languageserver-textdocument';

/**
 * PML Type System
 */
export type PMLType =
	| { kind: 'STRING' }
	| { kind: 'REAL' }
	| { kind: 'INTEGER' }
	| { kind: 'BOOLEAN' }
	| { kind: 'ARRAY'; elementType: PMLType }
	| { kind: 'DBREF' }
	| { kind: 'ANY' }
	| { kind: 'UNDEFINED' }
	| { kind: 'UNION'; types: PMLType[] };

/**
 * Base AST Node
 */
export interface ASTNode {
	type: string;
	range: Range;
	parent?: ASTNode;
}

/**
 * Program - root node
 */
export interface Program extends ASTNode {
	type: 'Program';
	body: Statement[];
}

/**
 * Statements
 */
export type Statement =
	| MethodDefinition
	| ObjectDefinition
	| FormDefinition
	| VariableDeclaration
	| ExpressionStatement
	| IfStatement
	| DoStatement
	| HandleStatement
	| ReturnStatement
	| BreakStatement
	| ContinueStatement;

/**
 * Method Definition
 * define method .methodName(!param1, !param2)
 *   ...
 * endmethod
 */
export interface MethodDefinition extends ASTNode {
	type: 'MethodDefinition';
	name: string; // without leading dot
	parameters: Parameter[];
	body: Statement[];
	returnType?: PMLType;
	documentation?: JSDocComment;
	deprecated?: boolean;
}

/**
 * Object Definition
 * define object MyObject
 *   ...
 * endobject
 */
export interface ObjectDefinition extends ASTNode {
	type: 'ObjectDefinition';
	name: string;
	members: MethodDefinition[];
	documentation?: JSDocComment;
}

/**
 * Form Definition
 * setup form !!MyForm
 *   ...
 * exit
 */
export interface FormDefinition extends ASTNode {
	type: 'FormDefinition';
	name: string; // including !!
	frames: FrameDefinition[];
	callbacks: Record<string, string>; // gadget name -> callback method
}

/**
 * Frame Definition
 * frame .myFrame
 *   ...
 * exit
 */
export interface FrameDefinition extends ASTNode {
	type: 'FrameDefinition';
	name: string; // without leading dot
	gadgets: GadgetDeclaration[];
}

/**
 * Gadget Declaration (inside frame)
 */
export interface GadgetDeclaration extends ASTNode {
	type: 'GadgetDeclaration';
	name: string;
	gadgetType: string; // button, list, input, etc.
	properties: Record<string, any>;
}

/**
 * Parameter
 */
export interface Parameter extends ASTNode {
	type: 'Parameter';
	name: string; // without leading !
	paramType?: PMLType;
	optional?: boolean;
	defaultValue?: Expression;
}

/**
 * Variable Declaration
 * !variable = value
 */
export interface VariableDeclaration extends ASTNode {
	type: 'VariableDeclaration';
	name: string; // without leading ! or !!
	scope: 'local' | 'global';
	initializer?: Expression;
	inferredType?: PMLType;
}

/**
 * Expressions
 */
export type Expression =
	| Identifier
	| Literal
	| CallExpression
	| MemberExpression
	| BinaryExpression
	| UnaryExpression
	| ArrayExpression
	| AssignmentExpression;

/**
 * Identifier
 */
export interface Identifier extends ASTNode {
	type: 'Identifier';
	name: string;
	scope?: 'local' | 'global' | 'method';
	inferredType?: PMLType;
}

/**
 * Literal
 */
export interface Literal extends ASTNode {
	type: 'Literal';
	value: string | number | boolean;
	literalType: 'string' | 'number' | 'boolean';
	pmlType: PMLType;
}

/**
 * Call Expression
 * .methodName(!arg1, !arg2)
 * object(!args)
 */
export interface CallExpression extends ASTNode {
	type: 'CallExpression';
	callee: Expression;
	arguments: Expression[];
	returnType?: PMLType;
}

/**
 * Member Expression
 * !variable.method()
 * !object.property
 */
export interface MemberExpression extends ASTNode {
	type: 'MemberExpression';
	object: Expression;
	property: Identifier;
	computed: boolean; // true for !arr[index]
}

/**
 * Binary Expression
 * !a + !b
 * !x eq !y
 */
export interface BinaryExpression extends ASTNode {
	type: 'BinaryExpression';
	operator: string; // +, -, *, /, eq, ne, gt, lt, and, or, etc.
	left: Expression;
	right: Expression;
	resultType?: PMLType;
}

/**
 * Unary Expression
 * not !flag
 * -!num
 */
export interface UnaryExpression extends ASTNode {
	type: 'UnaryExpression';
	operator: string; // not, -, +
	argument: Expression;
	prefix: boolean;
}

/**
 * Array Expression
 * ARRAY()
 * !arr[index]
 */
export interface ArrayExpression extends ASTNode {
	type: 'ArrayExpression';
	elements: Expression[];
	elementType?: PMLType;
}

/**
 * Assignment Expression
 * !var = value
 */
export interface AssignmentExpression extends ASTNode {
	type: 'AssignmentExpression';
	left: Identifier | MemberExpression;
	right: Expression;
	operator: '=';
}

/**
 * Expression Statement
 */
export interface ExpressionStatement extends ASTNode {
	type: 'ExpressionStatement';
	expression: Expression;
}

/**
 * If Statement
 * if (condition) then
 *   ...
 * elseif (condition) then
 *   ...
 * else
 *   ...
 * endif
 */
export interface IfStatement extends ASTNode {
	type: 'IfStatement';
	test: Expression;
	consequent: Statement[];
	alternate?: Statement[] | IfStatement;
}

/**
 * Do Statement
 * do !item values !list
 *   ...
 * enddo
 */
export interface DoStatement extends ASTNode {
	type: 'DoStatement';
	variant: 'values' | 'index' | 'from-to' | 'while';
	variable?: Identifier;
	collection?: Expression;
	from?: Expression;
	to?: Expression;
	by?: Expression;
	condition?: Expression;
	body: Statement[];
}

/**
 * Handle Statement
 * handle any
 *   ...
 * elsehandle
 *   ...
 * endhandle
 */
export interface HandleStatement extends ASTNode {
	type: 'HandleStatement';
	errorType: 'any' | string;
	body: Statement[];
	alternate?: Statement[];
}

/**
 * Return Statement
 */
export interface ReturnStatement extends ASTNode {
	type: 'ReturnStatement';
	argument?: Expression;
}

/**
 * Break Statement
 */
export interface BreakStatement extends ASTNode {
	type: 'BreakStatement';
}

/**
 * Continue Statement
 */
export interface ContinueStatement extends ASTNode {
	type: 'ContinueStatement';
}

/**
 * JSDoc Comment
 */
export interface JSDocComment {
	description?: string;
	params?: JSDocParam[];
	returns?: string;
	examples?: string[];
	deprecated?: boolean;
	deprecationMessage?: string;
	author?: string;
	since?: string;
	see?: string[];
	form?: string;
	callback?: string;
}

/**
 * JSDoc Parameter
 */
export interface JSDocParam {
	name: string;
	type?: string;
	description?: string;
}

/**
 * Type helper functions
 */
export function createStringType(): PMLType {
	return { kind: 'STRING' };
}

export function createRealType(): PMLType {
	return { kind: 'REAL' };
}

export function createIntegerType(): PMLType {
	return { kind: 'INTEGER' };
}

export function createBooleanType(): PMLType {
	return { kind: 'BOOLEAN' };
}

export function createArrayType(elementType: PMLType = { kind: 'ANY' }): PMLType {
	return { kind: 'ARRAY', elementType };
}

export function createDBRefType(): PMLType {
	return { kind: 'DBREF' };
}

export function createAnyType(): PMLType {
	return { kind: 'ANY' };
}

export function createUndefinedType(): PMLType {
	return { kind: 'UNDEFINED' };
}

export function createUnionType(types: PMLType[]): PMLType {
	return { kind: 'UNION', types };
}

/**
 * Type equality check
 */
export function isTypeEqual(a: PMLType, b: PMLType): boolean {
	if (a.kind !== b.kind) {
		return false;
	}

	if (a.kind === 'ARRAY' && b.kind === 'ARRAY') {
		return isTypeEqual(a.elementType, b.elementType);
	}

	if (a.kind === 'UNION' && b.kind === 'UNION') {
		if (a.types.length !== b.types.length) {
			return false;
		}
		return a.types.every((t, i) => isTypeEqual(t, b.types[i]));
	}

	return true;
}

/**
 * Type to string
 */
export function typeToString(type: PMLType): string {
	switch (type.kind) {
		case 'STRING':
			return 'STRING';
		case 'REAL':
			return 'REAL';
		case 'INTEGER':
			return 'INTEGER';
		case 'BOOLEAN':
			return 'BOOLEAN';
		case 'ARRAY':
			return `ARRAY<${typeToString(type.elementType)}>`;
		case 'DBREF':
			return 'DBREF';
		case 'ANY':
			return 'ANY';
		case 'UNDEFINED':
			return 'UNDEFINED';
		case 'UNION':
			return type.types.map(typeToString).join(' | ');
	}
}
