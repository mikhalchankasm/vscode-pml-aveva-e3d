# Release Notes - v0.10.6

**Release Date:** 2026-01-04

## 🔧 What's New in v0.10.6

### Critical Parser Fixes

**Full Method/Function Body Parsing**:
- ✅ **Previously**: Parser skipped method/function bodies entirely, returning `body: []`
- ✅ **Now**: Parses all statements (if, do, return, assignments, etc.) inside methods
- ✅ **Impact**: ArrayIndexChecker and semantic analysis now work inside methods
- ✅ **Tests**: Fixed 7 failing tests in parser.test.ts and arrayIndexChecker.test.ts

### LSP Improvements

**Workspace-Wide References from Disk**:
- ✅ **Previously**: Files not in LRU cache (100 files) were silently skipped
- ✅ **Now**: Falls back to reading files from disk when not cached
- ✅ **Impact**: Find All References (Shift+F12) finds usages in ALL workspace files

**File Watcher for Index Updates**:
- ✅ **Previously**: Index only updated at startup and for open files
- ✅ **Now**: `onDidChangeWatchedFiles` handler reindexes external changes
- ✅ **Impact**: Go to Definition and References stay current with external edits

## 📦 Installation

**GitHub Release:** [v0.10.6](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.10.6)

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.10.5

**Release Date:** 2025-11-29

See [CHANGELOG.md](CHANGELOG.md) for v0.10.5 details.

---

# Previous Release - v0.10.3

**Release Date:** 2025-02-02

## 🚀 What's New in v0.10.3

### Major Feature - Workspace-Wide References

**Find All References (Shift+F12)** now searches across entire workspace:
- ✅ **Previously**: Limited to current file only
- ✅ **Now**: Searches all indexed files in workspace
- ✅ **Performance**: Uses LRU cache (no additional disk I/O)
- ✅ **Coverage**: Methods, objects, forms, object instantiations
- ✅ **LSP Standard**: Matches expected Language Server Protocol behavior

**Example Usage**:
```pml
define method .calculateTotal(!items is ARRAY)
  -- Implementation
endmethod

!result = !this.calculateTotal(!myItems)  -- Press Shift+F12 here
```
Now finds ALL usages across your entire project, not just this file!

### Critical Fixes - Workspace Indexing

**UNC Path Support** (Critical):
- ✅ **Problem**: Network paths like `\\server\share\project` failed to index
- ✅ **Solution**: Proper URI parsing with `URI.parse().fsPath`
- ✅ **Impact**: Works correctly in corporate Windows networks

**Security Improvements**:
- ✅ **Path Validation**: Improved boundary checking (prevents `C:\proj1` vs `C:\proj10` false positives)
- ✅ **Symlink Safety**: Added `path.relative()` validation to catch junction/symlink escapes
- ✅ **Memory Limits**: LRU cache with 100 files max prevents memory growth on large workspaces

**User Configuration**:
- ✅ **Exclusions**: `pml.indexing.exclude` now actually works with glob patterns
- ✅ **Example**: `["**/node_modules/**", "**/out/**", "**/my_old_code/**"]`
- ✅ **Fast**: Uses `minimatch` for efficient pattern matching

### Code Quality Improvements

**Type Safety**:
- ✅ **Diagnostics Config**: Fixed boolean → string enum mismatch
- ✅ **User Control**: Can now set `"off"`, `"warning"`, or `"error"` for each diagnostic
- ✅ **UI Enhancement**: Added helpful descriptions in VSCode settings

**Menu Fixes**:
- ✅ **VSCode `when` clauses**: Fixed unquoted file extensions (30+ menu items)
- ✅ **Before**: `resourceExtname == .pml` (incorrect)
- ✅ **After**: `resourceExtname == '.pml'` (correct)

**Async I/O**:
- ✅ **Tutorial Loading**: Converted blocking `fs.readFileSync` → async `fs.readFile`
- ✅ **Impact**: No more UI freezes when opening Button/Frame Gadgets tutorials on slow disks

**Path Handling**:
- ✅ **Hover Provider**: Improved cross-platform path parsing (regex instead of string manipulation)
- ✅ **Supports**: Both `file:///` and `file://` schemes, forward/backward slashes

### Progress Indicators

**Workspace Indexing**:
- ✅ Shows "PML: Indexing workspace..." notification during startup
- ✅ Displays completion: "Indexed 156 files"
- ✅ Better UX for large workspaces (500+ files)

## 📦 Installation

**GitHub Release:** [v0.10.3](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.10.3)

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.10.2

**Release Date:** 2025-02-02

## 🔧 What's New in v0.10.2

### Critical Bug Fixes - Array Commands

**ReIndex & AddToArray** - Fixed critical Windows CRLF bug:
- ✅ **Root Cause**: Windows line endings (`\r\n`) were breaking regex matching
- ✅ **Impact**: Commands only processed last line, ignored all others
- ✅ **Fix**: Added CRLF normalization before processing
- ✅ **Result**: Now works correctly on Windows, Linux, and macOS

**Example**: ReIndex now properly converts:
```pml
!lines[3] = 'value 1'
!lines[3] = 'value 2'
!lines[3] = 'value 3'
```
Into:
```pml
!lines[1] = 'value 1'
!lines[2] = 'value 2'
!lines[3] = 'value 3'
```

**Empty Line Handling**:
- ✅ Auto-trim empty lines at start/end of selection
- ✅ Preserves intentional spacing within arrays
- ✅ More forgiving user experience

### UI Enhancements

**Context Menu Icons** - 20+ new icons added:
- ⚡ **Quick Actions**: Sort (precedence, length, smart), duplicates, whitespace
- 📊 **Array**: ReIndex (`list-ordered`), Add to Array (`add`)
- 📄 **Forms**: Reload (`refresh`), Generate/Update summary (`sync`)
- 📖 **Examples**: Button Gadgets, Frame Gadgets

*Note: Icons visible in Command Palette (`Ctrl+Shift+P`). VS Code limitation prevents icons in nested context menus.*

### Documentation

**LSP README** - Complete rewrite:
- ✅ Removed "Alpha" status - LSP is production-ready
- ✅ All implemented features documented with ✅ checkmarks
- ✅ Added performance metrics: startup < 500ms, 100-200 files/s indexing
- ✅ Configuration examples and known limitations
- ✅ Clean project structure without outdated TODOs

### Code Quality (P0/P1 Fixes)

**Error Handling**:
- ✅ Fixed 4 locations with untyped error catching
- ✅ Changed `catch (error)` → `catch (error: unknown)` with type guards
- ✅ Better error messages for users

**Documentation Links**:
- ✅ Fixed broken links in `CONTRIBUTING.md`
- ✅ Fixed case-sensitive references: `changelog.md` → `CHANGELOG.md`
- ✅ Removed references to non-existent files

**Repository Cleanup**:
- ✅ Removed debug console.log statements
- ✅ Removed outdated TODO comments
- ✅ Added `ARCHITECTURE_ANALYSIS.md` to repository

## 📦 Installation

**GitHub Release:** [v0.10.2](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.10.2)

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.10.1

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
