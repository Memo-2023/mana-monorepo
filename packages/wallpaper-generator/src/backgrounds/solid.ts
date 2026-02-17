/**
 * Solid Background Renderer
 *
 * Fills canvas with a solid color.
 */

/**
 * Parse hex color to RGB values
 */
export function parseHexColor(hex: string): { r: number; g: number; b: number } {
	// Remove # if present
	const cleanHex = hex.replace('#', '');

	// Handle shorthand hex (e.g., #fff)
	const fullHex =
		cleanHex.length === 3
			? cleanHex
					.split('')
					.map((c) => c + c)
					.join('')
			: cleanHex;

	const r = parseInt(fullHex.substring(0, 2), 16);
	const g = parseInt(fullHex.substring(2, 4), 16);
	const b = parseInt(fullHex.substring(4, 6), 16);

	return { r, g, b };
}

/**
 * Fill canvas with solid color (browser)
 */
export function fillSolid(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	color: string
): void {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, width, height);
}

/**
 * Create solid color buffer for Node.js/Sharp
 */
export function createSolidBuffer(width: number, height: number, color: string): Uint8Array {
	const { r, g, b } = parseHexColor(color);
	const buffer = new Uint8Array(width * height * 3);

	for (let i = 0; i < width * height; i++) {
		buffer[i * 3] = r;
		buffer[i * 3 + 1] = g;
		buffer[i * 3 + 2] = b;
	}

	return buffer;
}
