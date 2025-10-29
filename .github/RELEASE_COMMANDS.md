# Release Commands Quick Reference

Quick command reference for releases.

## 🚀 Full Release Cycle (Copy-Paste)

```bash
# 1. Compile and build VSIX
npm run compile
npm run pack

# 2. Local installation and testing
npm run pack:install
# Then manually: Ctrl+Shift+P -> Reload Window in VS Code/Cursor

# 3. After testing - remove old VSIX, add new one
git rm pml-aveva-e3d-*.vsix
git add pml-aveva-e3d-0.9.X.vsix

# 4. Commit and push
git add -A
git commit -m "release: v0.9.X - description"
git push

# 5. Create GitHub release
gh release create v0.9.X pml-aveva-e3d-0.9.X.vsix --title "v0.9.X - Title" --notes-file RELEASE_NOTES_v0.9.X.md
```

---

## 📦 Individual Commands

### Compilation
```bash
npm run compile
```

### Build VSIX
```bash
npm run pack
```

### Install in VS Code and Cursor (automated)
```bash
npm run pack:install
```

### Install in VS Code only (manual)
```bash
code --install-extension pml-aveva-e3d-0.9.X.vsix --force
```

### Install in Cursor only (manual)
```bash
cursor --install-extension pml-aveva-e3d-0.9.X.vsix --force
```

### Calculate MD5 checksum
```bash
md5sum pml-aveva-e3d-0.9.X.vsix
```

---

## 🗑️ Cleanup Old VSIX Files

### Remove all VSIX except latest from repository
```bash
# List all VSIX in git
git ls-files "*.vsix"

# Remove all VSIX (prepare to add only the latest)
git rm pml-aveva-e3d-*.vsix

# Add back only the latest
git add pml-aveva-e3d-0.9.X.vsix
```

### Delete local VSIX files (PowerShell)
```powershell
# List all VSIX in folder
Get-ChildItem pml-aveva-e3d-*.vsix

# Keep only latest
Get-ChildItem pml-aveva-e3d-*.vsix | Where-Object { $_.Name -ne "pml-aveva-e3d-0.9.8.vsix" } | Remove-Item
```

---

## 📝 Git Commands

### Status and diff
```bash
git status
git diff
git log --oneline -5
```

### Commit all changes
```bash
git add -A
git commit -m "message"
git push
```

### Undo last commit (if not pushed)
```bash
git reset --soft HEAD~1  # Undo commit, keep changes
git reset --hard HEAD~1  # Undo commit and changes (DANGEROUS!)
```

### Amend last commit
```bash
git commit --amend -m "new message"
git push --force  # If already pushed (DANGEROUS on main!)
```

---

## 🎯 GitHub CLI (gh) Commands

### Check authentication
```bash
gh auth status
```

### Login
```bash
gh auth login
```

### Create release
```bash
# Basic command
gh release create v0.9.X pml-aveva-e3d-0.9.X.vsix --title "v0.9.X - Title" --notes "Description"

# With release notes file
gh release create v0.9.X pml-aveva-e3d-0.9.X.vsix --title "v0.9.X - Title" --notes-file RELEASE_NOTES_v0.9.X.md

# With multiple files
gh release create v0.9.X file1.vsix file2.zip --title "Title" --notes "Notes"
```

### List releases
```bash
gh release list
```

### View release
```bash
gh release view v0.9.X
```

### Delete release
```bash
gh release delete v0.9.X
```

### Upload file to existing release
```bash
gh release upload v0.9.X pml-aveva-e3d-0.9.X.vsix
```

---

## 🔍 Useful Checks

### VSIX file size
```bash
# PowerShell
(Get-Item pml-aveva-e3d-0.9.X.vsix).Length / 1MB

# Expected: ~2.09 MB
```

### VSIX contents (file list)
```bash
npx @vscode/vsce ls --tree
```

### Version in package.json
```bash
# PowerShell
(Get-Content package.json | ConvertFrom-Json).version

# Bash
grep '"version"' package.json
```

### Last commit
```bash
git log -1 --oneline
```

### Last tag
```bash
git describe --tags --abbrev=0
```

---

## 🧪 Testing

### Compile and check for errors
```bash
npm run compile 2>&1 | Select-String "error"
```

### Check TypeScript errors
```bash
npx tsc --noEmit
```

### List installed extensions
```bash
code --list-extensions | Select-String "pml"
```

### Run language server tests
```bash
npm --prefix packages/pml-language-server run test -- --run
```

---

## 📊 Statistics

### Number of files in project
```bash
# PowerShell
(Get-ChildItem -Recurse -File | Measure-Object).Count
```

### Lines of code
```bash
# PowerShell - TypeScript files only
(Get-ChildItem -Recurse -Filter *.ts | Get-Content | Measure-Object -Line).Lines
```

### Folder size
```bash
# PowerShell
"{0:N2} MB" -f ((Get-ChildItem -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB)
```

---

## 🔧 Troubleshooting

### Clean node_modules and reinstall
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Rebuild from scratch
```bash
npm run clean  # If clean script exists
npm run compile
npm run pack
```

### Verify GitHub CLI path
```bash
# PowerShell
Get-Command gh -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source

# Or direct call
gh --version
```

### Force reload language server
```
1. Press F1 / Ctrl+Shift+P
2. Type "Developer: Reload Window"
3. Press Enter
```

### Completely restart VS Code
```
Close VS Code completely (not just Reload Window)
Reopen VS Code
This ensures language server restarts fresh
```

---

## 📌 VSIX Storage Policy

**Important**: Only ONE VSIX file is stored in the repository.

- **Repository**: Contains only `pml-aveva-e3d-0.9.X.vsix` (latest)
- **GitHub Releases**: Contains all historical versions
- **Old versions**: Download from GitHub Releases page

---

**Created**: 2025-01-24
**Updated**: 2025-01-29
**For**: PML for AVEVA E3D Extension
