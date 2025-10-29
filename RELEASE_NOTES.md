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

## 🐛 Bug Fixes

1. **F12 not working on `!var.method()`** - Fixed word expansion to stop at special characters
2. **Parser error on `skip if(...)`** - Added skip statement parsing
3. **Comments only work with full selection** - Changed to line-based operation

## 📦 Installation

**GitHub Release:** [v0.9.9](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.9.9)

**MD5 Checksum:** `87b4058249b48bcb138935692c77f15e`

See [CHANGELOG.md](CHANGELOG.md) for full version history.
