# Release Notes v0.4.8

## 🎉 What's New

### ⚡ Code Actions Provider (Lightbulb 💡)
Quick actions appear when you select 2+ lines in PML files:
- Press `Ctrl+.` or click the lightbulb
- Commands grouped by categories:
  - 📋 **Array**: Make List (Path/String/Path String)
  - 🔤 **Sort**: A→Z, Z→A, Smart Natural
  - 🗑️ **Remove**: Duplicate Lines, Empty Lines
  - ✂️ **Trim**: Trailing Whitespace

### 🎯 Quick Actions Context Menu
- Right-click on selected text → "⚡ Quick Actions"
- Shows only when text is selected in PML files
- Quick access to most-used commands
- Does not conflict with existing "PML Tools" menu

### 🎯 Updated Icon
- "PML Tools" icon in title bar changed from tools to target `$(target)`
- More distinctive and visible

## 📚 Documentation Overhaul

### New Files (English)
- ✅ **CONTRIBUTING.md** - contributor guidelines
- ✅ **FAQ.md** - frequently asked questions
- ✅ **SECURITY.md** - security policy
- ✅ **CODE_OF_CONDUCT.md** - code of conduct
- ✅ **ROADMAP.md** - development roadmap
- ✅ **.github/ISSUE_TEMPLATE/** - bug & feature templates
- ✅ **.github/PULL_REQUEST_TEMPLATE.md** - PR template

### Internationalization
- All main documentation translated to English
- **README.ru.md** kept in Russian for Russian-speaking users
- Project ready for international audience 🌍

## 🔧 How to Use

### Code Actions (Lightbulb)
1. Select 2+ lines in a `.pml` file
2. Press `Ctrl+.` or click the 💡 lightbulb
3. Choose command from the list
4. Done!

### Context Menu
1. Select text in a `.pml` file
2. Right-click → "⚡ Quick Actions"
3. Choose command
4. Done!

## 📊 Package Contents

**Included in VSIX:**
- README (English, Russian)
- FAQ, SECURITY, ROADMAP, CONTRIBUTING
- Issue templates, PR template
- Compiled extension code
- Syntax highlighting, snippets

**Size:** 1.87 MB (35 files)
**Note:** Icon is large (1.84 MB) - optimization planned for next release

## 🚀 Installation

### From VSIX (Latest)
```bash
code --install-extension pml-aveva-e3d-0.4.8.vsix --force
```

### From Source
```bash
git clone https://github.com/mikhalchankasm/vscode-pml-aveva-e3d.git
cd vscode-pml-aveva-e3d
npm install
npm run pack:install
# Reload VS Code: Ctrl+Shift+P → Reload Window
```

## 📝 Full Changelog

See [CHANGELOG.md](docs/CHANGELOG.md) for complete version history.

## 🐛 Known Issues

- Icon file size is large (1.84 MB) - will be optimized in v0.4.9

## 🙏 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📞 Support

- 🐛 [Bug Reports](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues/new?template=bug_report.yml)
- ✨ [Feature Requests](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues/new?template=feature_request.yml)
- 💬 [Discussions](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions) (coming soon)

---

**Thank you for using PML for AVEVA E3D extension!** 🚀

