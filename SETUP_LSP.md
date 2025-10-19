# Setup Guide for PML Language Server Development

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- VSCode >= 1.80.0

## Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to project root
cd vscode-pml-extension

# Install root dependencies
npm install

# Install language server dependencies
cd packages/pml-language-server
npm install

# Return to root
cd ../..
```

### 2. Build the Language Server

```bash
# From root directory
cd packages/pml-language-server
npm run compile

# Or use watch mode for development
npm run watch
```

### 3. Build the VSCode Extension

```bash
# From root directory
npm run compile

# Or use watch mode
npm run watch
```

## Development Workflow

### Option 1: Watch Mode (Recommended)

Open **two terminals**:

**Terminal 1** - Language Server:
```bash
cd packages/pml-language-server
npm run watch
```

**Terminal 2** - VSCode Extension:
```bash
npm run watch
```

### Option 2: Manual Build

```bash
# Build language server
cd packages/pml-language-server && npm run compile && cd ../..

# Build extension
npm run compile
```

## Running the Extension

### Debug Mode (F5)

1. Open the project in VSCode
2. Press **F5** (or Run > Start Debugging)
3. A new "Extension Development Host" window will open
4. Open any `.pml` file to activate the extension
5. The Language Server will start automatically

### Check Language Server Status

In the Extension Development Host window:

1. Open a `.pml` file
2. Check the Output panel:
   - View > Output
   - Select "PML Language Server" from dropdown
3. You should see: "PML Language Server initialized"

## Troubleshooting

### Language Server Not Starting

**Symptom**: No completion, hover, or diagnostics

**Solution**:
1. Check if `packages/pml-language-server/out/server.js` exists
2. If not, run: `cd packages/pml-language-server && npm run compile`
3. Restart the Extension Development Host (F5)

### "Cannot find module" Error

**Symptom**: Error about missing `vscode-languageclient` or `vscode-languageserver`

**Solution**:
```bash
# Reinstall dependencies
cd packages/pml-language-server
rm -rf node_modules package-lock.json
npm install

cd ../..
rm -rf node_modules package-lock.json
npm install
```

### Changes Not Reflected

**Symptom**: Code changes don't appear in Extension Development Host

**Solution**:
1. Make sure watch mode is running (see above)
2. Or manually rebuild: `npm run compile`
3. Reload Extension Development Host: **Ctrl+R** (or Cmd+R on Mac)

### TypeScript Errors

**Symptom**: Red squiggly lines in editor

**Solution**:
```bash
# Check TypeScript version
npx tsc --version  # Should be 5.3.3 or higher

# Rebuild
npm run compile
```

## Testing

### Manual Testing

1. Create a test `.pml` file in Extension Development Host
2. Test features:
   - Type `define` → Should show completion
   - Create unclosed `define method` block → Should show diagnostic error
   - Hover over keywords → Should show hover info

### Unit Tests (Coming Soon)

```bash
cd packages/pml-language-server
npm test
```

## Project Structure

```
vscode-pml-extension/
├── src/                           # VSCode extension source
│   ├── extension.ts              # Main extension entry
│   ├── languageClient.ts         # LSP client (NEW)
│   ├── completion.ts             # Old completion (will be replaced)
│   └── ...
├── packages/
│   └── pml-language-server/      # Language Server package (NEW)
│       ├── src/
│       │   ├── server.ts         # LSP server entry
│       │   ├── parser/           # Lexer & Parser
│       │   ├── ast/              # AST definitions
│       │   └── ...
│       ├── out/                  # Compiled JS (generated)
│       ├── package.json
│       └── tsconfig.json
├── out/                          # Compiled extension (generated)
├── package.json                  # Extension manifest
└── tsconfig.json
```

## Next Steps

Now that you have the LSP infrastructure set up, proceed with:

1. **Phase 1.2**: Implement the PML Parser
2. **Phase 1.3**: Add Workspace Indexing
3. **Phase 1.4**: Build Type Inference Engine
4. **Phase 1.5**: Implement LSP Providers

See [INTELLISENSE_UPGRADE_PLAN.md](INTELLISENSE_UPGRADE_PLAN.md) for the full roadmap.

## Useful Commands

```bash
# Rebuild everything
npm run compile

# Watch mode (both projects)
npm run watch

# Clean build artifacts
rm -rf out packages/pml-language-server/out

# Package extension for installation
npm run pack

# Install locally
npm run install:local
```

## VSCode Launch Configuration

The `.vscode/launch.json` should have:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Extension",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": [
        "${workspaceFolder}/out/**/*.js",
        "${workspaceFolder}/packages/pml-language-server/out/**/*.js"
      ],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

## Getting Help

- **Documentation**: See [docs/](docs/) folder
- **Issues**: https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues
- **Roadmap**: [INTELLISENSE_UPGRADE_PLAN.md](INTELLISENSE_UPGRADE_PLAN.md)

---

**Status**: ✅ Phase 1.1 Complete - LSP Infrastructure Ready
**Next**: Phase 1.2 - Implement PML Parser
