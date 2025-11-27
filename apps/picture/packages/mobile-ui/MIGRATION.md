# Migration: @memoro/ui → @memoro/mobile-ui

**Date:** 2025-10-08
**Reason:** Clarify framework compatibility in monorepo structure

## What Changed

### Package Rename

- **Old:** `@memoro/ui`
- **New:** `@memoro/mobile-ui`
- **Directory:** `packages/memoro-ui/` → `packages/mobile-ui/`

### Framework Scope

The package is now explicitly **React Native only**.

**Compatible:**

- ✅ React Native (Expo)
- ✅ Expo Router
- ✅ React Native apps

**Not Compatible:**

- ❌ SvelteKit (Web app)
- ❌ Astro (Landing page)
- ❌ Next.js / React DOM
- ❌ Any web framework

## Why This Change?

### Monorepo Structure

The picture project uses a monorepo with multiple apps:

```
picture/
├── apps/
│   ├── mobile/          # React Native (Expo) ✅ Can use @memoro/mobile-ui
│   ├── web/             # SvelteKit ❌ Cannot use
│   └── landing/         # Astro ❌ Cannot use
└── packages/
    └── mobile-ui/       # React Native components only
```

### Technical Reason

All 17 components use React Native primitives:

- `View`, `Pressable`, `Text` (not DOM elements)
- `react-native-reanimated`
- `react-native-safe-area-context`
- NativeWind (Tailwind for React Native)

These dependencies are **not compatible** with web frameworks.

## What Was Updated

### Files Changed

1. **Package name:**
   - `package.json` → `name: "@memoro/mobile-ui"`
   - `registry.json` → `name: "@memoro/mobile-ui"`

2. **Documentation:**
   - `README.md` - Added framework compatibility warning
   - `STATUS.md` - Added target apps section
   - `SUMMARY.md` - Added compatibility table
   - `CLI.md` - Added React Native-only note

3. **All path references:**
   - `packages/memoro-ui/` → `packages/mobile-ui/`

### No Breaking Changes

- Component code unchanged
- CLI tool works the same
- Import paths unchanged (still `@/components/ui/Button`)
- Registry structure unchanged

## For Developers

### If Using Mobile App (`@picture/mobile`)

**No action needed.** Everything works as before.

```bash
# Still works exactly the same
node packages/mobile-ui/cli/bin/cli.js list
node packages/mobile-ui/cli/bin/cli.js add button
```

### If Using Web App (`@picture/web`) or Landing

**Cannot use this library.** Build Svelte/Astro components instead.

Consider:

- Create `apps/web/src/lib/components/ui/` for Svelte components
- Create `apps/landing/src/components/` for Astro components
- Share design tokens (colors, spacing) via separate package

### Future: Shared Design Tokens

If UI consistency becomes important across all apps:

```
packages/
├── mobile-ui/           # React Native components
├── design-tokens/       # Shared colors, spacing, typography (NEW)
│   ├── colors.ts
│   ├── spacing.ts
│   └── tailwind.preset.js
└── shared/              # Supabase types (existing)
```

Then:

- Mobile app uses `@memoro/mobile-ui` + design tokens
- Web app builds Svelte components using same design tokens
- Landing builds Astro components using same design tokens

## Notes

- **No NPM publish yet** - Still embedded in picture monorepo
- **Future extraction:** Will move to `github.com/memoro/mobile-ui`
- **CLI location:** `packages/mobile-ui/cli/bin/cli.js`

## Questions?

See:

- [README.md](./README.md) - Main documentation
- [STATUS.md](./STATUS.md) - Current status and next steps
- [CLI.md](./CLI.md) - CLI usage guide
