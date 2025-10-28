# Release Notes: v0.9.0

**Released:** 2025-01-28

## 🎯 Basic Form Syntax Support

This release introduces **basic parsing support for PML forms** (.pmlfrm files), laying the foundation for enhanced form development experience.

---

## ✨ New Features

### Parser: Form Structure Recognition

Forms are now properly parsed with full support for modifiers:

```pml
setup form !!myForm DIALOG RESIZABLE DOCK LEFT
    !this.formTitle = |My Form|
    !this.initCall = |!this.init()|
    button .ok |OK| OK
    button .cancel |Cancel| CANCEL
exit
```

**Supported:**
- Form types: `DIALOG`, `MAIN`, `DOCUMENT`, `BLOCKINGDIALOG`
- `RESIZABLE` modifier
- `DOCK LEFT|RIGHT|TOP|BOTTOM` positioning
- Extended FormDefinition AST with metadata

### Parser: Gadget Declarations

Four basic gadget types now parse correctly:

```pml
button .ok |OK| OK at x20
text .input |20| at x10
option .choice |15| |Select Option| at x5
toggle .flag |Enable Feature|
frame .container
    button .nested |Nested Button|
exit
```

**Features:**
- Button modifiers: `OK`, `CANCEL`, `APPLY`, `RESET`
- Position support: `at x<number>`
- Width specification for text/option gadgets
- Nested gadgets in frames
- New GadgetDeclaration AST node

### Parser: Member Declarations

Object members in forms now parse correctly:

```pml
member .myString is STRING
member .myNumber is REAL
member .myArray is ARRAY
member .myRef is DBREF
```

**All PML types supported:** STRING, REAL, INTEGER, BOOLEAN, ARRAY, DBREF

---

## 🔧 Improvements

### Diagnostics: Array Index Checker

- **Fixed critical bug:** Changed `varDecl.init` to `varDecl.initializer`
- **30 comprehensive tests** added (100% pass rate)
- Tests cover: basic detection, valid indices, control flow, expressions, edge cases

### Tokens: Form Keywords

Added 15+ form-related tokens:
- `OPTION`, `TOGGLE`, `MAIN`, `DOCUMENT`, `BLOCKINGDIALOG`
- `RESIZABLE`, `DOCK`, `LEFT`, `RIGHT`, `TOP`, `BOTTOM`
- `OK`, `CANCEL`, `APPLY`, `RESET`

---

## 📊 Statistics

- **Extension size:** 2.08 MB (55 files)
- **MD5 Checksum:** `cb4ef54aecffe1e8dc73b411821b91a2`
- **Tests:** 68 passing, 2 skipped (20 parser + 18 typo + 30 arrayIndexChecker)
- **Form support:** Basic parsing complete

---

## ⚠️ Known Limitations

The following features are **not yet implemented** (planned for future v0.9.x releases):

- ❌ IntelliSense for form callbacks (`!this.formTitle`, `!this.initCall`, etc.)
- ❌ Gadget type autocomplete
- ❌ Callback method validation (undefined method warnings)
- ❌ Form snippets
- ❌ Complex gadgets (VIEW, ALPHA, LIST, TREE, etc.)
- ❌ Layout system (Path, Dist, Align, ANCHOR, DOCK attributes)
- ❌ Screen coordinates parsing (xr, yr)

---

## 🚀 What's Next?

**Future v0.9.x releases** will add:
- IntelliSense for form callbacks and gadgets
- Diagnostic warnings for undefined callback methods
- Form code snippets
- Enhanced gadget support

---

## 📦 Installation

### VS Code Marketplace
*(Coming soon - awaiting marketplace publication)*

### Manual Installation (VSIX)

1. Download `pml-aveva-e3d-0.9.0.vsix` from [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.9.0)
2. Verify checksum: `cb4ef54aecffe1e8dc73b411821b91a2`
3. Install:
   - VS Code: `code --install-extension pml-aveva-e3d-0.9.0.vsix`
   - Cursor: Open Extensions → "..." menu → "Install from VSIX"

---

## 🐛 Bug Fixes

- Fixed arrayIndexChecker not detecting arr[0] in variable declarations
- Fixed AST node property naming inconsistency

---

## 📝 Full Changelog

See [CHANGELOG.md](./CHANGELOG.md) for complete details.

---

**Tested on:**
- VS Code 1.80+
- Cursor IDE (latest)
- Windows 10/11

**Feedback:** [GitHub Issues](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
