# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.30

**Release Date:** 2026-05-14

**GitHub Release:** [v0.12.30](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.30)

### What Changed

- Added parser support for integer path-style member suffixes such as `SREF.1` and `PLAT.2`.
- Restored member-method completion after numeric path suffixes such as `!path.SREF.1.`.
- Improved signature help overload selection and added coverage for zero-parameter method signatures.
- Hardened completion receiver tests for indexed, dynamic, chained, and numeric member access while keeping bare identifiers quiet.
- Kept VSIX packaging clean by excluding generated coverage reports.
- Reduced installed AVEVA corpus parser errors from 3386 to 3306.

### Validation

- Language server tests: 175 passed, 3 skipped by default; optional corpus snapshot passed with `AVEVA_PMLLIB_PATH`.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.
- External AVEVA `.pmlcmd` corpus parse: 698 files, 0 errors.
- External AVEVA `.pmlfnc` corpus parse: 2869 files, 1034 errors.
- External AVEVA `.pmlfrm` corpus parse: 1206 files, 841 errors.
- External AVEVA `.pmlmac` corpus parse: 3 errors.
- External AVEVA `.pmlobj` corpus parse: 1334 files, 1428 errors.

### Assets

- VSIX: `pml-aveva-e3d-0.12.30.vsix`
<!-- GitHub Actions replaces this placeholder with the CI-built VSIX checksum when publishing the release. -->
- SHA256: `computed by GitHub Actions`

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
