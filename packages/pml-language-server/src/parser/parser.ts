/**
 * PML Parser
 * Recursive Descent Parser - converts tokens to AST
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-constant-condition */

import { Token, TokenType } from './tokens';
import { Lexer } from './lexer';
import { getEnhancedErrorMessage, ErrorContext } from './errorMessages';
import {
	Program, Statement, Expression, MethodDefinition, FunctionDefinition, ObjectDefinition, FormDefinition,
	FrameDefinition, VariableDeclaration, MemberDeclaration, Parameter, IfStatement, DoStatement,
	HandleStatement, ReturnStatement, BreakStatement, ContinueStatement,
	ExpressionStatement, Identifier, Literal, CallExpression, MemberExpression,
	BinaryExpression, UnaryExpression, ArrayExpression, AssignmentExpression,
	JSDocComment, JSDocParam, GadgetDeclaration, PMLType,
	createStringType, createRealType, createBooleanType, createArrayType,
	createIntegerType, createAnyType, createDBRefType
} from '../ast/nodes';
import { Range } from 'vscode-languageserver-textdocument';
import { isPdmsCommandStarter } from '../data/pdmsCommands';

export type ParserMode = 'default' | 'object' | 'form' | 'function' | 'command';

export interface ParserOptions {
	mode?: ParserMode;
}

export function parserModeFromUri(uriOrPath: string): ParserMode {
	const lower = uriOrPath.toLowerCase();
	if (lower.endsWith('.pmlobj')) {
		return 'object';
	}
	if (lower.endsWith('.pmlfrm')) {
		return 'form';
	}
	if (lower.endsWith('.pmlfnc')) {
		return 'function';
	}
	if (lower.endsWith('.pmlcmd')) {
		return 'command';
	}
	return 'default';
}

const FORM_GADGET_TOKEN_TYPES = new Set<TokenType>([
	TokenType.BUTTON,
	TokenType.COMBO,
	TokenType.CONTAINER,
	TokenType.FRAME,
	TokenType.MENU,
	TokenType.OPTION,
	TokenType.PARA,
	TokenType.PARAGRAPH,
	TokenType.TEXT,
	TokenType.TOGGLE
]);

const RESTRICTED_COMMAND_STARTERS = new Set(['calldrg', 'gap', 'id']);

const DIRECTION_PRIMARY_NAMES = new Set(['E', 'N', 'S', 'U', 'W', 'X', 'Y', 'Z']);

interface GadgetModifiers {
	position?: number;
	width?: number | string;
	height?: number | string;
	tooltip?: string;
	call?: string;
	pixmap?: string;
}

export class Parser {
	private tokens: Token[] = [];
	private sourceText: string = '';
	private current: number = 0;
	private errors: ParseError[] = [];
	private parsingContext: ErrorContext['context'] = undefined;
	private mode: ParserMode = 'default';

	/**
	 * Parse source code into AST
	 */
	public parse(source: string, options: ParserOptions = {}): ParseResult {
		// Tokenize
		const lexer = new Lexer(source);
		this.sourceText = source;
		this.tokens = lexer.tokenize();
		this.current = 0;
		this.errors = [];
		this.mode = options.mode ?? 'default';

		// Parse
		const statements: Statement[] = [];

		while (!this.isAtEnd()) {
			try {
				const stmt = this.parseTopLevelStatement();
				if (stmt) {
					statements.push(stmt);
				}
			} catch (error) {
				// Error recovery: skip to next statement
				this.synchronize();
			}
		}

		const program: Program = {
			type: 'Program',
			body: statements,
			range: this.createRange(0, this.tokens.length - 1)
		};

		return {
			ast: program,
			errors: this.errors
		};
	}

	/**
	 * Parse top-level statement (method, object, form)
	 */
	private parseTopLevelStatement(): Statement | null {
		// Skip whitespace/comments
		this.skipTrivia();

		if (this.isAtEnd()) return null;

		// Skip unknown tokens (like BOM)
		if (this.check(TokenType.UNKNOWN)) {
			this.advance();
			return null;
		}

		// define method / object
		if (this.check(TokenType.DEFINE)) {
			return this.parseDefinition();
		}

		// setup form / setup command
		if (this.check(TokenType.SETUP)) {
			if (this.isSetupCommandStart()) {
				return this.parseSetupCommandDefinition();
			}
			return this.parseFormDefinition();
		}

		if (this.isLayoutFormStart()) {
			return this.parseFormDefinition();
		}

		// Variables, expressions, etc.
		return this.parseStatement();
	}

	/**
	 * Parse definition (method, function, or object)
	 */
	private parseDefinition(): Statement {
		const startToken = this.consume(TokenType.DEFINE, "Expected 'define'");

		if (this.check(TokenType.METHOD_KW)) {
			return this.parseMethodDefinition(startToken);
		} else if (this.check(TokenType.FUNCTION)) {
			return this.parseFunctionDefinition(startToken);
		} else if (this.check(TokenType.OBJECT)) {
			return this.parseObjectDefinition(startToken);
		} else {
			throw this.error(this.peek(), "Expected 'method', 'function', or 'object' after 'define'");
		}
	}

	/**
	 * Parse method definition
	 * define method .methodName(!param1, !param2) [is RETURN_TYPE]
	 *   ...
	 * endmethod
	 */
	private parseMethodDefinition(startToken: Token): MethodDefinition {
		const previousContext = this.parsingContext;
		this.parsingContext = 'method';

		this.consume(TokenType.METHOD_KW, "Expected 'method'");

		// Parse documentation (JSDoc comments before method)
		const documentation = this.parsePrecedingDocumentation();

		// Method name: .methodName
		const nameToken = this.consume(TokenType.METHOD, "Expected method name (e.g., .myMethod)");
		const methodName = nameToken.value.substring(1); // Remove leading dot

		// Parameters: (...)
		this.consume(TokenType.LPAREN, "Expected '(' after method name");
		const parameters = this.parseParameters();
		this.consume(TokenType.RPAREN, "Expected ')' after parameters");

		// Optional return type: is TYPE
		let returnType: PMLType | undefined = undefined;
		if (this.check(TokenType.IS)) {
			this.advance(); // consume 'is'
			returnType = this.parseType();
		}

		// Method body - parse statements until ENDMETHOD
		const body: Statement[] = [];

		while (!this.isAtEnd() && !this.check(TokenType.ENDMETHOD) && !this.check(TokenType.DEFINE)) {
			try {
				const stmt = this.parseStatement();
				if (stmt) {
					body.push(stmt);
				}
			} catch (error) {
				// Error recovery: skip to end of line and continue
				this.synchronize();
				// If we hit ENDMETHOD/DEFINE during synchronize, break
				if (this.check(TokenType.ENDMETHOD) || this.check(TokenType.DEFINE)) {
					break;
				}
			}
		}

		// Consume ENDMETHOD if present
		let endToken: Token;
		if (this.check(TokenType.ENDMETHOD)) {
			endToken = this.advance();
		} else {
			// No ENDMETHOD found (probably at DEFINE or EOF) - use current position
			endToken = this.previous();
			this.errors.push(new ParseError("Expected 'endmethod'", endToken));
		}

		this.parsingContext = previousContext;

		return {
			type: 'MethodDefinition',
			name: methodName,
			parameters,
			body,
			returnType,
			documentation,
			deprecated: documentation?.deprecated || false,
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	/**
	 * Parse function definition
	 * define function !!functionName(!param1, !param2)
	 *   ...
	 * endfunction
	 */
	private parseFunctionDefinition(startToken: Token): FunctionDefinition {
		const previousContext = this.parsingContext;
		this.parsingContext = 'function';

		this.consume(TokenType.FUNCTION, "Expected 'function'");

		// Parse documentation (JSDoc comments before function)
		const documentation = this.parsePrecedingDocumentation();

		// Function name: !!functionName (global variable)
		const nameToken = this.consume(TokenType.GLOBAL_VAR, "Expected function name (e.g., !!myFunction)");
		const functionName = nameToken.value.substring(2); // Remove leading !!

		// Parameters: (...)
		this.consume(TokenType.LPAREN, "Expected '(' after function name");
		const parameters = this.parseParameters();
		this.consume(TokenType.RPAREN, "Expected ')' after parameters");

		// Optional return type: is TYPE
		let returnType: PMLType | undefined = undefined;
		if (this.check(TokenType.IS)) {
			this.advance();
			returnType = this.parseType();
		}

		// Function body - parse statements until ENDFUNCTION
		const body: Statement[] = [];

		while (!this.isAtEnd() && !this.check(TokenType.ENDFUNCTION) && !this.check(TokenType.DEFINE)) {
			try {
				const stmt = this.parseStatement();
				if (stmt) {
					body.push(stmt);
				}
			} catch (error) {
				// Error recovery: skip to end of line and continue
				this.synchronize();
				// If we hit ENDFUNCTION/DEFINE during synchronize, break
				if (this.check(TokenType.ENDFUNCTION) || this.check(TokenType.DEFINE)) {
					break;
				}
			}
		}

		// Consume ENDFUNCTION if present
		let endToken: Token;
		if (this.check(TokenType.ENDFUNCTION)) {
			endToken = this.advance();
		} else {
			// No ENDFUNCTION found (probably at DEFINE or EOF) - use current position
			endToken = this.previous();
			this.errors.push(new ParseError("Expected 'endfunction'", endToken));
		}

		this.parsingContext = previousContext;

		return {
			type: 'FunctionDefinition',
			name: functionName,
			parameters,
			returnType,
			body,
			documentation,
			deprecated: documentation?.deprecated || false,
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	private isSetupCommandStart(): boolean {
		const nextToken = this.peekNext();
		return nextToken.line === this.peek().line &&
		       nextToken.type === TokenType.IDENTIFIER &&
		       nextToken.value.toLowerCase() === 'command';
	}

	private parseSetupCommandDefinition(): ExpressionStatement {
		const startToken = this.advance(); // setup
		let endToken = startToken;
		let foundTerminator = false;

		while (!this.isAtEnd() && !this.check(TokenType.EXIT) && !this.check(TokenType.DEFINE)) {
			endToken = this.advance();
		}

		if (this.check(TokenType.EXIT)) {
			endToken = this.advance();
			foundTerminator = true;
		} else if (this.check(TokenType.DEFINE)) {
			foundTerminator = true;
			this.errors.push(new ParseError("Expected 'exit' before definitions after 'setup command'", this.peek()));
		}

		if (!foundTerminator) {
			this.errors.push(new ParseError("Expected 'exit' or 'define' after 'setup command'", endToken));
		}

		return {
			type: 'ExpressionStatement',
			expression: {
				type: 'Identifier',
				name: this.sourceText.slice(startToken.offset, endToken.offset + endToken.length).trim(),
				range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
			},
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	/**
	 * Parse object definition
	 * define object MyObject
	 *   member .property is TYPE
	 *   define method .setup()
	 *     ...
	 *   endmethod
	 * endobject
	 */
	private parseObjectDefinition(startToken: Token): ObjectDefinition {
		const previousContext = this.parsingContext;
		this.parsingContext = 'object';

		this.consume(TokenType.OBJECT, "Expected 'object'");

		const nameToken = this.consume(TokenType.IDENTIFIER, "Expected object name");
		const objectName = nameToken.value;

		const members: MethodDefinition[] = [];

		while (!this.check(TokenType.ENDOBJECT) && !this.isAtEnd()) {
			// Parse member properties: member .property is TYPE
			if (this.check(TokenType.MEMBER)) {
				this.advance(); // consume 'member'
				// Skip member property declaration (just consume tokens until newline/statement end)
				// member .data is STRING
				while (!this.isAtEnd() && this.peek().type !== TokenType.MEMBER &&
				       this.peek().type !== TokenType.DEFINE &&
				       this.peek().type !== TokenType.ENDOBJECT) {
					this.advance();
					// Break at potential statement boundary (simple heuristic)
					if (this.previous().value === '\n' || this.check(TokenType.MEMBER) || this.check(TokenType.DEFINE)) {
						break;
					}
				}
			}
			// Parse method definitions: define method .methodName()
			else if (this.check(TokenType.DEFINE)) {
				const defineToken = this.advance(); // consume 'define'
				if (this.check(TokenType.METHOD_KW)) {
					const memberMethod = this.parseMethodDefinition(defineToken);
					members.push(memberMethod);
				} else {
					// Unknown define statement, skip
					this.advance();
				}
			}
			// Skip comments and other tokens
			else {
				this.advance();
			}
		}

		const endToken = this.consume(TokenType.ENDOBJECT, "Expected 'endobject'");

		this.parsingContext = previousContext;

		return {
			type: 'ObjectDefinition',
			name: objectName,
			members,
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	/**
	 * Parse form definition
	 * setup form !!name [DIALOG|MAIN|DOCUMENT|BLOCKINGDIALOG] [RESIZABLE|RESIZE] [DOCK direction]
	 *   ...
	 * exit
	 */
	private parseFormDefinition(): FormDefinition {
		const previousContext = this.parsingContext;
		this.parsingContext = 'form';

		const startToken = this.advance();
		this.consume(TokenType.FORM, "Expected 'form'");

		const nameToken = this.consume(TokenType.GLOBAL_VAR, "Expected form name (e.g., !!MyForm)");
		const formName = nameToken.value;

		// Parse optional form modifiers
		let formType: 'DIALOG' | 'MAIN' | 'DOCUMENT' | 'BLOCKINGDIALOG' | undefined;
		let resizable = false;
		let dock: 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | undefined;

		// Parse modifiers until we hit a newline or form body content
		while (!this.isAtEnd() && !this.isFormBodyStart()) {
			if (this.match(TokenType.DIALOG)) {
				formType = 'DIALOG';
			} else if (this.match(TokenType.MAIN)) {
				formType = 'MAIN';
			} else if (this.match(TokenType.DOCUMENT)) {
				formType = 'DOCUMENT';
			} else if (this.match(TokenType.BLOCKINGDIALOG)) {
				formType = 'BLOCKINGDIALOG';
			} else if (this.match(TokenType.RESIZABLE) || this.match(TokenType.RESIZE)) {
				resizable = true;
			} else if (this.match(TokenType.DOCK)) {
				// Expect direction after DOCK
				if (this.match(TokenType.LEFT)) dock = 'LEFT';
				else if (this.match(TokenType.RIGHT)) dock = 'RIGHT';
				else if (this.match(TokenType.TOP)) dock = 'TOP';
				else if (this.match(TokenType.BOTTOM)) dock = 'BOTTOM';
			} else if (this.check(TokenType.IDENTIFIER)) {
				// Handle lowercase modifiers like 'dialog', 'resize'
				const token = this.peek();
				const lowerValue = token.value.toLowerCase();
				if (lowerValue === 'dialog') { formType = 'DIALOG'; this.advance(); }
				else if (lowerValue === 'main') { formType = 'MAIN'; this.advance(); }
				else if (lowerValue === 'document') { formType = 'DOCUMENT'; this.advance(); }
				else if (lowerValue === 'resize' || lowerValue === 'resizable') { resizable = true; this.advance(); }
				else break;
			} else {
				break;
			}
		}

		// Parse form body
		const body: Statement[] = [];
		const frames: FrameDefinition[] = [];
		const callbacks: Record<string, string> = {};
		const members: MemberDeclaration[] = [];
		let foundExit = false;

		while (!this.isAtEnd()) {
			const token = this.peek();

			// Stop at EXIT or DEFINE
			if (token.type === TokenType.EXIT) {
				this.advance(); // consume EXIT
				foundExit = true;
				break;
			}

			if (token.type === TokenType.DEFINE) {
				// Don't consume DEFINE - let the main parser handle it
				break;
			}

			if (this.isFormSubBlockStart()) {
				this.consumeFormBlockBodyUntilExit(this.formSubBlockKind(), callbacks, members, body);
				continue;
			}

			// Parse member declarations
			if (token.type === TokenType.MEMBER) {
				const member = this.parseMemberDeclaration();
				members.push(member);
				body.push(member as unknown as Statement);
				continue;
			}

			// Parse frame definitions
			if (token.type === TokenType.FRAME) {
				frames.push(this.parseFrameDefinition());
				continue;
			}

			// Parse gadget declarations (button, text, combo, option, toggle, container, menu)
			if (this.isGadgetDeclarationStart(token.type)) {
				try {
					const gadget = this.parseGadget();
					body.push(gadget as unknown as Statement);
				} catch {
					this.advance(); // Skip on error
				}
				continue;
			}

			// Parse TRACK statements (form event handlers)
			if (token.type === TokenType.TRACK) {
				try {
					this.parseTrackStatement(callbacks);
				} catch {
					this.advance(); // Skip on error
				}
				continue;
			}

			// Parse variable assignments and other statements
			if (token.type === TokenType.LOCAL_VAR || token.type === TokenType.GLOBAL_VAR) {
				try {
					const stmt = this.parseFormExpressionStatement(callbacks);
					if (stmt) {
						body.push(stmt);
					}
				} catch {
					this.advance(); // Skip on error
				}
				continue;
			}

			// Skip other tokens (TRACK, path, vdist, etc. - not strictly parsed yet)
			this.advance();
		}

		const endToken = this.previous();
		if (!foundExit && this.isAtEnd()) {
			this.errors.push(new ParseError("Expected 'exit' to close form", this.isAtEnd() ? endToken : this.peek()));
		}

		this.parsingContext = previousContext;

		return {
			type: 'FormDefinition',
			name: formName,
			formType,
			resizable,
			dock,
			body,
			frames,
			members,
			callbacks,
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	private isLayoutFormStart(): boolean {
		const token = this.peek();
		const nextToken = this.peekNext();
		return token.type === TokenType.IDENTIFIER &&
		       token.value.toLowerCase() === 'layout' &&
		       nextToken.type === TokenType.FORM &&
		       nextToken.line === token.line;
	}

	private parseFormExpressionStatement(callbacks: Record<string, string>): Statement | null {
		const stmt = this.parseExpressionStatement();
		if (stmt) {
			this.extractFormCallbackBinding(stmt, callbacks);
		}
		return stmt;
	}

	private extractFormCallbackBinding(stmt: ExpressionStatement, callbacks: Record<string, string>): void {
		const expression = stmt.expression;
		if (expression.type !== 'AssignmentExpression') {
			return;
		}

		const propertyPath = this.expressionPath(expression.left);
		if (!propertyPath || !this.isFormCallbackPath(propertyPath)) {
			return;
		}

		const callback = this.callbackText(expression.right);
		if (callback) {
			callbacks[propertyPath] = callback;
		}
	}

	private expressionPath(expression: Expression): string | undefined {
		if (expression.type === 'Identifier') {
			return expression.name;
		}

		if (expression.type === 'MemberExpression' && !expression.computed) {
			const objectPath = this.expressionPath(expression.object);
			const propertyPath = this.expressionPath(expression.property);
			if (objectPath && propertyPath) {
				return `${objectPath}.${propertyPath}`;
			}
		}

		return undefined;
	}

	private isFormCallbackPath(propertyPath: string): boolean {
		const propertyName = propertyPath.split('.').pop()?.toLowerCase();
		if (!propertyName) {
			return false;
		}

		return [
			'callback',
			'initcall',
			'firstshowncall',
			'okcall',
			'cancelcall',
			'quitcall',
			'killcall',
			'killingcall'
		].includes(propertyName);
	}

	private callbackText(expression: Expression): string | undefined {
		if (expression.type === 'Literal' && typeof expression.value === 'string') {
			const value = expression.value.trim();
			return value.includes('!this.') || value.startsWith('.') ? value : undefined;
		}

		return undefined;
	}

	/**
	 * Check if current token starts form body content
	 */
	private isFormBodyStart(): boolean {
		const token = this.peek();
		return token.type === TokenType.LOCAL_VAR ||
		       token.type === TokenType.GLOBAL_VAR ||
		       token.type === TokenType.MEMBER ||
		       token.type === TokenType.FRAME ||
		       token.type === TokenType.BUTTON ||
		       token.type === TokenType.TEXT ||
		       token.type === TokenType.COMBO ||
		       token.type === TokenType.CONTAINER ||
		       token.type === TokenType.MENU ||
		       token.type === TokenType.PARA ||
		       token.type === TokenType.PARAGRAPH ||
		       token.type === TokenType.TRACK ||
		       token.type === TokenType.OPTION ||
		       token.type === TokenType.TOGGLE ||
		       token.type === TokenType.EXIT ||
		       token.type === TokenType.DEFINE ||
		       // Also check for common form commands
		       (token.type === TokenType.IDENTIFIER &&
		        ['path', 'vdist', 'hdist'].includes(token.value.toLowerCase()));
	}

	/**
	 * Parse frame definition
	 */
	private parseFrameDefinition(): FrameDefinition {
		const startToken = this.consume(TokenType.FRAME, "Expected 'frame'");
		const nameToken = this.consume(TokenType.METHOD, "Expected frame name (e.g., .myFrame)");
		const frameName = nameToken.value.substring(1);

		const frames: FrameDefinition[] = [];
		const gadgets: GadgetDeclaration[] = [];

		while (!this.check(TokenType.EXIT) && !this.isAtEnd()) {
			this.skipTrivia();

			if (this.check(TokenType.EXIT)) break;

			if (this.check(TokenType.FRAME)) {
				frames.push(this.parseFrameDefinition());
				continue;
			}

			if (this.isFormSubBlockStart()) {
				this.consumeFormBlockBodyUntilExit(this.formSubBlockKind());
				continue;
			}

			// Parse gadget (button, text, combo, option, toggle, container, menu)
			if (this.isGadgetDeclarationStart(this.peek().type)) {
				gadgets.push(this.parseGadget());
			} else {
				this.advance();
			}
		}

		const endToken = this.consume(TokenType.EXIT, "Expected 'exit'");

		return {
			type: 'FrameDefinition',
			name: frameName,
			frames,
			gadgets,
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	/**
	 * Parse member declaration
	 * member .name is TYPE
	 */
	private parseMemberDeclaration(): MemberDeclaration {
		const startToken = this.consume(TokenType.MEMBER, "Expected 'member'");
		const nameToken = this.consume(TokenType.METHOD, "Expected member name (e.g., .myMember)");
		const memberName = nameToken.value.substring(1); // Remove leading dot

		this.consume(TokenType.IS, "Expected 'is' after member name");

		const memberType = this.parseType();

		return {
			type: 'MemberDeclaration',
			name: memberName,
			memberType,
			range: this.createRange(this.getTokenIndex(startToken), this.current - 1)
		};
	}

	/**
	 * Parse gadget declaration
	 * button .name |Label| [OK|CANCEL|APPLY|RESET] [at x<num>]
	 * text .name |width| [at x<num>]
	 * combo .name |Label| [at x<num>] [width <num>]
	 * container .name [nobox] [controlType] [|Label|] [at x<num>] [wid <num>] [hei <num>]
	 * menu .name [popup]
	 * option .name |width| |Label| [at x<num>]
	 * toggle .name |Label| [at x<num>]
	 */
	private parseGadget(): GadgetDeclaration {
		const startToken = this.peek();

		// Gadget type
		let gadgetType: string = '';
		if (this.check(TokenType.BUTTON)) {
			gadgetType = 'button';
			this.advance();
		} else if (this.check(TokenType.TEXT)) {
			gadgetType = 'text';
			this.advance();
		} else if (this.check(TokenType.COMBO)) {
			gadgetType = 'combo';
			this.advance();
		} else if (this.check(TokenType.CONTAINER)) {
			gadgetType = 'container';
			this.advance();
		} else if (this.check(TokenType.MENU)) {
			gadgetType = 'menu';
			this.advance();
		} else if (this.check(TokenType.PARA)) {
			gadgetType = 'para';
			this.advance();
		} else if (this.check(TokenType.PARAGRAPH)) {
			gadgetType = 'paragraph';
			this.advance();
		} else if (this.check(TokenType.OPTION)) {
			gadgetType = 'option';
			this.advance();
		} else if (this.check(TokenType.TOGGLE)) {
			gadgetType = 'toggle';
			this.advance();
		} else {
			throw this.error(this.peek(), "Expected gadget type (button, text, combo, option, toggle, container, menu, para)");
		}

		const nameToken = this.consumeGadgetName();
		const gadgetName = nameToken.type === TokenType.METHOD ? nameToken.value.substring(1) : nameToken.value;

		let label: string | undefined;
		let width: number | string | undefined;
		let modifier: 'OK' | 'CANCEL' | 'APPLY' | 'RESET' | undefined;
		const properties: Record<string, any> = {};

		// Parse gadget-specific properties
		if (gadgetType === 'button' || gadgetType === 'toggle') {
			// button .name |Label| [OK|CANCEL|APPLY|RESET] [at x<num>]
			// toggle .name |Label| [at x<num>]
			if (this.check(TokenType.STRING)) {
				label = this.advance().value;
			}

			// Button modifiers
			if (gadgetType === 'button') {
				if (this.check(TokenType.OK)) {
					modifier = 'OK';
					this.advance();
				} else if (this.check(TokenType.CANCEL)) {
					modifier = 'CANCEL';
					this.advance();
				} else if (this.check(TokenType.APPLY)) {
					modifier = 'APPLY';
					this.advance();
				} else if (this.check(TokenType.RESET)) {
					modifier = 'RESET';
					this.advance();
				}
			}
		} else if (gadgetType === 'text') {
			// text .name |width| [at x<num>]
			if (this.check(TokenType.STRING)) {
				width = this.advance().value;
			} else if (this.check(TokenType.NUMBER)) {
				width = parseFloat(this.advance().value);
			}
		} else if (gadgetType === 'combo') {
			// combo .name |Label| [at x<num>] [width <num>]
			if (this.check(TokenType.STRING)) {
				label = this.advance().value;
			}
		} else if (gadgetType === 'container') {
			// container .name [nobox] [controlType] [|Label|] [...]
			if (this.check(TokenType.NOBOX)) {
				properties.nobox = true;
				this.advance();
			}

			if (this.check(TokenType.IDENTIFIER)) {
				properties.controlType = this.advance().value;
			}

			if (this.check(TokenType.STRING)) {
				label = this.advance().value;
			}
		} else if (gadgetType === 'menu') {
			// menu .name [popup]
			if (this.check(TokenType.POPUP)) {
				properties.popup = true;
				this.advance();
			}
		} else if (gadgetType === 'option') {
			// option .name |width| |Label| [at x<num>]
			if (this.check(TokenType.STRING)) {
				width = this.advance().value;
			} else if (this.check(TokenType.NUMBER)) {
				width = parseFloat(this.advance().value);
			}

			if (this.check(TokenType.STRING)) {
				label = this.advance().value;
			}
		}

		const modifiers = this.parseGadgetModifiers(startToken.line);
		const position = modifiers.position;
		width = width ?? modifiers.width;
		if (modifiers.height !== undefined) {
			properties.height = modifiers.height;
		}
		if (modifiers.tooltip !== undefined) {
			properties.tooltip = modifiers.tooltip;
		}
		if (modifiers.call !== undefined) {
			properties.call = modifiers.call;
		}
		if (modifiers.pixmap !== undefined) {
			properties.pixmap = modifiers.pixmap;
		}

		if (gadgetType === 'menu' && this.isMenuBodyStart(startToken.line)) {
			this.consumeFormBlockBodyUntilExit('menu');
		}

		return {
			type: 'GadgetDeclaration',
			name: gadgetName,
			gadgetType,
			label,
			modifier,
			position,
			width,
			properties,
			range: this.createRange(this.getTokenIndex(startToken), this.current - 1)
		};
	}

	private consumeGadgetName(): Token {
		if (this.check(TokenType.METHOD)) {
			return this.advance();
		}
		if (this.check(TokenType.IDENTIFIER) && this.peek().value.startsWith('_')) {
			return this.advance();
		}

		throw this.error(this.peek(), "Expected gadget name (e.g., .myButton)");
	}

	private isGadgetDeclarationStart(type: TokenType): boolean {
		return type !== TokenType.FRAME && FORM_GADGET_TOKEN_TYPES.has(type);
	}

	/**
	 * Parse TRACK statement in form definition
	 * TRACK |EventType| call |CallbackMethod|
	 */
	private parseTrackStatement(callbacks: Record<string, string>): void {
		const startToken = this.consume(TokenType.TRACK, "Expected 'track'");

		// Event type (string like |DESICE|)
		let eventType = '';
		if (this.check(TokenType.STRING)) {
			eventType = this.advance().value;
		} else if (this.check(TokenType.IDENTIFIER)) {
			eventType = this.advance().value;
		}

		// Optional 'call' keyword
		if (this.check(TokenType.CALL)) {
			this.advance();
		}

		// Callback method (string like |!this.trackce()|)
		let callback = '';
		if (this.check(TokenType.STRING)) {
			callback = this.advance().value;
		}

		// Store callback if both event and callback are found
		if (eventType && callback) {
			callbacks[eventType] = callback;
		}

		// Skip remaining tokens on this line (at, tooltip, etc.)
		this.skipGadgetModifiers(startToken.line);
	}

	/**
	 * Parse common gadget modifiers on the declaration line.
	 */
	private parseGadgetModifiers(line: number): GadgetModifiers {
		const modifiers: GadgetModifiers = {};

		while (this.isOnLine(line)) {
			const token = this.peek();

			if (token.type === TokenType.AT) {
				const position = this.parseGadgetPosition(line);
				if (position !== undefined) {
					modifiers.position = position;
				}
				continue;
			}

			const keyword = this.getModifierKeyword(token);
			if (!keyword) {
				this.advance();
				continue;
			}

			this.advance();

			if (keyword === 'width') {
				modifiers.width = this.parseModifierScalarValue(line);
			} else if (keyword === 'height') {
				modifiers.height = this.parseModifierScalarValue(line);
			} else if (keyword === 'tooltip') {
				modifiers.tooltip = this.parseModifierTextValue(line);
			} else if (keyword === 'call' || keyword === 'callback') {
				modifiers.call = this.parseModifierTextValue(line);
			} else if (keyword === 'pixmap') {
				modifiers.pixmap = this.parseModifierTextValue(line);
			}
		}

		return modifiers;
	}

	private parseGadgetPosition(line: number): number | undefined {
		this.consume(TokenType.AT, "Expected 'at'");

		if (!this.isOnLine(line)) {
			return undefined;
		}

		const posToken = this.peek();
		if (posToken.type === TokenType.IDENTIFIER && posToken.value.toLowerCase().startsWith('x')) {
			this.advance();
			return parseInt(posToken.value.substring(1), 10);
		}

		if (posToken.type === TokenType.NUMBER) {
			this.advance();
			return parseFloat(posToken.value);
		}

		return undefined;
	}

	private parseModifierScalarValue(line: number): string | number | undefined {
		if (!this.isOnLine(line)) {
			return undefined;
		}

		const token = this.peek();
		if (token.type === TokenType.NUMBER) {
			this.advance();
			return parseFloat(token.value);
		}

		if (token.type === TokenType.STRING ||
		    token.type === TokenType.IDENTIFIER ||
		    token.type === TokenType.METHOD ||
		    token.type === TokenType.LOCAL_VAR ||
		    token.type === TokenType.GLOBAL_VAR ||
		    token.type === TokenType.SUBSTITUTE_VAR) {
			this.advance();
			return token.value;
		}

		return undefined;
	}

	private parseModifierTextValue(line: number): string | undefined {
		if (!this.isOnLine(line)) {
			return undefined;
		}

		if (this.check(TokenType.STRING)) {
			return this.advance().value;
		}

		const startOffset = this.peek().offset;
		let endOffset = startOffset;
		while (this.isOnLine(line)) {
			const token = this.peek();
			if (token.type === TokenType.AT || this.getModifierKeyword(token)) {
				break;
			}

			endOffset = token.offset + token.length;
			this.advance();
		}

		if (endOffset <= startOffset) {
			return undefined;
		}

		return this.sourceText.slice(startOffset, endOffset).trim();
	}

	private getModifierKeyword(token: Token): string | undefined {
		if (token.type === TokenType.WID) {
			return 'width';
		}
		if (token.type === TokenType.HEI) {
			return 'height';
		}
		if (token.type === TokenType.CALL) {
			return 'call';
		}
		if (token.type !== TokenType.IDENTIFIER) {
			return undefined;
		}

		const keyword = token.value.toLowerCase();
		if (['width', 'height', 'tooltip', 'call', 'callback', 'pixmap'].includes(keyword)) {
			return keyword;
		}

		return undefined;
	}

	private skipGadgetModifiers(line: number): void {
		while (this.isOnLine(line)) {
			this.advance();
		}
	}

	private isMenuBodyStart(menuLine: number): boolean {
		if (this.isAtEnd() || this.peek().line === menuLine) {
			return false;
		}

		return this.check(TokenType.IDENTIFIER) && this.peek().value.toLowerCase() === 'add';
	}

	private isFormSubBlockStart(): boolean {
		if (!this.check(TokenType.IDENTIFIER)) {
			return false;
		}

		return ['bar', 'rgroup'].includes(this.peek().value.toLowerCase());
	}

	private formSubBlockKind(): 'bar' | 'rgroup' {
		return this.peek().value.toLowerCase() === 'rgroup' ? 'rgroup' : 'bar';
	}

	private consumeFormBlockBodyUntilExit(
		blockKind: 'bar' | 'menu' | 'rgroup',
		callbacks?: Record<string, string>,
		members?: MemberDeclaration[],
		body?: Statement[]
	): void {
		const startToken = this.peek();
		if (this.isFormSubBlockStart()) {
			this.consumeRemainingLine(this.peek().line);
		}

		let reportedUnknown = false;

		while (!this.isAtEnd() && !this.check(TokenType.EXIT) && !this.check(TokenType.DEFINE)) {
			if (this.isFormSubBlockStart()) {
				this.consumeFormBlockBodyUntilExit(this.formSubBlockKind(), callbacks, members, body);
				continue;
			}

			if (this.check(TokenType.FRAME)) {
				this.parseFrameDefinition();
				continue;
			}

			if (this.isGadgetDeclarationStart(this.peek().type)) {
				const gadget = this.parseGadget();
				body?.push(gadget as unknown as Statement);
				continue;
			}

			if (this.check(TokenType.MEMBER)) {
				const member = this.parseMemberDeclaration();
				members?.push(member);
				body?.push(member as unknown as Statement);
				continue;
			}

			if ((this.check(TokenType.LOCAL_VAR) || this.check(TokenType.GLOBAL_VAR)) && callbacks) {
				const stmt = this.parseFormExpressionStatement(callbacks);
				if (stmt) {
					body?.push(stmt);
				}
				continue;
			}

			if (this.check(TokenType.TRACK)) {
				if (callbacks) {
					this.parseTrackStatement(callbacks);
				} else {
					this.consumeRemainingLine(this.peek().line);
				}
				continue;
			}

			if (this.isAllowedFormSubBlockLineStart()) {
				this.consumeRemainingLine(this.peek().line);
				continue;
			}

			if (!reportedUnknown) {
				this.errors.push(new ParseError(`Unexpected token in ${blockKind} block`, this.peek()));
				reportedUnknown = true;
			}
			this.consumeRemainingLine(this.peek().line);
		}

		if (this.check(TokenType.EXIT)) {
			this.advance();
			return;
		}

		if (this.isAtEnd()) {
			this.errors.push(new ParseError(`Expected 'exit' to close ${blockKind} block`, this.previous() || startToken));
		}
	}

	private isAllowedFormSubBlockLineStart(): boolean {
		if (this.isLineCommandStart() ||
		    this.check(TokenType.VAR) ||
		    this.check(TokenType.IF) ||
		    this.check(TokenType.ELSE) ||
		    this.check(TokenType.ELSEIF) ||
		    this.check(TokenType.ENDIF) ||
		    this.check(TokenType.DO) ||
		    this.check(TokenType.ENDDO) ||
		    this.check(TokenType.HANDLE) ||
		    this.check(TokenType.ELSEHANDLE) ||
		    this.check(TokenType.ENDHANDLE)) {
			return true;
		}

		return this.check(TokenType.IDENTIFIER) &&
		       ['add', 'callback', 'path', 'prompt', 'title'].includes(this.peek().value.toLowerCase());
	}

	private isFormDeclarationStart(): boolean {
		const token = this.peek();
		return token.type === TokenType.MEMBER ||
		       token.type === TokenType.FRAME ||
		       token.type === TokenType.BUTTON ||
		       token.type === TokenType.TEXT ||
		       token.type === TokenType.COMBO ||
		       token.type === TokenType.CONTAINER ||
		       token.type === TokenType.MENU ||
		       token.type === TokenType.PARA ||
		       token.type === TokenType.PARAGRAPH ||
		       token.type === TokenType.TRACK ||
		       token.type === TokenType.OPTION ||
		       token.type === TokenType.TOGGLE ||
		       token.type === TokenType.EXIT ||
		       token.type === TokenType.DEFINE;
	}

	private isOnLine(line: number): boolean {
		return !this.isAtEnd() && this.peek().line === line;
	}

	/**
	 * Parse parameters
	 */
	private parseParameters(): Parameter[] {
		const params: Parameter[] = [];

		if (this.check(TokenType.RPAREN)) {
			return params; // No parameters
		}

		do {
			// Parameter: !paramName [is TYPE]
			if (this.check(TokenType.LOCAL_VAR)) {
				const paramToken = this.advance();
				const paramName = paramToken.value.substring(1); // Remove !

				// Optional type annotation: is TYPE
				let paramType: PMLType | undefined = undefined;
				if (this.check(TokenType.IS)) {
					this.advance(); // consume 'is'
					paramType = this.parseType();
				}

				params.push({
					type: 'Parameter',
					name: paramName,
					paramType: paramType,
					range: this.createRange(this.getTokenIndex(paramToken), this.getTokenIndex(this.previous()))
				});
			} else {
				throw this.error(this.peek(), "Expected parameter name (e.g., !param)");
			}

			// Check for comma (more parameters)
			if (!this.check(TokenType.COMMA)) {
				break;
			}
			this.advance(); // consume comma

		} while (!this.isAtEnd());

		return params;
	}

	/**
	 * Parse type annotation (STRING, REAL, BOOLEAN, ARRAY, etc.)
	 */
	private parseType(): PMLType {
		const typeToken = this.peek();

		if (this.match(TokenType.STRING_TYPE)) {
			return createStringType();
		}
		if (this.match(TokenType.REAL_TYPE)) {
			return createRealType();
		}
		if (this.match(TokenType.BOOLEAN_TYPE)) {
			return { kind: 'BOOLEAN' };
		}
		if (this.match(TokenType.INTEGER_TYPE)) {
			return createIntegerType();
		}
		if (this.match(TokenType.ARRAY_TYPE)) {
			return createArrayType(createAnyType());
		}
		if (this.match(TokenType.DBREF_TYPE)) {
			return { kind: 'DBREF' };
		}
		if (this.match(TokenType.ANY_TYPE)) {
			return createAnyType();
		}
		if (this.match(TokenType.FORM)) {
			return createAnyType();
		}
		if (this.isCustomKeywordType()) {
			this.advance();
			return createAnyType();
		}

		if (this.check(TokenType.IDENTIFIER)) {
			const typeName = this.advance().value.toUpperCase();

			switch (typeName) {
				case 'STRING':
					return createStringType();
				case 'REAL':
					return createRealType();
				case 'BOOLEAN':
					return { kind: 'BOOLEAN' };
				case 'INTEGER':
					return createIntegerType();
				case 'ARRAY':
					return createArrayType(createAnyType());
				case 'DBREF':
					return { kind: 'DBREF' };
				default:
					return createAnyType();
			}
		}

		throw this.error(typeToken, "Expected type name (STRING, REAL, BOOLEAN, ARRAY, DBREF)");
	}

	private isCustomKeywordType(): boolean {
		return FORM_GADGET_TOKEN_TYPES.has(this.peek().type);
	}

	/**
	 * Parse statement
	 */
	private parseStatement(): Statement | null {
		this.skipTrivia();

		if (this.isAtEnd()) return null;

		// if statement
		if (this.check(TokenType.IF)) {
			return this.parseIfStatement();
		}

		// do loop
		if (this.check(TokenType.DO)) {
			return this.parseDoStatement();
		}

		// handle error
		if (this.check(TokenType.HANDLE)) {
			return this.parseHandleStatement();
		}

		// return
		if (this.check(TokenType.RETURN)) {
			return this.parseReturnStatement();
		}

		// break
		if (this.check(TokenType.BREAK)) {
			const token = this.advance();
			return {
				type: 'BreakStatement',
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		// continue
		if (this.check(TokenType.CONTINUE)) {
			const token = this.advance();
			return {
				type: 'ContinueStatement',
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		// skip (with optional if condition)
		if (this.check(TokenType.SKIP)) {
			return this.parseSkipStatement();
		}

		// $P line command: everything after $P on the same line is text output.
		if (this.isPrintLineCommandStart()) {
			return this.parseLineCommandStatement();
		}

		if (this.isTraceLineCommandStart()) {
			return this.parseLineCommandStatement();
		}

		if (this.isMalformedTraceAssignmentStart()) {
			throw this.error(this.peekNext(), "Expected '+' or '-' after trace control");
		}

		if (this.isMissingDefineFunctionStart()) {
			throw this.error(this.peek(), "Expected 'define' before 'function'");
		}

		if (this.isBlockedRestrictedCommandStart()) {
			throw this.error(this.peek(), `Expected AVEVA command context for '${this.peek().value}'`);
		}

		if (this.isLineCommandStart()) {
			return this.parseLineCommandStatement();
		}

		// var statement - consume 'var' and parse the following statement
		if (this.check(TokenType.VAR)) {
			const varToken = this.advance(); // consume 'var'
			// After 'var', expect variable declaration/assignment
			if (this.check(TokenType.LOCAL_VAR) || this.check(TokenType.GLOBAL_VAR)) {
				const stmt = this.parseVariableDeclarationOrAssignment();
				if (stmt.type === 'ExpressionStatement' && this.peek().line === varToken.line) {
					const isComposeStatement = this.check(TokenType.COMPOSE) || this.restOfLineContainsToken(varToken.line, TokenType.COMPOSE);
					this.consumeRemainingLine(varToken.line);
					if (isComposeStatement) {
						this.consumeComposeContinuationLines();
					}
				}
				return stmt;
			}
			// If not a variable, treat as expression statement
			return this.parseExpressionStatement();
		}

		// Variable declaration or assignment
		if (this.check(TokenType.LOCAL_VAR) || this.check(TokenType.GLOBAL_VAR)) {
			return this.parseVariableDeclarationOrAssignment();
		}

		// Expression statement (method calls, etc.)
		return this.parseExpressionStatement();
	}

	/**
	 * Parse if statement
	 */
	private parseIfStatement(): IfStatement {
		const previousContext = this.parsingContext;
		this.parsingContext = 'condition';

		// Accept either 'if' or 'elseif' (for recursive elseif handling)
		let startToken: Token;
		if (this.check(TokenType.IF)) {
			startToken = this.advance();
		} else if (this.check(TokenType.ELSEIF)) {
			startToken = this.advance();
		} else {
			throw this.error(this.peek(), "Expected 'if' or 'elseif'");
		}

		// Condition (expression before 'then')
		const test = this.parseExpression();

		this.consume(TokenType.THEN, "Expected 'then' after if condition");

		// Consequent (if body)
		const consequent: Statement[] = [];
		while (!this.check(TokenType.ELSE) &&
		       !this.check(TokenType.ELSEIF) &&
		       !this.check(TokenType.ENDIF) &&
		       !this.isDefinitionBoundary() &&
		       !this.isAtEnd()) {
			try {
				const stmt = this.parseStatement();
				if (stmt) {
					consequent.push(stmt);
				}
			} catch (error) {
				// Error recovery: skip to end of line and continue
				this.synchronize();
				// If we hit ELSE/ELSEIF/ENDIF during synchronize, break
				if (this.check(TokenType.ELSE) ||
				    this.check(TokenType.ELSEIF) ||
				    this.check(TokenType.ENDIF) ||
				    this.isDefinitionBoundary()) {
					break;
				}
			}
		}

		// Alternate (else/elseif)
		let alternate: Statement[] | IfStatement | undefined;
		let endToken: Token;

		if (this.check(TokenType.ELSEIF)) {
			// Recursive: elseif is another if statement
			// Note: The recursive call handles its own endif, so we don't consume it here
			alternate = this.parseIfStatement();
			// Use a placeholder for endToken since the recursive call consumed the actual endif
			endToken = this.previous();
		} else {
			if (this.check(TokenType.ELSE)) {
				this.advance(); // consume 'else'
				alternate = [];
				while (!this.check(TokenType.ENDIF) && !this.isDefinitionBoundary() && !this.isAtEnd()) {
					try {
						const stmt = this.parseStatement();
						if (stmt) {
							alternate.push(stmt);
						}
					} catch (error) {
						// Error recovery: skip to end of line and continue
						this.synchronize();
						// If we hit ENDIF during synchronize, break
						if (this.check(TokenType.ENDIF) || this.isDefinitionBoundary()) {
							break;
						}
					}
				}
			}
			// Consume endif for this if/else block
			if (this.check(TokenType.ENDIF)) {
				endToken = this.advance();
			} else {
				endToken = this.isAtEnd() ? this.previous() : this.peek();
				const diagnosticToken = this.isAtEnd() ? endToken : this.peek();
				this.errors.push(new ParseError(`Expected 'endif' before '${diagnosticToken.value || 'EOF'}'`, diagnosticToken));
			}
		}

		this.parsingContext = previousContext;

		return {
			type: 'IfStatement',
			test,
			consequent,
			alternate,
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	/**
	 * Parse skip statement (skip or skip if condition)
	 * Note: In PML, 'skip' is essentially the same as 'continue'
	 * 'skip if' conditionally skips to next iteration without 'then' keyword
	 */
	private parseSkipStatement(): Statement {
		const token = this.advance(); // consume 'skip'

		// Check if there's an 'if' condition
		if (this.check(TokenType.IF)) {
			this.advance(); // consume 'if'
			const condition = this.parseExpression();

			// skip if doesn't require 'then' - treat as conditional continue
			// For AST purposes, we treat this as a continue statement
			// (the condition is parsed but not stored in the AST)
			return {
				type: 'ContinueStatement',
				range: this.createRange(this.getTokenIndex(token), this.current - 1)
			};
		}

		// Plain skip without condition
		return {
			type: 'ContinueStatement',
			range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
		};
	}

	/**
	 * Parse do statement
	 */
	private parseDoStatement(): DoStatement {
		const previousContext = this.parsingContext;
		this.parsingContext = 'loop';

		const startToken = this.consume(TokenType.DO, "Expected 'do'");

		let variant: 'values' | 'index' | 'from-to' | 'while' = 'while';
		let variable: Identifier | undefined;
		let collection: Expression | undefined;
		let from: Expression | undefined;
		let to: Expression | undefined;
		let by: Expression | undefined;
		let condition: Expression | undefined;

		// Check variant
		if (this.check(TokenType.LOCAL_VAR)) {
			const varToken = this.advance();
			variable = {
				type: 'Identifier',
				name: varToken.value.substring(1),
				scope: 'local',
				range: this.createRange(this.getTokenIndex(varToken), this.getTokenIndex(varToken))
			};

			if (this.check(TokenType.VALUES)) {
				this.advance();
				variant = 'values';
				collection = this.parseExpression();
			} else if (this.check(TokenType.INDEX)) {
				this.advance();
				variant = 'index';
				collection = this.parseExpression();
			} else if (this.check(TokenType.INDICES)) {
				this.advance();
				variant = 'index';
				collection = this.parseExpression();
			} else if (this.check(TokenType.FROM)) {
				this.advance();
				variant = 'from-to';
				from = this.parseExpression();
				this.consume(TokenType.TO, "Expected 'to' in do-from-to");
				to = this.parseExpression();
				// Optional: by step
				if (this.check(TokenType.BY)) {
					this.advance();
					by = this.parseExpression();
				}
			} else if (this.check(TokenType.TO)) {
				this.advance();
				variant = 'from-to';
				to = this.parseExpression();
			}
		} else if (this.check(TokenType.WHILE)) {
			this.advance();
			variant = 'while';
			condition = this.parseExpression();
		}

		// Body
		const body: Statement[] = [];
		while (!this.check(TokenType.ENDDO) && !this.isDefinitionBoundary() && !this.isAtEnd()) {
			try {
				const stmt = this.parseStatement();
				if (stmt) {
					body.push(stmt);
				}
			} catch (error) {
				// Error recovery: skip to end of line and continue
				this.synchronize();
				// If we hit ENDDO during synchronize, break
				if (this.check(TokenType.ENDDO) || this.isDefinitionBoundary()) {
					break;
				}
			}
		}

		let endToken: Token;
		if (this.check(TokenType.ENDDO)) {
			endToken = this.advance();
		} else {
			endToken = this.isAtEnd() ? this.previous() : this.peek();
			const diagnosticToken = this.isAtEnd() ? endToken : this.peek();
			this.errors.push(new ParseError(`Expected 'enddo' before '${diagnosticToken.value || 'EOF'}'`, diagnosticToken));
		}

		this.parsingContext = previousContext;

		return {
			type: 'DoStatement',
			variant,
			variable,
			collection,
			from,
			to,
			by,
			condition,
			body,
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	/**
	 * Parse handle statement
	 */
	private parseHandleStatement(): HandleStatement {
		const startToken = this.consume(TokenType.HANDLE, "Expected 'handle'");

		// Error type (usually 'any')
		const errorTypeToken = this.advance();
		const errorType = errorTypeToken.value;
		this.consumeRemainingLine(startToken.line);

		// Body
		const body: Statement[] = [];
		while (!this.check(TokenType.ELSEHANDLE) &&
		       !this.check(TokenType.ENDHANDLE) &&
		       !this.isDefinitionBoundary() &&
		       !this.isAtEnd()) {
			try {
				const stmt = this.parseStatement();
				if (stmt) {
					body.push(stmt);
				}
			} catch (error) {
				// Error recovery: skip to end of line and continue
				this.synchronize();
				// If we hit ELSEHANDLE/ENDHANDLE during synchronize, break
				if (this.check(TokenType.ELSEHANDLE) || this.check(TokenType.ENDHANDLE) || this.isDefinitionBoundary()) {
					break;
				}
			}
		}

		// Alternate (elsehandle). PML can chain several elsehandle clauses.
		let alternate: Statement[] | undefined;
		if (this.check(TokenType.ELSEHANDLE)) {
			alternate = [];
			while (this.check(TokenType.ELSEHANDLE) && !this.isAtEnd()) {
				const elseHandleToken = this.advance();
				this.consumeRemainingLine(elseHandleToken.line);

				while (!this.check(TokenType.ELSEHANDLE) &&
				       !this.check(TokenType.ENDHANDLE) &&
				       !this.isDefinitionBoundary() &&
				       !this.isAtEnd()) {
					try {
						const stmt = this.parseStatement();
						if (stmt) {
							alternate.push(stmt);
						}
					} catch (error) {
						// Error recovery: skip to end of line and continue
						this.synchronize();
						// If we hit ELSEHANDLE/ENDHANDLE during synchronize, continue with the enclosing handle parser
						if (this.check(TokenType.ELSEHANDLE) || this.check(TokenType.ENDHANDLE) || this.isDefinitionBoundary()) {
							break;
						}
					}
				}
			}
		}

		let endToken: Token;
		if (this.check(TokenType.ENDHANDLE)) {
			endToken = this.advance();
		} else {
			endToken = this.isAtEnd() ? this.previous() : this.peek();
			const diagnosticToken = this.isAtEnd() ? endToken : this.peek();
			this.errors.push(new ParseError(`Expected 'endhandle' before '${diagnosticToken.value || 'EOF'}'`, diagnosticToken));
		}

		return {
			type: 'HandleStatement',
			errorType,
			body,
			alternate,
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	/**
	 * Parse return statement
	 */
	private parseReturnStatement(): ReturnStatement {
		const token = this.consume(TokenType.RETURN, "Expected 'return'");

		// Check if there's a return value on the same physical line.
		let argument: Expression | undefined;
		if (!this.isAtEnd() && this.peek().line === token.line) {
			argument = this.parseExpression();
		}

		return {
			type: 'ReturnStatement',
			argument,
			range: this.createRange(this.getTokenIndex(token), this.current - 1)
		};
	}

	/**
	 * Parse variable declaration or assignment
	 */
	private parseVariableDeclarationOrAssignment(): VariableDeclaration | ExpressionStatement {
		const varToken = this.advance();
		const isGlobal = varToken.type === TokenType.GLOBAL_VAR;
		const varName = varToken.value.substring(isGlobal ? 2 : 1);

		// Build the left side - could be just variable or array access
		let left: Identifier | MemberExpression = {
			type: 'Identifier',
			name: varName,
			scope: isGlobal ? 'global' : 'local',
			range: this.createRange(this.getTokenIndex(varToken), this.getTokenIndex(varToken))
		};

		// Handle array indexing: !var[index] or !var[index1][index2]...
		while (this.check(TokenType.LBRACKET)) {
			this.advance(); // consume [
			const indexExpr = this.parseExpression();
			const rbracket = this.consume(TokenType.RBRACKET, "Expected ']' after array index");

			left = {
				type: 'MemberExpression',
				object: left,
				property: indexExpr,
				computed: true,
				range: {
					start: left.range.start,
					end: { line: rbracket.line - 1, character: rbracket.column - 1 + rbracket.length }
				}
			};
		}

		// Handle property chains at statement start: !this.value = ..., !object.method().
		while (true) {
			if (this.match(TokenType.LBRACKET)) {
				const indexExpr = this.parseExpression();
				const rbracket = this.consume(TokenType.RBRACKET, "Expected ']' after array index");

				left = {
					type: 'MemberExpression',
					object: left,
					property: indexExpr,
					computed: true,
					range: {
						start: left.range.start,
						end: { line: rbracket.line - 1, character: rbracket.column - 1 + rbracket.length }
					}
				};
				continue;
			}

			if (this.match(TokenType.METHOD)) {
				const methodToken = this.previous();
				left = this.createPropertyAccess(left, methodToken, methodToken.value.substring(1));
				continue;
			}

			if (this.match(TokenType.DOT)) {
				const dotToken = this.previous();
				const propertyAccess = this.parsePropertyAfterDot(left, dotToken);
				if (!propertyAccess) {
					break;
				}
				left = propertyAccess;
				continue;
			}

			break;
		}

		if (this.check(TokenType.LPAREN)) {
			return this.parseCallFromExpression(left);
		}

		// Check for assignment
		if (this.check(TokenType.ASSIGN)) {
			this.advance(); // consume =

			const initializer = this.consumePml1ArgumentPhrase(this.parseExpression());
			this.rejectUnexpectedTrailingIs(varToken.line);

			// If left is just an Identifier, return VariableDeclaration
			if (left.type === 'Identifier') {
				const varDecl: VariableDeclaration = {
					type: 'VariableDeclaration',
					name: varName,
					scope: isGlobal ? 'global' : 'local',
					initializer,
					range: this.createRange(this.getTokenIndex(varToken), this.current - 1)
				};
				return varDecl;
			}

			// Otherwise it's array assignment - return ExpressionStatement with AssignmentExpression
			return {
				type: 'ExpressionStatement',
				expression: {
					type: 'AssignmentExpression',
					left,
					right: initializer,
					operator: '=',
					range: this.createRangeFromNodes(left, initializer)
				},
				range: this.createRangeFromNodes(left, initializer)
			};
		} else {
			// Just a variable/array reference (expression statement)
			return {
				type: 'ExpressionStatement',
				expression: left,
				range: left.range
			};
		}
	}

	private parseLineCommandStatement(): ExpressionStatement {
		const startToken = this.advance();
		let endToken = startToken;

		while (!this.isAtEnd() && this.peek().line === startToken.line) {
			endToken = this.advance();
		}

		return {
			type: 'ExpressionStatement',
			expression: {
				type: 'Identifier',
				name: this.sourceText.slice(startToken.offset, endToken.offset + endToken.length).trim(),
				range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
			},
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	private consumeRemainingLine(line: number): void {
		while (!this.isAtEnd() && this.peek().line === line) {
			this.advance();
		}
	}

	private consumeComposeContinuationLines(): void {
		while (!this.isAtEnd() && this.check(TokenType.STRING) && this.peek().continuesPreviousLine) {
			this.consumeRemainingLine(this.peek().line);
		}
	}

	private parseCallFromExpression(callee: Identifier | MemberExpression): ExpressionStatement {
		const startPos = callee.range.start;
		this.advance(); // consume (
		const args = this.parseArguments();
		const rparen = this.consume(TokenType.RPAREN, "Expected ')' after arguments");

		let expression: Expression = {
			type: 'CallExpression',
			callee,
			arguments: args,
			range: {
				start: startPos,
				end: { line: rparen.line - 1, character: rparen.column - 1 + rparen.length }
			}
		};

		while (true) {
			if (this.match(TokenType.LPAREN)) {
				const args = this.parseArguments();
				const rparen = this.consume(TokenType.RPAREN, "Expected ')' after arguments");
				expression = {
					type: 'CallExpression',
					callee: expression,
					arguments: args,
					range: {
						start: expression.range.start,
						end: { line: rparen.line - 1, character: rparen.column - 1 + rparen.length }
					}
				};
				continue;
			}

			if (this.match(TokenType.METHOD)) {
				const methodToken = this.previous();
				expression = this.createPropertyAccess(expression, methodToken, methodToken.value.substring(1));
				continue;
			}

			if (this.match(TokenType.DOT)) {
				const dotToken = this.previous();
				const propertyAccess = this.parsePropertyAfterDot(expression, dotToken);
				if (!propertyAccess) {
					break;
				}
				expression = propertyAccess;
				continue;
			}

			if (this.match(TokenType.LBRACKET)) {
				const indexExpr = this.parseExpression();
				const endBracket = this.consume(TokenType.RBRACKET, "Expected ']' after array index");
				expression = {
					type: 'MemberExpression',
					object: expression,
					property: indexExpr,
					computed: true,
					range: {
						start: expression.range.start,
						end: { line: endBracket.line - 1, character: endBracket.column - 1 + endBracket.length }
					}
				};
				continue;
			}

			break;
		}

		if (this.match(TokenType.ASSIGN)) {
			const right = this.parseExpression();
			expression = {
				type: 'AssignmentExpression',
				left: expression as Identifier | MemberExpression,
				right,
				operator: '=',
				range: this.createRangeFromNodes(expression, right)
			};
		}

		return {
			type: 'ExpressionStatement',
			expression,
			range: expression.range
		};
	}

	/**
	 * Parse expression statement
	 */
	private parseExpressionStatement(): ExpressionStatement | null {
		// Check for assignment expression first: !var[index] = value or !var = value
		const expr = this.parseAssignment();
		if (!expr) return null;

		return {
			type: 'ExpressionStatement',
			expression: expr,
			range: expr.range
		};
	}

	/**
	 * Parse assignment expression (!var = value, !var[index] = value)
	 * Assignment has lower precedence than logical operators
	 */
	private parseAssignment(): Expression {
		// Parse left side (identifier or member expression)
		const left = this.parseLogicalOr();

		// Check if this is an assignment
		if (this.match(TokenType.ASSIGN)) {
			const assignToken = this.previous();
			const right = this.consumePml1ArgumentPhrase(this.parseAssignment()); // Right-associative: a = b = c

			// Validate left side - must be identifier or member expression
			if (left.type !== 'Identifier' && left.type !== 'MemberExpression') {
				throw this.error(assignToken, "Invalid assignment target");
			}

			return {
				type: 'AssignmentExpression',
				left: left as Identifier | MemberExpression,
				right,
				operator: '=',
				range: this.createRangeFromNodes(left, right)
			};
		}

		return left;
	}

	/**
	 * Parse expression (with operator precedence)
	 */
	private parseExpression(): Expression {
		return this.parseLogicalOr();
	}

	/**
	 * Parse logical OR
	 */
	private parseLogicalOr(): Expression {
		let left = this.parseLogicalAnd();

		while (this.match(TokenType.OR)) {
			const operator = this.previous().value;
			const right = this.parseLogicalAnd();
			left = {
				type: 'BinaryExpression',
				operator,
				left,
				right,
				range: this.createRangeFromNodes(left, right)
			};
		}

		return left;
	}

	/**
	 * Parse logical AND
	 */
	private parseLogicalAnd(): Expression {
		let left = this.parseEquality();

		while (this.match(TokenType.AND)) {
			const operator = this.previous().value;
			const right = this.parseEquality();
			left = {
				type: 'BinaryExpression',
				operator,
				left,
				right,
				range: this.createRangeFromNodes(left, right)
			};
		}

		return left;
	}

	/**
	 * Parse equality (eq, ne)
	 */
	private parseEquality(): Expression {
		let left = this.parseComparison();

		while (this.match(TokenType.EQ, TokenType.NE)) {
			const operator = this.previous().value;
			const right = this.parseComparison();
			left = {
				type: 'BinaryExpression',
				operator,
				left,
				right,
				range: this.createRangeFromNodes(left, right)
			};
		}

		return left;
	}

	/**
	 * Parse comparison (gt, lt, ge, le)
	 */
	private parseComparison(): Expression {
		let left = this.parseOf();

		while (this.match(TokenType.GT, TokenType.LT, TokenType.GE, TokenType.LE, TokenType.INSET)) {
			const operator = this.previous().value;
			const right = operator.toLowerCase() === 'inset' ? this.parseInsetList() : this.parseOf();
			left = {
				type: 'BinaryExpression',
				operator,
				left,
				right,
				range: this.createRangeFromNodes(left, right)
			};
		}

		return left;
	}

	private parseInsetList(): Expression {
		if (!this.check(TokenType.LPAREN)) {
			return this.parseOf();
		}

		const startToken = this.advance();
		let depth = 1;
		let endToken = startToken;

		while (!this.isAtEnd() && depth > 0) {
			const token = this.advance();
			endToken = token;
			if (token.type === TokenType.LPAREN) {
				depth++;
			} else if (token.type === TokenType.RPAREN) {
				depth--;
			}
		}

		return {
			type: 'Identifier',
			name: this.sourceText.slice(startToken.offset, endToken.offset + endToken.length),
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	/**
	 * Parse 'of' operator (namn of zone, name of $!element)
	 */
	private parseOf(): Expression {
		let left = this.parseAddition();

		while (this.match(TokenType.OF)) {
			const operator = this.previous().value;
			const right = this.parseAddition();
			left = {
				type: 'BinaryExpression',
				operator,
				left,
				right,
				range: this.createRangeFromNodes(left, right)
			};
		}

		return left;
	}

	/**
	 * Parse addition/subtraction
	 */
	private parseAddition(): Expression {
		let left = this.parseMultiplication();

		while (this.match(TokenType.PLUS, TokenType.MINUS, TokenType.CONCAT)) {
			const operator = this.previous().value;
			const right = this.parseMultiplication();
			left = {
				type: 'BinaryExpression',
				operator,
				left,
				right,
				range: this.createRangeFromNodes(left, right)
			};
		}

		return left;
	}

	/**
	 * Parse multiplication/division/mod
	 */
	private parseMultiplication(): Expression {
		let left = this.parsePower();

		while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.MOD, TokenType.DIV)) {
			const operator = this.previous().value;
			const right = this.parsePower();
			left = {
				type: 'BinaryExpression',
				operator,
				left,
				right,
				range: this.createRangeFromNodes(left, right)
			};
		}

		return left;
	}

	/**
	 * Parse power (**)
	 */
	private parsePower(): Expression {
		let left = this.parseUnary();

		while (this.match(TokenType.POWER)) {
			const operator = this.previous().value;
			const right = this.parseUnary();
			left = {
				type: 'BinaryExpression',
				operator,
				left,
				right,
				range: this.createRangeFromNodes(left, right)
			};
		}

		return left;
	}

	/**
	 * Parse unary (not, -, +)
	 */
	private parseUnary(): Expression {
		if (this.match(TokenType.NOT, TokenType.MINUS, TokenType.PLUS)) {
			const operator = this.previous().value;
			const argument = this.parseUnary();
			return {
				type: 'UnaryExpression',
				operator,
				argument,
				prefix: true,
				range: this.createRange(this.current - 1, this.current)
			};
		}

		return this.parseCall();
	}

	/**
	 * Parse call expression (.method() or object())
	 */
	private parseCall(): Expression {
		let expr = this.parseMember();

		// PML commonly chains method calls and property access:
		// !this.link.Unset().Not(), !!ce.Position.Wrt(!this.link), !arr[1].Name()
		while (true) {
			if (this.match(TokenType.LPAREN)) {
				const args = this.parseArguments();
				const rparen = this.consume(TokenType.RPAREN, "Expected ')' after arguments");

				expr = {
					type: 'CallExpression',
					callee: expr,
					arguments: args,
					range: {
						start: expr.range.start,
						end: { line: rparen.line - 1, character: rparen.column - 1 + rparen.length }
					}
				};
				continue;
			}

			if (this.match(TokenType.METHOD)) {
				const methodToken = this.previous();
				expr = this.createPropertyAccess(expr, methodToken, methodToken.value.substring(1));
				continue;
			}

			if (this.match(TokenType.DOT)) {
				const dotToken = this.previous();
				const propertyAccess = this.parsePropertyAfterDot(expr, dotToken);
				if (!propertyAccess) {
					break;
				}
				expr = propertyAccess;
				continue;
			}

			if (this.match(TokenType.LBRACKET)) {
				const indexExpr = this.parseExpression();
				const rbracket = this.consume(TokenType.RBRACKET, "Expected ']' after array index");
				expr = {
					type: 'MemberExpression',
					object: expr,
					property: indexExpr,
					computed: true,
					range: {
						start: expr.range.start,
						end: { line: rbracket.line - 1, character: rbracket.column - 1 + rbracket.length }
					}
				};
				continue;
			}

			break;
		}

		return expr;
	}

	private createPropertyAccess(object: Expression, propertyToken: Token, propertyName: string): MemberExpression {
		return {
			type: 'MemberExpression',
			object,
			property: {
				type: 'Identifier',
				name: propertyName,
				range: this.createRange(this.getTokenIndex(propertyToken), this.getTokenIndex(propertyToken))
			},
			computed: false,
			range: {
				start: object.range.start,
				end: { line: propertyToken.line - 1, character: propertyToken.column - 1 + propertyToken.length }
			}
		};
	}

	private parsePropertyAfterDot(object: Expression, dotToken: Token): MemberExpression | undefined {
		if (this.check(TokenType.IDENTIFIER)) {
			const propertyToken = this.advance();
			return this.createPropertyAccess(object, propertyToken, propertyToken.value);
		}

		if (this.check(TokenType.SUBSTITUTE_VAR)) {
			const propertyToken = this.advance();
			return this.createPropertyAccess(object, propertyToken, propertyToken.value);
		}

		if (this.match(TokenType.COLON)) {
			const colonToken = this.previous();
			const attributeToken = this.consume(TokenType.IDENTIFIER, "Expected attribute name after '.:'");
			return this.createNamedPropertyAccess(object, colonToken, attributeToken, `:${attributeToken.value}`);
		}

		if (this.isRecoverableMissingProperty(dotToken)) {
			return undefined;
		}

		throw this.error(this.peek(), "Expected property name after '.'");
	}

	private createNamedPropertyAccess(object: Expression, startToken: Token, endToken: Token, propertyName: string): MemberExpression {
		return {
			type: 'MemberExpression',
			object,
			property: {
				type: 'Identifier',
				name: propertyName,
				range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
			},
			computed: false,
			range: {
				start: object.range.start,
				end: { line: endToken.line - 1, character: endToken.column - 1 + endToken.length }
			}
		};
	}

	private isDefinitionBoundary(): boolean {
		return this.check(TokenType.DEFINE) ||
		       this.check(TokenType.ENDMETHOD) ||
		       this.check(TokenType.ENDFUNCTION) ||
		       this.check(TokenType.ENDOBJECT);
	}

	/**
	 * Parse member expression (!var.method, !arr[index])
	 */
	private parseMember(): Expression {
		let expr = this.parsePrimary();
		const startPos = expr.range.start;

		while (true) {
			// Handle METHOD tokens directly (.eq, .ne, .output, etc.)
			// The lexer tokenizes ".eq" as a single METHOD token, not DOT + IDENTIFIER
			if (this.match(TokenType.METHOD)) {
				const methodToken = this.previous();
				const propertyName = methodToken.value.substring(1); // Remove leading dot

				expr = {
					type: 'MemberExpression',
					object: expr,
					property: {
						type: 'Identifier',
						name: propertyName,
						range: this.createRange(this.getTokenIndex(methodToken), this.getTokenIndex(methodToken))
					},
					computed: false,
					range: {
						start: startPos,
						end: { line: methodToken.line - 1, character: methodToken.column - 1 + methodToken.length }
					}
				};
			} else if (this.match(TokenType.DOT)) {
				const dotToken = this.previous();
				const propertyAccess = this.parsePropertyAfterDot(expr, dotToken);
				if (!propertyAccess) {
					break;
				}
				expr = propertyAccess;
			} else if (this.match(TokenType.LBRACKET)) {
				// Array access: [index]
				const lbracketPos = this.current - 1;
				const indexExpr = this.parseExpression();
				const rbracket = this.consume(TokenType.RBRACKET, "Expected ']' after array index");
				expr = {
					type: 'MemberExpression',
					object: expr,
					property: indexExpr, // Store the actual index expression
					computed: true,
					range: {
						start: startPos,
						end: { line: rbracket.line - 1, character: rbracket.column - 1 + rbracket.length }
					}
				};
			} else {
				break;
			}
		}

		return expr;
	}

	private isRecoverableMissingProperty(dotToken: Token): boolean {
		const nextToken = this.peek();
		return nextToken.type === TokenType.EOF ||
		       nextToken.type === TokenType.NEWLINE ||
		       nextToken.line !== dotToken.line;
	}

	/**
	 * Parse primary expression (literals, variables, etc.)
	 */
	private parsePrimary(): Expression {
		// WORKAROUND: Skip 'compose' and 'space' keywords (PML1 syntax)
		// These are used in "var !x compose space $!var |string|" which we don't fully parse yet
		if (this.check(TokenType.COMPOSE) || this.check(TokenType.SPACE)) {
			const startToken = this.advance();
			// Skip entire compose expression including all parts
			while (!this.isAtEnd()) {
				// Consume all compose-related tokens
				if (this.check(TokenType.COMPOSE) ||
				    this.check(TokenType.SPACE) ||
				    this.check(TokenType.IDENTIFIER) ||
				    this.check(TokenType.SUBSTITUTE_VAR) ||
				    this.check(TokenType.STRING) ||
				    this.check(TokenType.NUMBER) ||
				    this.check(TokenType.PLUS) ||
				    this.check(TokenType.MINUS) ||
				    this.check(TokenType.LEFT) ||
				    this.check(TokenType.RIGHT)) {
					this.advance();
				} else {
					// Stop at any other token (likely end of compose expression)
					break;
				}
			}
			// Return dummy identifier to avoid parse errors
			return {
				type: 'Identifier',
				name: 'compose_expression',
				range: this.createRange(this.getTokenIndex(startToken), this.current - 1)
			};
		}

		// String literal
		if (this.match(TokenType.STRING)) {
			const token = this.previous();
			return {
				type: 'Literal',
				value: token.value,
				literalType: 'string',
				pmlType: createStringType(),
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		// Number literal
		if (this.match(TokenType.NUMBER)) {
			const token = this.previous();
			if (this.check(TokenType.IDENTIFIER) && this.peek().offset === token.offset + token.length) {
				const unitToken = this.advance();
				return {
					type: 'Literal',
					value: token.value + unitToken.value,
					literalType: 'number',
					pmlType: createRealType(),
					range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(unitToken))
				};
			}

			return {
				type: 'Literal',
				value: parseFloat(token.value),
				literalType: 'number',
				pmlType: createRealType(),
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		// Boolean literal
		if (this.match(TokenType.BOOLEAN)) {
			const token = this.previous();
			return {
				type: 'Literal',
				value: token.value.toLowerCase() === 'true',
				literalType: 'boolean',
				pmlType: createBooleanType(),
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		if (this.isDbRefLiteralStart()) {
			return this.parseDbRefLiteral();
		}

		// Variable substitution ($!var, $!!global, $/attribute, $identifier)
		if (this.check(TokenType.SUBSTITUTE_VAR)) {
			const token = this.peek();
			if (!/^\$(?:!!?[A-Za-z_][A-Za-z0-9_]*|!<[^>\r\n]+>|\/[A-Za-z_][A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*)$/.test(token.value)) {
				throw this.error(token, "Expected variable substitution (e.g., $!var)");
			}

			this.advance();
			return {
				type: 'Identifier',
				name: token.value,
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		// Variable
		if (this.match(TokenType.LOCAL_VAR, TokenType.GLOBAL_VAR)) {
			const token = this.previous();
			const isGlobal = token.type === TokenType.GLOBAL_VAR;
			return {
				type: 'Identifier',
				name: token.value.substring(isGlobal ? 2 : 1),
				scope: isGlobal ? 'global' : 'local',
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		// Method call (starts with dot)
		if (this.match(TokenType.METHOD)) {
			const token = this.previous();
			return {
				type: 'Identifier',
				name: token.value.substring(1),
				scope: 'method',
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		// Object constructor: object TYPE() or object CustomType()
		if (this.match(TokenType.OBJECT)) {
			const objectToken = this.previous();

			// Next should be type constructor (STRING, ARRAY, etc.) or custom type identifier
			if (this.match(TokenType.STRING_TYPE, TokenType.REAL_TYPE, TokenType.INTEGER_TYPE,
				TokenType.BOOLEAN_TYPE, TokenType.ARRAY_TYPE, TokenType.DBREF_TYPE, TokenType.ANY_TYPE)) {
				// Built-in type: object STRING(), object ARRAY(), etc.
				const typeToken = this.previous();
				this.ensureObjectConstructorCall();
				return {
					type: 'Identifier',
					name: typeToken.value,
					objectConstructor: true,  // Mark this as an object constructor
					range: this.createRange(this.getTokenIndex(objectToken), this.getTokenIndex(typeToken))
				} as Identifier;
			} else if (this.match(TokenType.FORM)) {
				const typeToken = this.previous();
				this.ensureObjectConstructorCall();
				return {
					type: 'Identifier',
					name: typeToken.value,
					objectConstructor: true,
					range: this.createRange(this.getTokenIndex(objectToken), this.getTokenIndex(typeToken))
				} as Identifier;
			} else if (this.match(TokenType.IDENTIFIER)) {
				// Custom type: object MyCustomType()
				const typeToken = this.previous();
				this.ensureObjectConstructorCall();
				return {
					type: 'Identifier',
					name: typeToken.value,
					objectConstructor: true,
					range: this.createRange(this.getTokenIndex(objectToken), this.getTokenIndex(typeToken))
				} as Identifier;
			}

			// Just 'object' keyword alone (edge case)
			return {
				type: 'Identifier',
				name: 'object',
				range: this.createRange(this.getTokenIndex(objectToken), this.getTokenIndex(objectToken))
			};
		}

		// Type constructors (STRING(), ARRAY(), etc.)
		if (this.match(TokenType.STRING_TYPE, TokenType.REAL_TYPE, TokenType.INTEGER_TYPE,
			TokenType.BOOLEAN_TYPE, TokenType.ARRAY_TYPE, TokenType.DBREF_TYPE, TokenType.ANY_TYPE)) {
			const token = this.previous();
			return {
				type: 'Identifier',
				name: token.value,
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		if (this.check(TokenType.SLASH)) {
			return this.parsePathExpression();
		}

		// PML database attribute expression (:attribute)
		if (this.check(TokenType.COLON)) {
			return this.parseAttributeExpression();
		}

		// Identifier
		if (this.match(TokenType.IDENTIFIER)) {
			const token = this.previous();
			return {
				type: 'Identifier',
				name: token.value,
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		// Some PML built-ins share spelling with parser keywords, for example define(...)
		if (this.match(TokenType.DEFINE)) {
			const token = this.previous();
			return {
				type: 'Identifier',
				name: token.value,
				range: this.createRange(this.getTokenIndex(token), this.getTokenIndex(token))
			};
		}

		// Grouping: (expression)
		if (this.match(TokenType.LPAREN)) {
			const expr = this.parseExpression();
			this.consume(TokenType.RPAREN, "Expected ')' after expression");
			return expr;
		}

		throw this.error(this.peek(), "Expected expression");
	}

	private ensureObjectConstructorCall(): void {
		if (!this.check(TokenType.LPAREN)) {
			throw this.error(this.peek(), "Expected '(' after object constructor type");
		}
	}

	private isDbRefLiteralStart(): boolean {
		return this.check(TokenType.ASSIGN) &&
		       this.peekNext().type === TokenType.NUMBER &&
		       this.peekNext().line === this.peek().line;
	}

	private parseDbRefLiteral(): Literal {
		const startToken = this.advance();
		let endToken = startToken;

		while (!this.isAtEnd() &&
		       this.peek().line === startToken.line &&
		       [TokenType.NUMBER, TokenType.SLASH].includes(this.peek().type)) {
			endToken = this.advance();
		}

		return {
			type: 'Literal',
			value: this.sourceText.slice(startToken.offset, endToken.offset + endToken.length),
			literalType: 'dbref',
			pmlType: createDBRefType(),
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	private parseAttributeExpression(): Identifier {
		const startToken = this.advance();
		let endToken = startToken;

		while (!this.isAtEnd() && this.peek().line === startToken.line && !this.isAttributeExpressionBoundary(this.peek())) {
			endToken = this.advance();
		}

		return {
			type: 'Identifier',
			name: this.sourceText.slice(startToken.offset, endToken.offset + endToken.length),
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	private parsePathExpression(): Identifier {
		const startToken = this.advance();
		let endToken = startToken;

		if (this.check(TokenType.STAR) &&
		    this.peek().line === startToken.line &&
		    this.peek().offset === startToken.offset + startToken.length) {
			endToken = this.advance();
			while (!this.isAtEnd() &&
			       this.peek().line === startToken.line &&
			       this.peek().offset === endToken.offset + endToken.length &&
			       !this.isAdjacentPathBoundary(this.peek())) {
				endToken = this.advance();
			}
		}

		while (!this.isAtEnd() && this.peek().line === startToken.line && !this.isPathExpressionBoundary(this.peek())) {
			endToken = this.advance();
		}

		return {
			type: 'Identifier',
			name: this.sourceText.slice(startToken.offset, endToken.offset + endToken.length),
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	private isPathExpressionBoundary(token: Token): boolean {
		return token.type === TokenType.ASSIGN ||
		       token.type === TokenType.COMMA ||
		       token.type === TokenType.RPAREN ||
		       token.type === TokenType.RBRACKET ||
		       token.type === TokenType.ENDDO ||
		       token.type === TokenType.ENDIF ||
		       token.type === TokenType.ENDHANDLE ||
		       token.type === TokenType.ENDFUNCTION ||
		       token.type === TokenType.ENDMETHOD ||
		       token.type === TokenType.PLUS ||
		       token.type === TokenType.CONCAT ||
		       token.type === TokenType.STAR ||
		       token.type === TokenType.POWER ||
		       token.type === TokenType.EQ ||
		       token.type === TokenType.NE ||
		       token.type === TokenType.GT ||
		       token.type === TokenType.LT ||
		       token.type === TokenType.GE ||
		       token.type === TokenType.LE ||
		       token.type === TokenType.AND ||
		       token.type === TokenType.OR;
	}

	private isAdjacentPathBoundary(token: Token): boolean {
		return token.type === TokenType.COMMA ||
		       token.type === TokenType.RPAREN ||
		       token.type === TokenType.RBRACKET ||
		       token.type === TokenType.ASSIGN ||
		       token.type === TokenType.EOF;
	}

	private isAttributeExpressionBoundary(token: Token): boolean {
		return token.type === TokenType.OF ||
		       token.type === TokenType.ASSIGN ||
		       token.type === TokenType.COMMA ||
		       token.type === TokenType.RPAREN ||
		       token.type === TokenType.RBRACKET ||
		       token.type === TokenType.ENDDO ||
		       token.type === TokenType.ENDIF ||
		       token.type === TokenType.ENDHANDLE ||
		       token.type === TokenType.ENDFUNCTION ||
		       token.type === TokenType.ENDMETHOD ||
		       token.type === TokenType.PLUS ||
		       token.type === TokenType.MINUS ||
		       token.type === TokenType.CONCAT ||
		       token.type === TokenType.STAR ||
		       token.type === TokenType.SLASH ||
		       token.type === TokenType.POWER ||
		       token.type === TokenType.EQ ||
		       token.type === TokenType.NE ||
		       token.type === TokenType.GT ||
		       token.type === TokenType.LT ||
		       token.type === TokenType.GE ||
		       token.type === TokenType.LE ||
		       token.type === TokenType.AND ||
		       token.type === TokenType.OR;
	}

	private isLineCommandStart(): boolean {
		if (this.isAtEnd()) {
			return false;
		}

		const startToken = this.peek();
		if (!isPdmsCommandStarter(startToken.value)) {
			return false;
		}
		if (RESTRICTED_COMMAND_STARTERS.has(startToken.value.toLowerCase()) && this.mode === 'default') {
			return false;
		}

		const nextToken = this.peekNext();
		if (nextToken.line !== startToken.line) {
			return true;
		}

		if (this.restOfLineContainsToken(startToken.line, TokenType.ASSIGN)) {
			return false;
		}

		return ![
			TokenType.LPAREN,
			TokenType.DOT,
			TokenType.LBRACKET,
			TokenType.ASSIGN,
			TokenType.OF
		].includes(nextToken.type);
	}

	private isBlockedRestrictedCommandStart(): boolean {
		if (this.isAtEnd() || this.mode !== 'default') {
			return false;
		}

		const startToken = this.peek();
		if (!RESTRICTED_COMMAND_STARTERS.has(startToken.value.toLowerCase())) {
			return false;
		}

		const nextToken = this.peekNext();
		if (nextToken.line !== startToken.line) {
			return true;
		}

		return ![
			TokenType.LPAREN,
			TokenType.DOT,
			TokenType.LBRACKET,
			TokenType.ASSIGN,
			TokenType.OF
		].includes(nextToken.type);
	}

	private isMissingDefineFunctionStart(): boolean {
		if (this.mode === 'command' || !this.check(TokenType.FUNCTION)) {
			return false;
		}

		const nameToken = this.peekNext();
		const openParenToken = this.tokens[Math.min(this.current + 2, this.tokens.length - 1)];
		return nameToken.line === this.peek().line &&
		       nameToken.type === TokenType.GLOBAL_VAR &&
		       openParenToken.line === this.peek().line &&
		       openParenToken.type === TokenType.LPAREN;
	}

	private isPrintLineCommandStart(): boolean {
		if (!this.check(TokenType.SUBSTITUTE_VAR)) {
			return false;
		}

		const token = this.peek();
		const nextChar = this.sourceText[token.offset + token.length];
		return token.value.toLowerCase() === '$p' &&
		       token.length === 2 &&
		       (nextChar === undefined || /\s/.test(nextChar));
	}

	private isTraceLineCommandStart(): boolean {
		if (!this.check(TokenType.SUBSTITUTE_VAR)) {
			return false;
		}

		const token = this.peek();
		if (!/^\$t\d+$/i.test(token.value)) {
			return false;
		}

		const nextChar = this.sourceText[token.offset + token.length];
		return nextChar === '+' || nextChar === '-';
	}

	private isMalformedTraceAssignmentStart(): boolean {
		if (!this.check(TokenType.SUBSTITUTE_VAR)) {
			return false;
		}

		const token = this.peek();
		const nextToken = this.peekNext();
		return /^\$t\d+$/i.test(token.value) &&
		       nextToken.line === token.line &&
		       nextToken.type === TokenType.ASSIGN;
	}

	private restOfLineContainsToken(line: number, tokenType: TokenType): boolean {
		let offset = 1;
		while (this.current + offset < this.tokens.length) {
			const token = this.tokens[this.current + offset];
			if (token.type === TokenType.EOF || token.line !== line) {
				return false;
			}
			if (token.type === tokenType) {
				return true;
			}
			offset++;
		}
		return false;
	}

	private rejectUnexpectedTrailingIs(line: number): void {
		if (this.isOnLine(line) && this.check(TokenType.IS)) {
			throw this.error(this.peek(), "Unexpected 'is' after expression");
		}
	}

	/**
	 * Parse function call arguments
	 */
	private parseArguments(): Expression[] {
		const args: Expression[] = [];

		if (this.check(TokenType.RPAREN)) {
			return args; // No arguments
		}

		do {
			const argument = this.parseExpression();
			args.push(this.consumePml1ArgumentPhrase(this.consumeAdjacentArgumentFragments(argument)));
		} while (this.match(TokenType.COMMA));

		return args;
	}

	private consumePml1ArgumentPhrase(argument: Expression): Expression {
		const isWrtPhrase = this.check(TokenType.IDENTIFIER) && this.peek().value.toLowerCase() === 'wrt';
		const isDirectionPhrase = this.check(TokenType.IS) && this.isDirectionPrimary(argument);
		if ((!isWrtPhrase && !isDirectionPhrase) || !this.isSameSourceLine(this.peek(), argument.range)) {
			return argument;
		}

		let endToken = this.peek();
		while (!this.isAtEnd() &&
		       this.isSameSourceLine(this.peek(), argument.range) &&
		       ![TokenType.COMMA, TokenType.RPAREN, TokenType.RBRACKET].includes(this.peek().type)) {
			endToken = this.advance();
		}

		argument.range = {
			start: argument.range.start,
			end: { line: endToken.line - 1, character: endToken.column - 1 + endToken.length }
		};
		return argument;
	}

	private isDirectionPrimary(argument: Expression): boolean {
		return argument.type === 'Identifier' &&
		       argument.scope === undefined &&
		       DIRECTION_PRIMARY_NAMES.has(argument.name.toUpperCase());
	}

	private isSameSourceLine(token: Token, range: Range): boolean {
		return token.line - 1 === range.end.line;
	}

	private consumeAdjacentArgumentFragments(argument: Expression): Expression {
		if (argument.type !== 'Literal' || argument.literalType !== 'string') {
			return argument;
		}

		let endToken: Token | undefined;
		while (!this.isAtEnd() &&
		       this.peek().line === argument.range.end.line + 1 &&
		       this.peek().type !== TokenType.COMMA &&
		       this.peek().type !== TokenType.RPAREN) {
			endToken = this.advance();
		}

		if (!endToken) {
			return argument;
		}

		return {
			type: 'Identifier',
			name: 'argument_fragment',
			range: {
				start: argument.range.start,
				end: { line: endToken.line - 1, character: endToken.column - 1 + endToken.length }
			}
		};
	}

	/**
	 * Parse JSDoc documentation from preceding comments
	 * TODO: Implement comment tracking in lexer
	 */
	private parsePrecedingDocumentation(): JSDocComment | undefined {
		// For now, return undefined
		// Will be implemented when we add comment tracking
		return undefined;
	}

	/**
	 * Helper methods
	 */

	private match(...types: TokenType[]): boolean {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}
		return false;
	}

	private check(type: TokenType): boolean {
		if (this.isAtEnd()) return false;
		return this.peek().type === type;
	}

	private advance(): Token {
		if (!this.isAtEnd()) this.current++;
		return this.previous();
	}

	private isAtEnd(): boolean {
		return this.peek().type === TokenType.EOF;
	}

	private peek(): Token {
		return this.tokens[this.current];
	}

	private peekNext(): Token {
		return this.tokens[Math.min(this.current + 1, this.tokens.length - 1)];
	}

	private previous(): Token {
		return this.tokens[this.current - 1];
	}

	private consume(type: TokenType, message: string): Token {
		if (this.check(type)) return this.advance();

		throw this.error(this.peek(), message);
	}

	private error(token: Token, message: string): ParseError {
		// Enhance error message with context-specific suggestions
		const enhancedMessage = getEnhancedErrorMessage({
			expected: message,
			got: token,
			context: this.parsingContext
		});
		const error = new ParseError(enhancedMessage, token);
		this.errors.push(error);
		return error;
	}

	private synchronize(): void {
		this.advance();

		while (!this.isAtEnd()) {
			// Sync on statement boundaries
			if (this.previous().type === TokenType.NEWLINE) return;

			switch (this.peek().type) {
				case TokenType.DEFINE:
				case TokenType.SETUP:
				case TokenType.IF:
				case TokenType.DO:
				case TokenType.RETURN:
				case TokenType.HANDLE:
				case TokenType.ENDMETHOD:
				case TokenType.ENDOBJECT:
				case TokenType.ENDFUNCTION:
				case TokenType.EXIT:
					return;
			}

			this.advance();
		}
	}

	/**
	 * Skip tokens until end of line
	 * Used to recover from parsing errors by ignoring unknown syntax
	 * Since NEWLINE tokens might not be present, also stop at statement keywords
	 */
	private skipToEndOfLine(): void {
		if (this.isAtEnd()) return;

		const startLine = this.peek().line;

		while (!this.isAtEnd()) {
			const token = this.peek();

			// Stop if we hit a NEWLINE
			if (token.type === TokenType.NEWLINE) {
				this.advance();
				break;
			}

			// Stop if line number changed (moved to next line)
			if (token.line > startLine) {
				break;
			}

			// Stop if we hit a statement keyword (likely start of next statement)
			if (token.type === TokenType.DEFINE ||
			    token.type === TokenType.SETUP ||
			    token.type === TokenType.IF ||
			    token.type === TokenType.DO ||
			    token.type === TokenType.RETURN ||
			    token.type === TokenType.HANDLE ||
			    token.type === TokenType.ENDMETHOD ||
			    token.type === TokenType.ENDOBJECT ||
			    token.type === TokenType.ENDFUNCTION ||
			    token.type === TokenType.EXIT ||
			    token.type === TokenType.MEMBER) {
				break;
			}

			this.advance();
		}
	}

	private skipTrivia(): void {
		// Skip whitespace/comments (already handled by lexer)
		// This is a placeholder for future enhancements
	}

	private isStatementEnd(): boolean {
		return this.check(TokenType.NEWLINE) || this.isAtEnd();
	}

	private getTokenIndex(token: Token): number {
		// O(1) lookup using pre-computed index instead of O(n) indexOf
		return token.index;
	}

	private createRange(startIdx: number, endIdx: number): Range {
		const start = this.tokens[startIdx] || this.tokens[0];
		const end = this.tokens[endIdx] || this.tokens[this.tokens.length - 1];

		return {
			start: { line: start.line - 1, character: start.column - 1 },
			// end.column is 1-based, so convert to 0-based: (column - 1) + length
			end: { line: end.line - 1, character: end.column - 1 + end.length }
		};
	}

	private createRangeFromNodes(start: { range: Range }, end: { range: Range }): Range {
		return {
			start: start.range.start,
			end: end.range.end
		};
	}
}

/**
 * Parse error
 */
export class ParseError extends Error {
	constructor(message: string, public token: Token) {
		super(message);
		this.name = 'ParseError';
	}
}

/**
 * Parse result
 */
export interface ParseResult {
	ast: Program;
	errors: ParseError[];
}
