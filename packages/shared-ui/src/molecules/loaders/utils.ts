/**
 * Skeleton utility functions
 */

/**
 * Calculate opacity for cascading fade effect in skeleton lists
 *
 * Creates a smooth fade from 1 at the first item to minOpacity at the last item.
 *
 * @param index Current item index (0-based)
 * @param count Total number of items
 * @param minOpacity Minimum opacity at the last item (default: 0.3)
 * @returns Opacity value between minOpacity and 1
 *
 * @example
 * ```ts
 * // For a list of 5 items with minOpacity 0.3:
 * // index 0 → 1.0
 * // index 1 → 0.825
 * // index 2 → 0.65
 * // index 3 → 0.475
 * // index 4 → 0.3
 * calculateFadeOpacity(0, 5, 0.3) // 1.0
 * calculateFadeOpacity(4, 5, 0.3) // 0.3
 * ```
 */
export function calculateFadeOpacity(index: number, count: number, minOpacity = 0.3): number {
	const fadeStep = (1 - minOpacity) / Math.max(count - 1, 1);
	return Math.max(minOpacity, 1 - index * fadeStep);
}
