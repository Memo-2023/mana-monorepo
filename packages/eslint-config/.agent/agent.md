# ESLint Config Agent

## Module Information

**Name:** @manacore/eslint-config
**Path:** packages/eslint-config
**Description:** Shared ESLint configuration for Manacore monorepo
**Tech Stack:** ESLint 9 (flat config), TypeScript ESLint, Prettier
**Dependencies:**
- @eslint/js ^9.39.1
- eslint-config-prettier ^10.1.8
- eslint-plugin-prettier ^5.5.4
- eslint-plugin-react ^7.37.5
- eslint-plugin-react-hooks ^5.1.0
- eslint-plugin-svelte ^3.12.4
- globals ^16.5.0
- typescript-eslint ^8.48.1

**Peer Dependencies:**
- eslint ^9.0.0
- prettier ^3.0.0
- typescript ^5.0.0

## Identity

I am the ESLint Config Agent. I provide standardized ESLint configurations for all projects in the ManaCore monorepo. My purpose is to ensure consistent code style, catch common errors, and integrate seamlessly with Prettier across different project types (NestJS backends, SvelteKit web apps, Expo mobile apps, Astro landing pages, and TypeScript packages).

I use ESLint's modern flat config format and provide modular, composable configurations that can be mixed and matched based on project requirements.

## Expertise

I specialize in:

### Composable Configurations
- Base JavaScript rules for all projects
- TypeScript-specific rules and type-aware linting
- Svelte-specific rules for SvelteKit apps
- React-specific rules for Expo mobile apps
- NestJS-specific patterns for backends
- Prettier integration for consistent formatting

### ESLint 9 Flat Config
- Modern flat config format (no extends chains)
- Array-based composition pattern
- Direct plugin imports
- Glob-based file matching

### Framework-Specific Rules
- SvelteKit: Svelte 5 runes mode, accessibility rules
- React: Hooks rules, JSX best practices
- NestJS: Decorator patterns, dependency injection
- TypeScript: Strict type checking, import resolution

## Code Structure

```
packages/eslint-config/
├── index.js        # Main entry point, exports all configs
├── base.js         # Base JavaScript rules
├── typescript.js   # TypeScript rules and parser
├── svelte.js       # Svelte/SvelteKit rules
├── react.js        # React/Expo rules
├── nestjs.js       # NestJS backend rules
└── prettier.js     # Prettier integration
```

### Export Structure

Each file exports a named config array:
- `baseConfig` - Core JavaScript rules
- `typescriptConfig` - TypeScript linting
- `svelteConfig` - Svelte/SvelteKit rules
- `reactConfig` - React/React Native rules
- `nestjsConfig` - NestJS patterns
- `prettierConfig` - Prettier integration

**Default Export:** `[...baseConfig, ...typescriptConfig, ...prettierConfig]` for simple TypeScript packages

## Key Patterns

### 1. Modular Composition
Configs are designed to be composed via array spreading:

```javascript
// SvelteKit web app
import { baseConfig, typescriptConfig, svelteConfig, prettierConfig } from '@manacore/eslint-config';
export default [...baseConfig, ...typescriptConfig, ...svelteConfig, ...prettierConfig];

// NestJS backend
import { baseConfig, typescriptConfig, nestjsConfig, prettierConfig } from '@manacore/eslint-config';
export default [...baseConfig, ...typescriptConfig, ...nestjsConfig, ...prettierConfig];

// Expo mobile
import { baseConfig, typescriptConfig, reactConfig, prettierConfig } from '@manacore/eslint-config';
export default [...baseConfig, ...typescriptConfig, ...reactConfig, ...prettierConfig];
```

### 2. File-Based Ignores
Use glob patterns to exclude common directories:

```javascript
{
  ignores: [
    'dist/**',
    'build/**',
    '.svelte-kit/**',
    'node_modules/**',
    '*.config.js'
  ]
}
```

### 3. Language Options
Each config specifies parser and globals:

```javascript
{
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: './tsconfig.json'
    },
    globals: {
      ...globals.browser,
      ...globals.node
    }
  }
}
```

### 4. Framework Detection
Use file patterns to apply rules selectively:

```javascript
{
  files: ['**/*.svelte'],
  processor: 'svelte/svelte'
},
{
  files: ['**/*.tsx', '**/*.jsx'],
  plugins: { react }
}
```

### 5. Prettier Last
Always apply prettier config last to override formatting rules:

```javascript
export default [
  ...baseConfig,
  ...typescriptConfig,
  ...frameworkConfig,
  ...prettierConfig  // MUST be last
];
```

## Integration Points

### With NestJS Backends
- Allows `@Decorator()` syntax
- Permits parameter properties in constructors
- Understands dependency injection patterns
- Allows empty interfaces for DTOs
- Type-aware linting with project references

### With SvelteKit Web Apps
- Svelte 5 runes mode support
- Accessibility checks (a11y)
- Proper handling of .svelte files
- Script context="module" understanding
- Store reactivity patterns

### With Expo Mobile Apps
- React Hooks rules
- React Native specific globals
- JSX accessibility checks
- Component naming conventions
- Performance best practices

### With TypeScript Packages
- Strict type checking
- Import/export consistency
- No unused variables/imports
- Proper type annotations
- Path alias resolution

### With Prettier
- Turns off all formatting rules
- Integrates as ESLint plugin
- Runs Prettier as linting step
- Ensures consistent formatting

## How to Use

### In a SvelteKit Web App

```javascript
// eslint.config.js
import { baseConfig, typescriptConfig, svelteConfig, prettierConfig } from '@manacore/eslint-config';

export default [
  ...baseConfig,
  ...typescriptConfig,
  ...svelteConfig,
  ...prettierConfig,
  {
    // Project-specific overrides
    rules: {
      // Add any custom rules here
    }
  }
];
```

### In a NestJS Backend

```javascript
// eslint.config.js
import { baseConfig, typescriptConfig, nestjsConfig, prettierConfig } from '@manacore/eslint-config';

export default [
  ...baseConfig,
  ...typescriptConfig,
  ...nestjsConfig,
  ...prettierConfig
];
```

### In an Expo Mobile App

```javascript
// eslint.config.js
import { baseConfig, typescriptConfig, reactConfig, prettierConfig } from '@manacore/eslint-config';

export default [
  ...baseConfig,
  ...typescriptConfig,
  ...reactConfig,
  ...prettierConfig
];
```

### In a TypeScript Package

```javascript
// eslint.config.js
import config from '@manacore/eslint-config';

// Use default export (base + typescript + prettier)
export default config;

// Or compose manually
import { baseConfig, typescriptConfig, prettierConfig } from '@manacore/eslint-config';
export default [...baseConfig, ...typescriptConfig, ...prettierConfig];
```

### Adding Custom Rules

Always add custom rules BEFORE prettier config:

```javascript
export default [
  ...baseConfig,
  ...typescriptConfig,
  ...frameworkConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },
  ...prettierConfig  // MUST be last
];
```

### Troubleshooting

**Type-aware rules failing:**
- Ensure `tsconfig.json` is in project root
- Check `parserOptions.project` path
- Verify TypeScript version compatibility

**Svelte rules not working:**
- Confirm `.svelte` files in glob pattern
- Check Svelte plugin version
- Verify svelte preprocessor config

**React rules not applying:**
- Ensure files match `**/*.tsx` or `**/*.jsx`
- Check React version in package.json
- Verify react-hooks plugin loaded

**Prettier conflicts:**
- Ensure prettierConfig is LAST in array
- Check for conflicting formatting rules
- Verify Prettier version compatibility
