import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { Diagnostic, DiagnosticSeverity, DocumentSymbol } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import { Parser, ParserMode, parserModeFromUri } from './parser/parser';
import { SymbolIndex, SymbolInfo } from './index/symbolIndex';
import { DocumentSymbolProvider } from './providers/documentSymbolProvider';
import { ArrayIndexChecker } from './analysis/arrayIndexChecker';
import { FormReferenceValidator } from './analysis/formReferenceValidator';

const PML_EXTENSIONS = new Set(['.pml', '.pmlobj', '.pmlfnc', '.pmlfrm', '.pmlmac', '.pmlcmd']);

type CommandName = 'parse' | 'diagnose' | 'symbols' | 'scope';

interface CliOptions {
	target?: string;
	json: boolean;
	line?: number;
	column?: number;
}

interface PackageInfo {
	name: string;
	version: string;
}

interface CliMetadata {
	tool: 'vscode-pml-extension';
	contractVersion: '1.0';
	extensionVersion: string;
	gitCommit?: string;
	gitDirty?: boolean;
}

interface FileContext {
	file: string;
	uri: string;
	fileKind: string;
	parserMode: ParserMode;
}

function main(): void {
	const [commandArg, ...args] = process.argv.slice(2);
	const command = commandArg as CommandName | undefined;

	if (!command || !['parse', 'diagnose', 'symbols', 'scope'].includes(command)) {
		fail(`Expected command: parse | diagnose | symbols | scope`);
	}

	const options = parseArgs(args);
	if (!options.json) {
		fail('Stable external CLI currently requires --json.');
	}

	if (!options.target) {
		fail(`Missing ${command === 'symbols' ? '<folder>' : '<file>'} argument.`);
	}

	const metadata = getMetadata();
	const target = path.resolve(options.target);

	if (command === 'symbols') {
		printJson(createWorkspaceSymbolsResult(target, metadata));
		return;
	}

	if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
		fail(`File not found: ${target}`);
	}

	const parsed = parseFile(target);
	if (command === 'parse') {
		printJson({
			...metadata,
			command,
			...parsed.context,
			parse: {
				ok: parsed.parseErrors.length === 0,
				topLevelStatements: parsed.topLevelStatements,
				errors: parsed.parseErrors
			},
			diagnostics: parsed.diagnostics,
			symbols: parsed.documentSymbols
		});
		return;
	}

	if (command === 'diagnose') {
		printJson({
			...metadata,
			command,
			...parsed.context,
			diagnostics: parsed.diagnostics,
			symbols: parsed.documentSymbols
		});
		return;
	}

	if (options.line === undefined || options.column === undefined) {
		fail('Scope command requires --line <line> --column <column>.');
	}

	printJson({
		...metadata,
		command,
		...parsed.context,
		position: {
			line: options.line,
			column: options.column,
			zeroBased: {
				line: options.line - 1,
				character: options.column - 1
			}
		},
		scope: findScope(parsed.documentSymbols, options.line - 1, options.column - 1),
		diagnostics: parsed.diagnostics,
		symbols: parsed.documentSymbols
	});
}

function parseArgs(args: string[]): CliOptions {
	const options: CliOptions = { json: false };
	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (arg === '--json') {
			options.json = true;
		} else if (arg === '--line') {
			options.line = parsePositiveInt(args[++index], '--line');
		} else if (arg === '--column') {
			options.column = parsePositiveInt(args[++index], '--column');
		} else if (!arg.startsWith('--') && !options.target) {
			options.target = arg;
		} else {
			fail(`Unexpected argument: ${arg}`);
		}
	}
	return options;
}

function parsePositiveInt(value: string | undefined, flag: string): number {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		fail(`${flag} must be a positive 1-based integer.`);
	}
	return parsed;
}

function parseFile(filePath: string) {
	const context = getFileContext(filePath);
	const text = fs.readFileSync(filePath, 'utf8');
	const parser = new Parser();
	const parseResult = parser.parse(text, { mode: context.parserMode });
	const symbolIndex = new SymbolIndex();
	symbolIndex.indexFile(context.uri, parseResult.ast, 0, text);

	const documentSymbols = new DocumentSymbolProvider(symbolIndex).provide({
		textDocument: { uri: context.uri }
	});

	const parseDiagnostics = parseResult.errors.map(error => ({
		severity: severityName(DiagnosticSeverity.Error),
		range: {
			start: { line: error.token.line - 1, character: error.token.column - 1 },
			end: { line: error.token.line - 1, character: error.token.column - 1 + error.token.length }
		},
		message: error.message,
		source: 'pml-parser',
		code: 'PML_PARSE_ERROR'
	}));

	const semanticDiagnostics = createSemanticDiagnostics(parseResult.ast, text, context.fileKind);
	const diagnostics = [
		...parseDiagnostics,
		...semanticDiagnostics.map(normalizeDiagnostic)
	];

	return {
		context,
		topLevelStatements: parseResult.ast.body.length,
		parseErrors: parseDiagnostics,
		diagnostics,
		documentSymbols
	};
}

function createSemanticDiagnostics(ast: ReturnType<Parser['parse']>['ast'], text: string, fileKind: string): Diagnostic[] {
	const diagnostics: Diagnostic[] = new ArrayIndexChecker().check(ast, text);
	if (fileKind === 'pmlfrm') {
		diagnostics.push(...new FormReferenceValidator().check(ast, DiagnosticSeverity.Warning));
	}
	return diagnostics;
}

function normalizeDiagnostic(diagnostic: Diagnostic) {
	return {
		severity: severityName(diagnostic.severity),
		range: diagnostic.range,
		message: diagnostic.message,
		source: diagnostic.source,
		code: normalizeDiagnosticCode(diagnostic.code)
	};
}

function normalizeDiagnosticCode(code: Diagnostic['code']): string | undefined {
	if (code === undefined || code === null) {
		return undefined;
	}
	const raw = String(code);
	const known: Record<string, string> = {
		'array-index-zero': 'PML_ARRAY_INDEX_ZERO',
		'missing-form-callback': 'PML_FORM_CALLBACK_TARGET_MISSING',
		'unknown-form-member': 'PML_FORM_UNKNOWN_MEMBER'
	};
	return known[raw] ?? raw.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function severityName(severity: DiagnosticSeverity | undefined): string {
	switch (severity) {
		case DiagnosticSeverity.Error:
			return 'error';
		case DiagnosticSeverity.Warning:
			return 'warning';
		case DiagnosticSeverity.Information:
			return 'information';
		case DiagnosticSeverity.Hint:
			return 'hint';
		default:
			return 'unknown';
	}
}

function createWorkspaceSymbolsResult(folderPath: string, metadata: CliMetadata) {
	if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
		fail(`Folder not found: ${folderPath}`);
	}

	const symbolIndex = new SymbolIndex();
	const files = findPmlFiles(folderPath);
	const parser = new Parser();
	const indexedFiles = [];
	const diagnostics = [];

	for (const file of files) {
		const context = getFileContext(file);
		const text = fs.readFileSync(file, 'utf8');
		const parseResult = parser.parse(text, { mode: context.parserMode });
		symbolIndex.indexFile(context.uri, parseResult.ast, 0, text);
		indexedFiles.push({
			...context,
			topLevelStatements: parseResult.ast.body.length,
			parseErrors: parseResult.errors.length
		});
		for (const error of parseResult.errors) {
			diagnostics.push({
				file,
				severity: 'error',
				range: {
					start: { line: error.token.line - 1, character: error.token.column - 1 },
					end: { line: error.token.line - 1, character: error.token.column - 1 + error.token.length }
				},
				message: error.message,
				source: 'pml-parser',
				code: 'PML_PARSE_ERROR'
			});
		}
	}

	return {
		...metadata,
		command: 'symbols',
		folder: folderPath,
		stats: symbolIndex.getStats(),
		files: indexedFiles,
		diagnostics,
		symbols: {
			methods: symbolIndex.getAllMethods().map(normalizeSymbolInfo),
			objects: symbolIndex.getAllObjects().map(normalizeSymbolInfo),
			forms: symbolIndex.getAllForms().map(normalizeSymbolInfo)
		}
	};
}

function normalizeSymbolInfo(symbol: SymbolInfo) {
	return {
		name: symbol.name,
		kind: symbol.kind,
		uri: symbol.uri,
		file: URI.parse(symbol.uri).fsPath,
		range: symbol.range,
		containerName: symbol.containerName,
		deprecated: symbol.deprecated,
		documentation: symbol.documentation
	};
}

function findPmlFiles(folderPath: string): string[] {
	const files: string[] = [];
	const skipDirectories = new Set(['.git', 'node_modules', 'out']);

	function visit(dir: string): void {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!skipDirectories.has(entry.name)) {
					visit(fullPath);
				}
			} else if (entry.isFile() && PML_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
				files.push(fullPath);
			}
		}
	}

	visit(folderPath);
	return files.sort((a, b) => a.localeCompare(b));
}

function getFileContext(filePath: string): FileContext {
	const ext = path.extname(filePath).toLowerCase();
	if (!PML_EXTENSIONS.has(ext)) {
		fail(`Unsupported PML file extension: ${ext || '(none)'}`);
	}
	const uri = URI.file(filePath).toString();
	return {
		file: filePath,
		uri,
		fileKind: ext.slice(1),
		parserMode: parserModeFromUri(filePath)
	};
}

function findScope(symbols: DocumentSymbol[], line: number, character: number): DocumentSymbol | null {
	let best: DocumentSymbol | null = null;

	function visit(symbol: DocumentSymbol): void {
		if (!containsPosition(symbol.range, line, character)) {
			return;
		}
		if (!best || rangeSize(symbol.range) <= rangeSize(best.range)) {
			best = symbol;
		}
		for (const child of symbol.children ?? []) {
			visit(child);
		}
	}

	for (const symbol of symbols) {
		visit(symbol);
	}

	return best;
}

function containsPosition(range: DocumentSymbol['range'], line: number, character: number): boolean {
	if (line < range.start.line || line > range.end.line) {
		return false;
	}
	if (line === range.start.line && character < range.start.character) {
		return false;
	}
	if (line === range.end.line && character > range.end.character) {
		return false;
	}
	return true;
}

function rangeSize(range: DocumentSymbol['range']): number {
	return (range.end.line - range.start.line) * 100000 + (range.end.character - range.start.character);
}

function getMetadata(): CliMetadata {
	const packageInfo = readPackageInfo();
	const git = readGitInfo();
	return {
		tool: 'vscode-pml-extension',
		contractVersion: '1.0',
		extensionVersion: packageInfo.version,
		...git
	};
}

function readPackageInfo(): PackageInfo {
	const packagePath = path.resolve(__dirname, '../../../package.json');
	const fallback: PackageInfo = { name: 'pml-aveva-e3d', version: 'unknown' };
	try {
		return { ...fallback, ...JSON.parse(fs.readFileSync(packagePath, 'utf8')) };
	} catch {
		return fallback;
	}
}

function readGitInfo(): Pick<CliMetadata, 'gitCommit' | 'gitDirty'> {
	try {
		const cwd = path.resolve(__dirname, '../../..');
		const gitCommit = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
		const status = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' }).trim();
		return { gitCommit, gitDirty: status.length > 0 };
	} catch {
		return {};
	}
}

function printJson(value: unknown): void {
	process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(message: string): never {
	process.stderr.write(`${message}\n`);
	process.exit(2);
}

main();
