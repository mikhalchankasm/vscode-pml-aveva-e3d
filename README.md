# PML for AVEVA E3D — VS Code Extension

[![Version](https://img.shields.io/badge/version-0.4.8-blue.svg)](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![CI](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/workflows/CI/badge.svg)](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/actions)

> Language support for **AVEVA E3D PML** (Programmable Macro Language) in Visual Studio Code.

**Languages:** [English](README.en.md) • [Русский](README.ru.md)

---

## ✨ Features

- ⚡ **Code Actions** — Quick commands with lightbulb (💡) on text selection
- 🎯 **Quick Actions Menu** — Context menu for fast access to tools
- 🎨 **Syntax Highlighting** — TextMate grammar for PML1 & PML2
- 📝 **IntelliSense** — Autocomplete, signature help, hover documentation
- 🔧 **Formatter** — Auto-indent, align assignments, format blocks
- 🗂️ **Outline** — Document symbols (methods, objects, forms, frames)
- 🐛 **Diagnostics** — Real-time error checking (unclosed blocks)
- 🛠️ **PML Tools** — Sort, trim, remove duplicates, extract variables/methods
- 🔍 **Navigation** — Go to Definition, Find References, Rename Symbol

## 🚀 Quick Start

### Installation

**Option 1: From VSIX**
```bash
npm install
npm run pack:install
# Reload VS Code: Ctrl+Shift+P → Reload Window
```

**Option 2: Development Mode**
```bash
git clone https://github.com/mikhalchankasm/vscode-pml-aveva-e3d.git
cd vscode-pml-aveva-e3d
npm install
# Press F5 in VS Code to launch Extension Development Host
```

### Supported File Types
`.pml` `.pmlobj` `.pmlfnc` `.pmlfrm` `.pmlmac` `.pmlcmd`

## 💡 Code Actions (New in v0.4.8)

Select 2+ lines in PML file → Press `Ctrl+.` or click 💡:

- 📋 **Array**: Make List (Path/String/Path String)
- 🔤 **Sort**: A→Z, Z→A, Smart Natural
- 🗑️ **Remove**: Duplicate Lines, Empty Lines
- ✂️ **Trim**: Trailing Whitespace

Or right-click → **⚡ Quick Actions** for instant access!

## ⚙️ Settings

Configure in `settings.json`:

```json
{
  "pml.formatter.indentSize": 4,
  "pml.formatter.alignAssignments": true,
  "pml.formatter.formatMethodBlocks": true,
  "pml.formatter.formatFormBlocks": true,
  "pml.trace": "off"
}
```

## 📚 Documentation

- [FAQ](FAQ.md) — Frequently Asked Questions
- [Contributing](CONTRIBUTING.md) — Contributor Guidelines
- [Roadmap](ROADMAP.md) — Development Plans
- [Security](SECURITY.md) — Security Policy
- [Changelog](docs/CHANGELOG.md) — Version History

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick Links:**
- 🐛 [Report Bug](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues/new?template=bug_report.yml)
- ✨ [Request Feature](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues/new?template=feature_request.yml)
- 💬 [Discussions](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions) (coming soon)

## 📝 License

[MIT](LICENSE) © 2025 Mikhail Khankasm

---

**⭐ Star this repo if you find it useful!**
