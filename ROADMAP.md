# Roadmap - PML for AVEVA E3D Extension

Development plans and progress tracking.

---

## ✅ Completed Features

### PML Assistant Integration

- ✅ **Stable external CLI contract**
  - `npm run pml:parse -- <file> --json`
  - `npm run pml:diagnose -- <file> --json`
  - `npm run pml:symbols -- <folder> --json`
  - `npm run pml:scope -- <file> --line <line> --column <column> --json`
  - Reuses the language-server parser, diagnostics, symbol index, and document-symbol provider.

- ✅ **Initial Agent Kit VS Code bridge**
  - Agent Kit settings under `pml.agentKit.*`
  - Review, health, finding explanation, and finding help commands
  - Agent Kit findings mapped into a dedicated VS Code diagnostic collection

### Major Milestones (v0.5.0 - v0.8.8)

<details>
<summary><b>Core Language Server & Foundation (v0.5.0 - v0.6.0)</b></summary>

### Core Language Server
- ✅ **Full LSP Implementation** (v0.5.0)
  - Custom PML parser with AST
  - Lexer with full token support
  - Document validation on open/save
  - Real-time diagnostics

- ✅ **IntelliSense** (v0.5.0)
  - Method completions (STRING, REAL, ARRAY, DBREF)
  - Built-in PML keywords
  - Variable declarations
  - Object member completion

### Diagnostics
- ✅ **Array Index Checker** (v0.5.5)
  - Warning on `arr[0]` (PML arrays are 1-indexed)
  - Handles elseif statements correctly

- ✅ **Typo Detection Evolution**
  - **v0.5.4**: Initial Levenshtein distance algorithm (edit distance 1-2)
  - **v0.6.0**: Skip single-character identifiers, reduced false positives
  - **v0.7.3**: AST-based detection - eliminated false positives entirely
  - **v0.8.1**: Simplified/disabled during performance optimization
  - **v0.8.6-v0.8.7**: Restored with parse-error-based approach
    - Only checks tokens causing parse errors (no false positives)
    - Loads 75+ keywords from authoritative tokens.ts source
    - Smart scoring for best keyword match suggestions
    - Windows line ending support (CRLF)
    - Comprehensive test suite (Vitest)
  - Default: `'off'` (user must enable explicitly)
  - Disabled for .pmlfrm files

### Parser Improvements
- ✅ **Object Definition Support** (v0.5.6)
  - Parse `define object ... endobject`
  - Handle `member .property is TYPE`
  - Handle `define method` inside objects

- ✅ **Function Definition Support** (v0.5.9)
  - Parse `define function !!name() ... endfunction`
  - FunctionDefinition AST node for .pmlfnc files
  - Full parameter and body parsing
  - Works with global variable names (!!functionName)

- ✅ **MemberExpression Fixes** (v0.5.5)
  - Correct AST typing (Expression, not Identifier)
  - Fixed range calculations
  - Support computed access: `arr[i+1]`

- ✅ **Backslash Handling** (v0.5.6)
  - PML doesn't use backslash escapes
  - Windows paths work correctly: `|Z:\path\file|`

- ✅ **OF Operator** (v0.6.0)
  - Binary operator for attribute access
  - Supports: `namn of zone`, `:attr OF $!element`
  - Chaining: `name of zone of $!element`

### Code Actions & Commands
- ✅ **Code Actions Provider**
  - Quick actions in context menu
  - Array operations
  - Sort operations
  - Remove duplicates/empty lines

- ✅ **PML Tools**
  - Sort Lines (A→Z, Z→A, by length, smart natural sort)
  - Sort Methods (A→Z, Z→A) - v0.5.8
  - Remove duplicates/consecutive duplicates
  - Remove empty/whitespace lines
  - Trim trailing whitespace
  - Convert tabs ↔ spaces
  - Extract variables/methods
  - Remove comments
  - Show methods by type (STRING, REAL, ARRAY, DBREF)

### Navigation
- ✅ **Go to Definition**
  - Navigate to method definitions
  - Navigate to variable declarations
  - Cross-file support (workspace indexing)

- ✅ **Document Symbols**
  - Outline view for methods
  - Outline view for objects

- ✅ **Hover Information**
  - Method signatures
  - Variable types
  - Documentation snippets

### Production Quality
- ✅ **VSIX Packaging** (v0.5.6)
  - LSP server included in package
  - CI/CD workflows fixed
  - Production deployment working

- ✅ **Documentation Cleanup** (v0.5.5)
  - Bilingual README (EN/RU)
  - Clean project structure
  - CHANGELOG tracking

- ✅ **Code Formatting** (v0.6.0)
  - Auto-indentation for `define function...endfunction`
  - Folding support for all block types
  - Consistent language configuration

</details>

---

### Recent Releases (v0.7.0 - v0.8.8)

<details>
<summary><b>v0.7.0 - Navigation & Documentation (2025-01-24)</b></summary>

### High Priority Features

- [x] **Find All References** ✅ COMPLETED
  - Implemented reference search within current file
  - Finds method calls: `.methodName()` and `!var.methodName()`
  - Highlights exact method name positions
  - Works with Go to Definition (F12)

- [x] **Method Documentation** ✅ COMPLETED
  - Comments before methods shown in hover tooltips
  - JSDoc-style parameter docs: `-- @param1 - description`
  - Multi-line comment support
  - Formatted documentation with parameter info

- [x] **Go to Definition Improvements** ✅ COMPLETED
  - Fixed F12 for method calls in same file
  - Works for `!variable.methodName()` pattern
  - Correct dot detection

- [x] **Return Type Support** ✅ COMPLETED
  - Parser accepts: `define method .name() is TYPE`
  - Return type stored in AST

</details>

<details>
<summary><b>v0.7.1-v0.7.3 - Refinements & Fixes (2025-01-24)</b></summary>

## v0.7.1

### Improvements

- [x] **Comparison Operator Aliases** ✅ COMPLETED
  - Added `geq` as alias for `ge` (greater than or equal)
  - Added `leq` as alias for `le` (less than or equal)
  - `neq` already supported as alias for `ne`
  - No more false positive typo warnings

- [x] **Completion Provider Filtering** ✅ COMPLETED
  - After typing `.` only methods from current document shown
  - Prevents pollution from workspace methods
  - Built-in methods still available
  - Cleaner IntelliSense experience

---

## ✅ v0.7.2 - COMPLETED (2025-01-24)

### Critical Fixes

- [x] **F12 (Go to Definition) Fixed** ✅ COMPLETED
  - Fixed word boundary detection in definitionProvider
  - Removed dot from `isWordChar()` regex
  - F12 now works correctly for `!var.methodName()` calls
  - Jump to definition works reliably

- [x] **Hover Documentation Fixed** ✅ COMPLETED
  - Fixed word boundary detection in hoverProvider
  - Removed dot from `isWordChar()` regex
  - Hover over method name now shows documentation
  - Comments before methods display properly in tooltips

---

## ✅ v0.7.3 - COMPLETED (2025-01-24)

### Major Fix: Typo Detection Overhaul

- [x] **AST-based Typo Detection** ✅ COMPLETED
  - Completely rewrote typo detector to use AST instead of text scanning
  - Eliminated all false positive warnings ("Possible typo: 'OK'", "Possible typo: 'at'")
  - Only checks keywords in specific language structures (methods, if statements, etc.)
  - Arbitrary identifiers (UI labels, variable names) no longer flagged
  - Disabled typo detection for `.pmlfrm` files
  - Parser now reuses already-built AST (performance improvement)

</details>

<details>
<summary><b>v0.8.0-v0.8.7 - Performance & Testing (2025-01-28)</b></summary>

## Releases

### v0.8.0 - Code Bundling ✅
- [x] **esbuild Integration**
  - Reduced VSIX from 15.61 MB (1632 files) to 2.07 MB (54 files) - 7.5x smaller
  - Bundles extension.js and server.js into single files
  - Production minification
  - Faster activation time

### v0.8.1 - Performance & Cleanup ✅
- [x] **Memory Leak Fix** - Removed unused `documentASTs` Map
- [x] **Typo Detector Simplification** - Reduced from 191 to 30 lines (disabled functionality)
- [x] **Async Workspace Indexing** - Non-blocking file operations

### v0.8.2 - Parser Fixes ✅
- [x] **Compose Keyword Workaround** - `var !x compose space ...` now parses
- [x] **Method Call Identifiers** - `.eq()`, `.ne()` now accepted after DOT
- [x] **Nested Elseif** - Parser accepts ELSEIF token in `parseIfStatement()`

### v0.8.3 - Settings Transparency ✅
- [x] **Typo Detection Default** - Changed from `'warning'` to `'off'` in package.json
- [x] **Documentation Extraction** - `indexDocument()` passes text to `symbolIndex`

### v0.8.4 - Parser Method Calls & Elseif ✅
- [x] **METHOD Token Handling** - Lexer creates `.eq` as single token, parser now handles it
- [x] **Elseif Endif Pairing** - Fixed recursive endif consumption
- [x] **Compose Expression Completeness** - Consumes SUBSTITUTE_VAR and STRING tokens
- 📊 **Result:** test_elseif.pml - 5 parse errors → 0 parse errors

### v0.8.5 - Configuration Sync ✅
- [x] **Server Default Sync** - `defaultSettings.typoDetection` now `'off'` (matches package.json)

### v0.8.6 - Typo Detection Restored ✅
- [x] **Levenshtein Distance Algorithm** - Edit distance calculation (1-2 char threshold)
- [x] **40+ PML Keywords** - Control flow, definitions, types, operators
- [x] **Parse-Error-Based** - Only checks tokens causing errors (no false positives)
- [x] **Smart Extraction** - Analyzes error messages and line context
- 📊 **Result:** Detects typos like "iff" → "if", "doo" → "do", "endiff" → "endif"
- ⚙️ **Default:** Still `'off'` (user must enable explicitly)

### v0.8.7 - Documentation & Diagnostics Fixes ✅
- [x] **Comment Updates** - Fixed outdated "AST-BASED" → "PARSE-ERROR-BASED" in typoDetector.ts
- [x] **English Translation** - Translated Russian comments/messages in src/diagnostics.ts to English
- [x] **Typo Detector Enhancements**
  - Dynamic keyword loading from tokens.ts (75+ keywords vs hardcoded 40)
  - Fixed Windows line ending handling (split(/\r?\n/))
  - Smart keyword matching with scoring algorithm
  - Added comprehensive Vitest test suite (36 tests passing)
- [x] **ROADMAP Sync** - Updated to reflect v0.8.0-v0.8.7 progress and current status

</details>

<details>
<summary><b>v0.8.8 - Parser Tests Completion (2025-01-28)</b></summary>

**🎯 High Priority ROADMAP Task Completed**

- ✅ **Fixed All Parser Tests** - Removed stale compiled files causing vitest failures
  - Root cause: Old `.js` files (Oct 19) vs current `.ts` source (Oct 28)
  - Solution: Cleaned all stale compiled files from `src/` directory
  - Result: **20/20 parser tests passing**

- ✅ **Comprehensive Test Coverage**
  - Method definitions, variable declarations, expressions
  - Control flow (if/elseif/else, do loops)
  - Member expressions, call expressions, array access
  - Error recovery and complex scenarios
  - **38 total tests passing** (20 parser + 18 typo detector), 2 skipped

</details>

### ⭐ Latest: v0.9.9 - F12 Complete Fix & Documentation Tools (2025-01-29)

**Critical Fixes & Documentation Release:**

- ✅ **F12 (Go to Definition) - Complete Fix**
  - Works on ALL patterns: `!var.method()`, `!this.method()`, `.method()`
  - Added `isStopChar()` to stop word expansion at `!`, `$`, operators
  - Extracts method name after last dot in captured word
  - Hover provider also fixed

- ✅ **Skip Statement Support**
  - Added `SKIP` token to lexer and parser
  - `skip if(condition)` works without `then` keyword
  - Fixed "Expected 'then' after if condition" error
  - Fixed "Expected expression" error on following line

- ✅ **Insert Method Documentation Block**
  - New command for AVEVA-standard documentation
  - Auto-fills method name, preserves indentation
  - Cursor positioned at Description field
  - Format: Method, Description, Type, Arguments, Return

- ✅ **Comment Commands - Line-Based Operation**
  - Add/Remove Comments work on full lines regardless of cursor position
  - Partial multi-line selection processes all touched lines
  - Preserves indentation when adding `--`

---

### v0.9.6-v0.9.8 - Previous Releases

**v0.9.8** - Form Documentation & Dead Code Cleanup
**v0.9.7** - Form Tools (Generate/Update Methods Summary)
**v0.9.6** - UX Improvements (Comment commands, Code Actions)

---

### v0.9.5 - Menu Reorganization (2025-01-29)

- ✅ **Quick Fix Menu** - Simplified to comments only
- ✅ **Context/Toolbar** - Array submenu added to both
- ✅ **Philosophy** - Quick Fix = fast actions, Context = full toolset

---

### v0.9.4 - Menu Configuration Fix (2025-01-28)

**Bug Fix Release:**
- ✅ **Menu Configuration Corrected**
  - Context menu: Quick Actions with array commands (restored)
  - Toolbar button: Array submenu removed
  - Fixed v0.9.1 incorrect implementation

---

### v0.9.3 - Remove Comments Fix (2025-01-28)

- ✅ **Remove Comments Fixed**
  - Now removes only comment prefixes (`--` and `$*`)
  - Preserves code content after comment marker
  - No longer deletes entire lines

---

### v0.9.2 - Column Generator (2025-01-28)

- ✅ **Column Generator Command**
  - Text mode: Insert same text on each line
  - Number mode: Sequential numbers (decimal/hex/binary/octal)
  - Interactive dialogs
  - Notepad++-style functionality

---

### v0.9.1 - UI/UX Improvements (2025-01-28)

- ✅ **Context Menu Cleanup**
  - Removed PML Tools commands from context menu
  - All tools in editor title bar button
  - Cleaner user experience

- ✅ **New Commands**
  - Add Comments: Comment out selected code
  - Align PML: Smart alignment by `=` or `is` keyword

- ✅ **Fixed Commands**
  - Remove Duplicates (was broken)
  - Remove Empty Lines (was broken)
  - Trim Whitespace (was broken)

---

### v0.9.0 - Basic Form Syntax Support (2025-01-28)

**🎯 Medium Priority Task: Form Syntax Improvements - Partially Completed**

- ✅ **Parser: Form Structure Recognition**
  - Parse `setup form !!name [DIALOG|MAIN|DOCUMENT|BLOCKINGDIALOG] [RESIZABLE] [DOCK direction] ... exit`
  - Extended FormDefinition AST with modifiers and body
  - Form callbacks parsed as regular assignments

- ✅ **Parser: Gadget Declarations**
  - `button .name |Label| [OK|CANCEL|APPLY|RESET] [at x<num>]`
  - `text .name |width| [at x<num>]`
  - `option .name |width| |Label| [at x<num>]`
  - `toggle .name |Label| [at x<num>]`
  - `frame .name` with nested gadgets
  - New GadgetDeclaration AST node

- ✅ **Parser: Member Declarations**
  - `member .name is TYPE`
  - Support for all PML types (STRING, REAL, ARRAY, DBREF, etc.)
  - New MemberDeclaration AST node

- ✅ **Diagnostics: Array Index Checker Tests**
  - 30 comprehensive tests (100% pass rate)
  - Fixed critical bug: `varDecl.init` → `varDecl.initializer`

**🔄 Still Pending (Future v0.9.x releases):**
- ⏳ Gadget autocomplete in form context
- ⏳ Callback validation (undefined method warnings)
- ⏳ Form snippets
- ⏳ IntelliSense for form callbacks

---

## 🎯 Next Steps

### Medium Priority

- [x] **Form Syntax Improvements** ✅ **PARTIALLY COMPLETED (v0.9.0)**
  - ✅ Better parsing for `setup form`
  - ✅ Parse `frame`, `button`, `text`, `option`, `toggle` gadgets
  - ⏳ Gadget autocomplete in form context (deferred to v0.9.x)
  - ⏳ Callback validation (deferred to v0.9.x)

- [ ] **Enhanced Reload Form Command**
  - Detect form files automatically
  - Better error messages
  - Integration with AVEVA (if possible)

- [ ] **Settings for Paths**
  - `pml.pmllibPaths` - library paths for imports
  - `pml.uicPath` - UIC path
  - `pml.e3dVersion` - E3D version

### Testing & Quality

- [ ] **Diagnostic Tests** (Next priority)
  - Test array index checker
  - Test MemberExpression ranges
  - Test error recovery scenarios

- [ ] **Additional Parser Tests**
  - Unit tests for lexer
  - Additional edge cases (nested objects, complex expressions)
  - Performance benchmarks for large files

---

## 🚀 Future Milestones

### v0.12.30 - 2026-05-14 ✅ COMPLETED

### Patch Improvements

- [x] **Provider Hardening** ✅ COMPLETED
  - Preserve PML parameter markers in completion/signature labels.
  - Restore member-method completion after indexed, dynamic, chained, and numeric path receivers.
  - Select the signature-help overload that covers the active argument.

- [x] **Numeric Path Member Suffixes** ✅ COMPLETED
  - Parse integer path-style member suffixes such as `SREF.1` and `PLAT.2`.
  - Keep malformed non-integer numeric suffixes diagnostic.
  - Document leading-zero suffixes as literal property names.

- [x] **Corpus and Packaging Validation** ✅ COMPLETED
  - Reduce installed AVEVA corpus parser errors from 3386 to 3306.
  - Reduce `.pmlfnc` parser errors from 1045 to 1034, `.pmlfrm` from 843 to 841, and `.pmlobj` from 1495 to 1428.
  - Preserve `.pmlcmd` at 0 errors and `.pmlmac` at 3 errors.
  - Exclude generated coverage reports from VSIX packages.

---

### v0.12.29 - 2026-05-11 ✅ COMPLETED

### Patch Improvements

- [x] **Multi-Line Concatenation Regression Fix** ✅ COMPLETED
  - Restore leading `&` multi-line string concatenation without requiring `$` line continuation.
  - Keep the stricter logical-line guard for other infix operators.
  - Run project CI commands on Node 22.x while forcing GitHub JavaScript actions onto Node 24.

- [x] **Corpus Validation** ✅ COMPLETED
  - Reduce installed AVEVA corpus parser errors from 3429 to 3386.
  - Reduce `.pmlfnc` parser errors from 1056 to 1045, `.pmlfrm` from 849 to 843, and `.pmlobj` from 1521 to 1495.
  - Preserve `.pmlcmd` at 0 errors and `.pmlmac` at 3 errors.

---

### v0.12.28 - 2026-05-11 ✅ COMPLETED

### Patch Improvements

- [x] **Variable-Less Do Loops** ✅ COMPLETED
  - Parse `do from ... to ...` loops without an explicit loop variable.
  - Parse `do to ...` loops without an explicit loop variable.

- [x] **Logical-Line Expression Boundaries** ✅ COMPLETED
  - Stop infix operators from crossing physical lines unless the next line is explicitly continued with `$`.
  - Preserve explicit continued infix expressions.

- [x] **Corpus Validation** ✅ COMPLETED
  - Reduce installed AVEVA corpus parser errors from 3596 to 3429.
  - Reduce `.pmlfnc` parser errors from 1077 to 1056, `.pmlfrm` from 919 to 849, and `.pmlobj` from 1597 to 1521.
  - Preserve `.pmlcmd` at 0 errors and `.pmlmac` at 3 errors.

---

### v0.12.27 - 2026-05-11 ✅ COMPLETED

### Patch Improvements

- [x] **Corpus Regression Guard** ✅ COMPLETED
  - Add an optional AVEVA PMLLIB corpus snapshot test gated by `AVEVA_PMLLIB_PATH`.
  - Pin the v0.12.26 parser error budgets: `.pmlcmd` 0, `.pmlfnc` 1077, `.pmlfrm` 919, `.pmlmac` 3, `.pmlobj` 1597.

- [x] **Dynamic Chain Test Quality** ✅ COMPLETED
  - Add AST-shape assertions for dynamic substitute member chains.
  - Prevent regressions that parse dynamic member chains as separate statements while still reporting zero errors.

- [x] **GitHub Actions Node 24 Readiness** ✅ COMPLETED
  - Force GitHub JavaScript actions onto the Node 24 runtime.
  - Keep project test/build commands on Node 22.x until the Vitest/Vite stack is stable on Node 24.
  - Opt JavaScript actions into the Node 24 runtime ahead of GitHub's Node 20 runtime removal.

---

### v0.12.26 - 2026-05-11 ✅ COMPLETED

### Patch Improvements

- [x] **Dynamic Member Chains** ✅ COMPLETED
  - Parse dynamic substitute segments inside member chains such as `!this.error$!<a>.val`.
  - Parse dynamic property names such as `!this.$!<a>origin`.
  - Parse indexed dynamic member names such as `!this.stack$!i$n[!a].elevation`.

- [x] **Review Hardening** ✅ COMPLETED
  - Clarify dynamic global validation as a prefix check.
  - Add negative coverage for `!!$` and `!!$!!`.

- [x] **Corpus Validation** ✅ COMPLETED
  - Reduce installed AVEVA corpus parser errors from 3922 to 3596.
  - Reduce `.pmlfnc` parser errors from 1174 to 1077, `.pmlfrm` from 1034 to 919, and `.pmlobj` from 1711 to 1597.
  - Preserve `.pmlcmd` at 0 errors and `.pmlmac` at 3 errors.

---

### v0.12.25 - 2026-05-11 ✅ COMPLETED

### Patch Improvements

- [x] **Dynamic Global Validation** ✅ COMPLETED
  - Reject incomplete dynamic global variable forms such as `!!$!` and `!!$!<`.
  - Preserve real AVEVA dynamic global forms such as `!!$!!<ce.dbType>CE`.
  - Keep missing-`define` diagnostics for statement-start `function` definitions covered by regression tests.

- [x] **Corpus Validation** ✅ COMPLETED
  - Preserve the installed AVEVA corpus parser baseline at 3922 errors.
  - Preserve `.pmlcmd` at 0 errors and `.pmlmac` at 3 errors.

---

### v0.12.24 - 2026-05-11 ✅ COMPLETED

### Patch Improvements

- [x] **Dynamic PML Attribute Expressions** ✅ COMPLETED
  - Parse `function of ...` as an expression attribute despite `function` also being a parser keyword.
  - Parse dynamic global names such as `!!$!gadgetValue`, `!!$!<formName>`, and `!!$!fName$n.$!root$nLS`.
  - Make form reference validator tests resilient to diagnostic ordering changes.

- [x] **Corpus Validation** ✅ COMPLETED
  - Reduce installed AVEVA corpus parser errors from 4026 to 3922.
  - Reduce `.pmlfnc` parser errors from 1199 to 1174, `.pmlfrm` from 1050 to 1034, and `.pmlobj` from 1774 to 1711.
  - Preserve `.pmlcmd` at 0 errors and `.pmlmac` at 3 errors.

---

### v0.12.23 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **Conditional Loop Diagnostics** ✅ COMPLETED
  - Preserve `continue` vs `skip` keyword identity on `ContinueStatement`.
  - Walk conditional `break if ...` and `skip if ...` expressions in array-index diagnostics.
  - Walk conditional `break if ...` and `skip if ...` expressions in opt-in form reference diagnostics.

- [x] **Corpus Validation** ✅ COMPLETED
  - Preserve the installed AVEVA corpus parser baseline at 4026 errors.
  - Preserve `.pmlcmd` at 0 errors and `.pmlmac` at 3 errors.

---

### v0.12.22 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **Conditional Loop AST Quality** ✅ COMPLETED
  - Store parsed conditions on `break if ...` AST nodes.
  - Store parsed conditions on `skip if ...` AST nodes while keeping `ContinueStatement` compatibility.
  - Add AST-shape assertions and extra malformed `do from` loop-bound coverage.

- [x] **Corpus Validation** ✅ COMPLETED
  - Preserve the installed AVEVA corpus parser baseline at 4026 errors.
  - Preserve `.pmlcmd` at 0 errors and `.pmlmac` at 3 errors.

---

### v0.12.21 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **PML1 Loop Compatibility** ✅ COMPLETED
  - Parse same-line `break if ...` as a conditional loop exit.
  - Parse open-ended `do !i from ...` loops and optional `by` steps without requiring `to`.
  - Keep malformed same-line `do from` trailing tokens diagnostic.

- [x] **Corpus Validation** ✅ COMPLETED
  - Reduce installed AVEVA corpus parser errors from 5195 to 4026.
  - Reduce `.pmlfnc` parser errors from 1505 to 1199, `.pmlfrm` from 1399 to 1050, and `.pmlobj` from 2288 to 1774.
  - Preserve `.pmlcmd` at 0 errors and `.pmlmac` at 3 errors.

---

### v0.12.20 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **PML1 Command Corpus Reduction** ✅ COMPLETED
  - Keep the `skip if` same-line rule documented and covered by regression tests.
  - Add standalone `SETCOMPDATE ...` coverage outside the larger method fixture.
  - Add PML1 `onerror`, `label`, `golabel`, and `use ... for ...` command starters from installed AVEVA code.

- [x] **Corpus Validation** ✅ COMPLETED
  - Reduce installed AVEVA corpus parser errors from 5321 to 5195.
  - Reduce `.pmlfnc` parser errors from 1611 to 1505, `.pmlfrm` from 1404 to 1399, and `.pmlobj` from 2303 to 2288.
  - Preserve `.pmlcmd` at 0 errors and `.pmlmac` at 3 errors.

---

### v0.12.19 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **AVEVA Form Corpus Reduction** ✅ COMPLETED
  - Keep standalone `if` statements after a plain `skip` from being consumed as `skip if`.
  - Add the PML1 `SETCOMPDATE ...` command starter used in installed form code.
  - Clear `admextractcntrol.pmlfrm` and `lstclaim.pmlfrm` parser diagnostics.

- [x] **Regression Coverage** ✅ COMPLETED
  - Add tests for `SETCOMPDATE FOR DB ... TO EXTRACT` and `skip` followed by a nested `if`.
  - Reduce installed `.pmlfrm` parser errors from 1410 to 1404 and `.pmlobj` parser errors from 2306 to 2303.

---

### v0.12.18 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **Release Workflow Hardening** ✅ COMPLETED
  - Use `python3` explicitly in the release checksum injection step.
  - Fail release publication if the SHA256 placeholder is missing.
  - Add CI and release checks for VSIX size and accidental `manuals/` packaging.

- [x] **Release Notes Clarity** ✅ COMPLETED
  - Document that GitHub Actions replaces the source `SHA256` placeholder during publication.

---

### v0.12.17 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **GitHub Actions Release Flow** ✅ COMPLETED
  - Replace the Windows-only `npm run pack` implementation with a cross-platform Node wrapper.
  - Make GitHub CI installation steps choose `npm ci` only when a lockfile exists.
  - Make the release workflow compute and upload CI-built VSIX SHA256 metadata.

- [x] **Release Process Cleanup** ✅ COMPLETED
  - Confirm pushes to `main` now pass GitHub CI.
  - Use tag-triggered GitHub Release publishing as the primary release path.

---

### v0.12.16 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **Packaging Hygiene and Collect Validation** ✅ COMPLETED
  - Exclude local `manuals/` reference content from both git and VSIX packaging.
  - Tighten PML1 `collect all ...` parsing so malformed forms produce diagnostics.
  - Keep DrawList continuation syntax such as `collect all PIPE for !!ce $` / `from drawlist` valid.

- [x] **Regression Coverage** ✅ COMPLETED
  - Add negative tests for malformed `collect all` statements and expression-context `collect` usage.
  - Preserve installed AVEVA PMLLIB corpus baselines while restoring compact VSIX packaging.

---

### v0.12.15 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **DrawList Collect and Menu Regression Fix** ✅ COMPLETED
  - Prevent procedural menu initializer calls from consuming the form's outer `exit`.
  - Restore `admin/forms/admstamp.pmlfrm` to zero parser errors.
  - Parse standalone PML1 `collect all ...` statements, including `from drawlist` sources.

- [x] **Regression Coverage** ✅ COMPLETED
  - Add tests for procedural menu initializers and DrawList `collect all ... from drawlist` patterns.
  - Reduce installed `.pmlfrm` parser errors from 1412 to 1410 while preserving other corpus baselines.

---

### v0.12.14 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **Menu-body Recovery Hardening** ✅ COMPLETED
  - Detect menu bodies by structural boundaries instead of first-line keyword allowlists.
  - Keep unknown menu-body lines inside the menu block and diagnose them consistently.
  - Treat `list` and `view` identifier gadgets as form-body boundaries after menus.
  - Consume multiline string tokens as one logical line during recovery.

- [x] **Regression Coverage** ✅ COMPLETED
  - Add tests for unknown menu-body lines, `list`/`view` gadget boundaries after menus, and exact `Unexpected 'is' after expression` diagnostics.
  - Preserve the installed AVEVA PMLLIB corpus baseline: `.pmlfrm` stays at 1412 errors and other extensions remain unchanged.

---

### v0.12.13 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **Post-review False-positive Reduction** ✅ COMPLETED
  - Accept nameless AVEVA form gadgets that begin with modifier keywords such as `pixmap`.
  - Keep `setup form` to `define method` boundaries permissive where shipped `.pmlfrm` files rely on that shape.
  - Preserve `.pmlfnc` command-style `ID/id` lines from the installed AVEVA corpus.
  - Recognize menu bodies that start with layout directives without consuming standalone form gadgets.

- [x] **Regression Coverage** ✅ COMPLETED
  - Add tests for nameless gadgets, menu layout-directive bodies, form/method boundaries, `.pmlfnc` command-style lines, and chained assignment `is` tails.
  - Reduce installed `.pmlfrm` parser errors from 1414 to 1412 while preserving other corpus baselines.

---

### v0.12.12 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **Post-review Form Parser Safeguards** ✅ COMPLETED
  - Report malformed and unterminated form sub-blocks.
  - Prevent standalone menu declarations from consuming following gadgets.
  - Restrict bare-identifier gadget names to underscore-prefixed names.
  - Tighten PML1 `is` phrase recovery and object constructor parsing.
  - Restrict `id`, `gap`, and `calldrg` command starters outside known AVEVA parser modes.

- [x] **Negative Regression Coverage** ✅ COMPLETED
  - Add tests for malformed sub-blocks, standalone menus, gadget-name typos, over-broad `is` phrases, and bare object constructors.
  - Preserve `.pmlfnc`, `.pmlobj`, `.pmlcmd`, and `.pmlmac` corpus baselines.

---

### v0.12.11 - 2026-05-10 ✅ COMPLETED

### Patch Improvements

- [x] **Installed AVEVA PMLFRM Parser Pass** ✅ COMPLETED
  - Parse `layout form ...` definitions.
  - Keep form parsing open across `bar`, `menu`, and `rgroup` sub-blocks.
  - Accept bare-identifier gadget names such as `_cancel`.
  - Parse `MENU` custom parameter types and `object FORM()` constructors.
  - Reuse PML1 direction phrase recovery for assignment expressions.

- [x] **Corpus Baseline Improvement** ✅ COMPLETED
  - Reduce installed `.pmlfrm` parser errors from 3010 to 1409 across 1206 files.
  - Reduce installed `.pmlfnc` parser errors from 1735 to 1611.
  - Reduce installed `.pmlobj` parser errors from 2694 to 2306.
  - Keep installed `.pmlcmd` parser errors at 0.

---

### v0.12.10 - 2026-05-09 ✅ COMPLETED

### Patch Improvements

- [x] **Post-review Parser Safeguards** ✅ COMPLETED
  - Report missing `define` before `function !!name()` at the actual typo location.
  - Keep DBREF literals typed as `dbref` in the parser AST.
  - Restrict multiline `compose` continuation recovery to tokens following a real trailing `$`.
  - Extend recovered `if`, `do`, and `handle` ranges to definition boundaries.

- [x] **Validation Baseline Preservation** ✅ COMPLETED
  - Add regression tests for the review findings.
  - Preserve the installed AVEVA PMLLIB parser error baseline from `v0.12.9`.

---

### v0.12.9 - 2026-05-09 ✅ COMPLETED

### Patch Improvements

- [x] **Installed AVEVA PMLOBJ Corpus Pass** ✅ COMPLETED
  - Improve recovery at method-definition boundaries for unterminated `if`, `do`, and `handle` blocks.
  - Parse PML DBREF literals such as `=0/0`.
  - Consume multiline `var ... compose ...` statements with `$` continuations.
  - Expand command-style metadata for object-file PML1 toolbar and drawing/model command lines.

- [x] **Corpus Baseline Improvement** ✅ COMPLETED
  - Reduce installed `.pmlobj` parser errors from 11007 to 2694 across 1334 files.
  - Reduce installed `.pmlfnc` parser errors from 2852 to 1735.
  - Reduce installed `.pmlfrm` parser errors from 10980 to 3010.

---

### v0.12.8 - 2026-05-09 ✅ COMPLETED

### Patch Improvements

- [x] **Parser Safeguard Follow-up** ✅ COMPLETED
  - Report malformed `setup command` controllers instead of silently consuming input.
  - Keep `$T<n>` trace control recognition narrow and add assignment guards for command-line whitelist handling.
  - Add `$M` hover support for dollar-prefixed PDMS command starters.
  - Add negative regression tests around the new parser heuristics.

- [x] **PMLFNC Corpus Regression Cleanup** ✅ COMPLETED
  - Parse optional `define function ... ) is TYPE` return types, including `FORM`.
  - Parse wildcard path arguments such as `/*MDS/CATA`.
  - Parse PML1 call argument phrases such as `u wrt /*`.
  - Reduce installed `.pmlfnc` parser errors from 7707 in `v0.12.6` to 2852 with zero regressions.

---

### v0.12.7 - 2026-05-09 ✅ COMPLETED

### Patch Improvements

- [x] **Installed AVEVA PMLLIB Command Corpus** ✅ COMPLETED
  - Use `C:\Program Files (x86)\AVEVA\Everything3D2.10\PMLLIB` as an external validation corpus only.
  - Parse `setup command ...` controller files separately from `setup form` definitions.
  - Accept command-controller idioms: `indices` loops, indexed property assignments, chained no-argument calls, `/*` wildcard path arguments, line-continuation `$`, `$T8+`/`$T8-`, and chained `elsehandle` clauses.
  - Expand the PDMS command starter metadata with observed real command starters.

- [x] **Corpus Baseline Improvement** ✅ COMPLETED
  - Reduce installed `.pmlcmd` parser errors from 1200 to 0 across 698 files.
  - Add synthetic regression tests for the real syntax forms without copying AVEVA source files.

---

### v0.12.6 - 2026-05-09 ✅ COMPLETED

### Patch Improvements

- [x] **Large Form Cascade Reduction** ✅ COMPLETED
  - Treat `exit` and `options` as AVEVA command-style lines inside methods.
  - Parse `define(...)` as a PML built-in call in expressions.
  - Parse dynamic substitute member access such as `!this.$!<name>.EditableGrid(false)`.
  - Recover nested pipe text fragments with non-ASCII text inside call arguments.

- [x] **Fixture Baseline Improvement** ✅ COMPLETED
  - Reduce `examples/test2form.pmlfrm` parser smoke baseline from 49 to 2 errors.
  - Keep the remaining two diagnostics tied to a real fixture issue: stray `endif` and missing `endmethod` in `.report()`.

---

### v0.12.5 - 2026-05-09 ✅ COMPLETED

### Patch Improvements

- [x] **Large Form Parser Gap Reduction** ✅ COMPLETED
  - Parse `.:attribute` member access after variables and method calls.
  - Parse `inset (...)` comparisons used by form export filters.
  - Keep pipe-string substitution fragments inside call arguments.
  - Accept `do !plot to $!isoCount` loop syntax.

- [x] **Fixture Baseline Improvement** ✅ COMPLETED
  - Add `claim` to the PDMS command starter metadata.
  - Reduce `examples/test2form.pmlfrm` parser smoke baseline from 85 to 49 errors.

---

### v0.12.4 - 2026-05-09 ✅ COMPLETED

### Patch Improvements

- [x] **Form Reference Diagnostics** ✅ COMPLETED
  - Add `pml.diagnostics.formReferences` for opt-in `.pmlfrm` callback and gadget reference validation.
  - Warn/error when callback assignments or gadget `call` modifiers target missing form methods.
  - Warn/error when form methods reference unknown `!this.<name>` members or gadgets.

- [x] **Noise Control** ✅ COMPLETED
  - Keep form reference diagnostics disabled by default.
  - Run form reference validation only when the form parses without parser errors to avoid cascade noise.
  - Document the setting in English and Russian README sections.

---

### v0.12.3 - 2026-05-08 ✅ COMPLETED

### Patch Improvements

- [x] **Form Outline Metadata** ✅ COMPLETED
  - Preserve nested `frame ... exit` hierarchy in the AST.
  - Index top-level form gadgets and nested frame gadgets.
  - Show forms, frames, and gadgets as nested Document Symbols in the VS Code Outline.

- [x] **Regression Coverage** ✅ COMPLETED
  - Add document-symbol test coverage for `form -> frame -> nested frame/gadget` outlines.

---

### v0.12.2 - 2026-05-08 ✅ COMPLETED

### Patch Improvements

- [x] **Additional Form Gadget Syntax** ✅ COMPLETED
  - Parse `container .name nobox PMLNETCONTROL ...` declarations.
  - Parse `menu .name popup` declarations.
  - Parse `para` and `paragraph` gadgets used by AVEVA form examples.

- [x] **Draft-Line Recovery** ✅ COMPLETED
  - Recover from incomplete member access such as `!k.` without cascading diagnostics.
  - Keep same-line gadget modifiers such as `toggle` from becoming false gadget declarations.
  - Accept angle-bracket substitution expressions such as `$!<this.name>`.

- [x] **Fixture Coverage Expansion** ✅ COMPLETED
  - Extend `.pmlfrm` smoke tests to hidden real-world fixtures.
  - Keep `traExampleButtons.pmlfrm`, `equibasic.pmlfrm`, and `traExampleCallback.pmlfrm` at zero parser errors.

---

### v0.12.1 - 2026-05-08 ✅ COMPLETED

### Patch Improvements

- [x] **Form Fixture Cleanup** ✅ COMPLETED
  - Remove accidental JavaScript from `examples/ceposition.pmlfrm`
  - Keep `ceposition.pmlfrm` as a zero-error parser smoke fixture

- [x] **Callback Extraction Tightening** ✅ COMPLETED
  - Avoid capturing unrelated members like `recall` and `callRegistry`
  - Keep known AVEVA callback fields and `.callback` assignments supported

- [x] **Fixture Smoke Tests** ✅ COMPLETED
  - Parse `examples/*.pmlfrm` in CI tests
  - Enforce non-regression baselines while allowing future parser improvements

---

### v0.12.0 - 2026-05-08 ✅ COMPLETED

### First-Class `.pmlfrm` Foundation

- [x] **Real Form Parser Compatibility** ✅ COMPLETED
  - Support member access after method calls, including `!this.link.Unset().Not()`
  - Parse form-level member assignments as assignment expressions
  - Extract callback bindings from `!this.*call` and `!this.*.callback` assignments

- [x] **Form DSL Structure Support** ✅ COMPLETED
  - Support nested `frame ... exit` blocks
  - Accept numeric `handle (1000,0)` headers used around imports
  - Add `import` and `using` command starters for form/import workflows

- [x] **Regression Coverage** ✅ COMPLETED
  - Add tests for chained calls, callback assignment extraction, nested frames, numeric handle headers, and `using namespace`

---

### v0.11.8 - 2026-05-08 ✅ COMPLETED

### Patch Improvements

- [x] **PDMS Hover Comment Awareness** ✅ COMPLETED
  - Suppress PDMS command hover inside `--`, `$*`, and `$( ... $)` comments
  - Add regression coverage for commented command starters

- [x] **Form Tool Guards** ✅ COMPLETED
  - Stop form-only commands after warning when the active document is not `.pmlfrm`

- [x] **CI and Docs Maintenance** ✅ COMPLETED
  - Add VSIX packaging to GitHub Actions CI
  - Document `pml.diagnostics.formErrors` in README

---

### v0.11.7 - 2026-05-08 ✅ COMPLETED

### Patch Improvements

- [x] **PDMS Command Metadata Foundation** ✅ COMPLETED
  - Convert command starters into categorized metadata with short descriptions
  - Add line-start-only hover help for whitelisted PDMS command starters
  - Add regression tests for command metadata and hover behavior

- [x] **Form Diagnostics Control** ✅ COMPLETED
  - Add `pml.diagnostics.formErrors` for opt-in `.pmlfrm` parser diagnostics
  - Make `.pmlfrm` detection case-insensitive in language-server and form tool paths

- [x] **Maintenance Cleanup** ✅ COMPLETED
  - Remove unused legacy client provider source files
  - Expand GitHub Actions CI coverage
  - Keep README VSIX install examples version-neutral

---

### v0.11.6 - 2026-05-08 ✅ COMPLETED

### Patch Improvements

- [x] **VSIX Asset Size Reduction** ✅ COMPLETED
  - Resize `icons/pml-icon.png` from 1024x1024 to 256x256
  - Reduce icon asset size from 1.84 MB to about 95 KB
  - Reduce packaged VSIX size from about 2.02 MB to about 301 KB

- [x] **Extension Entry Cleanup** ✅ COMPLETED
  - Remove obsolete commented-out legacy provider registration blocks from `src/extension.ts`
  - Keep active extension activation code focused on currently registered providers and tools

---

### v0.11.5 - 2026-05-08 ✅ COMPLETED

### Patch Improvements

- [x] **Post-Review Parser Hardening** ✅ COMPLETED
  - Limit PDMS command highlighting to line-start command starters
  - Keep `add(...)`, `move = ...`, indexed/member access, and `of` expressions parseable
  - Align `$P` parser handling with print-tool whitespace rules

- [x] **`$P` Print Tool Optimization** ✅ COMPLETED
  - Debounce refreshes and cache scans by document version
  - Re-resolve hover command targets before line-level comment/delete actions
  - Add pure utility tests for print scanning and comment/uncomment round-trips

- [x] **Packaging and Documentation Cleanup** ✅ COMPLETED
  - Tighten VSIX packaging rules
  - Document `$P` print tools and the PDMS command starter whitelist in README

---

### v0.11.4 - 2026-05-08 ✅ COMPLETED

### Patch Improvements

- [x] **PDMS Command Starter Whitelist** ✅ COMPLETED
  - Store curated command starters in `packages/pml-language-server/src/data/pdmsCommands.ts`
  - Use the whitelist for parser line-command handling
  - Highlight whitelisted command starters as semantic keywords
  - Seed entries from observed project commands and common PDMS command examples

- [x] **`$P` Print Tools** ✅ COMPLETED
  - Highlight active `$P ...` lines with full-line decorations
  - Add status bar count for active print lines
  - Provide hover-only print actions to avoid persistent visual clutter
  - Add next/previous navigation, comment all, uncomment all, and delete all commands

---

### v0.11.3 - 2026-05-07 ✅ COMPLETED

### Patch Improvements

- [x] **Real PML Parser Coverage** ✅ COMPLETED
  - Validate `proreport.pmlfnc` and `exportifczones.pmlfnc` with zero parser errors
  - Support concatenation with `&`, database paths, database attributes, and numeric units
  - Support empty global function calls and AVEVA line commands
  - Keep `return` without a value line-scoped

- [x] **Comment and Output Highlighting** ✅ COMPLETED
  - Keep `$*` as a single-line comment
  - Support `$( ... $)` multi-line comments
  - Highlight `$P ...` output lines as output commands

---

### v0.11.2 - 2026-05-06 ✅ COMPLETED

### Patch Improvements

- [x] **Variable Substitution Parsing** ✅ COMPLETED
  - Accept `$!local`, `$!!global`, `$/attribute`, and `$identifier` as valid expressions
  - Support substitution expressions as standalone commands and assignment values
  - Keep incomplete substitution tokens reported as parser errors

- [x] **Substitution Highlighting** ✅ COMPLETED
  - Add TextMate scopes for substitution variables
  - Add semantic tokens for substitution variables
  - Treat `$!site` as one editor word for selection/navigation

- [x] **Function Block Regression Coverage** ✅ COMPLETED
  - Validate `define function !!name(...)` / `endfunction` blocks with typed parameters
  - Cover nested statements and substitution expressions inside function bodies
  - Confirm existing folding and indentation rules include function blocks

---

### v0.11.1 - 2026-05-06 ✅ COMPLETED

### Patch Improvements

- [x] **Form Parser Hardening** ✅ COMPLETED
  - Parse `combo` gadgets and `track` callbacks
  - Keep gadget modifiers scoped to the declaration line
  - Support `width`/`wid`, `height`/`hei`, `tooltip`, `call`/`callback`, `pixmap`, and `at x<num>`

- [x] **Rename and References Improvements** ✅ COMPLETED
  - Find callback method references inside pipe strings
  - Rename callback method references without duplicate edits
  - Support nested attribute-path method references
  - Share CRLF-safe offset conversion helpers

- [x] **Packaging Cleanup** ✅ COMPLETED
  - Exclude local agent/config folders from VSIX
  - Remove stray root file `-`

---

### v0.11.0 - 2026-01-06 ✅ COMPLETED

### New Features Implemented

- [x] **Rename Symbol (F2)** ✅ COMPLETED
  - Rename methods with updates to all calls
  - Rename variables (local and global)
  - Rename objects and forms
  - Validates new name format
  - Preview before applying

- [x] **Semantic Highlighting** ✅ COMPLETED
  - Variables highlighted distinctly (`!local`, `!!global`)
  - Method names with definition detection
  - Parameters in method signatures
  - Type keywords (STRING, REAL, BOOLEAN, etc.)
  - Control flow keywords highlighted
  - Comments and string literals

- [x] **Workspace Indexing Progress** ✅ COMPLETED
  - Progress bar during startup indexing
  - "Indexed X/Y files" percentage reporting
  - Final summary of indexed symbols

- [x] **Context-Aware Parser Errors** ✅ COMPLETED
  - Errors include helpful suggestions
  - Array index errors explain 1-based indexing
  - Method syntax hints
  - Typo suggestions for keywords
  - Loop/condition context messages

- [x] **Dead Settings Cleanup** ✅ COMPLETED
  - Removed non-functional typeInference settings
  - Removed the then-non-functional inlayHints settings before the provider was implemented in v0.12.38

---

### v1.0.0 - Target Release

### Type Inference (Re-implementation)

- [ ] **Basic Type Inference**
  - Determine variable types from assignments
  - `!var = object STRING()` → type: STRING
  - `!arr = object ARRAY()` → type: ARRAY
  - Track types through AST

- [ ] **Type-aware Autocompletion**
  - `!str.` → show only STRING methods
  - `!arr[1].` → array element methods
  - Filter completions by type

### Refactoring

- [ ] **Extract Method**
  - Selection → new method
  - Automatic parameter detection
  - Return value detection

### Advanced Diagnostics

- [ ] **Callback Method Validation**
  - Warning if callback references non-existent method
  - Quick Fix: "Generate callback stub method"

- [ ] **Gadget Reference Checking**
  - Error on unknown gadget in `!this.gadget`
  - Autocomplete gadget names from form definition

---

## 🔥 v1.0.0 - Q3 2025

### Snippets

- [~] **EDG Snippets** (Event Driven Graphics)
  - ✅ Single- and multiple-element picks plus callback templates in Quick Actions.
  - ✅ Registered Pline `EDGPACKET` template in Quick Actions.
  - ⏳ Additional common EDG patterns.

- [ ] **PML.NET Snippets**
  - Template for PML↔.NET bridge
  - C# class stub reference
  - Common .NET interop patterns

- [ ] **Form Snippets**
  - Form template
  - Frame template
  - Common gadget templates

### Integration

- [ ] **AVEVA E3D Integration** (if possible)
  - Task Provider for running PML
  - PML Console integration
  - Direct script execution
  - Session management

---

### Advanced Quality & Community (v1.0 focus)

- [ ] **Semantic Highlighting**
  - Different colors for different token types
  - Highlight variable scope

- [x] **Code Lens** ✅ COMPLETED
  - Shows clickable reference counts above methods and global functions
  - Keeps method counts file-scoped and function counts workspace-scoped

- [x] **Inlay Hints** ✅ COMPLETED
  - Shows reliable variable types inline on the first typed assignment in each scope
  - Propagates typed parameters, direct aliases, and explicit unambiguous callable return types
  - Shows parameter names for unambiguous indexed method and global-function calls

- [ ] **Workspace Symbols**
  - Search across all project files
  - Quick navigation to any symbol

- [ ] **Complete Documentation**
  - All commands documented
  - Examples for each feature
  - Video tutorials

- [ ] **GitHub Discussions**
  - Community support
  - Feature discussions

- [ ] **Contributing Guidelines**
  - Code style guide
  - PR template
  - Good first issue labels

- [ ] **Full Test Coverage**
  - Unit tests: >80% coverage
  - Integration tests
  - End-to-end tests

- [ ] **Performance Benchmarks**
  - Large file handling (>10k lines)
  - Workspace with 100+ files
  - Memory usage optimization

---

## 🤔 Future Ideas (v2.0+)

### Major Features

- [ ] **Debugger Adapter**
  - PML debugging (if API available)
  - Breakpoints
  - Watch variables
  - Call stack

- [ ] **AVEVA E3D Database Browser**
  - Browse DB elements in tree view
  - Sync with E3D session
  - Navigate hierarchy

- [ ] **Visual Form Designer**
  - WYSIWYG form editor
  - Drag & Drop gadgets
  - Preview form

- [ ] **Tree-sitter Parser**
  - Separate project `tree-sitter-pml`
  - Better performance
  - Incremental parsing
  - Query-based features

---

## 📊 Current Status

**Version:** 0.13.1 release candidate
**Prepared:** 2026-07-12

**Statistics:**
- Extension size: **0.4 MB** (bundled with esbuild)
- Files in VSIX: 16 files
- LSP features: 16+ providers (with workspace-wide references, CodeLens, Call Hierarchy, and Inlay Hints)
- Commands: 35+ (with array manipulation and print-output tools)
- Diagnostics: 5 types (configurable severity levels)
- Form support: First-class foundation for frame nesting, outline symbols, callback assignments, opt-in form reference validation, PML attribute member access, dynamic substitute member access, import workflows, and common form gadgets
- Tests: **439 passing, 3 skipped by default** (22 client + 417 language-server tests covering parser, providers, diagnostics, tools, and performance guards)
- VSIX Storage: **GitHub Releases only**; repository stays clean

**Current Focus (v0.12.x):**
- ✅ **Form Parser Foundation** - Chained calls, callback assignments, nested frames, outline symbols, common form gadgets, guarded reference diagnostics, PML attribute member access, dynamic substitute member access, import wrappers, and form fixture smoke tests are in place.
- ✅ **Stable Packaging** - VSIX ships 16 runtime/user-facing files and stays in GitHub Releases only.
- ✅ **Release Safety** - Marketplace publication is gated behind explicit workflow-dispatch approval, historical release checksums remain immutable, and release automation runs TypeScript, language-server tests, extension smoke, extension-host smoke, and VSIX validation before release publication.
- ✅ **Reproducible Build Inputs** - npm lockfiles are tracked, CI runs on all push branches, VSIX packaging uses pinned local `@vscode/vsce`, and local reinstall packaging cannot fall back to a registry download.
- ✅ **Dependency Audit Hygiene** - Root and language-server npm audits are clean after lockfile refresh.
- ✅ **Validation Documentation Hygiene** - Generated Vitest config output was removed, docs distinguish bundled compile from TypeScript validation, and `compile:tsc` performs no-emit checks without polluting bundle output directories.
- ✅ **Test Layer Separation** - Client transform, print-command, and Agent Kit helper tests run from the root project while language-server tests remain package-local, with both suites enforced in CI and release validation.
- ✅ **VSIX Package Hygiene** - Local release-check artifacts are excluded from packaged VSIX files and blocked by VSIX validation.
- ✅ **Print Debug Workflow** - `$P` highlighting, navigation, comment/uncomment, and delete commands are available.
- ✅ **Parser Hardening** - Real PML/PMLFNC compatibility cases and installed AVEVA `.pmlcmd` command-controller syntax are covered with regression tests.
- ✅ **Quick UX Presets** - A single discoverable launcher now groups common cleanup actions, debug-print actions, documentation helpers, and practical starter blocks.
- ✅ **Type Hint Toggle** - Command Palette and Quick Actions can show or hide inferred variable type hints independently from parameter hints.
- ✅ **DBREF and ATTRIBUTE Method Assistance** - Selected DBREF and ATTRIBUTE object method completions and hover docs are available from reviewed AVEVA help slices while avoiding generic method noise.
- ✅ **PML Assistant Static Contract** - The extension ships a bundled CLI for parse, diagnostics, symbols, and scope queries. Live E3D readiness remains external and must not be inferred from static validation.
- ✅ **Agent Kit Execution Safety** - Agent Kit commands require trusted workspaces, run npm without Windows shell parsing so file paths remain literal, and only auto-discover a sibling `e3d-pml-agent-kit` folder unless configured explicitly.
- ✅ **Indexed Method Navigation** - Workspace method References and Rename now use indexed AST call sites first, with text scanning retained for callback-string and bare method-reference fallback cases, including delimiter-adjacent references.
- ✅ **File-Scoped User Methods** - User-defined method completions, hover usages, Go to Definition, Find References, Rename, and Signature Help stay inside the current file to avoid collisions between forms with the same method names.
- ✅ **Global Function Navigation** - `!!function(...)` calls are indexed separately from methods and exposed through References, Go to Definition, hover usages, Signature Help, completions, symbols, and CLI output.
- ✅ **Global Function Rename** - Rename for direct `!!function(...)` symbols updates function definitions and indexed direct calls without rewriting global variables, form member calls, or file-local methods.
- ✅ **Form Symbol Navigation** - `!!Form` symbols inside member calls such as `!!Form.show()` resolve to the form for Go to Definition, Find References, and Rename while keeping the member method target distinct.
- ✅ **Object Constructor Navigation** - Object constructor symbols such as `object Pump()` resolve to object definitions/references/renames without colliding with same-name methods.
- ✅ **Rename/References Boundaries** - Object and form Rename/References avoid partial matches in longer same-prefix identifiers and share syntax-aware tie-breaking when names collide.
- ✅ **Code-Editing Safety** - Rename keeps same-name variables on the variable path, preserves variable sigils for unprefixed replacement names, avoids consuming slash expressions, separates top-level variables from method/function-local variables, rejects same-scope variable rename collisions, fails workspace Rename safely on unreadable indexed files, line-oriented editing commands preserve CRLF, Format Document ignores `=` inside PML string literals, Sort Methods preserves comments without duplication, Reindex Selected Array keeps each selected array name intact and rejects no-op selections, and Add to Array skips comments without reordering selected blocks.
- ✅ **Parser Recovery Safety** - Malformed statements recover at physical line boundaries so later method/object statements remain available to diagnostics, symbols, and navigation; multiline PML string literal ranges now preserve following expression tails.
- ✅ **Diagnostics Lifecycle** - Closed documents clear their published diagnostics, and `pml.maxNumberOfProblems` now limits diagnostics sent to the editor.
- ✅ **Diagnostic Noise Reduction** - Typo diagnostics now suppress ambiguous short-word keyword suggestions, including one- and two-character quoted parser tokens, while preserving clearer keyword typo hints.
- ✅ **Variable Typo-Diagnostic Safety** - Typo diagnostics ignore sigiled local and global variable names, which may validly resemble PML keywords.
- ✅ **Language Server Startup Safety** - Asynchronous client startup failures are logged and surfaced once instead of becoming unhandled rejections or duplicate notifications, and unsupported dynamic configuration registration does not abort initialization.
- ✅ **Extension Context Hygiene** - Bundled examples are loaded from the active extension context rather than a hardcoded Marketplace extension ID.
- ✅ **Provider Word Extraction** - Hover, Definition, References, and Rename now share a configurable word-range helper instead of maintaining four separate implementations.
- ✅ **Signature Help Accuracy** - Nested method/function calls use the innermost active call frame and ignore nested commas when selecting active parameters.
- ✅ **Provider Inactive-Text Accuracy** - Hover, Go to Definition, Find References, Rename, Completion, and Signature Help ignore comments and string literals through shared inactive-text ranges, while Hover still works for active code after strings that contain comment markers.
- ✅ **Signature Help Argument Parsing** - Signature Help ignores commas inside string arguments when selecting the active parameter.
- ✅ **Form Completion UX** - `.pmlfrm` `!this.` completions include form members, frames, and gadgets, with first-pass receiver-aware method filtering for typed members.
- ✅ **Completion Noise Reduction** - Constructed `ATTRIBUTE` receivers now get focused ATTRIBUTE metadata completions instead of the full built-in method list.
- ✅ **Completion Performance** - Receiver type inference reuses compiled patterns during each completion request instead of rebuilding them for every scanned line.
- ✅ **Workspace Indexing Stability** - Open-document conflicts, repeated unchanged document indexing, workspace-folder changes, and external file watcher bursts are covered with debounced, tested indexing paths.
- ✅ **Dynamic Callback Navigation** - References and Rename cover dynamic substitute callback paths such as `!this.$!<gadget>.method` without crossing malformed multiline segments.
- ✅ **Packaged CLI Smoke Coverage** - Extension-host smoke validation executes the bundled PML Assistant CLI and verifies its JSON parse contract.
- ✅ **Agent Kit Setup Smoke Coverage** - Extension-host smoke validation verifies actionable setup guidance across review, health, and live-status commands when no valid Agent Kit repository is configured.
- ✅ **Reference CodeLens** - Method and global-function declarations show clickable usage counts, with a setting to disable the annotations.
- ✅ **Call Hierarchy** - Indexed method and global-function declarations/call sites expose incoming and outgoing calls while preserving file-scoped methods and workspace-scoped functions.
- ✅ **Low-Noise Inlay Hints** - Reliable first-assignment types and unambiguous callable parameter names are available with independent settings and cached AST reuse.
- ✅ **Safe Type Propagation** - Typed parameters, direct reliable aliases, and explicit unambiguous user-call return types improve Inlay Hints and receiver-aware completions without leaking conditional or ambiguous assignments.
- ✅ **Typed Callable UX** - Hover, Signature Help, and callable completions expose explicit parameter/return types; direct and supported chained calls narrow member completions without crossing ambiguity or line boundaries.
- ✅ **Call Authoring UX** - Indexed callables insert typed argument snippets, and supported unresolved direct calls offer conservative method or sibling global-function stub generation.
- ✅ **Callable Refactoring UX** - Direct indexed calls can fill missing trailing arguments, synchronize generated empty stub signatures, and navigate to existing or newly generated definitions without crossing scope or ambiguity boundaries.
- ✅ **Callable Signature Cleanup** - Unused method/function parameters can be removed from any signature position together with same-position direct-call arguments; line-command references and nested same-callable edits remain conservatively refused.
- ✅ **Form Authoring Toolkit** - Static and reused gadget callbacks navigate in both directions; missing handlers, init/OK/cancel lifecycle wiring, and reliably typed members support safe individual or batch generation without guessing dynamic controls.
- ✅ **Visual Form Outline/Actions** - CodeLens shows form-action entrypoints, member types, callback navigation, and missing callback repair without adding completion noise.
- ✅ **Type-Assisted Form Member Editing** - Opt-in form-reference checks flag only consistently proven type mismatches; preferred Quick Fix and batch alignment skip dynamic, custom, `ANY`, and conflicting assignments.

**Next Stabilization Plan:**
- ✅ **Performance Budget Baseline** - Current local guard measurements are parser 24 ms, workspace parse/index 40 ms, completion 60 ms, and references 55 ms; all remain well below their release budgets, so no speculative optimization is planned until a real hotspot appears.
- ✅ **Workspace Indexing Status** - Progress now reports discovered PML file counts and final indexing duration; next use measured performance baselines to tune hotspots.
- **Completions:** receiver inference follows reliable aliases and explicit unambiguous user-call results, including direct/chained call receivers, while invalidating stale or ambiguous types and respecting line/inactive-text boundaries; next add curated AVEVA/E3D command presets.
- ✅ **Navigation Release Gate:** `.pmlobj` and `.pmlcmd` Outline coverage is guarded; user-defined methods remain file-scoped; global `!!function(...)` symbols remain workspace-scoped; CodeLens and incoming/outgoing Call Hierarchy use the shared index; References/Rename retain text fallback for callback strings and delimiter-adjacent bare callbacks.
- ✅ **Actionable Form Diagnostics** - Missing callback and unknown member warnings now state the immediate corrective action; keep default `.pmlfrm` noise low with explicit false-positive/false-negative coverage.
- **Preset packs:** Quick Actions now groups starter patterns for forms/callbacks, arrays, file IO, PML.NET, and observed EDG picker/packet workflows; next add another common EDG pattern without flooding completion lists.
- ✅ **Disposable VSIX Install Smoke** - CI and release validation install the newly packaged extension into an isolated VS Code profile and verify its extension ID and version.
- ✅ **Release Guide Hygiene** - Internal release commands and checklist now keep VSIX artifacts out of Git and point to the canonical release notes and SHA-256 checksum workflow.

**Recent Release Summary:**
- **Post-v0.13 callable API editing (in progress):** signature cleanup now covers unused leading, middle, and trailing parameters with matching direct-call updates; next consolidate the release UX and final gates.
- **Callable API Editing (in progress):** signature cleanup refuses used, dynamic, ambiguous, unparsable, arity-mismatched, and nested direct-call cases rather than making uncertain edits.
- **Cross-Form Navigation (in progress):** Outline presents typed members and direct callback links; Workspace Symbols find members, nested gadgets, and callbacks project-wide; Call Hierarchy starts from gadget/lifecycle callbacks and shows their method edge.
- `v0.13.0` (published): combines safe direct-call signature cleanup with project-level form presentation and callback navigation across Outline, Workspace Symbols, and Call Hierarchy.
- `v0.12.45`: completes the current Form Authoring slice with safe type-assisted member diagnostics and declaration alignment, on top of callback/lifecycle/member generation and visual actions.
- `v0.12.44` (folded into v0.12.45): Form Authoring Toolkit plus visual CodeLens outline/actions for form structure and callback repair.
- `v0.12.43`: combines the planned v0.12.42/v0.12.43 Call Authoring and Navigation/Refactoring work into one release.
- `v0.12.41`: adds typed callable snippets and safe AST-backed missing method/global-function stub generation.
- `v0.12.40`: adds typed callable Hover/Signature Help/completion details and direct/chained receiver completion for explicit unambiguous user-call returns.
- `v0.12.39`: propagates typed parameters, reliable aliases, and explicit user-call return types into Inlay Hints and receiver-aware completions while keeping ambiguous and conditional flow conservative.
- `v0.12.38`: adds low-noise variable type and callable parameter Inlay Hints with cached AST reuse and signature-sensitive refreshes.
- `v0.12.37`: adds curated Quick Actions presets, actionable form diagnostics, safer completion inference, reference CodeLens, and indexed incoming/outgoing Call Hierarchy.
- `v0.12.36`: scopes user-defined methods to the current file, adds separate `!!function(...)` indexing/navigation, debounces watcher indexing, avoids unchanged-document re-indexing, improves dynamic callback references, and clarifies the selected-array reindex command.
- `v0.12.35`: moves method References/Rename toward AST/index-backed lookup, adds first-pass type-aware member completions, improves `.pmlfrm` `!this.` completions for members/frames/gadgets, adds a missing callback-stub Quick Fix, and strengthens extension/VSIX smoke validation in CI and release workflows.
- `v0.12.34`: adds the unified Quick Actions launcher, stable PML Assistant static CLI contract, Agent Kit bridge commands, packaged CLI availability, lower-noise callback array diagnostics, compact user-method hovers, focused `Q ATT` hover help, selected DBREF/ATTRIBUTE method completions and hovers, and separate completion icon kinds for form-local methods.
- `v0.12.33`: restored `$P` print navigation activation, reduced `[0]` diagnostics false positives for likely C#/.NET/PMLNET zero-based collections, added focused method hover navigation with declaration usages and call-site definition links, expanded Common Commands starter coverage for `PARAGON`, `SPECONMODE`, and `FINISH`, added `!!CE` DBREF hover help, added selected `ELEMENTTYPE` metadata method completions/hovers, and closed review follow-ups for hover truncation plus redundant Outline re-indexing.
- `v0.12.32`: updated form Rename so pipe-delimited callback targets such as `|!!OtherForm.show()|` follow form renames without rewriting non-callback pipe strings.
- `v0.12.31`: hardened release automation, required explicit Marketplace publish approval, added release-workflow test gates, improved `.pmlobj`/`.pmlcmd` Outline coverage, hardened References/Rename inactive-text handling, and added performance budget guards.
- `v0.12.30`: added numeric path member suffix parsing, hardened completion/signature providers, and reduced installed AVEVA corpus parser errors from 3386 to 3306.
- `v0.12.29`: restored AVEVA-style multi-line `&` concatenation and reduced installed AVEVA corpus parser errors from 3429 to 3386.
- `v0.12.28`: added variable-less `do from/to` loops and logical-line infix boundaries, reducing installed AVEVA corpus parser errors from 3596 to 3429.
- `v0.12.27`: added optional AVEVA corpus snapshot testing, dynamic member-chain AST assertions, and GitHub Actions Node 24 readiness.
- `v0.12.26`: added dynamic substitute segments inside member chains, reducing installed AVEVA corpus parser errors from 3922 to 3596.
- `v0.12.25`: hardened dynamic global variable lexing for incomplete `!!$...` forms and preserved the installed AVEVA corpus baseline at 3922 parser errors.
- `v0.12.24`: added `function of ...` attribute parsing and dynamic global variable names, reducing installed AVEVA corpus parser errors from 4026 to 3922.
- `v0.12.23`: wired conditional `break if ...` and `skip if ...` expressions into diagnostics and preserved `continue` vs `skip` keyword identity.
- `v0.12.22`: stored conditional `break if ...` and `skip if ...` expressions in the AST and preserved the installed AVEVA corpus baseline.
- `v0.12.21`: added same-line `break if ...` and open-ended `do !i from ...` parsing, reducing installed AVEVA corpus parser errors from 5195 to 4026.
- `v0.12.20`: added PML1 `onerror`, `label`, `golabel`, and `use ... for ...` command starters, reducing installed AVEVA corpus parser errors from 5321 to 5195.
- `v0.12.19`: cleared `admextractcntrol.pmlfrm` and `lstclaim.pmlfrm` parser diagnostics by tightening `skip if` line handling and adding `SETCOMPDATE`.
- `v0.12.18`: hardened automated release checksum injection and added VSIX size/manuals guardrails.
- `v0.12.17`: fixed GitHub Actions packaging on Ubuntu and moved releases toward tag-triggered automated VSIX/checksum publication.
- `v0.12.16`: fixed local manuals packaging hygiene and tightened malformed `collect all ...` diagnostics without changing corpus baselines.
- `v0.12.15`: fixed procedural menu initializer recovery and added DrawList `collect all ... from drawlist` parsing, reducing `.pmlfrm` errors to 1410.
- `v0.12.14`: hardened menu-body recovery, `list`/`view` menu boundaries, multiline recovery, and error-message prefix handling without changing corpus baselines.
- `v0.12.13`: reduced post-review false positives for nameless form gadgets, form/method boundaries, `.pmlfnc` command-style lines, menu layout bodies, and duplicated parser messages.
- `v0.12.12`: applied post-review safeguards for form sub-block recovery, menu consumption, gadget names, PML1 `is` phrases, and object constructors.
- `v0.12.11`: reduced installed `.pmlfrm` parser errors from 3010 to 1409 with layout form and nested form-block support.
- `v0.12.10`: applied post-review parser safeguards for missing `define function`, DBREF AST typing, compose continuation recovery, and recovered block ranges.
- `v0.12.9`: reduced installed `.pmlobj` parser errors from 11007 to 2694 and improved shared recovery for `.pmlfnc`/`.pmlfrm`.
- `v0.12.8`: closed parser safeguards and eliminated `.pmlfnc` regressions vs `v0.12.6`.
- `v0.12.7`: reduced installed AVEVA `.pmlcmd` parser errors from 1200 to 0 across 698 files.
- `v0.12.6`: reduced `test2form.pmlfrm` parser baseline to two real fixture issues.
- `v0.12.5`: reduced `test2form.pmlfrm` parser gaps with attribute member access, `inset`, pipe-string fragments, and `do !x to ...`.
- `v0.12.4`: opt-in callback/gadget reference diagnostics for cleanly parsed `.pmlfrm` files.
- `v0.12.3`: nested form/frame/gadget outline symbols.
- `v0.12.2`: additional form gadgets, draft-line recovery, hidden fixture smoke baselines.
- `v0.12.1`: form fixture cleanup, tighter callback extraction, `.pmlfrm` smoke baselines.
- `v0.12.0`: first-class `.pmlfrm` parser foundation.
- `v0.11.x`: parser compatibility, `$P` print tools, PDMS command metadata, packaging cleanup.
- `v0.10.x` and earlier: workspace references, frame snippets, bundling, performance, parser/test foundations.

For full history, see [CHANGELOG.md](CHANGELOG.md).

**Known Limitations:**
- `.pmlfrm` support is improving but still has known gaps: broader PML.NET form patterns, intentionally broken fixture snippets, and some PML1 collection constructs.
- Find References/Rename still retain text scanning for callback-string and dynamic invocation fallback cases.
- Type inference is intentionally limited to obvious local declarations, constructors, and typed form members.
- Workspace indexer and client-side tooling commands still need broader automated tests.

---

## 💬 Feedback & Contributions

Have ideas or want to contribute?

- 🐛 [Bug Report](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- ✨ [Feature Request](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- 💬 [Discussions](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions)

---

*Last updated: 2026-05-31*
*Roadmap may change based on feedback and priorities*
