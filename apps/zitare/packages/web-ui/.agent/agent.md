# Agent: @zitare/web-ui

## Module Information

**Package Name:** `@zitare/web-ui`
**Type:** Svelte 5 Component Library
**Location:** `apps/zitare/packages/web-ui/`
**Version:** 1.0.0

### Purpose
Shared Svelte 5 component library for Zitare web applications, providing reusable UI components, stores, and styling utilities. Built exclusively with Svelte 5 runes mode for type-safe reactive state management and modern component patterns.

### Dependencies
- **Peer:** svelte ^5.0.0
- **Workspace:** @zitare/shared (workspace:*)
- **Dev:** @types/node ^20.0.0, svelte-check ^4.0.0, typescript ^5.0.0

---

## Identity

I am the **Zitare Web UI Component Library Agent**, responsible for building and maintaining reusable Svelte 5 components for Zitare web applications.

### My Responsibilities
- Build reusable Svelte 5 components using runes mode exclusively
- Manage client-side state through reactive stores
- Provide consistent UI patterns across Zitare web apps
- Handle user interactions (favorites, lists, search, navigation)
- Manage theme switching and UI preferences
- Provide toast notifications and error boundaries

### What I DON'T Handle
- Backend API calls (handled by consuming apps)
- Routing logic (handled by SvelteKit apps)
- Business logic (handled by @zitare/shared utilities)
- Static data (provided by @zitare/shared)
- Mobile UI (handled by @zitare/mobile with React Native)

---

## Expertise

### Core Competencies

#### 1. Svelte 5 Runes Patterns
**CRITICAL**: This package uses ONLY Svelte 5 runes mode, never old Svelte syntax.

```typescript
// ✅ CORRECT - Svelte 5 runes
let count = $state(0);
let doubled = $derived(count * 2);
$effect(() => console.log(count));

// ❌ WRONG - Old Svelte syntax (NEVER USE)
let count = 0;
$: doubled = count * 2;
```

#### 2. Component Architecture

**Page Components** (Complex, feature-rich):
- `BrowsePage.svelte`: Browse all content with filters and search
- `FavoritesPage.svelte`: Display user favorites with management
- `DiscoverAppsPage.svelte`: App discovery and navigation
- `AppSidebar.svelte`: Main navigation sidebar
- `Sidebar.svelte`: Generic sidebar component

**Utility Components** (Simple, reusable):
- `ContentCard.svelte`: Display content items with gradient backgrounds
- `PageHeader.svelte`: Consistent page headers
- `SearchBox.svelte`: Search input with icon
- `CategoryFilters.svelte`: Category filtering buttons
- `ToastContainer.svelte`: Toast notification display
- `ErrorBoundary.svelte`: Error handling wrapper

#### 3. Store Management
All stores use Svelte's writable store pattern with custom methods:

**Theme Store** (`stores/theme.ts`):
- Manages light/dark theme state
- Persists to localStorage
- Syncs with system preferences
- Updates DOM data-theme attribute

**Sidebar Store** (`stores/sidebar.ts`):
- Tracks sidebar collapsed state
- Persists to localStorage
- Provides toggle functionality

**Toast Store** (`stores/toast.ts`):
- Queue-based notification system
- Auto-dismiss with configurable duration
- Multiple toast types (success, error, info, warning)

**Lists Store** (`stores/lists.ts`):
- Manages user-created lists state (likely)

#### 4. Styling System
- **Framework**: Tailwind CSS
- **Theme Variables**: CSS custom properties via data-theme attribute
- **Gradient System**: Category-based gradient mappings
- **Responsive Design**: Mobile-first approach

#### 5. Generic Component Design
Components use TypeScript generics to work with any `ContentItem` subtype:

```typescript
<script lang="ts" generics="T extends ContentItem">
  import type { ContentItem } from '@zitare/shared';

  interface Props {
    content: T;
  }

  let { content }: Props = $props();
</script>
```

---

## Code Structure

```
src/
├── index.ts                     # Main exports (components + stores)
├── components/
│   ├── ContentCard.svelte       # Generic content display card
│   ├── AppSidebar.svelte        # Main app navigation sidebar
│   ├── BrowsePage.svelte        # Browse content with filters
│   ├── FavoritesPage.svelte     # Favorites management page
│   ├── DiscoverAppsPage.svelte  # App discovery page
│   ├── PageHeader.svelte        # Reusable page header
│   ├── SearchBox.svelte         # Search input component
│   ├── CategoryFilters.svelte   # Category filter buttons
│   ├── Sidebar.svelte           # Generic sidebar layout
│   ├── ToastContainer.svelte    # Toast notification container
│   └── ErrorBoundary.svelte     # Error handling wrapper
├── stores/
│   ├── theme.ts                 # Theme management store
│   ├── sidebar.ts               # Sidebar state store
│   ├── toast.ts                 # Toast notification store
│   └── lists.ts                 # User lists store
└── styles/
    └── index.ts                 # Style exports (theme CSS path)
```

### Export Structure
```typescript
// Main exports (index.ts)
export { default as ContentCard } from './components/ContentCard.svelte';
export { default as AppSidebar } from './components/AppSidebar.svelte';
// ... other components

export { isSidebarCollapsed } from './stores/sidebar';
export { theme } from './stores/theme';
export { toast, type Toast, type ToastType } from './stores/toast';

// Subpath exports (package.json)
".": "./src/index.ts"
"./styles": "./src/styles/index.ts"
"./components/*": "./src/components/*.svelte"
"./stores/*": "./src/stores/*.ts"
```

---

## Key Patterns

### 1. Svelte 5 Component Pattern
```svelte
<script lang="ts">
  import type { SomeType } from '@zitare/shared';

  interface Props {
    data: SomeType;
    optional?: string;
  }

  // Use $props() rune for props
  let { data, optional = 'default' }: Props = $props();

  // Use $state() for reactive state
  let count = $state(0);

  // Use $derived() for computed values
  let doubled = $derived(count * 2);

  // Use $effect() for side effects
  $effect(() => {
    console.log('Count changed:', count);
  });

  // Regular functions for event handlers
  function handleClick() {
    count++;
  }
</script>

<button onclick={handleClick}>
  {doubled}
</button>
```

### 2. Generic Content Component Pattern
```svelte
<script lang="ts" generics="T extends ContentItem">
  import type { ContentItem } from '@zitare/shared';

  interface Props {
    content: T & { author?: any; isFavorite?: boolean };
    variant?: 'simple' | 'daily';
  }

  let { content, variant = 'simple' }: Props = $props();
</script>

<div>
  <p>{content.text}</p>
  {#if content.author}
    <span>{content.author.name}</span>
  {/if}
</div>
```

### 3. Store with Persistence Pattern
```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createPersistedStore(key: string, initialValue: any) {
  const stored = browser ? localStorage.getItem(key) : null;
  const { subscribe, set, update } = writable(
    stored ? JSON.parse(stored) : initialValue
  );

  return {
    subscribe,
    set: (value: any) => {
      if (browser) localStorage.setItem(key, JSON.stringify(value));
      set(value);
    },
    update: (fn: (value: any) => any) => {
      update((current) => {
        const newValue = fn(current);
        if (browser) localStorage.setItem(key, JSON.stringify(newValue));
        return newValue;
      });
    }
  };
}
```

### 4. Event Dispatcher Pattern
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    favorite: { id: string };
    share: { content: string };
  }>();

  function handleFavorite(id: string) {
    dispatch('favorite', { id });
  }
</script>

<button onclick={() => handleFavorite(content.id)}>
  Favorite
</button>
```

### 5. Category Gradient System
```typescript
function getCategoryGradient(cat?: string): string {
  const gradients: Record<string, string> = {
    life: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    wisdom: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    // ... more categories
  };

  return gradients[cat?.toLowerCase()] ??
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}
```

### 6. Toast Notification Pattern
```typescript
import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    show: (message: string, type: ToastType = 'info', duration = 3000) => {
      const id = crypto.randomUUID();
      update(toasts => [...toasts, { id, message, type, duration }]);

      setTimeout(() => {
        update(toasts => toasts.filter(t => t.id !== id));
      }, duration);
    },
    success: (message: string) => toast.show(message, 'success'),
    error: (message: string) => toast.show(message, 'error'),
    // ... other convenience methods
  };
}

export const toast = createToastStore();
```

---

## Integration Points

### Consumed By

#### 1. @zitare/web (SvelteKit)
```svelte
<script lang="ts">
  import { ContentCard, BrowsePage, theme, toast } from '@zitare/web-ui';
  import { quotesDE } from '@zitare/shared';

  let selectedQuote = $state(quotesDE[0]);
</script>

<ContentCard content={selectedQuote} />
<BrowsePage items={quotesDE} />
```

#### 2. Future Content Apps
```svelte
<script lang="ts">
  import { ContentCard } from '@zitare/web-ui';
  import type { Proverb } from '@zitare/shared';

  let proverb: Proverb = $state(/* ... */);
</script>

<!-- ContentCard works with any ContentItem subtype -->
<ContentCard content={proverb} />
```

### Depends On

#### 1. @zitare/shared
```typescript
import type {
  ContentItem,
  ContentAuthor,
  Quote
} from '@zitare/shared';
import {
  filterContentByCategory,
  searchContent
} from '@zitare/shared';
```

#### 2. SvelteKit Primitives
```typescript
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
```

### Related Packages

- **@zitare/shared**: Provides types and utilities
- **@zitare/web**: Consumes components for web app
- **@manacore/web-ui**: Monorepo-wide web UI components (if exists)

---

## Development Guidelines

### Svelte 5 Runes Checklist

When creating/editing components:

- [ ] Use `$props()` for component props, never `export let`
- [ ] Use `$state()` for reactive state, never plain `let` for reactive values
- [ ] Use `$derived()` for computed values, never `$:` reactive declarations
- [ ] Use `$effect()` for side effects, never `$:` reactive statements
- [ ] Type all props with an `interface Props` definition
- [ ] Use TypeScript generics for content-agnostic components

### Component Creation Checklist

- [ ] Define clear TypeScript interface for props
- [ ] Use semantic HTML elements
- [ ] Apply Tailwind classes for styling
- [ ] Support both light and dark themes
- [ ] Handle loading and error states
- [ ] Emit typed events with `createEventDispatcher`
- [ ] Test component in isolation
- [ ] Export from `src/index.ts` if generally useful

### Store Creation Checklist

- [ ] Use Svelte's `writable` store as base
- [ ] Add custom methods for common operations
- [ ] Persist to localStorage when appropriate (use `browser` guard)
- [ ] Export typed store and types
- [ ] Document store API in JSDoc comments
- [ ] Handle SSR gracefully (check `browser` before using DOM APIs)

### Styling Guidelines

- **Use Tailwind Utility Classes**: Prefer utilities over custom CSS
- **Theme Variables**: Use CSS custom properties for theme-aware colors
- **Responsive Design**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Dark Mode**: Use `dark:` prefix for dark theme variants
- **Gradients**: Use category-based gradient system from `getCategoryGradient()`

### Type Safety Rules

- **ALWAYS** import types from `@zitare/shared`
- **NEVER** duplicate type definitions
- **ALWAYS** use TypeScript generics for content-agnostic components
- **ALWAYS** type event dispatchers with specific event maps
- **ALWAYS** type store contents

### Performance Considerations

- **Use `$derived`** instead of functions in templates when possible
- **Avoid unnecessary re-renders** by using proper reactive primitives
- **Lazy load** heavy components (use dynamic imports)
- **Optimize images** with proper sizing and formats
- **Minimize bundle size** by tree-shaking unused components

---

## Component API Documentation

### ContentCard

**Props:**
- `content: T extends ContentItem` - Content to display (generic)
- `variant?: 'simple' | 'daily'` - Display variant
- `category?: string` - Category for gradient selection
- `showAuthor?: boolean` - Show author name (default: true)
- `showSource?: boolean` - Show source (default: true)
- `gradientStyle?: string` - Override gradient

**Events:**
- `favorite: { id: string }` - Favorite button clicked
- `share: void` - Share button clicked
- `copy: void` - Copy button clicked

**Usage:**
```svelte
<ContentCard
  content={quote}
  variant="daily"
  category={quote.category}
  onfavorite={(e) => handleFavorite(e.detail.id)}
/>
```

### BrowsePage

**Props:**
- `items: ContentItem[]` - Items to display
- `categories?: string[]` - Available categories
- `title?: string` - Page title

**Features:**
- Search functionality
- Category filtering
- Grid/list layout

### Theme Store

**API:**
```typescript
theme.subscribe((value) => console.log(value)); // 'light' | 'dark'
theme.toggle(); // Toggle between light and dark
theme.init(); // Initialize from localStorage/system preference
```

### Toast Store

**API:**
```typescript
toast.show(message: string, type: ToastType, duration?: number);
toast.success(message: string);
toast.error(message: string);
toast.info(message: string);
toast.warning(message: string);
```

---

## Notes

### Design Principles

1. **Svelte 5 Only**: Exclusively use runes mode, no legacy syntax
2. **Generic First**: Components work with any `ContentItem` subtype
3. **Type Safe**: Strict TypeScript with no `any` types
4. **SSR Safe**: All browser APIs guarded with `browser` check
5. **Accessible**: Semantic HTML and ARIA attributes
6. **Themeable**: Support light and dark themes
7. **Performant**: Optimize for minimal re-renders

### SvelteKit Integration

- Components can use `$app/environment` for SSR detection
- Components can use `$app/navigation` for routing (sparingly)
- Avoid tight coupling to specific routes or layouts
- Keep components as pure and reusable as possible

### Browser API Usage

Always guard browser APIs:
```typescript
import { browser } from '$app/environment';

if (browser) {
  localStorage.setItem('key', 'value');
  document.querySelector('.selector');
  window.addEventListener('event', handler);
}
```

### Future Enhancements

- Consider Storybook for component documentation
- Add comprehensive component testing with Vitest
- Extract more reusable patterns from app-specific code
- Build design system documentation
- Create component playground/demo page
- Add accessibility testing
