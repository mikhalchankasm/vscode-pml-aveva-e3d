/**
 * PML Parser
 * Recursive Descent Parser - converts tokens to AST
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-constant-condition */

import { Token, TokenType } from './tokens';
import { Lexer } from './lexer';
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

export class Parser {
	private tokens: Token[] = [];
	private current: number = 0;
	private errors: ParseError[] = [];

	/**
	 * Parse source code into AST
	 */
	public parse(source: string): ParseResult {
		// Tokenize
		const lexer = new Lexer(source);
		this.tokens = lexer.tokenize();
		this.current = 0;
		this.errors = [];

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

		// define method / object
		if (this.check(TokenType.DEFINE)) {
			return this.parseDefinition();
		}

		// setup form
		if (this.check(TokenType.SETUP)) {
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

		// Method body
		const body: Statement[] = [];
		while (!this.check(TokenType.ENDMETHOD) && !this.isAtEnd()) {
			const stmt = this.parseStatement();
			if (stmt) {
				body.push(stmt);
			}
		}

		const endToken = this.consume(TokenType.ENDMETHOD, "Expected 'endmethod'");

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

		// Function body
		const body: Statement[] = [];
		while (!this.check(TokenType.ENDFUNCTION) && !this.isAtEnd()) {
			const stmt = this.parseStatement();
			if (stmt) {
				body.push(stmt);
			}
		}

		const endToken = this.consume(TokenType.ENDFUNCTION, "Expected 'endfunction'");

		return {
			type: 'FunctionDefinition',
			name: functionName,
			parameters,
			body,
			documentation,
			deprecated: documentation?.deprecated || false,
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

		return {
			type: 'ObjectDefinition',
			name: objectName,
			members,
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	/**
	 * Parse form definition
	 * setup form !!MyForm
	 *   frame .myFrame
	 *     ...
	 *   exit
	 * exit
	 */
	/**
	 * Parse form definition
	 * setup form !!name [DIALOG|MAIN|DOCUMENT|BLOCKINGDIALOG] [RESIZABLE] [DOCK direction]
	 *   ...
	 * exit
	 */
	private parseFormDefinition(): FormDefinition {
		const startToken = this.consume(TokenType.SETUP, "Expected 'setup'");
		this.consume(TokenType.FORM, "Expected 'form'");

		const nameToken = this.consume(TokenType.GLOBAL_VAR, "Expected form name (e.g., !!MyForm)");
		const formName = nameToken.value;

		// Parse optional modifiers
		let formType: 'DIALOG' | 'MAIN' | 'DOCUMENT' | 'BLOCKINGDIALOG' | undefined;
		let resizable: boolean = false;
		let dock: 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | undefined;

		// Check for form type
		if (this.check(TokenType.DIALOG)) {
			formType = 'DIALOG';
			this.advance();
		} else if (this.check(TokenType.MAIN)) {
			formType = 'MAIN';
			this.advance();
		} else if (this.check(TokenType.DOCUMENT)) {
			formType = 'DOCUMENT';
			this.advance();
		} else if (this.check(TokenType.BLOCKINGDIALOG)) {
			formType = 'BLOCKINGDIALOG';
			this.advance();
		}

		// Check for RESIZABLE
		if (this.check(TokenType.RESIZABLE)) {
			resizable = true;
			this.advance();
		}

		// Check for DOCK
		if (this.check(TokenType.DOCK)) {
			this.advance();
			if (this.check(TokenType.LEFT)) {
				dock = 'LEFT';
				this.advance();
			} else if (this.check(TokenType.RIGHT)) {
				dock = 'RIGHT';
				this.advance();
			} else if (this.check(TokenType.TOP)) {
				dock = 'TOP';
				this.advance();
			} else if (this.check(TokenType.BOTTOM)) {
				dock = 'BOTTOM';
				this.advance();
			}
		}

		const body: Statement[] = [];
		const frames: FrameDefinition[] = [];
		const callbacks: Record<string, string> = {};

		// Parse form body
		while (!this.check(TokenType.EXIT) && !this.isAtEnd()) {
			this.skipTrivia();

			if (this.check(TokenType.EXIT)) break;

			// Parse frame
			if (this.check(TokenType.FRAME)) {
				frames.push(this.parseFrameDefinition());
			}
			// Parse member declaration
			else if (this.check(TokenType.MEMBER)) {
				body.push(this.parseMemberDeclaration());
			}
			// Parse gadget (button, text, option, toggle)
			else if (this.check(TokenType.BUTTON) || this.check(TokenType.TEXT) ||
			         this.check(TokenType.OPTION) || this.check(TokenType.TOGGLE)) {
				body.push(this.parseGadget());
			}
			// Parse statement (callbacks, assignments, etc.)
			else {
				const stmt = this.parseStatement();
				if (stmt) {
					body.push(stmt);
				}
			}
		}

		const endToken = this.consume(TokenType.EXIT, "Expected 'exit'");

		return {
			type: 'FormDefinition',
			name: formName,
			formType,
			resizable,
			dock,
			body,
			frames,
			callbacks,
			range: this.createRange(this.getTokenIndex(startToken), this.getTokenIndex(endToken))
		};
	}

	/**
	 * Parse frame definition
	 */
	private parseFrameDefinition(): FrameDefinition {
		const startToken = this.consume(TokenType.FRAME, "Expected 'frame'");
		const nameToken = this.consume(TokenType.METHOD, "Expected frame name (e.g., .myFrame)");
		const frameName = nameToken.value.substring(1);

		const gadgets: GadgetDeclaration[] = [];

		while (!this.check(TokenType.EXIT) && !this.check(TokenType.FRAME) && !this.isAtEnd()) {
			this.skipTrivia();

			if (this.check(TokenType.EXIT) || this.check(TokenType.FRAME)) break;

			// Parse gadget
			if (this.check(TokenType.BUTTON) || this.check(TokenType.TEXT) ||
			    this.check(TokenType.OPTION) || this.check(TokenType.TOGGLE)) {
				gadgets.push(this.parseGadget());
			} else {
				this.advance();
			}
		}

		const endToken = this.consume(TokenType.EXIT, "Expected 'exit'");

		return {
			type: 'FrameDefinition',
			name: frameName,
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
		} else if (this.check(TokenType.OPTION)) {
			gadgetType = 'option';
			this.advance();
		} else if (this.check(TokenType.TOGGLE)) {
			gadgetType = 'toggle';
			this.advance();
		} else {
			throw this.error(this.peek(), "Expected gadget type (button, text, option, toggle)");
		}

		// Gadget name (.name)
		const nameToken = this.consume(TokenType.METHOD, "Expected gadget name (e.g., .myButton)");
		const gadgetName = nameToken.value.substring(1); // Remove leading dot

		let label: string | undefined;
		let width: number | string | undefined;
		let modifier: 'OK' | 'CANCEL' | 'APPLY' | 'RESET' | undefined;
		let position: number | undefined;

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

		// Position: at x<num>
		if (this.check(TokenType.AT)) {
			this.advance();
			// Expect identifier like "x20" or separate tokens
			const posToken = this.peek();
			if (posToken.type === TokenType.IDENTIFIER && posToken.value.startsWith('x')) {
				const posStr = posToken.value.substring(1);
				position = parseInt(posStr, 10);
				this.advance();
			} else if (this.check(TokenType.NUMBER)) {
				position = parseFloat(this.advance().value);
			}
		}

		return {
			type: 'GadgetDeclaration',
			name: gadgetName,
			gadgetType,
			label,
			modifier,
			position,
			width,
			properties: {},
			range: this.createRange(this.getTokenIndex(startToken), this.current - 1)
		};
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

		// var statement - consume 'var' and parse the following statement
		if (this.check(TokenType.VAR)) {
			this.advance(); // consume 'var'
			// After 'var', expect variable declaration/assignment
			if (this.check(TokenType.LOCAL_VAR) || this.check(TokenType.GLOBAL_VAR)) {
				return this.parseVariableDeclarationOrAssignment();
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
		while (!this.check(TokenType.ELSE) && !this.check(TokenType.ELSEIF) && !this.check(TokenType.ENDIF) && !this.isAtEnd()) {
			const stmt = this.parseStatement();
			if (stmt) {
				consequent.push(stmt);
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
				while (!this.check(TokenType.ENDIF) && !this.isAtEnd()) {
					const stmt = this.parseStatement();
					if (stmt) {
						alternate.push(stmt);
					}
				}
			}
			// Consume endif for this if/else block
			endToken = this.consume(TokenType.ENDIF, "Expected 'endif'");
		}

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
			}
		} else if (this.check(TokenType.WHILE)) {
			this.advance();
			variant = 'while';
			condition = this.parseExpression();
		}

		// Body
		const body: Statement[] = [];
		while (!this.check(TokenType.ENDDO) && !this.isAtEnd()) {
			const stmt = this.parseStatement();
			if (stmt) {
				body.push(stmt);
			}
		}

		const endToken = this.consume(TokenType.ENDDO, "Expected 'enddo'");

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

		// Body
		const body: Statement[] = [];
		while (!this.check(TokenType.ELSEHANDLE) && !this.check(TokenType.ENDHANDLE) && !this.isAtEnd()) {
			const stmt = this.parseStatement();
			if (stmt) {
				body.push(stmt);
			}
		}

		// Alternate (elsehandle)
		let alternate: Statement[] | undefined;
		if (this.check(TokenType.ELSEHANDLE)) {
			this.advance();
			alternate = [];
			while (!this.check(TokenType.ENDHANDLE) && !this.isAtEnd()) {
				const stmt = this.parseStatement();
				if (stmt) {
					alternate.push(stmt);
				}
			}
		}

		const endToken = this.consume(TokenType.ENDHANDLE, "Expected 'endhandle'");

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

		// Check if there's a return value
		let argument: Expression | undefined;
		if (!this.isStatementEnd()) {
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

		// Check for assignment
		if (this.check(TokenType.ASSIGN)) {
			this.advance(); // consume =

			const initializer = this.parseExpression();

			const varDecl: VariableDeclaration = {
				type: 'VariableDeclaration',
				name: varName,
				scope: isGlobal ? 'global' : 'local',
				initializer,
				range: this.createRange(this.getTokenIndex(varToken), this.current - 1)
			};

			return varDecl;
		} else {
			// Just a variable reference (expression statement)
			const identifier: Identifier = {
				type: 'Identifier',
				name: varName,
				scope: isGlobal ? 'global' : 'local',
				range: this.createRange(this.getTokenIndex(varToken), this.getTokenIndex(varToken))
			};

			return {
				type: 'ExpressionStatement',
				expression: identifier,
				range: this.createRange(this.getTokenIndex(varToken), this.getTokenIndex(varToken))
			};
		}
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
			const right = this.parseAssignment(); // Right-associative: a = b = c

			// Validate left side - must be identifier or member expression
			if (left.type !== 'Identifier' && left.type !== 'MemberExpression') {
				throw this.error(assignToken, "Invalid assignment target");
			}

			return {
				type: 'AssignmentExpression',
				left: left as Identifier | MemberExpression,
				right,
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

		while (this.match(TokenType.GT, TokenType.LT, TokenType.GE, TokenType.LE)) {
			const operator = this.previous().value;
			const right = this.parseOf();
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

		while (this.match(TokenType.PLUS, TokenType.MINUS)) {
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
		const startPos = expr.range.start;

		// Check for function call: ()
		while (this.match(TokenType.LPAREN)) {
			const args = this.parseArguments();
			const rparen = this.consume(TokenType.RPAREN, "Expected ')' after arguments");

			expr = {
				type: 'CallExpression',
				callee: expr,
				arguments: args,
				range: {
					start: startPos,
					end: { line: rparen.line - 1, character: rparen.column - 1 + rparen.length }
				}
			};
		}

		return expr;
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
				// Plain dot followed by identifier (for property access)
				// This handles cases where DOT is separate from the identifier
				let propertyName: string;
				let propertyToken: Token;

				if (this.check(TokenType.IDENTIFIER)) {
					propertyToken = this.advance();
					propertyName = propertyToken.value;
				} else {
					throw this.error(this.peek(), "Expected property name after '.'");
				}

				expr = {
					type: 'MemberExpression',
					object: expr,
					property: {
						type: 'Identifier',
						name: propertyName,
						range: this.createRange(this.getTokenIndex(propertyToken), this.getTokenIndex(propertyToken))
					},
					computed: false,
					range: {
						start: startPos,
						end: { line: propertyToken.line - 1, character: propertyToken.column - 1 + propertyToken.length }
					}
				};
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
				    this.check(TokenType.STRING)) {
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

		// Object constructor: object TYPE()
		if (this.match(TokenType.OBJECT)) {
			const objectToken = this.previous();
			// Next should be type constructor (STRING, ARRAY, etc.) or custom type
			const typeToken = this.peek();

			// Return 'object' as identifier - it will be parsed as call expression
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

		// Identifier
		if (this.match(TokenType.IDENTIFIER)) {
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

	/**
	 * Parse function call arguments
	 */
	private parseArguments(): Expression[] {
		const args: Expression[] = [];

		if (this.check(TokenType.RPAREN)) {
			return args; // No arguments
		}

		do {
			args.push(this.parseExpression());
		} while (this.match(TokenType.COMMA));

		return args;
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

	private previous(): Token {
		return this.tokens[this.current - 1];
	}

	private consume(type: TokenType, message: string): Token {
		if (this.check(type)) return this.advance();

		throw this.error(this.peek(), message);
	}

	private error(token: Token, message: string): ParseError {
		const error = new ParseError(message, token);
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
				case TokenType.IF:
				case TokenType.DO:
				case TokenType.RETURN:
				case TokenType.HANDLE:
					return;
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
		return this.tokens.indexOf(token);
	}

	private createRange(startIdx: number, endIdx: number): Range {
		const start = this.tokens[startIdx] || this.tokens[0];
		const end = this.tokens[endIdx] || this.tokens[this.tokens.length - 1];

		return {
			start: { line: start.line - 1, character: start.column - 1 },
			end: { line: end.line - 1, character: end.column + end.length }
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
