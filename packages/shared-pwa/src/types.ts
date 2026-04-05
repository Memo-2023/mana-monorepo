/**
 * PWA Configuration Types for Mana Apps
 */

import type { SvelteKitPWAOptions } from '@vite-pwa/sveltekit';
import type { RuntimeCaching } from 'workbox-build';

/**
 * Workbox preset types for different caching strategies
 */
export type WorkboxPreset = 'minimal' | 'standard' | 'full';

/**
 * PWA manifest shortcut
 */
export interface PWAShortcut {
	name: string;
	short_name?: string;
	description?: string;
	url: string;
}

/**
 * Configuration options for createPWAConfig
 */
export interface PWAConfigOptions {
	/**
	 * Full name of the app (displayed in install prompts, app switcher)
	 * @example "Calendar - Kalender"
	 */
	name: string;

	/**
	 * Short name for home screen icons (max ~12 chars)
	 * @example "Calendar"
	 */
	shortName: string;

	/**
	 * App description for store listings
	 */
	description: string;

	/**
	 * Primary theme color (address bar, splash screen)
	 * @example "#3b82f6"
	 */
	themeColor: string;

	/**
	 * Background color for splash screen
	 * @default "#09090b"
	 */
	backgroundColor?: string;

	/**
	 * Workbox caching preset
	 * - minimal: Only static assets (simple apps without API)
	 * - standard: + API (NetworkFirst) + Images (CacheFirst)
	 * - full: + Fonts + External Resources
	 * @default "standard"
	 */
	preset?: WorkboxPreset;

	/**
	 * App shortcuts for quick actions
	 */
	shortcuts?: PWAShortcut[];

	/**
	 * App categories for store listings
	 * @default ["productivity", "utilities"]
	 */
	categories?: string[];

	/**
	 * Additional assets to include (besides default icons)
	 */
	includeAssets?: string[];

	/**
	 * Additional glob patterns to ignore in precaching
	 */
	globIgnores?: string[];

	/**
	 * Additional runtime caching rules
	 */
	additionalRuntimeCaching?: RuntimeCaching[];

	/**
	 * Custom navigate fallback path
	 * @default "/offline"
	 */
	navigateFallback?: string;

	/**
	 * URL patterns to exclude from navigate fallback
	 * @default [/^\/api/, /^\/auth/]
	 */
	navigateFallbackDenylist?: RegExp[];

	/**
	 * Enable PWA in development mode
	 * @default true
	 */
	devEnabled?: boolean;

	/**
	 * Service worker register type
	 * @default "autoUpdate"
	 */
	registerType?: 'autoUpdate' | 'prompt';

	/**
	 * App language
	 * @default "de"
	 */
	lang?: string;

	/**
	 * Start URL when app is launched
	 * @default "/"
	 */
	startUrl?: string;
}

/**
 * Internal manifest icon configuration
 */
export interface ManifestIcon {
	src: string;
	sizes: string;
	type: string;
	purpose?: 'any' | 'maskable' | 'monochrome';
}

/**
 * Full manifest configuration
 */
export interface ManifestConfig {
	name: string;
	short_name: string;
	description: string;
	theme_color: string;
	background_color: string;
	display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
	orientation: 'any' | 'portrait' | 'landscape';
	scope: string;
	start_url: string;
	lang: string;
	categories: string[];
	icons: ManifestIcon[];
	shortcuts?: Array<{
		name: string;
		short_name?: string;
		description?: string;
		url: string;
		icons?: Array<{ src: string; sizes: string }>;
	}>;
}

/**
 * Workbox configuration subset
 */
export interface WorkboxConfig {
	globPatterns: string[];
	globIgnores?: string[];
	cleanupOutdatedCaches: boolean;
	clientsClaim: boolean;
	skipWaiting: boolean;
	navigateFallback: string;
	navigateFallbackDenylist: RegExp[];
	runtimeCaching: RuntimeCaching[];
	maximumFileSizeToCacheInBytes?: number;
}

/**
 * Complete PWA configuration result
 */
export type PWAConfig = SvelteKitPWAOptions;
