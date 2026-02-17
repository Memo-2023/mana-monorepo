/**
 * QR Code Wallpaper Generation
 *
 * Creates device wallpapers from QR codes using @manacore/wallpaper-generator.
 */

import type { ManaQRExport, EncodeResult } from './types';
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
import { toDataURL } from './generate';

/** Options for QR wallpaper generation */
export interface QRWallpaperOptions {
	/** Target device (preset ID like 'iphone-15-pro-max' or custom dimensions) */
	device: DeviceOption;
	/** Layout configuration (default: center) */
	layout?: Layout;
	/** Background configuration (default: dark gradient) */
	background?: Background;
	/** QR code size before placing on wallpaper (default: 600) */
	qrSize?: number;
	/** Output format (default: 'png') */
	format?: 'png' | 'jpeg';
	/** JPEG quality 0-100 (default: 90) */
	quality?: number;
}

const DEFAULT_QR_WALLPAPER_OPTIONS: Partial<QRWallpaperOptions> = {
	layout: DEFAULT_CENTER_LAYOUT,
	background: DEFAULT_BACKGROUND,
	qrSize: 600,
	format: 'png',
	quality: 90,
};

/**
 * Generate a device wallpaper from QR code data.
 *
 * @param data - QR code data (string, ManaQRExport, or EncodeResult)
 * @param options - Wallpaper generation options
 * @returns Promise with wallpaper result
 *
 * @example
 * ```ts
 * import { toWallpaper } from '@manacore/qr-export/wallpaper';
 *
 * const result = await toWallpaper(encodeResult, {
 *   device: 'iphone-15-pro-max',
 *   layout: { type: 'center', scale: 0.7 },
 *   background: { type: 'gradient', colors: ['#1a1a2e', '#16213e'] },
 * });
 *
 * // result.dataUrl contains the wallpaper as data URL
 * ```
 */
export async function toWallpaper(
	data: string | ManaQRExport | EncodeResult,
	options: QRWallpaperOptions
): Promise<WallpaperResult> {
	const opts = { ...DEFAULT_QR_WALLPAPER_OPTIONS, ...options };

	// Generate QR code as data URL
	const qrDataUrl = await toDataURL(data, {
		size: opts.qrSize,
		errorCorrectionLevel: 'M',
		darkColor: '#000000',
		lightColor: '#ffffff',
	});

	// Create wallpaper generator
	const generator = createWallpaperGenerator();

	// Generate wallpaper
	const wallpaperOptions: WallpaperOptions = {
		device: opts.device,
		layout: opts.layout ?? DEFAULT_CENTER_LAYOUT,
		background: opts.background ?? DEFAULT_BACKGROUND,
		format: opts.format,
		quality: opts.quality,
	};

	return generator.generate({ type: 'dataUrl', data: qrDataUrl }, wallpaperOptions);
}

/**
 * Generate a preview of the QR wallpaper (smaller, faster).
 *
 * @param data - QR code data
 * @param options - Wallpaper generation options
 * @returns Promise with preview data URL
 */
export async function toWallpaperPreview(
	data: string | ManaQRExport | EncodeResult,
	options: QRWallpaperOptions
): Promise<string> {
	const opts = { ...DEFAULT_QR_WALLPAPER_OPTIONS, ...options };

	// Generate QR code at smaller size for preview
	const qrSize = opts.qrSize ?? 600;
	const qrDataUrl = await toDataURL(data, {
		size: Math.round(qrSize / 2),
		errorCorrectionLevel: 'M',
	});

	const generator = createWallpaperGenerator();

	const wallpaperOptions: WallpaperOptions = {
		device: opts.device,
		layout: opts.layout ?? DEFAULT_CENTER_LAYOUT,
		background: opts.background ?? DEFAULT_BACKGROUND,
	};

	return generator.preview({ type: 'dataUrl', data: qrDataUrl }, wallpaperOptions);
}
