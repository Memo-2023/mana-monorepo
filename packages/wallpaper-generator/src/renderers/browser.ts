/**
 * Browser Renderer
 *
 * Canvas-based wallpaper generation for browser environments.
 */

import type {
	ImageSource,
	WallpaperOptions,
	WallpaperResult,
	WallpaperGenerator,
	DevicePreset,
	DeviceCategory,
	Layout,
	Background,
} from '../types.js';
import { ALL_DEVICE_PRESETS, getDevicePreset, getPresetsByCategory } from '../presets/index.js';
import { fillSolid } from '../backgrounds/solid.js';
import { fillGradient } from '../backgrounds/gradient.js';
import { drawCentered } from '../layouts/center.js';
import { drawCorner } from '../layouts/corner.js';
import { drawPattern } from '../layouts/pattern.js';

// =============================================================================
// IMAGE SOURCE LOADING
// =============================================================================

/**
 * Load image from data URL
 */
async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
		img.src = dataUrl;
	});
}

/**
 * Load image from canvas
 */
function loadImageFromCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
	return canvas;
}

/**
 * Load image from buffer (convert to canvas)
 */
function loadImageFromBuffer(
	buffer: Uint8Array,
	width: number,
	height: number,
	channels: 3 | 4 = 4
): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Failed to get canvas context');

	const imageData = ctx.createImageData(width, height);

	if (channels === 4) {
		// RGBA - direct copy
		imageData.data.set(buffer);
	} else {
		// RGB - need to add alpha channel
		for (let i = 0; i < width * height; i++) {
			imageData.data[i * 4] = buffer[i * 3];
			imageData.data[i * 4 + 1] = buffer[i * 3 + 1];
			imageData.data[i * 4 + 2] = buffer[i * 3 + 2];
			imageData.data[i * 4 + 3] = 255;
		}
	}

	ctx.putImageData(imageData, 0, 0);
	return canvas;
}

/**
 * Convert ImageSource to drawable element
 */
async function loadSourceImage(source: ImageSource): Promise<HTMLImageElement | HTMLCanvasElement> {
	switch (source.type) {
		case 'dataUrl':
			return loadImageFromDataUrl(source.data);
		case 'canvas':
			return loadImageFromCanvas(source.canvas);
		case 'buffer':
			return loadImageFromBuffer(source.buffer, source.width, source.height, source.channels ?? 4);
		default:
			throw new Error('Unknown image source type');
	}
}

// =============================================================================
// BACKGROUND RENDERING
// =============================================================================

/**
 * Draw background on canvas
 */
function drawBackground(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	background: Background
): void {
	if (background.type === 'solid') {
		fillSolid(ctx, width, height, background.color);
	} else if (background.type === 'gradient') {
		fillGradient(ctx, width, height, background.colors, background.angle ?? 180);
	}
}

// =============================================================================
// LAYOUT RENDERING
// =============================================================================

/**
 * Draw image with layout
 */
function drawWithLayout(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement | HTMLCanvasElement,
	canvasWidth: number,
	canvasHeight: number,
	layout: Layout
): void {
	switch (layout.type) {
		case 'center':
			drawCentered(ctx, image, canvasWidth, canvasHeight, layout);
			break;
		case 'corner':
			drawCorner(ctx, image, canvasWidth, canvasHeight, layout);
			break;
		case 'pattern':
			drawPattern(ctx, image, canvasWidth, canvasHeight, layout);
			break;
		default:
			throw new Error('Unknown layout type');
	}
}

// =============================================================================
// DIMENSION RESOLUTION
// =============================================================================

/**
 * Resolve device option to dimensions
 */
function resolveDimensions(device: string | { width: number; height: number }): {
	width: number;
	height: number;
} {
	if (typeof device === 'string') {
		const preset = getDevicePreset(device);
		if (!preset) {
			throw new Error(`Unknown device preset: ${device}`);
		}
		return { width: preset.width, height: preset.height };
	}
	return device;
}

// =============================================================================
// BROWSER GENERATOR
// =============================================================================

/**
 * Create browser-based wallpaper generator
 */
export function createBrowserGenerator(): WallpaperGenerator {
	return {
		async generate(source: ImageSource, options: WallpaperOptions): Promise<WallpaperResult> {
			const { width, height } = resolveDimensions(options.device);
			const format = options.format ?? 'png';
			const quality = options.quality ?? 90;

			// Create canvas
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Failed to get canvas context');

			// Draw background
			drawBackground(ctx, width, height, options.background);

			// Load and draw source image
			const sourceImage = await loadSourceImage(source);
			drawWithLayout(ctx, sourceImage, width, height, options.layout);

			// Export to data URL
			const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
			const dataUrl = canvas.toDataURL(mimeType, quality / 100);

			// Estimate size from base64
			const base64Length = dataUrl.split(',')[1]?.length ?? 0;
			const size = Math.ceil((base64Length * 3) / 4);

			return {
				dataUrl,
				width,
				height,
				format,
				size,
			};
		},

		async preview(source: ImageSource, options: WallpaperOptions): Promise<string> {
			// Generate at 1/4 resolution for preview
			const { width, height } = resolveDimensions(options.device);
			const previewWidth = Math.round(width / 4);
			const previewHeight = Math.round(height / 4);

			const canvas = document.createElement('canvas');
			canvas.width = previewWidth;
			canvas.height = previewHeight;

			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Failed to get canvas context');

			// Draw background
			drawBackground(ctx, previewWidth, previewHeight, options.background);

			// Load and draw source image (with scaled layout)
			const sourceImage = await loadSourceImage(source);

			// Scale down the layout parameters
			const scaledLayout = scaleLayout(options.layout, 0.25);
			drawWithLayout(ctx, sourceImage, previewWidth, previewHeight, scaledLayout);

			return canvas.toDataURL('image/jpeg', 0.7);
		},

		getSupportedDevices(): DevicePreset[] {
			return ALL_DEVICE_PRESETS;
		},

		getDevicesByCategory(category: DeviceCategory): DevicePreset[] {
			return getPresetsByCategory(category);
		},
	};
}

/**
 * Scale layout parameters for preview
 */
function scaleLayout(layout: Layout, scaleFactor: number): Layout {
	switch (layout.type) {
		case 'center':
			return {
				...layout,
				offset: layout.offset
					? [layout.offset[0] * scaleFactor, layout.offset[1] * scaleFactor]
					: undefined,
			};
		case 'corner':
			return {
				...layout,
				padding: (layout.padding ?? 40) * scaleFactor,
			};
		case 'pattern':
			return {
				...layout,
				gap: (layout.gap ?? 20) * scaleFactor,
			};
		default:
			return layout;
	}
}

// =============================================================================
// BROWSER UTILITIES
// =============================================================================

/**
 * Download wallpaper to user's device
 */
export function downloadWallpaper(result: WallpaperResult, filename?: string): void {
	const defaultFilename = `wallpaper-${result.width}x${result.height}.${result.format}`;
	const link = document.createElement('a');
	link.href = result.dataUrl;
	link.download = filename ?? defaultFilename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

/**
 * Copy wallpaper to clipboard (if supported)
 */
export async function copyWallpaperToClipboard(result: WallpaperResult): Promise<boolean> {
	if (!navigator.clipboard?.write) {
		return false;
	}

	try {
		// Convert data URL to blob
		const response = await fetch(result.dataUrl);
		const blob = await response.blob();

		await navigator.clipboard.write([
			new ClipboardItem({
				[blob.type]: blob,
			}),
		]);
		return true;
	} catch {
		return false;
	}
}
