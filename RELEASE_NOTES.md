# Release Notes - v0.9.9

**Release Date:** 2025-01-29

## 🎯 What's New in v0.9.9

### F12 (Go to Definition) - Complete Fix
- ✅ **Fixed for all patterns**: `!var.method()`, `!this.method()`, `.method()`
- ✅ **Word boundary detection improved**: Stops at special characters (`!`, `$`, operators)
- ✅ **Dot handling**: Correctly extracts method name after last dot in `var.method`

### Skip Statement Support
- ✅ **Parser handles `skip` and `skip if`**: No more false "Expected 'then'" errors
- ✅ **Added SKIP token**: Proper keyword recognition
- ✅ **Conditional skip**: `skip if(condition)` works without `then` keyword

### Method Documentation Block
- ✅ **New command**: "Insert Method Documentation Block"
- ✅ **AVEVA-standard format**: Includes Method, Description, Arguments, Return
- ✅ **Auto-positioning**: Cursor moves to Description field
- ✅ **Smart detection**: Finds method at or below cursor

### Comment Commands Enhancement
- ✅ **Line-based operation**: Works regardless of cursor position
- ✅ **Multi-line partial selection**: Comments all touched lines
- ✅ **Preserves indentation**: Adds `--` after existing indentation

### Examples & Tutorials
- ✅ **Button Gadgets Tutorial**: New command in "PML - Examples, FAQ" menu
- ✅ **Comprehensive documentation**: Includes quick reference, examples, members, methods, best practices, and FAQ
- ✅ **External file loading**: Tutorial loaded from `examples/gadgets/ButtonGadgets_Tutorial.md`

### Array Commands Enhancement
- ✅ **ReIndex command**: Automatically renumbers array indices starting from max + 1
- ✅ **Add to Array command**: Converts plain text lines to array elements with proper formatting
- ✅ **Improved regex**: Handles malformed indices with spaces (e.g., `!list[6 ]`)
- ✅ **Smart format detection**: Auto-detects path (`/`), string (`'`), or plain formats

### Context Menu Restructure
- ✅ **Separated menus**: 4 distinct top-level items with icons
  - ⚡ PML - Quick Action (sorting, duplicates, whitespace)
  - 📊 PML - Array (array manipulation with 5 commands)
  - 📄 PML - Forms (form-related commands)
  - 📖 PML - Examples, FAQ (tutorials and documentation)
- ✅ **Command icons**: Visual icons for all array commands
- ✅ **Top positioning**: Menus appear at top of context menu for easy access

## 🐛 Bug Fixes

1. **F12 not working on `!var.method()`** - Fixed word expansion to stop at special characters
2. **Parser error on `skip if(...)`** - Added skip statement parsing
3. **Comments only work with full selection** - Changed to line-based operation
4. **Add to Array not handling malformed indices** - Fixed regex to handle spaces in brackets
5. **ESLint warning (unused fullText)** - Removed unused variable from updateMethodsSummary
6. **Quick Action menu showing without selection** - Restored editorHasSelection guard

## 📦 Installation

**GitHub Release:** [v0.9.9](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.9.9)

**MD5 Checksum:** `87b4058249b48bcb138935692c77f15e`

See [CHANGELOG.md](CHANGELOG.md) for full version history.
