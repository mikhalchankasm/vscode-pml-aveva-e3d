# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.2

**Release Date:** 2026-05-08

**GitHub Release:** [v0.12.2](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.2)

### What Changed

- Parsed additional real form gadgets: `container`, `menu popup`, `para`, and `paragraph`.
- Recovered cleanly from draft member-access lines ending after a dot, such as `!k.`.
- Accepted angle-bracket substitution expressions such as `$!<this.name>`.
- Extended `.pmlfrm` smoke coverage to hidden real-world fixtures; `traExampleButtons.pmlfrm` and `equibasic.pmlfrm` now parse with zero errors.

### Validation

- Language server tests: 116 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.

### Assets

- VSIX: `pml-aveva-e3d-0.12.2.vsix`
- SHA256: `2b7296abdbc75dec36f4152ad91cc94a734cfcb5f193008fb9cf1c5da39c96fe`

## Active Release Track

### v0.12.x - Form Parser Foundation

- `.pmlfrm` parser support is the active focus.
- Current coverage includes chained method calls, callback assignments, nested frames, import wrappers, additional form gadgets, fixture smoke tests, and guarded form diagnostics.
- Remaining parser work includes attribute expressions, variable substitution in argument lists, richer form outline metadata, and broader PML.NET form patterns.

### v0.11.x - Parser Hardening and Print Tools

- Added `$P` print/debug tools, PDMS command starter metadata, command hover, packaging cleanup, and parser compatibility fixes for real PML/PMLFNC files.
- This track is considered stable unless regressions are reported.

## Next Planned Work

1. Continue `v0.12.x` with richer form outline metadata and nested frame/gadget symbol reporting.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. After form parsing stabilizes, move references/rename toward AST/index-based lookup.

For full history, see [CHANGELOG.md](CHANGELOG.md).
