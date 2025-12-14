/**
 * Skeleton utility functions
 */

/**
 * Calculate opacity for cascading fade effect in skeleton lists
 * @param index Current item index
 * @param count Total number of items
 * @param minOpacity Minimum opacity (default: 0.3)
 * @returns Opacity value between minOpacity and 1
 */
export function calculateFadeOpacity(
	index: number,
	count: number,
	minOpacity: number = 0.3
): number {
	const fadeStep = (1 - minOpacity) / Math.max(count - 1, 1);
	return Math.max(minOpacity, 1 - index * fadeStep);
}
