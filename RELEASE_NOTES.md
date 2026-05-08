# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.6

**Release Date:** 2026-05-09

**GitHub Release:** [v0.12.6](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.6)

### What Changed

- Treated `exit` and `options` as AVEVA command-style lines inside methods while preserving form/frame `exit` handling.
- Parsed `define(...)` as a PML built-in call inside expressions.
- Parsed dynamic substitute member access such as `!this.$!<name>.EditableGrid(false)`.
- Recovered nested pipe text fragments with non-ASCII text inside call arguments.
- Reduced the `examples/test2form.pmlfrm` parser smoke baseline from 49 to 2 errors.

### Validation

- Language server tests: 124 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.

### Assets

- VSIX: `pml-aveva-e3d-0.12.6.vsix`
- SHA256: `237acb465dd4ae094a2a08bbc0edc30c1c6ea56d76f9e42ebe0a7b934cdd5908`

## Active Release Track

### v0.12.x - Form Parser Foundation

- `.pmlfrm` parser support is the active focus.
- Current coverage includes chained method calls, callback assignments, nested frames, form outline metadata, guarded callback/gadget reference diagnostics, PML attribute member access, dynamic substitute member access, import wrappers, additional form gadgets, and fixture smoke tests.
- Remaining parser work includes broader PML.NET form patterns, more PML1 command forms, and deciding whether to repair or exclude intentionally broken fixture snippets.

### v0.11.x - Parser Hardening and Print Tools

- Added `$P` print/debug tools, PDMS command starter metadata, command hover, packaging cleanup, and parser compatibility fixes for real PML/PMLFNC files.
- This track is considered stable unless regressions are reported.

## Next Planned Work

1. Continue `v0.12.x` by validating more external `.pmlfrm` samples and adding targeted parser support only for confirmed real syntax.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. After form parsing stabilizes, move references/rename toward AST/index-based lookup.

For full history, see [CHANGELOG.md](CHANGELOG.md).
