# Picture - Shared Packages

This directory contains shared packages used across the picture monorepo.

## Packages

### `@memoro/mobile-ui`
**React Native UI component library**

- **Framework:** React Native (Expo) only
- **Components:** 17 UI + Navigation components
- **Target:** Mobile app (`@picture/mobile`)
- **Status:** ✅ Ready to use

**Compatible Apps:**
- ✅ Mobile (`apps/mobile/`)
- ❌ Web (`apps/web/`) - Not compatible
- ❌ Landing (`apps/landing/`) - Not compatible

**Usage:**
```bash
# From project root
node packages/mobile-ui/cli/bin/cli.js list
node packages/mobile-ui/cli/bin/cli.js add button
```

**Documentation:**
- [README](./mobile-ui/README.md) - Main documentation
- [CLI Guide](./mobile-ui/CLI.md) - How to use the CLI
- [Status](./mobile-ui/STATUS.md) - Current progress
- [Monorepo Architecture](./mobile-ui/MONOREPO_ARCHITECTURE.md) - Framework compatibility

---

### `@picture/shared`
**Shared backend logic and types**

- **Framework:** Framework-agnostic (TypeScript)
- **Content:** Supabase types, API client, utilities
- **Target:** All apps

**Compatible Apps:**
- ✅ Mobile (`apps/mobile/`)
- ✅ Web (`apps/web/`)
- ✅ Landing (`apps/landing/`)

**Usage:**
```tsx
import { supabase } from '@picture/shared';
import type { Database } from '@picture/shared/types';
```

---

## Framework Compatibility Matrix

| Package | Mobile (RN) | Web (Svelte) | Landing (Astro) |
|---------|-------------|--------------|-----------------|
| `@memoro/mobile-ui` | ✅ Yes | ❌ No | ❌ No |
| `@picture/shared` | ✅ Yes | ✅ Yes | ✅ Yes |

## Why Different Compatibility?

### `@memoro/mobile-ui` - React Native Only
Uses React Native primitives that don't work on web:
```tsx
import { View, Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';
```

### `@picture/shared` - Framework Agnostic
Pure TypeScript/JavaScript, no UI dependencies:
```tsx
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(...);
```

## UI Component Strategy

### Mobile App
**Uses:** `@memoro/mobile-ui`
- 17 React Native components
- CLI tool for installation
- Path: `packages/mobile-ui/`

### Web App
**Uses:** Own Svelte components
- Custom Svelte components
- Path: `apps/web/src/lib/components/ui/`
- Examples: `Button.svelte`, `Card.svelte`

### Landing Page
**Uses:** Own Astro components
- Custom Astro components
- Path: `apps/landing/src/components/`
- Examples: `Hero.astro`, `CTA.astro`

## Future Packages

### `@memoro/design-tokens` (Planned)
Shared design tokens for visual consistency:
```
packages/design-tokens/
├── colors.ts        # Brand colors
├── spacing.ts       # Spacing scale
├── typography.ts    # Font styles
└── tailwind.preset.js
```

Would be used by all apps to maintain consistent branding.

## Questions?

- **Mobile UI:** See [mobile-ui/README.md](./mobile-ui/README.md)
- **Shared Backend:** See shared package documentation
- **Monorepo Structure:** See [mobile-ui/MONOREPO_ARCHITECTURE.md](./mobile-ui/MONOREPO_ARCHITECTURE.md)
