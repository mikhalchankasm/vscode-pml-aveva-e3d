# Release Notes - v0.10.1

**Release Date:** 2025-02-01

## 🔧 What's New in v0.10.1

### Repository Hygiene & Git Best Practices

**Fixed - Critical (P0)**:
- ✅ **`.gitignore` updated** - Now properly excludes:
  - VSIX packages (`*.vsix`) - store only in GitHub Releases
  - IDE local settings (`.claude/settings.local.json`, `*.local.*`)
  - Source maps (`*.map`)
  - Build artifacts (`dist/`, `build/`, `*.tsbuildinfo`)
  - Logs and cache (`*.log`, `.cache/`, `tmp/`)
  - Environment files (`.env`, `.env.local`)

**Removed from Repository**:
- ✅ `pml-aveva-e3d-0.10.0.vsix` (2.08 MB) - moved to GitHub Releases only
- ✅ `.claude/settings.local.json` - IDE-specific local settings

**Documentation**:
- ✅ Updated `.claude/claude.md` - Clarified VSIX storage policy (Releases only)

### Impact
- Cleaner repository without binary files
- No IDE settings conflicts between developers
- Follows Git best practices for artifact storage

## 📦 Installation

**GitHub Release:** [v0.10.1](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.10.1)

**MD5 Checksum:** `8915ba375fd3e636b068aff46b063f6e`

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.10.0

**Release Date:** 2025-01-31

## 🎯 What's New in v0.10.0

### Frame Gadgets Support - Complete Implementation

**New Snippets** (9 total):
- ✅ **`frame`** - Normal frame container with border
- ✅ **`frameat`** - Frame at specific position
- ✅ **`frametabset`** - TabSet with multiple tabbed pages (nested frames)
- ✅ **`frametoolbar`** - Toolbar frame (main forms only)
- ✅ **`framepanel`** - Panel frame without visible border
- ✅ **`framepanelindent`** - Panel frame with 3D indent effect
- ✅ **`framefoldup`** - Fold-up panel (expandable/collapsible)
- ✅ **`framefoldupbg`** - Fold-up panel with background color
- ✅ **`frameradio`** - Radio button group with RTOGGLE gadgets

**Frame Gadgets Tutorial**:
- ✅ **Comprehensive documentation** (12KB): Quick reference, complete example form, members/methods tables
- ✅ **Type-specific details**: All 5 frame types explained (Normal, TabSet, Toolbar, Panel, Fold-up)
- ✅ **Nested frames example**: Shows proper hierarchy and tabset implementation
- ✅ **Best practices** (8 recommendations): Naming, nesting, callbacks, positioning
- ✅ **FAQ section** (9 questions): Common issues and solutions
- ✅ **Menu integration**: Accessible via "PML - Examples, FAQ → Frame Gadgets"

### V1.0 Planning Document
- ✅ **Created roadmap**: V1.0_PLAN.md with 6 phases (Testing, Form Features, Documentation, Community, Performance, Enhanced Features)
- ✅ **Timeline**: 12-20 weeks to production release
- ✅ **Criteria defined**: Testing, stability, documentation, examples requirements for 1.0.0
- ✅ **Current progress**: ~75% complete

### LSP Configuration Settings
- ✅ **Type Inference**: `pml.typeInference.enabled` - Toggle type inference on/off
- ✅ **Inlay Hints**: `pml.inlayHints.enabled`, `pml.inlayHints.parameterNames` - Show parameter hints
- ✅ **Diagnostics**: `pml.diagnostics.typeChecking`, `pml.diagnostics.unusedVariables`, `pml.diagnostics.arrayIndexZero`
- ✅ **Indexing**: `pml.indexing.exclude` - Configure which files to exclude from workspace indexing

## ⚡ Performance Improvements

### VSIX Package Size Reduction
**Before**: 2.38 MB (77 files)
**After**: 2.08 MB (44 files)
**Reduction**: 300 KB (12.6% smaller, 33 fewer files)

**What was excluded**:
- ✅ `hide_examples/**` - Training materials (~458 KB)
- ✅ `objects/**` - Development knowledge base (~133 KB)
- ✅ Only essential tutorials kept in `examples/gadgets/`

## 🐛 Bug Fixes

### Tutorial Files Not Packaged in VSIX
**Problem**: Opening Frame/Button examples failed with ENOENT error
**Root Cause**: `.vscodeignore` excluded all `examples/**`
**Fix**:
- ✅ Added exception pattern `!examples/gadgets/**`
- ✅ Copied ButtonGadgets_Tutorial.md to correct location
- ✅ Verified both tutorials now included in VSIX (20.65 KB total)

### Array Commands - Value Detection Failed
**Problem**: ReIndex and Add to Array not working on path/string arrays
**Test Cases**:
```pml
!paths[1] = /path/to/file1  -- ReIndex failed
!items[1] = 'first item'    -- Add to Array failed
```
**Root Cause**: Value (`match[5]`) not trimmed before format checking
**Fix**:
- ✅ Added `.trim()` before `startsWith()` checks in tools.ts:824
- ✅ Tested with path arrays: `!paths[n] = /path/to/file`
- ✅ Tested with string arrays: `!items[n] = 'string value'`

## 📦 Installation

**GitHub Release:** [v0.10.0](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.10.0)

**MD5 Checksum:** `e8cb40860d1ab6dfdf8c8afb796bbe25`

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.9.9

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
