/**
 * Spiral-DB Wallpaper Generation
 *
 * Creates device wallpapers from SpiralDB images using @manacore/wallpaper-generator.
 */

import type { SpiralImage } from './types.js';
import type {
	WallpaperOptions,
	WallpaperResult,
	DeviceOption,
	Layout,
	Background,
} from '@manacore/wallpaper-generator';
import {
	createWallpaperGenerator,
	DEFAULT_CENTER_LAYOUT,
	DEFAULT_BACKGROUND,
} from '@manacore/wallpaper-generator';
import { exportToDataUrl } from './png.js';

/** Options for Spiral wallpaper generation */
export interface SpiralWallpaperOptions {
	/** Target device (preset ID like 'iphone-15-pro-max' or custom dimensions) */
	device: DeviceOption;
	/** Layout configuration (default: center) */
	layout?: Layout;
	/** Background configuration (default: dark gradient) */
	background?: Background;
	/** Scale factor for the spiral image (default: 10 for crisp pixel art) */
	scale?: number;
	/** Output format (default: 'png') */
	format?: 'png' | 'jpeg';
	/** JPEG quality 0-100 (default: 90) */
	quality?: number;
}

const DEFAULT_SPIRAL_WALLPAPER_OPTIONS: Partial<SpiralWallpaperOptions> = {
	layout: DEFAULT_CENTER_LAYOUT,
	background: DEFAULT_BACKGROUND,
	scale: 10,
	format: 'png',
	quality: 90,
};

/**
 * Generate a device wallpaper from a SpiralDB image.
 *
 * @param image - SpiralDB image
 * @param options - Wallpaper generation options
 * @returns Promise with wallpaper result
 *
 * @example
 * ```ts
 * import { SpiralDB, createTodoSchema } from '@manacore/spiral-db';
 * import { toWallpaper } from '@manacore/spiral-db/wallpaper';
 *
 * const db = new SpiralDB({ schema: createTodoSchema() });
 * db.insert({ title: 'My Todo', ... });
 *
 * const image = db.getImage();
 * const result = await toWallpaper(image, {
 *   device: 'iphone-15-pro-max',
 *   layout: { type: 'corner', position: 'bottom-right', scale: 0.3 },
 *   background: { type: 'gradient', colors: ['#0f0f23', '#1a1a2e'] },
 * });
 *
 * // result.dataUrl contains the wallpaper as data URL
 * ```
 */
export async function toWallpaper(
	image: SpiralImage,
	options: SpiralWallpaperOptions
): Promise<WallpaperResult> {
	const opts = { ...DEFAULT_SPIRAL_WALLPAPER_OPTIONS, ...options };

	// Convert spiral image to data URL
	const dataUrl = exportToDataUrl(image);

	// Create wallpaper generator
	const generator = createWallpaperGenerator();

	// Apply scale to layout
	const layoutConfig = opts.layout ?? DEFAULT_CENTER_LAYOUT;
	const scaleValue = opts.scale ?? 10;
	const layout = applyScaleToLayout(layoutConfig, scaleValue);

	// Generate wallpaper
	const wallpaperOptions: WallpaperOptions = {
		device: opts.device,
		layout,
		background: opts.background ?? DEFAULT_BACKGROUND,
		format: opts.format,
		quality: opts.quality,
	};

	return generator.generate({ type: 'dataUrl', data: dataUrl }, wallpaperOptions);
}

/**
 * Generate a preview of the Spiral wallpaper (smaller, faster).
 *
 * @param image - SpiralDB image
 * @param options - Wallpaper generation options
 * @returns Promise with preview data URL
 */
export async function toWallpaperPreview(
	image: SpiralImage,
	options: SpiralWallpaperOptions
): Promise<string> {
	const opts = { ...DEFAULT_SPIRAL_WALLPAPER_OPTIONS, ...options };

	// Convert spiral image to data URL
	const dataUrl = exportToDataUrl(image);

	const generator = createWallpaperGenerator();

	// Apply scale to layout (reduced for preview)
	const layoutConfig = opts.layout ?? DEFAULT_CENTER_LAYOUT;
	const scaleValue = opts.scale ?? 10;
	const layout = applyScaleToLayout(layoutConfig, scaleValue * 0.5);

	const wallpaperOptions: WallpaperOptions = {
		device: opts.device,
		layout,
		background: opts.background ?? DEFAULT_BACKGROUND,
	};

	return generator.preview({ type: 'dataUrl', data: dataUrl }, wallpaperOptions);
}

/**
 * Apply scale factor to layout
 * For spiral images which are typically small (e.g., 11x11 pixels),
 * we multiply the scale to make them visible on wallpapers.
 */
function applyScaleToLayout(layout: Layout, scale: number): Layout {
	switch (layout.type) {
		case 'center':
			return {
				...layout,
				scale: (layout.scale ?? 1.0) * scale,
			};
		case 'corner':
			return {
				...layout,
				scale: (layout.scale ?? 0.3) * scale,
			};
		case 'pattern':
			return {
				...layout,
				scale: (layout.scale ?? 0.5) * scale,
			};
		default:
			return layout;
	}
}
