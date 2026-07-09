# PML Language Server

Language Server Protocol (LSP) implementation for PML (Programmable Macro Language) - AVEVA E3D.

## Overview

This is the core language server that powers IntelliSense features for the PML VSCode extension. It provides:

- **AST-based parsing** of PML code with full PML1/PML2 support
- **Type inference** for variables, methods, and expressions
- **Workspace indexing** for fast cross-file navigation
- **Semantic analysis** for diagnostics, typo detection, and code intelligence
- **Real-time diagnostics** for syntax errors, unclosed blocks, array indexing issues

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
│   │  - Lexer (Token Scanner)     │  │
│   │  - Recursive Descent Parser  │  │
│   │  - AST Builder               │  │
│   └──────────────────────────────┘  │
│                                     │
│   ┌──────────────────────────────┐  │
│   │  Type System                 │  │
│   │  - Type Inference            │  │
│   │  - Built-in Types (STRING,   │  │
│   │    REAL, ARRAY, DBREF, etc.) │  │
│   └──────────────────────────────┘  │
│                                     │
│   ┌──────────────────────────────┐  │
│   │  Workspace Index             │  │
│   │  - Symbol Index (methods,    │  │
│   │    objects, forms)           │  │
│   │  - File Indexer              │  │
│   │  - Incremental Updates       │  │
│   └──────────────────────────────┘  │
│                                     │
│   ┌──────────────────────────────┐  │
│   │  LSP Providers               │  │
│   │  - Completion (context-aware)│  │
│   │  - Hover (documentation)     │  │
│   │  - Definition & References   │  │
│   │  - Document Symbols          │  │
│   │  - Diagnostics               │  │
│   │  - Signature Help            │  │
│   └──────────────────────────────┘  │
│                                     │
│   ┌──────────────────────────────┐  │
│   │  Analysis Tools              │  │
│   │  - Typo Detection            │  │
│   │  - Array Index Checker       │  │
│   │  - Block Matcher             │  │
│   └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Features

### ✅ Fully Implemented

#### Parser & AST
- ✅ Full PML1/PML2 lexer with keyword recognition
- ✅ Recursive descent parser for all PML constructs
- ✅ AST generation for expressions, statements, blocks
- ✅ Form file (.pmlfrm) parsing support
- ✅ Error recovery and partial parsing

#### Workspace Indexing
- ✅ Symbol indexing (methods, objects, forms)
- ✅ Cross-file navigation
- ✅ Incremental index updates
- ✅ Configurable exclusion patterns

#### LSP Providers
- ✅ **Completion**: Context-aware autocomplete for keywords, methods, variables
- ✅ **Hover**: Documentation on hover with type information
- ✅ **Definition**: Go-to-definition for methods and variables
- ✅ **References**: Find all references (workspace-wide)
- ✅ **Document Symbols**: Outline view for methods and objects
- ✅ **Signature Help**: Parameter hints for method calls
- ✅ **Diagnostics**: Real-time error checking

#### Diagnostics & Analysis
- ✅ Syntax error detection
- ✅ Unclosed block detection (IF/DO/OBJECT)
- ✅ Typo detection with Levenshtein distance
- ✅ Array index validation (0-based indexing warnings)
- ✅ Configurable diagnostic severity

### 🚧 In Progress
- 🚧 Enhanced type inference for complex expressions
- 🚧 Improved form file parsing (DSL limitations)
- 🚧 Better error messages with quick fixes

### 📋 Planned (Future)
- 📋 Semantic highlighting
- 📋 Inlay hints (type annotations)
- 📋 Call hierarchy
- 📋 Code lens (references count)
- 📋 Advanced refactoring (extract method, rename)

## Building

```bash
# Install dependencies
npm install

# Compile TypeScript for the language server package
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

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test arrayIndexChecker.test
```

## Project Structure

```
src/
├── server.ts                  # Main LSP server entry point
├── parser/
│   ├── lexer.ts              # Tokenizer with PML keywords
│   ├── parser.ts             # Recursive descent parser
│   └── __tests__/            # Parser tests
├── ast/
│   └── nodes.ts              # AST node definitions
├── types/
│   ├── types.ts              # Type system definitions
│   └── builtinTypes.ts       # Built-in PML types
├── index/
│   ├── symbolIndex.ts        # Symbol index storage
│   └── workspaceIndexer.ts   # Workspace file indexing
├── providers/
│   ├── completionProvider.ts       # Autocomplete
│   ├── hoverProvider.ts            # Hover documentation
│   ├── definitionProvider.ts       # Go-to-definition
│   ├── referencesProvider.ts       # Find references
│   ├── documentSymbolProvider.ts   # Outline view
│   └── signatureHelpProvider.ts    # Parameter hints
├── analysis/
│   ├── typoDetection.ts      # Keyword typo detection
│   └── arrayIndexChecker.ts  # Array index validation
└── utils/
    └── textUtils.ts          # Text manipulation utilities
```

## Configuration

LSP server respects these VS Code settings:

```json
{
  "pml.diagnostics.typoDetection": "error",  // "off" | "warning" | "error"
  "pml.diagnostics.arrayIndexZero": true,     // Warn on arr[0]
  "pml.indexing.exclude": [                   // Exclude from indexing
    "**/node_modules/**",
    "**/out/**"
  ]
}
```

## Performance

- **Startup**: < 500ms for typical projects
- **Indexing**: ~100-200 files/second
- **Completion**: < 50ms response time
- **Memory**: ~50-100MB for medium projects (500-1000 files)

## Known Limitations

1. **Form Files** (.pmlfrm): Complex DSL with limited parser support - some syntax may show false warnings
2. **Dynamic method calls**: `this.$m(varName)()` - cannot infer type without runtime information
3. **ARRAY() objects**: Syntax like `object ARRAY()` may show parser warnings (safe to ignore)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT - See [LICENSE](../../LICENSE.txt)

---

**Part of**: [PML for AVEVA E3D](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d)
