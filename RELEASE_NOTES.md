# Release Notes: v0.9.6

**Released:** 2025-01-29

## 🎯 UX Improvements Release

This release focuses on improving user experience with comment commands and simplifying menus.

---

## ✨ New Features

### Comment Commands Work Without Selection

- **Add Comments** and **Remove Comments** now work on the current line
- No need to select text - just place cursor anywhere in the line
- If text is selected, commands work on all selected lines
- More convenient workflow for quick commenting

**Example:**
```pml
Before (cursor at |):
!var = |value

After pressing Add Comments:
-- !var = value
```

---

## 🔧 Changes

### Code Actions (Ctrl+. or 💡 Lightbulb) - Simplified

Previous behavior: Showed 9+ commands (array, sort, cleanup)
New behavior: Only 2 focused commands

- ✅ **💬 Add Comments** - Comment out code
- ✅ **💬 Remove Comments** - Uncomment code
- ❌ Removed array, sort, and cleanup commands (moved to context menu)

**Philosophy:** Quick Fix menu should be fast and focused

### Context Menu - "Quick Action PML" Enhanced

Renamed from "Quick Actions" to "**Quick Action PML**"

Now contains **ALL** toolbar commands:
- **Sort** (4 commands): A→Z, Z→A, By Length, Smart Natural
- **Duplicates** (2 commands): Remove Duplicates, Remove Consecutive
- **Whitespace** (5 commands): Remove Empty, Remove Whitespace-Only, Trim, Tabs↔Spaces
- **Extract** (2 commands): Variables, Methods
- **Align** (1 command): Align PML
- **Comments** (2 commands): Add, Remove
- **Forms** submenu: Reload Form
- **Array** submenu: Make List variants

**Access:** Right-click → Quick Action PML

---

## 🗑️ Removed

### Column Generator Deleted

- Removed command and implementation
- Users can use dedicated column editing extensions (better alternatives available)
- Reduces extension complexity

---

## 📊 Menu Structure

```
Code Actions (💡 Ctrl+.)
├─ 💬 Add Comments
└─ 💬 Remove Comments

Context Menu (Right-Click)
├─ ⚡ Quick Action PML (all commands)
└─ Array (3 commands)

Toolbar Button
└─ PML Tools (all commands)
```

---

## 📦 Installation

### Method 1: Manual VSIX Installation

1. Download `pml-aveva-e3d-0.9.6.vsix` from [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.9.6)
2. Install:
   - **VS Code:** `code --install-extension pml-aveva-e3d-0.9.6.vsix`
   - **Cursor:** Extensions → "..." menu → "Install from VSIX"

### Method 2: VS Code Marketplace

Coming soon...

---

## 📊 Statistics

- **Extension size:** ~2.08 MB (55 files)
- **Changes:** UX improvements, menu simplification
- **Removed:** Column Generator (1 command)
- **Enhanced:** Comment commands, context menu

---

## 🔄 Upgrade Notes

### For Users of Column Generator

If you used the Column Generator feature, consider these alternatives:
- **Text Pastry** extension (VS Code Marketplace)
- **Multi Cursor** built-in features
- **Insert Numbers** extensions

### Menu Changes

- Code Actions (💡) now only shows comment commands
- All other commands moved to "Quick Action PML" in context menu
- Toolbar button unchanged

---

## 📝 Full Changelog

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

---

## 🔗 Links

- **Repository:** https://github.com/mikhalchankasm/vscode-pml-aveva-e3d
- **Issues:** https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues
- **Previous Release:** [v0.9.5](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.9.5)

---

**Feedback Welcome!** If you find any issues or have suggestions, please open an issue on GitHub.
