# Project TODOs - Infrastructure & Documentation

Tasks for project improvement (not extension features).

## 🚀 High Priority (do soon)

### Visual Content

- [ ] **3 GIF demos** (≤10 MB each) ⭐ CRITICAL
  - [ ] GIF 1: Code Actions (lightbulb 💡) - Array, Sort, Remove
  - [ ] GIF 2: Autocompletion and Hover documentation
  - [ ] GIF 3: Formatting and PML Tools menu
  - Tools: LICEcap, ScreenToGif, Gifski
  - Place at top of README.md

- [ ] **Screenshots** for Marketplace
  - [ ] Syntax highlighting (before/after)
  - [ ] Outline with methods
  - [ ] Quick Actions menu
  - [ ] Autocompletion in action
  - Folder: `images/screenshots/`

- [ ] **Extension icon**
  - 128×128 PNG (for Marketplace)
  - Optimize current `icons/pml-icon.png` (currently 1.84 MB!)
  - Create variants: 32x32, 64x64, 128x128

- [ ] **Banner for Marketplace**
  - 1400×400 PNG
  - Text: "PML for AVEVA E3D - IntelliSense, Formatting, Tools"
  - Save as: `images/banner.png`

### Badges in README

- [ ] Add badges to top of README.md:
  ```markdown
  [![Version](https://img.shields.io/visual-studio-marketplace/v/mikhalchankasm.pml-aveva-e3d)](...)
  [![Installs](https://img.shields.io/visual-studio-marketplace/i/mikhalchankasm.pml-aveva-e3d)](...)
  [![Rating](https://img.shields.io/visual-studio-marketplace/r/mikhalchankasm.pml-aveva-e3d)](...)
  [![CI](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/workflows/CI/badge.svg)](...)
  [![License](https://img.shields.io/github/license/mikhalchankasm/vscode-pml-aveva-e3d)](LICENSE)
  ```

### Feature Documentation

- [ ] **docs/commands.md** - all commands list
  - Command ID
  - Keyboard shortcuts
  - Where to find in menu
  - Usage examples

- [ ] **docs/settings.md** - all settings
  - `pml.formatter.*`
  - `pml.trace`
  - JSON configuration examples

- [ ] **docs/snippets.md** - snippets list
  - Trigger → what it generates
  - Table with examples

- [ ] **docs/pml-cheatsheet.md** - cheat sheet
  - PML types (STRING, REAL, ARRAY, DBREF)
  - Operators (eq, ne, gt, and, or)
  - Built-in functions (query, output, collectallfor)
  - Arrays (1-indexed!)
  - Forms and callbacks
  - EDG basics

---

## 🟡 Medium Priority

### Content

- [ ] **Video tutorial (60-90 sec)**
  - Installation + 3 main features
  - YouTube + link in README
  - Possibly Telegram channel

- [ ] **Example projects**
  - `example-project/` - sandbox for testing
  - 4-6 real PML files with comments
  - pmlfrm/pmlfnc/pmlcmd/pmlobj examples

- [ ] **Recipes / Cookbook**
  - `docs/recipes/` folder
  - Sort methods
  - Generate form template
  - Quick EDG packet
  - Working with arrays

### Publishing

- [ ] **package.json improvements**
  - Fill `keywords`: aveva, e3d, pml, pdms, macro, industrial-bim
  - Add `categories`: Programming Languages, Snippets, Linters, Formatters
  - `galleryBanner`: {"color": "#0066CC", "theme": "dark"}
  - Check `publisher`, `repository`, `bugs`, `homepage`

- [ ] **Open VSX publishing**
  - `ovsx publish` in release.yml
  - Token for Open VSX Registry

- [ ] **Marketplace README**
  - Separate README.md for Marketplace (if needed)
  - More visuals, less text

### Community

- [ ] **Enable GitHub Discussions**
  - Q&A category
  - Ideas & Feature Requests
  - Show & Tell

- [ ] **good first issue labels**
  - Create 2-3 simple issues
  - Label: `good first issue`, `help wanted`

- [ ] **CODEOWNERS**
  - Who reviews grammar/LSP/docs

---

## 🟢 Low Priority (when there's time)

### Advanced Documentation

- [ ] **docs/lsp.md** (when LSP exists)
  - Features (hover, defs, symbols, diagnostics)
  - Protocol

- [ ] **docs/grammar.md**
  - What TextMate covers
  - Known limitations
  - How to add new patterns

- [ ] **TELEMETRY.md**
  - Event list (if telemetry added)
  - How to disable
  - No PII

- [ ] **PRIVACY.md**
  - What we DON'T collect
  - Plain language

### Quality

- [ ] **devcontainer/**
  - Container for contributors
  - Node + vsce + ovsx

- [ ] **Grammar tests**
  - `.github/workflows/grammar-tests.yml`
  - Snapshot highlighting tests

- [ ] **CITATION.cff**
  - For academic citations

### SEO and Distribution

- [ ] **Repository topics** (GitHub)
  - `vscode-extension`, `pml`, `aveva`, `e3d`, `pdms`, `industrial-bim`

- [ ] **Documentation translation**
  - Translate more docs if needed

- [ ] **Before/after comparison**
  - Screenshots: code without extension vs with extension

---

## ✅ Already Done

- [x] LICENSE (MIT)
- [x] CHANGELOG.md (SemVer)
- [x] CONTRIBUTING.md (English)
- [x] CODE_OF_CONDUCT.md (English)
- [x] SECURITY.md (English)
- [x] FAQ.md (English)
- [x] ROADMAP.md (English)
- [x] .github/ISSUE_TEMPLATE/bug_report.yml
- [x] .github/ISSUE_TEMPLATE/feature_request.yml
- [x] .github/PULL_REQUEST_TEMPLATE.md
- [x] .github/workflows/ci.yml
- [x] .github/workflows/release.yml
- [x] examples/ (9 files)
- [x] docs/ (15+ files)
- [x] README.ru.md (Russian version kept)

---

## 📝 Notes

### GIF Tools

- **LICEcap** (Windows/Mac) - simple, lightweight
- **ScreenToGif** (Windows) - many features, editor
- **Gifski** - video to GIF converter (high quality)
- **ShareX** (Windows) - screenshots + GIF + video

### GIF Optimization

```bash
# Compress GIF (gifsicle)
gifsicle -O3 --lossy=80 input.gif -o output.gif

# Or online: ezgif.com/optimize
```

### Icon Size

Current `icons/pml-icon.png` = 1.84 MB - **too large!**

Optimize:
```bash
# ImageMagick
convert pml-icon.png -resize 128x128 -quality 85 pml-icon-optimized.png

# TinyPNG API or online: tinypng.com
```

Target size: < 100 KB

---

*Update as you complete tasks!*
