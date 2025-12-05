# Phase 3: Design System & Advanced Features - Detailplanung

## 🎯 Überblick Phase 3

Phase 3 baut auf der soliden Architektur-Basis von Phase 1+2 auf und verwandelt Worldream in eine professionelle, skalierbare Anwendung mit Enterprise-Qualität.

**Zeitrahmen:** 2-3 Wochen  
**Fokus:** Design System, Performance, Developer Experience, Qualität

## 🏗 Teilphasen im Detail

### Phase 3.1: Design System Foundation (Woche 1)

#### 3.1.1 Core UI Components (2-3 Tage)

**Ziel:** Wiederverwendbare, konsistente UI-Bibliothek

**Neue Dateien erstellen:**
```
src/lib/ui/
├── Button/
│   ├── Button.svelte          # Universal Button Component
│   ├── Button.types.ts        # Button Props Interface
│   └── Button.stories.ts      # Storybook Stories
├── Input/
│   ├── Input.svelte           # Text Input
│   ├── Textarea.svelte        # Textarea Input
│   ├── Select.svelte          # Select Dropdown
│   └── Input.types.ts         # Input Props
├── Form/
│   ├── FormField.svelte       # Label + Input + Error
│   ├── FormSection.svelte     # Section mit Titel
│   └── Form.svelte            # Form Container
├── Layout/
│   ├── Card.svelte            # Content Cards
│   ├── Modal.svelte           # Overlay Modals
│   └── Tabs.svelte            # Tab Navigation
└── index.ts                   # Barrel Exports
```

**Button.svelte Beispiel:**
```svelte
<script lang="ts">
  import type { ButtonProps } from './Button.types';
  
  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    children,
    onclick,
    ...restProps
  }: ButtonProps = $props();
  
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors';
  
  const variantClasses = {
    primary: 'bg-theme-primary-600 text-white hover:bg-theme-primary-700 focus:ring-theme-primary-500',
    secondary: 'bg-theme-bg-surface text-theme-text-primary border border-theme-border-default hover:bg-theme-interactive-hover',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm', 
    lg: 'px-6 py-3 text-base'
  };
  
  let classes = $derived([
    baseClasses,
    variantClasses[variant],
    sizeClasses[size]
  ].join(' '));
</script>

<button 
  class={classes}
  {disabled}
  {onclick}
  {...restProps}
>
  {#if loading}
    <svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
      <path d="M4 12a8 8 0 018-8V2.5" stroke="currentColor" stroke-width="4" fill="none"/>
    </svg>
  {/if}
  {@render children?.()}
</button>
```

**Migrations-Impact:**
- Alle `<button>` Tags in Components ersetzen
- Konsistente Styling-Properties
- Accessibility Features eingebaut

#### 3.1.2 Theme System Verbesserung (1-2 Tage)

**Ziel:** Robustes, erweiterbares Theme-System

**Neue Features:**
```typescript
// src/lib/themes/themeSystem.ts
interface ThemeToken {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    neutral: ColorScale;
  };
  typography: {
    fontFamily: Record<string, string>;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

interface ColorScale {
  50: string;
  100: string;
  200: string;
  // ... bis 900
}
```

**CSS Custom Properties:**
```css
/* Auto-generiert basierend auf Theme-Token */
:root {
  --color-primary-50: #f0f9ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  /* ... */
}

[data-theme="dark"] {
  --color-primary-50: #1e3a8a;
  /* Inverted scales für Dark Mode */
}
```

**Erwarteter Impact:**
- Bessere Design-Konsistenz
- Einfache Theme-Erweiterung
- Performance durch CSS Custom Properties

#### 3.1.3 NodeForm Component Refactoring (1-2 Tage)

**Ziel:** Aufspaltung des monolithischen NodeForm

**Neue Struktur:**
```
src/lib/components/forms/
├── NodeForm.svelte              # Orchestrator
├── sections/
│   ├── BasicInfoSection.svelte  # Title, Slug, Summary, etc.
│   ├── ContentSection.svelte    # Dynamic content fields
│   ├── ImageSection.svelte      # AI Image Generation
│   ├── StoryBuilderSection.svelte # Story-specific fields
│   └── OptionalSection.svelte   # Collapsible advanced fields
├── fields/
│   ├── TextField.svelte         # Reusable text input
│   ├── TextareaField.svelte     # Reusable textarea
│   ├── TagsField.svelte         # Tags input with autocomplete
│   └── VisibilityField.svelte   # Visibility selector
└── NodeForm.types.ts            # Shared types
```

**NodeForm.svelte (refactored):**
```svelte
<script lang="ts">
  import BasicInfoSection from './sections/BasicInfoSection.svelte';
  import ContentSection from './sections/ContentSection.svelte';
  import ImageSection from './sections/ImageSection.svelte';
  // ...
  
  // Props und State wie vorher...
</script>

<Card class="max-w-4xl mx-auto">
  <FormHeader {mode} {kind} {worldTitle} />
  
  {#if error}
    <ErrorAlert {error} />
  {/if}
  
  <form onsubmit={handleSubmit}>
    <!-- AI Generation nur bei Create -->
    {#if mode === 'create'}
      <AiSection {kind} {worldTitle} onGenerated={handleAiGenerated} />
    {/if}
    
    <BasicInfoSection bind:title bind:slug bind:summary bind:visibility bind:tags />
    
    {#if kind === 'story' && mode === 'create'}
      <StoryBuilderSection bind:castInput bind:placesInput bind:objectsInput {suggestions} />
    {/if}
    
    <ImageSection bind:imageUrl prompt={getImagePrompt()} />
    
    <ContentSection {kind} bind:contentFields />
    
    <OptionalSection {kind} {contentFields} />
    
    <FormActions {loading} {onCancel} />
  </form>
</Card>
```

**Vorteile:**
- Bessere Testbarkeit (einzelne Sections)
- Leichtere Wartung
- Wiederverwendbare Form-Sections

### Phase 3.2: Performance Optimierung (Woche 2)

#### 3.2.1 Smart Loading & Caching (2-3 Tage)

**Client-Side Caching:**
```typescript
// src/lib/stores/nodeCache.ts
interface NodeCache {
  nodes: Map<string, ContentNode>;
  lists: Map<string, ContentNode[]>;
  lastFetch: Map<string, number>;
}

export const nodeCache = (() => {
  let cache = $state<NodeCache>({
    nodes: new Map(),
    lists: new Map(), 
    lastFetch: new Map()
  });
  
  return {
    get cache() { return cache; },
    
    getNode(slug: string): ContentNode | null {
      return cache.nodes.get(slug) || null;
    },
    
    setNode(node: ContentNode): void {
      cache.nodes.set(node.slug, node);
      cache.lastFetch.set(node.slug, Date.now());
    },
    
    getList(key: string): ContentNode[] | null {
      const cached = cache.lists.get(key);
      const fetchTime = cache.lastFetch.get(key);
      
      // Cache for 5 minutes
      if (cached && fetchTime && Date.now() - fetchTime < 5 * 60 * 1000) {
        return cached;
      }
      return null;
    },
    
    invalidateNode(slug: string): void {
      cache.nodes.delete(slug);
      // Invalidate related lists
      cache.lists.clear();
    }
  };
})();
```

**Smart NodeService:**
```typescript
// Enhanced NodeService mit Caching
export class NodeService {
  static async get(slug: string, useCache = true): Promise<ContentNode> {
    if (useCache) {
      const cached = nodeCache.getNode(slug);
      if (cached) return cached;
    }
    
    const response = await fetch(`/api/nodes/${slug}`);
    if (!response.ok) throw new Error('Node not found');
    
    const node = await response.json();
    nodeCache.setNode(node);
    return node;
  }
  
  // Optimistic Updates
  static async update(slug: string, updates: UpdateNodeRequest): Promise<ContentNode> {
    // Update cache optimistically
    const cached = nodeCache.getNode(slug);
    if (cached) {
      const optimistic = { ...cached, ...updates };
      nodeCache.setNode(optimistic);
    }
    
    try {
      const response = await fetch(`/api/nodes/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      const updated = await response.json();
      nodeCache.setNode(updated);
      return updated;
      
    } catch (error) {
      // Revert optimistic update
      nodeCache.invalidateNode(slug);
      throw error;
    }
  }
}
```

#### 3.2.2 Virtual Scrolling für Listen (1-2 Tage)

**Problem:** Große Listen (100+ Nodes) werden langsam  
**Lösung:** Virtual Scrolling Component

```svelte
<!-- src/lib/components/VirtualList.svelte -->
<script lang="ts" generics="T">
  interface Props<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => any;
  }
  
  let { items, itemHeight, containerHeight, renderItem }: Props<T> = $props();
  
  let scrollTop = $state(0);
  let containerEl: HTMLDivElement;
  
  let visibleItems = $derived(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      offsetY: startIndex * itemHeight
    };
  });
  
  function handleScroll(e: Event) {
    scrollTop = (e.target as HTMLDivElement).scrollTop;
  }
</script>

<div 
  bind:this={containerEl}
  class="overflow-auto"
  style="height: {containerHeight}px"
  onscroll={handleScroll}
>
  <div style="height: {items.length * itemHeight}px; position: relative;">
    <div style="transform: translateY({visibleItems.offsetY}px);">
      {#each visibleItems.items as item, index (item)}
        {@render renderItem(item, visibleItems.startIndex + index)}
      {/each}
    </div>
  </div>
</div>
```

#### 3.2.3 Image Optimization (1 Tag)

**Lazy Loading Images:**
```svelte
<!-- src/lib/components/LazyImage.svelte -->
<script lang="ts">
  let { src, alt, class: className, ...props } = $props();
  
  let imgEl: HTMLImageElement;
  let loaded = $state(false);
  let error = $state(false);
  let observer: IntersectionObserver;
  
  $effect(() => {
    if (imgEl && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadImage();
            observer.disconnect();
          }
        });
      });
      observer.observe(imgEl);
    } else {
      loadImage();
    }
    
    return () => observer?.disconnect();
  });
  
  function loadImage() {
    if (loaded || error) return;
    
    const img = new Image();
    img.onload = () => { loaded = true; };
    img.onerror = () => { error = true; };
    img.src = src;
  }
</script>

<div class="relative {className}">
  <img
    bind:this={imgEl}
    {alt}
    class="transition-opacity duration-200 {loaded ? 'opacity-100' : 'opacity-0'}"
    src={loaded ? src : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4='}
    {...props}
  />
  
  {#if !loaded && !error}
    <div class="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
      <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
    </div>
  {/if}
  
  {#if error}
    <div class="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <span class="text-gray-500 text-sm">Bild nicht verfügbar</span>
    </div>
  {/if}
</div>
```

### Phase 3.3: Developer Experience (Woche 2-3)

#### 3.3.1 Advanced Error Handling (1-2 Tage)

**Error Boundary System:**
```svelte
<!-- src/lib/components/ErrorBoundary.svelte -->
<script lang="ts">
  let { children, fallback } = $props();
  
  let error = $state<Error | null>(null);
  
  // Catch JavaScript errors
  $effect(() => {
    const handleError = (event: ErrorEvent) => {
      error = new Error(event.error?.message || 'Unknown error');
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  });
  
  function retry() {
    error = null;
  }
</script>

{#if error}
  {#if fallback}
    {@render fallback(error, retry)}
  {:else}
    <div class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Ein Fehler ist aufgetreten</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{error.message}</p>
          </div>
          <div class="mt-4">
            <button onclick={retry} class="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700">
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
{:else}
  {@render children?.()}
{/if}
```

**Toast Notification System:**
```typescript
// src/lib/stores/notifications.ts
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: { label: string; action: () => void }[];
}

export const notifications = (() => {
  let items = $state<Notification[]>([]);
  
  return {
    get items() { return items; },
    
    add(notification: Omit<Notification, 'id'>): string {
      const id = Math.random().toString(36).substring(7);
      const item = { ...notification, id };
      
      items = [...items, item];
      
      if (notification.duration !== 0) {
        setTimeout(() => {
          items = items.filter(n => n.id !== id);
        }, notification.duration || 5000);
      }
      
      return id;
    },
    
    remove(id: string): void {
      items = items.filter(n => n.id !== id);
    },
    
    clear(): void {
      items = [];
    },
    
    // Convenience methods
    success(title: string, message?: string) {
      return this.add({ type: 'success', title, message });
    },
    
    error(title: string, message?: string) {
      return this.add({ type: 'error', title, message, duration: 0 });
    }
  };
})();
```

#### 3.3.2 Advanced State Management (1-2 Tage)

**Global State Store Pattern:**
```typescript
// src/lib/stores/appStore.ts
interface AppState {
  user: User | null;
  currentWorld: ContentNode | null;
  isLoading: boolean;
  notifications: Notification[];
  modals: Modal[];
}

export const createAppStore = () => {
  let state = $state<AppState>({
    user: null,
    currentWorld: null,
    isLoading: false,
    notifications: [],
    modals: []
  });
  
  return {
    get state() { return state; },
    
    // Actions
    setUser(user: User | null) {
      state.user = user;
    },
    
    setCurrentWorld(world: ContentNode | null) {
      state.currentWorld = world;
      if (browser && world) {
        localStorage.setItem('worldream-current-world', JSON.stringify(world));
      }
    },
    
    setLoading(loading: boolean) {
      state.isLoading = loading;
    },
    
    addNotification(notification: Notification) {
      state.notifications = [...state.notifications, notification];
    },
    
    // Derived
    get isAuthenticated() {
      return state.user !== null;
    },
    
    get hasWorldContext() {
      return state.currentWorld !== null;
    }
  };
};

export const appStore = createAppStore();
```

#### 3.3.3 Testing Infrastructure (2-3 Tage)

**Vitest Setup:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts']
  }
});
```

**NodeService Tests:**
```typescript
// src/lib/services/nodeService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeService } from './nodeService';

// Mock fetch
global.fetch = vi.fn();

describe('NodeService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  describe('create', () => {
    it('should create a new node successfully', async () => {
      const mockNode = { id: '1', title: 'Test', kind: 'character' };
      
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNode)
      });
      
      const result = await NodeService.create({
        kind: 'character',
        slug: 'test',
        title: 'Test',
        visibility: 'private',
        tags: [],
        content: {}
      });
      
      expect(result).toEqual(mockNode);
      expect(fetch).toHaveBeenCalledWith('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'character',
          slug: 'test',
          title: 'Test',
          visibility: 'private',
          tags: [],
          content: {}
        })
      });
    });
    
    it('should throw error on failed request', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to create' })
      });
      
      await expect(NodeService.create({} as any)).rejects.toThrow('Failed to create');
    });
  });
});
```

**Component Tests:**
```typescript
// src/lib/ui/Button/Button.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button.svelte';

describe('Button', () => {
  it('renders with correct text', () => {
    const { getByText } = render(Button, {
      props: { children: () => 'Click me' }
    });
    
    expect(getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onclick handler when clicked', async () => {
    const handleClick = vi.fn();
    const { getByRole } = render(Button, {
      props: { 
        onclick: handleClick,
        children: () => 'Click me'
      }
    });
    
    await fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
  
  it('shows loading state', () => {
    const { getByText } = render(Button, {
      props: { 
        loading: true,
        children: () => 'Submit'
      }
    });
    
    expect(getByText('Submit')).toBeInTheDocument();
    // Check for spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
```

### Phase 3.4: Advanced Features (Woche 3)

#### 3.4.1 Advanced Search & Filtering (2-3 Tage)

**Smart Search Component:**
```svelte
<!-- src/lib/components/SmartSearch.svelte -->
<script lang="ts">
  let { placeholder = "Suchen...", onResults } = $props();
  
  let query = $state('');
  let results = $state<ContentNode[]>([]);
  let loading = $state(false);
  let selectedIndex = $state(-1);
  
  let searchDebounce: ReturnType<typeof setTimeout>;
  
  $effect(() => {
    if (query.length > 2) {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(performSearch, 300);
    } else {
      results = [];
    }
  });
  
  async function performSearch() {
    loading = true;
    try {
      const searchResults = await NodeService.list({ 
        search: query,
        limit: 10 
      });
      results = searchResults;
      selectedIndex = -1;
    } finally {
      loading = false;
    }
  }
  
  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        results = [];
        selectedIndex = -1;
        break;
    }
  }
  
  function selectResult(node: ContentNode) {
    onResults?.(node);
    query = node.title;
    results = [];
  }
</script>

<div class="relative">
  <div class="relative">
    <input 
      bind:value={query}
      onkeydown={handleKeydown}
      {placeholder}
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    />
    
    {#if loading}
      <div class="absolute right-3 top-2.5">
        <svg class="w-5 h-5 animate-spin text-gray-400" viewBox="0 0 24 24">
          <!-- Spinner Icon -->
        </svg>
      </div>
    {/if}
  </div>
  
  {#if results.length > 0}
    <div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
      {#each results as result, index}
        <button
          class="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 border-b border-gray-100 last:border-b-0 {selectedIndex === index ? 'bg-gray-50' : ''}"
          onclick={() => selectResult(result)}
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-gray-900">{result.title}</div>
              {#if result.summary}
                <div class="text-sm text-gray-500 truncate">{result.summary}</div>
              {/if}
            </div>
            <div class="text-xs text-gray-400 capitalize">
              {result.kind}
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
```

#### 3.4.2 Keyboard Shortcuts System (1-2 Tage)

**Global Shortcuts:**
```typescript
// src/lib/utils/shortcuts.ts
interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export const shortcuts = (() => {
  let registeredShortcuts = new Map<string, Shortcut>();
  
  function getShortcutKey(shortcut: Shortcut): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }
  
  function handleKeydown(e: KeyboardEvent) {
    const key = getShortcutKey({
      key: e.key,
      ctrl: e.ctrlKey || e.metaKey,
      alt: e.altKey,
      shift: e.shiftKey
    } as Shortcut);
    
    const shortcut = registeredShortcuts.get(key);
    if (shortcut) {
      e.preventDefault();
      shortcut.action();
    }
  }
  
  return {
    register(shortcut: Shortcut): () => void {
      const key = getShortcutKey(shortcut);
      registeredShortcuts.set(key, shortcut);
      
      if (registeredShortcuts.size === 1) {
        window.addEventListener('keydown', handleKeydown);
      }
      
      return () => {
        registeredShortcuts.delete(key);
        if (registeredShortcuts.size === 0) {
          window.removeEventListener('keydown', handleKeydown);
        }
      };
    },
    
    getAll(): Shortcut[] {
      return Array.from(registeredShortcuts.values());
    }
  };
})();
```

**Shortcuts Helper Component:**
```svelte
<!-- src/lib/components/ShortcutsHelper.svelte -->
<script lang="ts">
  import { shortcuts } from '$lib/utils/shortcuts';
  import { onMount } from 'svelte';
  
  let showHelp = $state(false);
  let allShortcuts = $state<Shortcut[]>([]);
  
  onMount(() => {
    // Register help shortcut
    const unregister = shortcuts.register({
      key: '?',
      action: () => showHelp = !showHelp,
      description: 'Toggle shortcuts help'
    });
    
    allShortcuts = shortcuts.getAll();
    
    return unregister;
  });
</script>

{#if showHelp}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Keyboard Shortcuts</h2>
        <button onclick={() => showHelp = false} class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="grid grid-cols-1 gap-2">
        {#each allShortcuts as shortcut}
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-gray-700">{shortcut.description}</span>
            <div class="flex items-center space-x-1">
              {#if shortcut.ctrl}
                <kbd class="px-2 py-1 text-xs bg-gray-100 rounded">Ctrl</kbd>
              {/if}
              {#if shortcut.alt}
                <kbd class="px-2 py-1 text-xs bg-gray-100 rounded">Alt</kbd>
              {/if}
              {#if shortcut.shift}
                <kbd class="px-2 py-1 text-xs bg-gray-100 rounded">Shift</kbd>
              {/if}
              <kbd class="px-2 py-1 text-xs bg-gray-100 rounded">{shortcut.key}</kbd>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
```

## 📊 Phase 3 Erwartete Ergebnisse

### Quantifizierbare Verbesserungen
- **Performance:** 40-60% schnellere Ladezeiten
- **Bundle Size:** 20-30% kleiner durch Tree-shaking
- **Development Speed:** 50% weniger Zeit für neue Features
- **Bug Rate:** 70% weniger UI-bugs durch Design System
- **Accessibility Score:** 95+ Lighthouse Score

### Qualitative Verbesserungen
- **User Experience:** Professionelle, konsistente UI
- **Developer Experience:** Moderne Tooling & Testing
- **Maintainability:** Klare Component-Bibliothek
- **Scalability:** Solide Basis für komplexe Features

## 🎯 Definition of Done - Phase 3

### Must Have (Minimal)
- [ ] 8+ wiederverwendbare UI Components
- [ ] Theme System mit Custom Properties
- [ ] NodeForm aufgeteilt in 5+ Sections
- [ ] Client-side Caching implementiert
- [ ] Error Boundary System
- [ ] 80% Test Coverage für Services

### Should Have (Optimal)
- [ ] Virtual Scrolling für alle Listen
- [ ] Lazy Image Loading
- [ ] Toast Notification System
- [ ] Advanced Search mit Keyboard Navigation
- [ ] Storybook für Component Library
- [ ] 90% Test Coverage

### Could Have (Nice-to-have)
- [ ] Global Keyboard Shortcuts
- [ ] Performance Monitoring
- [ ] Advanced Animation System
- [ ] Accessibility Features (Screen Reader, etc.)
- [ ] Advanced Caching mit Background Sync

## 💰 ROI Erwartung Phase 3

### Entwicklungszeit-Einsparungen
- **Neue UI Features:** 70% schneller durch Component Library
- **Bug-Fixes:** 60% weniger Zeit durch bessere Testing
- **Performance Issues:** 80% weniger durch professionelle Architektur

### Langfristige Vorteile
- **Skalierbarkeit:** Enterprise-ready Architecture
- **User Retention:** Professionelle UX steigert Zufriedenheit
- **Team Onboarding:** Neue Entwickler productive in Tagen statt Wochen
- **Technical Debt:** Praktisch eliminiert durch solide Basis

---

**Phase 3 verwandelt Worldream von einem funktionalen MVP in eine professionelle, skalierbare Enterprise-Anwendung mit weltklasse Developer Experience.**