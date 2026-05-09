# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.9

**Release Date:** 2026-05-09

**GitHub Release:** [v0.12.9](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.9)

### What Changed

- Improved parser recovery at method-definition boundaries for unterminated `if`, `do`, and `handle` blocks.
- Parsed PML DBREF literals such as `=0/0`.
- Consumed multiline `var ... compose ...` statements with `$` continuations and alignment fragments.
- Expanded command-style support for object-file PML1 lines such as toolbar declarations and drawing/model commands.
- Reduced installed AVEVA `.pmlobj` parser errors from 11007 to 2694 across 1334 files.
- The same changes reduced installed `.pmlfnc` parser errors from 2852 to 1735 and `.pmlfrm` parser errors from 10980 to 3010.

### Validation

- Language server tests: 133 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.
- External AVEVA `.pmlcmd` corpus parse: 698 files, 0 errors.
- External AVEVA `.pmlobj` corpus parse: 1334 files, 2694 errors.

### Assets

- VSIX: `pml-aveva-e3d-0.12.9.vsix`
- SHA256: `7537cf2c4aa5268ae75caddbdc28e8f79018de967d5b630f189fd61b143539d8`

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
