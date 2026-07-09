export interface MethodReferencePattern {
	regex: RegExp;
	includeDeclaration: boolean;
}

export interface MethodReferencePatternSet {
	symbolLower: string;
	preFilterPattern: RegExp;
	// Callers must reset lastIndex before each scan because patterns are cached global regexes.
	patterns: MethodReferencePattern[];
}

const DYNAMIC_SEGMENT = '\\$!?<[^>\\r\\n]+>';
const MEMBER_SEGMENT = `(?:\\w+|${DYNAMIC_SEGMENT})`;
const ROOT_SEGMENT = `(?:\\w+(?:/\\w+)*|(?:/\\w+)+|<[^>\\r\\n]+>)`;
const EXPR_PREFIX = `[!$][!]?(?:${ROOT_SEGMENT})(?:\\.${MEMBER_SEGMENT})*(?:\\[[^\\]]*\\])*(?:\\.${MEMBER_SEGMENT}(?:\\[[^\\]]*\\])*)*`;

export function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class MethodReferencePatternCache {
	private readonly cache = new Map<string, MethodReferencePatternSet>();

	constructor(private readonly maxSize = 100) {}

	public get(symbolName: string): MethodReferencePatternSet {
		const cacheKey = symbolName.toLowerCase();
		const cached = this.cache.get(cacheKey);
		if (cached) {
			this.cache.delete(cacheKey);
			this.cache.set(cacheKey, cached);
			return cached;
		}

		const escapedName = escapeRegex(symbolName);
		const patternSet: MethodReferencePatternSet = {
			symbolLower: cacheKey,
			preFilterPattern: new RegExp(escapedName, 'i'),
			patterns: [
				{ regex: new RegExp(`\\.${escapedName}\\s*\\(`, 'gi'), includeDeclaration: false },
				{ regex: new RegExp(`(?:${EXPR_PREFIX})\\.${escapedName}\\s*\\(`, 'gi'), includeDeclaration: false },
				{ regex: new RegExp(`\\bOBJECT\\s+${escapedName}\\s*\\(`, 'gi'), includeDeclaration: false },
				{ regex: new RegExp(`\\b(?:define\\s+method|member)\\s+\\.${escapedName}(?=\\s|\\(|$)`, 'gi'), includeDeclaration: true },
				{ regex: new RegExp(`\\|\\.${escapedName}\\|`, 'gi'), includeDeclaration: false },
				{ regex: new RegExp(`\\|(?:${EXPR_PREFIX})\\.${escapedName}\\|`, 'gi'), includeDeclaration: false }
			]
		};

		if (this.cache.size >= this.maxSize) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) {
				this.cache.delete(oldestKey);
			}
		}

		this.cache.set(cacheKey, patternSet);
		return patternSet;
	}

	public get size(): number {
		return this.cache.size;
	}

	public has(symbolName: string): boolean {
		return this.cache.has(symbolName.toLowerCase());
	}
}

export function createMethodRenamePatterns(oldName: string): RegExp[] {
	const escapedOldName = escapeRegex(oldName);
	return [
		new RegExp(`\\.${escapedOldName}(?=\\s*\\(|\\s+|[),.\\]]|$)`, 'gi'),
		new RegExp(`\\|\\.${escapedOldName}\\|`, 'gi'),
		new RegExp(`\\|(?:${EXPR_PREFIX})\\.${escapedOldName}\\|`, 'gi')
	];
}

export function isMethodDeclarationReference(text: string, startOffset: number): boolean {
	const lineStart = text.lastIndexOf('\n', startOffset - 1) + 1;
	const prefix = text.slice(lineStart, startOffset);
	return /^\s*(?:define\s+method|member)\s+\.$/i.test(prefix);
}
