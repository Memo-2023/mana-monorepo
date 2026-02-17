/**
 * Image handling for SpiralDB
 * Converts between SpiralImage and raw pixel data
 */

import type { ColorIndex, SpiralImage } from './types.js';
import { colorToRGB, rgbToColor } from './encoding.js';
import { spiralToXY, xyToSpiral, getImageSizeForRing } from './spiral.js';

/**
 * Create an empty spiral image
 */
export function createImage(size: number): SpiralImage {
	if (size % 2 === 0) {
		throw new Error('Image size must be odd');
	}
	const pixels = new Uint8Array(size * size * 3);
	// Initialize all pixels to black (0, 0, 0)
	return { width: size, height: size, pixels };
}

/**
 * Create an image that can hold a specific ring
 */
export function createImageForRing(ring: number): SpiralImage {
	const size = getImageSizeForRing(ring);
	return createImage(size);
}

/**
 * Get a pixel's color at a specific spiral index
 */
export function getPixelByIndex(image: SpiralImage, index: number): ColorIndex {
	const point = spiralToXY(index, image.width);
	return getPixelByXY(image, point.x, point.y);
}

/**
 * Set a pixel's color at a specific spiral index
 */
export function setPixelByIndex(image: SpiralImage, index: number, color: ColorIndex): void {
	const point = spiralToXY(index, image.width);
	setPixelByXY(image, point.x, point.y, color);
}

/**
 * Get a pixel's color at XY coordinates
 */
export function getPixelByXY(image: SpiralImage, x: number, y: number): ColorIndex {
	if (x < 0 || x >= image.width || y < 0 || y >= image.height) {
		throw new Error(`Coordinates out of bounds: (${x}, ${y})`);
	}
	const offset = (y * image.width + x) * 3;
	const r = image.pixels[offset];
	const g = image.pixels[offset + 1];
	const b = image.pixels[offset + 2];
	return rgbToColor(r, g, b);
}

/**
 * Set a pixel's color at XY coordinates
 */
export function setPixelByXY(image: SpiralImage, x: number, y: number, color: ColorIndex): void {
	if (x < 0 || x >= image.width || y < 0 || y >= image.height) {
		throw new Error(`Coordinates out of bounds: (${x}, ${y})`);
	}
	const rgb = colorToRGB(color);
	const offset = (y * image.width + x) * 3;
	image.pixels[offset] = rgb.r;
	image.pixels[offset + 1] = rgb.g;
	image.pixels[offset + 2] = rgb.b;
}

/**
 * Read a range of pixels starting at a spiral index
 */
export function readPixelRange(
	image: SpiralImage,
	startIndex: number,
	length: number
): ColorIndex[] {
	const colors: ColorIndex[] = [];
	for (let i = 0; i < length; i++) {
		colors.push(getPixelByIndex(image, startIndex + i));
	}
	return colors;
}

/**
 * Write a range of pixels starting at a spiral index
 */
export function writePixelRange(
	image: SpiralImage,
	startIndex: number,
	colors: ColorIndex[]
): void {
	for (let i = 0; i < colors.length; i++) {
		setPixelByIndex(image, startIndex + i, colors[i]);
	}
}

/**
 * Expand an image to accommodate more rings
 * Centers the existing data in the new larger image
 */
export function expandImage(image: SpiralImage, newRing: number): SpiralImage {
	const newSize = getImageSizeForRing(newRing);
	if (newSize <= image.width) {
		return image; // No expansion needed
	}

	const newImage = createImage(newSize);

	// Copy existing pixels to center of new image
	const offset = Math.floor((newSize - image.width) / 2);

	for (let y = 0; y < image.height; y++) {
		for (let x = 0; x < image.width; x++) {
			const oldOffset = (y * image.width + x) * 3;
			const newOffset = ((y + offset) * newSize + (x + offset)) * 3;

			newImage.pixels[newOffset] = image.pixels[oldOffset];
			newImage.pixels[newOffset + 1] = image.pixels[oldOffset + 1];
			newImage.pixels[newOffset + 2] = image.pixels[oldOffset + 2];
		}
	}

	return newImage;
}

/**
 * Get the current ring count based on image size
 */
export function getMaxRingForImage(image: SpiralImage): number {
	return Math.floor(image.width / 2);
}

/**
 * Convert SpiralImage to raw RGBA buffer (for canvas/web)
 */
export function imageToRGBA(image: SpiralImage): Uint8Array {
	const rgba = new Uint8Array(image.width * image.height * 4);
	for (let i = 0; i < image.width * image.height; i++) {
		rgba[i * 4] = image.pixels[i * 3]; // R
		rgba[i * 4 + 1] = image.pixels[i * 3 + 1]; // G
		rgba[i * 4 + 2] = image.pixels[i * 3 + 2]; // B
		rgba[i * 4 + 3] = 255; // A (fully opaque)
	}
	return rgba;
}

/**
 * Create SpiralImage from raw RGBA buffer
 */
export function rgbaToImage(rgba: Uint8Array, width: number, height: number): SpiralImage {
	if (width !== height) {
		throw new Error('Image must be square');
	}
	if (width % 2 === 0) {
		throw new Error('Image size must be odd');
	}

	const pixels = new Uint8Array(width * height * 3);
	for (let i = 0; i < width * height; i++) {
		pixels[i * 3] = rgba[i * 4]; // R
		pixels[i * 3 + 1] = rgba[i * 4 + 1]; // G
		pixels[i * 3 + 2] = rgba[i * 4 + 2]; // B
		// Ignore alpha
	}

	return { width, height, pixels };
}

/**
 * Convert SpiralImage to a 2D array of color indices (for visualization)
 */
export function imageToColorGrid(image: SpiralImage): ColorIndex[][] {
	const grid: ColorIndex[][] = [];
	for (let y = 0; y < image.height; y++) {
		const row: ColorIndex[] = [];
		for (let x = 0; x < image.width; x++) {
			row.push(getPixelByXY(image, x, y));
		}
		grid.push(row);
	}
	return grid;
}

/**
 * Create a visual representation of the spiral order
 * Returns a string showing the spiral indices
 */
export function visualizeSpiralOrder(size: number): string {
	const grid: string[][] = [];
	for (let y = 0; y < size; y++) {
		const row: string[] = [];
		for (let x = 0; x < size; x++) {
			const index = xyToSpiral(x, y, size);
			row.push(index.toString().padStart(3, ' '));
		}
		grid.push(row);
	}
	return grid.map((row) => row.join(' ')).join('\n');
}

/**
 * Create a visual representation using emoji colors
 */
export function visualizeImageEmoji(image: SpiralImage): string {
	const emoji: Record<ColorIndex, string> = {
		0: '⬛',
		1: '🟦',
		2: '🟩',
		3: '🔷',
		4: '🟥',
		5: '🟪',
		6: '🟨',
		7: '⬜',
	};

	const lines: string[] = [];
	for (let y = 0; y < image.height; y++) {
		let line = '';
		for (let x = 0; x < image.width; x++) {
			const color = getPixelByXY(image, x, y);
			line += emoji[color];
		}
		lines.push(line);
	}
	return lines.join('\n');
}
