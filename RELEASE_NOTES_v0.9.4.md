# Release Notes: v0.9.4

**Released:** 2025-01-28

## 🔧 Bug Fix Release

This release corrects the menu configuration from v0.9.1 based on user feedback.

---

## 🐛 Bug Fixes

### Menu Configuration Corrected

In v0.9.1, the menu structure was implemented incorrectly:
- **Wrong:** Removed all commands from context menu, kept array submenu in toolbar
- **Correct:** Keep Quick Actions in context menu (with array commands), remove array submenu from toolbar

**Now fixed:**
- ✅ Context menu (right-click) → **Quick Actions** → includes array commands
- ✅ Toolbar button (PML Tools) → **excludes array submenu**
- ✅ Array commands accessible via context menu Quick Actions

---

## 📊 Menu Structure

### Context Menu (Right-Click)
```
⚡ Quick Actions
  ├── Convert Variables to Upper Case
  ├── Convert Variables to Lower Case
  ├── Remove Array Index [0]
  ├── Add Array Index [1]
  └── Ensure Array Has Index [1]
```

### Toolbar Button (PML Tools)
```
PML Tools (📄 icon)
  ├── Sort Lines Ascending
  ├── Sort Lines Descending
  ├── Sort Lines by Length
  ├── Sort Lines Smart
  ├── Remove Duplicates
  ├── Remove Consecutive Duplicates
  ├── Remove Empty Lines
  ├── Remove Whitespace Lines
  ├── Trim Whitespace
  ├── Add Comments
  ├── Remove Comments
  ├── Align PML
  ├── Column Generator
  └── Forms
       └── Reload Form
```

---

## 📦 Installation

### Manual Installation (VSIX)

1. Download `pml-aveva-e3d-0.9.4.vsix` from [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.9.4)
2. Verify checksum: `2f86a1401d010f81db40907e49c9bdb2`
3. Install:
   - VS Code: `code --install-extension pml-aveva-e3d-0.9.4.vsix`
   - Cursor: Open Extensions → "..." menu → "Install from VSIX"

---

## 📊 Statistics

- **Extension size:** 2.08 MB (55 files)
- **MD5 Checksum:** `2f86a1401d010f81db40907e49c9bdb2`
- **Bug fixes:** 1 (menu configuration)
- **Code quality:** Fixed 2 ESLint errors + 15 warnings

---

## 📝 Full Changelog

See [CHANGELOG.md](./CHANGELOG.md) for complete details.

---

**Previous Release:** [v0.9.3 - Remove Comments Fix](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.9.3)

**Feedback:** [GitHub Issues](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
