# Troubleshooting Guide

## Form Files (.pmlfrm) - Limited Support

### Expected Behavior

**This is NORMAL** - Form files show parse errors in Output:
```
Form file <path>.pmlfrm has 70 parse errors (suppressed - form syntax not fully supported)
```

**Why?** Form files use a special DSL (Domain Specific Language) for UI elements that differs significantly from regular PML. The parser intentionally has limited support for form syntax to avoid false errors.

### What Works in Form Files ✅

- **Methods inside forms** - Full support:
  - Syntax highlighting
  - IntelliSense / Autocomplete
  - Go to Definition (F12)
  - Find References
  - Hover information
  - Refactoring tools

- **Form-specific commands**:
  - Insert Method Documentation Block
  - Generate Methods Summary
  - Array manipulation commands
  - Comment/uncomment tools

- **Code snippets**:
  - Button gadgets (`button`, `buttonat`, etc.)
  - Frame gadgets (`frame`, `frametabset`, etc.)

### What Doesn't Work in Form Files ❌

- Parsing of `setup form`, `frame`, `button`, `toggle` syntax
- Diagnostics for UI element definitions
- Autocomplete for form keywords (these are handled by snippets)

### Example - What Gets Parsed

```pml
setup form !!MyForm   -- ❌ Not parsed (DSL syntax)

  frame .frMain at 0 0  -- ❌ Not parsed (DSL syntax)

    -- ✅ This method IS fully parsed and supported
    define method .onOK()
      !value = !this.txtInput.val
      if (!value == UNSET) then
        $P Error: No value
      else
        $P Value: $value
      endif
    endmethod

  exit
exit
```

---

## Basic Feature Testing

### Step 1: Test with Regular .pml File

**DO NOT test with .pmlfrm files first!** Use `examples/test-basic-features.pml`:

1. Open `examples/test-basic-features.pml`
2. Check the following features:

#### ✅ Syntax Highlighting
- Keywords should be colored (define, object, method, etc.)
- Strings in quotes should be colored
- Comments should be colored

#### ✅ IntelliSense / Autocomplete
- Start typing `define method` - suggestions should appear
- Type `!this.` - member suggestions should appear

#### ✅ Go to Definition (F12)
- Put cursor on `.getValue()` call
- Press F12
- Should jump to method definition

#### ✅ Hover Information
- Hover over `.getValue()`
- Should show documentation popup

#### ✅ Document Symbols (Outline)
- Open Outline view (Ctrl+Shift+O)
- Should show: object, members, methods

#### ✅ Diagnostics
- Uncomment the broken method
- Should show red squiggle with error

#### ✅ Array Commands
- Select array lines
- Right-click → PML - Array → ReIndex
- Indices should be renumbered

---

## Common Issues

### Issue 1: "Extension Not Working at All"

**Symptoms**: No syntax highlighting, no autocomplete, no features

**Diagnosis**:
1. Check extension is installed and enabled:
   - Extensions view → Search "PML for AVEVA E3D"
   - Should show version 0.10.0 (or later)
   - Should be enabled (not grayed out)

2. Check file extension is recognized:
   - Bottom right of VSCode should show "PML" as language
   - If not, click language selector and choose "PML"

3. Check LSP server is running:
   - Open Output panel (View → Output)
   - Select "PML Language Server" from dropdown
   - Should see:
     ```
     [Info] PML Language Server started
     [Info] Workspace indexing complete: N files
     ```

**Solutions**:
- Reload VSCode window (Ctrl+Shift+P → "Reload Window")
- Reinstall extension from VSIX
- Check VSCode version (requires 1.85.0 or newer)

---

### Issue 2: "LSP Server Not Starting"

**Symptoms**: No autocomplete, no diagnostics, Output shows errors

**Check Output Panel**:
```
View → Output → Select "PML Language Server"
```

**Common Errors**:

#### Error: "Cannot find module"
```
Error: Cannot find module 'vscode-languageserver'
```
**Solution**: Extension installation corrupted, reinstall from VSIX

#### Error: "ENOENT: no such file or directory"
```
Error: ENOENT: no such file or directory, open '<path>/server.js'
```
**Solution**: Extension files missing, reinstall from VSIX

#### Error: "Connection closed"
```
[Error] Connection to server got closed. Server will not be restarted.
```
**Solution**:
1. Check Node.js is not blocking the extension
2. Reload VSCode window
3. Check antivirus is not blocking

---

### Issue 3: "Slow Performance / Freezing"

**Symptoms**: VSCode freezes when opening PML files

**Cause**: Workspace indexing on large codebases

**Solution**: Exclude large directories from indexing

**Settings** (File → Preferences → Settings → search "pml.indexing.exclude"):
```json
{
  "pml.indexing.exclude": [
    "**/node_modules/**",
    "**/out/**",
    "**/docs/**",
    "**/scripts/**",
    "**/.git/**",
    "**/.vscode/**",
    "**/examples/**",
    "**/hide_examples/**",
    "**/large_folder/**"  // Add your large folders here
  ]
}
```

**Quick Fix**: Disable indexing temporarily
```json
{
  "pml.indexing.enabled": false  // Note: This disables workspace-wide features
}
```

---

### Issue 4: "Autocomplete Not Working"

**Symptoms**: No suggestions when typing

**Check**:
1. Is file type recognized as PML? (bottom right should show "PML")
2. Is LSP server running? (check Output panel)
3. Are you inside a method/function? (autocomplete works in code blocks)

**Try**:
- Type a known keyword: `define method`
- Type a variable with dot: `!this.`
- Press Ctrl+Space to force trigger

**Settings to Check**:
```json
{
  "editor.quickSuggestions": {
    "other": true,
    "comments": false,
    "strings": false
  }
}
```

---

### Issue 5: "Go to Definition (F12) Not Working"

**Symptoms**: F12 does nothing or shows "No definition found"

**Limitations**:
- Works for methods defined in same file or workspace
- Does NOT work for built-in AVEVA methods (these are external)
- Does NOT work for methods in unopened files (workspace must be indexed)

**Check**:
1. Is method defined in current workspace?
2. Has workspace indexing completed? (check Output)
3. Try "Find All References" (Shift+F12) as alternative

**Known Issue**: Find All References currently shows definitions instead of call sites

---

### Issue 6: "Too Many Errors Shown"

**Symptoms**: Red squiggles everywhere, file covered in errors

**For .pmlfrm files**: This is normal if you see form DSL errors - these are suppressed in Output

**For .pml files**:
- Check file syntax is valid
- Check for unclosed blocks (if/endif, do/enddo, etc.)
- Check SKIP keyword usage (should work as of v0.9.9)

**Disable specific diagnostics**:
```json
{
  "pml.diagnostics.typeChecking": false,      // Disable type errors
  "pml.diagnostics.unusedVariables": false,   // Disable unused var warnings
  "pml.diagnostics.arrayIndexZero": false     // Disable 0-index warnings
}
```

---

## Network Drive Issues

### Issue: "Extension Slow on Network Drives"

**Symptoms**: Opening files from `\\server\share\` is very slow

**Cause**: Network latency + file watching + indexing

**Solutions**:

1. **Exclude network paths from indexing**:
```json
{
  "pml.indexing.exclude": [
    "//vm1/share/**",
    "\\\\vm1\\share\\**"
  ]
}
```

2. **Disable file watching for network paths**:
```json
{
  "files.watcherExclude": {
    "//vm1/share/**": true,
    "\\\\vm1\\share\\**": true
  }
}
```

3. **Use local workspace** (recommended):
   - Clone/copy files to local drive
   - Work locally, sync to network when done

---

## Getting Help

If none of the above solves your issue:

1. **Collect diagnostic info**:
   - VSCode version (Help → About)
   - Extension version (Extensions → PML for AVEVA E3D)
   - Output logs (Output → PML Language Server)
   - Test with `examples/test-basic-features.pml`

2. **Create issue**: [GitHub Issues](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)
   - Include diagnostic info
   - Include minimal reproduction case
   - Include screenshots if relevant

3. **Discussions**: [GitHub Discussions](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions)

---

## Feature Matrix

| Feature | .pml Files | .pmlfrm Files | Notes |
|---------|------------|---------------|-------|
| Syntax Highlighting | ✅ Full | ✅ Partial | Form DSL not highlighted |
| IntelliSense | ✅ Full | ✅ Methods only | No autocomplete for form keywords |
| Go to Definition | ✅ Full | ✅ Methods only | F12 on method names |
| Find References | ✅ Full | ✅ Methods only | Shift+F12 |
| Hover Info | ✅ Full | ✅ Methods only | Documentation popups |
| Diagnostics | ✅ Full | ⚠️ Methods only | Form DSL errors suppressed |
| Refactoring | ✅ Full | ✅ Methods only | Rename, extract, etc. |
| Snippets | ✅ Full | ✅ Full | Button/Frame gadgets work |
| Array Commands | ✅ Full | ✅ Full | Context menu tools |
| Form Commands | ⚠️ N/A | ✅ Full | Generate methods summary |

---

**Last Updated**: v0.10.0 (2025-01-31)
