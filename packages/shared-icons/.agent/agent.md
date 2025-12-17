# @manacore/shared-icons Agent

## Module Information

**Package**: `@manacore/shared-icons`
**Type**: Icon Library
**Framework**: Svelte 5 (Phosphor Icons)
**Purpose**: Centralized icon system for all ManaCore SvelteKit web applications

## Identity

I am the Shared Icons Agent. I provide a unified icon library based on Phosphor Icons for all SvelteKit web applications in the ManaCore monorepo. I ensure consistent iconography across all apps by re-exporting phosphor-svelte components with a single import point.

## Expertise

- **Phosphor Icons**: Complete icon set from phosphor-svelte (https://phosphoricons.com)
- **Icon Variants**: Support for thin, light, regular, bold, fill, and duotone weights
- **Svelte 5 Components**: All icons are Svelte 5 components
- **Consistent API**: Unified props interface (size, weight, color, class)
- **Tree-Shakeable**: Only import icons you use
- **TypeScript**: Full TypeScript support for all icons

## Code Structure

```
src/
└── index.ts                  # Re-exports all phosphor-svelte icons
```

### Main Export File

```typescript
/**
 * @manacore/shared-icons
 *
 * Phosphor Icons for all Manacore SvelteKit web apps
 * https://phosphoricons.com
 *
 * Usage:
 * import { House, User, Gear, Plus } from '@manacore/shared-icons';
 *
 * <House size={24} weight="bold" />
 * <User size={20} weight="regular" class="text-blue-500" />
 *
 * Available weights: thin, light, regular, bold, fill, duotone
 */

export * from 'phosphor-svelte';
```

## Key Patterns

### Icon Component Props

All Phosphor icons accept these props:

```typescript
interface IconProps {
  size?: number | string;      // Size in pixels (default: 24)
  weight?: IconWeight;          // Icon weight/style
  color?: string;               // CSS color value
  mirrored?: boolean;           // Mirror the icon horizontally
  class?: string;               // Additional CSS classes
}

type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
```

### Basic Usage

```svelte
<script lang="ts">
  import { House, User, Gear } from '@manacore/shared-icons';
</script>

<!-- Default (24px, regular weight) -->
<House />

<!-- Custom size -->
<User size={32} />

<!-- Custom weight -->
<Gear weight="bold" />

<!-- With color and classes -->
<House size={20} weight="fill" class="text-primary hover:text-primary/80" />
```

### Weight Variations

```svelte
<script lang="ts">
  import { Heart } from '@manacore/shared-icons';
</script>

<Heart weight="thin" />      <!-- Thinnest stroke -->
<Heart weight="light" />     <!-- Light stroke -->
<Heart weight="regular" />   <!-- Default stroke -->
<Heart weight="bold" />      <!-- Thick stroke -->
<Heart weight="fill" />      <!-- Filled solid -->
<Heart weight="duotone" />   <!-- Two-tone style -->
```

### Dynamic Icons

```svelte
<script lang="ts">
  import * as Icons from '@manacore/shared-icons';

  interface Props {
    iconName: string;
  }

  let { iconName }: Props = $props();

  // Get icon component dynamically
  const IconComponent = $derived(Icons[iconName as keyof typeof Icons]);
</script>

{#if IconComponent}
  <svelte:component this={IconComponent} size={24} />
{/if}
```

### Animated Icons

```svelte
<script lang="ts">
  import { Spinner, CircleNotch } from '@manacore/shared-icons';
</script>

<!-- Loading spinner -->
<Spinner size={24} class="animate-spin" />

<!-- Alternative spinner -->
<CircleNotch size={24} weight="bold" class="animate-spin" />
```

## Integration Points

### Dependencies

- **phosphor-svelte**: ^3.0.1 (Phosphor Icons for Svelte)

### Peer Dependencies

- **svelte**: ^5.0.0

### Used By

- **@manacore/shared-ui**: UI component library
- All SvelteKit web applications in the monorepo
- Navigation components
- Button components
- Settings interfaces
- Any component requiring icons

### Common Integration with shared-ui

```svelte
<script lang="ts">
  import { Button } from '@manacore/shared-ui';
  import { Plus, Trash } from '@manacore/shared-icons';
</script>

<Button>
  <Plus size={16} weight="bold" />
  Create New
</Button>

<Button variant="danger">
  <Trash size={16} />
  Delete
</Button>
```

## How to Use

### Installation

This package is internal to the monorepo and uses workspace protocol:

```json
{
  "dependencies": {
    "@manacore/shared-icons": "workspace:*"
  }
}
```

### Common Icons Reference

#### Navigation & UI

```svelte
import {
  House,           // Home
  List,            // Menu
  X,               // Close
  CaretLeft,       // Back
  CaretRight,      // Forward
  CaretDown,       // Dropdown
  DotsThree,       // More options
  MagnifyingGlass, // Search
  Plus,            // Add
  Minus,           // Remove
  Check,           // Confirm
} from '@manacore/shared-icons';
```

#### Actions

```svelte
import {
  PencilSimple,    // Edit
  Trash,           // Delete
  Copy,            // Copy
  Download,        // Download
  Upload,          // Upload
  Share,           // Share
  Heart,           // Favorite
  Star,            // Bookmark
  Archive,         // Archive
  Eye,             // View
  EyeSlash,        // Hide
} from '@manacore/shared-icons';
```

#### Status & Feedback

```svelte
import {
  CheckCircle,     // Success
  XCircle,         // Error
  Warning,         // Warning
  Info,            // Information
  Question,        // Help
  Spinner,         // Loading
  CircleNotch,     // Alternative loading
} from '@manacore/shared-icons';
```

#### User & Account

```svelte
import {
  User,            // User profile
  UserCircle,      // User avatar
  Users,           // Multiple users
  UserPlus,        // Add user
  SignOut,         // Logout
  SignIn,          // Login
  Key,             // Password
  Lock,            // Security
} from '@manacore/shared-icons';
```

#### Settings & Configuration

```svelte
import {
  Gear,            // Settings
  Sliders,         // Adjust/preferences
  Palette,         // Theme
  Bell,            // Notifications
  Moon,            // Dark mode
  Sun,             // Light mode
  GlobeHemisphereWest, // Language/region
} from '@manacore/shared-icons';
```

#### Communication

```svelte
import {
  ChatCircle,      // Chat
  ChatCircleText,  // Message
  Envelope,        // Email
  EnvelopeOpen,    // Read email
  Phone,           // Call
  PaperPlane,      // Send
} from '@manacore/shared-icons';
```

#### Files & Documents

```svelte
import {
  File,            // File
  FileText,        // Document
  Folder,          // Folder
  FolderOpen,      // Open folder
  Image,           // Image file
  FilePdf,         // PDF
  FileCode,        // Code file
  Note,            // Note
  Notebook,        // Notebook
} from '@manacore/shared-icons';
```

#### Calendar & Time

```svelte
import {
  Calendar,        // Calendar
  CalendarBlank,   // Empty calendar
  Clock,           // Time
  ClockCountdown,  // Timer
  Timer,           // Stopwatch
  CalendarPlus,    // Add event
} from '@manacore/shared-icons';
```

#### Data & Charts

```svelte
import {
  ChartBar,        // Bar chart
  ChartLine,       // Line chart
  ChartPie,        // Pie chart
  TrendUp,         // Trending up
  TrendDown,       // Trending down
  Activity,        // Activity/stats
} from '@manacore/shared-icons';
```

### Complete Usage Example

```svelte
<script lang="ts">
  import { Button, Input, Card } from '@manacore/shared-ui';
  import {
    MagnifyingGlass,
    Plus,
    Trash,
    PencilSimple,
    Check,
    X,
  } from '@manacore/shared-icons';

  let searchQuery = $state('');
  let editMode = $state(false);
</script>

<Card>
  <div class="flex items-center gap-2 mb-4">
    <MagnifyingGlass size={20} class="text-theme/60" />
    <Input bind:value={searchQuery} placeholder="Search..." />
  </div>

  <div class="flex gap-2">
    <Button variant="primary">
      <Plus size={16} weight="bold" />
      Create New
    </Button>

    {#if editMode}
      <Button variant="success">
        <Check size={16} weight="bold" />
        Save
      </Button>
      <Button variant="secondary" onclick={() => editMode = false}>
        <X size={16} />
        Cancel
      </Button>
    {:else}
      <Button variant="secondary" onclick={() => editMode = true}>
        <PencilSimple size={16} />
        Edit
      </Button>
      <Button variant="danger">
        <Trash size={16} />
        Delete
      </Button>
    {/if}
  </div>
</Card>
```

### Responsive Icon Sizes

```svelte
<script lang="ts">
  import { House } from '@manacore/shared-icons';
</script>

<!-- Mobile: 16px, Desktop: 24px -->
<House size={16} class="sm:hidden" />
<House size={24} class="hidden sm:block" />

<!-- Or use CSS -->
<House class="w-4 h-4 sm:w-6 sm:h-6" />
```

### Themed Icons

```svelte
<script lang="ts">
  import { Sun, Moon } from '@manacore/shared-icons';

  let isDark = $state(false);
</script>

<!-- Toggle icon based on theme -->
{#if isDark}
  <Moon size={20} weight="fill" class="text-primary" />
{:else}
  <Sun size={20} weight="fill" class="text-yellow-500" />
{/if}
```

## Best Practices

1. **Consistent Sizing**: Use standard sizes (16, 20, 24, 32) for consistency
2. **Weight Selection**: Use `regular` for most cases, `bold` for emphasis, `fill` for active states
3. **Color Inheritance**: Let icons inherit text color when possible using `class="text-*"`
4. **Accessibility**: Pair icons with text labels or aria-labels
5. **Tree Shaking**: Import only the icons you need
6. **Named Imports**: Always use named imports, never `import * as Icons` in production
7. **Animation**: Use Tailwind's `animate-spin` for loading spinners
8. **Responsive**: Adjust icon size for mobile vs desktop
9. **Semantic Usage**: Choose icons that clearly represent their function
10. **Weight Consistency**: Use the same weight across similar UI elements

## Icon Categories

### Core UI (Most Used)
- House, List, X, Plus, Minus, Check
- MagnifyingGlass, DotsThree, CaretDown

### Actions
- PencilSimple, Trash, Copy, Share, Download, Upload
- Heart, Star, Archive, Eye, EyeSlash

### Status
- CheckCircle, XCircle, Warning, Info, Question
- Spinner, CircleNotch

### User
- User, UserCircle, Users, UserPlus
- SignIn, SignOut, Key, Lock

### Settings
- Gear, Sliders, Palette, Bell, Moon, Sun

### Content
- File, Folder, Image, Note, Calendar, Clock

### Charts
- ChartBar, ChartLine, ChartPie, TrendUp, Activity

## Resources

- **Phosphor Icons**: https://phosphoricons.com
- **Icon Search**: Browse all available icons at phosphoricons.com
- **GitHub**: https://github.com/phosphor-icons/svelte
