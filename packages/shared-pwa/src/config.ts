/**
 * PWA Configuration Factory
 *
 * Creates a complete @vite-pwa/sveltekit configuration with sensible defaults
 * and preset-based caching strategies.
 *
 * @example
 * ```ts
 * import { createPWAConfig } from '@manacore/shared-pwa';
 * import { SvelteKitPWA } from '@vite-pwa/sveltekit';
 *
 * export default defineConfig({
 *   plugins: [
 *     sveltekit(),
 *     SvelteKitPWA(createPWAConfig({
 *       name: 'Calendar - Kalender',
 *       shortName: 'Calendar',
 *       description: 'Kalender mit Offline-Unterstützung',
 *       themeColor: '#3b82f6',
 *       preset: 'standard',
 *     })),
 *   ],
 * });
 * ```
 */

import type { PWAConfigOptions, PWAConfig, ManifestConfig, WorkboxConfig } from './types.js';
import {
	DEFAULT_BACKGROUND_COLOR,
	DEFAULT_CATEGORIES,
	DEFAULT_INCLUDE_ASSETS,
	DEFAULT_GLOB_PATTERNS,
	DEFAULT_GLOB_IGNORES,
	DEFAULT_NAVIGATE_FALLBACK_DENYLIST,
	DEFAULT_ICONS,
} from './defaults.js';
import { getPresetRuntimeCaching } from './presets.js';

/**
 * Create a complete PWA configuration for SvelteKit apps
 */
export function createPWAConfig(options: PWAConfigOptions): PWAConfig {
	const {
		name,
		shortName,
		description,
		themeColor,
		backgroundColor = DEFAULT_BACKGROUND_COLOR,
		preset = 'standard',
		shortcuts = [],
		categories = DEFAULT_CATEGORIES,
		includeAssets = [],
		globIgnores = [],
		additionalRuntimeCaching = [],
		navigateFallback = '/offline',
		navigateFallbackDenylist = DEFAULT_NAVIGATE_FALLBACK_DENYLIST,
		devEnabled = true,
		registerType = 'autoUpdate',
		lang = 'de',
		startUrl = '/',
	} = options;

	// Build manifest
	const manifest: ManifestConfig = {
		name,
		short_name: shortName,
		description,
		theme_color: themeColor,
		background_color: backgroundColor,
		display: 'standalone',
		orientation: 'any',
		scope: '/',
		start_url: startUrl,
		lang,
		categories,
		icons: DEFAULT_ICONS,
	};

	// Add shortcuts if provided
	if (shortcuts.length > 0) {
		manifest.shortcuts = shortcuts.map((shortcut) => ({
			name: shortcut.name,
			short_name: shortcut.short_name,
			description: shortcut.description,
			url: shortcut.url,
			icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
		}));
	}

	// Build workbox config
	const workbox: WorkboxConfig = {
		globPatterns: DEFAULT_GLOB_PATTERNS,
		globIgnores: [...DEFAULT_GLOB_IGNORES, ...globIgnores],
		cleanupOutdatedCaches: true,
		clientsClaim: true,
		skipWaiting: true,
		navigateFallback,
		navigateFallbackDenylist,
		runtimeCaching: [...getPresetRuntimeCaching(preset), ...additionalRuntimeCaching],
	};

	// Return complete config
	return {
		registerType,
		devOptions: {
			enabled: devEnabled,
		},
		includeAssets: [...DEFAULT_INCLUDE_ASSETS, ...includeAssets],
		manifest,
		workbox,
	};
}

/**
 * Create PWA config with SQLite WASM support (for offline-first apps)
 * Adds proper glob ignores and OPFS configuration
 */
export function createOfflineFirstPWAConfig(
	options: PWAConfigOptions & {
		/**
		 * Additional packages to exclude from precaching
		 */
		excludePackages?: string[];
	}
): PWAConfig {
	const { excludePackages = [], globIgnores = [], ...rest } = options;

	// Add SQLite-specific ignores
	const allGlobIgnores = ['**/*sqlite*', '**/*wasm*', ...excludePackages.map((pkg) => `**/${pkg}/**`), ...globIgnores];

	return createPWAConfig({
		...rest,
		globIgnores: allGlobIgnores,
	});
}
