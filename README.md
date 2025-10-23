# PML for AVEVA E3D — VS Code Extension

[![Version](https://img.shields.io/badge/version-0.6.0-blue.svg)](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> Full-featured Language Server Protocol (LSP) extension for **AVEVA E3D PML** (Programmable Macro Language) in Visual Studio Code.

**Languages:** [English](#english) • [Русский](#русский)

---

## English

### ✨ Features

- 🎨 **Syntax Highlighting** — Full PML1/PML2 syntax support
- 📝 **IntelliSense** — Smart autocomplete for keywords, methods, variables
- 🔍 **Navigation** — Go to Definition, Find References, Document Symbols
- 🐛 **Diagnostics** — Real-time error detection (unclosed blocks, typos)
- 🔧 **LSP Server** — Full Language Server Protocol support
- 📋 **Signature Help** — Parameter hints for method calls
- 🎯 **Hover Information** — Quick documentation on hover
- 🗂️ **Workspace Indexing** — Fast symbol search across project

### 🚀 Quick Start

#### Installation

**Option 1: From GitHub Releases** (Recommended)
1. Download `pml-aveva-e3d-0.6.0.vsix` from [Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases)
2. In VSCode: `Extensions` → `...` → `Install from VSIX`
3. Reload VSCode

**Option 2: Development Mode**
```bash
git clone https://github.com/mikhalchankasm/vscode-pml-aveva-e3d.git
cd vscode-pml-aveva-e3d
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

#### Build VSIX Package
```bash
npm run pack  # Creates pml-aveva-e3d-X.X.X.vsix
```

### 📁 Supported File Types
`.pml` `.pmlobj` `.pmlfnc` `.pmlfrm` `.pmlmac` `.pmlcmd`

### 📚 Documentation

- [CHANGELOG.md](CHANGELOG.md) - Version history and updates
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute to the project
- [examples/](examples/) - PML code examples for testing

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
- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode (auto-compile)
- `npm run pack` - Build VSIX package
- `npm test` - Run tests

### 🐛 Known Issues

- **Form files** (.pmlfrm) have limited parser support (intentional - complex DSL)
- **Find All References** currently shows definitions instead of actual call sites (limitation of current implementation)
- **object ARRAY()** syntax may show "Expected expression" warning (parser limitation, does not affect functionality)

### 📝 License

MIT License - see [LICENSE](LICENSE)

---

## Русский

### ✨ Возможности

- 🎨 **Подсветка синтаксиса** — Полная поддержка PML1/PML2
- 📝 **IntelliSense** — Умные подсказки для ключевых слов, методов, переменных
- 🔍 **Навигация** — Переход к определению, поиск ссылок, символы документа
- 🐛 **Диагностика** — Проверка ошибок в реальном времени (незакрытые блоки, опечатки)
- 🔧 **LSP сервер** — Полная поддержка Language Server Protocol
- 📋 **Подсказки параметров** — Помощь при вызове методов
- 🎯 **Информация при наведении** — Быстрая документация
- 🗂️ **Индексация проекта** — Быстрый поиск символов по всему проекту

### 🚀 Быстрый старт

#### Установка

**Вариант 1: Из GitHub Releases** (Рекомендуется)
1. Скачайте `pml-aveva-e3d-0.6.0.vsix` из [Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases)
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

### 📚 Документация

- [CHANGELOG.md](CHANGELOG.md) - История версий и обновлений
- [CONTRIBUTING.md](CONTRIBUTING.md) - Как внести вклад в проект
- [examples/](examples/) - Примеры PML кода для тестирования

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
- `npm run compile` - Компиляция TypeScript
- `npm run watch` - Режим наблюдения (авто-компиляция)
- `npm run pack` - Сборка VSIX пакета
- `npm test` - Запуск тестов

### 🐛 Известные проблемы

- **Файлы форм** (.pmlfrm) имеют ограниченную поддержку парсера (намеренно - сложный DSL)
- **Find All References** показывает определения вместо реальных вызовов (ограничение текущей реализации)
- **object ARRAY()** может показывать предупреждение "Expected expression" (ограничение парсера, не влияет на функциональность)

### 📝 Лицензия

MIT License - см. [LICENSE](LICENSE)

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions)

---

**Made with ❤️ for AVEVA E3D PML developers**
