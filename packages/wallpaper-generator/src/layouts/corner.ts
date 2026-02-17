/**
 * Corner Layout
 *
 * Places image in one of the four corners.
 */

import type { CornerLayout } from '../types.js';

export interface CornerPositionResult {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Calculate corner position for image
 */
export function calculateCornerPosition(
	canvasWidth: number,
	canvasHeight: number,
	imageWidth: number,
	imageHeight: number,
	layout: CornerLayout
): CornerPositionResult {
	const scale = layout.scale ?? 0.3;
	const padding = layout.padding ?? 40;
	const position = layout.position ?? 'bottom-right';

	const scaledWidth = imageWidth * scale;
	const scaledHeight = imageHeight * scale;

	let x: number;
	let y: number;

	switch (position) {
		case 'top-left':
			x = padding;
			y = padding;
			break;
		case 'top-right':
			x = canvasWidth - scaledWidth - padding;
			y = padding;
			break;
		case 'bottom-left':
			x = padding;
			y = canvasHeight - scaledHeight - padding;
			break;
		case 'bottom-right':
		default:
			x = canvasWidth - scaledWidth - padding;
			y = canvasHeight - scaledHeight - padding;
			break;
	}

	return {
		x: Math.round(x),
		y: Math.round(y),
		width: Math.round(scaledWidth),
		height: Math.round(scaledHeight),
	};
}

/**
 * Draw image in corner on canvas (browser)
 */
export function drawCorner(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement | HTMLCanvasElement,
	canvasWidth: number,
	canvasHeight: number,
	layout: CornerLayout
): void {
	const pos = calculateCornerPosition(canvasWidth, canvasHeight, image.width, image.height, layout);

	// Use crisp rendering for pixel art / QR codes
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(image, pos.x, pos.y, pos.width, pos.height);
}
