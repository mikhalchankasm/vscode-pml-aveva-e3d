# Help Source Coverage

This file tracks which parts of large AVEVA help sources have been selected,
implemented, or rejected for the PML extension. The checkbox is checked only
after the related extension change has been implemented and validated.

## Sources

| Source ID | File | Corpus location | Notes |
| --- | --- | --- | --- |
| `aveva-ue-2.4-2025` | `manuals/avevatm_unified_engineering_2-4-2025.pdf` | `manuals/.derived/avevatm_unified_engineering_2-4-2025/` | AVEVA Unified Engineering help, 10,259 pages. |

## Coverage Board

| Done | Status | Source ID | Section / page range | Extension target | Implementation / validation notes |
| --- | --- | --- | --- | --- | --- |
| [ ] | candidate | `aveva-ue-2.4-2025` | `Customization Facilities; The Programmable Macro Language (PML)`, page 881 | Documentation triage, PML language model | Initial high-value entry point for PML-related source material. |
| [ ] | candidate | `aveva-ue-2.4-2025` | `Using Commands`, page 885 | Command parsing, command completions, hovers | Review for command-line syntax that should be tolerated by parser diagnostics. |
| [x] | implemented | `aveva-ue-2.4-2025` | `Database Navigation and Query Syntax`, page 927 | DBREF completions, diagnostics, examples | Implemented compact hover help for the built-in `!!CE` DBREF current-element variable in `packages/pml-language-server/src/providers/hoverProvider.ts` with regression coverage in `packages/pml-language-server/src/providers/__tests__/hoverProvider.test.ts`; validated with `npm --prefix packages/pml-language-server run test -- src/providers/__tests__/hoverProvider.test.ts` (6 passed). |
| [ ] | candidate | `aveva-ue-2.4-2025` | `PML DBRef Object`, page 927 | Built-in object methods, hover, signature help | Likely source for DBREF method completions and examples. |
| [ ] | candidate | `aveva-ue-2.4-2025` | `Query Attributes`, page 952 | Attribute hover/completion and query diagnostics | Candidate for `q`, `query`, dot-notation, and attribute access behavior. |
| [ ] | candidate | `aveva-ue-2.4-2025` | `dot Notation in PML`, page 954 | Member access parser/completion behavior | Review before changing member-expression completion rules. |
| [ ] | candidate | `aveva-ue-2.4-2025` | `PML Attribute Class / Methods`, page 961 | Built-in ATTRIBUTE methods | Candidate for typed method completions and signature help. |
| [x] | implemented | `aveva-ue-2.4-2025` | `PML ElementType Class / Methods`, page 963 | Built-in ELEMENTTYPE methods | Implemented low-noise `ELEMENTTYPE` metadata method completions and hover docs for distinct methods in `packages/pml-language-server/src/providers/completionProvider.ts`, `packages/pml-language-server/src/providers/hoverProvider.ts`, `packages/pml-language-server/src/providers/__tests__/completionProvider.test.ts`, and `packages/pml-language-server/src/providers/__tests__/hoverProvider.test.ts`; validated with `npm --prefix packages/pml-language-server run test -- src/providers/__tests__/completionProvider.test.ts src/providers/__tests__/hoverProvider.test.ts` (12 passed). |
| [ ] | candidate | `aveva-ue-2.4-2025` | `Pseudo Attributes`, page 2554 | Attribute data, hover, diagnostics | Large section; split into smaller attribute-category slices before implementation. |
| [x] | implemented | `aveva-ue-2.4-2025` | `Command Description Format` and `Syntax Diagrams`, pages 620-621 | Command syntax extraction rules | Implemented syntax-keyword mining for AVEVA command tokens such as `DEFault`, including `keyword`, `minimum`, and `canAbbreviate` fields in `scripts/help-corpus/extract_help_corpus.py` plus unit coverage in `scripts/help-corpus/test_extract_help_corpus.py`; validated with `python -m unittest scripts/help-corpus/test_extract_help_corpus.py` and a temp real-PDF extraction that produced 368 filtered syntax keyword candidates. |
| [x] | implemented | `aveva-ue-2.4-2025` | `Common Commands`, page 628 | PDMS/E3D command starters | Implemented `PARAGON`, `SPECONMODE`, and `FINISH` command starter coverage in `packages/pml-language-server/src/data/pdmsCommands.ts`, `packages/pml-language-server/src/data/__tests__/pdmsCommands.test.ts`, `packages/pml-language-server/src/parser/__tests__/parser.test.ts`, and `packages/pml-language-server/src/providers/__tests__/hoverProvider.test.ts`; validated with `npm --prefix packages/pml-language-server run test -- src/data/__tests__/pdmsCommands.test.ts src/providers/__tests__/hoverProvider.test.ts src/parser/__tests__/parser.test.ts` (96 passed). |

## Slice Template

Copy this row when an agent selects a new help section:

| [ ] | planned | `aveva-ue-2.4-2025` | `<section title>`, pages `<start>-<end>` | `<completion/hover/diagnostic/snippet/test target>` | Selected because `<short reason>`. |
