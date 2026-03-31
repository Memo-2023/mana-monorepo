import { useBottomBarStore } from '../store/bottomBarStore';

const COLLAPSED_ICON_SIZE = 48;

/**
 * Returns the total height of all visible bottom bars.
 * Use this for content padding to avoid bars covering content.
 *
 * Computes the value inside the selector so zustand only triggers
 * re-renders when the actual number changes (not on every bars reference change).
 */
export function useBottomBarInset(): number {
	return useBottomBarStore((s) => {
		let totalHeight = 0;
		for (const bar of Object.values(s.bars)) {
			if (bar.visible === false) continue;
			if (s.collapsedIds.has(bar.id)) {
				totalHeight += COLLAPSED_ICON_SIZE;
			} else {
				totalHeight += s.barHeights[bar.id] || 0;
			}
		}
		return totalHeight;
	});
}
