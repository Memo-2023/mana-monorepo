/**
 * Node.js Renderer
 *
 * Sharp-based wallpaper generation for Node.js environments.
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
	CenterLayout,
	CornerLayout,
	PatternLayout,
} from '../types.js';
import { ALL_DEVICE_PRESETS, getDevicePreset, getPresetsByCategory } from '../presets/index.js';
import { createSolidBuffer } from '../backgrounds/solid.js';
import { createGradientBuffer } from '../backgrounds/gradient.js';
import { calculateCenterPosition } from '../layouts/center.js';
import { calculateCornerPosition } from '../layouts/corner.js';
import { calculatePatternTiles } from '../layouts/pattern.js';

// =============================================================================
// TYPES
// =============================================================================

interface SharpInstance {
	metadata(): Promise<{ width?: number; height?: number }>;
	resize(width: number, height: number, options?: object): SharpInstance;
	composite(inputs: CompositeInput[]): SharpInstance;
	png(options?: { compressionLevel?: number }): SharpInstance;
	jpeg(options?: { quality?: number }): SharpInstance;
	toBuffer(): Promise<Buffer>;
}

interface CompositeInput {
	input:
		| Buffer
		| {
				create: {
					width: number;
					height: number;
					channels: number;
					background: { r: number; g: number; b: number; alpha: number };
				};
		  };
	top?: number;
	left?: number;
	blend?: string;
}

type SharpConstructor = {
	(
		input?:
			| Buffer
			| string
			| {
					create: {
						width: number;
						height: number;
						channels: 3 | 4;
						background: { r: number; g: number; b: number; alpha?: number };
					};
			  }
	): SharpInstance;
	(
		buffer: Buffer,
		options: { raw: { width: number; height: number; channels: 3 | 4 } }
	): SharpInstance;
};

// =============================================================================
// SHARP LOADING
// =============================================================================

let sharpModule: SharpConstructor | null = null;

async function getSharp(): Promise<SharpConstructor> {
	if (sharpModule) return sharpModule;

	try {
		const module = await import('sharp');
		sharpModule = module.default as SharpConstructor;
		return sharpModule;
	} catch {
		throw new Error(
			'Sharp is required for Node.js wallpaper generation. Install it with: npm install sharp'
		);
	}
}

// =============================================================================
// IMAGE SOURCE LOADING
// =============================================================================

/**
 * Convert data URL to Buffer
 */
function dataUrlToBuffer(dataUrl: string): Buffer {
	const base64 = dataUrl.split(',')[1];
	if (!base64) throw new Error('Invalid data URL');
	return Buffer.from(base64, 'base64');
}

/**
 * Load source image and get dimensions
 */
async function loadSourceBuffer(
	source: ImageSource
): Promise<{ buffer: Buffer; width: number; height: number; isRaw?: boolean; channels?: 3 | 4 }> {
	const sharp = await getSharp();

	switch (source.type) {
		case 'dataUrl': {
			const buffer = dataUrlToBuffer(source.data);
			const img = sharp(buffer);
			const metadata = await img.metadata();
			return {
				buffer,
				width: metadata.width ?? 0,
				height: metadata.height ?? 0,
				isRaw: false,
			};
		}
		case 'canvas': {
			throw new Error('Canvas source is not supported in Node.js environment');
		}
		case 'buffer': {
			return {
				buffer: Buffer.from(source.buffer),
				width: source.width,
				height: source.height,
				isRaw: true,
				channels: source.channels ?? 3,
			};
		}
		default:
			throw new Error('Unknown image source type');
	}
}

// =============================================================================
// BACKGROUND CREATION
// =============================================================================

/**
 * Create background buffer
 */
function createBackgroundBuffer(width: number, height: number, background: Background): Buffer {
	let buffer: Uint8Array;

	if (background.type === 'solid') {
		buffer = createSolidBuffer(width, height, background.color);
	} else if (background.type === 'gradient') {
		buffer = createGradientBuffer(width, height, background.colors, background.angle ?? 180);
	} else {
		buffer = createSolidBuffer(width, height, '#000000');
	}

	return Buffer.from(buffer);
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
// NODE.JS GENERATOR
// =============================================================================

/**
 * Create Node.js-based wallpaper generator using Sharp
 */
export function createNodeGenerator(): WallpaperGenerator {
	return {
		async generate(source: ImageSource, options: WallpaperOptions): Promise<WallpaperResult> {
			const sharp = await getSharp();
			const { width, height } = resolveDimensions(options.device);
			const format = options.format ?? 'png';
			const quality = options.quality ?? 90;

			// Create background
			const bgBuffer = createBackgroundBuffer(width, height, options.background);
			let canvas = sharp(bgBuffer, { raw: { width, height, channels: 3 } });

			// Load source image
			const sourceData = await loadSourceBuffer(source);

			// Calculate composite operations based on layout
			const composites: CompositeInput[] = [];
			const { layout } = options;

			// Create sharp instance for source image
			const createSourceSharp = () => {
				if (sourceData.isRaw) {
					return sharp(sourceData.buffer, {
						raw: {
							width: sourceData.width,
							height: sourceData.height,
							channels: sourceData.channels ?? 3,
						},
					});
				}
				return sharp(sourceData.buffer);
			};

			if (layout.type === 'center') {
				const pos = calculateCenterPosition(
					width,
					height,
					sourceData.width,
					sourceData.height,
					layout as CenterLayout
				);

				// Resize source image
				const resizedSource = await createSourceSharp()
					.resize(pos.width, pos.height, { fit: 'fill' })
					.png()
					.toBuffer();

				composites.push({
					input: resizedSource,
					top: Math.max(0, pos.y),
					left: Math.max(0, pos.x),
				});
			} else if (layout.type === 'corner') {
				const pos = calculateCornerPosition(
					width,
					height,
					sourceData.width,
					sourceData.height,
					layout as CornerLayout
				);

				const resizedSource = await createSourceSharp()
					.resize(pos.width, pos.height, { fit: 'fill' })
					.png()
					.toBuffer();

				composites.push({
					input: resizedSource,
					top: Math.max(0, pos.y),
					left: Math.max(0, pos.x),
				});
			} else if (layout.type === 'pattern') {
				const tiles = calculatePatternTiles(
					width,
					height,
					sourceData.width,
					sourceData.height,
					layout as PatternLayout
				);

				// Resize source once for all tiles
				const tileSize = tiles[0];
				if (tileSize) {
					const resizedTile = await createSourceSharp()
						.resize(tileSize.width, tileSize.height, { fit: 'fill' })
						.png()
						.toBuffer();

					// Add each tile (limited opacity in Sharp requires different approach)
					for (const tile of tiles) {
						if (tile.x >= 0 && tile.y >= 0 && tile.x < width && tile.y < height) {
							composites.push({
								input: resizedTile,
								top: tile.y,
								left: tile.x,
								blend: 'over',
							});
						}
					}
				}
			}

			// Apply composites
			if (composites.length > 0) {
				canvas = canvas.composite(composites);
			}

			// Export
			let outputBuffer: Buffer;
			if (format === 'jpeg') {
				outputBuffer = await canvas.jpeg({ quality }).toBuffer();
			} else {
				outputBuffer = await canvas.png({ compressionLevel: 9 }).toBuffer();
			}

			// Convert to data URL
			const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
			const dataUrl = `data:${mimeType};base64,${outputBuffer.toString('base64')}`;

			return {
				dataUrl,
				width,
				height,
				format,
				size: outputBuffer.length,
			};
		},

		async preview(source: ImageSource, options: WallpaperOptions): Promise<string> {
			// Generate at 1/4 resolution for preview
			const { width, height } = resolveDimensions(options.device);
			const previewWidth = Math.round(width / 4);
			const previewHeight = Math.round(height / 4);

			const previewOptions: WallpaperOptions = {
				...options,
				device: { width: previewWidth, height: previewHeight },
				format: 'jpeg',
				quality: 70,
			};

			// Scale layout parameters
			previewOptions.layout = scaleLayout(options.layout, 0.25);

			const result = await this.generate(source, previewOptions);
			return result.dataUrl;
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
			} as CenterLayout;
		case 'corner':
			return {
				...layout,
				padding: ((layout as CornerLayout).padding ?? 40) * scaleFactor,
			} as CornerLayout;
		case 'pattern':
			return {
				...layout,
				gap: ((layout as PatternLayout).gap ?? 20) * scaleFactor,
			} as PatternLayout;
		default:
			return layout;
	}
}

// =============================================================================
// NODE.JS UTILITIES
// =============================================================================

/**
 * Save wallpaper to file
 */
export async function saveWallpaperToFile(
	result: WallpaperResult,
	filePath: string
): Promise<void> {
	const fs = await import('fs/promises');
	const base64 = result.dataUrl.split(',')[1];
	if (!base64) throw new Error('Invalid data URL');
	const buffer = Buffer.from(base64, 'base64');
	await fs.writeFile(filePath, buffer);
}
