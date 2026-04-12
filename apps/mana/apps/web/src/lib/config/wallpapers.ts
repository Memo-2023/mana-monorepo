/**
 * Predefined Wallpaper Registry
 *
 * Bundled wallpaper images shipped with the app. Each theme variant
 * gets 2–3 curated images. Images live in /static/wallpapers/ as WebP,
 * with thumbnails in /static/wallpapers/thumbs/.
 *
 * Phase 2 will populate actual images — for now this is the registry structure.
 */

import type { ThemeVariant, WallpaperGradient } from '@mana/shared-theme';

export interface PredefinedWallpaper {
	id: string;
	/** Theme variant this wallpaper was designed for (shown first in that theme). */
	variant: ThemeVariant;
	/** Full-size image URL (1920×1080 WebP). */
	url: string;
	/** Thumbnail URL (320×180 WebP) for the picker grid. */
	thumbUrl: string;
	/** Display label in the picker. */
	label: string;
}

/**
 * All predefined wallpapers. Will be populated in Phase 2 with actual images.
 * For now, the array is empty so the system works end-to-end without images.
 */
export const PREDEFINED_WALLPAPERS: PredefinedWallpaper[] = [
	// Phase 2: add entries like:
	// { id: 'ocean-1', variant: 'ocean', url: '/wallpapers/ocean-1.webp', thumbUrl: '/wallpapers/thumbs/ocean-1.webp', label: 'Ocean Waves' },
];

/**
 * Look up a predefined wallpaper by ID.
 */
export function getPredefinedWallpaper(id: string): PredefinedWallpaper | undefined {
	return PREDEFINED_WALLPAPERS.find((w) => w.id === id);
}

/**
 * Get predefined wallpapers for a specific theme variant.
 */
export function getWallpapersForVariant(variant: ThemeVariant): PredefinedWallpaper[] {
	return PREDEFINED_WALLPAPERS.filter((w) => w.variant === variant);
}

/**
 * Theme-aware gradient presets. Each variant gets a few curated gradients
 * that complement its color palette.
 */
export const GRADIENT_PRESETS: Record<ThemeVariant, WallpaperGradient[]> = {
	ocean: [
		{ type: 'gradient', colors: ['#0f0c29', '#302b63', '#24243e'], angle: 180 },
		{ type: 'gradient', colors: ['#005c97', '#363795'], angle: 135 },
	],
	lume: [
		{ type: 'gradient', colors: ['#ffecd2', '#fcb69f'], angle: 135 },
		{ type: 'gradient', colors: ['#f5f7fa', '#c3cfe2'], angle: 180 },
	],
	nature: [
		{ type: 'gradient', colors: ['#134e5e', '#71b280'], angle: 180 },
		{ type: 'gradient', colors: ['#0b8793', '#360033'], angle: 135 },
	],
	stone: [
		{ type: 'gradient', colors: ['#3e3e3e', '#1a1a1a'], angle: 180 },
		{ type: 'gradient', colors: ['#bdc3c7', '#2c3e50'], angle: 135 },
	],
	sunset: [
		{ type: 'gradient', colors: ['#ff6b6b', '#feca57', '#48dbfb'], angle: 135 },
		{ type: 'gradient', colors: ['#f12711', '#f5af19'], angle: 180 },
	],
	midnight: [
		{ type: 'gradient', colors: ['#0f2027', '#203a43', '#2c5364'], angle: 180 },
		{ type: 'gradient', colors: ['#141e30', '#243b55'], angle: 135 },
	],
	rose: [
		{ type: 'gradient', colors: ['#fbc2eb', '#a6c1ee'], angle: 135 },
		{ type: 'gradient', colors: ['#ee9ca7', '#ffdde1'], angle: 180 },
	],
	lavender: [
		{ type: 'gradient', colors: ['#667eea', '#764ba2'], angle: 135 },
		{ type: 'gradient', colors: ['#a18cd1', '#fbc2eb'], angle: 180 },
	],
};
