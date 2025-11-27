# @memoro/ui CLI

CLI tool for copying UI components into your app (shadcn-style).

## Installation

```bash
npm install -g @memoro/ui
```

Or use directly with npx:

```bash
npx @memoro/ui add button
```

## Commands

### `add <component>`

Add a component to your project.

```bash
memoro-ui add button
memoro-ui add text
memoro-ui add card
```

Options:

- `-y, --yes` - Skip confirmation prompts

The CLI will:

1. Check if the component exists in the registry
2. Resolve and install dependencies automatically
3. Copy component files to your `components/` directory
4. Show import instructions

### `list`

List all available components.

```bash
memoro-ui list
```

Options:

- `-c, --category <category>` - Filter by category (ui, navigation)

Shows:

- All available components
- Which components are already installed (✓)
- Component descriptions
- Dependencies

## How it Works

This CLI follows the **shadcn** approach:

1. **No NPM dependencies** - Components are copied into your project
2. **Full control** - You own the code, modify as needed
3. **Dependencies** - Automatically installs component dependencies
4. **Type-safe** - All components are fully typed with TypeScript

## Component Structure

Components are copied to:

```
your-project/
└── components/
    ├── ui/
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   ├── index.ts
    │   │   └── README.md
    │   ├── Text/
    │   └── ...
    └── navigation/
        └── ...
```

## Import Pattern

```tsx
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

function MyScreen() {
	return <Button title="Click me" onPress={() => {}} />;
}
```

## Development

Build the CLI:

```bash
npm run build
```

Watch mode:

```bash
npm run dev
```

Link locally for testing:

```bash
npm link
memoro-ui list
```

## Available Components

Run `memoro-ui list` to see all available components.

Current components:

- **UI** (14): Button, Text, Icon, Container, EmptyState, ErrorBanner, Slider, Skeleton, FAB, Tag, Badge, Card, Select, ToggleGroup
- **Navigation** (coming soon): Header, TabBar, HeaderButton

## Philosophy

**Copy, don't install** - This CLI doesn't create NPM dependencies. It copies component source code into your project. This gives you:

- ✅ Full control over the code
- ✅ No version conflicts
- ✅ Customize freely without worrying about updates
- ✅ Smaller bundle size (only what you use)
- ✅ Better for AI context (components in your codebase)

When you want updates, run `memoro-ui add <component>` again to get the latest version (with confirmation).

## License

Private - memoro internal use only.
