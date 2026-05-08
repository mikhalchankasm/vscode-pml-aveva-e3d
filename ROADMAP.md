# Roadmap - PML for AVEVA E3D Extension

Development plans and progress tracking.

---

## ✅ Completed Features

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
  - Removed non-functional inlayHints settings

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

- [ ] **EDG Snippets** (Event Driven Graphics)
  - EDG packet snippet
  - Picks + handlers templates
  - Common EDG patterns

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

- [ ] **Code Lens**
  - Show usage count above methods
  - Show references count

- [ ] **Inlay Hints**
  - Show variable types inline
  - Show parameter names in calls

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

**Version:** 0.12.6
**Released:** 2026-05-09

**Statistics:**
- Extension size: **0.3 MB** (bundled with esbuild)
- Files in VSIX: 15 files
- LSP features: 13+ providers (with workspace-wide references)
- Commands: 35+ (with array manipulation and print-output tools)
- Diagnostics: 5 types (configurable severity levels)
- Form support: First-class foundation for frame nesting, outline symbols, callback assignments, opt-in form reference validation, PML attribute member access, dynamic substitute member access, import workflows, and common form gadgets
- Tests: **124 tests passing, 2 skipped** (parser + provider + typo detector + arrayIndexChecker + print utilities + PDMS data + form fixtures + form references)
- VSIX Storage: **GitHub Releases only**; repository stays clean

**Current Focus (v0.12.x):**
- ✅ **Form Parser Foundation** - Chained calls, callback assignments, nested frames, outline symbols, common form gadgets, guarded reference diagnostics, PML attribute member access, dynamic substitute member access, import wrappers, and form fixture smoke tests are in place.
- ✅ **Stable Packaging** - VSIX ships 15 runtime/user-facing files and stays in GitHub Releases only.
- ✅ **Print Debug Workflow** - `$P` highlighting, navigation, comment/uncomment, and delete commands are available.
- ✅ **Parser Hardening** - Real PML/PMLFNC compatibility cases are covered with regression tests.

**Recent Release Summary:**
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
- Find References/Rename still rely on text scanning in important paths; AST/index-based lookup is planned after form parser stabilization.
- Type inference is intentionally limited and should be reintroduced only with a clear architecture.
- Workspace indexer and client-side tooling commands still need broader automated tests.

---

## 💬 Feedback & Contributions

Have ideas or want to contribute?

- 🐛 [Bug Report](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- ✨ [Feature Request](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- 💬 [Discussions](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions)

---

*Last updated: 2026-05-08*
*Roadmap may change based on feedback and priorities*
