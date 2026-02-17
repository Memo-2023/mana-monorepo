/**
 * Gradient Background Renderer
 *
 * Creates linear gradients on canvas.
 */

import { parseHexColor } from './solid.js';

/**
 * Calculate gradient end points from angle
 * Angle: 0 = bottom to top, 90 = left to right, 180 = top to bottom
 */
function getGradientCoordinates(
	width: number,
	height: number,
	angleDegrees: number
): { x0: number; y0: number; x1: number; y1: number } {
	// Convert angle to radians (CSS gradient angles: 0deg = to top, 180deg = to bottom)
	const angleRad = ((angleDegrees - 90) * Math.PI) / 180;

	// Calculate the diagonal length for proper coverage
	const diagonal = Math.sqrt(width * width + height * height);

	const centerX = width / 2;
	const centerY = height / 2;

	const dx = Math.cos(angleRad) * diagonal;
	const dy = Math.sin(angleRad) * diagonal;

	return {
		x0: centerX - dx / 2,
		y0: centerY - dy / 2,
		x1: centerX + dx / 2,
		y1: centerY + dy / 2,
	};
}

/**
 * Fill canvas with linear gradient (browser)
 */
export function fillGradient(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	colors: string[],
	angle = 180
): void {
	if (colors.length === 0) {
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, width, height);
		return;
	}

	if (colors.length === 1) {
		ctx.fillStyle = colors[0];
		ctx.fillRect(0, 0, width, height);
		return;
	}

	const { x0, y0, x1, y1 } = getGradientCoordinates(width, height, angle);
	const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

	// Distribute color stops evenly
	colors.forEach((color, index) => {
		const stop = index / (colors.length - 1);
		gradient.addColorStop(stop, color);
	});

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);
}

/**
 * Interpolate between two colors
 */
function interpolateColor(
	color1: { r: number; g: number; b: number },
	color2: { r: number; g: number; b: number },
	t: number
): { r: number; g: number; b: number } {
	return {
		r: Math.round(color1.r + (color2.r - color1.r) * t),
		g: Math.round(color1.g + (color2.g - color1.g) * t),
		b: Math.round(color1.b + (color2.b - color1.b) * t),
	};
}

/**
 * Get color at position in gradient
 */
function getGradientColorAt(
	colors: { r: number; g: number; b: number }[],
	position: number
): { r: number; g: number; b: number } {
	if (colors.length === 0) return { r: 0, g: 0, b: 0 };
	if (colors.length === 1) return colors[0];
	if (position <= 0) return colors[0];
	if (position >= 1) return colors[colors.length - 1];

	const scaledPosition = position * (colors.length - 1);
	const index = Math.floor(scaledPosition);
	const t = scaledPosition - index;

	return interpolateColor(colors[index], colors[Math.min(index + 1, colors.length - 1)], t);
}

/**
 * Create gradient buffer for Node.js/Sharp
 */
export function createGradientBuffer(
	width: number,
	height: number,
	colors: string[],
	angle = 180
): Uint8Array {
	const buffer = new Uint8Array(width * height * 3);

	if (colors.length === 0) {
		return buffer; // All zeros (black)
	}

	const parsedColors = colors.map(parseHexColor);

	if (colors.length === 1) {
		const color = parsedColors[0];
		for (let i = 0; i < width * height; i++) {
			buffer[i * 3] = color.r;
			buffer[i * 3 + 1] = color.g;
			buffer[i * 3 + 2] = color.b;
		}
		return buffer;
	}

	// Convert angle to radians for calculation
	const angleRad = ((angle - 90) * Math.PI) / 180;
	const cos = Math.cos(angleRad);
	const sin = Math.sin(angleRad);

	// Calculate the projection for each pixel
	const diagonal = Math.sqrt(width * width + height * height);
	const centerX = width / 2;
	const centerY = height / 2;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			// Calculate position along gradient axis
			const dx = x - centerX;
			const dy = y - centerY;
			const projection = (dx * cos + dy * sin) / diagonal + 0.5;

			const color = getGradientColorAt(parsedColors, Math.max(0, Math.min(1, projection)));
			const i = (y * width + x) * 3;
			buffer[i] = color.r;
			buffer[i + 1] = color.g;
			buffer[i + 2] = color.b;
		}
	}

	return buffer;
}
