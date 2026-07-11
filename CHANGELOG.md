# Changelog

All notable changes to the "PML for AVEVA E3D" extension will be documented in this file.

## [0.12.45] - 2026-07-11

### Added

- Add `form-member-type-mismatch` diagnostics when a declared form member disagrees with one consistent type proven by direct reliable assignments.
- Add a preferred Quick Fix that changes only the declared member type to the proven type.
- Add a form-header refactor that aligns every independently safe member declaration in one edit set.

### Improved

- Treat conflicting, dynamic, unknown, conditional-by-value, or custom/`ANY` member types as ambiguous and leave them unchanged.
- Extend the Form Authoring Toolkit into a type-assisted editing flow without broad rewrites or completion noise.

## [0.12.44] - 2026-07-11

### Added

- Navigate from static gadget callback declarations to their file-local methods and back from callback methods to the declaring gadget.
- Add a conservative Quick Fix that declares a missing form member when a direct assignment provides a reliable PML type.
- Add a form-header refactor that inserts the standard init callback binding and generates an `init` method only when needed.
- Generate every missing direct callback method in one stable, deduplicated batch from the form header.
- Add a lifecycle pack for init, OK, and cancel bindings/methods without replacing existing lifecycle targets.
- Declare every reliably typed missing direct `!this` member in one batch while excluding built-ins, gadgets, frames, and methods.

### Improved

- Cover callbacks in nested frames and direct `!this.method()`, `.method()`, and `method()` callback spellings.
- Preserve dynamic member paths and avoid guessing whether an untyped `!this` reference is a member, gadget, frame, or PMLNET control.
- Guard Form Authoring Code Action latency on a large form document and preserve CRLF edits.
- Expose every gadget declaration when one callback method is intentionally reused, while keeping form-level callbacks out of imprecise navigation.
- Add visual Form Outline CodeLens entries for form actions, member types, working callbacks, and missing callback repair entrypoints.
- Keep missing-callback repair available from visual lenses for `!this.method()`, `.method()`, and `method()` callback spellings.

## [0.12.43] - 2026-07-11

### Added

- Add missing trailing call arguments from an unambiguous indexed method or global-function signature.
- Offer a conservative refactor that synchronizes a generated empty stub signature from typed call arguments.
- Add explicit callable-definition navigation from direct indexed calls and automatically open newly generated definitions.

### Improved

- Keep call-authoring actions file-scoped for methods and workspace-scoped for globally unique functions.
- Preserve user-authored empty callables, ambiguous symbols, inactive text, and existing form callback Quick Fix behavior.
- Respect requested Code Action kinds so Quick Fix and Refactor actions stay in their intended editor surfaces.

## [0.12.41] - 2026-07-11

### Added

- Insert indexed methods and global functions as typed argument snippets, with a plain call fallback for clients that do not support snippets.
- Offer an AST-backed Quick Fix for missing direct `.method(...)`, `!this.method(...)`, and `!!function(...)` calls.
- Infer conservative stub parameter names and types from typed parameters, reliable prior assignments, literals, constructors, arrays, and indexed form members.
- Create missing global functions in their own sibling `.pmlfnc` file while appending missing methods to the current supported source file.

### Improved

- Suppress stub actions for inactive text, arbitrary receivers, constructors, known system functions, existing case-insensitive symbols, indexed forms, and macro files.
- Invalidate inferred stub parameter types after conditional, loop, or handler assignments and guard code-action latency with the large-document performance budget.

## [0.12.40] - 2026-07-10

### Added

- Show explicit parameter and return types in indexed method/function Hover, Signature Help, and callable completion details.
- Narrow member completions directly after unambiguous typed user calls such as `!!load().`, `.build().`, and `!this.items().`.
- Propagate receiver types through supported built-in call chains such as `!!element().query(|NAME|).`.

### Improved

- Keep callable signature refreshes current when only a parameter type or return type changes.
- Preserve typed completion details in the unindexed current-document fallback.
- Keep direct-call narrowing conservative for ambiguous symbols, unknown return types, line-leading dots, and built-in/user-method name collisions.
- Guard typed chained-call completion latency with the existing large-workspace performance budget.

## [0.12.39] - 2026-07-10

### Improved

- Propagate explicit parameter types and prior reliable variable types into subsequent variable Inlay Hints.
- Preserve explicit method and global-function return types in the workspace symbol index and use unambiguous return types for variable Inlay Hints.
- Narrow receiver-aware member completions after assignments from unambiguous user methods and global functions with explicit return types.
- Invalidate completion receiver types after unknown or ambiguous reassignments instead of reusing stale earlier types.
- Keep conditional, loop, and handler assignments from leaking uncertain types into following Inlay Hints.
- Keep equality comparisons distinct from assignments during completion receiver inference.

## [0.12.38] - 2026-07-10

### Added

- Add low-noise Inlay Hints for variable types inferred from the first reliable assignment in each scope.
- Add parameter-name Inlay Hints for unambiguous file-scoped method calls and workspace-scoped global-function calls.

### Improved

- Cache parsed ASTs by open-document version so Inlay Hint viewport requests do not repeatedly parse stable documents.
- Refresh cross-file parameter hints only when indexed callable signatures change, while keeping watched-file and configuration refreshes current.

## [0.12.37] - 2026-07-10

### Improved

- Add indexed incoming/outgoing Call Hierarchy for file-scoped PML methods and workspace-scoped global functions, available from declarations and direct call sites.
- Show clickable reference-count CodeLens entries above PML methods and global functions, with file-scoped method counts and workspace-scoped function counts.
- Add curated Quick Actions presets for form callbacks, arrays, file output, and PML.NET namespaces.
- Make unknown form member diagnostics explain the immediate corrective action.
- Make missing form callback diagnostics explain the immediate corrective action.
- Report unknown static form members even when they are followed by indexed access.
- Keep opt-in form-reference diagnostics from flagging dynamic `!this` member paths as unknown members.
- Keep inactive comments and strings from changing inferred member-completion receiver types.
- Let member completion follow the most recent direct receiver alias instead of a stale earlier assignment.
- Smoke-test setup guidance for every Agent Kit command that requires a configured repository.
- Avoid typo-diagnostic suggestions for sigiled local and global variable names.
- Follow direct aliases of typed form members when narrowing member completion methods.
- Extend Rename fallback coverage for bare method references immediately before brackets or chained member delimiters.
- Infer member-completion receiver types through prior direct variable aliases, so aliases of typed arrays and values avoid unrelated built-in methods.
- Align internal release commands and checklist with the releases-only VSIX policy, SHA-256 checksums, and the canonical `RELEASE_NOTES.md` file.
- Make workspace-index progress state clearer by reporting discovered PML file counts and indexing duration.
- Install the freshly packaged VSIX into a disposable VS Code profile in CI and release validation, then verify the extension ID and version reported by the isolated profile.
- Treat invalid configured Agent Kit paths as a setup problem and smoke-test the actionable setup guidance in the extension host.
- Run Agent Kit npm scripts through `npm-cli.js` without `cmd.exe` shell parsing, preserving Windows paths that contain `%`, `&`, `!`, spaces, or parentheses.
- Run client transform, print-command, and Agent Kit helper tests from a root Vitest project, keep language-server tests inside their package, and make both suites explicit CI/release gates.
- Make `compile:tsc` a no-emit validation gate so TypeScript checks do not mix intermediate files with esbuild bundles; package-local language-server compilation remains available when emitted output is needed.
- Make Reindex Selected Array report no-op selections accurately instead of returning unchanged text as a successful edit, and remove its dead full-document edit path.
- Suppress typo suggestions for one- and two-character tokens quoted in parser errors, avoiding noise such as suggesting `if` for `'i'`.
- Use shared syntax-aware object/form classification so References and Rename agree when an object and form have the same name.
- Include bare method references followed directly by `)` or `,` in Rename fallback scanning without matching longer identifiers.
- Preserve CRLF line endings across remaining comment, alignment, array-list, method-summary, documentation-block, and method-sort editing commands.
- Make packaged CLI smoke execution explicitly run Electron as Node, and keep local reinstall packaging pinned to the installed `vsce` binary.
- Keep language-server startup failures to one actionable notification and continue initialization when dynamic configuration registration is unavailable.
- Limit release-note checksum injection to the current release entry so historical SHA256 values remain unchanged.
- Preserve Agent Kit file-path arguments containing Windows shell characters such as `&` and parentheses instead of inserting literal caret characters into the path.
- Prevent Rename on slash expressions such as `!total/100` from replacing the full expression, and preserve local/global variable sigils when users enter an unprefixed new name.
- Keep top-level local-variable Rename out of method and function bodies while still updating top-level references across the file.
- Add safe Rename support for direct global `!!function(...)` symbols, updating function definitions and indexed direct calls without touching global variables, form member calls, or file-local methods.
- Keep Rename on `!variable` and `!!global` symbols on the variable path when a same-name `.method()` exists in the file.
- Keep Rename on `!variable` symbols on the variable path when a same-name object or form exists in the workspace.
- Resolve `!!Form` symbols correctly inside member calls such as `!!Form.show()` for Go to Definition, Find References, and Rename.
- Resolve object constructor symbols such as `object Pump()` on the object path instead of same-name method paths for Go to Definition, Find References, and Rename.
- Prefer live open-document text over cached index text when building Rename edits.
- Keep workspace indexing from overwriting open-document symbols with stale disk content.
- Recover parser state at physical line boundaries after malformed statements so later method/object statements remain visible to diagnostics and navigation.
- Make Agent Kit npm command execution work on current Windows Node runtimes, quote Windows npm arguments safely, and require trusted workspaces before running Agent Kit scripts.
- Restrict Agent Kit auto-discovery to a sibling `e3d-pml-agent-kit` folder unless `pml.agentKit.path` is configured explicitly.
- Tighten object and form Rename/References boundaries so longer same-prefix names are not partially edited or reported.
- Scope local variable Rename to the containing method/function and reject same-scope target-name collisions.
- Fail workspace Rename safely instead of returning partial edits when an indexed file cannot be read.
- Track npm lockfiles, run CI on all push branches, and package with pinned local `@vscode/vsce` for reproducible VSIX builds.
- Remove the generated language-server Vitest config artifact and document `compile` versus `compile:tsc` validation correctly.
- Refresh npm lockfiles to clear root and language-server audit findings.
- Keep local release-check artifacts out of VSIX packages and fail VSIX validation if they appear.
- Prevent Format Document assignment alignment from changing `=` characters inside PML string literals.
- Prevent Sort Methods from duplicating preceding method comments.
- Preserve CRLF line endings in selected-line cleanup commands such as sorting, duplicate removal, empty-line removal, trimming, and spaces-to-tabs conversion.
- Keep Reindex Selected Array working on full-line and multi-line selections, and keep it from replacing later selected array names with the first selected array name.
- Keep Add to Array from converting comments into array elements and preserve the selected block order while adding new items.
- Preserve AST ranges for multiline PML string literals so following expression operators remain part of the parsed expression.
- Clear published diagnostics when files close and respect `pml.maxNumberOfProblems` before sending diagnostics to the editor.
- Report asynchronous PML Language Server startup failures instead of leaving unhandled client-start rejections.
- Reduce typo-diagnostic noise by suppressing ambiguous short-word suggestions such as three-letter operator typos with multiple plausible keyword matches.
- Reduce member-completion receiver type inference overhead by compiling receiver regex patterns once per completion request instead of once per scanned line.
- Re-index the workspace when workspace folders change instead of only logging the event, while preserving open-document symbols after the refresh.
- Resolve bundled example files from the active extension context instead of a hardcoded Marketplace extension ID.
- Share provider word-range extraction across Hover, Definition, References, and Rename while preserving each provider's existing PML symbol boundary rules.
- Keep Signature Help focused on the innermost active call and ignore nested-call commas when selecting the active parameter.
- Keep Hover inactive inside PML comments and string literals while preserving hover for active code after string text that contains comment markers.
- Keep Go to Definition from resolving symbols inside PML comments and string literals.
- Suppress Completion and Signature Help inside PML comments and string literals, and keep Signature Help call detection and parameter selection from counting delimiters inside string arguments.
- Keep Find References and Rename from starting on symbols embedded inside PML comments or string literals.
- Extend extension-host smoke validation to execute the bundled PML Assistant CLI and verify its JSON parse contract.

## [0.12.36] - 2026-06-15

### Improved

- Reduced member-completion noise for variables constructed as `object ATTRIBUTE(...)` by limiting suggestions to ATTRIBUTE metadata methods.
- Filter member completions for variables assigned obvious string or numeric literals so literal receivers no longer show unrelated built-in methods.
- Avoid redundant workspace index updates when a document version is already indexed.
- Debounce external file watcher re-indexing so bursts of save events for the same PML file are processed once.
- Improve References and Rename coverage for dynamic substitute callback paths such as `!this.$!<gadget>.method`.
- Scope user-defined method completions, hover usage previews, Go to Definition, Find References, Rename, and Signature Help to the current file to avoid cross-form method collisions.
- Index global PML functions separately from form/object methods, including `!!function(...)` References, Go to Definition, hover usages, Signature Help, completions, symbols, and CLI symbol output.
- Rename the array `ReIndex` command to `Reindex Selected Array` so the UI makes its local selection scope clear.
- Preserve recreated files during debounced watcher bursts and cap sustained watcher debounce delay.
- Harden dynamic callback reference matching for malformed multiline segments.

## [0.12.35] - 2026-05-31

### Improved

- Strengthened VSIX validation to fail packaged JavaScript files with unresolved local `require()` imports.
- Updated Marketplace-facing metadata and packaged README links for safer pre-publish rendering.
- Added a final pre-publish extension-host smoke checklist to the release notes.
- Began moving workspace method References and Rename toward indexed AST lookup while keeping text scanning as a callback-string fallback.
- Added first-pass type-aware member completions for obvious STRING, REAL, ARRAY, DBREF, ELEMENTTYPE, and ATTRIBUTE receivers.
- Kept type-aware member completion inference scoped to declarations and assignments before the cursor.
- Added a `.pmlfrm` Quick Fix that generates a missing callback method stub from opt-in form reference diagnostics.
- Added `.pmlfrm` `!this.` completions for form members, frames, and gadgets alongside form-local methods.
- Added type-aware `.pmlfrm` completions for typed form members such as `!this.title.` and `!this.items.`.
- Added a lightweight extension smoke validator for critical command contributions, source registrations, and packaged CLI scripts.
- Wired extension smoke, Quick Actions, and full VSIX validators into CI and release workflows.
- Added an extension-host smoke test for activation, critical command registration, and missing form-callback Quick Fix availability.

## [0.12.34] - 2026-05-29

### Fixed

- Include the bundled PML Assistant CLI entry point in packaged VSIX builds so the extension-owned CLI contract is available after installation.

### Improved

- Add a unified `PML: Quick Actions and Presets...` launcher for common cleanup tools, `$P` print actions, documentation helpers, and practical PML starter blocks; the launcher is available from the PML editor context menu even without a selection.
- Add `pml.prints.actions` as the clearer command ID for the `$P` print action picker while keeping `pml.prints.clear` as a legacy alias for existing keybindings.
- Add low-noise DBREF object method completions and hover docs for `attribute`, `attributes`, `badref`, `mcount`, and `line`; correct `delete` docs to avoid implying it deletes the referenced database element.
- Reduce `[0]` array-index false positives for UI callback payload arrays such as right-click grid callback data while preserving diagnostics for ordinary PML arrays.
- Make documented user-defined method hovers more compact: call sites now show only the cleaned method description, while declaration hovers keep usage links in a separate block.
- Add focused `Q ATT` line-command hover help for query-attribute syntax and distributed attribute qualifiers, and mention common `Q VAR`/`Q ATT` forms in the generic `Q` hover fallback.
- Add low-noise ATTRIBUTE metadata method completions and hover docs for distinctive methods such as `isPseudo`, `isUda`, `validValues`, `defaultValue`, and `hidden`.
- Distinguish form-local method completions from built-in/object method completions by using a separate completion icon kind for form methods.
- Add the stable PML Assistant extension CLI contract for parse, diagnostics, symbols, and scope queries, plus initial Agent Kit review commands, diagnostics mapping, health check, and finding help pages.

## [0.12.33] - 2026-05-19

### Fixed

- Restore `$P` print navigation commands by explicitly activating print actions and accepting PML documents by supported file extension when language activation is still settling.
- Reduce false-positive `[0]` array-index diagnostics for likely C#/.NET/PMLNET zero-based collections while keeping ordinary PML arrays 1-based.

### Improved

- Show method usage previews directly in the hover for `define method .name(...)` declarations, with clickable file/line links to the first matching references.
- Add Common Commands starter coverage for `PARAGON`, `SPECONMODE`, and `FINISH`, including parser and hover regression coverage.
- Keep method usage previews more informative on longer PML lines and avoid redundant Outline re-indexing when the current document version is already indexed.
- Add compact hover help for the built-in `!!CE` DBREF current-element variable.
- Simplify user-method hover layout: declaration hovers focus on `USAGES`, while call-site hovers show a clickable `DEFINED` link back to the method declaration.
- Add low-noise `ELEMENTTYPE` metadata method completions and hover docs for distinct methods such as `isudet`, `systemtype`, and `membertypes`.

## [0.12.32] - 2026-05-18

### Fixed

- Rename form references inside pipe-delimited callback targets such as `|!!OtherForm.show()|` while still leaving non-callback pipe strings untouched.

## [0.12.31] - 2026-05-18

### Fixed

- Honor `includeDeclaration: false` in Find References text scans so definition lines are not returned as reference-only results.
- Avoid double-counting method declarations in public Find References results when `includeDeclaration: true`.
- Ignore method references inside `--`, `$*`, `$( ... $)` comments, and regular quoted strings during Find References and method Rename while preserving pipe-delimited callback references.
- Prevent object, form, and variable Rename from editing comments or string literals, including pipe-delimited strings.
- Expose object-contained methods as top-level Outline entries in `.pmlobj` files while keeping the nested object outline.
- Added regression coverage so `.pmlcmd` files expose methods after `setup command` sections in Outline.
- Require an explicit workflow-dispatch approval flag before publishing to VS Code Marketplace from release automation.
- Run TypeScript checks and the language-server test suite in the release workflow before a release tag is created or pushed.
- Move release tag creation until after successful packaging and release-note checksum substitution.
- Clean stale local VSIX checksum files when building a fresh package.
- Remove a stray no-op glob from `.vscodeignore`.

### Improved

- Clarified that typo diagnostics are opt-in and default to off to avoid diagnostic noise.
- Removed a stale version number from the optional AVEVA corpus snapshot test title.
- Added parser, workspace-index, completion, and references performance budget guards for large generated files and 100-file workspace models.
- Cached compiled reference-search patterns per symbol to reduce repeated regex setup during workspace Find References scans.
- Added regression coverage for reference pattern cache reuse, cache eviction, declaration filtering, empty-symbol guards, and member-declaration word boundaries.
- Shared method-reference pattern construction between Find References and Rename to keep callback/member-path matching rules aligned.

## [0.12.30] - 2026-05-14

### Fixed

- Parse integer path-style member suffixes after dots, including AVEVA database paths such as `SREF.1` and `PLAT.2`.
- Restore member-method completion after numeric path suffixes such as `!path.SREF.1.`.
- Select the signature-help overload that covers the active argument and keep zero-parameter method signatures stable at the opening parenthesis.

### Improved

- Added regression coverage for indexed, dynamic, chained, and numeric member completion receivers while keeping bare identifiers such as `foo.` quiet.
- Added parser regression coverage for invalid non-integer numeric suffixes and documented leading-zero numeric suffixes as literal property names.
- Excluded coverage reports from VSIX packages and kept the packaged extension to runtime/user-facing files only.
- Tightened the optional AVEVA corpus budgets to the new 3306-error parser baseline.
- Reduced installed AVEVA corpus parser errors from 3386 to 3306.
- Reduced `.pmlfnc` parser errors from 1045 to 1034, `.pmlfrm` from 843 to 841, and `.pmlobj` from 1495 to 1428.

## [0.12.29] - 2026-05-11

### Fixed

- Restore AVEVA-style multi-line string concatenation where leading `&` continues the previous expression without requiring `$` line continuation.

### Improved

- Added regression coverage for multi-line `&` concatenation.
- Kept GitHub JavaScript actions forced onto the Node 24 runtime while running project commands on Node 22.x to avoid a Vitest/V8 crash on Node 24.
- Tightened the optional AVEVA corpus budgets to the new 3386-error parser baseline.
- Reduced installed AVEVA corpus parser errors from 3429 to 3386.
- Reduced `.pmlfnc` parser errors from 1056 to 1045, `.pmlfrm` from 849 to 843, and `.pmlobj` from 1521 to 1495.

## [0.12.28] - 2026-05-11

### Fixed

- Parse `do from ... to ...` and `do to ...` loops that omit an explicit loop variable.
- Stop infix operators from crossing physical lines unless the next line is explicitly continued with PML `$` line continuation.

### Improved

- Added corpus snapshot file-count sanity checks.
- Tightened the optional AVEVA corpus budgets to the new 3429-error parser baseline.
- Reduced installed AVEVA corpus parser errors from 3596 to 3429.
- Reduced `.pmlfnc` parser errors from 1077 to 1056, `.pmlfrm` from 919 to 849, and `.pmlobj` from 1597 to 1521.

## [0.12.27] - 2026-05-11

### Improved

- Added an optional AVEVA PMLLIB corpus snapshot test gated by `AVEVA_PMLLIB_PATH`.
- Added AST-shape assertions for dynamic substitute member chains to prevent silent multi-statement parsing regressions.
- Updated GitHub Actions workflows to test with Node 24 and opt JavaScript actions into the Node 24 runtime.
- Revalidated the installed AVEVA corpus parser baseline at 3596 errors.

## [0.12.26] - 2026-05-11

### Fixed

- Parse dynamic substitute segments inside member chains such as `!this.error$!<a>.val`, `!this.$!<a>origin`, and `!this.stack$!i$n[!a].elevation`.

### Improved

- Clarified dynamic global variable validation as a prefix check because real PML names can append additional dynamic suffix pieces.
- Added negative coverage for incomplete dynamic global forms `!!$` and `!!$!!`.
- Reduced installed AVEVA corpus parser errors from 3922 to 3596.
- Reduced `.pmlfnc` parser errors from 1174 to 1077, `.pmlfrm` from 1034 to 919, and `.pmlobj` from 1711 to 1597.

## [0.12.25] - 2026-05-11

### Fixed

- Reject incomplete dynamic global variable forms such as `!!$!` and `!!$!<` instead of tokenizing them as valid globals.

### Improved

- Preserved real AVEVA dynamic global forms such as `!!$!!<ce.dbType>CE`.
- Added regression coverage for missing-`define` diagnostics on statement-start `function` definitions.
- Revalidated the installed AVEVA corpus baseline at 3922 parser errors.

## [0.12.24] - 2026-05-11

### Fixed

- Parse PML database attribute expressions that use `function of ...` despite `function` also being a definition keyword.
- Parse dynamic global variable names such as `!!$!gadgetValue`, `!!$!<formName>`, and `!!$!fName$n.$!root$nLS`.

### Improved

- Made form reference validator tests resilient to diagnostic ordering changes.
- Reduced installed AVEVA corpus parser errors from 4026 to 3922.
- Reduced `.pmlfnc` parser errors from 1199 to 1174, `.pmlfrm` from 1050 to 1034, and `.pmlobj` from 1774 to 1711.

## [0.12.23] - 2026-05-10

### Improved

- Preserve whether a `ContinueStatement` came from the `continue` keyword or the PML `skip` keyword.
- Run array-index diagnostics inside conditional `break if ...` and `skip if ...` expressions.
- Run opt-in form reference diagnostics inside conditional `break if ...` and `skip if ...` expressions.
- Revalidated the installed AVEVA corpus baseline at 4026 parser errors.

## [0.12.22] - 2026-05-10

### Improved

- Preserve parsed conditions on conditional `break if ...` AST nodes for future hover, reference, rename, and analysis features.
- Preserve parsed conditions on conditional `skip if ...` AST nodes while keeping the existing `ContinueStatement` representation.
- Added AST-shape assertions for conditional break/skip parsing and extra negative coverage for incomplete `do from` loop bounds.
- Revalidated the installed AVEVA corpus baseline at 4026 parser errors.

## [0.12.21] - 2026-05-10

### Fixed

- Parse PML1 same-line `break if ...` loops without treating the trailing `if` as a nested block that requires `then`.
- Parse open-ended `do !i from ...` loops, including `do !i from 1` and `do !i from 1 by 2`, while still rejecting unexpected same-line trailing tokens.

### Improved

- Added regression coverage for conditional `break if`, open-ended `do from`, and malformed same-line `do from` syntax.
- Reduced installed AVEVA corpus parser errors from 5195 to 4026.
- Reduced `.pmlfnc` parser errors from 1505 to 1199, `.pmlfrm` from 1399 to 1050, and `.pmlobj` from 2288 to 1774.

## [0.12.20] - 2026-05-10

### Fixed

- Document and regression-test that PML `skip if ...` is a same-line form while a following-line `if` remains a separate statement.
- Accept PML1 `onerror`, `label`, `golabel`, and `use ... for ...` command-style lines found in installed AVEVA macro/function code.

### Improved

- Added focused regression coverage for same-line `skip if`, standalone `SETCOMPDATE`, and real AVEVA command-controller idioms.
- Reduced installed AVEVA corpus parser errors from 5321 to 5195 with zero expected behavioral changes for expression-style calls.
- Reduced `.pmlfnc` parser errors from 1611 to 1505, `.pmlfrm` from 1404 to 1399, and `.pmlobj` from 2303 to 2288.

## [0.12.19] - 2026-05-10

### Fixed

- Parse standalone `if` statements that follow a plain `skip` on the next line instead of treating them as `skip if` continuations.
- Accept the PML1 `SETCOMPDATE ...` command starter used in installed AVEVA form files.
- Reduce false parser errors in installed `admextractcntrol.pmlfrm` and `lstclaim.pmlfrm` to zero.

### Improved

- Added regression coverage for `SETCOMPDATE FOR DB ... TO EXTRACT` and `skip` followed by a nested `if`.
- Reduced installed AVEVA `.pmlfrm` parser errors from 1410 to 1404 and `.pmlobj` parser errors from 2306 to 2303.

## [0.12.18] - 2026-05-10

### Fixed

- Harden the release workflow by using `python3` explicitly when injecting the CI-built VSIX checksum.
- Fail release publication if the SHA256 placeholder is missing from release notes instead of publishing an unreplaced placeholder.

### Improved

- Add CI and release guardrails that fail if the packaged VSIX exceeds 5 MB.
- Add CI and release guardrails that fail if local `manuals/` content reappears inside the VSIX.
- Document that the `SHA256` placeholder in `RELEASE_NOTES.md` is replaced by GitHub Actions during publication.

## [0.12.17] - 2026-05-10

### Fixed

- Make `npm run pack` cross-platform so GitHub CI on Ubuntu no longer fails on a Windows-only PowerShell command.
- Keep GitHub Actions dependency installation quiet by choosing `npm ci` only when a lockfile is present.
- Align automated release publishing with the local package command and upload a generated `.vsix.sha256` checksum file.

### Improved

- Updated the release workflow to compute the CI-built VSIX SHA256 and inject it into GitHub Release notes.
- Restored green CI for pushes to `main`.

## [0.12.16] - 2026-05-10

### Fixed

- Exclude local `manuals/` reference content from VSIX packaging as well as git tracking.
- Tighten PML1 `collect all ...` parsing so missing element types, missing clause operands, and unexpected bare trailing tokens now produce diagnostics.
- Add a targeted diagnostic when `collect` is used inside an expression instead of as a statement.

### Improved

- Added negative regression tests for malformed `collect all`, `collect all = 5`, `collect all PIPE for`, and `collect all PIPE garbage` forms.
- Kept DrawList continuation syntax such as `collect all PIPE for !!ce $` / `from drawlist` valid.
- Preserved installed AVEVA PMLLIB parser baselines while restoring compact VSIX packaging.

## [0.12.15] - 2026-05-10

### Fixed

- Prevent procedural menu initializers such as `!this.menu.add(...)` from being treated as menu-body lines and consuming the form's outer `exit`.
- Restore the installed `admin/forms/admstamp.pmlfrm` parser baseline to zero errors.
- Parse standalone PML1 `collect all ...` statements, including DrawList sources such as `collect all PIPE from drawlist`.

### Improved

- Added regression tests for procedural menu initializers and DrawList `collect all ... from drawlist` patterns.
- Reduced installed AVEVA `.pmlfrm` parser errors from 1412 to 1410 while preserving `.pmlcmd`, `.pmlfnc`, `.pmlmac`, and `.pmlobj` baselines.

## [0.12.14] - 2026-05-10

### Fixed

- Detect menu bodies structurally instead of relying on the first menu-body keyword allowlist.
- Keep unknown menu-body lines inside the menu block so they produce `Unexpected token in menu block` instead of leaking into form-body parsing.
- Treat `list` and `view` identifier gadgets after a menu as form-body boundaries rather than menu-body content.
- Consume multiline string tokens as one logical line when recovering menu/body method-call lines.
- Keep local/global variable method-call lines such as `!this.menu.add(...)` quiet inside form sub-block recovery.
- Make parser error-prefix suppression case-insensitive.

### Improved

- Added regression tests for unknown menu-body lines, `list`/`view` gadget boundaries after menus, and exact `Unexpected 'is' after expression` diagnostics.
- Preserved the installed AVEVA PMLLIB corpus baseline: `.pmlfrm` remains at 1412 errors, with `.pmlcmd`, `.pmlfnc`, `.pmlmac`, and `.pmlobj` unchanged.

## [0.12.13] - 2026-05-10

### Fixed

- Accept AVEVA form gadgets whose name is omitted and whose declaration starts directly with a modifier such as `pixmap`.
- Keep shipped `.pmlfrm` forms that end a `setup form` section at the next `define method` boundary from receiving false missing-`exit` diagnostics.
- Preserve `.pmlfnc` command-style `ID/id` lines observed in the installed AVEVA PMLLIB corpus instead of over-tightening restricted command starters.
- Recognize menu bodies that begin with layout directives such as `path`, `vert`, `horz`, `vdist`, or `hdist` without consuming following standalone form gadgets.
- Apply `is`-phrase validation consistently to chained assignment expressions.
- Avoid duplicated parser messages such as `Expected Expected 'exit'...`.

### Improved

- Added regression tests for nameless form gadgets, menu layout-directive bodies, form/method boundaries, `.pmlfnc` command-style lines, and chained assignment `is` tails.
- Reduced installed AVEVA `.pmlfrm` parser errors from 1414 to 1412 while preserving `.pmlcmd`, `.pmlfnc`, `.pmlmac`, and `.pmlobj` baselines.

## [0.12.12] - 2026-05-10

### Fixed

- Report malformed or unterminated form sub-blocks instead of silently swallowing them.
- Keep standalone `menu .name popup` declarations from consuming the following form gadgets.
- Restrict bare-identifier gadget names to underscore-prefixed AVEVA forms such as `_cancel`.
- Prevent broad PML1 `is` phrase recovery from consuming regular assignment tails such as `!x is REAL`.
- Require object constructors such as `object FORM()` to include the constructor call parentheses.
- Restrict newly added `id`, `gap`, and `calldrg` command starters outside known AVEVA file modes.

### Improved

- Added negative regression tests for the v0.12.11 parser heuristics.
- Deduplicated form gadget keyword handling through one shared parser token set.
- Preserved installed AVEVA corpus baselines for `.pmlfnc`, `.pmlobj`, `.pmlcmd`, and `.pmlmac`; `.pmlfrm` now reports 1414 errors because previously silent malformed sub-blocks are diagnostic.

## [0.12.11] - 2026-05-10

### Fixed

- Parsed `layout form ...` form definitions used by installed AVEVA form files.
- Kept form parsing open across nested `bar ... exit`, `menu ... exit`, and `rgroup ... exit` sub-blocks.
- Accepted form gadget names written as bare identifiers, such as `_cancel`, in addition to `.name` syntax.
- Parsed PML form/object type patterns such as `MENU` parameter types and `object FORM()`.
- Reused PML1 direction phrase recovery for assignment expressions such as `Z wrt /*` and `Z is U wrt /*`.
- Treated `id`, `gap`, and `calldrg` as command-style starters.

### Improved

- Added regression coverage for layout forms, menu/bar/rgroup sub-blocks, bare gadget names, form object constructors, direction phrases, and picked-command lines.
- Reduced installed AVEVA `.pmlfrm` parser errors from 3010 to 1409 across 1206 files.
- Also reduced installed `.pmlfnc` parser errors from 1735 to 1611 and `.pmlobj` parser errors from 2694 to 2306.

## [0.12.10] - 2026-05-09

### Fixed

- Report `function !!name()` definitions that are missing the required `define` keyword at the actual typo location.
- Mark DBREF literals as `literalType: 'dbref'` in the parser AST instead of treating them as strings.
- Restrict multiline `compose` continuation consumption to lines that really follow a trailing `$` continuation marker.
- Extend recovered `if`, `do`, and `handle` AST ranges to the definition boundary token when a closing keyword is missing.

### Improved

- Added parser mode plumbing from document URI/file extension for future context-aware command-style parsing.
- Added regression tests for missing `define function`, DBREF typing, compose continuation safety, and recovered block ranges.
- Revalidated the installed AVEVA PMLLIB corpus without changing the `v0.12.9` parser error baseline.

## [0.12.9] - 2026-05-09

### Fixed

- Improved parser recovery at method-definition boundaries for unterminated `if`, `do`, and `handle` blocks, preventing one local syntax issue from cascading into following object methods.
- Parsed PML DBREF literals such as `=0/0` on the right side of assignments.
- Consumed multiline `var ... compose ...` statements with `$` continuations and alignment fragments such as `Left spaces 2`.
- Treated additional object-file PML1 command lines as command-style statements: `at`, `auto`, `button`, `frame`, `function`, `limits`, `option`, `pin`, `pmlfunction`, `position`, `rename`, `savework`, `sppurp`, `text`, and `update`.

### Improved

- Added synthetic regression coverage for object-file toolbar declarations, PML1 command lines, DBREF literals, and multiline compose statements.
- Reduced installed AVEVA `.pmlobj` parser errors from 11007 to 2694 across 1334 files.
- The same recovery improvements also reduced installed `.pmlfnc` parser errors from 2852 to 1735 and `.pmlfrm` parser errors from 10980 to 3010.

## [0.12.8] - 2026-05-09

### Fixed

- Report malformed `setup command` controllers instead of silently consuming the rest of the file.
- Keep `$T<n>` trace control recognition narrow to `$T<n>+` and `$T<n>-`, so malformed `$T<n> = ...` assignments remain diagnostic.
- Avoid swallowing assignment-looking lines through the PDMS command starter whitelist.
- Show PDMS command hover for dollar-prefixed starters such as `$M`.
- Parsed optional `define function ... ) is TYPE` return types, including `FORM` and custom return type names.
- Parsed wildcard path arguments such as `/*MDS/CATA`.
- Parsed PML1 call argument phrases such as `u wrt /*` used in legacy geometry expressions.

### Improved

- Added negative regression tests for `setup command`, `$T<n>` trace controls, command-line assignment guards, indexed assignment recovery, chained call recovery, and `$M` hover.
- Rechecked the installed AVEVA PMLLIB corpus against `v0.12.6`; `.pmlfnc` parser regressions are reduced to zero while total `.pmlfnc` parser errors drop from 7707 to 2852.

## [0.12.7] - 2026-05-09

### Fixed

- Parsed `setup command ...` controller files without treating them as `setup form` definitions.
- Accepted `do !index indices !collection` loops used by AVEVA command controllers.
- Parsed indexed property assignments such as `!this.viewDirection[1] = 'SW'`.
- Parsed chained no-argument calls after member access, such as `!graphicalView.owner().clipBox.set()`.
- Ignored PML line-continuation `$` markers in method signatures and multi-line expressions.
- Accepted `/*` as a path/wildcard expression argument.
- Parsed chained `elsehandle` clauses in one `handle` block.
- Treated `$T8+`/`$T8-` trace control lines as command-style lines.

### Improved

- Expanded the PDMS command starter whitelist with command-style starters observed in the installed AVEVA E3D PMLLIB corpus: `$M`, `call`, `goto`, `kill`, `map`, `ori`, `pml`, `show`, `system`, `unenhance`, and `world`.
- Validated against `C:\Program Files (x86)\AVEVA\Everything3D2.10\PMLLIB` without copying proprietary AVEVA sources into the repository.
- Reduced parser errors across 698 installed `.pmlcmd` files from 1200 to 0.

## [0.12.6] - 2026-05-09

### Fixed

- Treated `exit` and `options` as AVEVA command-style lines inside methods without interfering with form/frame `exit` handling.
- Parsed `define(...)` as a PML built-in call when it appears inside expressions.
- Parsed dynamic substitute member access such as `!this.$!<name>.EditableGrid(false)`.
- Recovered nested pipe text fragments with non-ASCII text inside call arguments.

### Improved

- Reduced the `examples/test2form.pmlfrm` parser smoke baseline from 49 to 2 errors.
- Left the remaining `test2form.pmlfrm` errors as real fixture issues: a stray `endif` and missing `endmethod` in `.report()`.
- Added parser regression coverage for the new real-form syntax cases.

## [0.12.5] - 2026-05-09

### Fixed

- Parsed PML attribute member access after calls and variables, such as `!pipeRef.:IsoDrNo` and `!j.DbRef().:IsoDrNo = ||`.
- Parsed `inset (...)` comparisons used in form export logic.
- Kept pipe-string substitution fragments such as `|matchwild(:IsoDrNo, |$!fileName|)|` inside call arguments.
- Accepted `do !plot to $!isoCount` loop syntax.

### Improved

- Added `claim` to the PDMS command starter metadata.
- Reduced the `examples/test2form.pmlfrm` parser smoke baseline from 85 to 49 errors.
- Added parser regression coverage for the new real-form syntax cases.

## [0.12.4] - 2026-05-09

### Added

- Added opt-in `.pmlfrm` callback and gadget reference diagnostics via `pml.diagnostics.formReferences`.
- Report missing callback methods referenced from form callback assignments and gadget `call` modifiers.
- Report unknown `!this.<name>` references in form methods when the name is not a known method, member, frame, or gadget.

### Improved

- Kept form reference validation disabled by default and gated it behind zero parser errors to avoid cascade noise on partially supported form files.
- Documented the new form reference diagnostics setting in English and Russian README sections.
- Added regression coverage for missing callback targets, unknown gadget references, and valid nested gadget/member references.

## [0.12.3] - 2026-05-08

### Added

- Added nested `.pmlfrm` outline symbols for forms, frames, and gadgets.
- Preserved nested `frame ... exit` hierarchy in the parser AST instead of discarding child frames.

### Improved

- Indexed top-level form gadgets and nested frame gadgets for document symbol generation.
- Added regression coverage for `form -> frame -> nested frame/gadget` document symbols.

## [0.12.2] - 2026-05-08

### Fixed

- Parsed additional form gadget declarations used in real `.pmlfrm` files: `container`, `menu popup`, `para`, and `paragraph`.
- Recovered cleanly from draft member-access lines that end after a dot, such as `!k.`, without cascading parser errors.
- Accepted angle-bracket substitution expressions such as `$!<this.name>`.
- Kept same-line gadget modifiers such as `button .name ... toggle ...` from being mistaken for new gadget declarations.

### Improved

- Extended `.pmlfrm` smoke coverage to hidden real-world fixtures under `hide_examples/`.
- Reduced real fixture parser noise: `traExampleButtons.pmlfrm` and `equibasic.pmlfrm` now parse with zero errors.

## [0.12.1] - 2026-05-08

### Fixed

- Removed an accidental JavaScript snippet from `examples/ceposition.pmlfrm`, making it a zero-error form parser smoke fixture.
- Tightened form callback extraction so unrelated member names such as `recall` and `callRegistry` are not captured as callbacks.

### Improved

- Added `.pmlfrm` fixture smoke tests that parse `examples/*.pmlfrm` and enforce non-regression baselines.
- Updated `VERSIONING.md` so the documented `0.12.0` milestone matches the shipped form parser foundation.

## [0.12.0] - 2026-05-08

### Added - First-Class `.pmlfrm` Parser Foundation

- Added parser support for PML call chains where member access continues after a method call, such as `!this.link.Unset().Not()`.
- Parsed form-level member assignments like `!this.callback = '!this.init()'` as assignment expressions.
- Extracted callback bindings from form assignments such as `!this.callback`, `!this.Quitcall`, and `!this.wrt.callback`.
- Added support for nested `frame ... exit` blocks inside form definitions.
- Accepted numeric handle headers such as `handle (1000,0)` used around form imports.
- Added `import` and `using` to the command starter metadata for form/import workflows.

### Tests

- Added parser regression coverage for chained calls, form callback assignment extraction, nested frames, numeric handle headers, and `using namespace` command-style statements.

## [0.11.8] - 2026-05-08

### Fixed

- Suppressed PDMS command hover inside PML comments, including `--`, `$*`, and `$( ... $)` block comments.
- Stopped form-only tools after warning when the active file is not a `.pmlfrm` file.

### Improved

- Added VSIX packaging to GitHub Actions CI so packaging and `.vscodeignore` are checked before release.
- Documented the `pml.diagnostics.formErrors` setting in the README.

## [0.11.7] - 2026-05-08

### Added - PDMS Command Metadata

- Converted the PDMS command starter whitelist into categorized command metadata with short descriptions.
- Added hover help for whitelisted PDMS command starters when they are the first non-whitespace token on a line.
- Added regression tests for PDMS command metadata and line-start-only PDMS hover behavior.

### Added - Form Diagnostics Control

- Added `pml.diagnostics.formErrors` so `.pmlfrm` parser diagnostics can be enabled as warnings or errors while form DSL support matures.
- Made `.pmlfrm` detection case-insensitive in language-server and form tool paths.

### Improved - Maintenance

- Expanded GitHub Actions CI to run TypeScript compile, root lint, language-server lint, language-server tests, and bundled compile.
- Removed unused legacy client provider source files that are no longer imported by the extension entrypoint.
- Replaced version-specific VSIX install examples in `README.md` with a version-neutral filename pattern.

## [0.11.6] - 2026-05-08

### Improved - VSIX Asset Size

- Resized `icons/pml-icon.png` from 1024x1024 to 256x256, reducing the icon from 1.84 MB to about 95 KB.
- Reduced the packaged VSIX from about 2.02 MB to about 301 KB while preserving required runtime bundles and user-facing assets.

### Cleanup

- Removed obsolete commented-out legacy provider registration blocks from `src/extension.ts`.

## [0.11.5] - 2026-05-08

### Fixed - Post-Review Parser Hardening

- Limited PDMS command starter semantic highlighting to the first non-whitespace token on a line.
- Prevented whitelisted command words such as `add`, `move`, `new`, and `pos` from swallowing ordinary call, member, indexed, assignment, or `of` expressions.
- Tightened `$P` parser handling so `$P!arg` is no longer treated as a print line command without whitespace or end-of-line after `$P`.

### Improved - `$P` Print Tools

- Debounced print decoration refreshes and cached print scans per document version to avoid full-document rescans on every keystroke.
- Re-resolved hover command targets by original line text before comment/delete operations to reduce stale line-index risk.
- Extracted `$P` print-line scanning and comment/uncomment helpers into pure utilities with regression tests.
- Declared per-line print commands in `package.json` so they are visible to VS Code command/keybinding surfaces.

### Improved - Packaging and Documentation

- Tightened `.vscodeignore` so VSIX packaging ships only runtime bundles and required user-facing assets/examples.
- Documented `$P` print tools and the PDMS command starter whitelist in `README.md`.

## [0.11.4] - 2026-05-08

### Added - PDMS Command Compatibility

- Added a repository-maintained PDMS command starter whitelist in `packages/pml-language-server/src/data/pdmsCommands.ts`.
- Reused the whitelist in parser line-command handling so curated PDMS command lines are accepted without strict PML expression parsing.
- Highlighted PDMS command starters as keywords in semantic tokens.
- Seeded the whitelist with commands already observed in project files plus common examples such as `ADD`, `MOVE`, `Q`, and `BY`.

### Added - `$P` Print Tools

- Added full-line editor decorations for `$P ...` print/debug output lines.
- Added a status bar `$P` counter for the active file.
- Added hover-only print actions so print navigation and cleanup controls no longer add always-visible inline text.
- Added commands for next/previous print navigation, comment all prints, uncomment all commented prints, delete all prints, and per-line comment/delete from hover links.
- Ignored `$P` lines inside `$( ... $)` block comments for print decorations/actions.

### Tests

- Added parser regression coverage for whitelisted PDMS command starters.
- Added semantic token regression coverage for PDMS command starter highlighting.
- Validated language server tests, TypeScript builds, lint, bundled compile, VSIX packaging, and local VS Code/Cursor installation.

## [0.11.3] - 2026-05-07

### Fixed - Real PML Parser Coverage

- Added parser support for PML string concatenation with `&`.
- Accepted database path literals such as `/240000-АС14_Фр1`.
- Accepted database attribute expressions such as `:Шифр_комплекта_РД of $!site`.
- Accepted numeric literals with units such as `1mm`.
- Treated common AVEVA command lines (`GETWORK`, `trace`, `unlock`, `EXPORT`, `AUTOCOLOUR`, `REPRESENTATION`, `tolerance`, `SYSCOM`) as line commands.
- Accepted empty global function calls such as `!!autoColourgnp()`.
- Fixed bare `return` so it no longer consumes the next physical line as a return value.
- Ignored declaration tails such as `var !items collect all ...` instead of parsing the tail as a separate expression.

### Fixed - Comments and Highlighting

- Kept `$*` scoped to a single line in semantic highlighting.
- Added multi-line comment support for `$( ... $)` in the lexer, TextMate grammar, and semantic tokens.
- Highlighted `$P ...` output lines as a distinct output command for easier debug-output scans.

### Tests

- Added regression coverage for `proreport.pmlfnc`, `exportifczones.pmlfnc` patterns, bare `return`, block comments, `$*` comment scoping, and `$P` output highlighting.

## [0.11.2] - 2026-05-06

### Fixed - PML Variable Substitution

- Accepted variable substitution expressions such as `$!site`, `$!!global`, `$/attribute`, and `$identifier` as valid parser expressions.
- Kept malformed substitution tokens such as `$!` reported as parser errors.
- Added TextMate, semantic token, and editor word-pattern support so substitution variables are highlighted and selected as PML variables.

### Verified - Function Blocks

- Added regression coverage for `.pmlfnc`-style `define function !!name(...)` / `endfunction` blocks with typed parameters and nested statements.
- Confirmed existing folding and indentation rules already include `define function` and `endfunction`.

### Tests

- Added parser regression tests for substitution expressions, substitution assignment values, incomplete substitution errors, and typed function definitions.

## [0.11.1] - 2026-05-06

### Fixed - Form Parser & Refactoring Stability

- **Form gadget parsing** - Added robust parsing for `combo` gadgets and `track` callbacks.
  - Supports `width`/`wid`, `height`/`hei`, `tooltip`, `call`/`callback`, `pixmap`, and `at x<num>` modifiers.
  - Keeps modifiers scoped to the current gadget line to avoid consuming the next form element.
  - Preserves legacy inline width precedence for existing `text` and `option` declarations.

- **Rename and references** - Improved method reference discovery in callback strings and complex expressions.
  - Handles callbacks such as `|!this.refresh()|`, `|$/attr/sub.refresh|`, `$attr/sub`, and indexed expressions.
  - Deduplicates rename edits to avoid overlapping LSP `TextEdit` ranges.
  - Shares CRLF-safe offset conversion between references and rename providers.

- **Semantic tokens capability** - Removed unsupported `delta` capability field for compatibility with current LSP typings.

### Packaging

- Cleaned VSIX contents so local agent/config files are not published.
- Removed stray root file `-` from the repository package surface.

### Tests

- Added regression coverage for form modifiers, track callbacks, type keywords, empty forms, callback references, and rename behavior.

## [0.11.0] - 2026-01-06

### Added - New Features

- **Rename Symbol (F2)** - Workspace-wide symbol renaming
  - Rename methods, objects, forms, and variables across all files
  - Validates new name format for each symbol type
  - Methods: `.oldName` → `.newName`
  - Variables: `!oldVar` → `!newVar`, `!!globalVar` → `!!newGlobalVar`
  - Preview changes before applying

- **Semantic Highlighting** - Enhanced syntax highlighting via LSP
  - Variables (`!local`, `!!global`) highlighted distinctly
  - Method names (`.methodName`) with definition detection
  - Parameters in method signatures
  - Type keywords (STRING, REAL, BOOLEAN, ARRAY, DBREF)
  - Control flow keywords (if, do, handle, etc.)
  - Comments and string literals

- **Workspace Indexing Progress** - Visual feedback during startup
  - Progress bar shows "Indexed X/Y files" during workspace scan
  - Reports percentage completion
  - Final summary: "Indexed N files, M methods, K objects"

### Improved - Better Error Messages

- **Context-Aware Parser Errors** - Errors now include helpful suggestions
  - Array index errors: "PML arrays are 1-indexed. Use arr[1], not arr[0]"
  - Method syntax: "Method names must start with a dot: .myMethodName"
  - Missing keywords: "Did you mean 'define'?" for typos like 'defne'
  - Loop/condition context: "Every 'do' loop must end with 'enddo'"

### Removed - Dead Settings

- Removed non-functional `pml.typeInference.enabled` setting
- Removed non-functional `pml.inlayHints.enabled` and `pml.inlayHints.parameterNames`
- These features were never implemented; settings were confusing users

## [0.10.6] - 2026-01-04

### Fixed - Critical Parser & LSP Improvements

- **Full Method/Function Body Parsing** - Parser now properly parses statements inside methods/functions
  - Previously: Parser skipped all tokens until `endmethod`/`endfunction`, returning empty `body: []`
  - Now: Uses `parseStatement()` to build complete AST with all statements
  - Result: ArrayIndexChecker and semantic analyzers now work inside methods
  - Fixed 7 failing tests in parser.test.ts and arrayIndexChecker.test.ts

- **Workspace-Wide References from Disk** - References Provider now reads files from disk as fallback
  - Previously: Files not in LRU cache (100 files) and not open were silently skipped
  - Now: Falls back to `fs.readFileSync()` when file not cached or open
  - Result: Find All References (Shift+F12) finds all usages in entire workspace

- **File Watcher for Index Updates** - Added `onDidChangeWatchedFiles` handler
  - Previously: Index only updated at startup and for open files
  - Now: Files created/modified/deleted outside editor are automatically reindexed
  - Result: Go to Definition and Find References stay current with external changes

## [0.10.5] - 2025-11-29

### Added - Array Tools

- **Basic Array Command** - New "Basic Array" command in PML - Array menu
  - Converts plain text lines to array assignments without quotes or path prefixes
  - Input: `text1\ntext2\ntext3` → Output: `!list[1] = text1\n!list[2] = text2\n!list[3] = text3`
  - Automatically skips empty lines
  - Added as first option in PML - Array submenu

### Fixed - Parser Improvements

- **Method/Function Extraction** - Radical simplification of parser error recovery
  - Now extracts ALL method definitions even with syntax errors in method bodies
  - Skips method body parsing entirely, focuses on method signatures
  - Result: 10/10 methods found in complex forms (was 3-4/10)

- **Array Indexing Syntax** - Fixed parsing of array assignments
  - `!var[index] = value` now parses correctly (was showing "Expected expression" error)
  - Supports multi-dimensional arrays: `!var[i][j] = value`
  - Zero-based indices now valid: `!var[0] = value`

## [0.10.4] - 2025-02-02

### Fixed - TypeScript & Dependencies

- **TypeScript Errors** - Fixed 3 compilation errors
  - `parser.ts`: Added missing `operator: '='` field to `AssignmentExpression` return type
  - `server.ts`: Updated progress notification API from deprecated `'$/progress'` to `WorkDoneProgress.type`
  - Added `WorkDoneProgress` import from `vscode-languageserver/node`
  - Result: Clean TypeScript compilation with zero errors

- **Security Vulnerabilities** - Updated test dependencies
  - Upgraded `vitest` from 1.1.0 to 4.0.14 (latest)
  - Upgraded `@vitest/coverage-v8` from 1.1.0 to 4.0.14 (latest)
  - Fixed 5 moderate severity vulnerabilities in esbuild/vite chain
  - Result: `npm audit` shows 0 vulnerabilities
  - All tests passing: 68 tests (2 skipped)

## [0.10.3] - 2025-02-02

### Added - Major Features

- **Workspace-Wide References Search** - "Find All References" (Shift+F12) now searches across entire workspace
  - Previously limited to current file only
  - Now searches all indexed files in workspace
  - Uses LRU cache for fast performance (no additional I/O)
  - Supports methods, objects, and forms
  - Added object instantiation pattern: `OBJECT MyObject()`
  - Matches LSP standard behavior

### Fixed - Code Quality & Performance

- **Code Quality Improvements** (3 medium-priority fixes)
  - Menu conditions: Fixed VSCode `when` clause syntax - added quotes around file extensions
  - Async I/O: Converted `fs.readFileSync` to async `fs.readFile` in tutorial loaders
  - Hover path parsing: Improved cross-platform URI handling with regex

- **Workspace Indexing Improvements** (1 critical + 3 medium-priority fixes)
  - **Critical**: UNC path support - proper handling of `\\server\share` network paths
  - Path validation: Improved boundary checking (prevents `C:\proj1` vs `C:\proj10` false positives)
  - Memory limits: Added LRU cache with 100 files max to prevent memory growth
  - User exclusions: Implemented `pml.indexing.exclude` configuration support with glob patterns

### Improved - LSP Features

- **Type Safety** - Fixed diagnostics configuration type mismatch
  - Changed from boolean to string enum: `'off' | 'warning' | 'error'`
  - Users can now properly configure diagnostic severity levels
  - Added helpful `enumDescriptions` for VSCode UI

- **Progress Indicators** - Added workspace indexing progress notification
  - Shows "PML: Indexing workspace..." during startup
  - Displays completion status with file count
  - Better UX for large workspaces

## [0.10.2] - 2025-02-02

### Fixed - Critical Bugs

- **ReIndex & AddToArray Commands** - Fixed critical CRLF bug on Windows
  - Root cause: Windows line endings (`\r\n`) were not handled correctly
  - Commands were splitting by `\n` only, leaving `\r` at line ends
  - Regex patterns failed to match lines with trailing `\r`
  - Result: Only last line (without `\r`) was processed
  - **Fix**: Added `.replace(/\r/g, '')` before processing in both commands
  - Now works correctly on all platforms (Windows, Linux, macOS)

- **Empty Line Handling** - Improved selection trimming
  - ReIndex and AddToArray now trim empty lines at start/end of selection
  - Preserves intentional empty lines within array content
  - More forgiving user experience when selecting text

### Added - UI Enhancements

- **Context Menu Icons** - Added 20+ icons to commands
  - Sort commands: `$(sort-precedence)`, `$(text-size)`, `$(symbol-numeric)`
  - Duplicate removal: `$(chrome-minimize)`, `$(exclude)`
  - Whitespace: `$(dash)`, `$(whitespace)`, `$(remove)`
  - Extract: `$(symbol-variable)`, `$(symbol-method)`
  - Comments: `$(comment)`, `$(comment-unresolved)`
  - Forms: `$(refresh)`, `$(list-tree)`, `$(sync)`, `$(note)`
  - Examples: `$(circle-large-outline)`, `$(window)`
  - Icons visible in Command Palette (`Ctrl+Shift+P`)

### Improved - Documentation

- **LSP README** - Complete rewrite of `packages/pml-language-server/README.md`
  - Removed "Alpha" status - LSP is production-ready
  - Updated feature list: all implemented features marked ✅
  - Added performance metrics (startup, indexing, memory usage)
  - Documented configuration options
  - Added known limitations section
  - Removed outdated TODO items

### Fixed - Code Quality (P0/P1)

- **Error Typing** - Fixed untyped errors in 4 locations
  - `src/tools.ts`: Button/Frame Gadgets loaders
  - `packages/pml-language-server/src/server.ts`: workspace indexing, parser crashes
  - Changed `catch (error)` → `catch (error: unknown)` with proper type guards

- **Documentation Links** - Fixed broken references
  - `CONTRIBUTING.md`: Removed links to non-existent files
  - `README.md`: Fixed `changelog.md` → `CHANGELOG.md` (case sensitive)
  - Updated references to point to existing documentation

- **Repository Hygiene** - Cleaned up git tracking
  - Removed outdated TODO comments
  - Added `ARCHITECTURE_ANALYSIS.md` to repository
  - Cleaned up test file artifacts

### Changed - Code Cleanup

- **Debug Logging** - Removed console.log statements from production code
  - Cleaned up ReIndex and AddToArray debug logs
  - Keeps codebase cleaner and reduces console noise

## [0.10.1] - 2025-02-01

### Fixed - Documentation

- **README.md** - Fixed encoding issues in Russian section
- **packages/pml-language-server/README.md** - Complete rewrite to reflect current LSP implementation
- **ROADMAP.md** - Simplified by removing detailed version history (moved to CHANGELOG)
- **CONTRIBUTING.md** - Fixed broken links to non-existent files
- **V1.0_PLAN.md** - Fixed encoding and translated to English
- **objects/README.md** - Fixed encoding issues

### Added - Documentation

- **Architecture** - Added `.editorconfig` for standardized formatting
- **Security** - Documented path traversal protection in ARCHITECTURE_ANALYSIS.md

## [0.10.0] - 2025-01-31

### Added - Frame Gadgets Support

- **Frame Gadgets Snippets** - 9 new snippets for all frame types
  - `frame` - Normal frame container with border
  - `frameat` - Frame at specific position
  - `frametabset` - TabSet with multiple tabbed pages
  - `frametoolbar` - Toolbar frame (main forms only)
  - `framepanel` - Panel frame without visible border
  - `framepanelindent` - Panel frame with 3D indent
  - `framefoldup` - Fold-up panel (expandable/collapsible)
  - `framefoldupbg` - Fold-up panel with background color
  - `frameradio` - Radio button group with RTOGGLE gadgets

- **Frame Gadgets Tutorial** - Comprehensive documentation
  - Quick reference for all frame types
  - Complete example forms with nested frames
  - Members & methods reference tables
  - Detailed sections for each of 5 frame types
  - Best practices and FAQ (9 questions)
  - Available via: PML - Examples, FAQ → Frame Gadgets

- **V1.0 Planning Document** - Created detailed roadmap
  - 6 phases to production release
  - Timeline: 12-20 weeks (Q3 2025 target)
  - Criteria for 1.0.0: Stable, Tested (>80%), Documented, Community-ready
  - Current progress: ~75%

- **LSP Configuration Settings** - Exposed server settings in UI
  - `pml.typeInference.enabled` - Toggle type inference
  - `pml.inlayHints.enabled` - Show/hide inlay hints
  - `pml.inlayHints.parameterNames` - Parameter name hints
  - `pml.diagnostics.typeChecking` - Type checking diagnostics
  - `pml.diagnostics.unusedVariables` - Unused variable warnings
  - `pml.diagnostics.arrayIndexZero` - Warn on 0-based array indices
  - `pml.indexing.exclude` - Configure files to exclude from indexing

### Improved - VSIX Package Size

- **Reduced Package Size** - Excluded development files
  - `hide_examples/**` excluded (~458 KB of training materials)
  - `objects/**` excluded (~133 KB of knowledge base)
  - Only essential tutorial files included (examples/gadgets/)
  - **Result**: 2.08 MB (44 files) vs 2.38 MB (77 files) - 300 KB smaller (12.6% reduction)

### Fixed - Tutorial Files and Array Commands

- **VSIX Include** - Tutorials now packaged correctly
  - Updated .vscodeignore to include examples/gadgets/**
  - ButtonGadgets_Tutorial.md and FrameGadgets_Tutorial.md now in VSIX
  - Fixes "ENOENT: no such file or directory" error

- **Array Commands** - Improved regex handling
  - Fixed Add to Array for string arrays (e.g., `!items[1] = 'value'`)
  - Fixed ReIndex for path arrays (e.g., `!paths[1] = /path/to/file`)
  - Added .trim() to value detection before format checking

## [0.9.9] - 2025-01-29

### Added - Method Documentation and Comment Tools

- **Insert Method Documentation Block** - New command for AVEVA-standard documentation
  - Inserts documentation template above method definitions
  - Auto-fills method name
  - Preserves indentation
  - Cursor positioned at Description field for quick editing
  - Format includes Method, Description, Method Type, Arguments, Return sections
  - Works with .pml, .pmlobj, .pmlfnc, .pmlfrm, .pmlmac, .pmlcmd files

### Fixed - F12 (Go to Definition) for All Patterns

- **Complete F12 fix** - Now works on all method call patterns
  - Fixed `!var.method()` pattern (e.g., `!a.calculateSum()`)
  - Fixed `!this.method()` pattern
  - Added `isStopChar()` to stop word expansion at special characters
  - Added check for dot within captured word
  - Extracts method name after last dot correctly

- **Hover provider** - Same fixes applied
  - Works on `!var.method()` patterns
  - Shows documentation for all method call styles

### Fixed - Parser Skip Statement Support

- **`skip` keyword support** - Added SKIP token to lexer
  - Parser recognizes `skip` as continue statement
  - No more false warnings on plain `skip`

- **`skip if` conditional** - Parser handles skip with condition
  - `skip if(condition)` works without `then` keyword (unlike regular `if`)
  - Fixed "Expected 'then' after if condition" error
  - Fixed "Expected expression" error on following line
  - Uses `ContinueStatement` AST node (skip = continue in PML)

### Improved - Comment Commands (Line-Based)

- **Add Comments** - Now works line-based instead of selection-based
  - Cursor can be anywhere in line (beginning, middle, end)
  - Partial multi-line selection comments all touched lines
  - Adds `--` after indentation (preserves formatting)
  - Empty lines skipped

- **Remove Comments** - Same line-based behavior
  - Removes `--` or `$*` from start of lines
  - Works on partial selections
  - Preserves code after comment marker

## [0.9.8] - 2025-01-29

### Fixed - Go to Definition and Documentation

- **F12 (Go to Definition)** - Now works correctly on methods
  - Fixed word boundary detection to include dot (`.`)
  - Can now navigate to `.methodName()` definitions
  - Works across files with workspace indexing

- **Hover Documentation (Shift + mouse)** - Shows method documentation
  - Added support for AVEVA-style `$p` marker (e.g., `$p Constructor Method`)
  - Extracts comments from `--` and `$p` lines
  - Displays method signature and location
  - Enhanced `commentExtractor.ts` to recognize `$p` markers

- **Form Documentation** - Auto-generation tools
  - `formheader` snippet - Insert form header template with metadata
  - "Generate Methods Summary" command - Creates table from method comments
  - "Update Methods Summary" command - Refreshes existing table
  - Parses `$p` markers and standard comments
  - AVEVA-compatible formatting

### Removed - Dead Code

- **src/diagnostics.ts** - Removed obsolete file
  - All diagnostics moved to language server in v0.8.0
  - File was not referenced anywhere
  - Cleaned up repository structure

### Changed - Documentation

- **Release Documentation** - Updated for 0.9.x workflow
  - `.github/RELEASE_CHECKLIST.md` - Updated examples to 0.9.x
  - `.github/RELEASE_COMMANDS.md` - Updated to use `npm run pack:install`
  - Added VSIX storage policy (only latest in repo, historical in GitHub Releases)
  - Confirmed UTF-8 encoding (files were already correct)

- **ROADMAP.md** - Synchronized with current release
  - Version updated to 0.9.7
  - Added form documentation features
  - Added test coverage limitations note
  - Recent changes section updated

**VSIX Storage Policy:**
- Repository now contains only ONE VSIX file (latest version)
- Historical versions available in GitHub Releases
- Download old versions from: https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases

## [0.9.7] - 2025-01-29

### Changed - IntelliSense for Forms

- **Form Files (.pmlfrm)** - IntelliSense improvements
  - Removed all built-in methods from completion (cos, delete, query, etc.)
  - Now shows ONLY methods defined in the current form
  - Cleaner, more relevant suggestions
  - Preparation for future form-specific enhancements

**Before:**
```pml
!this.  → shows: cos, delete, query, upcase, lowcase, etc. (30+ methods)
```

**After:**
```pml
!this.  → shows: only .initCall, .buildForm, etc. (methods in THIS form)
```

**Note:** Built-in methods still available in regular .pml files

## [0.9.6] - 2025-01-29

### Changed - UX Improvements

- **Comment Commands** - Now work without selection
  - Add/Remove Comments work on current line if nothing is selected
  - Cursor can be anywhere in the line
  - More convenient workflow

- **Code Actions (Ctrl+.)** - Simplified to comments only
  - ❌ Removed all PML commands (sort, array, cleanup)
  - ✅ Add Comments
  - ✅ Remove Comments
  - Focused Quick Fix menu

- **Context Menu "Quick Action PML"** - Full command set
  - Renamed from "Quick Actions" to "Quick Action PML"
  - Now contains ALL toolbar commands:
    - Sort (4 commands)
    - Duplicates (2 commands)
    - Whitespace (5 commands)
    - Extract (2 commands)
    - Align (1 command)
    - Comments (2 commands)
    - Forms submenu
    - Array submenu
  - Single comprehensive menu for all PML operations

### Removed

- **Column Generator** - Removed (replaced by external extension)
  - Deleted command from package.json
  - Deleted implementation from tools.ts
  - Users can use dedicated column editing extensions

**Menu Structure:**
- Code Actions (💡) = Comment operations only
- Context Menu → Quick Action PML = All PML commands
- Toolbar Button = All PML commands

## [0.9.5] - 2025-01-29

### Changed - Menu Reorganization

- **Quick Fix Menu (💡 Lightbulb)** - Simplified to comment commands only
  - ✅ Add Comments
  - ✅ Remove Comments
  - ❌ Removed all array commands (moved to dedicated menus)

- **Context Menu (Right-Click)** - Added Array submenu
  - ✅ Quick Actions → Add/Remove Comments
  - ✅ Array → Make List (Path), Make List (String), Make List (Path String)

- **Toolbar Button (PML Tools)** - Added Array submenu
  - ✅ All sort, cleanup, comment, align commands
  - ✅ Array submenu restored
  - ✅ Forms submenu

**Menu Philosophy:**
- Quick Fix (💡) = Quick comment actions only
- Context Menu = Array operations + Quick Actions
- Toolbar Button = Full toolset including arrays

## [0.9.4] - 2025-01-28

### Fixed - Menu Configuration

- **Context Menu** - Corrected menu structure per user requirements
  - Previous behavior (v0.9.1): Removed all commands from context menu, kept array commands in toolbar
  - Correct behavior: Keep Quick PML Action in context menu (including array commands), remove array submenu from toolbar button
  - **Context menu** (right-click): Now shows "Quick Actions" with all commands including array operations
  - **Toolbar button** (PML Tools): Now excludes array submenu - only shows sort, cleanup, comment, align, and form commands
  - User can access array commands via context menu Quick Actions

**Menu Structure:**
- Context Menu → Quick Actions → Array commands (✅ restored)
- Toolbar Button → Array submenu (❌ removed)

## [0.9.3] - 2025-01-28

### Fixed - Remove Comments

- **Remove Comments** - Now correctly removes only comment prefixes (`--` and `$*`)
  - Previous behavior: Deleted entire lines after comment marker
  - New behavior: Removes only the comment prefix, preserves code
  - Preserves indentation
  - Lines remain intact

**Example:**
```pml
Before:                    After:
-- !var = value    →      !var = value
    -- !nested     →          !nested
$* comment line    →      comment line
```

## [0.9.2] - 2025-01-28

### Added - Column Generator

- **Column Generator** - Insert text or sequential numbers across multiple lines
  - **Text Mode**: Insert the same text at cursor position on each selected line
  - **Number Mode**: Insert sequential numbers with customizable:
    - Starting number
    - Increment value
    - Format: Decimal, Hexadecimal, Binary, Octal
  - Interactive dialogs for easy configuration
  - Works like Notepad++ Column Editor

**Usage:**
1. Select multiple lines (or place cursor at same column)
2. Run "Column Generator" from PML Tools menu
3. Choose mode and configure options
4. Numbers/text inserted at cursor position on each line

## [0.9.1] - 2025-01-28

### Changed - UI/UX Improvements

- **Context Menu Cleanup**
  - Removed all PML Tools commands from context menu (right-click)
  - Commands remain accessible via editor title bar button (top toolbar)
  - Cleaner, less cluttered context menu experience

### Added - New Commands

- **Add Comments** - Adds `--` comment prefix to selected lines
  - Preserves indentation
  - Skips empty lines
  - Available in PML Tools menu

- **Align PML** - Intelligently aligns code by operators or keywords
  - Aligns by `=` operator: `!var = value` → all `=` aligned
  - Aligns by `is` keyword: `member .name is TYPE` → all `is` aligned
  - Auto-detects alignment target
  - Available in PML Tools menu

### Fixed - Command Functionality

- Fixed "Remove Duplicate Lines" command
- Fixed "Remove Empty Lines" command
- Fixed "Trim Whitespace" command
- All whitespace/cleanup commands now work correctly

## [0.9.0] - 2025-01-28

### Added - Form Syntax Support (Basic Implementation)

- **Parser: Form Structure Recognition**
  - Parse `setup form !!name ... exit` structure
  - Support form modifiers: `DIALOG`, `MAIN`, `DOCUMENT`, `BLOCKINGDIALOG`
  - Support `RESIZABLE` modifier
  - Support `DOCK LEFT|RIGHT|TOP|BOTTOM` positioning
  - Extended FormDefinition AST with `formType`, `resizable`, `dock`, and `body` properties

- **Parser: Gadget Declarations**
  - Parse `button .name |Label| [OK|CANCEL|APPLY|RESET] [at x<num>]`
  - Parse `text .name |width| [at x<num>]`
  - Parse `option .name |width| |Label| [at x<num>]`
  - Parse `toggle .name |Label| [at x<num>]`
  - Parse `frame .name` with nested gadgets
  - New GadgetDeclaration AST node with label, modifier, position, width properties

- **Parser: Member Declarations**
  - Parse `member .name is TYPE` syntax
  - Support all PML types: STRING, REAL, INTEGER, BOOLEAN, ARRAY, DBREF
  - New MemberDeclaration AST node

- **Tokens: Form-Related Keywords**
  - Added tokens: `OPTION`, `TOGGLE`, `MAIN`, `DOCUMENT`, `BLOCKINGDIALOG`
  - Added tokens: `RESIZABLE`, `DOCK`, `LEFT`, `RIGHT`, `TOP`, `BOTTOM`
  - Added tokens: `OK`, `CANCEL`, `APPLY`, `RESET`
  - All form keywords now properly recognized by lexer

- **Diagnostics: Array Index Checker Tests**
  - Comprehensive test suite with 30 tests for arrayIndexChecker
  - Fixed critical bug: changed `varDecl.init` to `varDecl.initializer`
  - 100% test pass rate (30/30 tests passing)
  - Tests cover: basic detection, valid indices, method bodies, control flow, expressions, edge cases

### Technical Notes

- `.pmlfrm` files now parse without errors for basic form structures
- Form callbacks (`!this.formTitle`, `!this.initCall`, etc.) parsed as regular assignments
- Graceful degradation for complex form features (layout, advanced gadgets)
- Foundation ready for IntelliSense and diagnostic enhancements

### Known Limitations

- No IntelliSense for form callbacks yet (planned)
- No gadget type completion yet (planned)
- No callback method validation yet (planned)
- No snippets for forms yet (planned)
- Complex gadgets (VIEW, ALPHA, LIST, TREE) not implemented
- Layout system (Path, Dist, Align) not implemented

## [0.8.8] - 2025-01-28

### Fixed
- **Parser Tests: Resolved All Test Failures**
  - Fixed 2 failing parser tests by removing stale compiled files
  - Deleted old `.js` and `.js.map` files from `src/` directory that were causing vitest to load outdated code
  - All 20 comprehensive parser tests now passing
  - Tests cover method definitions, variable declarations, expressions, control flow, member expressions, call expressions, array access, error recovery

### Updated
- **Testing: Enhanced Test Suite**
  - 38 tests now passing (20 parser + 18 typo detector), 2 skipped
  - Updated typo detector test expectations to accept "all" as valid suggestion for "adn"
  - Comprehensive coverage for all major PML constructs

- **ROADMAP.md: Parser Tests Completion**
  - Marked parser tests as completed (High Priority task)
  - Updated to v0.8.8 development version
  - Updated test statistics and known limitations

### Technical Details
- Root cause: TypeScript compilation was outputting `.js` files to `src/` instead of only `out/`
- Vitest module resolver prioritized `.js` files over `.ts` transformation
- October 19 compiled files vs October 28 source = test failures
- Solution: Cleaned all stale compiled files from source tree

## [0.8.7] - 2025-01-28

### Fixed
- **Documentation: Updated Outdated Comments**
  - `typoDetector.ts`: Header now says "PARSE-ERROR-BASED" instead of "AST-BASED"
  - `server.ts`: Comment now reflects typo detection is functional (not disabled)
  - Added algorithm description to typoDetector header

- **Diagnostics: English Translation** - Translated Russian text in `src/diagnostics.ts`
  - All comments and error messages now in English
  - Improved maintainability for international contributors
  - File ready for use if legacy VS Code diagnostics path is needed

- **Typo Detection: Enhanced Keyword Loading**
  - Now loads 75+ keywords dynamically from `tokens.ts` (previously hardcoded 40)
  - Includes all recent keyword additions (`function`, `endfunction`, `by`, `var`, etc.)
  - Automatic updates when new keywords added to lexer
  - No more manual keyword list maintenance

- **Typo Detection: Windows Line Ending Support**
  - Fixed line splitting to handle CRLF (`\r\n`) correctly
  - Changed from `split('\n')` to `split(/\r?\n/)`
  - Prevents stray `\r` characters from shifting highlight ranges

- **Typo Detection: Improved Matching Algorithm**
  - Smart scoring: prefers keywords with similar length and minimal edit distance
  - Better suggestions when multiple keywords have same Levenshtein distance
  - Only reports first typo per line to avoid spam
  - Tracks reported lines to prevent duplicate diagnostics

### Added
- **Testing: Comprehensive Typo Detection Test Suite**
  - 36 passing tests covering keyword typos, operators, control flow
  - Edge case coverage: Windows line endings, multiple typos, error handling
  - False positive prevention validation
  - Tests for methdo→method, endobjet→endobject, iff→if, whiel→while, etc.
  - 2 tests skipped due to vitest module loading issue (production code unaffected)

### Updated
- **ROADMAP.md: Synchronized with Current State**
  - Updated version to 0.8.7, release date to 2025-01-28
  - Consolidated typo detection evolution across versions
  - Added v0.8.0 - v0.8.7 completed releases section
  - Updated statistics: 2.07 MB size, 54 files, test coverage details
  - Changed diagnostics description from "AST-based" to "parse-error-based"
  - Updated known limitations to reflect test coverage status
  - Documented all parser fixes and performance improvements

- **Changelog Consolidation**
  - Deleted duplicate RELEASE_NOTES_v0.7.x and v0.8.x files
  - Maintained single authoritative source in CHANGELOG.md
  - Archived older versions (0.5.x, 0.6.0) to keep file manageable

## [0.8.6] - 2025-01-28

### Added
- **Typo Detection: Restored Functionality** - Now actively detects typos when enabled
  - Analyzes parser errors to identify potential keyword typos
  - Uses Levenshtein distance algorithm to find similar keywords
  - Suggests corrections for common misspellings (e.g., "iff" → "if", "doo" → "do", "endiff" → "endif")
  - Only checks tokens that caused parse errors, avoiding false positives
  - Works when `pml.diagnostics.typoDetection` is set to `"warning"` (default: `"off"`)

### Implementation Details
- **Smart Detection Algorithm:**
  - Checks 40+ PML keywords (control flow, definitions, types, operators)
  - Distance threshold: 1-2 character differences
  - Length filtering: skips words with >3 character length difference
  - Precise error ranges: highlights exact typo location when possible

### Changed
- `detectTypos()` signature: now accepts `ParseError[]` instead of `Program`
- Updated server.ts to pass `parseResult.errors` to typo detector

## [0.8.5] - 2025-01-28

### Fixed
- **Settings: Typo Detection Default** - Synchronized server default with package.json
  - `defaultSettings.diagnostics.typoDetection` now set to `'off'` (was `'warning'`)
  - Matches package.json default which was already `"off"`
  - Eliminates misleading behavior where setting appeared to be `'warning'` but `detectTypos()` returns empty array

## [0.8.4] - 2025-01-28

### Fixed
- **Parser: Method Call Expressions** - Fixed parsing of method calls in parenthesized expressions
  - Root cause: lexer creates METHOD token `.eq`, but parser was only checking after consuming DOT token
  - Solution: handle METHOD tokens directly in `parseMember()` before DOT tokens
  - Fixes: `if (!type.eq(|number|)) then` now parses correctly

- **Parser: Nested Elseif Endif Pairing** - Fixed endif consumption in recursive elseif parsing
  - Root cause: recursive `parseIfStatement()` calls were each consuming the shared endif token
  - Solution: only consume endif when NOT handling elseif recursively
  - Fixes: complex if-elseif-elseif-else-endif chains now parse correctly

- **Parser: Compose Expression Completeness** - Extended compose keyword workaround
  - Now consumes SUBSTITUTE_VAR ($!var) and STRING (|text|) tokens
  - Fixes: `var !x compose space $!y |END|` now parses without errors

### Test Results
- ✅ test_elseif.pml: 5 parse errors → 0 parse errors

## [0.8.3] - 2025-01-24

### Fixed
- **Settings: Typo Detection** - Changed default from `warning` to `off`
  - Transparent behavior: setting now matches actual functionality
  - Clear documentation: "CURRENTLY DISABLED - parser catches syntax errors instead"

- **Documentation Extraction** - Fixed for opened documents
  - `workspaceIndexer.indexDocument()` now passes document text to `symbolIndex`
  - Hover documentation now works for opened files

## [0.8.2] - 2025-01-24

### Fixed
- **Parser: Compose Keyword Workaround** - Handle PML1 `compose` syntax
  - Parser accepts `compose` as special keyword (though not a strict operator)
  - Workaround: skip `compose` token when encountered
  - Fixes: `var !x compose space ...` now parses without errors

- **Parser: Method Call After Dot** - Accept operator names as method identifiers
  - Methods like `.eq()`, `.ne()`, `.gt()` now recognized as valid calls
  - Parser checks for METHOD token (lexer creates `.eq` as single token)
  - Fixes parsing errors when operator names used as method names

- **Parser: Nested Elseif** - Accept ELSEIF token in conditional parsing
  - Added ELSEIF to expected tokens in `parseIfStatement()`
  - Fixes: `if ... then ... elseif ... then ... endif` now parses correctly

### Test Results
- ✅ test_compose.pml: 2 parse errors → 0 parse errors

## [0.8.1] - 2025-01-24

### Fixed
- **Memory Leak** - Removed unused `documentASTs` Map
  - Was storing every parsed AST indefinitely
  - Memory usage grew unbounded as files were opened
  - Solution: removed cache entirely - providers already use `symbolIndex`

- **Typo Detector Simplification** - Reduced from 191 to 30 lines
  - Parser already catches actual syntax errors
  - Removed complex regex-based text scanning (source of false positives)
  - Default behavior: returns empty array (disabled)

- **Async Workspace Indexing** - Converted to non-blocking operations
  - Changed from synchronous `fs.readdirSync` to async `fs.readdir`
  - Changed from synchronous `fs.readFileSync` to async `fs.readFile`
  - Fixes extension freezing on large projects during startup

## [0.8.0] - 2025-01-24

### Added
- **Code Bundling with esbuild** - Dramatically reduced extension size
  - Extension size: 15.61 MB → **2.07 MB** (7.5x smaller)
  - Files in VSIX: 1,632 → **54 files** (30x fewer)
  - Load time: ~2-3s → **~0.5s** (4-6x faster)

### Features
- ⚡ **Faster Activation** - Extension loads significantly quicker
- 💾 **Smaller Download** - 7.5x smaller VSIX package
- 🚀 **Better Performance** - Reduced I/O operations
- 📦 **Cleaner Installation** - Only bundled code, no source files

### Technical
- Added `esbuild.js` configuration
- Dual entry points: extension + language server
- Production minification with source maps
- Updated `.vscodeignore` for optimal bundling

## [0.7.3] - 2025-01-24

### Fixed
- **Typo Detection Overhaul** - Eliminated false positive warnings
  - Completely rewrote typo detector to use AST-based checking
  - No more warnings like "Possible typo: 'OK'" or "Possible typo: 'at'"
  - Only checks keywords in specific language structures (methods, if statements, etc.)
  - Arbitrary identifiers (UI labels, variable names) are no longer flagged
  - Disabled typo detection for `.pmlfrm` files (form syntax is special)
  - Parser now reuses already-built AST instead of re-parsing text

### Improved
- **Performance** - Validation is faster due to AST reuse
- **Form Files** - Better handling of `.pmlfrm` files with reduced noise

## [0.7.2] - 2025-01-24

### Fixed
- **Go to Definition (F12)** - Now works correctly for method calls
  - Fixed word boundary detection in definitionProvider
  - Removed dot from `isWordChar()` regex
  - F12 now works for `!var.methodName()` pattern

- **Hover Documentation** - Now displays correctly
  - Fixed word boundary detection in hoverProvider
  - Removed dot from `isWordChar()` regex
  - Hover over method name shows documentation from comments

## [0.7.1] - 2025-01-24

### Added
- **Comparison Operator Aliases**
  - Added `geq` as alias for `ge` (greater than or equal)
  - Added `leq` as alias for `le` (less than or equal)
  - `neq` already supported as alias for `ne`
  - No more false positive typo warnings

### Fixed
- **Completion Provider Filtering** - Better IntelliSense
  - After typing `.` only methods from current document shown
  - Prevents pollution from workspace methods
  - Built-in methods still available

## [0.7.0] - 2025-01-24

### Added
- **Method Return Type Support** - Parser accepts return type declarations
  - Syntax: `define method .name(!param is TYPE) is RETURN_TYPE`
  - Return type stored in AST and used for documentation

- **Method Documentation from Comments** - Automatic extraction
  - Comments before method definition shown in hover tooltips
  - Supports multi-line comments (all `--` lines before method)
  - JSDoc-style parameter documentation: `-- @param1 - description`

- **Find All References** - Shift+F12 works within current file
  - Shows all usages of method in current document
  - Finds both `.methodName()` and `!var.methodName()` patterns
  - Works alongside Go to Definition (F12)

### Fixed
- **Go to Definition (F12)** - Now works for method calls in same file
  - Fixed detection of method calls after dot
  - Works for all method call patterns

---

## Historical Releases (0.4.8 - 0.6.0)

<details>
<summary>Click to expand older versions</summary>

### [0.6.0] - 2025-01-21
- Added OF operator support for attribute access
- Auto-indentation for function blocks
- Typo detector improvements (skip single-char identifiers)

### [0.5.9] - 2025-01-21
- Function definition support (`define function...endfunction`)
- Reduced typo detector false positives

### [0.5.8] - 2025-01-21
- Sort Methods command (A→Z, Z→A)
- Context-aware completions in forms

### [0.5.7] - 2025-01-21
- Documentation for built-in methods (STRING, REAL, ARRAY, DBREF)
- Method signature help in hover tooltips

### [0.5.6] - 2025-01-21
- Object definition support
- Backslash handling for Windows paths
- VSIX packaging improvements

### [0.5.5] - 2025-01-20
- Array index checker (warn on arr[0])
- MemberExpression fixes
- Documentation cleanup

### [0.5.4] - 2025-01-20
- Typo detection with Levenshtein distance
- Parser improvements

### [0.5.3] - 2025-01-20
- Parser error recovery improvements
- Handle statement support

### [0.5.2] - 2025-01-20
- Form file support improvements
- Object constructor syntax

### [0.5.1] - 2025-01-18
- Critical fix for LSP server in production
- Bundled knowledge base into VSIX

### [0.5.0] - 2025-01-17
- Full Language Server Protocol (LSP) implementation
- Real-time diagnostics
- Workspace indexing
- IntelliSense and autocomplete

### [0.4.8] - 2024-12-XX
- Initial code actions and quick fixes
- Basic IntelliSense
- Signature help

</details>

---

**Version Format:** [Semantic Versioning](https://semver.org/)
