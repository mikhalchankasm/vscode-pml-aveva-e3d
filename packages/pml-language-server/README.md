# PML Language Server

Language Server Protocol (LSP) implementation for PML (Programmable Macro Language) - AVEVA E3D.

## Overview

This is the core language server that powers IntelliSense features for the PML VSCode extension. It provides:

- **AST-based parsing** of PML code
- **Type inference** for variables and expressions
- **Workspace indexing** for cross-file navigation
- **Semantic analysis** for diagnostics and code intelligence

## Architecture

```
┌─────────────────────────────────────┐
│   VSCode Extension (Client)         │
│   - UI Commands                     │
│   - Language Client                 │
└─────────────┬───────────────────────┘
              │ LSP Protocol
              ▼
┌─────────────────────────────────────┐
│   PML Language Server               │
│                                     │
│   ┌──────────────────────────────┐  │
│   │  Parser                      │  │
│   │  - Lexer                     │  │
│   │  - AST Builder               │  │
│   └──────────────────────────────┘  │
│                                     │
│   ┌──────────────────────────────┐  │
│   │  Type System                 │  │
│   │  - Type Inference            │  │
│   │  - Type Checker              │  │
│   └──────────────────────────────┘  │
│                                     │
│   ┌──────────────────────────────┐  │
│   │  Workspace Index             │  │
│   │  - Symbol Index              │  │
│   │  - File Indexer              │  │
│   │  - Cache Manager             │  │
│   └──────────────────────────────┘  │
│                                     │
│   ┌──────────────────────────────┐  │
│   │  LSP Providers               │  │
│   │  - Completion                │  │
│   │  - Hover                     │  │
│   │  - Definition                │  │
│   │  - References                │  │
│   │  - Diagnostics               │  │
│   │  - ... and more              │  │
│   └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Development Status

🚧 **Alpha - Under Active Development**

### ✅ Completed
- Basic server structure
- LSP protocol setup
- AST node definitions
- Basic diagnostics (block matching)

### 🚧 In Progress (Phase 1)
- [ ] PML Parser implementation
- [ ] Workspace indexing
- [ ] Type inference engine
- [ ] Migration of existing providers to LSP

### 📋 Planned (Phase 2+)
- [ ] Semantic highlighting
- [ ] Inlay hints
- [ ] Call hierarchy
- [ ] Code lens
- [ ] Advanced refactoring

## Building

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run tests
npm test
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

## Project Structure

```
src/
├── server.ts                 # Main LSP server entry point
├── ast/
│   ├── nodes.ts             # AST node definitions
│   └── visitor.ts           # AST visitor pattern (TODO)
├── parser/
│   ├── lexer.ts             # Tokenizer (TODO)
│   ├── parser.ts            # PML parser (TODO)
│   └── __tests__/           # Parser tests
├── types/
│   ├── typeSystem.ts        # Type definitions (TODO)
│   ├── typeInference.ts     # Type inference engine (TODO)
│   └── builtinTypes.json    # Built-in PML types (TODO)
├── index/
│   ├── symbolIndex.ts       # Workspace symbol index (TODO)
│   ├── fileIndexer.ts       # File indexing (TODO)
│   └── backgroundIndexer.ts # Background indexing (TODO)
├── providers/
│   ├── completion.ts        # Completion provider (TODO)
│   ├── hover.ts             # Hover provider (TODO)
│   ├── definition.ts        # Go-to-definition (TODO)
│   └── ...                  # Other providers (TODO)
├── diagnostics/
│   ├── typeChecker.ts       # Type checking (TODO)
│   └── pmlRules.ts          # PML-specific rules (TODO)
└── cache/
    └── astCache.ts          # AST caching (TODO)
```

## LSP Features

### Implemented
- ✅ Basic diagnostics (block matching)
- ✅ Simple completion (keywords)
- ✅ Basic hover

### Coming Soon
- 🚧 Type-aware completion
- 🚧 Cross-file navigation
- 🚧 Type inference
- 🚧 Semantic diagnostics

## Contributing

See [DEVELOPMENT.md](../../docs/DEVELOPMENT.md) for development guidelines.

## License

MIT - See [LICENSE](../../LICENSE)

---

**Part of**: [PML for AVEVA E3D](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d)
