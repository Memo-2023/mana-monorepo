# Mobile UI Package Agent

## Module Information

**Package**: `@picture/mobile-ui`
**Version**: 0.1.0
**Type**: React Native UI component library
**Location**: `/apps/picture/packages/mobile-ui`

## Identity

I am the Mobile UI Agent for the Picture app. I maintain a comprehensive React Native component library with a CLI tool for easy component installation. I provide production-ready, accessible, and performant UI components for Picture's mobile apps.

## Purpose

This package provides:
- **Reusable UI components** for React Native/Expo apps
- **CLI tool** for selective component installation (`npx picture-ui add`)
- **Component registry** with dependency tracking
- **Design system integration** via `@picture/design-tokens`

The library follows a "copy-paste" philosophy - components are copied into consuming apps rather than used as dependencies, allowing full customization.

## Expertise

### Component Categories

#### UI Components (`components/ui/`)

1. **Core Components**
   - `Button` - Pressable with variants (primary, secondary, danger, ghost, outline), sizes, icons, loading states
   - `Text` - Typography with predefined variants and weights
   - `Icon` - Cross-platform icons (SF Symbols on iOS, Ionicons elsewhere)
   - `Container` - Safe area container with flexible padding/background

2. **Display Components**
   - `Card` - Container with shadow and press interaction
   - `EmptyState` - Empty state with icon, title, description
   - `ErrorBanner` - Floating banner for error/warning/info/success messages
   - `Skeleton` - Loading skeleton with shimmer animation
   - `Badge` - Notification badge for counts and status
   - `Tag` - Tag/Chip for labels and categories

3. **Input Components**
   - `Slider` - Interactive slider with smooth animations
   - `Select` - Horizontal scrollable selector for options
   - `ToggleGroup` - Segmented control for mutually exclusive options

4. **Action Components**
   - `FAB` - Floating Action Button with spring animation

#### Navigation Components (`components/navigation/`)

- `Header` - Navigation header with title, back button, custom actions
- `HeaderButton` - Icon button for header actions
- `TabBarIcon` - Icon component optimized for tab bars

### CLI Tool (`cli/`)

**Binary**: `picture-ui` (via `cli/bin/cli.js`)

**Commands**:
- `picture-ui add <component>` - Add component(s) to project
- `picture-ui list` - List all available components

**Features**:
- Reads `registry.json` for component metadata
- Resolves component dependencies automatically
- Copies component files to target project
- Validates file structure before copying

## Code Structure

```
mobile-ui/
├── cli/
│   ├── bin/
│   │   └── cli.js               # CLI entry point
│   └── src/
│       ├── index.ts             # CLI logic
│       ├── types.ts             # CLI types
│       ├── commands/
│       │   ├── add.ts           # Add command implementation
│       │   └── list.ts          # List command implementation
│       └── utils/
│           ├── registry.ts      # Registry parsing
│           ├── paths.ts         # Path resolution
│           └── files.ts         # File operations
├── components/
│   ├── ui/                      # UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── Text/
│   │   ├── Icon/
│   │   └── [other components...]
│   └── navigation/              # Navigation components
│       ├── Header/
│       ├── HeaderButton/
│       └── TabBarIcon/
├── registry.json                # Component registry
├── package.json
└── [documentation files]
```

## Key Patterns

### Component Architecture

**Typical component structure**:
```typescript
// Button.tsx
import { forwardRef } from 'react';
import { Pressable, PressableProps } from 'react-native';

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  // ... custom props
} & PressableProps;

export const Button = forwardRef<View, ButtonProps>((props, ref) => {
  // Implementation with forwarded ref
  return <Pressable ref={ref} {...props} />;
});

Button.displayName = 'Button';
```

**Pattern characteristics**:
- Use `forwardRef` for ref forwarding
- Extend native component props (e.g., `PressableProps`)
- Type-safe props with TypeScript
- Set `displayName` for debugging
- Support customization via props and style overrides

### Component Dependencies

Components can depend on other components (tracked in `registry.json`):
- `Button` depends on: `Icon`, `Text`
- `EmptyState` depends on: `Text`, `Icon`
- `FAB` depends on: `Icon`

CLI automatically installs dependencies when adding components.

### Styling Approach

1. **Inline styles**: Use React Native `StyleSheet` or inline objects
2. **Props-based customization**: Accept `style`, `className` props
3. **Design tokens**: Reference `@picture/design-tokens` for colors/spacing
4. **Platform-specific**: Use `Platform.select()` when needed

### Registry Format

`registry.json` schema:
```json
{
  "components": {
    "ui": {
      "button": {
        "name": "Button",
        "files": ["Button.tsx"],
        "category": "ui",
        "dependencies": ["icon", "text"],
        "description": "Pressable button with variants..."
      }
    }
  }
}
```

## Integration Points

### Dependencies

**Peer dependencies** (required in consuming app):
- `react` >= 18.0.0
- `react-native` >= 0.70.0
- `react-native-reanimated` >= 3.0.0 (for animations)
- `react-native-safe-area-context` >= 4.0.0 (for safe areas)

### Consumed By

- `@picture/mobile` - Picture mobile app

### Related Packages

- `@picture/design-tokens` - Design system tokens (colors, spacing, typography)

### CLI Installation

From consuming app:
```bash
# Install a single component
npx picture-ui add button

# Install multiple components
npx picture-ui add button text icon

# List available components
npx picture-ui list
```

Components are copied to `components/ui/` in the consuming app.

## Component Guidelines

### Creating New Components

1. **File structure**:
   ```
   components/ui/MyComponent/
   ├── MyComponent.tsx
   └── index.ts (re-export)
   ```

2. **Component template**:
   ```typescript
   import { forwardRef } from 'react';
   import { View, ViewProps } from 'react-native';

   export type MyComponentProps = {
     // Custom props
   } & ViewProps;

   export const MyComponent = forwardRef<View, MyComponentProps>(
     (props, ref) => {
       return <View ref={ref} {...props} />;
     }
   );

   MyComponent.displayName = 'MyComponent';
   ```

3. **Add to registry** (`registry.json`):
   ```json
   {
     "my-component": {
       "name": "MyComponent",
       "files": ["MyComponent.tsx"],
       "category": "ui",
       "dependencies": [],
       "description": "Brief description"
     }
   }
   ```

### Component Best Practices

1. **Accessibility**: Support accessibility props (`accessibilityLabel`, `accessibilityRole`)
2. **Performance**: Use `React.memo()` for expensive components
3. **Animations**: Use `react-native-reanimated` for smooth 60fps animations
4. **Safe areas**: Use `useSafeAreaInsets()` for proper padding
5. **Platform differences**: Handle iOS/Android differences gracefully
6. **Dark mode**: Support light/dark color schemes
7. **TypeScript**: Full type safety with exported prop types

### Variant Pattern

Use discriminated unions for variants:
```typescript
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

const getVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary': return { bg: colors.primary };
    case 'secondary': return { bg: colors.secondary };
    // ...
  }
};
```

### Size Pattern

Provide size presets:
```typescript
export type ButtonSize = 'sm' | 'md' | 'lg';

const sizeConfig = {
  sm: { paddingX: 12, paddingY: 8, fontSize: 14 },
  md: { paddingX: 16, paddingY: 12, fontSize: 16 },
  lg: { paddingX: 24, paddingY: 16, fontSize: 18 },
};
```

## CLI Tool Details

### Architecture

- **Commander.js**: CLI framework
- **Chalk**: Colored terminal output
- **Prompts**: Interactive selection
- **fs-extra**: File system operations

### Adding Components

```typescript
// CLI workflow:
1. Parse registry.json
2. Validate component exists
3. Resolve dependencies (recursive)
4. Check target directory
5. Copy files to consuming app
6. Report success/failures
```

### Registry Management

Registry stores:
- Component name and display name
- Source files to copy
- Category (ui, navigation)
- Dependencies (other components)
- Description for CLI help

## Documentation Files

- `README.md` - Package overview and usage
- `QUICKSTART.md` - Quick start guide
- `CLI.md` - CLI tool documentation
- `STATUS.md` - Component status tracking
- `MIGRATION.md` - Migration guides
- `MONOREPO_ARCHITECTURE.md` - Monorepo integration
- `RENAME_CHANGELOG.md` - Package rename history
- `SUMMARY.md` - Component library summary

## Common Operations

### Adding a New Component

1. Create component in `components/ui/ComponentName/`
2. Add to `registry.json`
3. Test in example app
4. Update documentation

### Updating Component Dependencies

1. Modify component imports
2. Update `dependencies` array in `registry.json`
3. Test CLI installation with dependencies

### Testing CLI

```bash
# From mobile-ui package
node cli/bin/cli.js list
node cli/bin/cli.js add button --target=/path/to/app
```

## Notes

- **Copy-paste philosophy**: Components are copied, not imported as npm dependencies
- **Full customization**: Consumers can modify copied components
- **Expo-compatible**: All components work with Expo SDK 52+
- **No build step**: Components are used directly (no compilation)
- **Private package**: Not published to npm
- **Monorepo integration**: Designed for Picture app monorepo structure
