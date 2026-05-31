# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.35

**Release Date:** 2026-05-31

**GitHub Release:** [v0.12.35](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.35)

### What Changed

- Began moving workspace method References and Rename to AST/index-backed lookup while keeping text scanning for callback-string fallback cases.
- Added first-pass type-aware member completions for obvious `STRING`, `REAL`, `ARRAY`, `DBREF`, `ELEMENTTYPE`, and `ATTRIBUTE` receivers.
- Kept receiver-type inference scoped to declarations and assignments before the cursor to avoid future-code noise.
- Added `.pmlfrm` `!this.` completions for form members, frames, and gadgets alongside form-local methods.
- Added type-aware `.pmlfrm` member completions for expressions such as `!this.title.` and `!this.items.`.
- Added a `.pmlfrm` Quick Fix that generates a missing callback method stub from opt-in form reference diagnostics.
- Strengthened VSIX validation to fail packaged JavaScript files with unresolved local `require()` imports.
- Added a lightweight extension smoke validator for critical command contributions, source registrations, and packaged CLI scripts.
- Wired extension smoke, Quick Actions, extension-host smoke, and VSIX validators into CI and release workflows.

### Validation

- Bundled compile: passed with `npm run compile`.
- TypeScript compile: passed with `npm run compile:tsc`.
- Language server tests: passed with `npm --prefix packages/pml-language-server run test -- --run` (`233 passed`, `3 skipped`).
- Quick Actions command validation: passed with `npm run validate:quick-actions` (`15 references`).
- Extension smoke validation: passed with `npm run validate:extension-smoke` (`16 commands`, `7 scripts`, `4 source markers`).
- Extension-host smoke validation: passed with `npm run test:extension-smoke`.
- VSIX packaging: passed with `npm run pack`; `pml-aveva-e3d-0.12.35.vsix` contains 16 files.
- VSIX smoke-check: passed with `npm run validate:vsix`; manifest/package identity match `mikhalchankasm.pml-aveva-e3d` v0.12.35, `out/extension.js`, `packages/pml-language-server/out/server.js`, and `packages/pml-language-server/out/cli.js` are included, and no blocked source/config directories are included.
- Local VS Code/Cursor install: passed with `npm run install:local`.
- Live E3D validation: not confirmed in this repository; current ecosystem baseline remains `PARTIAL_LIVE_UNAVAILABLE_CLEAN` until real E3D/Avox contact is verified by the owning workspace.

### Final Pre-Publish Smoke Checklist

Before publishing a Marketplace package:

1. Run `npm run pack` to rebuild the VSIX from the current sources.
2. Run `npm run validate:vsix` and confirm the packaged JavaScript has no unresolved local `require()` imports.
3. Run `npm run validate:quick-actions`.
4. Install the generated VSIX in a disposable VS Code profile and open a `.pml` file.
5. Confirm the extension activates, syntax highlighting loads, the PML language server starts, `PML: Quick Actions and Presets...` opens, `$P` print actions are available, and packaged CLI commands report JSON output.

### Assets

- VSIX: `pml-aveva-e3d-0.12.35.vsix`
<!-- GitHub Actions replaces this placeholder with the CI-built VSIX checksum when publishing the release. -->
- SHA256: `A6C185126C7FA4ED0A242D704A4F2D6AFE5FF0C59AB7322E830732B6555F67AF`

## Active Release Track

### v0.12.x - Form Parser Foundation and PML Assistant Integration

- `.pmlfrm` parser support remains the active foundation track.
- PML Assistant integration now has an extension-owned static CLI contract, but live E3D validation remains external and must not be inferred from static validation.
- Current coverage includes chained method calls, callback assignments, nested frames, form outline metadata, guarded callback/gadget reference diagnostics, PML attribute member access, dynamic substitute member access, import wrappers, additional form gadgets, command-controller syntax, curated hovers/completions, indexed method references, and fixture/corpus smoke tests.
- Remaining parser work includes broader PML.NET form patterns and more PML1 command forms in `.pmlfrm`/`.pmlobj`/`.pmlfnc`.

## Next Planned Work

1. Keep the static CLI contract stable and document any contract changes in this repository.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. Continue expanding extension-host smoke checks for packaged CLI availability and Agent Kit setup errors.
4. Continue curated completions/hovers by receiver type without flooding member completion lists.

For full history, see [CHANGELOG.md](CHANGELOG.md).
