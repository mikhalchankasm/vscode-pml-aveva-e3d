# PML VS Code Extension — Implementation Backlog (for Cursor IDE)

_Last updated: 2025-10-15 01:00 UTC_

This backlog is structured as executable tasks for Cursor. Each item includes **Goal**, **Acceptance Criteria**, and **Implementation Hints**. Priorities: **P0 (must)**, **P1 (should)**, **P2 (nice-to-have)**.

---

## P0 — Core Language Support

### 1) Syntax Highlighting (TextMate grammar)
**Goal:** Provide robust syntax coloring for PML (PML1 & PML2 forms/objects/methods).  
**Acceptance Criteria:**
- Keywords highlighted: `define method`, `endmethod`, `define object`, `endobject`, `setup form`, `exit`, `show !!Form`, `pml rehash`, `pml reload`, `button`, `list`, `frame`, `menu`, `callback` names, boolean/real/string/array literals.
- Variables: `!local` and `!!global` styled distinctly.
- Strings (`'...'`, `|...|`) and comments styled.
- Command-style PML1 lines highlighted (e.g., `Q ATT`, `NEW`, `UNMARK`).  
**Implementation Hints:**
- Start with `syntaxes/pml.tmLanguage.json` (TextMate + Oniguruma regex).
- Use separate patterns for: block headers/footers, gadget refs (`!!Form.gadget`), method calls `!var.method()`.

---

### 2) Parser & AST (Tree-sitter — foundation for LSP)
**Goal:** Structural parsing to enable outline, references, diagnostics, refactors.  
**Acceptance Criteria:**
- Grammar supports: method/object blocks; `setup form ... / exit`; callback strings; member access `obj.member`; arrays `!arr[1]` (1-based indices).
- Build produces concrete syntax tree; incremental parsing works.  
**Implementation Hints:**
- Create `tree-sitter-pml` package (separate repo or `packages/` folder).
- Nodes: `method_def`, `object_def`, `form_setup_section`, `form_exit_section`, `statement`, `call_expr`, `member_expr`, `array_index`, `string_lit`, `number_lit`, `bool_lit`.
- Provide queries for symbols (`queries/highlights.scm`, `queries/locals.scm`).

---

### 3) Language Server (LSP) bootstrap
**Goal:** LSP features backed by Tree-sitter index.  
**Acceptance Criteria:**
- Document Symbols → outline of methods/objects/forms/callbacks.
- Hover → short doc for common builtins & form callbacks.
- Completion → keywords, callbacks, common gadget props.
- Go To Definition → method defs within workspace.
- Find References → method usages in file.  
**Implementation Hints:**
- `server/src/indexer.ts` maintains per-document AST + symbol table.
- `server/src/features/*` for hover, completion, defs, refs.
- VS Code client wires through `vscode-languageclient`.

---

## P0 — Diagnostics (Linter) + Code Actions

### 4) Block pairing & structure checks
**Goal:** Catch common structural mistakes.  
**Acceptance Criteria:**
- Error if `define method` lacks `endmethod` (and vice versa).
- Error if `setup form` is missing paired `exit`.
- Warning on duplicate method names within a file.  
**Implementation Hints:**
- Build a simple stack validator over AST.
- Code Action: “Insert missing endmethod/exit”.

---

### 5) Arrays & type-usage checks
**Goal:** Prevent frequent runtime issues.  
**Acceptance Criteria:**
- Warning when using index `0` (PML arrays are 1-based).
- Warning when calling non-applicable methods (e.g., `.size()` on REAL).
- Hint if variable used before first assignment.  
**Implementation Hints:**
- Lightweight type tags: `REAL/STRING/BOOLEAN/ARRAY/OBJECT/UNKNOWN` inferred intra-procedurally.
- Heuristics only; avoid perfect typing to keep performance.

---

### 6) Forms/Callbacks validation
**Goal:** Validate form gadget/member references & callbacks.  
**Acceptance Criteria:**
- Error on unknown gadget in `!!Form.gadget` access.
- Warning when callback string references a non-existent method.
- Quick Fix: “Generate callback stub method”.  
**Implementation Hints:**
- From AST of `setup form` collect gadget IDs & known callbacks (`okCall`, `cancelCall`, `initCall`, `firstShownCall`, `quitCall`, `killingCall`).

---

## P1 — Refactors & Navigation

### 7) Reorder Methods
**Goal:** Move/sort `define method` blocks via AST, preserving content.  
**Acceptance Criteria:**
- Command: “PML: Reorder Methods…” → picker UI; results in edited document.
- Maintains exact method bodies and adjacent comments.  
**Implementation Hints:**
- Use AST node ranges to splice text; apply `WorkspaceEdit` with minimal diffs.

---

### 8) Rename Symbol (safe)
**Goal:** Rename methods/gadgets with updates to references (including callback strings).  
**Acceptance Criteria:**
- “Rename Symbol” on method name updates all in-file references and callback strings.
- Preview of changes before apply.  
**Implementation Hints:**
- Index references via Tree-sitter query over `call_expr` and string literals within callback slots.

---

### 9) Extract Method (selection → method)
**Goal:** Extract selected statements into new local method.  
**Acceptance Criteria:**
- Command creates `define method NewName()` above current method and replaces selection with call.
- Preserves local variables via parameters (simple heuristic).  
**Implementation Hints:**
- Start with intra-method extraction; skip complex control-flow in v1.

---

## P1 — Snippets & Commands

### 10) Snippets: Form & callbacks
**Goal:** Speed up creating forms.  
**Acceptance Criteria:**
- Snippet `pml-form` inserts `setup form !!MyForm ... / exit` + callback placeholders.  
**Implementation Hints:**
- `snippets/pml.json` with tabstops for form name and gadgets.

---

### 11) Snippets: EDG skeleton
**Goal:** Quick start for Event Driven Graphics.  
**Acceptance Criteria:**
- Snippet `pml-edg` inserts EDG packet + picks + handler placeholders.  
**Implementation Hints:**
- Include comments with lifecycle checklist.

---

### 12) Snippets: PML.NET callables
**Goal:** Template for PML↔.NET bridge.  
**Acceptance Criteria:**
- Snippet `pml-net` inserts minimal PML side + C# class stub reference notes.  
**Implementation Hints:**
- Provide parameters list conventions and supported types in comments.

---

### 13) Commands: Rehash/Reload/Show Form
**Goal:** Convenience runtime commands.  
**Acceptance Criteria:**
- Command palette: “PML: Rehash All”, “PML: Reload Current Form/Object”, “PML: Show Form by Name…”.  
**Implementation Hints:**
- Implement as shell tasks or external CLI hooks; make paths configurable in settings.

---

## P1 — Settings & Formatter

### 14) Settings (paths & versions)
**Goal:** Config to resolve includes and deployment.  
**Acceptance Criteria:**
- Settings: `pml.pmllibPaths`, `pml.uicPath`, `pml.addinsXmlPath`, `pml.e3dVersion`.
- Changing settings triggers re-index.  
**Implementation Hints:**
- Watch configuration and re-run indexer upon change.

---

### 15) Formatter (basic)
**Goal:** Consistent code layout.  
**Acceptance Criteria:**
- Indent blocks; align `define/end` pairs; normalize spaces around `=` and commas.
- Preserve command-style lines (PML1) without reflow.  
**Implementation Hints:**
- Token-based formatter using AST; avoid reformatting inside string literals.

---

## P2 — Docs & Help

### 16) Inline Help (Hover docs)
**Goal:** Quick refs in-editor.  
**Acceptance Criteria:**
- Hover on callbacks shows short description and expected signature.
- Hover on builtins (`length`, `size`, `upper`, etc.).  
**Implementation Hints:**
- Bundle JSON docs with short descriptions; map identifiers → docs.

---

### 17) UIC Quick Actions
**Goal:** Faster UI customization workflow.  
**Acceptance Criteria:**
- Command: “Open Project UIC” (from configured path).
- Snippet for XML button/menu entries with placeholders.  
**Implementation Hints:**
- Use `vscode.workspace.openTextDocument` with resolved path.

---

## P2 — Build/Deploy Integration

### 18) PML.NET Add-in: Build & Copy
**Goal:** One-step deploy of .NET addins.  
**Acceptance Criteria:**
- Command builds DLL, updates `DesignAddins.xml`, copies to target folder.
- Output channel logs steps & errors.  
**Implementation Hints:**
- PowerShell/Node child process; settings for MSBuild path and target folder.

---

## Quality & Tooling

### 19) Testing
**Goal:** Basic automated validation.  
**Acceptance Criteria:**
- Parser tests (grammar fixtures).
- LSP unit tests for symbols/hover/diagnostics.
- Integration smoke test on sample workspace.  
**Implementation Hints:**
- Use `vitest`/`mocha` + golden-files for diagnostics snapshots.

---

### 20) Performance & Robustness
**Goal:** Smooth editing experience on large macros.  
**Acceptance Criteria:**
- Incremental (per-change) analysis.
- Throttle diagnostics; heavier checks on save.
- Indexing handles thousands of lines without blocking UI.  
**Implementation Hints:**
- Debounce; worker threads for heavy passes; cache AST & symbol tables per document.

---

## Deliverables (initial milestones)

- **M1:** Tasks 1–4 (syntax, parser, LSP bootstrap, structural diagnostics).  
- **M2:** Tasks 5–8 (typing heuristics, forms checks, reorder/rename).  
- **M3:** Tasks 9–13 (extract, snippets, runtime commands).  
- **M4:** Tasks 14–20 (settings, formatter, help, build/deploy, tests, perf).

---

### Notes for Cursor “task” entries
- Keep each task atomic with clear acceptance criteria.
- Prefer PR-per-task; attach test fixtures and short demo GIF where useful.
