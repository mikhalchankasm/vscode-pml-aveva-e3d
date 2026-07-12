import { FileChangeType, FileEvent } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import * as fs from 'fs';
import * as path from 'path';
import { Parser, parserModeFromUri } from '../parser/parser';
import { SymbolIndex } from './symbolIndex';

type Logger = Pick<Console, 'log' | 'warn'>;

export interface WatchedFileIndexerOptions {
	symbolIndex: SymbolIndex;
	isDocumentOpen: (uri: string) => boolean;
	logger: Logger;
	parser?: Parser;
	readFileSync?: (path: string, encoding: BufferEncoding) => string;
}

export class WatchedFileIndexer {
	private readonly pmlExtensions = ['.pml', '.pmlobj', '.pmlfnc', '.pmlfrm', '.pmlmac', '.pmlcmd'];
	private readonly parser: Parser;
	private readonly readFileSync: (path: string, encoding: BufferEncoding) => string;

	constructor(private readonly options: WatchedFileIndexerOptions) {
		this.parser = options.parser ?? new Parser();
		this.readFileSync = options.readFileSync ?? fs.readFileSync;
	}

	public process(changes: FileEvent[]): void {
		for (const change of changes) {
			this.processChange(change);
		}
	}

	private processChange(change: FileEvent): void {
		const fileUri = change.uri;
		if (!this.isPmlUri(fileUri)) {
			return;
		}

		try {
			if (change.type === FileChangeType.Deleted) {
				this.options.symbolIndex.removeFile(fileUri);
				this.options.logger.log(`File deleted, removed from index: ${fileUri}`);
				return;
			}

			if (change.type !== FileChangeType.Created && change.type !== FileChangeType.Changed) {
				return;
			}

			if (this.options.isDocumentOpen(fileUri)) {
				return;
			}

			const filePath = URI.parse(fileUri).fsPath;
			const content = this.readFileSync(filePath, 'utf-8');
			const parseResult = this.parser.parse(content, { mode: parserModeFromUri(fileUri) });

			if (parseResult.ast) {
				this.options.symbolIndex.indexFile(fileUri, parseResult.ast, 0, content);
				this.options.logger.log(`File ${change.type === FileChangeType.Created ? 'created' : 'changed'}, reindexed: ${fileUri}`);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.options.logger.warn(`Failed to process file change for ${fileUri}: ${message}`);
		}
	}

	private isPmlUri(uri: string): boolean {
		const ext = path.extname(URI.parse(uri).path).toLowerCase();
		return this.pmlExtensions.includes(ext);
	}
}
