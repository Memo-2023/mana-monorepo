# @memoro/mobile-ui

**React Native UI component library for memoro mobile apps.**

⚠️ **Framework Compatibility:**
- ✅ **React Native (Expo)** - Full support
- ❌ **Web (SvelteKit)** - Not compatible (use Svelte components instead)
- ❌ **Landing (Astro)** - Not compatible (use Astro components instead)

This library is specifically built for React Native applications using Expo. All components use React Native primitives (`View`, `Pressable`, `Text`) and cannot be used in web frameworks.

## 🎉 17 Components Ready

### UI Components (14)
- ✅ **Button** - Pressable button with 5 variants, 3 sizes, icon support
- ✅ **Text** - Typography with 11 predefined variants
- ✅ **Icon** - Cross-platform icons (SF Symbols on iOS, Ionicons elsewhere)
- ✅ **Container** - Safe area container with flexible padding
- ✅ **EmptyState** - Empty state display with icon/emoji
- ✅ **ErrorBanner** - Floating notification banner with 4 variants
- ✅ **Slider** - Interactive slider with smooth animations
- ✅ **Skeleton** - Loading skeleton with shimmer effect
- ✅ **FAB** - Floating Action Button with spring animation
- ✅ **Tag** - Tag/Chip for labels and categories
- ✅ **Badge** - Notification badge for counts and status
- ✅ **Card** - Container card with shadow and press interaction
- ✅ **Select** - Horizontal scrollable selector with loading/error states
- ✅ **ToggleGroup** - Segmented control for mutually exclusive options

### Navigation Components (3)
- ✅ **Header** - Navigation header with title, back button, custom actions
- ✅ **HeaderButton** - Icon button for header actions
- ✅ **TabBarIcon** - Icon component optimized for tab bars

## Quick Start

### Using the CLI Tool ✅

```bash
# From your project root
cd /path/to/your-app

# List all available components
node /path/to/packages/mobile-ui/cli/bin/cli.js list

# Add components (dependencies auto-installed)
node /path/to/packages/mobile-ui/cli/bin/cli.js add button
node /path/to/packages/mobile-ui/cli/bin/cli.js add text
node /path/to/packages/mobile-ui/cli/bin/cli.js add card

# Or use -y to skip confirmations
node /path/to/packages/mobile-ui/cli/bin/cli.js add select -y
```

Components are copied to your `components/ui/` directory!

### Using Components

After adding components via CLI:

```tsx
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';

function MyScreen() {
  return (
    <Card>
      <Text variant="h1" weight="bold">Welcome</Text>
      <Button
        title="Get Started"
        variant="primary"
        icon="arrow-forward"
        onPress={() => {}}
      />
    </Card>
  );
}
```

### Manual Import (Alternative)

Or import directly from the packages folder:

```tsx
import { Button } from '~/../../packages/mobile-ui/components/ui/Button';
```

## Documentation

Each component has detailed documentation:

- [Button](./components/ui/Button/README.md)
- [Text](./components/ui/Text/README.md)
- [Icon](./components/ui/Icon/README.md)
- [Container](./components/ui/Container/README.md)
- [EmptyState](./components/ui/EmptyState/README.md)
- [ErrorBanner](./components/ui/ErrorBanner/README.md)

## Project Status

📍 **Current State:**
- ✅ 17 Components ready (14 UI + 3 Navigation)
- ✅ CLI tool working (add + list commands)
- ✅ Embedded in `picture` app for development

🎯 **Next Steps:**
- Test components in mobile app
- Extract to `github.com/memoro/mobile-ui` when stable
- Publish CLI to GitHub Packages

See [STATUS.md](./STATUS.md) for detailed progress.

## Structure

```
mobile-ui/
├── components/
│   ├── ui/              # UI components (14)
│   │   ├── Button/
│   │   ├── Text/
│   │   ├── Icon/
│   │   ├── Container/
│   │   ├── EmptyState/
│   │   └── ... (9 more)
│   └── navigation/      # Navigation components (3)
│       ├── Header/
│       ├── HeaderButton/
│       └── TabBarIcon/
├── cli/                 # CLI tool
├── registry.json        # Component metadata
└── package.json         # Package config
```

## Development

Currently developed within the `picture` app. Will be extracted to its own repository once we have:
- ✅ 5+ working components
- ⏳ CLI tool prototype
- ⏳ Tested in 2+ apps

## License

Private - memoro internal use only.
