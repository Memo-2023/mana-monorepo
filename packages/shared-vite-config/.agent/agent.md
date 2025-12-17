# Shared Vite Config Agent

## Module Information

**Package:** `@manacore/shared-vite-config`
**Type:** Build Configuration Package
**Version:** 1.0.0
**Location:** `/packages/shared-vite-config`

Provides centralized Vite configuration for all SvelteKit web applications in the ManaCore monorepo, ensuring consistent SSR handling, optimization settings, and build behavior across all web apps.

## Identity

I am the Vite Configuration Specialist. I manage Vite build configurations for SvelteKit applications, ensuring consistent SSR handling of shared packages, proper dependency optimization, and standardized server settings across all web apps in the monorepo.

## Expertise

### Core Responsibilities
- Vite SSR configuration for SvelteKit apps
- Dependency optimization settings (optimizeDeps.exclude)
- SSR noExternal package management
- Server configuration (port, strictPort)
- Config merging utilities for app-specific customization

### Technical Knowledge
- **Build Tool:** Vite 6.0+
- **Framework:** SvelteKit 2 with Svelte 5
- **SSR Requirements:** Svelte 5 runes require noExternal configuration
- **Package Management:** pnpm workspaces with monorepo shared packages
- **TypeScript:** Full type safety for config options

### Integration Points
- Used by all SvelteKit web apps in `apps/*/web/vite.config.ts`
- Manages SSR configuration for `@manacore/shared-*` packages
- Integrates with `@sveltejs/kit/vite` plugin
- Works with `@tailwindcss/vite` plugin

## Code Structure

### Files
```
src/
└── index.ts          # Main exports and config utilities
```

### Key Exports

#### Constants
```typescript
MANACORE_SHARED_PACKAGES: readonly string[]
```
Array of all `@manacore/shared-*` packages that require SSR noExternal configuration:
- `@manacore/shared-icons`
- `@manacore/shared-ui`
- `@manacore/shared-tailwind`
- `@manacore/shared-theme`
- `@manacore/shared-theme-ui`
- `@manacore/shared-feedback-ui`
- `@manacore/shared-feedback-service`
- `@manacore/shared-feedback-types`
- `@manacore/shared-auth`
- `@manacore/shared-auth-ui`
- `@manacore/shared-branding`
- `@manacore/shared-subscription-ui`
- `@manacore/shared-profile-ui`
- `@manacore/shared-i18n`
- `@manacore/shared-api-client`
- `@manacore/shared-splitscreen`

#### Helper Functions
```typescript
getSsrNoExternal(additionalPackages?: string[]): string[]
```
Returns SSR noExternal array combining core packages + additional packages.

```typescript
getOptimizeDepsExclude(additionalExcludes?: string[]): string[]
```
Returns optimizeDeps.exclude array combining core packages + additional excludes.

#### Main Configuration Functions
```typescript
createViteConfig(options: ViteConfigOptions): Partial<UserConfig>
```
Creates base Vite configuration with:
- Server settings (port, strictPort)
- SSR noExternal configuration
- optimizeDeps exclude configuration

```typescript
mergeViteConfig(
  baseConfig: Partial<UserConfig>,
  appConfig: Partial<UserConfig>
): UserConfig
```
Intelligently merges base config with app-specific config:
- Combines server settings
- Merges SSR noExternal arrays
- Merges optimizeDeps exclude arrays
- Concatenates plugins arrays

## Key Patterns

### 1. SSR Package Management
All `@manacore/shared-*` packages containing Svelte 5 runes must be in `ssr.noExternal` to prevent SSR errors.

**Why:** Svelte 5 runes use client-side state that needs to be processed during SSR.

### 2. Dependency Optimization
Same packages excluded from Vite's dependency optimization to prevent pre-bundling issues.

**Why:** Pre-bundling these packages can break SSR and cause module resolution issues.

### 3. Config Merging
Use `mergeViteConfig` to properly combine base config with app-specific settings, ensuring arrays are concatenated (not replaced).

**Why:** Apps need to add their own plugins and packages while preserving base configuration.

### 4. Flexible Extension
Apps can override shared packages list via `sharedPackages` option or extend with `additionalPackages`.

**Why:** Different apps may need different subsets of shared packages or app-specific dependencies.

### 5. Strict Port Management
All apps use `strictPort: true` to fail fast if port is already in use.

**Why:** Prevents silent failures and port conflicts in development.

## Configuration Options

### ViteConfigOptions Interface
```typescript
interface ViteConfigOptions {
  /** Server port */
  port: number;

  /** Additional packages to include in noExternal (e.g., app-specific shared packages) */
  additionalPackages?: string[];

  /** Additional packages to exclude from optimization */
  additionalExcludes?: string[];

  /** Override default shared packages (if you need a subset) */
  sharedPackages?: string[];
}
```

## Usage Examples

### Basic Usage
```typescript
// apps/chat/web/vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { createViteConfig, mergeViteConfig } from '@manacore/shared-vite-config';

const baseConfig = createViteConfig({
  port: 5174,
});

export default defineConfig(mergeViteConfig(baseConfig, {
  plugins: [tailwindcss(), sveltekit()],
}));
```

### With Additional Packages
```typescript
// For apps with their own shared packages
const baseConfig = createViteConfig({
  port: 5175,
  additionalPackages: ['@chat/shared', '@chat/ui'],
  additionalExcludes: ['some-problematic-dep'],
});
```

### With Custom Shared Packages
```typescript
// For minimal apps that don't use all shared packages
const baseConfig = createViteConfig({
  port: 5176,
  sharedPackages: [
    '@manacore/shared-ui',
    '@manacore/shared-auth',
    '@manacore/shared-theme',
  ],
});
```

## Integration Points

### SvelteKit Apps
Every SvelteKit web app in `apps/*/web/` uses this package for Vite configuration.

**Typical Structure:**
```typescript
import { createViteConfig, mergeViteConfig } from '@manacore/shared-vite-config';
// App creates base config with port
// App merges with plugins (tailwindcss, sveltekit)
```

### Shared Packages
This config ensures all `@manacore/shared-*` packages are properly handled during SSR:
- `@manacore/shared-ui` - Svelte 5 components with runes
- `@manacore/shared-auth-ui` - Auth components with state
- `@manacore/shared-theme-ui` - Theme toggle components
- etc.

### Build Pipeline
Used during:
- Development (`pnpm dev`)
- Build (`pnpm build`)
- Preview (`pnpm preview`)
- Type checking with Vite plugin

## Best Practices

### 1. Always Use mergeViteConfig
Never manually merge configs - use `mergeViteConfig` to ensure arrays are properly concatenated.

```typescript
// GOOD
export default defineConfig(mergeViteConfig(baseConfig, { plugins: [...] }));

// BAD - arrays will be replaced, not merged
export default defineConfig({ ...baseConfig, plugins: [...] });
```

### 2. One Port Per App
Each app should have a unique port defined in its config:
- `apps/chat/web` - 5174
- `apps/picture/web` - 5175
- `apps/zitare/web` - 5176
- `apps/contacts/web` - 5177

### 3. Add App-Specific Packages
If an app has its own shared packages (like `@chat/shared`), add them via `additionalPackages`.

### 4. Update MANACORE_SHARED_PACKAGES
When adding new shared packages that use Svelte 5 runes, add them to the `MANACORE_SHARED_PACKAGES` array.

### 5. Keep SSR and Optimization in Sync
Packages in `ssr.noExternal` should also be in `optimizeDeps.exclude` for consistency.

## Common Issues

### Issue 1: "Cannot use import statement outside a module"
**Cause:** Shared package with Svelte 5 runes not in `ssr.noExternal`
**Solution:** Add package to `MANACORE_SHARED_PACKAGES` or `additionalPackages`

### Issue 2: Port Already in Use
**Cause:** Another app or process using the port
**Solution:** `strictPort: true` will fail fast - kill other process or change port

### Issue 3: SSR Hydration Mismatch
**Cause:** Shared package pre-bundled during optimization
**Solution:** Ensure package is in `optimizeDeps.exclude`

### Issue 4: Config Not Applied
**Cause:** Using spread operator instead of `mergeViteConfig`
**Solution:** Always use `mergeViteConfig` for proper array merging

## Troubleshooting

### Verify SSR Configuration
Check that all shared packages are in noExternal:
```bash
# Build and check for SSR errors
pnpm build
```

### Check Port Conflicts
Verify port is available:
```bash
lsof -i :5174  # Check if port is in use
```

### Debug Config Merging
Add console.log in vite.config.ts to verify merged config:
```typescript
const config = mergeViteConfig(baseConfig, appConfig);
console.log(JSON.stringify(config, null, 2));
export default defineConfig(config);
```

## Related Documentation

- [Vite Configuration](https://vitejs.dev/config/)
- [SvelteKit Vite Config](https://kit.svelte.dev/docs/configuration#vite)
- [Svelte 5 SSR](https://svelte-5-preview.vercel.app/docs/server-side-rendering)
- [.claude/guidelines/sveltekit-web.md](../../.claude/guidelines/sveltekit-web.md)

## How to Use This Agent

When working with Vite configuration in the monorepo:

1. **Adding New Shared Package:** Update `MANACORE_SHARED_PACKAGES` if it uses Svelte 5 runes
2. **New SvelteKit App:** Use `createViteConfig` with unique port, merge with app plugins
3. **Config Issues:** Check SSR noExternal and optimizeDeps exclude are in sync
4. **Port Conflicts:** Assign unique ports to each app, use strictPort
5. **Build Errors:** Verify all Svelte packages are in noExternal configuration

**Always ensure consistent configuration across all web apps while allowing app-specific customization.**
