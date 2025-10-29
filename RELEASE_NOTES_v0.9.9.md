# Release Notes - v0.9.9

**Release Date:** 2025-01-29

## 🎯 What's New

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
- ✅ **Preserves indentation**: Matches method's indentation

### Comment Commands Enhancement
- ✅ **Line-based operation**: Works regardless of cursor position
- ✅ **Multi-line partial selection**: Comments all touched lines
- ✅ **Add Comments**: Adds `--` at start of each line (after indentation)
- ✅ **Remove Comments**: Removes `--` or `$*` from start of lines

## 🐛 Bug Fixes

1. **F12 not working on `!var.method()`**
   - Root cause: Word expansion captured too much (`!var.method` instead of `method`)
   - Fixed: Added `isStopChar()` to stop at `!`, `$`, operators, delimiters

2. **Parser error "Expected 'then' after if condition"**
   - Root cause: `skip if(...)` parsed as `if` statement expecting `then`
   - Fixed: Added `skip` keyword and `parseSkipStatement()` method

3. **Parser error "Expected expression" after skip if**
   - Root cause: Created non-existent `SkipStatement` AST node
   - Fixed: Uses `ContinueStatement` (skip is equivalent to continue in PML)

4. **Comments only work with full selection**
   - Root cause: Operated on selected text, not full lines
   - Fixed: Always processes entire lines touched by selection/cursor

## 📝 Files Changed

### Language Server
- `packages/pml-language-server/src/providers/definitionProvider.ts`
  - Added `isStopChar()` method
  - Added check for dot within word
  - Improved word boundary detection

- `packages/pml-language-server/src/providers/hoverProvider.ts`
  - Same fixes as definitionProvider

- `packages/pml-language-server/src/parser/tokens.ts`
  - Added `SKIP` token type
  - Added `'skip'` keyword mapping

- `packages/pml-language-server/src/parser/parser.ts`
  - Added `parseSkipStatement()` method
  - Handle `skip if(condition)` without `then`

### Extension
- `src/tools.ts`
  - Added `insertMethodDocBlock()` command
  - Fixed `addComments()` to work line-based
  - Fixed `removeComments()` to work line-based
  - Added `getIndentation()` helper

- `package.json`
  - Added `pml.insertMethodDocBlock` command
  - Updated menus and keybindings

## 📦 Package Info

- **Extension size**: 2.09 MB (bundled)
- **Files in VSIX**: 56 files
- **Commands**: 30 (added Insert Method Documentation Block)

## 🔧 How to Use New Features

### Insert Method Documentation Block
1. Place cursor on or above a method definition
2. Command Palette → `PML Forms: Insert Method Documentation Block`
3. Fill in Description, Arguments, Return fields
4. Use `Generate Methods Summary` to collect all docs

### Fixed Comment Commands
1. Place cursor anywhere in a line (or select multiple lines partially)
2. Command Palette → `PML: Add Comments` or `PML: Remove Comments`
3. All touched lines will be commented/uncommented

## ⚠️ Breaking Changes

None.

## 📚 Documentation

See [CHANGELOG.md](CHANGELOG.md) for full version history.

## 🙏 Credits

Thanks to all users who reported issues and provided feedback!

---

**Full Changelog**: [v0.9.8...v0.9.9](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/compare/v0.9.8...v0.9.9)
