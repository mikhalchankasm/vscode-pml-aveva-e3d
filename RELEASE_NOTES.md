# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.34

**Release Date:** 2026-05-29

**GitHub Release:** [v0.12.34](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.34)

### What Changed

- Added a unified `PML: Quick Actions and Presets...` launcher for common cleanup tools, `$P` print actions, documentation helpers, and practical PML starter blocks.
- Added `pml.prints.actions` as the clearer `$P` print action picker command while keeping `pml.prints.clear` as a legacy alias.
- Added the stable PML Assistant extension CLI contract for parse, diagnostics, workspace symbols, and scope queries.
- Added initial VS Code Agent Kit bridge commands for reviewing the current PML file, mapping findings to Problems diagnostics, checking Agent Kit health, checking live E3D/Avox status, and opening mapped help pages.
- Fixed VSIX packaging so the bundled CLI entry point `packages/pml-language-server/out/cli.js` is included in installed packages.
- Reduced `[0]` array-index false positives for UI callback payload arrays while preserving diagnostics for ordinary PML arrays.
- Added low-noise DBREF object method completions and hover docs for `attribute`, `attributes`, `badref`, `mcount`, and `line`; corrected `delete` docs to describe deleting the PML DBREF object, not the referenced database element.
- Added focused `Q ATT` command hover help and expanded generic `Q` hover fallback with common `Q VAR` and `Q ATT` forms.
- Added low-noise ATTRIBUTE metadata method completions and hover docs for distinctive methods such as `isPseudo`, `isUda`, `validValues`, `defaultValue`, and `hidden`.
- Made documented user-defined method hovers more compact: call sites show only the cleaned method description, while declaration hovers keep usage links in a separate block.
- Distinguished form-local method completions from built-in/object method completions by using a separate completion icon kind for form methods.

### Validation

- Bundled compile: passed with `npm run compile`.
- TypeScript compile: passed with `npm run compile:tsc`.
- Language server tests: passed with `npm --prefix packages/pml-language-server run test` (`223 passed`, `3 skipped`).
- Quick Actions command validation: passed with `npm run validate:quick-actions` (`15 references`).
- PML Assistant CLI smoke commands: passed for `parse`, `diagnose`, `symbols`, and `scope`; CLI reports contract version `1.0` and extension version `0.12.34`.
- VSIX packaging: passed with `npm run pack`; `pml-aveva-e3d-0.12.34.vsix` contains 16 files.
- VSIX smoke-check: passed with `npm run validate:vsix`; manifest/package identity match `mikhalchankasm.pml-aveva-e3d` v0.12.34, `out/extension.js`, `packages/pml-language-server/out/server.js`, and `packages/pml-language-server/out/cli.js` are included, and no blocked source/config directories are included.
- Local VS Code/Cursor install: passed with `npm run pack:install`.
- Live E3D validation: not confirmed in this repository; current ecosystem baseline remains `PARTIAL_LIVE_UNAVAILABLE_CLEAN` until real E3D/Avox contact is verified by the owning workspace.

### Assets

- VSIX: `pml-aveva-e3d-0.12.34.vsix`
<!-- GitHub Actions replaces this placeholder with the CI-built VSIX checksum when publishing the release. -->
- SHA256: `ECB2FC3911A9CF54E5F3FC93D73CB0EBFF4E1060C0A11765632C8FF8FD5B525C`

## Active Release Track

### v0.12.x - Form Parser Foundation and PML Assistant Integration

- `.pmlfrm` parser support remains the active foundation track.
- PML Assistant integration now has an extension-owned static CLI contract, but live E3D validation remains external and must not be inferred from static validation.
- Current coverage includes chained method calls, callback assignments, nested frames, form outline metadata, guarded callback/gadget reference diagnostics, PML attribute member access, dynamic substitute member access, import wrappers, additional form gadgets, command-controller syntax, curated hovers/completions, and fixture/corpus smoke tests.
- Remaining parser work includes broader PML.NET form patterns, more PML1 command forms in `.pmlfrm`/`.pmlobj`/`.pmlfnc`, and moving References/Rename toward AST/index-backed lookup.

## Next Planned Work

1. Keep static CLI contract stable and coordinate any contract changes with `D:\GitHub\pml-assistant-workspace`.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. Add stronger extension-host smoke checks for command registration, packaged CLI availability, and Agent Kit setup errors.
4. Continue curated completions/hovers by receiver type without flooding member completion lists.

For full history, see [CHANGELOG.md](CHANGELOG.md).
