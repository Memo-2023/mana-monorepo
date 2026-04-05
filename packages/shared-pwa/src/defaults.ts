/**
 * Default PWA Configuration Values
 */

import type { ManifestIcon } from './types.js';

/**
 * Default dark background color for Mana apps
 */
export const DEFAULT_BACKGROUND_COLOR = '#09090b';

/**
 * Default app categories
 */
export const DEFAULT_CATEGORIES = ['productivity', 'utilities'];

/**
 * Default assets to include in PWA
 */
export const DEFAULT_INCLUDE_ASSETS = ['favicon.svg'];

/**
 * Default glob patterns for precaching
 */
export const DEFAULT_GLOB_PATTERNS = ['**/*.{js,css,html,ico,png,svg,woff,woff2}'];

/**
 * Default URL patterns to exclude from navigate fallback
 */
export const DEFAULT_NAVIGATE_FALLBACK_DENYLIST = [/^\/api/, /^\/auth/];

/**
 * Default glob ignores (SQLite WASM for offline-first apps)
 */
export const DEFAULT_GLOB_IGNORES = ['**/*sqlite*'];

/**
 * Standard PWA icon configuration
 */
export const DEFAULT_ICONS: ManifestIcon[] = [
	{
		src: 'pwa-192x192.png',
		sizes: '192x192',
		type: 'image/png',
	},
	{
		src: 'pwa-512x512.png',
		sizes: '512x512',
		type: 'image/png',
	},
	{
		src: 'pwa-512x512.png',
		sizes: '512x512',
		type: 'image/png',
		purpose: 'maskable',
	},
];

/**
 * Apple touch icon configuration
 */
export const APPLE_TOUCH_ICON = {
	src: 'apple-touch-icon.png',
	sizes: '180x180',
	type: 'image/png',
};
