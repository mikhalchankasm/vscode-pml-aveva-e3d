# Roadmap - PML for AVEVA E3D Extension

Development plans for upcoming releases.

---

## ✅ v0.4.8 (Current Version)

- ⚡ Code Actions Provider (lightbulb 💡)
- 🎯 Quick Actions in context menu
- Commands grouped (Array, Sort, Remove, Trim)

---

## 🎯 v0.5.0 (Next Release) - Q1 2025

### Navigation and Refactoring

- [ ] **Sort Methods A→Z/Z→A** ⭐ HIGH PRIORITY
  - Command "PML: Sort Methods (A→Z)"
  - Parse `define method ... endmethod` blocks
  - Preserve comments before methods

- [ ] **Improved Go to Definition**
  - Cross-file navigation
  - Support methods in other .pml files

- [ ] **Find All References for methods**
  - Find all method usages
  - Show in References panel

### Snippets and Commands

- [ ] **EDG Snippets** (Event Driven Graphics)
  - EDG packet snippet
  - Picks + handlers templates

- [ ] **PML.NET Snippets**
  - Template for PML↔.NET bridge
  - C# class stub reference

### UX Improvements

- [ ] **Settings for paths**
  - `pml.pmllibPaths` - library paths
  - `pml.uicPath` - UIC path
  - `pml.e3dVersion` - E3D version

- [ ] **Enhanced Reload Form command**
  - Automatic execution in AVEVA (if path configured)

---

## 🚀 v0.6.0 - Q2 2025

### Type Inference and Diagnostics

- [ ] **Warning on !arr[0]** ⭐
  - "PML arrays are 1-indexed, not 0-indexed"
  - Quick fix: "Change to !arr[1]"

- [ ] **Basic Type Inference**
  - Determine variable types from assignments
  - `!var = STRING()` → type: STRING
  - `!arr[1] = 'value'` → type: ARRAY<STRING>

- [ ] **Type-aware autocompletion**
  - `!str.` → show only STRING methods
  - `!arr[1].` → array element methods

### Forms/Callbacks Validation

- [ ] **Gadget refs checking**
  - Error on unknown gadget in `!!Form.gadget`
  - Autocomplete gadget names

- [ ] **Callback methods checking**
  - Warning if callback references non-existent method
  - Quick Fix: "Generate callback stub method"

---

## 🔥 v0.7.0 - Q3 2025

### Refactoring

- [ ] **Rename Symbol (safe)**
  - Rename methods with updates to all calls
  - Rename in callback strings
  - Preview before applying

- [ ] **Extract Method**
  - Selection → new method
  - Automatic parameter passing

### Integration

- [ ] **AVEVA E3D Integration** (if possible)
  - Task Provider for running PML
  - PML Console integration
  - Direct script execution

---

## 🌟 v1.0.0 - Q4 2025

### Language Server Protocol (LSP)

- [ ] **Tree-sitter Parser for PML**
  - Separate project `tree-sitter-pml`
  - Parse to AST
  - Queries for symbols/highlights

- [ ] **Full LSP Implementation**
  - Semantic analysis
  - Advanced refactoring
  - Performance for large files

### Quality and Testing

- [ ] **Unit tests**
  - Formatter tests
  - Diagnostics tests
  - Completion tests

- [ ] **Integration tests**
  - End-to-end tests

- [ ] **Complete documentation**
  - All commands documented
  - Examples for each feature
  - Video tutorials

---

## 📚 Ongoing Tasks

### Documentation

- [ ] GIF demos for each feature
- [ ] Video tutorial (60-90 sec)
- [ ] docs/commands.md, settings.md, snippets.md
- [ ] PML Cheatsheet
- [ ] Documentation translation

### Community

- [ ] GitHub Discussions
- [ ] good first issue labels
- [ ] Contributing guidelines
- [ ] Community showcase

### Quality

- [ ] CI/CD improvements
- [ ] Test coverage
- [ ] Performance optimizations
- [ ] Accessibility

---

## 🤔 Ideas for Discussion (possibly v2.0+)

### Major Features

- [ ] **Debugger Adapter**
  - PML debugging (if API available)
  - Breakpoints, Watch variables, Call stack

- [ ] **AVEVA E3D Database Browser**
  - Browse DB elements
  - Sync with E3D session

- [ ] **Visual Form Designer**
  - WYSIWYG form editor
  - Drag & Drop gadgets

### Advanced Features

- [ ] Semantic Highlighting
- [ ] Code Lens (show usage count)
- [ ] Inlay Hints (show variable types)
- [ ] Workspace Symbols (search across all project files)

---

## 📊 Success Metrics

### v1.0.0
- 1000+ active installs
- 50+ GitHub stars
- Rating 4.5+/5
- < 5 open critical issues
- Complete documentation
- Active community

---

## 💬 Feedback

Have ideas or suggestions? Create:
- 🐛 [Bug Report](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues/new?template=bug_report.yml)
- ✨ [Feature Request](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues/new?template=feature_request.yml)
- 💬 [Discussion](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions) (coming soon)

---

*Last updated: 2025-01-17*
*Roadmap may change based on feedback and priorities*
