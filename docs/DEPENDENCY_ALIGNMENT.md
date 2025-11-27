# Dependency Alignment Guide

This document tracks critical dependencies across all projects and their target versions for alignment.

## Critical Dependencies

### High Priority - Version Mismatches

| Package                 | Target Version | Current Versions  | Notes                                  |
| ----------------------- | -------------- | ----------------- | -------------------------------------- |
| `@supabase/supabase-js` | **2.81.1**     | 2.38.4 - 2.81.1   | Significant spread, alignment critical |
| `typescript`            | **5.9.2**      | 5.3.3 - 5.9.2     | Update all to latest                   |
| `react`                 | **19.1.0**     | 18.3.1 - 19.1.0   | Mixed versions                         |
| `expo`                  | **54.x**       | 52.0.39 - 54.0.21 | Manacore needs update                  |
| `expo-router`           | **6.x**        | 4.0.19 - 6.0.14   | Manacore needs update                  |
| `astro`                 | **5.16.0**     | 5.3.0 - 5.16.0    | Memoro landing needs update            |

### Current Status by Project

#### Supabase Versions

```
maerchenzauber:
  - backend: 2.50.3
  - mobile: 2.50.3

manacore:
  - mobile: 2.38.4 ❌ (very outdated)
  - web: 2.49.2

manadeck:
  - backend: 2.58.0
  - mobile: 2.38.4 ❌ (very outdated)
  - web: 2.81.1 ✅

memoro:
  - mobile: 2.49.4
  - web: 2.76.1
```

#### Expo/React Native Versions

```
maerchenzauber:
  - expo: 54.0.21 ✅
  - react-native: 0.81.5 ✅
  - expo-router: 6.0.14 ✅

manacore:
  - expo: 52.0.39 ❌ (SDK 52, needs update to 54)
  - react-native: 0.76.7 ❌
  - expo-router: 4.0.19 ❌

manadeck:
  - expo: 54.0.13 ✅
  - react-native: 0.81.4 ✅
  - expo-router: 6.0.10 ✅

memoro:
  - expo: 54.0.0 ✅
  - react-native: 0.81.4 ✅
  - expo-router: 6.0.8 ✅
```

#### NestJS Versions (Backends)

```
maerchenzauber: NestJS 10.0.0
manadeck: NestJS 11.0.1

Target: Align to NestJS 11.x
```

## Migration Priority

### Phase 1: Critical Alignments (Week 1)

1. **Manacore Expo Update** (High Risk)
   - Upgrade from Expo SDK 52 → 54
   - Update expo-router 4.x → 6.x
   - Update react-native 0.76.7 → 0.81.x
   - This is the most significant update needed

2. **Supabase Alignment**
   - Update all projects to 2.81.1
   - Test auth flows after update
   - Check for breaking changes in RLS

3. **TypeScript Alignment**
   - Update all to 5.9.2
   - Run type-check across all projects

### Phase 2: Secondary Alignments (Week 2)

1. **Astro Updates**
   - Update Memoro landing from 5.3.0 → 5.16.0

2. **SvelteKit/Vite Updates**
   - Align Vite versions (6.0.7 → 7.1.10)
   - Align SvelteKit versions

3. **NestJS Alignment**
   - Update Maerchenzauber backend 10.x → 11.x
   - Test all API endpoints

## Alignment Commands

### Update Supabase across all projects:

```bash
# Maerchenzauber
cd maerchenzauber/apps/backend && pnpm update @supabase/supabase-js@2.81.1
cd maerchenzauber/apps/mobile && pnpm update @supabase/supabase-js@2.81.1

# Manacore
cd manacore/apps/mobile && pnpm update @supabase/supabase-js@2.81.1
cd manacore/apps/web && pnpm update @supabase/supabase-js@2.81.1

# Manadeck
cd manadeck/backend && pnpm update @supabase/supabase-js@2.81.1
cd manadeck/apps/mobile && pnpm update @supabase/supabase-js@2.81.1

# Memoro
cd memoro/apps/mobile && pnpm update @supabase/supabase-js@2.81.1
cd memoro/apps/web && pnpm update @supabase/supabase-js@2.81.1
```

### Update TypeScript across all projects:

```bash
pnpm update typescript@5.9.2 --recursive
```

## Testing After Alignment

After updating dependencies, verify:

1. **Build succeeds**: `pnpm run build`
2. **Type checks pass**: `pnpm run type-check`
3. **Tests pass**: `pnpm run test`
4. **Auth flows work** (especially after Supabase updates)
5. **Mobile apps launch** (especially after Expo updates)

## Breaking Changes to Watch

### Supabase 2.38 → 2.81

- Auth session handling may have changed
- Check `onAuthStateChange` listeners
- Verify RLS policies still work

### Expo SDK 52 → 54

- Check expo-router migration guide
- New navigation patterns in 6.x
- Screen options changes
- Layout changes

### NestJS 10 → 11

- Decorator changes
- Module resolution changes
- Check middleware compatibility

## Recommended Tools

- **Renovate/Dependabot**: Auto-update dependencies
- **pnpm outdated**: Check for outdated packages
- **turbo prune**: Create minimal installs for specific projects

## Tracking Updates

Mark completed updates:

- [ ] Supabase alignment (all projects)
- [ ] TypeScript alignment (all projects)
- [ ] Manacore Expo SDK update
- [ ] Astro alignment
- [ ] NestJS alignment
- [ ] SvelteKit/Vite alignment
