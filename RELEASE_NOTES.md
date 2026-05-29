# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.33

**Release Date:** 2026-05-19

**GitHub Release:** [v0.12.33](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.33)

### What Changed

- Restored `$P` print navigation commands by explicitly activating print actions and accepting supported PML file extensions even when language activation is still settling.
- Added direct Command Palette entries for `$P` print actions, scoped to supported PML file extensions.
- Reduced false-positive `[0]` array-index diagnostics for likely C#/.NET/PMLNET zero-based collections such as `NET...` form members, `PMLNETCONTROL` gadgets, and .NET-style collection variables.
- Kept ordinary PML arrays 1-based: cases such as `!arr[0]` and `member .items is ARRAY` still report the diagnostic.
- Added method declaration hover usage previews so `define method .name(...)` shows the first matching references with clickable file/line links.
- Added Common Commands starter coverage for `PARAGON`, `SPECONMODE`, and `FINISH`, including parser acceptance and line-start hover help.
- Refined method usage preview truncation for longer PML lines and avoided redundant Outline re-indexing when the current document version is already indexed.
- Added compact hover help for the built-in `!!CE` DBREF current-element variable.
- Simplified user-method hover layout so declaration hovers focus on `USAGES`, while call-site hovers show a clickable `DEFINED` link back to the method declaration.
- Added low-noise `ELEMENTTYPE` metadata method completions and hover docs for distinct methods such as `isudet`, `systemtype`, and `membertypes`.

### Validation

- Bundled compile: passed.
- TypeScript compile: passed.
- Language server tests: 210 passed, 3 skipped by default.
- VSIX packaging: passed; `pml-aveva-e3d-0.12.33.vsix` contains 15 files.
- VSIX smoke-check: passed; manifest/package identity match `mikhalchankasm.pml-aveva-e3d` v0.12.33 and no blocked source/config directories are included.
- Local VS Code/Cursor install: passed with `npm run pack:install`.

### Assets

- VSIX: `pml-aveva-e3d-0.12.33.vsix`
<!-- GitHub Actions replaces this placeholder with the CI-built VSIX checksum when publishing the release. -->
- SHA256: `6C967263199CA1445CBE4FF0513E86F7BD5D4A0976E22F1B552A36E7F26C1E06`

## Active Release Track

### v0.12.x - Form Parser Foundation

- `.pmlfrm` parser support is the active focus.
- Current coverage includes chained method calls, callback assignments, nested frames, form outline metadata, guarded callback/gadget reference diagnostics, PML attribute member access, dynamic substitute member access, import wrappers, additional form gadgets, command-controller syntax, and fixture/corpus smoke tests.
- Remaining parser work includes broader PML.NET form patterns, more PML1 command forms in `.pmlfrm`/`.pmlobj`/`.pmlfnc`, and deciding whether to repair or exclude intentionally broken fixture snippets.

### PML Assistant Integration Track

- Added an extension-owned external CLI contract for `e3d-pml-agent-kit`: parse, diagnose, workspace symbols, and scope lookup.
- Added initial VS Code Agent Kit commands for reviewing PML files, mapping returned findings to Problems diagnostics, checking health, and opening mapped help pages.
- Agent Kit still owns review policy, normalized findings beyond parser/LSP diagnostics, MCP orchestration, and optional live E3D validation.

### v0.11.x - Parser Hardening and Print Tools

- Added `$P` print/debug tools, PDMS command starter metadata, command hover, packaging cleanup, and parser compatibility fixes for real PML/PMLFNC files.
- This track is considered stable unless regressions are reported.

## Next Planned Work

1. Continue `v0.12.x` by mining the installed AVEVA PMLLIB corpus for high-frequency `.pmlfrm`, `.pmlobj`, and `.pmlfnc` parser gaps.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. After form parsing stabilizes, move references/rename toward AST/index-based lookup.

For full history, see [CHANGELOG.md](CHANGELOG.md).
