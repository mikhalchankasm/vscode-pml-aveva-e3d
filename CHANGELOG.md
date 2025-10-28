# Changelog

All notable changes to the "PML for AVEVA E3D" extension will be documented in this file.

## [0.8.0] - 2025-01-24

### 🚀 Major Improvement: Code Bundling

- **Extension size reduced from 15.61 MB to 2.07 MB** (7.5x smaller!)
- **File count reduced from 1632 to 54 files** (30x fewer files!)
- **Faster activation** - bundled code loads significantly quicker
- **Better performance** - reduced I/O operations

### Added
- **esbuild Integration** - Modern bundler for extension and language server
  - Created `esbuild.js` configuration for both extension and LSP
  - Production builds use minification
  - Development builds include source maps
  - Watch mode for development

### Changed
- **Build System** - Switched from TypeScript compilation to esbuild bundling
  - `npm run compile` now uses esbuild (faster builds)
  - `npm run compile:tsc` available for TypeScript-only compilation
  - `npm run watch` uses esbuild watch mode
  - `npm run esbuild` for production builds

### Improved
- **VSIX Package** - Optimized file inclusion
  - Only bundled JavaScript files included
  - Source files excluded
  - node_modules completely excluded (code bundled)
  - Documentation and examples excluded from package
  - Faster installation and updates

### Technical
- Added `esbuild` as dev dependency
- Updated `.vscodeignore` for optimal bundling
- Updated `package.json` scripts for esbuild workflow
- Bundle targets: `out/extension.js` and `packages/pml-language-server/out/server.js`

## [0.7.3] - 2025-01-24

### Fixed
- **Typo Detection Overhaul** - Eliminated false positive warnings
  - Completely rewrote typo detector to use AST-based checking
  - No more warnings like "Possible typo: 'OK'" or "Possible typo: 'at'"
  - Only checks keywords in specific language structures (methods, if statements, etc.)
  - Arbitrary identifiers (UI labels, variable names) are no longer flagged
  - Disabled typo detection for `.pmlfrm` files (form syntax is special)
  - Parser now reuses already-built AST instead of re-parsing text

### Improved
- **Performance** - Validation is faster due to AST reuse
- **Form Files** - Better handling of `.pmlfrm` files with reduced noise
- **Code Quality** - Cleaner diagnostic approach based on syntactic context

### Technical
- Modified `typoDetector.ts` to accept AST parameter
- Added AST walker function to traverse specific node types
- Updated `server.ts` to pass parsed AST to typo detector
- Disabled text-based regex scanning (source of false positives)

## [0.7.2] - 2025-01-24

### Fixed
- **Go to Definition (F12)** - Now works correctly for method calls
  - Fixed word boundary detection to exclude dot from word range
  - Cursor on `methodName` in `!var.methodName()` now jumps to definition
  - Previously dot was included in word, breaking detection logic

- **Hover Documentation** - Method documentation now displays correctly
  - Fixed same word boundary issue affecting hover tooltips
  - Hover over method name after dot now shows documentation
  - Documentation from comments before method definition appears properly

### Technical
- Removed dot (`.`) from `isWordChar()` regex in both definitionProvider and hoverProvider
- Changed from `/[a-zA-Z0-9_.]/` to `/[a-zA-Z0-9_]/`
- This allows proper detection of dot-preceded method names

## [0.7.1] - 2025-01-24

### Added
- **Additional Comparison Operators** - Support for alternative operator spellings
  - Added `geq` as alias for `ge` (greater than or equal)
  - Added `leq` as alias for `le` (less than or equal)
  - `neq` was already supported as alias for `ne`

### Fixed
- **Completion Provider** - Shows only current file methods after dot
  - After typing `.` only methods from current document are shown
  - Prevents pollution from workspace methods
  - Built-in methods (STRING, ARRAY, etc.) still available
  - Cleaner, more focused autocompletion experience

### Improved
- Typo detector recognizes `geq`, `leq`, `neq` as valid keywords
- Better IntelliSense filtering for method calls

## [0.7.0] - 2025-01-24

### Added
- **Method Return Type Support** - Parser now accepts return type declarations
  - Syntax: `define method .name(!param is TYPE) is RETURN_TYPE`
  - Example: `define method .getData() is STRING` now parses correctly
  - Return type is stored in AST and used for documentation

- **Method Documentation from Comments** - Automatic documentation extraction
  - Comments before method definition are now shown in hover tooltips
  - Supports multi-line comments (all `--` lines before method)
  - JSDoc-style parameter documentation: `-- @param1 - description`
  - Documentation persists until empty line or non-comment
  - Example:
    ```pml
    -- This method processes data
    -- @param1 - input data string
    define method .process(!param1 is STRING)
    ```

- **Find All References** - Shift+F12 now works within current file
  - Shows all usages of method in current document
  - Finds both direct calls `.methodName()` and variable calls `!var.methodName()`
  - Highlights exact method name positions
  - Works alongside Go to Definition (F12)

### Fixed
- **Go to Definition (F12)** - Now works for method calls in same file
  - Fixed detection of method calls after dot: `!variable.methodName()`
  - Correctly identifies method name even when cursor is on method name (not dot)
  - Works for all method call patterns

### Improved
- Hover tooltips now show formatted documentation with parameters
- Method signatures in hover include parameter types
- Better symbol indexing with comment extraction

## [0.6.0] - 2025-01-21

### Added
- **OF Operator Support** - Parser now supports `of` keyword as binary operator
  - Added OF token type and parsing logic
  - Works in expressions: `namn of zone`, `name of zone of $!element`
  - Supports chaining: `attr1 of attr2 of object`
  - Example: `:Обозначение OF $!element` now parses correctly

### Fixed
- **Auto-indentation for Functions** - Code formatting now works for function blocks
  - `define function...endfunction` blocks now auto-indent like methods
  - Added folding support for function definitions
  - Fixed indentation rules in language-configuration.json

- **Typo Detector Improvements** - Eliminated false positives on special characters
  - Skip single-character identifiers (fixes `_` warnings in `Шифр_комплекта_РД`)
  - Skip attribute access (preceded by `:`)
  - No more warnings on underscores in Russian attribute names

### Improved
- Better parser error recovery for complex expressions
- Language configuration now handles all PML block types consistently

## [0.5.9] - 2025-01-21

### Added
- **Function Definition Support** - Parser now supports `define function...endfunction` syntax
  - New AST node: `FunctionDefinition` for .pmlfnc files
  - Parser accepts: `define function !!functionName(!param1, !param2)`
  - Properly closes with `endfunction`
  - Added FUNCTION and ENDFUNCTION token types
  - Example: `define function !!tsgreport()` now parses without errors

### Fixed
- **Typo Detector False Positives** - Reduced warnings on valid PML identifiers
  - Added to keywords: `function`, `endfunction`, `var`, `by`
  - Added to valid identifiers: `trace`, `off`, `on`, `of`, `file`, `zone`, `clock`, `namn`, `flnn`
  - Fixed: "var" no longer suggests "for"
  - Fixed: "trace" no longer suggests "frame"
  - Fixed: "off" no longer suggests "if"
  - Fixed: "of" no longer suggests "if"
  - Fixed: "file" no longer suggests "while"

### Improved
- Parser error messages now mention 'function' as valid after 'define'
- Typo detector now recognizes common AVEVA attributes (namn, flnn)
- Better support for .pmlfnc file extension

## [0.5.8] - 2025-01-21

### Added
- **Sort Methods Command** ⭐ HIGH PRIORITY ROADMAP ITEM
  - Command: `PML: Sort Methods (A→Z)` - Sort methods alphabetically ascending
  - Command: `PML: Sort Methods (Z→A)` - Sort methods alphabetically descending
  - Preserves preceding comments (JSDoc style and regular `--` comments)
  - Preserves blank lines between methods
  - Handles nested `define method` blocks correctly
  - Accessible via Command Palette (`Ctrl+Shift+P`)
  - Example: Sorts `.zebra()`, `.apple()`, `.banana()` → `.apple()`, `.banana()`, `.zebra()`

### Improved
- Method extraction algorithm in Sort Methods
  - Detects and preserves multi-line comments before methods
  - Handles empty lines gracefully
  - Case-insensitive sorting (natural order)

## [0.5.7] - 2025-01-21

### Added
- **Context-aware `!this.` Completion** - Form method IntelliSense
  - When typing `!this.` in a form file, shows only methods from current document
  - Supports both parsed methods (from AST) and regex-extracted methods
  - Example: `!this.` → shows `.remove()`, `.init()`, `.report()`, etc.
  - Greatly improves developer experience when working with forms

### Fixed
- **Reduced completion spam on bare `.`**
  - Empty dot no longer shows unrelated completions
  - Only shows relevant methods when context is clear

### Improved
- **Better member completion logic**
  - Enhanced regex to match `!variable.` and `$variable.` patterns
  - Workspace methods now have better filtering and sorting
  - Method completions include parameter information

## [0.5.6] - 2025-01-21

### Fixed
- **CRITICAL: LSP Server Not Found in VSIX** - Fixed production deployment
  - LSP server compiled output now correctly included in VSIX package
  - Added explicit include patterns for `packages/pml-language-server/out/`
  - Updated compile script to build both extension and LSP server
  - Fixed path: `packages/pml-language-server/out/server.js` now packaged
  - Error resolved: "LSP server.js not found at: ...packages\pml-language-server\out\server.js"

- **Object Definition Parsing** - Full support for `define object` syntax
  - Parser now correctly handles `member .property is TYPE` declarations
  - Parser now correctly handles `define method` inside objects
  - Fixed "Expected 'method'" errors on `member` statements
  - Fixed "Expected expression" errors on `.data`, `this`, etc.

- **Backslash Escape Sequences** - Removed incorrect escape handling
  - PML does NOT use backslash for escaping (it's a literal character)
  - Fixed red highlighting on characters after `\` in strings
  - Windows paths like `|Z:\RSD81\SP4\PMLLIB\dop\file|` now parse correctly
  - Removed escape patterns from TextMate grammar

### Changed
- Disabled `noUnusedLocals` and `noUnusedParameters` in LSP server tsconfig
  - Prevents compilation errors from unused imports
  - Allows successful VSIX build process

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
