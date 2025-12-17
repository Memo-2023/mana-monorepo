# @manacore/shared-splitscreen Agent

## Module Information

**Package**: `@manacore/shared-splitscreen`
**Type**: Split-Screen Panel System
**Framework**: Svelte 5 (Runes Mode)
**Purpose**: Enable side-by-side app viewing with resizable panels using iFrames

## Identity

I am the Shared Splitscreen Agent. I provide a sophisticated split-screen panel system that allows ManaCore applications to display two apps side-by-side using iFrames. I handle panel management, resizing, state persistence, URL state synchronization, and provide a complete component library for split-screen layouts.

## Expertise

- **Split-Screen UI**: Resizable two-panel layout system
- **iFrame Management**: Loading and controlling apps in iFrames
- **State Management**: Svelte 5 stores for panel state
- **URL State Sync**: Persist panel state in URL query parameters
- **Local Storage**: Save panel preferences per app
- **Responsive Design**: Mobile-aware with breakpoint handling
- **Panel Controls**: Open, close, swap, resize operations
- **Drag Resize**: Interactive divider with drag-to-resize
- **Type Safety**: Complete TypeScript type definitions

## Code Structure

```
src/
├── components/               # UI components
│   ├── SplitPaneContainer.svelte  # Main container
│   ├── AppPanel.svelte           # Individual panel
│   ├── PanelControls.svelte      # Control buttons
│   └── ResizeHandle.svelte       # Draggable divider
├── stores/
│   └── split-panel.svelte.ts # State management store
├── utils/                    # Utility functions
│   ├── index.ts              # Main exports
│   ├── local-storage.ts      # localStorage helpers
│   └── url-state.ts          # URL state helpers
├── types.ts                  # Type definitions
└── index.ts                  # Package exports
```

## Key Patterns

### Store-Based State Management

The package uses a Svelte 5 store (with runes) for managing split-screen state:

```typescript
import { createSplitPanelStore } from '@manacore/shared-splitscreen';

const splitPanel = createSplitPanelStore({
  currentAppId: 'calendar',  // Current app identifier
  storageKey: 'split-panel-state',  // localStorage key
  availableApps: [
    { id: 'todo', name: 'Todo', baseUrl: '/todo', icon: 'check-square' },
    { id: 'contacts', name: 'Contacts', baseUrl: '/contacts', icon: 'users' },
  ],
});
```

### Panel Operations

```typescript
// Open a panel
splitPanel.openPanel({
  appId: 'todo',
  url: '/todo?view=today',
  name: 'Todo App',
});

// Close the right panel
splitPanel.closePanel();

// Swap panels (left becomes right, right becomes left)
splitPanel.swapPanels();

// Resize divider
splitPanel.setDividerPosition(60); // 60% left, 40% right
```

### URL State Synchronization

```typescript
import { parseUrlState, updateUrlState } from '@manacore/shared-splitscreen';

// Read state from URL
const urlState = parseUrlState(window.location.search);
// { panel: 'todo', split: 50 }

// Update URL when panel changes
updateUrlState({ panel: 'contacts', split: 60 });
// Updates URL to ?panel=contacts&split=60
```

### Local Storage Persistence

```typescript
import { savePanelState, loadPanelState } from '@manacore/shared-splitscreen';

// Save current panel state
savePanelState('calendar', {
  isActive: true,
  rightPanel: { appId: 'todo', url: '/todo', name: 'Todo' },
  dividerPosition: 50,
});

// Load saved state
const savedState = loadPanelState('calendar');
```

### Context-Based API

```typescript
import { setSplitPanelContext, getSplitPanelContext } from '@manacore/shared-splitscreen';

// In parent component
const store = createSplitPanelStore({ currentAppId: 'calendar' });
setSplitPanelContext(store);

// In child components
const splitPanel = getSplitPanelContext();
```

## Component Usage

### SplitPaneContainer

Main container component that manages the split layout:

```svelte
<script lang="ts">
  import { SplitPaneContainer } from '@manacore/shared-splitscreen';
  import type { AppDefinition } from '@manacore/shared-splitscreen';

  const availableApps: AppDefinition[] = [
    { id: 'todo', name: 'Todo', baseUrl: '/todo', icon: 'check-square', color: '#3B82F6' },
    { id: 'calendar', name: 'Calendar', baseUrl: '/calendar', icon: 'calendar', color: '#10B981' },
    { id: 'contacts', name: 'Contacts', baseUrl: '/contacts', icon: 'users', color: '#F59E0B' },
  ];
</script>

<SplitPaneContainer currentAppId="calendar" {availableApps}>
  <!-- Left panel content (your main app) -->
  <div slot="left">
    <h1>Calendar App</h1>
    <p>Your calendar content here</p>
  </div>

  <!-- Optional: Custom panel controls -->
  <div slot="controls">
    <button>Custom Control</button>
  </div>
</SplitPaneContainer>
```

### AppPanel

Individual panel for displaying an app in an iFrame:

```svelte
<script lang="ts">
  import { AppPanel } from '@manacore/shared-splitscreen';
</script>

<AppPanel
  appId="todo"
  url="/todo?view=today"
  name="Todo App"
  onClose={() => console.log('Panel closed')}
/>
```

### PanelControls

Control buttons for panel operations:

```svelte
<script lang="ts">
  import { PanelControls } from '@manacore/shared-splitscreen';
  import { getSplitPanelContext } from '@manacore/shared-splitscreen';

  const splitPanel = getSplitPanelContext();
</script>

<PanelControls
  availableApps={[
    { id: 'todo', name: 'Todo', baseUrl: '/todo' },
    { id: 'contacts', name: 'Contacts', baseUrl: '/contacts' },
  ]}
  onOpenApp={(app) => splitPanel.openPanel({
    appId: app.id,
    url: app.baseUrl,
    name: app.name,
  })}
  onClose={() => splitPanel.closePanel()}
  onSwap={() => splitPanel.swapPanels()}
/>
```

### ResizeHandle

Draggable divider for resizing panels:

```svelte
<script lang="ts">
  import { ResizeHandle } from '@manacore/shared-splitscreen';

  let dividerPosition = $state(50);
</script>

<div class="split-container">
  <div class="left-panel" style="width: {dividerPosition}%">
    Left content
  </div>

  <ResizeHandle
    bind:position={dividerPosition}
    onDragEnd={(position) => console.log('Final position:', position)}
  />

  <div class="right-panel" style="width: {100 - dividerPosition}%">
    Right content
  </div>
</div>
```

## Type Definitions

### Core Types

```typescript
// Panel configuration
interface PanelConfig {
  appId: string;      // Unique app identifier
  url: string;        // Full URL for iFrame
  name?: string;      // Display name
}

// Split-screen state
interface SplitScreenState {
  isActive: boolean;           // Is split mode active?
  rightPanel: PanelConfig | null;  // Right panel config
  dividerPosition: number;     // Position (20-80)
}

// App definition
interface AppDefinition {
  id: string;         // Unique identifier
  name: string;       // Display name
  baseUrl: string;    // Base URL
  icon?: string;      // Icon name
  color?: string;     // Theme color
}

// Panel event
interface PanelEvent {
  type: 'open' | 'close' | 'swap' | 'resize';
  panel?: PanelConfig;
  dividerPosition?: number;
}

// Storage configuration
interface StorageConfig {
  prefix: string;           // localStorage key prefix
  currentAppId: string;     // Current app ID for scoped storage
}

// URL state
interface UrlState {
  panel?: string;      // App ID for right panel
  split?: number;      // Divider position
}
```

### Constants

```typescript
// Divider constraints
const DIVIDER_CONSTRAINTS = {
  MIN: 20,      // Minimum 20% for left panel
  MAX: 80,      // Maximum 80% for left panel
  DEFAULT: 50,  // Default 50/50 split
} as const;

// Mobile breakpoint (disable split-screen below this)
const MOBILE_BREAKPOINT = 1024; // pixels
```

## Integration Points

### Dependencies

- **svelte**: ^5.0.0 (Svelte 5 components and stores)

### Peer Dependencies

- **svelte**: ^5.0.0

### Used By

- Multi-app dashboard interfaces
- Productivity apps with side-by-side views
- Calendar + Todo integration
- Contact + Email integration
- Any app needing split-screen functionality

### Integration with SvelteKit

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { SplitPaneContainer } from '@manacore/shared-splitscreen';
  import { page } from '$app/stores';

  const apps = [
    { id: 'calendar', name: 'Calendar', baseUrl: '/calendar', icon: 'calendar' },
    { id: 'todo', name: 'Todo', baseUrl: '/todo', icon: 'check-square' },
    { id: 'contacts', name: 'Contacts', baseUrl: '/contacts', icon: 'users' },
  ];

  const currentAppId = $derived($page.url.pathname.split('/')[1] || 'calendar');
</script>

<SplitPaneContainer {currentAppId} availableApps={apps}>
  <div slot="left">
    <slot />  <!-- Main app content -->
  </div>
</SplitPaneContainer>
```

## How to Use

### Installation

This package is internal to the monorepo:

```json
{
  "dependencies": {
    "@manacore/shared-splitscreen": "workspace:*"
  }
}
```

### Basic Setup

```svelte
<script lang="ts">
  import {
    SplitPaneContainer,
    createSplitPanelStore,
    setSplitPanelContext,
  } from '@manacore/shared-splitscreen';
  import type { AppDefinition } from '@manacore/shared-splitscreen';

  const apps: AppDefinition[] = [
    { id: 'todo', name: 'Todo', baseUrl: '/todo', icon: 'check-square' },
    { id: 'calendar', name: 'Calendar', baseUrl: '/calendar', icon: 'calendar' },
    { id: 'contacts', name: 'Contacts', baseUrl: '/contacts', icon: 'users' },
  ];

  // Create and set context
  const store = createSplitPanelStore({
    currentAppId: 'calendar',
    availableApps: apps,
  });
  setSplitPanelContext(store);
</script>

<SplitPaneContainer currentAppId="calendar" availableApps={apps}>
  <div slot="left">
    <h1>My Calendar App</h1>
    <!-- Your app content -->
  </div>
</SplitPaneContainer>
```

### With URL State Persistence

```svelte
<script lang="ts">
  import {
    createSplitPanelStore,
    parseUrlState,
    updateUrlState,
  } from '@manacore/shared-splitscreen';
  import { browser } from '$app/environment';

  // Parse initial state from URL
  const urlState = browser ? parseUrlState(window.location.search) : {};

  const store = createSplitPanelStore({
    currentAppId: 'calendar',
    availableApps: apps,
  });

  // Restore state from URL
  if (urlState.panel) {
    const app = apps.find(a => a.id === urlState.panel);
    if (app) {
      store.openPanel({
        appId: app.id,
        url: app.baseUrl,
        name: app.name,
      });
    }
  }

  // Sync URL when state changes
  $effect(() => {
    if (browser) {
      updateUrlState({
        panel: store.state.rightPanel?.appId,
        split: store.state.dividerPosition,
      });
    }
  });
</script>
```

### With Local Storage

```svelte
<script lang="ts">
  import {
    createSplitPanelStore,
    loadPanelState,
    savePanelState,
  } from '@manacore/shared-splitscreen';

  const currentAppId = 'calendar';

  // Load saved state
  const savedState = loadPanelState(currentAppId);

  const store = createSplitPanelStore({
    currentAppId,
    availableApps: apps,
    initialState: savedState,
  });

  // Save state on changes
  $effect(() => {
    savePanelState(currentAppId, store.state);
  });
</script>
```

### Custom Panel Controls

```svelte
<script lang="ts">
  import {
    SplitPaneContainer,
    getSplitPanelContext,
  } from '@manacore/shared-splitscreen';
  import { Button } from '@manacore/shared-ui';
  import { X, ArrowsLeftRight } from '@manacore/shared-icons';

  const splitPanel = getSplitPanelContext();
  const isActive = $derived(splitPanel.state.isActive);

  function openTodo() {
    splitPanel.openPanel({
      appId: 'todo',
      url: '/todo',
      name: 'Todo',
    });
  }
</script>

<SplitPaneContainer currentAppId="calendar" availableApps={apps}>
  <div slot="left">
    <div class="toolbar">
      <Button onclick={openTodo}>Open Todo</Button>

      {#if isActive}
        <Button onclick={() => splitPanel.swapPanels()}>
          <ArrowsLeftRight size={16} />
          Swap
        </Button>
        <Button variant="ghost" onclick={() => splitPanel.closePanel()}>
          <X size={16} />
          Close Panel
        </Button>
      {/if}
    </div>

    <!-- Main content -->
  </div>
</SplitPaneContainer>
```

### Responsive Behavior

```svelte
<script lang="ts">
  import { SplitPaneContainer } from '@manacore/shared-splitscreen';
  import { MOBILE_BREAKPOINT } from '@manacore/shared-splitscreen';

  let windowWidth = $state(0);

  // Detect window size
  $effect(() => {
    if (browser) {
      windowWidth = window.innerWidth;
      window.addEventListener('resize', () => {
        windowWidth = window.innerWidth;
      });
    }
  });

  const isMobile = $derived(windowWidth < MOBILE_BREAKPOINT);
</script>

{#if isMobile}
  <!-- Mobile: No split-screen -->
  <div>
    <slot />
  </div>
{:else}
  <!-- Desktop: Enable split-screen -->
  <SplitPaneContainer currentAppId="calendar" availableApps={apps}>
    <div slot="left">
      <slot />
    </div>
  </SplitPaneContainer>
{/if}
```

## Best Practices

1. **Use Context API**: Always use `setSplitPanelContext` and `getSplitPanelContext` for store access
2. **Persist State**: Combine URL state and localStorage for best UX
3. **Responsive Design**: Disable split-screen on mobile (< 1024px)
4. **Constrain Divider**: Respect MIN/MAX constraints (20-80%)
5. **Loading States**: Show loading indicator while iFrame loads
6. **Error Handling**: Handle iFrame loading errors gracefully
7. **Type Safety**: Use TypeScript types for all panel operations
8. **Performance**: Lazy load panels, unload when closed
9. **Accessibility**: Provide keyboard shortcuts for panel operations
10. **Clear Actions**: Provide obvious UI for opening/closing panels

## Store API

### createSplitPanelStore

```typescript
const store = createSplitPanelStore({
  currentAppId: string;           // Required: Current app ID
  availableApps?: AppDefinition[]; // Optional: Available apps
  initialState?: SplitScreenState; // Optional: Initial state
  storageKey?: string;            // Optional: localStorage key
});
```

### Store Methods

```typescript
store.openPanel(config: PanelConfig): void
store.closePanel(): void
store.swapPanels(): void
store.setDividerPosition(position: number): void
store.reset(): void
```

### Store State

```typescript
store.state // Access current state
  .isActive: boolean
  .rightPanel: PanelConfig | null
  .dividerPosition: number
```

## Utility Functions

### URL State

```typescript
parseUrlState(search: string): UrlState
updateUrlState(state: UrlState): void
clearUrlState(): void
getCurrentUrlState(): UrlState
```

### Local Storage

```typescript
savePanelState(appId: string, state: SplitScreenState): void
loadPanelState(appId: string): SplitScreenState | null
clearPanelState(appId: string): void
createStorageConfig(currentAppId: string, prefix?: string): StorageConfig
```

## Common Use Cases

1. **Calendar + Todo**: View calendar and todo list side-by-side
2. **Email + Contacts**: Read email while browsing contacts
3. **Dashboard + Analytics**: Main dashboard with analytics panel
4. **Code + Preview**: Code editor with live preview
5. **Chat + Video**: Chat interface with video call panel
6. **Notes + Reference**: Note-taking with reference material

## Advanced Patterns

### Dynamic App Loading

```svelte
<script lang="ts">
  import { getSplitPanelContext } from '@manacore/shared-splitscreen';

  const splitPanel = getSplitPanelContext();

  function openAppWithQuery(appId: string, query: Record<string, string>) {
    const app = apps.find(a => a.id === appId);
    if (!app) return;

    const params = new URLSearchParams(query).toString();
    const url = `${app.baseUrl}?${params}`;

    splitPanel.openPanel({
      appId: app.id,
      url,
      name: app.name,
    });
  }

  // Usage
  openAppWithQuery('todo', { view: 'today', filter: 'priority' });
</script>
```

### Cross-Panel Communication

```svelte
<script lang="ts">
  import { getSplitPanelContext } from '@manacore/shared-splitscreen';

  const splitPanel = getSplitPanelContext();

  function sendMessageToPanel(message: any) {
    const iframe = document.querySelector('iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(message, '*');
    }
  }

  // Listen for messages from iFrame
  window.addEventListener('message', (event) => {
    console.log('Message from panel:', event.data);
  });
</script>
```
