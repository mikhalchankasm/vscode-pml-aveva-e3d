# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.14

**Release Date:** 2026-05-10

**GitHub Release:** [v0.12.14](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.14)

### What Changed

- Applied follow-up fixes from the v0.12.13 Claude review.
- Detect menu bodies structurally instead of relying on the first body-line keyword allowlist.
- Keep unknown menu-body lines inside the menu block so they are diagnosed consistently.
- Treat `list` and `view` identifier gadgets after a menu as form-body boundaries.
- Consume multiline string tokens as one logical line during menu/body recovery.
- Keep `!this.menu.add(...)` style method-call lines quiet inside form sub-block recovery.
- Make parser error-prefix suppression case-insensitive.

### Validation

- Language server tests: 145 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.
- External AVEVA `.pmlcmd` corpus parse: 698 files, 0 errors.
- External AVEVA `.pmlfnc` corpus parse: 2869 files, 1611 errors.
- External AVEVA `.pmlfrm` corpus parse: 1206 files, 1412 errors.
- External AVEVA `.pmlobj` corpus parse: 1334 files, 2306 errors.

### Assets

- VSIX: `pml-aveva-e3d-0.12.14.vsix`
- SHA256: `42176ab84a42619c47d8e888359b8aea6f7426a9cefb6e6010b512a98182f93a`

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
