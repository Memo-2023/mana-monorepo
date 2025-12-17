# @manacore/shared-ui Agent

## Module Information

**Package**: `@manacore/shared-ui`
**Type**: UI Component Library
**Framework**: Svelte 5 (Runes Mode)
**Purpose**: Shared UI components for SvelteKit web applications across the ManaCore monorepo

## Identity

I am the Shared UI Components Agent. I manage a comprehensive library of reusable Svelte 5 components organized using Atomic Design principles (atoms, molecules, organisms). I provide consistent UI patterns, navigation components, data visualization, settings interfaces, and specialized features like network graphs and input bars.

## Expertise

- **Svelte 5 Runes**: All components use modern Svelte 5 syntax with `$state`, `$derived`, `$effect`
- **Atomic Design**: Components organized as atoms, molecules, organisms for composability
- **Theme Integration**: Uses `@manacore/shared-theme` for consistent styling with CSS custom properties
- **Icon System**: Integrates `@manacore/shared-icons` (Phosphor) and Lucide icons
- **Accessibility**: Focus states, ARIA labels, keyboard navigation
- **Data Visualization**: D3.js-powered charts, graphs, and network visualizations
- **State Management**: Svelte stores and context for component state

## Code Structure

```
src/
├── atoms/                    # Basic building blocks
│   ├── Button.svelte         # Primary button component
│   ├── Badge.svelte          # Badge/pill component
│   ├── Card.svelte           # Container card
│   └── Text.svelte           # Text wrapper
├── molecules/                # Composite components
│   ├── Input.svelte          # Text input field
│   ├── Select.svelte         # Dropdown select
│   ├── Toggle.svelte         # Toggle switch
│   ├── Textarea.svelte       # Text area
│   ├── Checkbox.svelte       # Checkbox input
│   ├── FilterDropdown.svelte # Filter dropdown
│   ├── AudioPlayer.svelte    # Audio playback
│   ├── DataCard.svelte       # Data display card
│   ├── PageHeader.svelte     # Page header layout
│   ├── ModalFooter.svelte    # Modal footer actions
│   ├── ConfirmationPopover.svelte # Inline confirmation
│   ├── KeyboardShortcutsPanel.svelte # Shortcuts display
│   ├── tags/                 # Tag system components
│   │   ├── TagBadge.svelte
│   │   ├── TagSelector.svelte
│   │   ├── TagColorPicker.svelte
│   │   ├── TagEditModal.svelte
│   │   ├── TagList.svelte
│   │   └── constants.ts      # Color palette
│   ├── contacts/             # Contact components
│   │   ├── ContactAvatar.svelte
│   │   ├── ContactBadge.svelte
│   │   └── ContactSelector.svelte
│   ├── feedback/
│   │   └── EmptyState.svelte
│   └── skeletons/            # Loading skeletons
│       ├── SkeletonBox.svelte
│       ├── SkeletonText.svelte
│       ├── SkeletonAvatar.svelte
│       └── ...
├── organisms/                # Complex composite components
│   ├── Modal.svelte          # Base modal component
│   ├── ConfirmationModal.svelte # Confirmation dialog
│   ├── FormModal.svelte      # Form wrapper modal
│   ├── AppSlider.svelte      # App carousel/slider
│   └── network-graph/        # D3.js network visualization
│       ├── NetworkGraph.svelte
│       ├── NetworkControls.svelte
│       └── types.ts
├── navigation/               # Navigation components
│   ├── Navbar.svelte         # Top navigation bar
│   ├── Sidebar.svelte        # Side navigation
│   ├── NavLink.svelte        # Navigation link
│   ├── SidebarSection.svelte # Sidebar section
│   ├── PillNavigation.svelte # Pill-style navigation
│   ├── PillDropdown.svelte   # Pill dropdown
│   ├── PillTabGroup.svelte   # Tab group
│   ├── PillTimeRangeSelector.svelte # Time range picker
│   ├── PillViewSwitcher.svelte # View switcher
│   ├── PillToolbar.svelte    # Toolbar container
│   ├── PillToolbarButton.svelte # Toolbar button
│   ├── PillToolbarDivider.svelte # Toolbar divider
│   └── ExpandableToolbar.svelte # Expandable toolbar
├── settings/                 # Settings UI components
│   ├── SettingsPage.svelte   # Settings page layout
│   ├── SettingsSection.svelte # Settings section
│   ├── SettingsCard.svelte   # Settings card
│   ├── SettingsRow.svelte    # Settings row
│   ├── SettingsToggle.svelte # Toggle setting
│   ├── SettingsSelect.svelte # Select setting
│   ├── SettingsNumberInput.svelte # Number input
│   ├── SettingsTimeInput.svelte # Time input
│   ├── SettingsDangerZone.svelte # Danger zone section
│   ├── SettingsDangerButton.svelte # Destructive action
│   ├── GlobalSettingsSection.svelte # Global settings
│   └── NavVisibilitySettings.svelte # Nav visibility
├── quick-input/              # Quick input bar system
│   ├── QuickInputBar.svelte  # Main input bar
│   ├── InputBar.svelte       # Legacy input bar
│   ├── InputBarContextMenu.svelte # Context menu
│   ├── InputBarHelpModal.svelte # Help modal
│   ├── stores/               # Input bar state
│   └── utils/                # History & settings
├── command-bar/              # Command palette (deprecated)
│   └── CommandBar.svelte     # Use QuickInputBar instead
├── context-menu/             # Context menu system
│   ├── ContextMenu.svelte
│   └── state.ts
├── help/                     # Help system components
│   ├── HelpModal.svelte
│   ├── KeyboardShortcutsPanel.svelte
│   └── SyntaxHelpPanel.svelte
├── charts/                   # Data visualization
│   ├── StatsGrid.svelte      # Statistics grid
│   ├── ActivityHeatmap.svelte # Calendar heatmap
│   ├── TrendLineChart.svelte # Line chart
│   ├── DonutChart.svelte     # Donut/pie chart
│   ├── ProgressBars.svelte   # Progress bars
│   └── StatisticsSkeleton.svelte # Loading skeleton
├── pages/
│   └── AppsPage.svelte       # Apps showcase page
├── components/
│   └── ImmersiveModeToggle.svelte # Immersive mode
└── index.ts                  # Main export file
```

## Key Patterns

### Component Props (Svelte 5 Runes)

```typescript
// Always use $props() destructuring with types
interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  class?: string;
  onclick?: (e: MouseEvent) => void;
  children?: Snippet;
}

let {
  variant = 'primary',
  size = 'md',
  disabled = false,
  class: className = '',
  onclick,
  children,
}: Props = $props();
```

### Reactive Derived Values

```typescript
// Use $derived for computed values
const classes = $derived(
  `base-classes ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
);
```

### Theme-Aware Styling

```typescript
// Use theme CSS custom properties
const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'bg-menu text-theme hover:bg-menu-hover',
  ghost: 'bg-transparent text-theme hover:bg-menu-hover',
};
```

### Type-Safe Variants

```typescript
// Define variants with strict types
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const variantClasses: Record<ButtonVariant, string> = {
  primary: '...',
  secondary: '...',
  // ...
};
```

### Modal Pattern

```svelte
<Modal bind:open={isOpen} title="Modal Title">
  <div>Modal content</div>
  <ModalFooter>
    <Button variant="secondary" onclick={() => isOpen = false}>Cancel</Button>
    <Button variant="primary" onclick={handleSubmit}>Confirm</Button>
  </ModalFooter>
</Modal>
```

### Settings Pattern

```svelte
<SettingsPage title="Settings">
  <SettingsSection title="General" description="General settings">
    <SettingsToggle
      label="Enable notifications"
      description="Receive notifications"
      bind:checked={settings.notifications}
    />
    <SettingsSelect
      label="Theme"
      description="Choose your theme"
      options={themeOptions}
      bind:value={settings.theme}
    />
  </SettingsSection>
</SettingsPage>
```

### Navigation Pattern

```svelte
<Navbar appName="MyApp" logoUrl="/logo.png">
  <NavLink href="/dashboard" icon="House">Dashboard</NavLink>
  <NavLink href="/settings" icon="Gear">Settings</NavLink>
</Navbar>
```

### Tag System

```typescript
// Import tag utilities
import { TagBadge, TagSelector, TAG_COLORS, getRandomTagColor } from '@manacore/shared-ui';

// Use pre-defined color palette
const newTag = {
  name: 'Work',
  color: getRandomTagColor(),
};
```

### Quick Input Bar

```svelte
<QuickInputBar
  placeholder="Type to create..."
  items={quickItems}
  onselect={handleSelect}
  oncreate={handleCreate}
  bind:value={inputValue}
/>
```

### Network Graph (D3.js)

```svelte
<NetworkGraph
  nodes={networkNodes}
  links={networkLinks}
  onNodeClick={handleNodeClick}
  width={800}
  height={600}
/>
<NetworkControls
  onZoomIn={graph.zoomIn}
  onZoomOut={graph.zoomOut}
  onReset={graph.reset}
/>
```

## Integration Points

### Dependencies

- **@manacore/shared-theme**: Theme system (CSS custom properties, fonts)
- **@manacore/shared-icons**: Phosphor icon components
- **@manacore/shared-branding**: Brand assets and colors
- **@manacore/shared-types**: Shared TypeScript types
- **@lucide/svelte**: Lucide icon library (supplementary)
- **d3-force**, **d3-selection**, **d3-transition**, **d3-zoom**: Network graph visualization
- **date-fns**: Date formatting and manipulation

### Export Structure

```typescript
// Atomic exports
export { Text, Button, Badge, Card } from '@manacore/shared-ui/atoms';

// Molecular exports
export { Toggle, Input, Select, Textarea } from '@manacore/shared-ui/molecules';

// Organism exports
export { Modal, ConfirmationModal } from '@manacore/shared-ui/organisms';

// Feature exports
export { Navbar, Sidebar, NavLink } from '@manacore/shared-ui';
export { SettingsPage, SettingsSection } from '@manacore/shared-ui';
export { QuickInputBar } from '@manacore/shared-ui';
```

### Used By

- All SvelteKit web applications in the monorepo
- App-specific UI packages that extend base components
- Settings pages across all apps
- Navigation and layout components

## How to Use

### Installation

This package is internal to the monorepo and uses workspace protocol:

```json
{
  "dependencies": {
    "@manacore/shared-ui": "workspace:*"
  }
}
```

### Basic Components

```svelte
<script lang="ts">
  import { Button, Input, Card, Badge } from '@manacore/shared-ui';

  let name = $state('');
</script>

<Card>
  <h2>Welcome <Badge variant="success">New</Badge></h2>
  <Input bind:value={name} placeholder="Enter your name" />
  <Button onclick={() => console.log(name)}>Submit</Button>
</Card>
```

### Navigation

```svelte
<script lang="ts">
  import { Navbar, Sidebar, NavLink } from '@manacore/shared-ui';
  import { House, Calendar, Settings } from '@manacore/shared-icons';
</script>

<Navbar appName="MyApp">
  <NavLink href="/" icon={House}>Home</NavLink>
  <NavLink href="/calendar" icon={Calendar}>Calendar</NavLink>
  <NavLink href="/settings" icon={Settings}>Settings</NavLink>
</Navbar>

<Sidebar>
  <SidebarSection title="Main">
    <NavLink href="/dashboard">Dashboard</NavLink>
  </SidebarSection>
</Sidebar>
```

### Modals and Dialogs

```svelte
<script lang="ts">
  import { Modal, ConfirmationModal, ModalFooter, Button } from '@manacore/shared-ui';

  let showModal = $state(false);
  let showConfirm = $state(false);
</script>

<Button onclick={() => showModal = true}>Open Modal</Button>

<Modal bind:open={showModal} title="Edit Item">
  <div>Modal content here</div>
  <ModalFooter>
    <Button variant="secondary" onclick={() => showModal = false}>Cancel</Button>
    <Button onclick={handleSave}>Save</Button>
  </ModalFooter>
</Modal>

<ConfirmationModal
  bind:open={showConfirm}
  title="Delete Item"
  message="Are you sure you want to delete this item?"
  confirmText="Delete"
  onconfirm={handleDelete}
/>
```

### Settings UI

```svelte
<script lang="ts">
  import {
    SettingsPage,
    SettingsSection,
    SettingsToggle,
    SettingsSelect,
  } from '@manacore/shared-ui';

  let settings = $state({
    notifications: true,
    theme: 'dark',
  });
</script>

<SettingsPage title="App Settings">
  <SettingsSection title="Preferences">
    <SettingsToggle
      label="Notifications"
      bind:checked={settings.notifications}
    />
    <SettingsSelect
      label="Theme"
      options={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ]}
      bind:value={settings.theme}
    />
  </SettingsSection>
</SettingsPage>
```

### Charts and Visualizations

```svelte
<script lang="ts">
  import { ActivityHeatmap, TrendLineChart, StatsGrid } from '@manacore/shared-ui';
  import type { HeatmapDataPoint, TrendDataPoint, StatItem } from '@manacore/shared-ui';

  const heatmapData: HeatmapDataPoint[] = [
    { date: '2024-01-01', value: 5 },
    { date: '2024-01-02', value: 8 },
  ];

  const trendData: TrendDataPoint[] = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 150 },
  ];

  const stats: StatItem[] = [
    { label: 'Total', value: 1234, variant: 'primary' },
    { label: 'Active', value: 567, variant: 'success' },
  ];
</script>

<StatsGrid stats={stats} />
<ActivityHeatmap data={heatmapData} />
<TrendLineChart data={trendData} />
```

### Tag System

```svelte
<script lang="ts">
  import { TagBadge, TagSelector, TagList } from '@manacore/shared-ui';
  import type { Tag } from '@manacore/shared-ui';

  let selectedTags = $state<Tag[]>([]);
  let availableTags: Tag[] = [
    { id: '1', name: 'Work', color: '#3B82F6' },
    { id: '2', name: 'Personal', color: '#10B981' },
  ];
</script>

<TagSelector
  tags={availableTags}
  bind:selected={selectedTags}
  oncreate={handleCreateTag}
/>

<TagList tags={selectedTags} onremove={handleRemoveTag} />
```

### Network Visualization

```svelte
<script lang="ts">
  import { NetworkGraph, NetworkControls } from '@manacore/shared-ui';
  import type { NetworkNode, NetworkLink } from '@manacore/shared-ui';

  const nodes: NetworkNode[] = [
    { id: '1', label: 'Node 1', type: 'person' },
    { id: '2', label: 'Node 2', type: 'person' },
  ];

  const links: NetworkLink[] = [
    { source: '1', target: '2' },
  ];
</script>

<div class="h-screen">
  <NetworkGraph
    {nodes}
    {links}
    onNodeClick={(node) => console.log('Clicked:', node)}
  />
</div>
```

### Quick Input Bar

```svelte
<script lang="ts">
  import { QuickInputBar } from '@manacore/shared-ui';
  import type { QuickInputItem } from '@manacore/shared-ui';

  let items: QuickInputItem[] = [
    { id: '1', label: 'Create Task', icon: 'plus', type: 'action' },
    { id: '2', label: 'Open Calendar', icon: 'calendar', type: 'navigation' },
  ];

  function handleSelect(item: QuickInputItem) {
    console.log('Selected:', item);
  }
</script>

<QuickInputBar
  {items}
  placeholder="Type to search or create..."
  onselect={handleSelect}
/>
```

## Best Practices

1. **Use Svelte 5 Runes Only**: Never use old Svelte syntax (`let count = 0; $: doubled = count * 2`)
2. **Theme Consistency**: Always use theme CSS custom properties (e.g., `bg-primary`, `text-theme`)
3. **Type Safety**: Define proper TypeScript interfaces for all component props
4. **Accessibility**: Include ARIA labels, focus states, keyboard navigation
5. **Atomic Design**: Compose molecules from atoms, organisms from molecules
6. **Loading States**: Provide skeleton components for loading states
7. **Empty States**: Use EmptyState component for no-data scenarios
8. **Icon Consistency**: Prefer Phosphor icons from @manacore/shared-icons
9. **Modal Footer**: Always use ModalFooter for consistent modal actions
10. **Settings Pattern**: Use Settings* components for consistent settings UI

## Component Categories

### Form Components
- Input, Select, Textarea, Checkbox, Toggle
- SettingsToggle, SettingsSelect, SettingsNumberInput

### Layout Components
- Card, PageHeader, ModalFooter, DataCard

### Navigation Components
- Navbar, Sidebar, NavLink, PillNavigation, PillToolbar

### Feedback Components
- Badge, EmptyState, Skeleton components, Loading states

### Interactive Components
- Button, Modal, ConfirmationModal, ConfirmationPopover

### Data Visualization
- ActivityHeatmap, TrendLineChart, DonutChart, NetworkGraph

### Specialized Features
- QuickInputBar, TagSystem, ContextMenu, HelpModal
