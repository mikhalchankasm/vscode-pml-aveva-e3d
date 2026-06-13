# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Unreleased Stabilization Snapshot

### What Changed

- Added standard and super Claude review npm wrappers, with the super path defaulting to `claude-fable-5` and both paths using a no-tools, non-interactive review contract.
- Reduced member-completion noise for constructed `ATTRIBUTE` receivers and obvious string/numeric literal receivers.
- Avoided redundant document indexing when the same document version is already indexed.
- Debounced external file watcher re-indexing, preserved recreated files during watcher bursts, and moved watched-file indexing into a tested helper.
- Improved References and Rename coverage for dynamic substitute callback paths such as `!this.$!<gadget>.method`.
- Kept user-defined method navigation and hints file-local so duplicate method names in separate forms no longer leak into completions, hover usage previews, definition lookup, references, rename, or signature help.

### Validation

- Bundled compile: passed with `npm run compile`.
- Language server tests: passed with `npm --prefix packages/pml-language-server test -- run` (`249 passed`, `3 skipped`).
- Targeted indexing/navigation tests: passed for file-change debounce, watched-file indexing, workspace indexing, and method references.
- Claude review wrapper smoke: passed with `npm run -s review:claude` and `npm run -s review:claude:super`.
- External Claude super review: completed; confirmed findings were addressed in follow-up hardening.
- VSIX packaging: passed with `npm run pack`; `pml-aveva-e3d-0.12.35.vsix` contains 16 files.
- VSIX smoke-check: passed with `npm run validate:vsix`.

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
- SHA256: `38E5C3D7E19C6D75527C4E9E28501DDEE443970057B54C4DB6C48DFE013F5743`

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
