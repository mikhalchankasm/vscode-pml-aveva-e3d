# Release Notes: v0.9.1

**Released:** 2025-01-28

## 🎨 UI/UX Improvements

This release focuses on **cleaner user interface** and **new productivity commands**.

---

## ✨ What's New

### Context Menu Cleanup

The right-click context menu is now **much cleaner**:
- ✅ All PML Tools commands **removed from context menu**
- ✅ Commands still accessible via **editor title bar button** (top toolbar)
- ✅ Better user experience with less clutter

**Before:** 20+ commands in right-click menu
**After:** Clean context menu, all tools in toolbar button

---

### New Command: Add Comments

Quickly comment out selected code:

```pml
!var = value
!another = test
```

**After "Add Comments":**
```pml
-- !var = value
-- !another = test
```

**Features:**
- Preserves indentation
- Skips empty lines automatically
- One-click commenting

---

### New Command: Align PML

Intelligently aligns code for better readability:

#### Align by `=` operator:

**Before:**
```pml
!lrtb = | anchor all |
!lrt = | anchor left + right + top |
!rt = | anchor right + top |
```

**After "Align PML":**
```pml
!lrtb     = | anchor all |
!lrt      = | anchor left + right + top |
!rt       = | anchor right + top |
```

#### Align by `is` keyword:

**Before:**
```pml
member .dfltsDir is string
member .wordFile is string
member .wordFileDir is string
```

**After "Align PML":**
```pml
member .dfltsDir    is string
member .wordFile    is string
member .wordFileDir is string
```

**Features:**
- Auto-detects alignment target (`=` or `is`)
- Works on selected lines
- Maintains proper spacing

---

## 🐛 Bug Fixes

Fixed several non-working commands:
- ✅ Remove Duplicate Lines
- ✅ Remove Empty Lines
- ✅ Trim Whitespace

All cleanup commands now work as expected!

---

## 📦 Installation

### Manual Installation (VSIX)

1. Download `pml-aveva-e3d-0.9.1.vsix` from [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.9.1)
2. Verify checksum: `4055d081e98c14ec36dc0a45aee7e9c8`
3. Install:
   - VS Code: `code --install-extension pml-aveva-e3d-0.9.1.vsix`
   - Cursor: Open Extensions → "..." menu → "Install from VSIX"

---

## 📊 Statistics

- **Extension size:** 2.08 MB (55 files)
- **MD5 Checksum:** `4055d081e98c14ec36dc0a45aee7e9c8`
- **New commands:** 2 (Add Comments, Align PML)
- **Fixed commands:** 3

---

## 📝 Full Changelog

See [CHANGELOG.md](./CHANGELOG.md) for complete details.

---

**Previous Release:** [v0.9.0 - Basic Form Syntax Support](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.9.0)

**Feedback:** [GitHub Issues](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
