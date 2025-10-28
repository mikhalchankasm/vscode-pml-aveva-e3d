# v0.8.0 - Code Bundling & Performance

## 🚀 Major Improvement: Bundled Extension

This release implements code bundling with **esbuild**, dramatically reducing extension size and improving performance!

### 📊 The Numbers

|  | Before (v0.7.3) | After (v0.8.0) | Improvement |
|---|---|---|---|
| **Size** | 15.61 MB | **2.07 MB** | **7.5x smaller** |
| **Files** | 1,632 files | **54 files** | **30x fewer** |
| **Load Time** | ~2-3 seconds | **~0.5 seconds** | **4-6x faster** |

### ✨ Benefits

- ⚡ **Faster Activation** - Extension loads significantly quicker
- 💾 **Smaller Download** - 7.5x smaller VSIX package (2 MB vs 15 MB)
- 🚀 **Better Performance** - Reduced I/O operations, fewer files to process
- 📦 **Cleaner Installation** - Only bundled code, no source files or node_modules

## What Changed?

### Build System Overhaul

**Before:**
```bash
npm run compile  # TypeScript compilation → 1600+ files
```

**After:**
```bash
npm run compile  # esbuild bundling → 2 files!
```

### Bundle Output

The entire extension and language server are now bundled into just 2 files:
- `out/extension.js` (811 KB) - Main extension code
- `packages/pml-language-server/out/server.js` (506 KB) - LSP server

### New Scripts

- `npm run compile` - Build with esbuild (default)
- `npm run compile:tsc` - TypeScript-only compilation (for development)
- `npm run watch` - esbuild watch mode
- `npm run esbuild` - Production build with minification

## Installation

Download `pml-aveva-e3d-0.8.0.vsix` and install:

```bash
code --install-extension pml-aveva-e3d-0.8.0.vsix --force
```

Or install from Extensions view: Extensions → ... → Install from VSIX

## Technical Details

### esbuild Configuration

Created `esbuild.js` with:
- Dual entry points (extension + language server)
- Production minification
- Development source maps
- Watch mode support
- CommonJS format for Node.js compatibility

### .vscodeignore Optimization

Updated to exclude:
- ❌ Source files (`src/**`, `**/*.ts`)
- ❌ node_modules (bundled into output)
- ❌ Documentation and examples
- ❌ Build configuration files
- ✅ Only bundled JS files included

### No Breaking Changes

- All features work exactly as before
- No API changes
- Existing PML code continues to work
- Same language features and commands

## What's Next?

See [ROADMAP.md](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/ROADMAP.md) for upcoming features:

**v0.8.x:**
- Form syntax improvements
- Parser tests
- Settings for paths

**v0.9.0:**
- Type inference
- Type-aware autocompletion

**v1.0.0:**
- Refactoring tools
- Advanced diagnostics
- Production ready

## Previous Releases

### v0.7.3 - Typo Detection Overhaul
- Eliminated false positive warnings with AST-based detection

### v0.7.2 - F12 and Hover Fixes
- Fixed Go to Definition and hover documentation

### v0.7.1 - Comparison Operators
- Added comparison operator aliases (geq, leq)

### v0.7.0 - Method Documentation
- Added documentation from comments
- Implemented Find All References

**Full Changelog**: https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/compare/v0.7.3...v0.8.0
