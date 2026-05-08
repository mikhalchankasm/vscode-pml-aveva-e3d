# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.1

**Release Date:** 2026-05-08

**GitHub Release:** [v0.12.1](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.1)

### What Changed

- Removed accidental JavaScript from `examples/ceposition.pmlfrm`; the file is now a zero-error form parser smoke fixture.
- Tightened form callback extraction so unrelated names such as `recall` and `callRegistry` are not treated as callbacks.
- Added `.pmlfrm` fixture smoke tests for `examples/*.pmlfrm` with non-regression baselines.
- Updated `VERSIONING.md` so the `0.12.0` milestone matches the shipped form parser foundation.

### Validation

- Language server tests: 110 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.

### Assets

- VSIX: `pml-aveva-e3d-0.12.1.vsix`
- SHA256: available in the GitHub release assets.

## Active Release Track

### v0.12.x - Form Parser Foundation

- `.pmlfrm` parser support is the active focus.
- Current coverage includes chained method calls, callback assignments, nested frames, import wrappers, fixture smoke tests, and guarded form diagnostics.
- Remaining parser work includes container/menu syntax, better incomplete-line recovery, attribute expressions, variable substitution in argument lists, and richer form outline metadata.

### v0.11.x - Parser Hardening and Print Tools

- Added `$P` print/debug tools, PDMS command starter metadata, command hover, packaging cleanup, and parser compatibility fixes for real PML/PMLFNC files.
- This track is considered stable unless regressions are reported.

## Next Planned Work

1. Continue `v0.12.x` with form edge cases: `container`, `menu`, safer recovery for incomplete lines such as `!k.`, and more real fixtures.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. After form parsing stabilizes, move references/rename toward AST/index-based lookup.

For full history, see [CHANGELOG.md](CHANGELOG.md).
