/**
 * Spiral Coordinate System
 * Converts between linear indices and 2D spiral coordinates
 */

import type { Point, RingInfo } from './types.js';

/**
 * Calculate which ring a given pixel index belongs to
 * Ring 0: index 0 (1 pixel)
 * Ring 1: indices 1-8 (8 pixels)
 * Ring 2: indices 9-24 (16 pixels)
 * Ring n: starts at (2n-1)², has 8n pixels
 */
export function getRingForIndex(index: number): number {
	if (index === 0) return 0;
	// Ring n contains indices from (2n-1)² to (2n+1)² - 1
	// Solving: (2n-1)² <= index gives n <= (sqrt(index) + 1) / 2
	return Math.floor((Math.sqrt(index) + 1) / 2);
}

/**
 * Get info about a specific ring
 */
export function getRingInfo(ring: number): RingInfo {
	if (ring === 0) {
		return { ring: 0, startIndex: 0, endIndex: 0, pixelCount: 1 };
	}
	const startIndex = (2 * ring - 1) ** 2;
	const pixelCount = 8 * ring;
	const endIndex = startIndex + pixelCount - 1;
	return { ring, startIndex, endIndex, pixelCount };
}

/**
 * Get the image size needed to contain a given ring
 */
export function getImageSizeForRing(ring: number): number {
	return 2 * ring + 1;
}

/**
 * Get the total number of pixels up to and including a ring
 */
export function getTotalPixelsForRing(ring: number): number {
	return (2 * ring + 1) ** 2;
}

/**
 * Convert a linear spiral index to 2D coordinates
 * The spiral starts at center and goes: right → up → left → down → right...
 *
 * For a 5x5 image (center=2), ring 1 looks like:
 *       x: 0 1 2 3 4
 *    y:0   . 6 5 4 .
 *    y:1   7 . . . 3
 *    y:2   8 . 0 . 2
 *    y:3   9 . . . 1
 *    y:4   . A B C .  (A=10, B=11, C=12 would be ring 2)
 */
export function spiralToXY(index: number, imageSize: number): Point {
	const center = Math.floor(imageSize / 2);

	if (index === 0) {
		return { x: center, y: center };
	}

	// Find which ring this index belongs to
	const ring = getRingForIndex(index);
	const ringInfo = getRingInfo(ring);
	const posInRing = index - ringInfo.startIndex;

	// Each ring has 4 sides, each side has 2*ring pixels
	const sideLength = 2 * ring;
	const side = Math.floor(posInRing / sideLength);
	const offset = posInRing % sideLength;

	// Ring starts at (center+ring, center+ring-1) and goes:
	// Side 0: up along right edge (y decreases)
	// Side 1: left along top edge (x decreases)
	// Side 2: down along left edge (y increases)
	// Side 3: right along bottom edge (x increases)
	switch (side) {
		case 0: // Right side, going up: x=center+ring, y from center+ring-1 to center-ring
			return { x: center + ring, y: center + ring - 1 - offset };
		case 1: // Top side, going left: y=center-ring, x from center+ring-1 to center-ring
			return { x: center + ring - 1 - offset, y: center - ring };
		case 2: // Left side, going down: x=center-ring, y from center-ring+1 to center+ring
			return { x: center - ring, y: center - ring + 1 + offset };
		case 3: // Bottom side, going right: y=center+ring, x from center-ring+1 to center+ring-1
			return { x: center - ring + 1 + offset, y: center + ring };
		default:
			throw new Error(
				`Invalid side: ${side} for index ${index} (ring=${ring}, posInRing=${posInRing})`
			);
	}
}

/**
 * Convert 2D coordinates to a linear spiral index
 * Spiral pattern: center → right → up → left → down → right...
 */
export function xyToSpiral(x: number, y: number, imageSize: number): number {
	const center = Math.floor(imageSize / 2);
	const dx = x - center;
	const dy = y - center;

	// Ring 0 (center)
	if (dx === 0 && dy === 0) {
		return 0;
	}

	// Determine which ring based on Chebyshev distance
	const ring = Math.max(Math.abs(dx), Math.abs(dy));
	const ringStart = (2 * ring - 1) ** 2;
	const sideLength = 2 * ring;

	// The spiral goes: right side up, top side left, left side down, bottom side right
	// Side 0: x = ring, y from ring-1 down to -ring (right side, going up)
	// Side 1: y = -ring, x from ring-1 down to -ring (top side, going left)
	// Side 2: x = -ring, y from -ring+1 up to ring (left side, going down)
	// Side 3: y = ring, x from -ring+1 up to ring-1 (bottom side, going right)

	if (dx === ring && dy <= ring - 1 && dy >= -ring) {
		// Right side (going up): y goes from ring-1 to -ring
		const offset = ring - 1 - dy;
		return ringStart + offset;
	} else if (dy === -ring && dx <= ring - 1 && dx >= -ring) {
		// Top side (going left): x goes from ring-1 to -ring
		const offset = ring - 1 - dx;
		return ringStart + sideLength + offset;
	} else if (dx === -ring && dy >= -ring + 1 && dy <= ring) {
		// Left side (going down): y goes from -ring+1 to ring
		const offset = dy - (-ring + 1);
		return ringStart + 2 * sideLength + offset;
	} else {
		// Bottom side (going right): x goes from -ring+1 to ring-1
		const offset = dx - (-ring + 1);
		return ringStart + 3 * sideLength + offset;
	}
}

/**
 * Get all pixel indices in a specific ring
 */
export function getRingPixels(ring: number): number[] {
	const info = getRingInfo(ring);
	const pixels: number[] = [];
	for (let i = info.startIndex; i <= info.endIndex; i++) {
		pixels.push(i);
	}
	return pixels;
}

/**
 * Find the next available ring that can fit a record of given length
 */
export function findSpaceForRecord(
	currentRing: number,
	currentOffset: number,
	recordLength: number
): { ring: number; offset: number; needsExpansion: boolean } {
	let ring = currentRing;
	let offset = currentOffset;

	while (true) {
		const ringInfo = getRingInfo(ring);
		const availableInRing = ringInfo.pixelCount - offset;

		if (availableInRing >= recordLength) {
			return { ring, offset, needsExpansion: ring > currentRing };
		}

		// Move to next ring
		ring++;
		offset = 0;
	}
}

/**
 * Calculate coordinates for all pixels in a range
 */
export function getSpiralRange(startIndex: number, length: number, imageSize: number): Point[] {
	const points: Point[] = [];
	for (let i = 0; i < length; i++) {
		points.push(spiralToXY(startIndex + i, imageSize));
	}
	return points;
}
