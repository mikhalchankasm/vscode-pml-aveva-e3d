# Roadmap - PML for AVEVA E3D Extension

Development plans and progress tracking.

---

## ✅ Completed (v0.4.8 - v0.5.6)

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

- ✅ **Typo Detection** (v0.5.4)
  - Detects typos in keywords (e.g., "endiff" → "endif")
  - Levenshtein distance algorithm
  - Skip variables (!), methods (.), directives ($)
  - Reduced false positives

### Parser Improvements
- ✅ **Object Definition Support** (v0.5.6)
  - Parse `define object ... endobject`
  - Handle `member .property is TYPE`
  - Handle `define method` inside objects

- ✅ **MemberExpression Fixes** (v0.5.5)
  - Correct AST typing (Expression, not Identifier)
  - Fixed range calculations
  - Support computed access: `arr[i+1]`

- ✅ **Backslash Handling** (v0.5.6)
  - PML doesn't use backslash escapes
  - Windows paths work correctly: `|Z:\path\file|`

### Code Actions & Commands
- ✅ **Code Actions Provider**
  - Quick actions in context menu
  - Array operations
  - Sort operations
  - Remove duplicates/empty lines

- ✅ **PML Tools**
  - Sort Lines (A→Z, Z→A, by length, smart natural sort)
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

---

## 🎯 v0.6.0 (Next Release) - Current Focus

### High Priority

- [ ] **Sort Methods A→Z/Z→A** ⭐ HIGH PRIORITY
  - Command "PML: Sort Methods (A→Z)"
  - Parse `define method ... endmethod` blocks
  - Preserve comments before methods
  - Preserve blank lines between methods

- [ ] **Find All References** ⭐
  - Currently only returns definitions
  - Implement proper reference search
  - Find method calls across workspace
  - Find variable usage

- [ ] **Code Bundling** ⭐
  - VSIX is 15.6 MB with 1627 files
  - Use webpack/esbuild to bundle
  - Reduce extension size
  - Improve activation time

### Medium Priority

- [ ] **Form Syntax Improvements**
  - Better parsing for `setup form`
  - Parse `frame`, `button`, `text` gadgets
  - Gadget autocomplete in form context
  - Callback validation

- [ ] **Enhanced Reload Form Command**
  - Detect form files automatically
  - Better error messages
  - Integration with AVEVA (if possible)

- [ ] **Settings for Paths**
  - `pml.pmllibPaths` - library paths for imports
  - `pml.uicPath` - UIC path
  - `pml.e3dVersion` - E3D version

### Testing & Quality

- [ ] **Parser Tests**
  - Unit tests for lexer
  - Unit tests for parser
  - Test edge cases (nested objects, complex expressions)

- [ ] **Diagnostic Tests**
  - Test array index checker
  - Test typo detector
  - Test MemberExpression ranges

---

## 🚀 v0.7.0 - Q2 2025

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

## 🔥 v0.8.0 - Q3 2025

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

## 🌟 v1.0.0 - Q4 2025

### Advanced Features

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

### Documentation & Community

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

### Quality

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

**Version:** 0.5.6
**Released:** 2025-01-21

**Statistics:**
- Extension size: 15.6 MB (needs bundling)
- Files in VSIX: 1627 files (864 JS files)
- LSP features: 12+ providers
- Commands: 25+
- Diagnostics: 3 types

**Known Limitations:**
- Form syntax: graceful degradation (parsed as PML)
- Find References: only returns definitions (needs implementation)
- Type inference: removed (needs re-implementation with correct architecture)
- No tests yet

---

## 💬 Feedback & Contributions

Have ideas or want to contribute?

- 🐛 [Bug Report](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- ✨ [Feature Request](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- 💬 [Discussions](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions)

---

*Last updated: 2025-01-21*
*Roadmap may change based on feedback and priorities*
