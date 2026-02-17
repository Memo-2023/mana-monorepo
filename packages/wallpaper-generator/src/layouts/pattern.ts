/**
 * Pattern Layout
 *
 * Tiles image across the wallpaper as a repeating pattern.
 */

import type { PatternLayout } from '../types.js';

export interface PatternTile {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Calculate tile positions for pattern
 */
export function calculatePatternTiles(
	canvasWidth: number,
	canvasHeight: number,
	imageWidth: number,
	imageHeight: number,
	layout: PatternLayout
): PatternTile[] {
	const scale = layout.scale ?? 0.5;
	const gap = layout.gap ?? 20;

	const tileWidth = imageWidth * scale;
	const tileHeight = imageHeight * scale;

	const tiles: PatternTile[] = [];

	// Calculate how many tiles fit (with overlap to cover edges)
	const cols = Math.ceil(canvasWidth / (tileWidth + gap)) + 1;
	const rows = Math.ceil(canvasHeight / (tileHeight + gap)) + 1;

	// Center the pattern grid
	const totalPatternWidth = cols * tileWidth + (cols - 1) * gap;
	const totalPatternHeight = rows * tileHeight + (rows - 1) * gap;

	const startX = (canvasWidth - totalPatternWidth) / 2;
	const startY = (canvasHeight - totalPatternHeight) / 2;

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			tiles.push({
				x: Math.round(startX + col * (tileWidth + gap)),
				y: Math.round(startY + row * (tileHeight + gap)),
				width: Math.round(tileWidth),
				height: Math.round(tileHeight),
			});
		}
	}

	return tiles;
}

/**
 * Draw pattern on canvas (browser)
 */
export function drawPattern(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement | HTMLCanvasElement,
	canvasWidth: number,
	canvasHeight: number,
	layout: PatternLayout
): void {
	const opacity = layout.opacity ?? 0.15;
	const tiles = calculatePatternTiles(canvasWidth, canvasHeight, image.width, image.height, layout);

	// Save current state
	ctx.save();

	// Set opacity for pattern
	ctx.globalAlpha = opacity;

	// Use crisp rendering for pixel art / QR codes
	ctx.imageSmoothingEnabled = false;

	// Draw all tiles
	for (const tile of tiles) {
		ctx.drawImage(image, tile.x, tile.y, tile.width, tile.height);
	}

	// Restore state
	ctx.restore();
}
