# @memoro/mobile-ui CLI Tool

**Status:** ✅ Working (Phase 3 Complete)

⚠️ **Framework:** React Native only

## Overview

A shadcn-style CLI tool that copies React Native UI components into your mobile app. Components become part of your codebase, giving you full control without NPM dependencies.

**Compatible with:**
- ✅ React Native (Expo) applications
- ❌ Web applications (SvelteKit, Next.js, etc.)
- ❌ Astro sites

## Features

- ✅ **Automatic dependency resolution** - Dependencies are installed automatically
- ✅ **Smart conflict detection** - Asks before overwriting existing components
- ✅ **Show installed status** - List command shows which components are already in your project
- ✅ **Copy-paste approach** - No NPM dependencies, you own the code
- ✅ **TypeScript support** - Fully typed components with exported types

## Commands

### `list`

List all available components.

```bash
node packages/mobile-ui/cli/bin/cli.js list
```

**Output:**
```
📦 Available Components

UI:
  ✓ button
    Pressable button with variants, sizes, and icon support
    Dependencies: icon, text
  ○ text
    Typography component with predefined variants and weights
  ...
```

Legend:
- ✓ = Already installed in this project
- ○ = Not installed

**Options:**
- `-c, --category <category>` - Filter by category (ui, navigation)

### `add <component>`

Add a component to your project.

```bash
node packages/mobile-ui/cli/bin/cli.js add button
```

**What it does:**
1. Checks if component exists in registry
2. Resolves dependencies automatically
3. Checks for existing components
4. Asks for confirmation if component exists
5. Installs dependencies first
6. Copies component files to `components/ui/`
7. Shows import instructions

**Options:**
- `-y, --yes` - Skip confirmation prompts

**Example with dependencies:**

```bash
node packages/mobile-ui/cli/bin/cli.js add button
```

Output:
```
✔ Found component: Button
✔ Dependencies: icon, text

The following dependencies will also be installed:
  - icon
  - text

? Install dependencies? › (Y/n)

✔ Installed Icon
✔ Installed Text
✔ Installed Button

✅ Success!

Files added:
  components/ui/Button/Button.tsx
  components/ui/Button/index.ts
  components/ui/Icon/Icon.tsx
  components/ui/Icon/index.ts
  components/ui/Text/Text.tsx
  components/ui/Text/index.ts

Import:
  import { Button } from '@/components/ui/Button';

Usage:
  See components/ui/Button/README.md for examples
```

## How It Works

### Architecture

```
packages/mobile-ui/
├── cli/                     # CLI tool package
│   ├── src/
│   │   ├── commands/
│   │   │   ├── add.ts       # Add command
│   │   │   └── list.ts      # List command
│   │   ├── utils/
│   │   │   ├── paths.ts     # Path resolution
│   │   │   ├── registry.ts  # Registry loading
│   │   │   └── files.ts     # File operations
│   │   ├── types.ts         # TypeScript types
│   │   └── index.ts         # CLI entry point
│   ├── bin/
│   │   └── cli.js           # Executable
│   ├── package.json
│   └── tsconfig.json
├── components/              # Component source code
│   └── ui/
│       ├── Button/
│       ├── Text/
│       └── ...
└── registry.json            # Component metadata
```

### Registry Structure

```json
{
  "name": "@memoro/ui",
  "version": "0.1.0",
  "components": {
    "ui": {
      "button": {
        "name": "Button",
        "files": ["Button.tsx"],
        "category": "ui",
        "dependencies": ["icon", "text"],
        "description": "Pressable button with variants, sizes, and icon support"
      }
    }
  }
}
```

### Dependency Resolution

The CLI automatically resolves dependencies recursively:

1. Component A depends on B and C
2. B depends on D
3. CLI installs: D → B → C → A (in order)

Already installed components are skipped.

### File Operations

Components are copied to:
```
your-project/
└── components/
    └── ui/
        └── Button/
            ├── Button.tsx
            ├── index.ts
            └── README.md (not copied, in source only)
```

### Path Detection

CLI automatically detects the correct destination:

1. Tries `components/`
2. Tries `app/components/`
3. Tries `src/components/`
4. Defaults to `components/` in current directory

## Development

### Building

```bash
cd packages/mobile-ui/cli
npm install
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Local Testing

```bash
# Link globally
npm link

# Use anywhere
memoro-ui list
memoro-ui add button

# Or run directly
node bin/cli.js list
```

### Running Tests

```bash
# Test in temp directory
mkdir -p /tmp/test-cli/components
cd /tmp/test-cli
/path/to/cli/bin/cli.js add button -y
/path/to/cli/bin/cli.js list
```

## Technical Details

### Dependencies

- **commander** - CLI framework
- **chalk** - Terminal colors
- **ora** - Spinners
- **prompts** - Interactive prompts
- **fs-extra** - Enhanced file operations

### TypeScript

Fully typed with TypeScript:
- `ComponentRegistry` - Registry structure
- `ComponentInfo` - Component metadata
- `Config` - CLI configuration

### Error Handling

- Registry not found → Clear error message
- Component not found → Shows available components
- File errors → Shows error and exits gracefully
- Dependency resolution errors → Skips missing dependencies

## Future Enhancements (Phase 4+)

### `update` Command
```bash
memoro-ui update button
```
- Shows diff between local and remote
- Asks for confirmation
- Updates component

### `diff` Command
```bash
memoro-ui diff button
```
- Shows differences without updating
- Helpful for seeing local modifications

### `init` Command
```bash
memoro-ui init
```
- Creates `components/` directory structure
- Sets up path aliases in tsconfig.json

### `remove` Command
```bash
memoro-ui remove button
```
- Removes component from project
- Warns about dependents

### `sync` Command
```bash
memoro-ui sync
```
- Updates all installed components
- Shows summary of changes

## Comparison to Other Tools

### vs shadcn/ui
- ✅ Same copy-paste philosophy
- ✅ Same registry approach
- ⚠️ React Native instead of React web
- ⚠️ No theme system yet (coming in Phase 2)

### vs NPM Packages
- ✅ No version conflicts
- ✅ Full control over code
- ✅ Better for AI context
- ✅ Customize freely
- ⚠️ Manual updates (but easy with CLI)

## Best Practices

1. **Always use CLI** - Don't copy files manually
2. **Review README** - Each component has usage examples
3. **Test after install** - Verify imports work
4. **Customize freely** - Components are yours, modify as needed
5. **Update intentionally** - Review changes before updating components

## Troubleshooting

### "Component not found"
- Run `memoro-ui list` to see available components
- Check spelling (use kebab-case: `empty-state` not `EmptyState`)

### "Registry not found"
- Ensure you're using the correct path to CLI
- Check that `registry.json` exists in `packages/mobile-ui/`

### "Components copied to wrong location"
- Create `components/` directory first
- CLI will auto-detect it

### Import errors after adding component
- Check import path: `@/components/ui/Button`
- Ensure path alias is configured in tsconfig.json:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./*"]
      }
    }
  }
  ```

## Examples

### Basic Usage

```bash
# List components
node packages/mobile-ui/cli/bin/cli.js list

# Add single component
node packages/mobile-ui/cli/bin/cli.js add button

# Add with auto-confirm
node packages/mobile-ui/cli/bin/cli.js add card -y

# Filter list by category
node packages/mobile-ui/cli/bin/cli.js list -c ui
```

### Building a Form

```bash
# Add all form components
node packages/mobile-ui/cli/bin/cli.js add button -y
node packages/mobile-ui/cli/bin/cli.js add text -y
node packages/mobile-ui/cli/bin/cli.js add card -y
node packages/mobile-ui/cli/bin/cli.js add container -y
```

Then use them:
```tsx
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

function LoginForm() {
  return (
    <Container>
      <Card>
        <Text variant="h2">Login</Text>
        {/* Form fields */}
        <Button title="Sign In" variant="primary" onPress={handleLogin} />
      </Card>
    </Container>
  );
}
```

## Success!

Phase 3 is complete! The CLI tool is fully functional and ready to use. 🎉

**What's working:**
- ✅ List all components with install status
- ✅ Add components with automatic dependency resolution
- ✅ Conflict detection and confirmation prompts
- ✅ Beautiful terminal output with colors and spinners
- ✅ Type-safe TypeScript implementation

**Next steps:**
- Test in picture app (Phase 4)
- Extract to separate repo
- Publish to GitHub Packages
- Add update/diff commands (optional)
