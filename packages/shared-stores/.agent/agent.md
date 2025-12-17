# Shared Stores Agent

## Module Information
**Package**: `@manacore/shared-stores`
**Version**: 1.0.0
**Type**: ESM Svelte 5 store library
**Dependencies**:
- `svelte` 5.0.0 (peer)
- `@manacore/shared-auth` (workspace)

## Identity
I am the Shared Stores Agent, responsible for providing reusable Svelte 5 runes-based state management factories for ManaCore web applications. I create type-safe, reactive stores for common UI patterns like toasts, navigation, and theming using Svelte 5's modern reactivity system.

## Expertise
- **Svelte 5 Runes**: Modern reactivity with `$state`, `$derived`, `$effect`
- **Toast Notifications**: Message queue with auto-dismiss
- **Navigation State**: Menu/sidebar with persistence
- **Theme Management**: Dark/light mode with system preference
- **Factory Pattern**: Reusable store creators for consistent behavior
- **LocalStorage Persistence**: Optional state persistence across sessions

## Code Structure

```
src/
├── index.ts                # Main export barrel
├── toast.svelte.ts         # Toast notification store factory
├── navigation.svelte.ts    # Navigation state store factory
└── theme.svelte.ts         # Theme management store factory
```

## Key Patterns

### 1. Factory Pattern with Svelte 5 Runes
All stores use factory functions that create isolated instances with runes:

```typescript
// Factory creates independent store instance
export function createToastStore(config?: ToastStoreConfig): ToastStore {
  let toasts = $state<Toast[]>([]);

  // Getters expose reactive state
  return {
    get toasts() { return toasts; },
    show: (msg, type, duration) => { /* ... */ },
    dismiss: (id) => { /* ... */ }
  };
}
```

### 2. Toast Store Pattern
Queue-based notification system with auto-dismiss:

```typescript
import { createToastStore } from '@manacore/shared-stores';

const toast = createToastStore({
  defaultDuration: 5000,
  maxToasts: 5
});

// Show notifications
toast.success('Saved successfully!');
toast.error('Failed to save', 10000);
toast.info('Processing...');
toast.warning('Please review');

// Custom toast
toast.show('Custom message', 'info', 3000);

// Manual dismiss
toast.dismiss(toastId);

// Clear all
toast.clear();

// Access reactive state
$derived(toast.toasts.length > 0);
```

**Types:**
- `ToastType`: 'success' | 'error' | 'info' | 'warning'
- `Toast`: { id, type, message, duration? }
- `ToastStore`: Full interface with methods and reactive state

### 3. Navigation Store Pattern
Menu and sidebar state management with persistence:

```typescript
import { createNavigationStore } from '@manacore/shared-stores';

const navigation = createNavigationStore({
  initialItems: [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/settings', label: 'Settings', icon: 'settings', badge: '2' }
  ],
  storageKey: 'app-nav',
  defaultSidebarMode: false,
  defaultCollapsed: false
});

// Set items dynamically
navigation.setItems([...newItems]);

// Control menu state
navigation.open();
navigation.close();
navigation.toggle();

// Sidebar mode (desktop persistent sidebar)
navigation.setSidebarMode(true);

// Collapse state (minimized sidebar)
navigation.setCollapsed(true);

// Reactive state
$derived(navigation.isOpen);
$derived(navigation.isSidebarMode);
$derived(navigation.isCollapsed);
$derived(navigation.items);
```

**Types:**
- `NavigationItem`: { href, label, icon?, badge?, children? }
- `NavigationStore`: Full interface with state and methods

**LocalStorage Keys (if storageKey provided):**
- `{storageKey}-sidebar`: Sidebar mode preference
- `{storageKey}-collapsed`: Collapsed state preference

### 4. Theme Store Pattern
Dark/light mode with system preference detection:

```typescript
import { createThemeStore } from '@manacore/shared-stores';

const theme = createThemeStore({
  storagePrefix: 'theme',
  defaultMode: 'system',
  defaultVariant: 'default',
  darkClass: 'dark',
  variantAttribute: 'data-theme'
});

// Initialize (call in onMount or +layout.svelte)
const cleanup = theme.initialize();

// Set mode
theme.setMode('dark');    // Always dark
theme.setMode('light');   // Always light
theme.setMode('system');  // Follow system preference

// Toggle between light/dark
theme.toggle();

// Set theme variant (for multi-theme support)
theme.setVariant('ocean');
theme.setVariant('sunset');

// Reactive state
$derived(theme.isDark);      // true/false based on effective theme
$derived(theme.mode);         // 'light' | 'dark' | 'system'
$derived(theme.variant);      // Current variant
```

**Types:**
- `ThemeMode`: 'light' | 'dark' | 'system'
- `ThemeStore`: Full interface with state and methods

**Behavior:**
- Adds/removes `darkClass` on `document.documentElement`
- Sets `variantAttribute` on `document.documentElement`
- Listens to system preference changes when mode is 'system'
- Persists mode and variant to localStorage

**LocalStorage Keys:**
- `{storagePrefix}-mode`: Theme mode preference
- `{storagePrefix}-variant`: Theme variant preference

## Integration Points

### With SvelteKit Applications
Primary use case - shared UI state management:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { createThemeStore, createToastStore } from '@manacore/shared-stores';
  import { onMount } from 'svelte';

  const theme = createThemeStore();
  const toast = createToastStore();

  onMount(() => {
    const cleanup = theme.initialize();
    return cleanup;
  });
</script>

<div class:dark={theme.isDark}>
  <slot />
  <ToastContainer toasts={toast.toasts} />
</div>
```

### With Shared UI Components
```svelte
<!-- Navigation.svelte -->
<script lang="ts">
  import { createNavigationStore } from '@manacore/shared-stores';

  const nav = createNavigationStore({
    storageKey: 'main-nav',
    defaultSidebarMode: true
  });

  export { nav };
</script>

<nav class:collapsed={nav.isCollapsed}>
  {#each nav.items as item}
    <a href={item.href}>{item.label}</a>
  {/each}
</nav>
```

### With @manacore/shared-auth
```typescript
import { createToastStore } from '@manacore/shared-stores';
import { signIn } from '@manacore/shared-auth';

const toast = createToastStore();

async function handleSignIn(email: string, password: string) {
  const result = await signIn(email, password);

  if (result.success) {
    toast.success('Signed in successfully!');
  } else {
    toast.error(result.error.message);
  }
}
```

## How to Use

### Installation
This package is internal to the monorepo. Add to dependencies in `package.json`:

```json
{
  "dependencies": {
    "@manacore/shared-stores": "workspace:*",
    "svelte": "^5.0.0"
  }
}
```

### Import Examples

```typescript
// Import store factories
import {
  createToastStore,
  createNavigationStore,
  createThemeStore,
  type Toast,
  type ToastType,
  type ToastStore,
  type NavigationItem,
  type NavigationStore,
  type ThemeStore,
  type ThemeMode
} from '@manacore/shared-stores';
```

### Best Practices

#### 1. Single Instance per App
Create stores once at app root, pass down as needed:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { setContext } from 'svelte';
  import { createToastStore } from '@manacore/shared-stores';

  const toast = createToastStore();
  setContext('toast', toast);
</script>

<!-- child component -->
<script lang="ts">
  import { getContext } from 'svelte';
  import type { ToastStore } from '@manacore/shared-stores';

  const toast = getContext<ToastStore>('toast');
</script>
```

#### 2. Initialize Theme Early
Call theme.initialize() as early as possible to prevent flash:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { createThemeStore } from '@manacore/shared-stores';

  const theme = createThemeStore();

  // Initialize in onMount, cleanup on destroy
  onMount(() => theme.initialize());
</script>
```

#### 3. Type Safety
Use provided TypeScript types for full type safety:

```typescript
import type { Toast, NavigationItem } from '@manacore/shared-stores';

const items: NavigationItem[] = [
  { href: '/', label: 'Home', icon: 'home' },
  {
    href: '/settings',
    label: 'Settings',
    children: [
      { href: '/settings/profile', label: 'Profile' }
    ]
  }
];
```

#### 4. Reactive Derivations
Use $derived for computed state:

```typescript
const hasNotifications = $derived(toast.toasts.length > 0);
const isNavOpen = $derived(nav.isOpen && !nav.isSidebarMode);
const effectiveTheme = $derived(theme.isDark ? 'dark' : 'light');
```

### Common Use Cases

1. **Global Toast Notifications**
   - Show success/error messages from any component
   - Auto-dismiss after configurable duration
   - Queue management for multiple toasts

2. **App Navigation State**
   - Mobile menu toggle
   - Desktop sidebar mode
   - Collapsed sidebar on smaller screens
   - Persist user's navigation preferences

3. **Theme Switching**
   - Light/dark mode toggle
   - System preference detection
   - Theme variant support (multiple color schemes)
   - Persist user preference

## Svelte 5 Runes Reference

### $state
Creates reactive state:
```typescript
let count = $state(0);
let items = $state<Item[]>([]);
```

### $derived
Creates derived/computed values:
```typescript
let doubled = $derived(count * 2);
let isEmpty = $derived(items.length === 0);
```

### $effect
Runs side effects when dependencies change:
```typescript
$effect(() => {
  console.log('Count changed:', count);
});
```

## Notes

- **Svelte 5 Only**: These stores use Svelte 5 runes and won't work with Svelte 4
- **No Type Checking**: Package skips type checking (checked at build time in consuming apps)
- **Factory Pattern**: Multiple apps can create independent store instances
- **SSR Safe**: All browser APIs check for `window`/`document` availability
- **No Global State**: Each factory call creates isolated state
- **LocalStorage**: Optional persistence requires providing storage keys
- **Cleanup**: Theme store's initialize() returns cleanup function for proper disposal
