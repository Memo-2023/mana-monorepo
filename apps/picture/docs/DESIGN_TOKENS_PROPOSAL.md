# Design Tokens Proposal - Executive Summary

**TL;DR:** Schaffe Vereinheitlichung durch **shared design tokens**, nicht durch shared components.

---

## 🎯 Problem

**3 Apps, 3 verschiedene Styling-Ansätze:**

| App | Colors | Problem |
|-----|--------|---------|
| Mobile | Theme System (3 Varianten) | ✅ Gut strukturiert |
| Web | Hardcoded in Components | ❌ Keine Konsistenz |
| Landing | Hardcoded in Components | ❌ Keine Konsistenz |

**Beispiel:**
```typescript
// Mobile: #818cf8 (indigo-400)
// Web:    #2563eb (blue-600)
// Landing: gradient purple-400 → pink-400

// Alle meinen "primary blue", aber unterschiedliche Werte!
```

---

## ✅ Lösung: Shared Design Tokens

### Was sind Design Tokens?

**Zentrale Definition von Design-Entscheidungen:**
```typescript
// Ein Token...
export const primary = '#818cf8';

// ...wird überall verwendet:
// Mobile:  backgroundColor: tokens.primary
// Web:     class="bg-[var(--color-primary)]"
// Landing: class="text-primary-500"
```

**Vorteil:** Ein Update, alle Apps konsistent! 🎉

---

## 📦 Vorgeschlagene Struktur

```
packages/
└── design-tokens/
    ├── src/
    │   ├── colors.ts          # Farben (dark/light, themes)
    │   ├── spacing.ts         # Abstände (4, 8, 12, 16...)
    │   ├── typography.ts      # Schriften (sizes, weights)
    │   ├── themes/
    │   │   ├── default.ts     # Standard Theme
    │   │   ├── sunset.ts      # Orange/Pink
    │   │   └── ocean.ts       # Blue/Teal
    │   └── index.ts
    ├── tailwind/
    │   └── preset.js          # Tailwind Preset
    ├── native/
    │   └── theme.ts           # React Native Helpers
    └── package.json
```

---

## 🎨 Beispiel: Color Tokens

```typescript
// packages/design-tokens/src/colors.ts
export const semanticColors = {
  dark: {
    background: '#000000',
    surface: '#242424',
    border: '#383838',

    primary: {
      default: '#818cf8',  // indigo-400
      hover: '#a5b4fc',    // indigo-300
      active: '#6366f1',   // indigo-500
    },

    text: {
      primary: '#f3f4f6',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
    },
  },

  light: {
    // ... light mode colors
  },
};
```

**Dann in allen Apps:**
```typescript
// Mobile
import { semanticColors } from '@memoro/design-tokens';
const bg = semanticColors.dark.background;

// Web (Svelte)
import { semanticColors } from '@memoro/design-tokens';
const theme = semanticColors.dark;

// Landing (Astro + Tailwind)
// Automatically available via Tailwind preset
<div class="bg-dark-bg text-primary">
```

---

## 🚀 Implementation

### 1. Mobile App ✅
```typescript
// Already has theme system, just replace hardcoded values

// Before
colors: { background: '#000000' }

// After
import { semanticColors } from '@memoro/design-tokens';
colors: semanticColors.dark
```

### 2. Web App 🔨
```svelte
<!-- Create theme store -->
<script>
  import { writable } from 'svelte/store';
  import { semanticColors } from '@memoro/design-tokens';

  export const theme = writable(semanticColors.dark);
</script>

<!-- Use in components -->
<button style="background: {$theme.primary.default}">
```

### 3. Landing Page 🔨
```javascript
// tailwind.config.mjs
import designTokensPreset from '@memoro/design-tokens/tailwind/preset';

export default {
  presets: [designTokensPreset],
  // Now has access to all token colors!
};
```

```astro
<!-- Use tokens via Tailwind -->
<div class="bg-dark-bg text-primary-default">
  <h1 class="text-primary-hover">Title</h1>
</div>
```

---

## 📊 Vergleich der Optionen

| Option | Pros | Cons | Aufwand | Empfehlung |
|--------|------|------|---------|------------|
| **1. Nichts tun** | Kein Aufwand | Keine Konsistenz | 0 | ❌ |
| **2. Shared Components** | Perfekte Konsistenz | Nicht möglich (RN ≠ Web) | - | ❌ |
| **3. CSS-in-JS Runtime** | Framework-agnostisch | Performance, Bundle | Hoch | ❌ |
| **4. Design Tokens** | Konsistenz, Performance | Initiale Setup | Mittel | ✅ |

---

## 🎯 Was wird vereinheitlicht?

### ✅ Vereinheitlicht durch Tokens:
- **Colors** - Alle Apps gleiche Farbpalette
- **Spacing** - Gleiche Abstände (4, 8, 12, 16...)
- **Typography** - Gleiche Schriftgrößen
- **Shadows** - Konsistente Schatten-Styles
- **Border Radius** - Einheitliche Rundungen
- **Themes** - Default/Sunset/Ocean überall

### ❌ NICHT vereinheitlicht (und das ist OK):
- **UI Components** - Jede App eigene Components
  - Mobile: React Native
  - Web: Svelte
  - Landing: Astro
- **Layout** - Jede App eigenes Layout
- **Navigation** - Framework-spezifisch

---

## 📈 Migration Plan

### Phase 1: Setup (1-2 Tage)
```bash
# 1. Create package
mkdir -p packages/design-tokens/src
cd packages/design-tokens

# 2. Extract colors from mobile app
cp apps/mobile/constants/colors.ts src/colors.ts
cp apps/mobile/constants/themes/* src/themes/

# 3. Add spacing, typography
# ... (see full strategy doc)

# 4. Create Tailwind preset
# ...

# 5. Build & test
npm run build
```

### Phase 2: Mobile App (1 Tag)
```typescript
// 1. Install
pnpm add @memoro/design-tokens --filter @picture/mobile

// 2. Update theme store
import { semanticColors } from '@memoro/design-tokens';

// 3. Update tailwind config
presets: [require('@memoro/design-tokens/tailwind/preset')]

// 4. Test theme switching
```

### Phase 3: Web App (2 Tage)
```typescript
// 1. Install
pnpm add @memoro/design-tokens --filter @picture/web

// 2. Create theme store
// src/lib/stores/theme.ts

// 3. Update components (Button, Card, Input, Modal)
// Replace hardcoded colors with theme.primary.default

// 4. Add theme switcher UI
```

### Phase 4: Landing (1 Tag)
```javascript
// 1. Install
pnpm add @memoro/design-tokens --filter @picture/landing

// 2. Update Tailwind config
import preset from '@memoro/design-tokens/tailwind/preset';

// 3. Update components (Hero, CTA, Features)
// Replace hardcoded colors with Tailwind classes

// 4. Done!
```

**Total: ~1 Woche** für komplette Vereinheitlichung

---

## 💡 Beispiel: Neues Theme hinzufügen

```typescript
// 1. Create packages/design-tokens/src/themes/forest.ts
export const forestTheme = {
  name: 'forest',
  colors: {
    dark: {
      ...semanticColors.dark,
      primary: {
        default: '#22c55e', // green-500
        hover: '#4ade80',   // green-400
      },
    },
  },
};

// 2. Export in src/themes/index.ts
export * from './forest';

// 3. Build
npm run build

// That's it! All 3 apps now support Forest theme! 🌲
```

---

## ✅ Benefits

**1. Visual Consistency**
- Gleiche Farben überall
- Einheitliche Abstände
- Konsistente Typography

**2. Easy Updates**
```typescript
// Change primary color once...
primary: '#818cf8' → '#10b981'

// ...updates everywhere automatically!
```

**3. Theme Support**
```typescript
// All apps support all themes
const theme = useTheme('sunset'); // 🌅
const theme = useTheme('ocean');  // 🌊
const theme = useTheme('forest'); // 🌲
```

**4. Type Safety**
```typescript
// Full TypeScript support
const color: string = tokens.colors.primary.default; ✅
const color: string = tokens.colors.primaryy.default; ❌ Type error!
```

**5. Zero Runtime Cost**
- Compile-time only
- No JS overhead
- Minimal bundle impact

---

## 🤔 Open Questions

### 1. Theme Variants
**Frage:** Welche Themes brauchen wir?
- ✅ Default (Indigo)
- ✅ Sunset (Orange/Pink)
- ✅ Ocean (Blue/Teal)
- ❓ Forest (Green) ?
- ❓ Andere?

### 2. Light Mode
**Frage:** Priorität für Light Mode?
- Option A: Alle Apps (mehr Aufwand)
- Option B: Nur Mobile (weniger Aufwand)
- Option C: Später

### 3. Breakpoints
**Frage:** Shared responsive breakpoints?
```typescript
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};
```

### 4. Animation Timing
**Frage:** Shared animation durations?
```typescript
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
};
```

---

## 🚦 Decision Needed

**Sollen wir das umsetzen?**

- ✅ **JA** → Starten mit Phase 1 (Package Setup)
- ⏸️ **SPÄTER** → Warten bis mehr Inkonsistenzen auftreten
- ❌ **NEIN** → Alternative Ansatz?

**Wenn JA:**
1. Ich erstelle das `@memoro/design-tokens` Package
2. Migriere Mobile App als Proof of Concept
3. Dann Web & Landing

**Zeitaufwand:** ~1 Woche für vollständige Implementation

---

## 📚 Resources

- **Full Strategy:** [UI_UNIFICATION_STRATEGY.md](./UI_UNIFICATION_STRATEGY.md)
- **Current State:** Mobile hat bereits gutes Theme System
- **Inspiration:** [Tailwind CSS](https://tailwindcss.com/docs/customizing-colors), [Radix Themes](https://www.radix-ui.com/themes/docs/theme/color)

---

**Status:** 📝 Proposal - Awaiting Decision
**Next:** Create `@memoro/design-tokens` package or discuss alternatives
