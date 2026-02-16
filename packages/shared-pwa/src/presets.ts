/**
 * Workbox Runtime Caching Presets
 *
 * Provides pre-configured caching strategies for different app types:
 * - minimal: Static assets only
 * - standard: + API + Images
 * - full: + Fonts + External resources
 */

import type { RuntimeCaching } from 'workbox-build';
import type { WorkboxPreset } from './types.js';

/**
 * API caching strategy - NetworkFirst with fallback
 * Used for all *.mana.how API endpoints
 */
const API_CACHE: RuntimeCaching = {
	urlPattern: /^https:\/\/.*\.mana\.how\/api\/.*/i,
	handler: 'NetworkFirst',
	options: {
		cacheName: 'api-cache',
		expiration: {
			maxEntries: 100,
			maxAgeSeconds: 60 * 60 * 24, // 24 hours
		},
		cacheableResponse: {
			statuses: [0, 200],
		},
	},
};

/**
 * Image caching strategy - CacheFirst for performance
 * Caches images for 30 days
 */
const IMAGE_CACHE: RuntimeCaching = {
	urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
	handler: 'CacheFirst',
	options: {
		cacheName: 'image-cache',
		expiration: {
			maxEntries: 200,
			maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
		},
	},
};

/**
 * Font caching strategy - CacheFirst with long expiration
 * For Google Fonts and other web fonts
 */
const FONT_CACHE: RuntimeCaching = {
	urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
	handler: 'CacheFirst',
	options: {
		cacheName: 'font-cache',
		expiration: {
			maxEntries: 30,
			maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
		},
		cacheableResponse: {
			statuses: [0, 200],
		},
	},
};

/**
 * External resources caching - StaleWhileRevalidate
 * For CDN resources and external APIs
 */
const EXTERNAL_CACHE: RuntimeCaching = {
	urlPattern: /^https:\/\/cdn\..*/i,
	handler: 'StaleWhileRevalidate',
	options: {
		cacheName: 'external-cache',
		expiration: {
			maxEntries: 50,
			maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
		},
		cacheableResponse: {
			statuses: [0, 200],
		},
	},
};

/**
 * Preset configurations for different caching strategies
 */
const PRESETS: Record<WorkboxPreset, RuntimeCaching[]> = {
	/**
	 * Minimal preset - Only static assets (precached)
	 * Use for simple apps without API calls
	 */
	minimal: [],

	/**
	 * Standard preset - Static + API + Images
	 * Recommended for most apps
	 */
	standard: [API_CACHE, IMAGE_CACHE],

	/**
	 * Full preset - Standard + Fonts + External resources
	 * Use for apps with custom fonts or external CDN resources
	 */
	full: [API_CACHE, IMAGE_CACHE, FONT_CACHE, EXTERNAL_CACHE],
};

/**
 * Get runtime caching rules for a preset
 */
export function getPresetRuntimeCaching(preset: WorkboxPreset): RuntimeCaching[] {
	return PRESETS[preset] ?? PRESETS.standard;
}

/**
 * Export individual cache strategies for custom configurations
 */
export const cacheStrategies = {
	api: API_CACHE,
	images: IMAGE_CACHE,
	fonts: FONT_CACHE,
	external: EXTERNAL_CACHE,
};
