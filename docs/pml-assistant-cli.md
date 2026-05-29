# PML Assistant Extension CLI Contract

The `vscode-pml-extension` repository is the parser and diagnostics source of truth for PML Assistant. External tools, including `e3d-pml-agent-kit`, must use this CLI instead of copying parser logic.

## Commands

Run these commands from the extension repository after `npm run compile`:

```powershell
npm run pml:parse -- <file> --json
npm run pml:diagnose -- <file> --json
npm run pml:symbols -- <folder> --json
npm run pml:scope -- <file> --line <line> --column <column> --json
```

Supported file kinds are `.pml`, `.pmlobj`, `.pmlfnc`, `.pmlfrm`, `.pmlmac`, and `.pmlcmd`.

## Stable JSON Fields

Every response includes:

- `tool`: `vscode-pml-extension`
- `contractVersion`: currently `1.0`
- `extensionVersion`: extension package version
- `gitCommit`: short commit hash when Git is available
- `gitDirty`: whether the repository has local changes when Git is available
- `command`: requested CLI command

File commands also include:

- `file`, `uri`, `fileKind`
- `parserMode`
- `diagnostics`
- `symbols`

`pml:scope` uses 1-based `--line` and `--column` inputs and returns the innermost document symbol containing that position.

## Ownership Boundary

This CLI reports extension-owned parser, diagnostics, and symbol information. Agent Kit remains responsible for review policy, normalized multi-source findings, DB/PMLLIB checks, security/performance policy, MCP orchestration, and optional live E3D context through Avox.
