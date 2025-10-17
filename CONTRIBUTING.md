# Contributing to PML for AVEVA E3D Extension

Thank you for your interest in improving this extension! 🎉

## Getting Started

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mikhalchankasm/vscode-pml-aveva-e3d.git
   cd vscode-pml-aveva-e3d
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Open in VS Code:**
   ```bash
   code .
   ```

4. **Run Extension Development Host:**
   - Press `F5` or Run → Start Debugging
   - A new VS Code window will open with the extension active

5. **Test your changes:**
   - Open files from `examples/*.pml`
   - Test the functionality
   - Press `Ctrl+R` in Extension Development Host to reload after code changes

### Local Build and Installation

See [`scripts/LOCAL_DEV.md`](scripts/LOCAL_DEV.md):

```bash
npm run pack:install         # Build and install
npm run install:local        # Reinstall latest build
```

## Code Style

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Code Actions for quick commands
fix: fix elseif block indentation
docs: update README with examples
chore: update dependencies
```

**Types:**
- `feat:` - new feature
- `fix:` - bug fix
- `docs:` - documentation changes
- `style:` - code formatting (no logic changes)
- `refactor:` - refactoring without functionality changes
- `test:` - adding tests
- `chore:` - build/CI/dependencies changes

### Branches

- `main` - stable branch
- `feature/name` - new features
- `fix/name` - bug fixes
- `docs/name` - documentation

### Code Style

- **TypeScript:** strict mode, ESLint rules
- **Indentation:** 4 spaces (see `.editorconfig`)
- **Naming:** camelCase for variables/functions, PascalCase for classes
- **Comments:** English preferred, JSDoc for public methods

## What Can Be Improved

### 🟢 Easy Tasks (good first issue)

- Add snippets for new PML constructs
- Improve hover documentation for built-in functions
- Add examples to `examples/`
- Translate documentation
- Fix typos in README

### 🟡 Medium Tasks

- Add new Code Actions commands
- Improve type inference for variables
- Add forms and callbacks validation
- Extend diagnostics (check duplicate methods)

### 🔴 Hard Tasks

- Implement Tree-sitter parser for PML
- Create Language Server Protocol (LSP)
- Add AVEVA E3D integration
- Debugger adapter

See full list in [`docs/TODO.md`](docs/TODO.md) and [`docs/BACKLOG_STATUS.md`](docs/BACKLOG_STATUS.md).

## Pull Requests

1. Create a branch from `main`
2. Make your changes
3. Add tests (if applicable)
4. Update `docs/CHANGELOG.md` in the `[Unreleased]` section
5. Create a PR with description:
   - What was changed
   - Why (link to issue)
   - How to test
   - Screenshots/GIF (for UI changes)

### PR Checklist

- [ ] Code compiles without errors (`npm run compile`)
- [ ] Tested in Extension Development Host (F5)
- [ ] CHANGELOG.md updated
- [ ] Documentation added/updated (if needed)
- [ ] Commits follow Conventional Commits
- [ ] PR description is clear and complete

## Project Structure

```
src/
  codeActions.ts      - Code Actions Provider (лампочка)
  completion.ts       - Автодополнение
  diagnostics.ts      - Диагностика ошибок
  formatter.ts        - Форматирование кода
  hover.ts            - Hover документация
  symbols.ts          - Document Symbols (Outline)
  definition.ts       - Go to Definition
  references.ts       - Find References
  rename.ts           - Rename Symbol
  signature.ts        - Signature Help
  tools.ts            - PML Tools команды
  pmlTypes.ts         - Определения типов PML

syntaxes/
  pml.tmLanguage.json - TextMate grammar

snippets/
  pml.json            - Code snippets

examples/              - PML code examples
docs/                 - Documentation
.github/workflows/    - CI/CD
```

## Adding New Grammar

Edit `syntaxes/pml.tmLanguage.json`:

1. Find the relevant section (keywords/functions/operators)
2. Add your pattern
3. Test on `examples/*.pml`
4. Create a PR with description of what was added

## Questions and Help

- 💬 GitHub Discussions (coming soon)
- 🐛 Issues for bugs and feature requests
- 📧 Email: [add email]
- 💬 Telegram: [add link]

## Code of Conduct

Be respectful to other contributors. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

Thank you for contributing to the project! 🚀

