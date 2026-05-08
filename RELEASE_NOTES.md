# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.4

**Release Date:** 2026-05-09

**GitHub Release:** [v0.12.4](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.4)

### What Changed

- Added opt-in `.pmlfrm` callback and gadget reference diagnostics via `pml.diagnostics.formReferences`.
- Report missing callback methods referenced from form callback assignments and gadget `call` modifiers.
- Report unknown `!this.<name>` references in form methods when the name is not a known method, member, frame, or gadget.
- Kept the new validation disabled by default and gated behind zero parser errors to avoid cascade noise.

### Validation

- Language server tests: 119 passed, 2 skipped.
- TypeScript compile: passed.
- Root lint and language-server lint: passed.
- Bundled compile: passed.
- VSIX packaging and local VS Code/Cursor install: passed.

### Assets

- VSIX: `pml-aveva-e3d-0.12.4.vsix`
- SHA256: `2aff7e16b6b788a19a04671859613e8739f6049c0fbccb545cbf1ee92137702a`

## Active Release Track

### v0.12.x - Form Parser Foundation

- `.pmlfrm` parser support is the active focus.
- Current coverage includes chained method calls, callback assignments, nested frames, form outline metadata, guarded callback/gadget reference diagnostics, import wrappers, additional form gadgets, and fixture smoke tests.
- Remaining parser work includes attribute expressions, variable substitution in argument lists, broader PML.NET form patterns, and reducing parser gaps in larger imported forms.

### v0.11.x - Parser Hardening and Print Tools

- Added `$P` print/debug tools, PDMS command starter metadata, command hover, packaging cleanup, and parser compatibility fixes for real PML/PMLFNC files.
- This track is considered stable unless regressions are reported.

## Next Planned Work

1. Continue `v0.12.x` by reducing remaining parser gaps in large imported forms such as `test2form.pmlfrm`.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. After form parsing stabilizes, move references/rename toward AST/index-based lookup.

For full history, see [CHANGELOG.md](CHANGELOG.md).
