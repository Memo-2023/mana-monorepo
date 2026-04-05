/**
 * @mana/wallpaper-generator
 *
 * Device wallpaper generator from QR codes, Spiral-DB images, and other sources.
 * Supports both browser (Canvas) and Node.js (Sharp) environments.
 *
 * @example Browser usage:
 * ```ts
 * import { createWallpaperGenerator } from '@mana/wallpaper-generator';
 *
 * const generator = createWallpaperGenerator();
 *
 * const result = await generator.generate(
 *   { type: 'dataUrl', data: qrCodeDataUrl },
 *   {
 *     device: 'iphone-15-pro-max',
 *     layout: { type: 'center', scale: 0.8 },
 *     background: { type: 'gradient', colors: ['#1a1a2e', '#16213e'] },
 *   }
 * );
 *
 * // Download the wallpaper
 * downloadWallpaper(result, 'my-wallpaper.png');
 * ```
 *
 * @example Node.js usage:
 * ```ts
 * import { createWallpaperGenerator, saveWallpaperToFile } from '@mana/wallpaper-generator';
 *
 * const generator = createWallpaperGenerator();
 *
 * const result = await generator.generate(
 *   { type: 'dataUrl', data: imageDataUrl },
 *   {
 *     device: 'desktop-4k',
 *     layout: { type: 'corner', position: 'bottom-right', scale: 0.2 },
 *     background: { type: 'solid', color: '#0f0f23' },
 *   }
 * );
 *
 * await saveWallpaperToFile(result, './wallpaper.png');
 * ```
 */

// Types
export type {
	// Image Sources
	ImageSource,
	DataUrlSource,
	CanvasSource,
	BufferSource,
	// Device Presets
	DevicePreset,
	DeviceCategory,
	CustomDevice,
	DeviceOption,
	// Layouts
	Layout,
	CenterLayout,
	CornerLayout,
	PatternLayout,
	CornerPosition,
	// Backgrounds
	Background,
	SolidBackground,
	GradientBackground,
	// Options & Results
	WallpaperOptions,
	WallpaperResult,
	OutputFormat,
	// Generator Interface
	WallpaperGenerator,
	// Svelte Props
	WallpaperModalProps,
} from './types.js';

// Constants
export {
	DEFAULT_CENTER_LAYOUT,
	DEFAULT_CORNER_LAYOUT,
	DEFAULT_PATTERN_LAYOUT,
	DEFAULT_BACKGROUND,
	GRADIENT_PRESETS,
} from './types.js';

// Device Presets
export {
	PHONE_PRESETS,
	TABLET_PRESETS,
	DESKTOP_PRESETS,
	ALL_DEVICE_PRESETS,
	getDevicePreset,
	getPresetsByCategory,
	getRecommendedPresets,
} from './presets/index.js';

// Renderers
export {
	createBrowserGenerator,
	downloadWallpaper,
	copyWallpaperToClipboard,
} from './renderers/browser.js';
export { createNodeGenerator, saveWallpaperToFile } from './renderers/node.js';

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

import type { WallpaperGenerator } from './types.js';
import { createBrowserGenerator } from './renderers/browser.js';
import { createNodeGenerator } from './renderers/node.js';

/**
 * Detect if running in browser environment
 */
function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Create a wallpaper generator appropriate for the current environment.
 *
 * - In browser: Uses Canvas API
 * - In Node.js: Uses Sharp
 *
 * @param options - Optional configuration
 * @param options.preferNode - Force Node.js renderer even in browser (requires Sharp)
 * @returns WallpaperGenerator instance
 */
export function createWallpaperGenerator(options?: { preferNode?: boolean }): WallpaperGenerator {
	if (options?.preferNode) {
		return createNodeGenerator();
	}

	if (isBrowser()) {
		return createBrowserGenerator();
	}

	return createNodeGenerator();
}
