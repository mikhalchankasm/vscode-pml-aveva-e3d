# PML for AVEVA E3D — VS Code Extension

Language support for AVEVA E3D PML (Programmable Macro Language) in Visual Studio Code.

## Features

- Syntax highlighting (TextMate grammar)
- Language configuration (comments, brackets, on-enter indent rules)
- Document formatter (indent, empty lines, method/form/frame block layout, assignment alignment)
- IntelliSense: completions (keywords, types, attributes, methods), signature help
- Hover documentation (JSDoc-style comments above methods)
- Outline (Document Symbols): methods, objects, forms, frames
- Diagnostics: unclosed blocks, basic checks
- Tools (Command Palette): sort lines, trim whitespace, remove duplicates, extract variables/methods
- Go to Definition / Find References / Rename (methods)

## Installation

1) From VSIX (local build):
   - `npm install`
   - `npm run compile`
   - Package: `npx vsce package`
   - Install: `code --install-extension pml-aveva-e3d-*.vsix`

2) From source (debug):
   - Open folder in VS Code, press `F5` to launch Extension Development Host

## File Types

- `.pml`, `.pmlobj`, `.pmlfnc`, `.pmlfrm`, `.pmlmac`, `.pmlcmd`

## Snippets

- Common control flow (if/then/else, loops)
- Form/frame UI scaffolding
- Variable declarations and helpers

## Formatter Settings (`settings.json`)

- `pml.formatter.indentSize` (number, default 4)
- `pml.formatter.removeMultipleEmptyLines` (boolean)
- `pml.formatter.formatMethodBlocks` (boolean)
- `pml.formatter.formatFormBlocks` (boolean)
- `pml.formatter.alignAssignments` (boolean)
- `pml.formatter.fixIndentation` (boolean)

## JSDoc-style Documentation

- Place `--` comments above `define method .name()`
- Supported tags: `@param`, `@return`, `@example`, `@deprecated`, `@author`, `@since`, `@see`, `@form`, `@callback`

## Commands (Command Palette)

- PML: Format PML Document
- PML Tools: Sort Lines A-Z / Z-A / by Length / Smart Natural Sort
- PML Tools: Remove Duplicates / Consecutive Duplicates / Empty Lines / Whitespace-only Lines / Trim Trailing Whitespace / Tabs ↔ Spaces
- PML Tools: Extract Variables / Extract Methods / Remove Comments
- Show STRING/REAL/ARRAY/DBREF methods, Show All Methods

## Development

- Lint: `npm run lint`
- Build: `npm run compile`
- CI: GitHub Actions (lint + build on push/PR)
- Release: push a tag `v*` (e.g., `v0.4.1`) to create GitHub Release with VSIX artifact

## Docs

- See `docs/README.md` for the full index.

## Requirements

- Visual Studio Code 1.80.0+

## Extension Settings

- pml.formatter.indentSize
- pml.formatter.removeMultipleEmptyLines
- pml.formatter.formatMethodBlocks
- pml.formatter.formatFormBlocks
- pml.formatter.alignAssignments
- pml.formatter.fixIndentation
- pml.trace

## Known Issues

- Language features are heuristic for complex PML; please report false positives.

## Release Notes

See docs/CHANGELOG.md (and GitHub Releases).

## License

MIT (see LICENSE).

