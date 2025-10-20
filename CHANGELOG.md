# Change Log

All notable changes to the "PML for AVEVA E3D" extension will be documented in this file.

## [0.5.1] - 2025-10-19

### 🎯 Parser Improvements & Documentation

#### Added
- **PML1 Keywords Support** - Added declarative syntax keywords
  - `collect`, `all`, `with`, `using`, `at` - Collection operations
  - `compose`, `space` - String composition
  - Keywords recognized for syntax highlighting (graceful parsing - no false errors!)

- **Graceful Parsing Strategy** - New parser philosophy
  - Unknown keywords → highlighted as identifiers, NO ERRORS
  - Like Notepad++: syntax highlighting without strict validation
  - Optional semantic validation through settings
  - See: `docs/PARSER_STRATEGY.md`

- **PML Language Variants Documentation**
  - Comprehensive guide to PML1 (declarative) vs PML2 (procedural) syntax
  - Examples of both syntaxes with conversion patterns
  - Realistic coverage goals (75-85%)
  - See: `objects/PML_LANGUAGE_VARIANTS.md`

- **Knowledge Base Structure** - `objects/` folder
  - `array object.md` - 48 ARRAY methods documented
  - `string object.md` - 69 STRING methods with examples
  - 10+ additional PML reference documents
  - `KNOWLEDGE_BASE_GUIDE.md` - Contributor guide

- **Project Management Documents**
  - `PROJECT_STATUS.md` - Main progress tracker with todos and metrics
  - `DOCUMENTATION_AUDIT.md` - Complete documentation inventory

#### Fixed
- `var` keyword parsing
- `by` keyword in do-from-to loops (`do !i from 1 to 10 by -1`)
- `neq` operator (alias for `ne`)
- Workspace indexing URI decoding on Windows
- Parameter type parsing (`!width is REAL`)
- completionItem/resolve error

#### Changed
- Reorganized documentation - removed 5 obsolete TODO files
- Moved STRING Object.md to `objects/` folder
- Parser now uses graceful degradation for unknown constructs

#### Documentation
- Created comprehensive parser strategy guide
- Added PML1/PML2 syntax comparison
- Knowledge base filling guide for contributors
- Complete project status tracker

## [0.5.0] - 2025-10-19

### 🎉 Major Release - Full LSP Implementation

Complete rewrite from regex-based to **Language Server Protocol (LSP)** architecture with IntelliSense-level support.

### ✨ Added

#### Parser & AST
- **Full AST Parser** - Lexer (850 lines) + Parser (1,200 lines)
- **60+ Token Types** - Complete PML syntax tokenization
- **40+ AST Node Types** - Full PML language support
- **Error Recovery** - Parser continues after errors
- **20+ Test Cases** - Comprehensive parser testing

#### Navigation Features
- **Go to Definition (F12)** - Jump to method/object definitions
- **Find All References (Shift+F12)** - Find all usages
- **Workspace Symbol Search (Ctrl+T)** - Search symbols across workspace
- **Document Outline (Ctrl+Shift+O)** - File structure view
- **Cross-file Navigation** - Works across multiple .pml files

#### IntelliSense Features
- **Enhanced Hover** - Rich documentation with examples
  - 30+ built-in methods documented (STRING, REAL, ARRAY, DBREF)
  - User-defined methods show signature and location
  - Global functions with usage examples
- **Context-aware Completion (Ctrl+Space)**
  - Workspace methods and objects
  - Built-in methods with type info
  - Keywords and operators
  - Code snippets (method, if, do, object, handle)
- **Signature Help (Ctrl+Shift+Space)** - Parameter hints while typing

#### Diagnostics
- **Array Index Checker** - Detects `arr[0]` errors (PML is 1-indexed!)
- **Typo Detection** - Catches keyword typos
- **Parse Error Reporting** - Real-time syntax error detection
- **Type-aware Diagnostics** - Parameter type validation

#### Workspace Features
- **Workspace Indexing** - Fast O(1) symbol lookup
- **Multi-file Support** - Works with .pml, .pmlobj, .pmlfnc, .pmlfrm, .pmlmac, .pmlcmd
- **Incremental Updates** - Only re-index changed files
- **Background Indexing** - Non-blocking workspace scanning

### 🔧 Fixed
- Workspace indexing URI decoding on Windows
- Parameter type parsing (`!param is REAL`)
- Method calls with typed parameters
- Cross-file navigation reliability

### 📚 Documentation
- **CHECKPOINT_1.md** - Complete Phase 1 documentation
- **INTELLISENSE_UPGRADE_PLAN.md** - Full roadmap
- **LSP_PROGRESS.md** - Implementation details
- **SETUP_LSP.md** - Architecture guide

### 🚨 Breaking Changes
- Disabled old regex-based providers (replaced by LSP)
- Extension now requires Language Server to be running
- Minimum VSCode version: 1.80.0

### 📊 Statistics
- **16 new files** (~4,500 lines of code)
- **Parser**: ~50-100ms for 1000-line files
- **Workspace indexing**: ~500ms for 50 files
- **Symbol lookup**: O(1) performance

---

## [0.4.8] - 2024-XX-XX

### Previous Features
- Basic syntax highlighting
- Simple code completion
- Regex-based diagnostics
- Code formatting

---

## Future Releases

### Phase 2 (Planned)
- Semantic Tokens (type-based syntax highlighting)
- Inlay Hints (show inferred types inline)
- Call Hierarchy (Ctrl+Shift+H)
- Code Lens (show reference counts)
- Rename Symbol (F2)

### Phase 3 (Planned)
- Code Actions and Quick Fixes
- Refactoring support
- Advanced type inference
- Performance optimizations

---

## Links
- [GitHub Repository](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d)
- [Issues](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- [CHECKPOINT_1.md](./CHECKPOINT_1.md) - Detailed Phase 1 documentation
