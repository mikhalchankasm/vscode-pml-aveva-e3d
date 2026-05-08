# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.5

**Release Date:** 2026-05-09

**GitHub Release:** [v0.12.5](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.5)

### What Changed

- Parsed PML attribute member access such as `!pipeRef.:IsoDrNo` and `!j.DbRef().:IsoDrNo = ||`.
- Parsed `inset (...)` comparisons and `do !plot to $!isoCount` loops.
- Kept pipe-string substitution fragments inside call arguments, including `|matchwild(:IsoDrNo, |$!fileName|)|`.
- Added `claim` to the PDMS command starter metadata.
- Reduced the `examples/test2form.pmlfrm` parser smoke baseline from 85 to 49 errors.

### Validation

- Language server tests: 122 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.

### Assets

- VSIX: `pml-aveva-e3d-0.12.5.vsix`
- SHA256: `66146da4f0437b6c4ea36a53357e482905063d2d555b0276cb9e4c2a4837f8f2`

## Active Release Track

### v0.12.x - Form Parser Foundation

- `.pmlfrm` parser support is the active focus.
- Current coverage includes chained method calls, callback assignments, nested frames, form outline metadata, guarded callback/gadget reference diagnostics, PML attribute member access, import wrappers, additional form gadgets, and fixture smoke tests.
- Remaining parser work includes broader PML.NET form patterns, more PML1 command forms, and reducing parser gaps in larger imported forms.

### v0.11.x - Parser Hardening and Print Tools

- Added `$P` print/debug tools, PDMS command starter metadata, command hover, packaging cleanup, and parser compatibility fixes for real PML/PMLFNC files.
- This track is considered stable unless regressions are reported.

## Next Planned Work

1. Continue `v0.12.x` by targeting the next `test2form.pmlfrm` cascades around method/block recovery.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. After form parsing stabilizes, move references/rename toward AST/index-based lookup.

For full history, see [CHANGELOG.md](CHANGELOG.md).
