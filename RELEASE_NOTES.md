# Release Notes - v0.12.1

**Release Date:** 2026-05-08

## What's New in v0.12.1

### Fixes

- Removed an accidental JavaScript snippet from `examples/ceposition.pmlfrm`, making it a zero-error form parser smoke fixture.
- Tightened form callback extraction so unrelated member names such as `recall` and `callRegistry` are not captured as callbacks.

### Regression Coverage

- Added `.pmlfrm` fixture smoke tests that parse `examples/*.pmlfrm` and enforce non-regression baselines.
- Updated `VERSIONING.md` so the documented `0.12.0` milestone matches the shipped form parser foundation.

### Validation

- Language server tests: 110 passed, 2 skipped.
- TypeScript compile, bundled compile, root lint, language-server lint, diff check, VSIX packaging, and local VS Code/Cursor install passed.

## Installation

**GitHub Release:** [v0.12.1](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.1)

**Checksum:** see GitHub release assets.

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.12.0

**Release Date:** 2026-05-08

## What's New in v0.12.0

### First-Class `.pmlfrm` Parser Foundation

- Added parser support for PML call chains where member access continues after a method call, such as `!this.link.Unset().Not()`.
- Parsed form-level member assignments like `!this.callback = '!this.init()'` as assignment expressions.
- Extracted callback bindings from form assignments such as `!this.callback`, `!this.Quitcall`, and `!this.wrt.callback`.
- Added support for nested `frame ... exit` blocks inside form definitions.
- Accepted numeric handle headers such as `handle (1000,0)` used around form imports.
- Added `import` and `using` to the command starter metadata for form/import workflows.

### Validation

- Language server tests: 103 passed, 2 skipped.
- TypeScript compile, bundled compile, root lint, language-server lint, diff check, VSIX packaging, and local VS Code/Cursor install passed.

## Installation

**GitHub Release:** [v0.12.0](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.0)

**Checksum:** see GitHub release assets.

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.11.8

**Release Date:** 2026-05-08

## What's New in v0.11.8

### Fixes

- Suppressed PDMS command hover inside PML comments, including `--`, `$*`, and `$( ... $)` block comments.
- Stopped form-only tools after warning when the active file is not a `.pmlfrm` file.

### Maintenance

- Added VSIX packaging to GitHub Actions CI so packaging and `.vscodeignore` are checked before release.
- Documented the `pml.diagnostics.formErrors` setting in the README.

### Validation

- Language server tests: 99 passed, 2 skipped.
- TypeScript compile, bundled compile, root lint, language-server lint, diff check, VSIX packaging, and local VS Code/Cursor install passed.

## Installation

**GitHub Release:** [v0.11.8](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.11.8)

**Checksum:** see GitHub release assets.

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.11.7

**Release Date:** 2026-05-08

## What's New in v0.11.7

### PDMS Command Metadata and Hover

- Converted the PDMS command starter whitelist into categorized command metadata with short descriptions.
- Added hover help for whitelisted PDMS command starters when they are the first non-whitespace token on a line.
- Added regression tests for command metadata and hover behavior.

### Form Diagnostics Control

- Added `pml.diagnostics.formErrors` to let users opt into `.pmlfrm` parser diagnostics as warnings or errors.
- Made `.pmlfrm` file detection case-insensitive in language-server and form tool paths.

### Maintenance

- Expanded GitHub Actions CI to run TypeScript compile, root lint, language-server lint, language-server tests, and bundled compile.
- Removed unused legacy client provider source files that are no longer imported by the extension entrypoint.
- Replaced version-specific VSIX install examples in `README.md` with a version-neutral filename pattern.

### Validation

- Language server tests: 98 passed, 2 skipped.
- TypeScript compile, bundled compile, root lint, language-server lint, diff check, VSIX packaging, and local VS Code/Cursor install passed.

## Installation

**GitHub Release:** [v0.11.7](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.11.7)

**Checksum:** see GitHub release assets.

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.11.6

**Release Date:** 2026-05-08

## What's New in v0.11.6

### VSIX Asset Size

- Resized `icons/pml-icon.png` from 1024x1024 to 256x256.
- Reduced the icon from 1.84 MB to about 95 KB.
- Reduced the packaged VSIX from about 2.02 MB to about 301 KB while preserving runtime bundles and required user-facing assets.

### Cleanup

- Removed obsolete commented-out legacy provider registration blocks from `src/extension.ts`.

### Validation

- Language server tests: 95 passed, 2 skipped.
- TypeScript compile, bundled compile, root lint, language-server lint, diff check, VSIX packaging, and local VS Code/Cursor install passed.

## Installation

**GitHub Release:** [v0.11.6](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.11.6)

**Checksum:** see GitHub release assets.

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.11.5

**Release Date:** 2026-05-08

## What's New in v0.11.5

### Post-Review Parser Hardening

- PDMS command starter highlighting now applies only to the first non-whitespace token on a line.
- Whitelisted words such as `add`, `move`, `new`, and `pos` no longer swallow ordinary call, member, indexed, assignment, or `of` expressions.
- `$P` print line parsing now requires whitespace or end-of-line after `$P`, aligning parser behavior with the print tools.

### `$P` Print Tool Improvements

- Debounced print decoration refreshes and cached scans per document version.
- Re-resolved hover command targets by original line text before comment/delete actions.
- Added pure utility coverage for print scanning, block-comment scoping, and comment/uncomment round-trips.
- Declared current-line print commands for VS Code command/keybinding discovery.

### Packaging and Documentation

- Cleaned VSIX packaging rules so only runtime bundles and required user-facing files are included.
- Documented `$P` print tools and the PDMS command starter whitelist in the README.

### Validation

- Language server tests: 95 passed, 2 skipped.
- TypeScript compile, bundled compile, root lint, language-server lint, diff check, VSIX packaging, and local VS Code/Cursor install passed.

## Installation

**GitHub Release:** [v0.11.5](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.11.5)

**Checksum:** see GitHub release assets.

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.11.4

**Release Date:** 2026-05-08

## What's New in v0.11.4

### PDMS Command Starter Whitelist

- Added a curated PDMS command starter whitelist in `packages/pml-language-server/src/data/pdmsCommands.ts`.
- Moved parser line-command recognition from an inline parser set into the shared whitelist.
- Added initial entries from already observed project commands and common PDMS command examples, including `ADD`, `MOVE`, `Q`, and `BY`.
- Highlighted whitelisted PDMS command starters as keywords in semantic tokens.

### `$P` Print Tools

- Added full-line visual highlighting for `$P ...` print/debug output commands.
- Added a status bar counter showing how many active `$P` print lines are in the current file.
- Added hover-only actions for `$P` lines: `Prev`, `Next`, `Comment`, `Delete`, and `Actions`.
- Added PML Prints commands for next/previous navigation, comment all, uncomment all, delete all, and quick print actions.
- Avoided always-visible CodeLens text after it proved too visually noisy in files with many print statements.
- Ignored `$P` lines inside `$( ... $)` block comments for print decorations and actions.

### Validation

- Language server tests: 90 passed, 2 skipped.
- TypeScript compile, bundled compile, root lint, language-server lint, diff check, VSIX packaging, and local VS Code/Cursor install passed.

## Installation

**GitHub Release:** [v0.11.4](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.11.4)

**Checksum:** see GitHub release assets.

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.11.3

**Release Date:** 2026-05-07

## What's New in v0.11.3

### Parser Compatibility

- Fixed real-world validation issues found in `proreport.pmlfnc` and `exportifczones.pmlfnc`.
- Added support for PML concatenation with `&`.
- Added support for database path literals such as `/240000-АС14_Фр1`.
- Added support for database attribute expressions such as `:Шифр_комплекта_РД of $!site`.
- Added support for numeric literals with units such as `1mm`.
- Added support for empty global function calls such as `!!autoColourgnp()`.
- Added line-command handling for AVEVA commands including `GETWORK`, `trace`, `unlock`, `EXPORT`, `AUTOCOLOUR`, `REPRESENTATION`, `tolerance`, and `SYSCOM`.
- Fixed bare `return` so it does not consume the next physical line.

### Comments and Highlighting

- `$*` is now correctly scoped as a single-line comment in semantic highlighting.
- `$( ... $)` is now supported as a multi-line PML comment in parser and highlighting layers.
- `$P ...` output lines are highlighted as output commands, making debug output easier to scan.

### Validation

- Language server tests: 89 passed, 2 skipped.
- TypeScript compile, bundled compile, lint, diff check, JSON validation, VSIX packaging, and local VS Code/Cursor install passed.
- Manual parser validation: `proreport.pmlfnc` and `exportifczones.pmlfnc` both parse with `errors 0`.

## Installation

**GitHub Release:** [v0.11.3](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.11.3)

**Checksum:** see GitHub release assets.

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.11.2

**Release Date:** 2026-05-06

## What's New in v0.11.2

### PML Variable Substitution

- `$!site` and related substitution forms are now valid parser expressions instead of diagnostic errors.
- Supported forms include `$!local`, `$!!global`, `$/attribute`, and `$identifier`.
- Incomplete substitutions such as `$!` still produce a parser error.
- Substitution variables now receive TextMate and semantic variable highlighting.
- Editor word selection now treats `$!site` as a single PML word.

### Function Block Validation

- Added regression coverage for `.pmlfnc` function files using:
  - `define function !!proreport(!inlist is any, !folder is string)`
  - `endfunction`
- Verified typed parameters, nested `do` blocks, and substitution expressions inside function bodies parse cleanly.
- Existing folding and indentation rules already cover `define function` and `endfunction`.

### Validation

- Language server tests: 82 passed, 2 skipped.
- TypeScript compile, bundled compile, lint, diff check, JSON validation, VSIX packaging, and local VS Code/Cursor install passed.

## Installation

**GitHub Release:** [v0.11.2](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.11.2)

**Checksum:** see GitHub release assets.

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.11.1

**Release Date:** 2026-05-06

## What's New in v0.11.1

### Parser and Form Support

- Added parser support for `combo` gadgets and `track` callbacks in `.pmlfrm` files.
- Added line-scoped parsing for gadget modifiers: `width`, `wid`, `height`, `hei`, `tooltip`, `call`, `callback`, `pixmap`, and `at x<num>`.
- Preserved existing inline width precedence for legacy `text` and `option` declarations.
- Added member type keyword handling for lowercase and uppercase PML type tokens.

### Rename and References

- Improved Find References and Rename support for callback strings such as `|!this.refresh()|`.
- Added support for nested attribute paths such as `$/attr/sub.refresh`, `$attr/sub.refresh`, and `!a/b.refresh`.
- Added duplicate edit protection for rename operations.
- Shared CRLF-safe offset helpers between references and rename providers.

### Packaging

- Cleaned VSIX packaging so local agent/config files are excluded.
- Removed the stray root file `-` from the package surface.

### Validation

- Language server tests: 78 passed, 2 skipped.
- TypeScript compile, bundled compile, lint, diff check, and VSIX packaging passed.

## Installation

**GitHub Release:** [v0.11.1](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.11.1)

**Checksum:** see GitHub release assets.

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.11.0

**Release Date:** 2026-01-06

## 🚀 What's New in v0.11.0

### New Features

**Rename Symbol (F2)**:
- ✅ Workspace-wide symbol renaming
- ✅ Rename methods: `.oldName` → `.newName`
- ✅ Rename variables: `!oldVar` → `!newVar`, `!!globalVar` → `!!newGlobalVar`
- ✅ Rename objects and forms across all files
- ✅ Validates new name format for each symbol type

**Semantic Highlighting**:
- ✅ Variables (`!local`, `!!global`) highlighted distinctly
- ✅ Method names with definition vs. call detection
- ✅ Parameters in method signatures
- ✅ Type keywords (STRING, REAL, BOOLEAN, ARRAY, DBREF)
- ✅ Control flow keywords (if, do, handle, etc.)
- ✅ Comments and string literals

**Workspace Indexing Progress**:
- ✅ Progress bar shows "Indexed X/Y files" during startup
- ✅ Percentage reporting every 10 files
- ✅ Final summary of indexed symbols

### Improved Error Messages

**Context-Aware Parser Errors**:
- ✅ Array index errors: "PML arrays are 1-indexed. Use arr[1], not arr[0]"
- ✅ Method syntax: "Method names must start with a dot: .myMethodName"
- ✅ Typo suggestions: "Did you mean 'define'?" for typos like 'defne'
- ✅ Loop/condition context: "Every 'do' loop must end with 'enddo'"

### Cleanup

**Removed Dead Settings**:
- ❌ `pml.typeInference.enabled` (never implemented)
- ❌ `pml.inlayHints.enabled` (never implemented)
- ❌ `pml.inlayHints.parameterNames` (never implemented)

## Installation

**GitHub Release:** [v0.11.0](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.11.0)

**Checksum (MD5):** _see GitHub release_

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

# Previous Release - v0.10.6

**Release Date:** 2026-01-04

See [CHANGELOG.md](CHANGELOG.md) for v0.10.6 details.

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
