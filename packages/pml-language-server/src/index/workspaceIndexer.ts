/**
 * Workspace Indexer - Indexes all PML files in workspace
 */

import { Connection } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { Parser } from '../parser/parser';
import { SymbolIndex } from './symbolIndex';
import * as fs from 'fs/promises';
import * as path from 'path';
import { minimatch } from 'minimatch';

export class WorkspaceIndexer {
	private symbolIndex: SymbolIndex;
	private connection: Connection;
	private parser: Parser = new Parser();
	private indexingInProgress: boolean = false;
	private excludePatterns: string[] = [];

	constructor(symbolIndex: SymbolIndex, connection: Connection) {
		this.symbolIndex = symbolIndex;
		this.connection = connection;
	}

	/**
	 * Load exclusion patterns from configuration
	 */
	private async loadExclusionPatterns(): Promise<void> {
		try {
			const config = await this.connection.workspace.getConfiguration('pml.indexing');
			this.excludePatterns = (config?.exclude as string[]) || [];
			this.connection.console.log(`Loaded ${this.excludePatterns.length} exclusion patterns: ${this.excludePatterns.join(', ')}`);
		} catch (error) {
			// Fallback to defaults if config read fails
			this.excludePatterns = [
				'**/node_modules/**',
				'**/out/**',
				'**/docs/**',
				'**/scripts/**',
				'**/.git/**',
				'**/.vscode/**',
				'**/examples/**',
				'**/hide_examples/**'
			];
			this.connection.console.warn(`Failed to load exclusion config, using defaults: ${error}`);
		}
	}

	/**
	 * Check if path should be excluded based on glob patterns
	 */
	private shouldExclude(filePath: string, workspaceRoot: string): boolean {
		// Convert to relative path for matching
		const relativePath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');

		for (const pattern of this.excludePatterns) {
			if (minimatch(relativePath, pattern, { dot: true })) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Index a single document
	 */
	public indexDocument(document: TextDocument): void {
		try {
			const text = document.getText();
			const parseResult = this.parser.parse(text);

			if (parseResult.ast) {
				// Pass document text for documentation/comment extraction
				this.symbolIndex.indexFile(document.uri, parseResult.ast, document.version, text);

				const stats = this.symbolIndex.getStats();
				this.connection.console.log(
					`Indexed ${document.uri}: ${parseResult.ast.body.length} symbols. ` +
					`Total: ${stats.methods} methods, ${stats.objects} objects, ${stats.forms} forms in ${stats.files} files`
				);
			}
		} catch (error) {
			this.connection.console.error(`Failed to index ${document.uri}: ${error}`);
		}
	}

	/**
	 * Remove document from index
	 */
	public removeDocument(uri: string): void {
		this.symbolIndex.removeFile(uri);
		this.connection.console.log(`Removed ${uri} from index`);
	}

	/**
	 * Index entire workspace (all .pml files)
	 */
	public async indexWorkspace(workspaceFolders: string[]): Promise<void> {
		if (this.indexingInProgress) {
			this.connection.console.warn('Indexing already in progress');
			return;
		}

		this.indexingInProgress = true;
		const startTime = Date.now();

		try {
			// Load exclusion patterns from configuration
			await this.loadExclusionPatterns();

			this.connection.console.log('Starting workspace indexing...');

			let totalFiles = 0;
			for (const folder of workspaceFolders) {
				const files = await this.findPMLFiles(folder);
				totalFiles += files.length;

				for (const file of files) {
					await this.indexFile(file);
				}
			}

			const duration = Date.now() - startTime;
			const stats = this.symbolIndex.getStats();

			this.connection.console.log(
				`Workspace indexing complete: ${totalFiles} files indexed in ${duration}ms. ` +
				`Found ${stats.methods} methods, ${stats.objects} objects, ${stats.forms} forms`
			);
		} catch (error) {
			this.connection.console.error(`Workspace indexing failed: ${error}`);
		} finally {
			this.indexingInProgress = false;
		}
	}

	/**
	 * Validate path is within workspace (security check)
	 */
	private isValidPath(filePath: string, workspaceRoot: string): boolean {
		try {
			const resolved = path.resolve(filePath);
			const root = path.resolve(workspaceRoot);

			// Ensure root ends with separator for proper boundary checking
			const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;

			// Check path is within workspace with proper boundary check
			// This prevents false positives like C:\proj1 vs C:\proj10
			if (resolved !== root && !resolved.startsWith(rootWithSep)) {
				this.connection.console.error(`Path traversal detected: ${filePath} is outside workspace ${workspaceRoot}`);
				return false;
			}

			// Additional check: verify relative path doesn't escape
			const relative = path.relative(root, resolved);
			if (relative.startsWith('..')) {
				this.connection.console.error(`Invalid path detected: ${filePath} escapes workspace boundary`);
				return false;
			}

			return true;
		} catch (error) {
			this.connection.console.error(`Path validation failed for ${filePath}: ${error}`);
			return false;
		}
	}

	/**
	 * Find all .pml files in directory (ASYNC version)
	 */
	private async findPMLFiles(dirPath: string): Promise<string[]> {
		const pmlFiles: string[] = [];
		const extensions = ['.pml', '.pmlobj', '.pmlfnc', '.pmlfrm', '.pmlmac', '.pmlcmd'];

		// Resolve workspace root for validation
		const workspaceRoot = path.resolve(dirPath);

		const scanDirectory = async (dir: string): Promise<void> => {
			// Validate directory path
			if (!this.isValidPath(dir, workspaceRoot)) {
				return;
			}

			// Check if directory should be excluded
			if (this.shouldExclude(dir, workspaceRoot)) {
				return;
			}

			try {
				const entries = await fs.readdir(dir, { withFileTypes: true });

				for (const entry of entries) {
					const fullPath = path.join(dir, entry.name);

					// Check if path should be excluded (applies to both files and directories)
					if (this.shouldExclude(fullPath, workspaceRoot)) {
						continue;
					}

					if (entry.isDirectory()) {
						// Skip hidden directories
						if (!entry.name.startsWith('.')) {
							await scanDirectory(fullPath);
						}
					} else if (entry.isFile()) {
						const ext = path.extname(entry.name).toLowerCase();
						if (extensions.includes(ext)) {
							// Validate file path before adding
							if (this.isValidPath(fullPath, workspaceRoot)) {
								pmlFiles.push(fullPath);
							}
						}
					}
				}
			} catch (error) {
				this.connection.console.warn(`Failed to scan directory ${dir}: ${error}`);
			}
		};

		await scanDirectory(dirPath);
		return pmlFiles;
	}

	/**
	 * Index a single file by path (ASYNC version)
	 */
	private async indexFile(filePath: string): Promise<void> {
		try {
			const content = await fs.readFile(filePath, 'utf-8');
			const uri = URI.file(filePath).toString();

			const parseResult = this.parser.parse(content);
			if (parseResult.ast) {
				this.symbolIndex.indexFile(uri, parseResult.ast, 0, content);
			}
		} catch (error) {
			this.connection.console.warn(`Failed to index file ${filePath}: ${error}`);
		}
	}

	/**
	 * Get index statistics
	 */
	public getStats() {
		return this.symbolIndex.getStats();
	}

	/**
	 * Check if indexing is in progress
	 */
	public isIndexing(): boolean {
		return this.indexingInProgress;
	}
}
