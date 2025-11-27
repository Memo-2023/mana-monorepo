# Rename Changelog: @memoro/ui → @memoro/mobile-ui

**Date:** 2025-10-08
**Completed:** ✅ All changes applied

## Summary

Renamed `@memoro/ui` to `@memoro/mobile-ui` to clarify that this library is **React Native only** and not compatible with web frameworks in the monorepo.

## Changes Applied

### 1. Package & Directory ✅

- [x] Renamed directory: `packages/memoro-ui/` → `packages/mobile-ui/`
- [x] Created `package.json` with name `@memoro/mobile-ui`
- [x] Updated `registry.json` with new name and framework field

### 2. Documentation Updates ✅

All documentation files updated with:

- New package name
- Framework compatibility warnings
- Updated all path references

**Files updated:**

- [x] `README.md` - Added framework compatibility section
- [x] `STATUS.md` - Added target apps table
- [x] `SUMMARY.md` - Added compatibility notes
- [x] `CLI.md` - Added React Native-only warning
- [x] All `packages/memoro-ui/` → `packages/mobile-ui/` path references

### 3. New Documentation ✅

- [x] `MIGRATION.md` - Migration guide and reasoning
- [x] `MONOREPO_ARCHITECTURE.md` - Framework compatibility architecture
- [x] `RENAME_CHANGELOG.md` - This file
- [x] `packages/README.md` - Overview of all packages

### 4. Cleanup ✅

- [x] Removed empty `packages/ui/` directory

## Framework Compatibility Added

All documentation now clearly states:

**Compatible:**

- ✅ React Native (Expo) - Full support
- ✅ Mobile app (`@picture/mobile`)

**Not Compatible:**

- ❌ SvelteKit (Web app)
- ❌ Astro (Landing page)
- ❌ Any web framework

## CLI Usage (Updated)

```bash
# Old paths (no longer work)
node packages/memoro-ui/cli/bin/cli.js list

# New paths (current)
node packages/mobile-ui/cli/bin/cli.js list
```

## Import Paths (Unchanged)

Component imports remain the same:

```tsx
// Still works exactly the same
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
```

## Breaking Changes

**None.** This is a rename only:

- Component code unchanged
- Component API unchanged
- Registry structure unchanged
- Import paths unchanged

Only documentation and package metadata updated.

## Files Changed

### Modified:

1. `README.md`
2. `STATUS.md`
3. `SUMMARY.md`
4. `CLI.md`
5. `registry.json`

### Created:

1. `package.json`
2. `MIGRATION.md`
3. `MONOREPO_ARCHITECTURE.md`
4. `RENAME_CHANGELOG.md`
5. `../README.md` (packages directory)

### Removed:

1. `../ui/` (empty directory)

## Next Steps

### Immediate

- [ ] Test CLI with new paths in mobile app
- [ ] Verify all 17 components still work
- [ ] Update any external references

### Future

- [ ] Extract to `github.com/memoro/mobile-ui` (separate repo)
- [ ] Publish to GitHub Packages as `@memoro/mobile-ui`
- [ ] Consider creating `@memoro/design-tokens` for shared styling

## Verification Checklist

- [x] Directory renamed successfully
- [x] All documentation updated
- [x] All path references corrected
- [x] CLI paths updated
- [x] Framework compatibility documented
- [x] Migration guide created
- [x] Architecture documented
- [x] Empty directories cleaned up

## Status

✅ **COMPLETE** - All changes applied successfully.

The package is now correctly scoped as React Native-only and clearly documented for use in the monorepo.
