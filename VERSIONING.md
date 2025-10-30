# Versioning Strategy

This project follows [Semantic Versioning 2.0.0](https://semver.org/) with adaptations for pre-1.0 development.

## Format: MAJOR.MINOR.PATCH

Given a version number `MAJOR.MINOR.PATCH`, increment the:

1. **MAJOR** version when you make incompatible API changes
2. **MINOR** version when you add functionality in a backward compatible manner
3. **PATCH** version when you make backward compatible bug fixes

## Pre-1.0 Development (Current Phase)

During the 0.x.x phase, the versioning strategy is:

### 0.MINOR.PATCH

- **0.x.0** - New features, gadget types, significant enhancements
- **0.x.y** - Bug fixes, small improvements, documentation updates

### Examples from This Project

#### MINOR Version Bumps (0.x.0)
- **0.9.0** → Added parser improvements, new commands
- **0.10.0** → Added Frame Gadgets support (9 snippets + tutorial + menu)
- **0.11.0** → Will add Text/TextField Gadgets (future)
- **0.12.0** → Will add Option/OptionList Gadgets (future)

#### PATCH Version Bumps (0.x.y)
- **0.9.9** → **0.9.10** - Fix typos in snippets
- **0.9.9** → **0.9.10** - Update documentation
- **0.9.9** → **0.9.10** - Fix regex bug in existing command
- **0.10.0** → **0.10.1** - Fix tutorial loading issue
- **0.10.0** → **0.10.1** - Improve error messages

## Version 1.0.0 - Production Release

The **1.0.0** release signifies production readiness. Requirements:

### Criteria for 1.0.0
1. **Testing**: All core features tested with test suite coverage
2. **Stability**: No critical bugs, no breaking changes for 4+ weeks
3. **Documentation**: Complete user guide, API docs, contribution guide
4. **Examples**: Comprehensive examples for all major features
5. **Performance**: Language server performs well on large files
6. **Community**: Published to VS Code Marketplace

See [V1.0_PLAN.md](V1.0_PLAN.md) for detailed roadmap (estimated 12-20 weeks).

## Post-1.0 Versioning

After reaching 1.0.0, strict Semantic Versioning applies:

### MAJOR (x.0.0) - Breaking Changes
- Remove deprecated features
- Change existing command behavior incompatibly
- Require VS Code API version bump
- Change configuration structure

**Example**: 1.5.3 → 2.0.0
- Removed deprecated commands from 0.x era
- Changed snippet prefix naming convention

### MINOR (1.x.0) - New Features
- Add new gadget type support
- Add new commands
- Add new language server features
- Add new configuration options

**Example**: 1.2.5 → 1.3.0
- Added Toggle Gadgets support
- Added auto-completion for methods

### PATCH (1.2.x) - Bug Fixes
- Fix crashes
- Fix incorrect parsing
- Fix command errors
- Performance improvements
- Documentation fixes

**Example**: 1.2.3 → 1.2.4
- Fixed ReIndex command on path arrays
- Fixed tutorial file packaging

## Deprecation Policy (Post-1.0)

When deprecating features:
1. **Mark as deprecated** in MINOR version (1.x.0)
2. **Update docs** with migration guide
3. **Show warnings** in extension for 2+ MINOR versions
4. **Remove** in next MAJOR version (2.0.0)

**Example Timeline**:
- v1.5.0: Deprecate `pml.oldCommand`, add `pml.newCommand`
- v1.6.0: Show warning when using `pml.oldCommand`
- v1.7.0: Continue warning
- v2.0.0: Remove `pml.oldCommand`

## Git Tagging

Every release is tagged in git:

```bash
git tag -a v0.10.0 -m "Release v0.10.0 - Frame Gadgets Support"
git push origin v0.10.0
```

## GitHub Releases

Each version has a GitHub release with:
- Release notes (from RELEASE_NOTES.md)
- VSIX package attachment
- MD5 checksum for verification
- Link to CHANGELOG.md for full history

## Quick Decision Guide

**What to bump?**

| Change Type | Example | Version Change |
|-------------|---------|----------------|
| New gadget type (pre-1.0) | Add Frame Gadgets | 0.9.0 → 0.10.0 |
| New major feature (pre-1.0) | Add diagnostics engine | 0.10.0 → 0.11.0 |
| Bug fix (pre-1.0) | Fix array command regex | 0.10.0 → 0.10.1 |
| Documentation only (pre-1.0) | Update README | 0.10.0 → 0.10.1 |
| New gadget type (post-1.0) | Add Toggle Gadgets | 1.2.0 → 1.3.0 |
| Breaking change (post-1.0) | Remove deprecated API | 1.9.5 → 2.0.0 |
| Bug fix (post-1.0) | Fix parser crash | 1.2.3 → 1.2.4 |

## Version History

See [CHANGELOG.md](CHANGELOG.md) for complete version history with detailed changes.

---

**Current Version**: 0.10.0 (Frame Gadgets Support)
**Target**: 1.0.0 (Production Release)
**Progress**: ~75% to v1.0.0
