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

### ⭐ Latest: v0.9.6 - UX Improvements (2025-01-29)

**User Experience Release:**
- ✅ **Comment Commands Enhanced**
  - Add/Remove Comments work without selection (on current line)
  - Cursor can be anywhere in the line

- ✅ **Code Actions (Ctrl+.) Simplified**
  - Only Add/Remove Comments
  - Removed array, sort, cleanup commands

- ✅ **Context Menu "Quick Action PML"**
  - Renamed from "Quick Actions"
  - Contains ALL toolbar commands
  - Single comprehensive menu

- ❌ **Column Generator Removed**
  - Deleted (replaced by external extensions)

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

### v0.9.0 - Q2 2025

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

- [ ] **Rename Symbol**
  - Rename methods with updates to all calls
  - Rename variables safely
  - Rename in callback strings
  - Preview before applying

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

**Version:** 0.9.7
**Released:** 2025-01-29

**Statistics:**
- Extension size: **2.09 MB** (bundled with esbuild, 7.5x smaller than v0.7.3)
- Files in VSIX: 56 files (previously 1632 before v0.8.0)
- LSP features: 13+ providers (with documentation extraction)
- Commands: 29+ (added form documentation commands)
- Diagnostics: 3 types (parse-error-based typo detection, array index checker, parser errors)
- Operators: 15+ (including OF, comparison operator aliases)
- Form support: Advanced parsing with documentation generation
- Documentation: Comment-based method docs with JSDoc and AVEVA `$p` marker support
- Tests: **38 tests passing, 2 skipped** (20 parser + 18 typo detector)
- VSIX Storage: **Repository contains only latest version**; historical versions in GitHub Releases

**Recent Changes (v0.9.7-v0.9.8):**
- ✅ **Form Documentation** (v0.9.7) - Auto-generate methods summary tables from `$p` markers
- ✅ **Go to Definition Fix** (v0.9.7) - F12 now works correctly on `.methodName()`
- ✅ **Hover Documentation** (v0.9.7) - Shows method docs from `$p` and `--` comments
- ✅ **Form Header Snippet** (v0.9.7) - `formheader` snippet for .pmlfrm files
- ✅ **Dead Code Removal** (v0.9.8) - Removed obsolete src/diagnostics.ts
- ✅ **Release Docs Update** (v0.9.8) - UTF-8 encoding, 0.9.x examples, VSIX storage policy
- ✅ **IntelliSense for Forms** (v0.9.7) - Only show form methods in .pmlfrm files

**Previous Changes (v0.8.8-v0.9.6):**
- ✅ **UX Improvements** (v0.9.6) - Comment commands without selection, simplified Code Actions
- ✅ **Menu Reorganization** (v0.9.5) - Quick Action PML renamed, array submenu restored
- ✅ **Menu Configuration Fix** (v0.9.4) - Corrected context menu and toolbar structure
- ✅ **Remove Comments Fix** (v0.9.3) - Now removes only prefix, not entire lines
- ❌ **Column Generator Removed** (v0.9.6) - Replaced by external extensions
- ✅ **UI/UX Improvements** (v0.9.1) - New commands (Add Comments, Align PML), fixed broken commands
- ✅ **Form Syntax Support** (v0.9.0) - Parser recognizes setup form, gadgets, members
- ✅ **Form Tokens** (v0.9.0) - Added 15+ form-related keywords
- ✅ **AST Extensions** (v0.9.0) - GadgetDeclaration, MemberDeclaration nodes
- ✅ **Array Index Checker Tests** (v0.8.8) - 30 tests, fixed critical bug

**Previous Milestones (v0.8.0-v0.8.8):**
- ✅ **Code Bundling** (v0.8.0) - esbuild integration, 7.5x size reduction
- ✅ **Performance Optimizations** (v0.8.1) - Memory leak fixes, async workspace indexing
- ✅ **Parser Improvements** (v0.8.2-v0.8.4) - Compose keyword, nested elseif, method token handling
- ✅ **Typo Detection Restored** (v0.8.6-v0.8.7) - Parse-error-based, 75+ keywords, test suite
- ✅ **Parser Tests** (v0.8.8) - Fixed all 20 parser tests by removing stale compiled files

**Previous Achievements (v0.7.0-v0.7.3):**
- ✅ Find All References (Shift+F12)
- ✅ Method documentation from comments (hover tooltips)
- ✅ F12 (Go to Definition) for method calls
- ✅ Comparison operators (neq, geq, leq)
- ✅ AST-based typo detection (later replaced with parse-error-based)

**Known Limitations:**
- Form syntax: graceful degradation (parsed as PML)
- Find References: works only in current file (workspace search pending)
- Type inference: removed (needs re-implementation with correct architecture)
- Test coverage: Parser and typo detector covered (38 passing); array index checker, workspace indexer, and tooling commands need Vitest suites

---

## 💬 Feedback & Contributions

Have ideas or want to contribute?

- 🐛 [Bug Report](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- ✨ [Feature Request](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- 💬 [Discussions](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions)

---

*Last updated: 2025-01-28*
*Roadmap may change based on feedback and priorities*
