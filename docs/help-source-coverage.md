# Help Source Coverage

This file tracks which parts of large AVEVA help sources have been selected,
implemented, or rejected for the PML extension. The checkbox is checked only
after the related extension change has been implemented and validated.

## Sources

| Source ID | File | Corpus location | Notes |
| --- | --- | --- | --- |
| `aveva-ue-2.4-2025` | `manuals/avevatm_unified_engineering_2-4-2025.pdf` | `manuals/.derived/avevatm_unified_engineering_2-4-2025/` | AVEVA Unified Engineering help, 10,259 pages. |
| `aveva-admin-6.2-2026` | `manuals/avevatm_administration_6-2-2026.pdf` | `manuals/.derived/avevatm_administration_6-2-2026/` | AVEVA Administration help, 2,704 pages. |

## Coverage Board

| Done | Status | Source ID | Section / page range | Extension target | Implementation / validation notes |
| --- | --- | --- | --- | --- | --- |
| [ ] | candidate | `aveva-ue-2.4-2025` | `Customization Facilities; The Programmable Macro Language (PML)`, page 881 | Documentation triage, PML language model | Initial high-value entry point for PML-related source material. |
| [ ] | candidate | `aveva-ue-2.4-2025` | `Using Commands`, page 885 | Command parsing, command completions, hovers | Review for command-line syntax that should be tolerated by parser diagnostics. |
| [x] | implemented | `aveva-ue-2.4-2025` | `Database Navigation and Query Syntax`, page 927 | DBREF completions, diagnostics, examples | Implemented compact hover help for the built-in `!!CE` DBREF current-element variable in `packages/pml-language-server/src/providers/hoverProvider.ts` with regression coverage in `packages/pml-language-server/src/providers/__tests__/hoverProvider.test.ts`; validated with `npm --prefix packages/pml-language-server run test -- src/providers/__tests__/hoverProvider.test.ts` (6 passed). |
| [x] | implemented | `aveva-ue-2.4-2025` | `PML DBRef Object`, page 927; `DBREF Object`, page 9996 | Built-in DBREF object methods, hover, completions | Implemented low-noise DBREF object method completions and hover docs for distinct methods `attribute`, `attributes`, `badref`, `mcount`, and `line`, and corrected `delete` docs to describe deleting the PML DBREF object rather than the referenced database element; files: `packages/pml-language-server/src/providers/completionProvider.ts`, `packages/pml-language-server/src/providers/hoverProvider.ts`, `packages/pml-language-server/src/providers/__tests__/completionProvider.test.ts`, and `packages/pml-language-server/src/providers/__tests__/hoverProvider.test.ts`; validated with provider tests. |
| [x] | implemented | `aveva-ue-2.4-2025` | `Query Attributes`, page 952 | `Q ATT` command hover | Implemented focused line-start hover help for `Q ATT [AS ANY | <type>]` and distributed attribute query context in `packages/pml-language-server/src/providers/hoverProvider.ts`, with regression coverage in `packages/pml-language-server/src/providers/__tests__/hoverProvider.test.ts`; validated with hover, PDMS command data, and parser tests. |
| [ ] | candidate | `aveva-ue-2.4-2025` | `dot Notation in PML`, page 954 | Member access parser/completion behavior | Review before changing member-expression completion rules. |
| [x] | implemented | `aveva-ue-2.4-2025` | `PML Attribute Class / Methods`, page 961 | Built-in ATTRIBUTE methods | Implemented low-noise ATTRIBUTE metadata method completions and hover docs for distinctive methods such as `isPseudo`, `isUda`, `validValues`, `defaultValue`, and `hidden` while avoiding common names such as `Name`, `Type`, and `Length`; files: `packages/pml-language-server/src/providers/completionProvider.ts`, `packages/pml-language-server/src/providers/hoverProvider.ts`, `packages/pml-language-server/src/providers/__tests__/completionProvider.test.ts`, and `packages/pml-language-server/src/providers/__tests__/hoverProvider.test.ts`; validated with provider tests. |
| [x] | implemented | `aveva-ue-2.4-2025` | `PML ElementType Class / Methods`, page 963 | Built-in ELEMENTTYPE methods | Implemented low-noise `ELEMENTTYPE` metadata method completions and hover docs for distinct methods in `packages/pml-language-server/src/providers/completionProvider.ts`, `packages/pml-language-server/src/providers/hoverProvider.ts`, `packages/pml-language-server/src/providers/__tests__/completionProvider.test.ts`, and `packages/pml-language-server/src/providers/__tests__/hoverProvider.test.ts`; validated with `npm --prefix packages/pml-language-server run test -- src/providers/__tests__/completionProvider.test.ts src/providers/__tests__/hoverProvider.test.ts` (12 passed). |
| [ ] | candidate | `aveva-ue-2.4-2025` | `Pseudo Attributes`, page 2554 | Attribute data, hover, diagnostics | Large section; split into smaller attribute-category slices before implementation. |
| [x] | implemented | `aveva-ue-2.4-2025` | `Command Description Format` and `Syntax Diagrams`, pages 620-621 | Command syntax extraction rules | Implemented syntax-keyword mining for AVEVA command tokens such as `DEFault`, including `keyword`, `minimum`, and `canAbbreviate` fields in `scripts/help-corpus/extract_help_corpus.py` plus unit coverage in `scripts/help-corpus/test_extract_help_corpus.py`; validated with `python -m unittest scripts/help-corpus/test_extract_help_corpus.py` and a temp real-PDF extraction that produced 368 filtered syntax keyword candidates. |
| [x] | implemented | `aveva-ue-2.4-2025` | `Common Commands`, page 628 | PDMS/E3D command starters | Implemented `PARAGON`, `SPECONMODE`, and `FINISH` command starter coverage in `packages/pml-language-server/src/data/pdmsCommands.ts`, `packages/pml-language-server/src/data/__tests__/pdmsCommands.test.ts`, `packages/pml-language-server/src/parser/__tests__/parser.test.ts`, and `packages/pml-language-server/src/providers/__tests__/hoverProvider.test.ts`; validated with `npm --prefix packages/pml-language-server run test -- src/data/__tests__/pdmsCommands.test.ts src/providers/__tests__/hoverProvider.test.ts src/parser/__tests__/parser.test.ts` (96 passed). |
| [ ] | candidate | `aveva-admin-6.2-2026` | `Administration / Project Administration / Management of PML index`, page 225 | PML index workflow docs, command diagnostics | Review for low-risk user guidance or diagnostics around rehash/index maintenance. |
| [ ] | candidate | `aveva-admin-6.2-2026` | `Lexicon / User Defined Element Types / Use of TYPE at the Programmable Macro Language Level`, page 584 | Lexicon/PML completions, hover, examples | Candidate for focused support around UDE TYPE usage in PML. |
| [ ] | candidate | `aveva-admin-6.2-2026` | `Lexicon / Command Syntax Diagrams`, pages 605-607 | Lexicon command syntax extraction, keyword candidates | Use as an administration-specific syntax source before changing command starters or abbreviation handling. |

## Slice Template

Copy this row when an agent selects a new help section:

| [ ] | planned | `<source-id>` | `<section title>`, pages `<start>-<end>` | `<completion/hover/diagnostic/snippet/test target>` | Selected because `<short reason>`. |
