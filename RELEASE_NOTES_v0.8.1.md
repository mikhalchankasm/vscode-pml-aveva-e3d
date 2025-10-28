# v0.8.1 - Performance & Memory Fixes

## 🐛 Critical Fixes

This release fixes several performance and memory issues identified in code review.

### Fixed Memory Leak

**Problem:** `documentASTs` cache was storing every parsed AST indefinitely
**Impact:** Memory usage grew unbounded as files were opened
**Solution:** Removed unused cache entirely - providers already use `symbolIndex`

```typescript
// REMOVED - was never read, only written
const documentASTs: Map<string, Program> = new Map();
```

**Result:** Significantly reduced memory footprint

### Simplified Typo Detector

**Before:** 191 lines of complex regex-based text scanning
**After:** 30 lines - simply returns empty array

**Why:**
- Parser already catches actual syntax errors ("endiff" → "endif")
- Text-based heuristics caused false positives on arbitrary identifiers
- No value added beyond parser diagnostics

**Code removed:**
- Levenshtein distance calculation
- Text scanning with regex
- String literal removal logic
- Position offset calculations (source of bugs)

### Async Workspace Indexing

**Problem:** Synchronous `fs.readdirSync` and `fs.readFileSync` blocked LSP
**Impact:** Froze extension on large projects during startup
**Solution:** Converted to async `fs.readdir` and `fs.readFile`

```typescript
// BEFORE - blocked event loop
const entries = fs.readdirSync(dir);
const content = fs.readFileSync(filePath);

// AFTER - non-blocking
const entries = await fs.readdir(dir);
const content = await fs.readFile(filePath);
```

**Result:** Faster, more responsive LSP on large workspaces

## Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Memory leak | Unbounded growth | Fixed | No more AST cache |
| Typo detector | 191 lines | 30 lines | 84% smaller |
| Workspace indexing | Blocking | Async | Non-blocking |
| Code quality | Dead code | Cleaned | 160+ lines removed |

## Technical Details

### Files Modified

1. **typoDetector.ts** (191 → 30 lines)
   - Removed all text-based scanning
   - Removed Levenshtein distance algorithm
   - Removed COMMON_TYPOS dictionary
   - Removed position calculation logic

2. **server.ts**
   - Removed `documentASTs` Map declaration
   - Removed `documentASTs.set()` call
   - Added comments explaining why removed

3. **workspaceIndexer.ts**
   - Changed `import * as fs from 'fs'` to `import * as fs from 'fs/promises'`
   - Made `scanDirectory` async with `await fs.readdir()`
   - Made `indexFile` async with `await fs.readFile()`

## Upgrade Notes

- No breaking changes
- Existing code continues to work
- Performance improvements are automatic
- Reduced memory usage immediately noticeable on large projects

## What's Next?

According to [ROADMAP.md](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/ROADMAP.md):

**v0.8.x (remaining):**
- [ ] Form syntax improvements
- [ ] Parser tests
- [ ] Settings for paths

**v0.9.0:**
- [ ] Type inference
- [ ] Type-aware autocompletion

## Installation

Download `pml-aveva-e3d-0.8.1.vsix` and install:

```bash
code --install-extension pml-aveva-e3d-0.8.1.vsix --force
```

Or install from Extensions view: Extensions → ... → Install from VSIX

**Full Changelog**: https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/compare/v0.8.0...v0.8.1
