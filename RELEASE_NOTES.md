# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.3

**Release Date:** 2026-05-08

**GitHub Release:** [v0.12.3](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.3)

### What Changed

- Added nested `.pmlfrm` outline symbols for forms, frames, and gadgets.
- Preserved nested `frame ... exit` hierarchy in the parser AST.
- Indexed top-level form gadgets and nested frame gadgets for document symbol generation.
- Added regression coverage for `form -> frame -> nested frame/gadget` document symbols.

### Validation

- Language server tests: 117 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.

### Assets

- VSIX: `pml-aveva-e3d-0.12.3.vsix`
- SHA256: `f002ea0d843e7a72eccf5bba348fde24ac3ff0a62b0bd65e761154d5c2c9cde9`

## Active Release Track

### v0.12.x - Form Parser Foundation

- `.pmlfrm` parser support is the active focus.
- Current coverage includes chained method calls, callback assignments, nested frames, form outline metadata, import wrappers, additional form gadgets, fixture smoke tests, and guarded form diagnostics.
- Remaining parser work includes attribute expressions, variable substitution in argument lists, callback/gadget reference validation, and broader PML.NET form patterns.

### v0.11.x - Parser Hardening and Print Tools

- Added `$P` print/debug tools, PDMS command starter metadata, command hover, packaging cleanup, and parser compatibility fixes for real PML/PMLFNC files.
- This track is considered stable unless regressions are reported.

## Next Planned Work

1. Continue `v0.12.x` with form callback/gadget reference validation.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. After form parsing stabilizes, move references/rename toward AST/index-based lookup.

For full history, see [CHANGELOG.md](CHANGELOG.md).
