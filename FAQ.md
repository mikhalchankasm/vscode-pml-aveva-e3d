# Frequently Asked Questions (FAQ)

## Installation and Setup

### How do I install the extension?

**Option 1: From VSIX (for development)**
```bash
npm install
npm run pack:install
# Reload VS Code: Ctrl+Shift+P → Reload Window
```

**Option 2: From VS Code Marketplace** (coming soon)
1. Open Extensions (Ctrl+Shift+X)
2. Search for "PML for AVEVA E3D"
3. Click Install

### Which file types are supported?

- `.pml` - main PML files
- `.pmlobj` - objects
- `.pmlfnc` - functions
- `.pmlfrm` - forms
- `.pmlmac` - macros
- `.pmlcmd` - commands

### How do I configure indentation?

In `settings.json`:
```json
{
  "pml.formatter.indentSize": 4
}
```

## Features

### How do I use Code Actions (lightbulb 💡)?

1. Select 2+ lines
2. Press `Ctrl+.` or click the lightbulb
3. Choose a command (Array, Sort, Remove, Trim)

### How do I format code quickly?

- **Entire document:** `Shift+Alt+F`
- **Selection:** select text → `Shift+Alt+F`
- **Command:** `Ctrl+Shift+P` → "Format PML Document"

### How do I create an array from lines?

1. Select lines
2. Right-click → "⚡ Quick Actions" → "Array: Make List (Path)"
3. Enter variable name
4. Done! 📋

### What is Smart Natural Sort?

Smart sorting with number awareness:
```
pipe1     ✓
pipe2      
pipe10     instead of  pipe1
pipe20                pipe10
                      pipe2
                      pipe20
```

## Troubleshooting

### Extension doesn't work / doesn't activate

1. Check that the file has `.pml` extension (or another from the list)
2. Reload window: `Ctrl+Shift+P` → "Reload Window"
3. Check logs: `Ctrl+Shift+P` → "Developer: Toggle Developer Tools" → Console

### Autocompletion doesn't show

1. Check VS Code settings:
   ```json
   {
     "editor.quickSuggestions": {
       "other": true
     }
   }
   ```
2. Press `Ctrl+Space` for manual trigger

### Formatting works incorrectly

1. Check formatter settings in `settings.json`
2. Create an issue with code example
3. Temporarily disable: `"pml.formatter.enabled": false` (if added)

### Syntax highlighting doesn't work for [construct]

Create an issue with an example - we'll add it to the grammar!

### How do I disable telemetry?

```json
{
  "telemetry.telemetryLevel": "off"
}
```

## Development

### How do I run in development mode?

1. Open project in VS Code
2. Press `F5`
3. In new window, open a `.pml` file
4. After code changes, press `Ctrl+R` to reload

### How do I build VSIX?

```bash
npm run pack
```

File will appear: `pml-aveva-e3d-X.Y.Z.vsix`

### How do I add a new snippet?

Edit `snippets/pml.json`:
```json
{
  "My Snippet": {
    "prefix": "trigger",
    "body": [
      "code line 1",
      "code line 2 with ${1:placeholder}"
    ],
    "description": "What it does"
  }
}
```

## Features

### Is AVEVA E3D version X.X supported?

The extension works with any E3D version as it supports both PML1 and PML2 syntax.

### Can I run PML code from VS Code?

Not yet. Planned features:
- Task Provider for running through AVEVA
- PML Console integration

### Is PML.NET supported?

Basic highlighting is available. Full integration is planned.

### Is EDG (Event Driven Graphics) supported?

Partially. EDG snippets are planned.

## More Questions?

- 🐛 [GitHub Issues](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
- 💬 [Discussions](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions) (coming soon)
- 📧 Email: [add]
- 💬 Telegram: [add]

---

*Didn't find an answer? Create an issue with your question!*
