# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.10

**Release Date:** 2026-05-09

**GitHub Release:** [v0.12.10](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.10)

### What Changed

- Applied follow-up fixes from the v0.12.9 Claude review.
- Report `function !!name()` definitions that are missing `define` at the typo location.
- Mark parsed DBREF literals as `dbref` literals in the AST.
- Limit multiline `compose` continuation recovery to lines that actually follow a trailing `$`.
- Extend recovered `if`, `do`, and `handle` ranges to the boundary token when the closing keyword is missing.
- Added parser mode plumbing from document URI/file extension for future context-aware command parsing.

### Validation

- Language server tests: 137 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.
- External AVEVA `.pmlcmd` corpus parse: 698 files, 0 errors.
- External AVEVA `.pmlfnc` corpus parse: 2869 files, 1735 errors.
- External AVEVA `.pmlfrm` corpus parse: 1206 files, 3010 errors.
- External AVEVA `.pmlobj` corpus parse: 1334 files, 2694 errors.

### Assets

- VSIX: `pml-aveva-e3d-0.12.10.vsix`
- SHA256: `05d13a3faa1138b37e8ce79f71733a7d5d34fddfa7b2b11de4f493f9037debbf`

## Active Release Track

### v0.12.x - Form Parser Foundation

- `.pmlfrm` parser support is the active focus.
- Current coverage includes chained method calls, callback assignments, nested frames, form outline metadata, guarded callback/gadget reference diagnostics, PML attribute member access, dynamic substitute member access, import wrappers, additional form gadgets, command-controller syntax, and fixture/corpus smoke tests.
- Remaining parser work includes broader PML.NET form patterns, more PML1 command forms in `.pmlfrm`/`.pmlobj`/`.pmlfnc`, and deciding whether to repair or exclude intentionally broken fixture snippets.

### v0.11.x - Parser Hardening and Print Tools

- Added `$P` print/debug tools, PDMS command starter metadata, command hover, packaging cleanup, and parser compatibility fixes for real PML/PMLFNC files.
- This track is considered stable unless regressions are reported.

## Next Planned Work

1. Continue `v0.12.x` by mining the installed AVEVA PMLLIB corpus for high-frequency `.pmlfrm`, `.pmlobj`, and `.pmlfnc` parser gaps.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. After form parsing stabilizes, move references/rename toward AST/index-based lookup.

For full history, see [CHANGELOG.md](CHANGELOG.md).
