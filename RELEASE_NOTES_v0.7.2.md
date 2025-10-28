# v0.7.2 - Critical Fixes for F12 and Hover Documentation

## Critical Fixes

### Go to Definition (F12) - Now Works Correctly ✅
- Fixed word boundary detection in definitionProvider
- Removed dot from `isWordChar()` regex
- F12 now works correctly for method calls like `!var.methodName()`
- Jump to definition works reliably

### Hover Documentation - Now Displays Correctly ✅
- Fixed word boundary detection in hoverProvider
- Removed dot from `isWordChar()` regex
- Hover over method name now shows documentation
- Comments before methods display properly in tooltips

## Technical Details

**Root Cause:** The `isWordChar()` function in both `definitionProvider.ts` and `hoverProvider.ts` included dot (`.`) in the regex pattern `/[a-zA-Z0-9_.]/`. This caused `getWordRangeAtPosition()` to capture the entire text including the dot when hovering over `methodName` in `!var.methodName()`.

**Fix:** Changed regex from `/[a-zA-Z0-9_.]/` to `/[a-zA-Z0-9_]/` in both providers.

**Impact:**
- F12 (Go to Definition) now works for method calls
- Hover tooltips show method documentation from comments
- JSDoc-style parameter documentation displays correctly

## Installation

Download `pml-aveva-e3d-0.7.2.vsix` and install:

```bash
code --install-extension pml-aveva-e3d-0.7.2.vsix --force
```

Or install from Extensions view: Extensions → ... → Install from VSIX

## What's Changed

- Fixed F12 (Go to Definition) for method calls
- Fixed hover documentation display
- Improved word boundary detection in LSP providers

**Full Changelog**: https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/compare/v0.7.1...v0.7.2

---

## Previous Releases

### v0.7.1 - Comparison Operators and Completion Filtering
- Added `geq` and `leq` as aliases for `ge` and `le`
- Fixed completion provider to show only current file methods after dot
- Improved IntelliSense filtering

### v0.7.0 - Method Documentation and Navigation
- Added method documentation from comments
- Implemented Find All References (Shift+F12)
- Added return type support: `define method .name() is TYPE`
- Fixed Go to Definition for method calls
