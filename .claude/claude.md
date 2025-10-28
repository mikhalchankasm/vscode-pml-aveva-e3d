# Claude Collaboration Guide

## Purpose
- Keep language consistent and understandable when directing Claude.
- Provide the minimum context Claude needs to work safely and efficiently.
- Ensure every change is validated before it is shared or released.

## Repository Quick Map
- `src/`: VS Code extension client (commands, UI helpers, activation logic).
- `packages/pml-language-server/src/`: TypeScript language server (parser, diagnostics, providers).
- `examples/`: Sample PML files used for manual testing.
- `out/`: Generated build artefacts (never edit manually).
- `assets/`, `icons/`, `snippets/`, `syntaxes/`: User-facing resources; keep filenames and formats stable.

## Coding Standards & Constraints
- TypeScript only; follow existing module structure and prefer pure functions.
- Reuse helper utilities (`packages/pml-language-server/src/utils`) before adding new ones.
- Comments should explain intent, not restate code. Avoid adding Russian text—use English throughout.
- Do not add runtime dependencies without prior approval; devDependencies require justification.
- Maintain ASCII unless the file already uses Unicode characters for good reason.
- Keep diffs focused: group related changes, avoid drive-by refactors.

## Testing & Validation
- Baseline compile: `npm run compile` (runs root & language-server TypeScript builds).
- Language server tests: `npm --prefix packages/pml-language-server run test` (Vitest).
- Packaging smoke test (when functionality changes): `npm run pack` and install the generated VSIX in a disposable VS Code profile.
- Record test commands and outcomes in the task notes; surface failures instead of hiding them.

## Implementation Workflow
1. Clarify the requirement (issue, user request, or roadmap item). Capture edge cases before coding.
2. Inspect relevant files to understand current behaviour; note constraints or TODO comments.
3. Make incremental commits on a feature branch; keep commit messages action-oriented.
4. After each logical change, run the appropriate tests/compiles. If something fails, stop and document the failure with logs.
5. Before requesting review or merging, scan the diff for unintended changes (formatting, large asset churn, regenerated artefacts).

## Failure Handling
- If a task cannot be completed, document what was attempted, why it failed, and any partial progress.
- Never leave the repository in a broken state—revert or fix intermediates before finishing the session.
- Highlight required follow-up work (new issues, tech debt, missing tests) in the task summary.

## Stage Finalization Checklist
A release stage is complete only after every step below has been executed and recorded.

1. **Release preparation**  
   Update version numbers and metadata (package.json, README.md, CHANGELOG.md, release notes, other artefacts). Keep a single `RELEASE_NOTES.md` (or equivalent) as the canonical release notes file—consolidate per-version notes into it and remove any extra copies. Run mandatory checks/tests and note their status.

2. **Local VSIX publication**  
   Build the current package (`npm run pack` or `npm run pack:install` to pack + install). Use `scripts/reinstall.ps1` (wrapped by `npm run install:local` / `npm run pack:install`) to deploy the VSIX into both Cursor (AI IDE) and standard VS Code profiles; confirm the extension loads and runs correctly in each environment.

3. **Changelog consolidation**  
   Merge scattered change-log entries into `CHANGELOG.md`. Maintain a single authoritative release-notes document; delete obsolete or duplicative changelog/release-note files (including ad-hoc change notes) left from prior fixes.

4. **GitHub publication**  
   Commit changes, ensure the working tree is clean, and push to the canonical branch/tags. Open a Pull Request and await CI if required.

5. **Roadmap update**  
   Sync `ROADMAP.md` with completed work and new plans. Confirm it reflects the current project version and status.

6. **GitHub release**  
   Create or update the GitHub release, attach the fresh VSIX, add release notes and a checksum, and ensure alignment with the changelog and roadmap. Keep exactly one authoritative release-notes entry for the release; delete obsolete change-note files and outdated local VSIX packages so only the latest artefacts remain tracked.

7. **Final actions**  
   Update auxiliary communication channels (issue tracker, wiki, docs). Record the stage outcome in internal logs if needed. Verify every checklist item is closed before moving forward.
