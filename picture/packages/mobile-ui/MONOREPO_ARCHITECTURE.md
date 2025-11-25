# @memoro/mobile-ui - Monorepo Architecture

**Date:** 2025-10-08

## Picture Monorepo Structure

```
picture/
├── apps/
│   ├── mobile/          # React Native (Expo)
│   │   └── 🎯 Target for @memoro/mobile-ui
│   ├── web/             # SvelteKit
│   │   └── ❌ Not compatible with @memoro/mobile-ui
│   └── landing/         # Astro
│       └── ❌ Not compatible with @memoro/mobile-ui
├── packages/
│   ├── mobile-ui/       # React Native UI components (THIS)
│   ├── shared/          # Supabase types & client
│   └── ui/              # (empty/deprecated)
└── pnpm-workspace.yaml
```

## Framework Compatibility Matrix

| Package | Mobile (RN) | Web (Svelte) | Landing (Astro) |
|---------|-------------|--------------|-----------------|
| `@memoro/mobile-ui` | ✅ Full support | ❌ Not compatible | ❌ Not compatible |
| `@picture/shared` | ✅ Yes | ✅ Yes | ✅ Yes |

## Why Mobile-Only?

### Technical Constraints

**@memoro/mobile-ui uses React Native primitives:**
```tsx
import { View, Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

**Web apps use different primitives:**
```svelte
<!-- SvelteKit -->
<div class="...">
  <button on:click={...}>
```

```astro
<!-- Astro -->
<div class="...">
  <button onclick="...">
```

### Cannot Share Components Directly

React Native components **cannot run** in web browsers:
- `View` is not `<div>`
- `Pressable` is not `<button>`
- `react-native-reanimated` doesn't work on web

## Current UI Component Strategy

### Mobile App (`@picture/mobile`)
✅ **Uses:** `@memoro/mobile-ui`
- 17 React Native components
- CLI tool for installation
- Full TypeScript support

```bash
# Install components
node packages/mobile-ui/cli/bin/cli.js add button
```

### Web App (`@picture/web`)
🔨 **Strategy:** Build own Svelte components
- Located in: `apps/web/src/lib/components/ui/`
- Currently has: `Button.svelte`, `Card.svelte`, `Input.svelte`
- Uses: Tailwind CSS v4

### Landing Page (`@picture/landing`)
🔨 **Strategy:** Build own Astro components
- Located in: `apps/landing/src/components/`
- Currently has: `Hero.astro`, `CTA.astro`, `Features.astro`
- Uses: Tailwind CSS v3

## Shared Elements

### What CAN Be Shared

✅ **Backend Logic** - `@picture/shared`
- Supabase client
- Database types
- API utilities

✅ **Design Tokens** (Future)
Could create `@memoro/design-tokens`:
```typescript
// packages/design-tokens/colors.ts
export const colors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  // ...
};
```

Then all apps import:
```tsx
// Mobile
import { colors } from '@memoro/design-tokens';

// Web
import { colors } from '@memoro/design-tokens';

// Landing
import { colors } from '@memoro/design-tokens';
```

### What CANNOT Be Shared

❌ **UI Components**
- React Native components (mobile-ui) don't work on web
- Svelte components don't work in React Native
- Astro components don't work in React Native

## Future Options

### Option 1: Keep Separate (CURRENT) ✅
**Pros:**
- Simple
- Framework-optimized components
- No complexity

**Cons:**
- Duplicate implementation
- Harder to maintain consistency

### Option 2: Shared Design Tokens
**Pros:**
- Visual consistency (colors, spacing, typography)
- Single source of truth for design
- Easy to update branding

**Implementation:**
```
packages/
└── design-tokens/
    ├── colors.ts
    ├── spacing.ts
    ├── typography.ts
    └── tailwind.preset.js
```

### Option 3: Headless UI + Adapters (ADVANCED)
**Pros:**
- Shared business logic
- Framework-specific rendering
- Consistent behavior

**Cons:**
- Complex setup
- More packages to manage
- Overhead

```
packages/
├── ui-core/           # Headless logic (TypeScript)
├── mobile-ui/         # React Native rendering
├── web-ui/            # Svelte rendering
└── landing-ui/        # Astro rendering
```

## Recommendations

### Short-Term ✅
1. Keep `@memoro/mobile-ui` React Native-only
2. Web & Landing build own components
3. Share only backend logic (`@picture/shared`)

### Medium-Term 🎯
1. Extract common design tokens
2. Create `@memoro/design-tokens` package
3. All apps use same colors/spacing/typography

### Long-Term 🚀
1. If UI consistency becomes critical, consider headless UI
2. Otherwise, keep separate implementations

## Summary

**@memoro/mobile-ui:**
- ✅ React Native only
- ✅ 17 components ready
- ✅ CLI tool working
- ❌ Not for web apps

**Picture Apps:**
- Mobile → Uses @memoro/mobile-ui
- Web → Builds own Svelte components
- Landing → Builds own Astro components
- All → Share @picture/shared (backend)

**Future:**
- Consider @memoro/design-tokens for visual consistency
- Keep UI implementations separate per framework
