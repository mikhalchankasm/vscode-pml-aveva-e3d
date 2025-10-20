# Changelog

All notable changes to the "PML for AVEVA E3D" extension will be documented in this file.

## [0.5.5] - 2025-01-20

### Fixed
- ✅ **MemberExpression AST Type** - Correct TypeScript typing
  - Changed `property` type from `Identifier` to `Expression`
  - Now supports computed (`arr[i+1]`) and non-computed (`.method`) access
  - Fixed TypeScript error: "Identifier not assignable to Expression"
  - `arr[0]` detection now actually runs (was always-false before)

- ✅ **MemberExpression Range** - Correct highlighting
  - Fixed dot member access range (was pointing to line 0)
  - Now captures start position from object, not from file top
  - Go to definition and hovers now highlight correctly
  - Example: `!var.method` now highlights entire expression, not line 0

### Added
- Test file `test_array_zero.pml` with arr[0] edge cases
- Tests for elseif blocks with array access

## [0.5.4] - 2025-01-20

### Fixed
- ✅ **Parser MemberExpression** - Array index expressions now stored correctly
  - Before: `!arr[index]` stored fake Identifier('index')
  - After: Stores real parsed expression
  - Impact: Hovers, definitions, diagnostics now work on array indices
  - Fixed ranges - no more "pointing at top of file"

- ✅ **ArrayIndexChecker** - Fixed crash on elseif statements
  - Fixed TypeError when `elseif` appears in code
  - Added proper handling for `ifStmt.alternate` (can be IfStatement or Statement[])
  - Updated `arr[0]` detection to check `Literal.value` instead of `property.name`
  - Now correctly detects and warns about zero-based array access

- ✅ **Document Validation** - Diagnostics show immediately
  - Added validation on `onDidOpen()` - no need to edit first
  - Added validation on `onDidSave()` - revalidate after save
  - Before: diagnostics only appeared after first keystroke
  - After: red squiggles appear instantly when opening file

### Technical
- All fixes based on thorough code review
- Improved AST accuracy for member expressions
- Better error handling in analysis passes

## [0.5.3] - 2025-01-20

### Fixed
- ✅ **Typo Detector** - `!this` and common identifiers no longer trigger false warnings
  - Added whitelist: `this`, `ce`, `world`, `owner`, `name`, `type`, `result`, `error`, `value`, `data`, `item`, `list`, `count`, `index`
  - No more "Did you mean 'then'?" for `!this` in form context

### Reverted
- ❌ **Type Inference Engine (v0.6.0)** - Reverted due to complexity and instability
  - Type inference will be reimplemented properly in future version
  - Removed: `typeInferenceEngine.ts`, `builtInMethodsLoader.ts`
  - Reason: Parser API mismatch, not working in production

### Changed
- 📚 **Documentation Cleanup**
  - Simplified README.md with clear navigation
  - Added bilingual support (English/Russian)
  - Removed 20+ redundant MD files
  - Kept only: README, CHANGELOG, CONTRIBUTING, objects/, packages/

## [0.5.2] - 2025-01-20

### Fixed
- ✅ **LSP Server Activation** - Critical fix for production mode
  - Fixed `Cannot find module 'vscode-languageclient/node'` error
  - Include runtime dependencies in VSIX package
  - Updated `.vscodeignore` to exclude only devDependencies
  - Added diagnostic logging

- ✅ **Form Files Support** (`.pmlfrm`)
  - Disabled strict parsing for form files (special DSL syntax)
  - Added form UI keywords: `text`, `button`, `call`, `dialog`, `resize`, `wid`, `hei`
  - Parse errors logged but not shown to user

- ✅ **Object Constructor Syntax** - `object ARRAY()` now works
  - Parser recognizes `object TYPE()` in expressions
  - Fixed "Expected expression" error

- ✅ **Workspace Indexing**
  - Excluded `objects/` and `docs/` folders from indexing
  - No more random words from documentation in completions

- ✅ **ESLint Warnings**
  - Replaced `require('fs')` with `import * as fs`
  - Added `_` prefix to unused parameters

### Changed
- Kept `activationEvents` in package.json for VSCode 1.80.0 compatibility
- Output channel now appears automatically

## [0.5.1] - 2025-01-18

### Fixed
- Critical fix for LSP server not starting in production
- Bundled knowledge base (`objects/`) into VSIX

## [0.5.0] - 2025-01-17

### Added
- Full Language Server Protocol (LSP) implementation
- Real-time diagnostics (unclosed blocks, typos)
- Workspace indexing for fast symbol search
- Typo detection with Levenshtein distance

## [0.4.8] - 2024-12-XX

### Added
- Code actions and quick fixes
- IntelliSense improvements
- Signature help for method calls

---

**Version Format:** [Semantic Versioning](https://semver.org/)
