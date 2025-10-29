# Release Checklist

Mandatory checklist for publishing a new extension version.

## 📋 Pre-Release

### 1. Code Changes
- [ ] All changes tested locally
- [ ] Code compiled without errors (`npm run compile`)
- [ ] No TypeScript errors
- [ ] Tested in VS Code
- [ ] Tested in Cursor (optional)

### 2. Version Update
- [ ] Updated `package.json` -> `version` (e.g., `0.9.7` -> `0.9.8`)
- [ ] Updated `CHANGELOG.md`:
  - [ ] Added new section with version and date
  - [ ] Listed all changes (Added/Fixed/Changed/Removed)
  - [ ] Included technical details
- [ ] Updated `ROADMAP.md` (if needed):
  - [ ] Marked completed tasks
  - [ ] Updated "Current Status" section
  - [ ] Updated "Recent Changes" section
  - [ ] Updated last modified date

### 3. Build VSIX
- [ ] Executed command: `npm run pack`
- [ ] Created file `pml-aveva-e3d-X.X.X.vsix`
- [ ] Verified file size (~2.09 MB)
- [ ] Calculated MD5 checksum: `md5sum pml-aveva-e3d-X.X.X.vsix`

## 🔧 Local Testing

### 4. Install & Test
- [ ] Installed new version using automated script:
  ```bash
  npm run pack:install
  ```
- [ ] Manually reloaded VS Code: `Ctrl+Shift+P` → "Reload Window"
- [ ] Tested core functionality:
  - [ ] Syntax highlighting works
  - [ ] IntelliSense shows methods
  - [ ] Go to Definition (F12) works
  - [ ] Hover shows documentation
  - [ ] Diagnostics display correctly
  - [ ] No new errors/warnings

## 📤 Git Publication

### 5. Commit & Push
- [ ] Removed old VSIX from repository (keep only latest):
  ```bash
  git rm pml-aveva-e3d-*.vsix
  git add pml-aveva-e3d-0.9.X.vsix
  ```
- [ ] Added all changes:
  ```bash
  git add -A
  ```
- [ ] Created descriptive commit:
  ```bash
  git commit -m "release: v0.9.X - description"
  ```
- [ ] Pushed changes:
  ```bash
  git push
  ```
- [ ] Verified status on GitHub (all files uploaded)

## 🚀 GitHub Release

### 6. Create Release

#### Option A: GitHub CLI (recommended)
- [ ] Created file `RELEASE_NOTES_v0.9.X.md` with change description
- [ ] Executed command:
  ```bash
  gh release create v0.9.X pml-aveva-e3d-0.9.X.vsix --title "v0.9.X - Release Title" --notes-file RELEASE_NOTES_v0.9.X.md
  ```
- [ ] Received release URL

#### Option B: Web Interface
- [ ] Opened https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/new
- [ ] Filled fields:
  - [ ] **Tag version**: `v0.9.X`
  - [ ] **Release title**: `v0.9.X - Release Title`
  - [ ] **Description**: Copied from `RELEASE_NOTES_v0.9.X.md`
- [ ] Uploaded file `pml-aveva-e3d-0.9.X.vsix`
- [ ] Clicked **Publish release**

### 7. Verify Release
- [ ] Release appears at https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases
- [ ] VSIX file is downloadable
- [ ] Description displays correctly
- [ ] Links work

## ✅ Post-Release

### 8. Final Checks
- [ ] Verified repository homepage
- [ ] README.md is up-to-date (if changed)
- [ ] Created issue for next version (optional)
- [ ] Updated project tracker (optional)

### 9. Cleanup
- [ ] Deleted local VSIX files (keep only latest):
  ```bash
  # Optional - to save space
  rm pml-aveva-e3d-0.9.[0-6].vsix
  ```
- [ ] Verified `.gitignore` (VSIX files should NOT be ignored - we keep one in repo)

## 📝 Notes

### Quick Command for Full Release Cycle

```bash
# 1. Update version in package.json manually
# 2. Update CHANGELOG.md manually
# 3. Update ROADMAP.md manually

# 4. Compile and build
npm run compile
npm run pack

# 5. Install locally and test
npm run pack:install
# Then manually: Ctrl+Shift+P -> Reload Window

# 6. Test the extension...

# 7. Remove old VSIX and commit
git rm pml-aveva-e3d-*.vsix
git add pml-aveva-e3d-0.9.X.vsix
git add -A
git commit -m "release: v0.9.X - description"
git push

# 8. Create GitHub release
gh release create v0.9.X pml-aveva-e3d-0.9.X.vsix --title "v0.9.X - Title" --notes-file RELEASE_NOTES_v0.9.X.md
```

### VSIX Storage Policy

**Important**: Only ONE VSIX file is stored in the repository (latest version).

- **Repository**: Contains only the latest `pml-aveva-e3d-0.9.X.vsix`
- **GitHub Releases**: Contains all historical versions with release notes
- **When upgrading**: Remove old VSIX from repository, add new one
- **To download old versions**: Use GitHub Releases page

### Semantic Versioning

Using [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking API changes
- **MINOR** (0.1.0): New features (backwards compatible)
- **PATCH** (0.0.1): Bug fixes (backwards compatible)

### Commit Message Format

Using [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add new feature (v0.9.X)` - new feature
- `fix: fix bug description (v0.9.X)` - bug fix
- `docs: update documentation` - documentation
- `chore: remove old files` - maintenance
- `refactor: refactor code` - code refactoring
- `perf: improve performance` - optimization

---

**Last Updated**: 2025-01-29
