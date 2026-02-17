/**
 * Wallpaper Generator Types
 *
 * Type definitions for the wallpaper generator package.
 */

// =============================================================================
// IMAGE SOURCE TYPES
// =============================================================================

/** Data URL image source (e.g., from QR code or canvas export) */
export interface DataUrlSource {
	type: 'dataUrl';
	data: string;
}

/** HTML Canvas element source */
export interface CanvasSource {
	type: 'canvas';
	canvas: HTMLCanvasElement;
}

/** Raw pixel buffer source */
export interface BufferSource {
	type: 'buffer';
	buffer: Uint8Array;
	width: number;
	height: number;
	/** Number of channels (3 for RGB, 4 for RGBA) */
	channels?: 3 | 4;
}

/** All supported image source types */
export type ImageSource = DataUrlSource | CanvasSource | BufferSource;

// =============================================================================
// DEVICE PRESETS
// =============================================================================

/** Device category */
export type DeviceCategory = 'phone' | 'tablet' | 'desktop';

/** Device preset definition */
export interface DevicePreset {
	/** Unique identifier (e.g., 'iphone-15-pro-max') */
	id: string;
	/** Display name (e.g., 'iPhone 15 Pro Max') */
	name: string;
	/** Device category */
	category: DeviceCategory;
	/** Width in pixels */
	width: number;
	/** Height in pixels */
	height: number;
	/** Pixel density ratio (optional) */
	pixelRatio?: number;
}

/** Custom device dimensions */
export interface CustomDevice {
	width: number;
	height: number;
}

/** Device option - either a preset ID or custom dimensions */
export type DeviceOption = string | CustomDevice;

// =============================================================================
// LAYOUT OPTIONS
// =============================================================================

/** Corner position for corner layout */
export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Center layout - image centered on wallpaper */
export interface CenterLayout {
	type: 'center';
	/** Scale factor (default: 1.0) */
	scale?: number;
	/** Offset from center in pixels [x, y] */
	offset?: [number, number];
}

/** Corner layout - image in one corner */
export interface CornerLayout {
	type: 'corner';
	/** Which corner to place the image */
	position: CornerPosition;
	/** Scale factor (default: 1.0) */
	scale?: number;
	/** Padding from edges in pixels (default: 40) */
	padding?: number;
}

/** Pattern layout - tiled image */
export interface PatternLayout {
	type: 'pattern';
	/** Scale factor for each tile (default: 0.5) */
	scale?: number;
	/** Gap between tiles in pixels (default: 20) */
	gap?: number;
	/** Opacity of pattern (default: 0.15) */
	opacity?: number;
}

/** All layout types */
export type Layout = CenterLayout | CornerLayout | PatternLayout;

// =============================================================================
// BACKGROUND OPTIONS
// =============================================================================

/** Solid color background */
export interface SolidBackground {
	type: 'solid';
	/** Color in hex format (e.g., '#1a1a2e') */
	color: string;
}

/** Gradient background */
export interface GradientBackground {
	type: 'gradient';
	/** Array of color stops in hex format */
	colors: string[];
	/** Gradient angle in degrees (default: 180 = top to bottom) */
	angle?: number;
}

/** All background types */
export type Background = SolidBackground | GradientBackground;

// =============================================================================
// WALLPAPER OPTIONS
// =============================================================================

/** Output image format */
export type OutputFormat = 'png' | 'jpeg';

/** Complete wallpaper generation options */
export interface WallpaperOptions {
	/** Target device (preset ID or custom dimensions) */
	device: DeviceOption;
	/** Image layout configuration */
	layout: Layout;
	/** Background configuration */
	background: Background;
	/** Output format (default: 'png') */
	format?: OutputFormat;
	/** JPEG quality 0-100 (only for jpeg format, default: 90) */
	quality?: number;
}

// =============================================================================
// RESULT TYPES
// =============================================================================

/** Wallpaper generation result */
export interface WallpaperResult {
	/** Data URL of the generated wallpaper */
	dataUrl: string;
	/** Width of the generated image */
	width: number;
	/** Height of the generated image */
	height: number;
	/** Output format */
	format: OutputFormat;
	/** Size in bytes (approximate) */
	size: number;
}

// =============================================================================
// GENERATOR INTERFACE
// =============================================================================

/** Wallpaper generator interface */
export interface WallpaperGenerator {
	/**
	 * Generate a wallpaper from an image source
	 * @param source - The source image (data URL, canvas, or buffer)
	 * @param options - Wallpaper generation options
	 * @returns Promise with the generated wallpaper result
	 */
	generate(source: ImageSource, options: WallpaperOptions): Promise<WallpaperResult>;

	/**
	 * Generate a preview (smaller, faster) of the wallpaper
	 * @param source - The source image
	 * @param options - Wallpaper generation options
	 * @returns Promise with data URL of preview image
	 */
	preview(source: ImageSource, options: WallpaperOptions): Promise<string>;

	/**
	 * Get list of all supported device presets
	 * @returns Array of device presets
	 */
	getSupportedDevices(): DevicePreset[];

	/**
	 * Get device presets by category
	 * @param category - Device category to filter by
	 * @returns Array of device presets in that category
	 */
	getDevicesByCategory(category: DeviceCategory): DevicePreset[];
}

// =============================================================================
// SVELTE COMPONENT PROPS
// =============================================================================

/** Props for WallpaperModal Svelte component */
export interface WallpaperModalProps {
	/** Whether the modal is visible */
	show: boolean;
	/** Source image as data URL */
	imageDataUrl: string;
	/** Optional source image dimensions (for better scaling) */
	imageSize?: { width: number; height: number };
	/** Callback when modal is closed */
	onClose: () => void;
	/** Optional callback when wallpaper is generated */
	onGenerate?: (result: WallpaperResult) => void;
}

// =============================================================================
// PRESET CONSTANTS
// =============================================================================

/** Default layout options */
export const DEFAULT_CENTER_LAYOUT: CenterLayout = {
	type: 'center',
	scale: 1.0,
};

export const DEFAULT_CORNER_LAYOUT: CornerLayout = {
	type: 'corner',
	position: 'bottom-right',
	scale: 0.3,
	padding: 40,
};

export const DEFAULT_PATTERN_LAYOUT: PatternLayout = {
	type: 'pattern',
	scale: 0.5,
	gap: 20,
	opacity: 0.15,
};

/** Default background */
export const DEFAULT_BACKGROUND: SolidBackground = {
	type: 'solid',
	color: '#1a1a2e',
};

/** Default gradient backgrounds */
export const GRADIENT_PRESETS: Record<string, GradientBackground> = {
	dark: {
		type: 'gradient',
		colors: ['#1a1a2e', '#16213e', '#0f3460'],
		angle: 180,
	},
	sunset: {
		type: 'gradient',
		colors: ['#ff6b6b', '#feca57', '#48dbfb'],
		angle: 135,
	},
	ocean: {
		type: 'gradient',
		colors: ['#0f0c29', '#302b63', '#24243e'],
		angle: 180,
	},
	forest: {
		type: 'gradient',
		colors: ['#134e5e', '#71b280'],
		angle: 180,
	},
	purple: {
		type: 'gradient',
		colors: ['#667eea', '#764ba2'],
		angle: 135,
	},
};
