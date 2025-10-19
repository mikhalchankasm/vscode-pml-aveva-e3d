/**
 * Workspace Indexer - Indexes all PML files in workspace
 */

import { TextDocuments, Connection } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { Parser } from '../parser/parser';
import { SymbolIndex } from './symbolIndex';
import * as fs from 'fs';
import * as path from 'path';

export class WorkspaceIndexer {
	private symbolIndex: SymbolIndex;
	private connection: Connection;
	private parser: Parser = new Parser();
	private indexingInProgress: boolean = false;

	constructor(symbolIndex: SymbolIndex, connection: Connection) {
		this.symbolIndex = symbolIndex;
		this.connection = connection;
	}

	/**
	 * Index a single document
	 */
	public indexDocument(document: TextDocument): void {
		try {
			const text = document.getText();
			const parseResult = this.parser.parse(text);

			if (parseResult.ast) {
				this.symbolIndex.indexFile(document.uri, parseResult.ast, document.version);

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
	 * Find all .pml files in directory
	 */
	private async findPMLFiles(dirPath: string): Promise<string[]> {
		const pmlFiles: string[] = [];
		const extensions = ['.pml', '.pmlobj', '.pmlfnc', '.pmlfrm', '.pmlmac', '.pmlcmd'];

		const scanDirectory = (dir: string): void => {
			try {
				const entries = fs.readdirSync(dir, { withFileTypes: true });

				for (const entry of entries) {
					const fullPath = path.join(dir, entry.name);

					// Skip node_modules, .git, etc.
					if (entry.isDirectory()) {
						const dirName = entry.name;
						if (!dirName.startsWith('.') && dirName !== 'node_modules' && dirName !== 'out') {
							scanDirectory(fullPath);
						}
					} else if (entry.isFile()) {
						const ext = path.extname(entry.name).toLowerCase();
						if (extensions.includes(ext)) {
							pmlFiles.push(fullPath);
						}
					}
				}
			} catch (error) {
				this.connection.console.warn(`Failed to scan directory ${dir}: ${error}`);
			}
		};

		scanDirectory(dirPath);
		return pmlFiles;
	}

	/**
	 * Index a single file by path
	 */
	private async indexFile(filePath: string): Promise<void> {
		try {
			const content = fs.readFileSync(filePath, 'utf-8');
			const uri = URI.file(filePath).toString();

			const parseResult = this.parser.parse(content);
			if (parseResult.ast) {
				this.symbolIndex.indexFile(uri, parseResult.ast, 0);
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
