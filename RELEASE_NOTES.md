# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.8

**Release Date:** 2026-05-09

**GitHub Release:** [v0.12.8](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.8)

### What Changed

- Applied follow-up review fixes after the v0.12.7 command-controller release.
- Report malformed `setup command` controllers instead of silently swallowing the file.
- Narrowed `$T<n>` trace handling and guarded command-line whitelist consumption around assignment-looking lines.
- Added hover support for dollar-prefixed PDMS starters such as `$M`.
- Parsed `define function ... ) is TYPE`, `FORM` return types, wildcard paths such as `/*MDS/CATA`, and PML1 argument phrases such as `u wrt /*`.
- Rechecked `v0.12.6 -> v0.12.8` against the installed AVEVA PMLLIB `.pmlfnc` corpus: zero regressions, with total `.pmlfnc` parser errors reduced from 7707 to 2852.

### Validation

- Language server tests: 132 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.
- External AVEVA `.pmlcmd` corpus parse: 698 files, 0 errors.
- External AVEVA `.pmlfnc` regression check vs v0.12.6: 0 regressions.

### Assets

- VSIX: `pml-aveva-e3d-0.12.8.vsix`
- SHA256: `91be926342a1e1c9f1501e387c0251aad1919e14ee55e49b66649257a98d86a7`

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
