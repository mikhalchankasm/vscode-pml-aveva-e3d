# Release Notes

This file is the short release snapshot for the current public build. Full historical details live in [CHANGELOG.md](CHANGELOG.md), and downloadable VSIX artifacts live in [GitHub Releases](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases).

## Current Release - v0.12.32

**Release Date:** 2026-05-18

**GitHub Release:** [v0.12.32](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/tag/v0.12.32)

### What Changed

- Fixed Find References handling for `includeDeclaration: false` so definition lines are not returned in reference-only results.
- Avoided double-counting method declarations in public Find References results when `includeDeclaration: true`.
- Ignored method references inside `--`, `$*`, `$( ... $)` comments, and regular quoted strings during Find References and method Rename while preserving pipe-delimited callback references.
- Prevented object, form, and variable Rename from editing comments or string literals, including pipe-delimited strings.
- Renamed form references inside pipe-delimited callback targets such as `|!!OtherForm.show()|` while still leaving non-callback pipe strings untouched.
- Improved Outline navigation for `.pmlobj` files by showing object-contained methods as top-level method entries while preserving nested object symbols.
- Added regression coverage so `.pmlcmd` files expose method symbols after `setup command` sections.
- Added parser, workspace-index, completion, and references performance budget guards for large generated files and 100-file workspace models.
- Reduced repeated regex setup during workspace Find References scans by caching reference-search patterns per symbol.
- Added regression coverage for reference pattern cache reuse, cache eviction, declaration filtering, empty-symbol guards, and member-declaration word boundaries.
- Shared method-reference pattern construction between Find References and Rename to keep callback/member-path matching rules aligned.
- Hardened release automation so Marketplace publication requires an explicit workflow-dispatch approval flag.
- Added release-workflow TypeScript and language-server test gates before tag creation and release publication.
- Moved automated release tag creation until after successful packaging and release-note checksum substitution.
- Cleaned local packaging behavior so stale VSIX checksum files are removed before a fresh package is built.
- Clarified opt-in typo diagnostic wording and removed minor release/packaging hygiene issues.

### Validation

- Bundled compile: passed.
- TypeScript compile: passed.
- Language server tests: 198 passed, 3 skipped by default.
- VSIX packaging: passed; `pml-aveva-e3d-0.12.32.vsix` contains 15 files.
- VSIX smoke-check: passed; manifest/package identity match `mikhalchankasm.pml-aveva-e3d` v0.12.32 and no blocked source/config directories are included.
- Local VS Code/Cursor install: passed with `npm run pack:install`.

### Assets

- VSIX: `pml-aveva-e3d-0.12.32.vsix`
<!-- GitHub Actions replaces this placeholder with the CI-built VSIX checksum when publishing the release. -->
- SHA256: `computed by GitHub Actions`

## Active Release Track

### v0.12.x - Form Parser Foundation

- `.pmlfrm` parser support is the active focus.
- Current coverage includes chained method calls, callback assignments, nested frames, form outline metadata, guarded callback/gadget reference diagnostics, PML attribute member access, dynamic substitute member access, import wrappers, additional form gadgets, command-controller syntax, and fixture/corpus smoke tests.
- Remaining parser work includes broader PML.NET form patterns, more PML1 command forms in `.pmlfrm`/`.pmlobj`/`.pmlfnc`, and deciding whether to repair or exclude intentionally broken fixture snippets.

### v0.11.x - Parser Hardening and Print Tools

- Added `$P` print/debug tools, PDMS command starter metadata, command hover, packaging cleanup, and parser compatibility fixes for real PML/PMLFNC files.
- This track is considered stable unless regressions are reported.

## Next Planned Work

1. Continue `v0.12.x` by mining the installed AVEVA PMLLIB corpus for high-frequency `.pmlfrm`, `.pmlobj`, and `.pmlfnc` parser gaps.
2. Preserve low-noise defaults for `.pmlfrm` diagnostics while expanding parser coverage.
3. After form parsing stabilizes, move references/rename toward AST/index-based lookup.

For full history, see [CHANGELOG.md](CHANGELOG.md).
