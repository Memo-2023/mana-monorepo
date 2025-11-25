# @memoro/design-tokens - Quick Start

**TL;DR:** How to use design tokens in 5 minutes.

---

## 📦 Installation

Design tokens are already part of the monorepo workspace!

```bash
# No installation needed - already in workspace
# Just import and use!
```

---

## 🚀 Usage by App

### Mobile App (React Native)

**1. Import:**
```typescript
import { createNativeTheme } from '@memoro/design-tokens/native';
import { spacing, fontSize } from '@memoro/design-tokens';
```

**2. Create theme:**
```typescript
const theme = createNativeTheme('default', 'dark');
```

**3. Use in components:**
```typescript
<View style={{ backgroundColor: theme.colors.background }}>
  <Text style={{ color: theme.colors.text.primary }}>
    Hello World
  </Text>
</View>
```

---

### Web App (SvelteKit)

**1. Update Tailwind config:**
```javascript
// For Tailwind v4, we need a different approach
// See full docs for web-specific setup
```

**2. Create theme store:**
```typescript
// src/lib/stores/theme.ts
import { writable } from 'svelte/store';
import { themes } from '@memoro/design-tokens';

export const currentTheme = writable(themes.default.colors.dark);
```

**3. Use in components:**
```svelte
<script>
  import { currentTheme } from '$lib/stores/theme';
</script>

<div style="background: {$currentTheme.background}">
  <h1 style="color: {$currentTheme.primary.default}">
    Hello World
  </h1>
</div>
```

---

### Landing Page (Astro)

**1. Update Tailwind config:**
```javascript
// tailwind.config.mjs
import preset from '@memoro/design-tokens/tailwind/preset';

export default {
  presets: [preset],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx}'],
};
```

**2. Use in components:**
```astro
<div class="bg-dark-bg text-primary">
  <h1 class="text-5xl font-bold">Hello World</h1>
</div>
```

---

## 🎨 Available Tokens

### Colors
```typescript
// Semantic colors
theme.colors.background
theme.colors.surface
theme.colors.primary.default
theme.colors.primary.hover
theme.colors.text.primary
theme.colors.text.secondary

// Status colors
theme.colors.success
theme.colors.warning
theme.colors.error
```

### Spacing
```typescript
spacing[0]   // 0
spacing[1]   // 4px
spacing[2]   // 8px
spacing[4]   // 16px
spacing[6]   // 24px
spacing[8]   // 32px
```

### Typography
```typescript
fontSize.xs      // 12
fontSize.sm      // 14
fontSize.base    // 16
fontSize.xl      // 20
fontSize['2xl']  // 24

fontWeight.regular   // '400'
fontWeight.semibold  // '600'
fontWeight.bold      // '700'
```

### Border Radius
```typescript
borderRadius.sm    // 4
borderRadius.md    // 8
borderRadius.lg    // 12
borderRadius.full  // 9999
```

---

## 🎯 Common Patterns

### Pattern 1: Button

```typescript
// Mobile
<Pressable
  style={{
    backgroundColor: theme.colors.primary.default,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
    borderRadius: theme.borderRadius.md,
  }}
>
  <Text style={{
    color: theme.colors.primary.contrast,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  }}>
    Button
  </Text>
</Pressable>
```

```svelte
<!-- Web -->
<button class="bg-primary text-white px-6 py-3 rounded-md font-semibold">
  Button
</button>
```

### Pattern 2: Card

```typescript
// Mobile
<View style={{
  backgroundColor: theme.colors.surface,
  padding: theme.spacing[4],
  borderRadius: theme.borderRadius.lg,
  borderWidth: 1,
  borderColor: theme.colors.border,
}}>
  {/* Content */}
</View>
```

```svelte
<!-- Web -->
<div class="bg-dark-surface p-4 rounded-lg border border-dark-border">
  <!-- Content -->
</div>
```

### Pattern 3: Theme Switching

```typescript
// Mobile
import { createNativeTheme } from '@memoro/design-tokens/native';

// Switch theme variant
const newTheme = createNativeTheme('sunset', 'dark');
setTheme(newTheme);

// Switch mode
const lightTheme = createNativeTheme('default', 'light');
setTheme(lightTheme);
```

---

## 🎨 Theme Variants

### Default (Indigo)
```typescript
createNativeTheme('default', 'dark')
// Primary: #818cf8
```

### Sunset (Orange/Pink)
```typescript
createNativeTheme('sunset', 'dark')
// Primary: #fb923c
```

### Ocean (Teal/Cyan)
```typescript
createNativeTheme('ocean', 'dark')
// Primary: #2dd4bf
```

---

## 📚 Full Documentation

- **README.md** - Complete usage guide
- **SETUP_COMPLETE.md** - Setup status & next steps
- **../../docs/UI_UNIFICATION_STRATEGY.md** - Full strategy

---

## 🤔 FAQ

**Q: How do I change the primary color?**
A: Update `src/colors.ts` and rebuild with `pnpm build`

**Q: Can I add a new theme?**
A: Yes! Create a new file in `src/themes/` and export it

**Q: Do I need to install this package?**
A: No, it's already in the workspace

**Q: Which apps can use this?**
A: All 3 apps (mobile, web, landing)

---

**Start using design tokens now!** 🎨
