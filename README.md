# PML for AVEVA E3D — VS Code Extension

[![Version](https://img.shields.io/badge/version-0.12.45-blue.svg)](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/LICENSE)

> Full-featured Language Server Protocol (LSP) extension for **AVEVA E3D PML** (Programmable Macro Language) in Visual Studio Code.

**Languages:** [English](#english) • [Русский](#русский)

---

## English

### ✨ Features

- 🎨 **Syntax Highlighting** — Full PML1/PML2 syntax support
- 📝 **IntelliSense** — Smart autocomplete for keywords, methods, variables, and typed callable argument snippets
- 🛠️ **Call Authoring** — Complete missing arguments, generate safe stubs, synchronize generated signatures, and navigate directly between calls and definitions
- 🧩 **Form Authoring** — A visual CodeLens outline for form actions, members and callbacks; batch-generate missing handlers, add init/OK/cancel lifecycle wiring, declare reliably typed missing form members, and safely align declared member types with consistent direct assignments
- 🔍 **Navigation** — Go to Definition, Find References, Document/Workspace Symbols, clickable reference-count CodeLens, and incoming/outgoing Call Hierarchy
- 🏷️ **Inlay Hints** — Low-noise variable types propagated from reliable assignments, typed parameters, and explicit unambiguous call returns, plus parameter names for indexed calls
- 🧭 **Method Usage Preview** — Hover a `define method .name(...)` declaration to see the first usage locations with file/line links
- 🐛 **Diagnostics** — Real-time parser and configurable semantic checks
- 🔧 **LSP Server** — Full Language Server Protocol support
- 📋 **Signature Help** — Typed parameters and explicit return types for indexed method/function calls
- 🎯 **Hover Information** — Typed callable signatures and quick documentation on hover
- 🗂️ **Workspace Indexing** — Fast symbol search across project
- 📖 **Examples & Tutorials** — Built-in gadget examples and documentation (Button Gadgets, Frame Gadgets, etc.)
- 🔢 **Array Tools** — Smart array indexing, reindexing, and manipulation commands
- 📝 **Form Gadget Snippets** — Code snippets for Button, Frame, and other form gadgets
- 📚 **Context Menus** — Quick access to sorting, array manipulation, and form tools
- 🖨️ **`$P` Print Tools** — Highlight print/debug lines, show a status count, navigate next/previous, comment, uncomment, or delete print lines
- 🧭 **PDMS Command Compatibility** — Curated PDMS command starter whitelist for command-style PML lines

### 🚀 Quick Start

#### Installation

**Option 1: From GitHub Releases** (Recommended)
1. Download the latest `pml-aveva-e3d-*.vsix` from [Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases)
2. In VSCode: `Extensions` → `...` → `Install from VSIX`
3. Reload VSCode

**Option 2: Development Mode**
```bash
git clone https://github.com/mikhalchankasm/vscode-pml-aveva-e3d.git
cd vscode-pml-aveva-e3d
npm install
npm run compile
npm run compile:tsc
# Press F5 in VS Code to launch Extension Development Host
```

#### Build VSIX Package
```bash
npm run pack  # Creates pml-aveva-e3d-X.X.X.vsix
```

### 📁 Supported File Types
`.pml` `.pmlobj` `.pmlfnc` `.pmlfrm` `.pmlmac` `.pmlcmd`

### PML Assistant External CLI

This repository owns the official parser/LSP CLI contract for `e3d-pml-agent-kit`:

```bash
npm run pml:parse -- <file> --json
npm run pml:diagnose -- <file> --json
npm run pml:symbols -- <folder> --json
npm run pml:scope -- <file> --line <line> --column <column> --json
```

See [docs/pml-assistant-cli.md](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/docs/pml-assistant-cli.md) for the JSON contract and ownership boundaries.

### 🖨️ `$P` Print Tools

Lines that start with `$P` or `$p` are treated as PML print/debug output lines:

- full-line highlighting and overview ruler marker;
- active-file counter in the status bar;
- hover actions: `Prev`, `Next`, `Comment`, `Delete`, `Actions`;
- command palette actions: next/previous print, comment all, uncomment all, delete all.

### 🧭 PDMS Command Starter Whitelist

The parser accepts curated PDMS command-style lines via:

`packages/pml-language-server/src/data/pdmsCommands.ts`

Entries include the first command word, category, and short hover text. Add only the first command word in lowercase, for example `move`, `add`, or `q`.

### ⚙️ Diagnostics Settings

- `pml.diagnostics.formErrors`: controls parser diagnostics for `.pmlfrm` files while form DSL support is still limited.
  - `off` (default): suppress form parser diagnostics.
  - `warning`: show form parser diagnostics as warnings.
  - `error`: show form parser diagnostics as errors.
- `pml.diagnostics.formReferences`: opt-in callback/gadget reference validation for `.pmlfrm` files.
  - `off` (default): do not validate references.
  - `warning`: warn when callbacks target missing methods, `!this.<name>` references an unknown form member/gadget, or a declared member conflicts with consistent direct reliable assignments.
  - `error`: report those findings as errors.
  - Runs only after the form parses without parser errors to avoid cascade noise.
- `pml.codeLens.enabled`: show clickable reference counts above methods and global functions (default: `true`).
- `pml.inlayHints.enabled`: master switch for PML type and parameter hints (default: `true`).
- `pml.inlayHints.variableTypes`: infer types from the first reliable assignment in each scope (default: `true`).
- `pml.inlayHints.parameterNames`: show parameter names for unambiguous indexed calls (default: `true`).

### 📚 Documentation

- [TROUBLESHOOTING.md](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/TROUBLESHOOTING.md) - Common issues and solutions
- [CHANGELOG.md](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/CHANGELOG.md) - Version history and updates
- [CONTRIBUTING.md](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/CONTRIBUTING.md) - How to contribute to the project
- [examples/](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/tree/main/examples) - PML code examples for testing

### 🛠️ Development

**Project Structure:**
```
vscode-pml-extension/
├── src/                          # Extension client code
│   ├── extension.ts             # Main entry point
│   ├── languageClient.ts        # LSP client
│   └── ...
├── packages/pml-language-server/ # LSP server
│   └── src/
│       ├── server.ts            # LSP server main
│       ├── parser/              # PML parser
│       ├── providers/           # LSP providers (completion, hover, etc.)
│       └── diagnostics/         # Error detection
├── syntaxes/                     # TextMate grammar
├── objects/                      # PML type knowledge base
└── examples/                     # Test files
```

**Commands:**
- `npm run compile` - Build the extension bundle
- `npm run compile:tsc` - Run TypeScript checks for the extension and language server
- `npm run watch` - Watch mode (auto-compile)
- `npm run pack` - Build VSIX package
- `npm test` - Run tests

### 🐛 Known Issues

- **Form files** (.pmlfrm) have limited parser support (intentional - complex DSL)
- **Find All References / Rename** now prefer indexed method call sites, with text scanning retained for callback strings and dynamic fallback cases.
- **object ARRAY()** syntax may show "Expected expression" warning (parser limitation, does not affect functionality)

### 📝 License

MIT License - see [LICENSE](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/LICENSE)

---

## Русский

### ✨ Возможности

- 🎨 **Подсветка синтаксиса** — Полная поддержка PML1/PML2
- 📝 **IntelliSense** — Умные подсказки для ключевых слов, методов, переменных
- 🔍 **Навигация** — Переход к определению, поиск ссылок, символы документа/workspace, кликабельный CodeLens и иерархия входящих/исходящих вызовов
- 🏷️ **Inlay Hints** — Ненавязчивые подсказки типов из надёжных присваиваний, типизированных параметров и явных результатов однозначных вызовов, а также имён параметров
- 🐛 **Diagnostics** — Real-time parser and configurable semantic checks
- 🔧 **LSP сервер** — Полная поддержка Language Server Protocol
- 📋 **Подсказки параметров** — Типы параметров и явные возвращаемые типы индексированных вызовов
- 🎯 **Информация при наведении** — Типизированные сигнатуры и быстрая документация
- 🗂️ **Индексация проекта** — Быстрый поиск символов по всему проекту
- 🖨️ **Инструменты `$P`** — Подсветка print/debug строк, счетчик, переход next/previous, comment/uncomment/delete
- 🧭 **Совместимость с PDMS-командами** — Редактируемый whitelist стартовых слов PDMS-команд

### 🚀 Быстрый старт

#### Установка

**Вариант 1: Из GitHub Releases** (Рекомендуется)
1. Скачайте последний `pml-aveva-e3d-*.vsix` из [Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases)
2. В VSCode: `Расширения` → `...` → `Установить из VSIX`
3. Перезагрузите VSCode

**Вариант 2: Режим разработки**
```bash
git clone https://github.com/mikhalchankasm/vscode-pml-aveva-e3d.git
cd vscode-pml-aveva-e3d
npm install
npm run compile
# Нажмите F5 в VS Code для запуска Extension Development Host
```

#### Сборка VSIX пакета
```bash
npm run pack  # Создаёт pml-aveva-e3d-X.X.X.vsix
```

### 📁 Поддерживаемые типы файлов
`.pml` `.pmlobj` `.pmlfnc` `.pmlfrm` `.pmlmac` `.pmlcmd`

### 🖨️ Инструменты `$P`

Строки, которые начинаются с `$P` или `$p`, подсвечиваются как print/debug output. В редакторе доступен счетчик в status bar, hover-действия и команды для перехода к следующей/предыдущей print-строке, а также comment/uncomment/delete.

### 🧭 Whitelist PDMS-команд

Whitelist стартовых слов команд лежит здесь:

`packages/pml-language-server/src/data/pdmsCommands.ts`

Записи содержат первое слово команды, категорию и короткий hover-текст. Добавляйте только первое слово команды в lowercase, например `move`, `add`, `q`.

### ⚙️ Настройки диагностики

- `pml.diagnostics.formErrors`: управляет parser diagnostics для `.pmlfrm`, пока поддержка form DSL остается ограниченной.
  - `off` (по умолчанию): не показывать parser diagnostics для форм.
  - `warning`: показывать parser diagnostics для форм как предупреждения.
  - `error`: показывать parser diagnostics для форм как ошибки.
- `pml.diagnostics.formReferences`: опциональная проверка callback/gadget references для `.pmlfrm`.
  - `off` (по умолчанию): не проверять ссылки.
  - `warning`: предупреждать, если callback указывает на отсутствующий метод, `!this.<name>` ссылается на неизвестный member/gadget или объявленный member расходится с согласованными прямыми надёжными присваиваниями.
  - `error`: показывать такие замечания как ошибки.
  - Работает только когда форма парсится без parser errors, чтобы не создавать каскадный шум.
- `pml.codeLens.enabled`: показывать кликабельное количество ссылок над методами и глобальными функциями (по умолчанию: `true`).
- `pml.inlayHints.enabled`: общий переключатель type/parameter hints (по умолчанию: `true`).
- `pml.inlayHints.variableTypes`: выводить тип по первому надёжному присваиванию в области (по умолчанию: `true`).
- `pml.inlayHints.parameterNames`: показывать имена параметров для однозначных индексированных вызовов (по умолчанию: `true`).

### 📚 Документация

- [TROUBLESHOOTING.md](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/TROUBLESHOOTING.md) - Решение распространенных проблем
- [CHANGELOG.md](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/CHANGELOG.md) - История версий и обновлений
- [CONTRIBUTING.md](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/CONTRIBUTING.md) - Как внести вклад в проект
- [examples/](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/tree/main/examples) - Примеры PML кода для тестирования

### 🛠️ Разработка

**Структура проекта:**
```
vscode-pml-extension/
├── src/                          # Клиентская часть расширения
│   ├── extension.ts             # Точка входа
│   ├── languageClient.ts        # LSP клиент
│   └── ...
├── packages/pml-language-server/ # LSP сервер
│   └── src/
│       ├── server.ts            # Главный файл LSP сервера
│       ├── parser/              # Парсер PML
│       ├── providers/           # LSP провайдеры (автодополнение, подсказки и т.д.)
│       └── diagnostics/         # Обнаружение ошибок
├── syntaxes/                     # TextMate грамматика
├── objects/                      # База знаний типов PML
└── examples/                     # Тестовые файлы
```

**Команды:**
- `npm run compile` - Build the extension bundle
- `npm run compile:tsc` - Run TypeScript checks for the extension and language server
- `npm run watch` - Режим наблюдения (авто-компиляция)
- `npm run pack` - Сборка VSIX пакета
- `npm test` - Запуск тестов

### 🐛 Известные проблемы

- **Файлы форм** (.pmlfrm) имеют ограниченную поддержку парсера (намеренно - сложный DSL)
- **Find All References / Rename** теперь в первую очередь используют индексированные вызовы методов; текстовый поиск сохранён для callback-строк и динамических fallback-сценариев.
- **object ARRAY()** может показывать предупреждение "Expected expression" (ограничение парсера, не влияет на функциональность)

### 📝 Лицензия

MIT License - см. [LICENSE](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/LICENSE)

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/blob/main/CONTRIBUTING.md) for guidelines.

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions)

---

**Made with ❤️ for AVEVA E3D PML developers**

