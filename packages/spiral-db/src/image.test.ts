/**
 * Image Tests
 */

import { describe, it, expect } from 'vitest';
import {
	createImage,
	createImageForRing,
	getPixelByIndex,
	setPixelByIndex,
	getPixelByXY,
	setPixelByXY,
	readPixelRange,
	writePixelRange,
	expandImage,
	getMaxRingForImage,
	imageToRGBA,
	rgbaToImage,
	imageToColorGrid,
	visualizeSpiralOrder,
	visualizeImageEmoji,
} from './image.js';
import type { ColorIndex } from './types.js';

// =============================================================================
// CREATE IMAGE
// =============================================================================

describe('createImage', () => {
	it('should create a square image with correct dimensions', () => {
		const image = createImage(5);
		expect(image.width).toBe(5);
		expect(image.height).toBe(5);
		expect(image.pixels.length).toBe(5 * 5 * 3);
	});

	it('should initialize all pixels to black (0)', () => {
		const image = createImage(3);
		for (let i = 0; i < image.pixels.length; i++) {
			expect(image.pixels[i]).toBe(0);
		}
	});

	it('should reject even sizes', () => {
		expect(() => createImage(4)).toThrow('Image size must be odd');
	});

	it('should create 1x1 image', () => {
		const image = createImage(1);
		expect(image.width).toBe(1);
		expect(image.pixels.length).toBe(3);
	});
});

describe('createImageForRing', () => {
	it('should create correct size for ring 0', () => {
		const image = createImageForRing(0);
		expect(image.width).toBe(1);
	});

	it('should create correct size for ring 2', () => {
		const image = createImageForRing(2);
		expect(image.width).toBe(5);
	});

	it('should create correct size for ring 5', () => {
		const image = createImageForRing(5);
		expect(image.width).toBe(11);
	});
});

// =============================================================================
// PIXEL ACCESS
// =============================================================================

describe('Pixel Access by XY', () => {
	it('should set and get pixel', () => {
		const image = createImage(3);
		setPixelByXY(image, 1, 1, 7); // white at center
		expect(getPixelByXY(image, 1, 1)).toBe(7);
	});

	it('should set all 8 colors', () => {
		const image = createImage(3);
		for (let i = 0; i < 8; i++) {
			setPixelByXY(image, i % 3, Math.floor(i / 3), i as ColorIndex);
		}
		for (let i = 0; i < 8; i++) {
			expect(getPixelByXY(image, i % 3, Math.floor(i / 3))).toBe(i);
		}
	});

	it('should throw on out-of-bounds access', () => {
		const image = createImage(3);
		expect(() => getPixelByXY(image, -1, 0)).toThrow('out of bounds');
		expect(() => getPixelByXY(image, 3, 0)).toThrow('out of bounds');
		expect(() => getPixelByXY(image, 0, 3)).toThrow('out of bounds');
		expect(() => setPixelByXY(image, 0, -1, 0)).toThrow('out of bounds');
	});
});

describe('Pixel Access by Index', () => {
	it('should set and get center pixel (index 0)', () => {
		const image = createImage(5);
		setPixelByIndex(image, 0, 7);
		expect(getPixelByIndex(image, 0)).toBe(7);
	});

	it('should set and get ring 1 pixels', () => {
		const image = createImage(5);
		for (let i = 1; i <= 8; i++) {
			setPixelByIndex(image, i, (i % 8) as ColorIndex);
		}
		for (let i = 1; i <= 8; i++) {
			expect(getPixelByIndex(image, i)).toBe(i % 8);
		}
	});
});

describe('Pixel Range Operations', () => {
	it('should write and read a range', () => {
		const image = createImage(5);
		const colors: ColorIndex[] = [1, 2, 3, 4, 5];
		writePixelRange(image, 0, colors);
		const read = readPixelRange(image, 0, 5);
		expect(read).toEqual(colors);
	});

	it('should handle range of 1', () => {
		const image = createImage(3);
		writePixelRange(image, 0, [7]);
		expect(readPixelRange(image, 0, 1)).toEqual([7]);
	});
});

// =============================================================================
// IMAGE EXPANSION
// =============================================================================

describe('expandImage', () => {
	it('should grow image to accommodate new ring', () => {
		const image = createImage(3); // ring 1
		setPixelByIndex(image, 0, 7); // white center

		const expanded = expandImage(image, 3);
		expect(expanded.width).toBe(7); // ring 3 → 2*3+1
		expect(expanded.height).toBe(7);

		// Center pixel should be preserved
		expect(getPixelByIndex(expanded, 0)).toBe(7);
	});

	it('should not expand if already large enough', () => {
		const image = createImage(7);
		const same = expandImage(image, 2); // ring 2 needs 5, we have 7
		expect(same).toBe(image); // same reference
	});

	it('should preserve all existing pixels', () => {
		const image = createImage(3);
		// Set all 9 pixels
		for (let i = 0; i < 9; i++) {
			setPixelByIndex(image, i, (i % 8) as ColorIndex);
		}

		const expanded = expandImage(image, 3);

		// Verify all original pixels preserved
		for (let i = 0; i < 9; i++) {
			expect(getPixelByIndex(expanded, i)).toBe(i % 8);
		}
	});
});

// =============================================================================
// FORMAT CONVERSIONS
// =============================================================================

describe('RGBA Conversion', () => {
	it('should convert to RGBA and back', () => {
		const image = createImage(3);
		setPixelByIndex(image, 0, 7); // white center
		setPixelByIndex(image, 1, 4); // red

		const rgba = imageToRGBA(image);
		expect(rgba.length).toBe(3 * 3 * 4); // 4 bytes per pixel

		const back = rgbaToImage(rgba, 3, 3);
		expect(getPixelByIndex(back, 0)).toBe(7);
		expect(getPixelByIndex(back, 1)).toBe(4);
	});

	it('should set alpha to 255 in RGBA', () => {
		const image = createImage(1);
		const rgba = imageToRGBA(image);
		expect(rgba[3]).toBe(255); // alpha
	});

	it('should reject non-square RGBA', () => {
		const rgba = new Uint8Array(2 * 3 * 4);
		expect(() => rgbaToImage(rgba, 2, 3)).toThrow('must be square');
	});

	it('should reject even-sized RGBA', () => {
		const rgba = new Uint8Array(4 * 4 * 4);
		expect(() => rgbaToImage(rgba, 4, 4)).toThrow('must be odd');
	});
});

describe('Color Grid', () => {
	it('should return 2D grid of color indices', () => {
		const image = createImage(3);
		setPixelByXY(image, 0, 0, 4);
		setPixelByXY(image, 2, 2, 2);

		const grid = imageToColorGrid(image);
		expect(grid.length).toBe(3);
		expect(grid[0].length).toBe(3);
		expect(grid[0][0]).toBe(4);
		expect(grid[2][2]).toBe(2);
	});
});

describe('getMaxRingForImage', () => {
	it('should return correct max ring', () => {
		expect(getMaxRingForImage(createImage(1))).toBe(0);
		expect(getMaxRingForImage(createImage(3))).toBe(1);
		expect(getMaxRingForImage(createImage(5))).toBe(2);
		expect(getMaxRingForImage(createImage(11))).toBe(5);
	});
});

// =============================================================================
// VISUALIZATION
// =============================================================================

describe('Visualization', () => {
	it('should produce emoji visualization with correct dimensions', () => {
		const image = createImage(3);
		setPixelByIndex(image, 0, 7);
		const emoji = visualizeImageEmoji(image);
		const lines = emoji.split('\n');
		expect(lines.length).toBe(3);
	});

	it('should produce spiral order visualization', () => {
		const viz = visualizeSpiralOrder(3);
		expect(viz).toContain('0'); // center
		expect(viz.split('\n')).toHaveLength(3);
	});
});
