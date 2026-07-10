# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.39

**Release Date:** 2026-07-10

**GitHub Release:** [v0.12.39](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.39)

### What Changed

- Variable type Inlay Hints now follow typed parameters and prior reliable assignments, including direct alias chains.
- Explicit return types from unambiguous file-local methods and workspace global functions now flow into variable type hints.
- Receiver-aware completion now narrows built-in methods after assignments from explicitly typed user calls.
- Unknown, ambiguous, or conditional type flow stays conservative and does not reuse stale types.
- Equality comparisons no longer resemble assignments during receiver inference.

### Validation

- Client tests: passed with `npm run test:client` (`22 passed`).
- Language-server tests: passed with `npm run test:server` (`351 passed`, `3 skipped`).
- Root and language-server TypeScript validation: passed.
- External read-only Claude review: passed with no blocking findings; its comparison-regex concern was reproduced, fixed, and regression-tested.
- Bundled compile, Quick Actions validation, extension smoke, and activated extension-host smoke: passed.
- VSIX packaging and validation: passed; the canonical CI artifact `pml-aveva-e3d-0.12.39.vsix` contains 16 files (420,717 bytes).
- Disposable VSIX install smoke: passed for `mikhalchankasm.pml-aveva-e3d@0.12.39`.
- Local installation: passed in both VS Code and Cursor, each reporting version `0.12.39`.

### Assets

- VSIX: `pml-aveva-e3d-0.12.39.vsix`
- SHA256: `329efabfcc27fb907e21c6400247176c5cd88ba5dffd07fd4f668dad33bad91c`

## Previous Release - v0.12.38

**Release Date:** 2026-07-10

**GitHub Release:** [v0.12.38](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.38)

### What Changed

- Added low-noise variable type hints based on the first reliable assignment in each scope.
- Added parameter-name hints for unambiguous file-scoped methods and workspace-scoped global functions.
- Suppressed redundant parameter hints when an argument already has the parameter name.
- Added independent settings for the Inlay Hint master switch, variable types, and parameter names.
- Added an open-document AST cache and signature-sensitive refresh path to keep viewport requests responsive.

### Validation

- Client tests: passed with `npm run test:client` (`22 passed`).
- Language-server tests: passed with `npm run test:server` (`342 passed`, `3 skipped`).
- Root and language-server TypeScript/lint validation: passed without warnings.
- Bundled compile, Quick Actions validation, and extension smoke validation: passed.
- Extension-host smoke validation: passed with the PML Language Server activated.
- VSIX packaging and validation: passed; the published CI artifact `pml-aveva-e3d-0.12.38.vsix` contains 16 files (419,954 bytes).
- Disposable VSIX install smoke: passed for `mikhalchankasm.pml-aveva-e3d@0.12.38`.
- Local installation: passed in both VS Code and Cursor.

### Assets

- VSIX: `pml-aveva-e3d-0.12.38.vsix`
<!-- GitHub Actions replaces this placeholder with the CI-built VSIX checksum when publishing the release. -->
- SHA256: `df39e4ab9be108dfdf43c34be3f055a9870a8d99fd3ca2de41281d75523804a7`

## Earlier Release - v0.12.37

**Release Date:** 2026-07-10

**GitHub Release:** [v0.12.37](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.37)

### What Changed

- Add incoming/outgoing Call Hierarchy for indexed PML methods and global functions, including navigation from declarations and direct call sites.
- Show clickable reference counts above PML methods and global functions; the new `pml.codeLens.enabled` setting can hide them.
- Add curated Quick Actions presets for form callbacks, arrays, file output, and PML.NET namespaces.
- Make unknown form member diagnostics explain the immediate corrective action.
- Make missing form callback diagnostics explain the immediate corrective action.
- Report unknown static form members even when they are followed by indexed access.
- Keep opt-in form-reference diagnostics from flagging dynamic `!this` member paths as unknown members.
- Keep inactive comments and strings from changing inferred member-completion receiver types.
- Let member completion follow the most recent direct receiver alias instead of a stale earlier assignment.
- Smoke-test setup guidance for every Agent Kit command that requires a configured repository.
- Avoid typo-diagnostic suggestions for sigiled local and global variable names.
- Keep member completions focused when a local variable aliases a typed form member.
- Rename bare method callback references safely when they are followed by a bracket or chained member delimiter.
- Keep member completions focused when a local variable is a direct alias of a typed receiver.
- Align release guidance with GitHub Releases-only VSIX storage, SHA-256 checksums, and the canonical release notes file.
- Show how many PML files were found and how long indexing took in workspace-index progress.
- Verify that a freshly packaged VSIX installs into an isolated VS Code profile before CI and release validation accept it.
- Report an invalid Agent Kit repository setting as a clear setup error and cover the guidance in extension-host smoke tests.
- Run Agent Kit through npm's JavaScript CLI instead of `cmd.exe`, so Windows file paths are passed literally even when they contain shell characters.
- Separated client transform, print-command, and Agent Kit helper tests from the language-server package and made both suites explicit CI/release checks.
- Made `compile:tsc` validate both projects without emitting intermediate files into bundle output directories.
- Made Reindex Selected Array reject selections without array assignments instead of displaying a false success message.
- Suppressed ambiguous typo diagnostics for one- and two-character tokens quoted by parser errors.
- Aligned References and Rename for same-name objects and forms by preferring objects in object/type syntax and forms in global form syntax.
- Extended method Rename fallback coverage to bare method references used directly before closing parentheses or commas.
- Preserved Windows CRLF endings across the remaining line-oriented editing and method documentation commands.
- Made packaged CLI smoke execution independent of inherited Electron environment state and prevented local reinstall packaging from fetching an unpinned `vsce`.
- Reduced language-server startup noise to one failure notification and made unsupported dynamic configuration registration non-fatal.
- Kept automated release checksum injection from overwriting SHA256 values recorded for earlier releases.
- Preserved Agent Kit file paths containing Windows shell characters instead of inserting caret characters that point npm scripts at a different path.
- Hardened variable Rename so slash expressions keep their operators and numeric operands, while unprefixed replacement names retain the required `!` or `!!` sigil.
- Prevented top-level local-variable Rename from changing independent variables inside method and function bodies.
- Added safe Rename support for direct global `!!function(...)` symbols so function definitions and indexed direct calls can be renamed without changing global variables, form member calls, or file-local methods.
- Kept Rename on `!variable` and `!!global` symbols from accidentally switching to same-name method, object, or form rename.
- Resolved `!!Form` symbols correctly inside calls such as `!!Form.show()` for definition lookup, references, and rename.
- Resolved object constructor symbols such as `object Pump()` on the object path instead of same-name method paths.
- Improved parser recovery after malformed statements so following lines remain available to diagnostics and navigation.
- Made Agent Kit npm command execution Windows-safe with quoted arguments, required trusted workspaces before running Agent Kit scripts, and limited auto-discovery to a sibling `e3d-pml-agent-kit` folder.
- Tightened object and form Rename/References boundaries so longer same-prefix names are not partially edited or reported.
- Scoped local variable Rename to the containing method/function and rejected same-scope target-name collisions.
- Made workspace Rename fail safely instead of returning partial edits when an indexed file cannot be read.
- Tracked npm lockfiles, widened CI push coverage, and pinned local `@vscode/vsce` for reproducible VSIX packaging.
- Removed a generated Vitest config artifact and documented bundled compile versus TypeScript validation accurately.
- Refreshed npm lockfiles so root and language-server dependency audits report zero vulnerabilities.
- Kept local release-check artifacts out of packaged VSIX files and made VSIX validation block them.
- Prevented Format Document assignment alignment from changing `=` characters inside PML string literals.
- Prevented Sort Methods from duplicating preceding comments, kept selected-line cleanup commands CRLF-safe, kept Reindex Selected Array working on full-line and multi-line selections without replacing later selected array names, and kept Add to Array from converting comments into elements or reordering selected blocks.
- Prefer live open-document text over cached index text when building Rename edits, and keep workspace indexing from overwriting open-document symbols with stale disk content.
- Preserved parser ranges for multiline PML string literals so expression tails after those strings are not dropped.
- Cleared diagnostics when files close and applied `pml.maxNumberOfProblems` to diagnostics sent by the language server.
- Reported asynchronous PML Language Server startup failures instead of leaving unhandled client-start rejections.
- Reduced typo-diagnostic noise by suppressing ambiguous short-word keyword suggestions.
- Reduced member-completion receiver inference overhead by reusing compiled patterns during each completion request.
- Re-indexed the workspace when workspace folders change and restored open-document symbols after the refresh.
- Resolved bundled example files from the active extension context instead of a hardcoded Marketplace extension ID.
- Shared provider word-range extraction across Hover, Definition, References, and Rename while preserving current symbol boundary behavior.
- Improved Signature Help for nested method/function calls so active parameters are chosen from the correct call frame.
- Kept Hover inactive inside comments and string literals without treating comment markers embedded in strings as real comments.
- Kept Go to Definition from resolving symbols embedded in comments or string literals.
- Suppressed Completion and Signature Help inside comments and string literals, and ignored string-argument delimiters when locating active calls or choosing the active signature parameter.
- Kept Find References and Rename from starting on symbols embedded in comments or string literals.
- Extended extension-host smoke validation to execute the bundled PML Assistant CLI and verify JSON output.

### Validation

- Client tests: passed with `npm run test:client` (`22 passed`).
- Language-server tests: passed with `npm run test:server` (`331 passed`, `3 skipped`).
- TypeScript validation: passed with `npm run compile:tsc`.
- Lint and bundled compile: passed with `npm run lint` and `npm run compile`.
- Quick Actions and extension smoke validators: passed.
- Extension-host smoke validation: passed with the PML Language Server activated.
- VSIX packaging and validation: passed; the published CI artifact `pml-aveva-e3d-0.12.37.vsix` contains 16 files (417,552 bytes).
- Disposable VSIX install smoke: passed for `mikhalchankasm.pml-aveva-e3d@0.12.37`.
- Local installation: passed in both VS Code and Cursor, each reporting version `0.12.37`.

### Assets

- VSIX: `pml-aveva-e3d-0.12.37.vsix`
<!-- GitHub Actions replaces this placeholder with the CI-built VSIX checksum when publishing the release. -->
- SHA256: `357e11d13a5821d6cc21688a85ed76d506e3af6de5eb06d4053593c9ea39b004`

## Earlier Release - v0.12.36

**Release Date:** 2026-06-15

**GitHub Release:** [v0.12.36](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.36)

### What Changed

- Reduced member-completion noise for constructed `ATTRIBUTE` receivers and obvious string/numeric literal receivers.
- Avoided redundant document indexing when the same document version is already indexed.
- Debounced external file watcher re-indexing, preserved recreated files during watcher bursts, and moved watched-file indexing into a tested helper.
- Improved References and Rename coverage for dynamic substitute callback paths such as `!this.$!<gadget>.method`.
- Kept user-defined method navigation and hints file-local so duplicate method names in separate forms no longer leak into completions, hover usage previews, definition lookup, references, rename, or signature help.
- Added a separate global-function path for `!!function(...)` calls, with indexed references, definition lookup, hover usages, signature help, completions, workspace/document symbols, and CLI symbol output.
- Clarified the array reindex command name as `Reindex Selected Array` to reflect its local selection scope.

### Validation

- Bundled compile: passed with `npm run compile`.
- TypeScript compile: passed with `npm run compile:tsc`.
- Language server tests: passed with `npm --prefix packages/pml-language-server run test -- run` (`264 passed`, `3 skipped`).
- Quick Actions command validation: passed with `npm run validate:quick-actions`.
- Extension smoke validation: passed with `npm run validate:extension-smoke`.
- Extension-host smoke validation: passed with `npm run test:extension-smoke`.
- VSIX packaging: passed with `npm run pack`; `pml-aveva-e3d-0.12.36.vsix` contains 16 files.
- VSIX smoke-check: passed with `npm run validate:vsix`.
- Local VS Code/Cursor install: passed with `npm run install:local`.

### Assets

- VSIX: `pml-aveva-e3d-0.12.36.vsix`
- SHA256: `f225b1c80baa8b6ab570c5ac11ce057b673c6957430bf53f65ddf79339538fc6`

## Historical Release - v0.12.35

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
3. Continue expanding extension-host smoke checks for Agent Kit setup errors and disposable-profile install behavior.
4. Continue curated completions/hovers by receiver type without flooding member completion lists.

For full history, see [CHANGELOG.md](CHANGELOG.md).
