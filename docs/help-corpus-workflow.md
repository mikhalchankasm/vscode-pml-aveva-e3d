# Help Corpus Workflow

This repository should never read a large PDF manual at extension runtime. Large
help files are treated as local source material for development, then reduced
into small reviewed TypeScript data files used by completions, hovers, signature
help, diagnostics, snippets, or tests.

## Storage Model

- Source PDFs stay under `manuals/`, which is ignored by git.
- Extracted development corpus files stay under `manuals/.derived/`, also
  ignored by git.
- Reviewed implementation data belongs in tracked source files such as
  `packages/pml-language-server/src/data/*.ts` or focused generated files under
  `packages/pml-language-server/src/data/generated/`.
- Coverage decisions are tracked in `docs/help-source-coverage.md`.

## Extraction

Run the extractor from the repository root:

```powershell
python scripts/help-corpus/extract_help_corpus.py manuals/avevatm_unified_engineering_2-4-2025.pdf --mode focus
```

Useful modes:

- `--mode index`: write only `manifest.json`, `toc.jsonl`, and `sections.jsonl`.
- `--mode focus`: write index files plus chunks for high-signal PML, command,
  syntax, DBREF, and ElementType sections.
- `--mode all`: write chunks for every section. Use only when a full local corpus
  is needed.

For deep extraction of a broad area, pass an explicit focus regex instead of
changing the default. Example:

```powershell
python scripts/help-corpus/extract_help_corpus.py manuals/avevatm_unified_engineering_2-4-2025.pdf --mode focus --focus-regex "Pseudo Attributes|Attribute Category: Piping|User Defined Attribute"
```

The manifest records the source file path, size, SHA256, page count, TOC item
count, extraction mode, and output names. If the source SHA256 has not changed,
agents should reuse the existing corpus instead of reading the PDF again.
For focused extraction, chunks are written only for the selected leaf sections so
parent and child TOC ranges do not duplicate the same pages.

## Agent Selection Loop

When an agent is asked to use the help file for the next improvement:

1. Open `manifest.json` and verify that it matches the expected PDF.
2. Search `sections.jsonl` or `chunks.jsonl` for a small candidate section.
3. Add or update one row in `docs/help-source-coverage.md` with status
   `planned` before implementation starts.
4. Implement only that focused slice.
5. Run targeted tests first, then broader validation if the change affects
   release behavior.
6. Update the coverage row to `implemented` only after the change and validation
   are complete. Record the implementation files and test commands.

If a command or prompt includes a broad topic, treat it as a hint rather than a
strict requirement. The agent should choose the actual implementation slice based
on value, risk, and fit with the existing extension. A `random` request means
randomly select one unchecked candidate row, then still narrow it to a safe
reviewable implementation.

## Coverage Status

Use these statuses consistently:

- `candidate`: useful source material found, not selected yet.
- `planned`: selected for a future implementation slice.
- `in-progress`: currently being implemented in a branch.
- `implemented`: implemented and validated.
- `rejected`: reviewed and intentionally not used.

The checkbox in the coverage file means implementation is complete, not merely
that the section was read.

## Candidate Quality Rules

- Prefer sections that reduce user friction in the extension: fewer false
  diagnostics, better completions, stronger hovers, better signature help,
  better snippets, or better tests.
- Do not import raw manual text wholesale into extension output.
- Keep source traceability by recording source section IDs and page ranges.
- Do not add runtime dependencies for extracted help data.
- Keep each implementation slice small enough to review.
