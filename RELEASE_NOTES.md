# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.7

**Release Date:** 2026-05-09

**GitHub Release:** [v0.12.7](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.7)

### What Changed

- Parsed installed AVEVA `.pmlcmd` command controllers, including `setup command ...` files.
- Accepted command-controller idioms: `do !index indices !collection`, indexed property assignments, chained no-argument member calls, `$T8+`/`$T8-`, `/*` wildcard path arguments, line-continuation `$`, and chained `elsehandle` clauses.
- Expanded the PDMS command starter whitelist with additional real command-style starters from the installed AVEVA PMLLIB corpus.
- Reduced parser errors across 698 installed `.pmlcmd` files from 1200 to 0.
- Kept AVEVA PMLLIB as an external validation corpus only; no proprietary AVEVA files are copied into the repository.

### Validation

- Language server tests: 127 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.
- External AVEVA `.pmlcmd` corpus parse: 698 files, 0 errors.

### Assets

- VSIX: `pml-aveva-e3d-0.12.7.vsix`
- SHA256: `d5df3fad03817b4c80b6fac312242bd914afd8e3263234fd0cd4744ac61703c0`

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
