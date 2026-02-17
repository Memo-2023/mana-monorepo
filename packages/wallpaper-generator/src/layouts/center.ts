/**
 * Center Layout
 *
 * Places image centered on the wallpaper.
 */

import type { CenterLayout } from '../types.js';

export interface CenterPosition {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Calculate center position for image
 */
export function calculateCenterPosition(
	canvasWidth: number,
	canvasHeight: number,
	imageWidth: number,
	imageHeight: number,
	layout: CenterLayout
): CenterPosition {
	const scale = layout.scale ?? 1.0;
	const offset = layout.offset ?? [0, 0];

	const scaledWidth = imageWidth * scale;
	const scaledHeight = imageHeight * scale;

	// Center the image
	const x = (canvasWidth - scaledWidth) / 2 + offset[0];
	const y = (canvasHeight - scaledHeight) / 2 + offset[1];

	return {
		x: Math.round(x),
		y: Math.round(y),
		width: Math.round(scaledWidth),
		height: Math.round(scaledHeight),
	};
}

/**
 * Draw image centered on canvas (browser)
 */
export function drawCentered(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement | HTMLCanvasElement,
	canvasWidth: number,
	canvasHeight: number,
	layout: CenterLayout
): void {
	const pos = calculateCenterPosition(canvasWidth, canvasHeight, image.width, image.height, layout);

	// Use crisp rendering for pixel art / QR codes
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(image, pos.x, pos.y, pos.width, pos.height);
}
