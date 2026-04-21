/**
 * @mana/shared-pwa
 *
 * Unified PWA configuration for all Mana SvelteKit apps.
 * Provides factory functions, presets, and defaults for consistent PWA setup.
 *
 * @example
 * ```ts
 * import { createPWAConfig } from '@mana/shared-pwa';
 * import { SvelteKitPWA } from '@vite-pwa/sveltekit';
 *
 * export default defineConfig({
 *   plugins: [
 *     sveltekit(),
 *     SvelteKitPWA(createPWAConfig({
 *       name: 'My App',
 *       shortName: 'MyApp',
 *       description: 'My awesome app',
 *       themeColor: '#3b82f6',
 *     })),
 *   ],
 * });
 * ```
 */

// Main factory functions
export { createPWAConfig, createOfflineFirstPWAConfig } from './config.js';

// Presets and cache strategies
export { getPresetRuntimeCaching, cacheStrategies } from './presets.js';

// Default values
export {
	DEFAULT_BACKGROUND_COLOR,
	DEFAULT_CATEGORIES,
	DEFAULT_INCLUDE_ASSETS,
	DEFAULT_GLOB_PATTERNS,
	DEFAULT_GLOB_IGNORES,
	DEFAULT_NAVIGATE_FALLBACK_DENYLIST,
	DEFAULT_ICONS,
	APPLE_TOUCH_ICON,
} from './defaults.js';

// Types
export type {
	PWAConfigOptions,
	PWAConfig,
	PWAShortcut,
	PWAShareTarget,
	PWAShareTargetParams,
	WorkboxPreset,
	ManifestConfig,
	ManifestIcon,
	WorkboxConfig,
} from './types.js';
