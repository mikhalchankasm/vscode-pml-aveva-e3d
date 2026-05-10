# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.13

**Release Date:** 2026-05-10

**GitHub Release:** [v0.12.13](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.13)

### What Changed

- Applied follow-up fixes from the v0.12.12 Claude review, keeping the parts that improve the installed AVEVA corpus and rejecting over-strict suggestions that create false positives.
- Accept nameless form gadgets whose declaration starts directly with a modifier such as `pixmap`.
- Keep shipped `.pmlfrm` forms quiet when `setup form` ends at a following `define method` boundary.
- Preserve `.pmlfnc` command-style `ID/id` lines observed in the installed AVEVA PMLLIB corpus.
- Recognize menu bodies that begin with layout directives such as `path`, `vert`, `horz`, `vdist`, or `hdist`.
- Apply `is`-phrase validation consistently to chained assignments.
- Avoid duplicated parser messages such as `Expected Expected 'exit'...`.

### Validation

- Language server tests: 143 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.
- External AVEVA `.pmlcmd` corpus parse: 698 files, 0 errors.
- External AVEVA `.pmlfnc` corpus parse: 2869 files, 1611 errors.
- External AVEVA `.pmlfrm` corpus parse: 1206 files, 1412 errors.
- External AVEVA `.pmlobj` corpus parse: 1334 files, 2306 errors.

### Assets

- VSIX: `pml-aveva-e3d-0.12.13.vsix`
- SHA256: `ae981dda6f15572b4a20d8984711115a10a17174402171ca3f4ec9f7ef88770f`

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
