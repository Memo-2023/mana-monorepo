# Expo SDK Upgrade Guide

**Current State (2026-03-28):**

| App | Expo SDK | React Native | Router | Status |
|-----|----------|-------------|--------|--------|
| matrix | **55** | 0.83.2 | ~55.0.5 | Target version |
| manacore | 54 | 0.81.5 | ~6.0.15 | Needs upgrade |
| cards | 54 | 0.81.4 | ~6.0.10 | Needs upgrade |
| picture | 54 | 0.81.4 | ~6.0.10 | Needs upgrade |
| traces | 54 | 0.81.4 | ~6.0.0 | Needs upgrade |
| chat | **52** | 0.76.7 | ~4.0.6 | Needs upgrade (2 majors!) |
| context | **52** | 0.76.9 | ~4.0.6 | Needs upgrade (2 majors!) |

**Target:** All apps on Expo SDK 55

## Breaking Changes SDK 52 → 55

### expo-router
- v4 (SDK 52) → v55 (SDK 55): Major API change
- Router is now versioned with the SDK (no more separate major versions)
- `expo-router/entry` still works as main entry point

### React
- React 18.3 → React 19.2
- New `use()` hook, improved Suspense

### React Native
- 0.76 → 0.83: New Architecture enabled by default
- Fabric renderer is default
- Bridgeless mode

### NativeWind
- v3/v4 → v4.2.3: Should be compatible if already on v4

## Upgrade Steps (Per App)

```bash
# 1. Use Expo upgrade tool
cd apps/{app}/apps/mobile
npx expo install expo@~55.0.5 --fix

# 2. This auto-upgrades compatible dependencies
# For manual deps, use:
npx expo install react-native@0.83.2 react@19.2.0 expo-router@~55.0.5

# 3. Update NativeWind
npx expo install nativewind@~4.2.3

# 4. Fix breaking changes
# - Check for deprecated APIs
# - Test navigation (expo-router changes)
# - Test NativeWind styles

# 5. Clear caches and test
npx expo start -c
```

## Recommended Upgrade Order

1. **traces** (simplest app, minimal deps)
2. **cards** (medium complexity)
3. **picture** (has image handling)
4. **manacore** (hub app, important)
5. **context** (SDK 52 → 55, bigger jump)
6. **chat** (SDK 52 → 55, most complex mobile app)

## Shared Dependencies to Update

All mobile apps share these workspace packages:
- `@manacore/shared-ui` (React Native components)
- `@manacore/shared-theme` (theme system)
- `@manacore/shared-auth` (auth service)

These should be tested with React 19 / RN 0.83 before upgrading apps.

## Testing Checklist (Per App)

- [ ] App starts without errors (`npx expo start`)
- [ ] Navigation works (all routes)
- [ ] Auth flow (login, logout, token refresh)
- [ ] NativeWind styles render correctly
- [ ] App-specific features work
- [ ] iOS simulator test
- [ ] Android emulator test (if applicable)
