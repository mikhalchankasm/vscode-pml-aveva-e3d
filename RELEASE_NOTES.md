# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.12

**Release Date:** 2026-05-10

**GitHub Release:** [v0.12.12](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.12)

### What Changed

- Applied follow-up fixes from the v0.12.11 Claude review.
- Report malformed or unterminated form sub-blocks instead of silently swallowing them.
- Keep standalone `menu .name popup` declarations from consuming following gadgets.
- Restrict bare-identifier gadget names to underscore-prefixed AVEVA forms such as `_cancel`.
- Tighten PML1 `is` phrase recovery so ordinary assignment tails remain diagnostic.
- Require object constructors such as `object FORM()` to include the call parentheses.
- Restrict `id`, `gap`, and `calldrg` command starters outside known AVEVA parser modes.

### Validation

- Language server tests: 142 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.
- External AVEVA `.pmlcmd` corpus parse: 698 files, 0 errors.
- External AVEVA `.pmlfnc` corpus parse: 2869 files, 1611 errors.
- External AVEVA `.pmlfrm` corpus parse: 1206 files, 1414 errors.
- External AVEVA `.pmlobj` corpus parse: 1334 files, 2306 errors.

### Assets

- VSIX: `pml-aveva-e3d-0.12.12.vsix`
- SHA256: `af32888ae9e1dc5edee4ae2640b3a0664dfc02955800dda1f4dd3ecf308a6d39`

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
