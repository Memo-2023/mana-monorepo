# @memoro/design-tokens

**Shared design tokens for all memoro apps.**

Design tokens provide a single source of truth for colors, spacing, typography, and other design decisions across the entire picture monorepo.

## 🎨 What's Included

- **Colors** - Complete color palette with semantic naming
- **Spacing** - Consistent spacing scale (4px grid)
- **Typography** - Font sizes, weights, line heights
- **Shadows** - React Native shadow definitions
- **Themes** - 3 theme variants (Default/Sunset/Ocean)
- **Tailwind Preset** - Ready-to-use Tailwind configuration
- **React Native Helpers** - Utility functions for RN

## 📦 Installation

```bash
# In your app directory
pnpm add @memoro/design-tokens
```

## 🚀 Usage

### Mobile App (React Native)

```typescript
import { createNativeTheme } from '@memoro/design-tokens/native';
import { spacing, fontSize } from '@memoro/design-tokens';

// Create theme
const theme = createNativeTheme('default', 'dark');

// Use in components
<View style={{
  backgroundColor: theme.colors.background,
  padding: spacing[4],
}}>
  <Text style={{
    color: theme.colors.text.primary,
    fontSize: fontSize.xl,
  }}>
    Hello World
  </Text>
</View>
```

### Web App (SvelteKit + Tailwind)

```javascript
// tailwind.config.js
import preset from '@memoro/design-tokens/tailwind/preset';

export default {
  presets: [preset],
  content: ['./src/**/*.{html,js,svelte,ts}'],
};
```

```svelte
<!-- Use in components -->
<div class="bg-dark-bg text-primary">
  <h1 class="text-3xl font-bold">Hello World</h1>
</div>
```

### Landing Page (Astro + Tailwind)

```javascript
// tailwind.config.mjs
import preset from '@memoro/design-tokens/tailwind/preset';

export default {
  presets: [preset],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
};
```

```astro
---
// Use in components
---
<div class="bg-dark-bg p-6 rounded-lg">
  <h1 class="text-primary text-5xl font-bold">Hello World</h1>
</div>
```

## 🎨 Available Themes

### Default (Indigo)
Modern, professional design with indigo as primary color.

```typescript
import { themes } from '@memoro/design-tokens';
const theme = themes.default;
```

**Colors:**
- Primary: Indigo (#818cf8)
- Secondary: Violet (#a78bfa)

### Sunset (Orange/Pink)
Warm, creative design with orange-pink palette.

```typescript
const theme = themes.sunset;
```

**Colors:**
- Primary: Orange (#fb923c)
- Secondary: Pink (#f472b6)

### Ocean (Teal/Cyan)
Fresh, calming design with teal-cyan palette.

```typescript
const theme = themes.ocean;
```

**Colors:**
- Primary: Teal (#2dd4bf)
- Secondary: Cyan (#22d3ee)

## 📐 Token Reference

### Colors

```typescript
import { baseColors, semanticColors } from '@memoro/design-tokens';

// Base colors
baseColors.indigo[400]  // #818cf8
baseColors.gray[100]    // #f3f4f6

// Semantic colors (dark mode)
semanticColors.dark.background   // #000000
semanticColors.dark.primary.default  // #818cf8
semanticColors.dark.text.primary    // #f3f4f6

// Semantic colors (light mode)
semanticColors.light.background  // #ffffff
semanticColors.light.primary.default  // #6366f1
```

### Spacing

```typescript
import { spacing } from '@memoro/design-tokens';

spacing[0]   // 0
spacing[1]   // 4px
spacing[2]   // 8px
spacing[4]   // 16px
spacing[8]   // 32px
spacing[12]  // 48px
```

### Typography

```typescript
import { fontSize, fontWeight } from '@memoro/design-tokens';

fontSize.xs      // 12
fontSize.base    // 16
fontSize.xl      // 20
fontSize['4xl']  // 36

fontWeight.regular   // '400'
fontWeight.medium    // '500'
fontWeight.bold      // '700'
```

### Border Radius

```typescript
import { borderRadius } from '@memoro/design-tokens';

borderRadius.sm    // 4
borderRadius.md    // 8
borderRadius.lg    // 12
borderRadius.full  // 9999
```

## 🔧 Advanced Usage

### Creating Custom Themes

```typescript
import { baseColors, semanticColors, shadows, opacity } from '@memoro/design-tokens';

const customTheme = {
  name: 'forest',
  displayName: 'Forest',
  colors: {
    dark: {
      ...semanticColors.dark,
      primary: {
        default: '#22c55e', // green-500
        hover: '#4ade80',
        active: '#16a34a',
        // ...
      },
    },
  },
  shadows,
  opacity,
};
```

### Using in Theme Context

```typescript
// Mobile app theme store
import { createNativeTheme } from '@memoro/design-tokens/native';

const theme = createNativeTheme('sunset', 'dark');

// theme.colors.primary.default
// theme.spacing[4]
// theme.fontSize.xl
```

## 🎯 Framework Compatibility

| Package Part | Mobile (RN) | Web (Svelte) | Landing (Astro) |
|--------------|-------------|--------------|-----------------|
| Colors | ✅ Yes | ✅ Yes | ✅ Yes |
| Spacing | ✅ Yes | ✅ Yes | ✅ Yes |
| Typography | ✅ Yes | ✅ Yes | ✅ Yes |
| Themes | ✅ Yes | ✅ Yes | ✅ Yes |
| Tailwind Preset | ✅ Yes (NativeWind) | ✅ Yes | ✅ Yes |
| React Native Helpers | ✅ Yes | ❌ No | ❌ No |

## 📁 Package Structure

```
@memoro/design-tokens/
├── src/
│   ├── colors.ts          # Color definitions
│   ├── spacing.ts         # Spacing scale
│   ├── typography.ts      # Font sizes & weights
│   ├── shadows.ts         # Shadow definitions
│   ├── themes/
│   │   ├── default.ts     # Default theme
│   │   ├── sunset.ts      # Sunset theme
│   │   ├── ocean.ts       # Ocean theme
│   │   └── index.ts
│   └── index.ts           # Main export
├── tailwind/
│   └── preset.js          # Tailwind preset
├── native/
│   └── theme.ts           # React Native helpers
└── package.json
```

## 🚀 Benefits

1. **Single Source of Truth** - Change colors once, update everywhere
2. **Type Safety** - Full TypeScript support
3. **Consistency** - Same design tokens across all apps
4. **Easy Theming** - Switch themes with one line of code
5. **Zero Runtime Cost** - Compile-time only (except RN helpers)

## 📝 Examples

### Example 1: Mobile Button Component

```typescript
import { useTheme } from '~/contexts/ThemeContext';

function Button({ title, onPress }) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={{
        backgroundColor: theme.colors.primary.default,
        padding: theme.spacing[4],
        borderRadius: theme.borderRadius.md,
      }}
      onPress={onPress}
    >
      <Text style={{
        color: theme.colors.primary.contrast,
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
      }}>
        {title}
      </Text>
    </Pressable>
  );
}
```

### Example 2: Web Button Component

```svelte
<script lang="ts">
  export let title: string;
  export let onclick: () => void;
</script>

<button
  class="bg-primary hover:bg-primary-hover text-white font-semibold py-4 px-6 rounded-md"
  on:click={onclick}
>
  {title}
</button>
```

### Example 3: Switching Themes

```typescript
// Mobile app
import { createNativeTheme } from '@memoro/design-tokens/native';

// Switch to sunset theme
const newTheme = createNativeTheme('sunset', 'dark');
setTheme(newTheme);

// All components automatically update!
```

## 🤝 Contributing

When adding new tokens:

1. Update the appropriate file in `src/`
2. Add to TypeScript types
3. Update Tailwind preset if needed
4. Add to React Native helpers if needed
5. Update this README
6. Run `pnpm build`

## 📄 License

Private - memoro internal use only.

---

**Version:** 0.1.0
**Last Updated:** 2025-10-08
