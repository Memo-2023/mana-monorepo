import { create } from 'zustand';
import type { BottomBarConfig } from '../types';

interface BottomBarState {
	bars: Record<string, BottomBarConfig>;
	collapsedIds: Set<string>;
	barHeights: Record<string, number>;
	/** Incremented on content-only updates to trigger re-renders without new bars object */
	contentVersion: number;

	registerBar: (config: BottomBarConfig) => void;
	unregisterBar: (id: string) => void;
	updateBarContent: (id: string, content: React.ReactNode) => void;
	toggleCollapse: (id: string) => void;
	setBarHeight: (id: string, height: number) => void;
}

export const useBottomBarStore = create<BottomBarState>((set, get) => ({
	bars: {},
	collapsedIds: new Set(),
	barHeights: {},
	contentVersion: 0,

	registerBar: (config) => {
		const existing = get().bars[config.id];
		if (existing) {
			// Bar already registered - check if metadata changed
			if (
				existing.priority === config.priority &&
				existing.collapsedIcon === config.collapsedIcon &&
				existing.collapsible === config.collapsible &&
				existing.visible === config.visible &&
				existing.keyboardBehavior === config.keyboardBehavior
			) {
				// Only content changed - skip full state update
				return;
			}
		}
		set((state) => ({
			bars: { ...state.bars, [config.id]: config },
		}));
	},

	unregisterBar: (id) => {
		if (!get().bars[id]) return;
		set((state) => {
			const { [id]: _, ...rest } = state.bars;
			const { [id]: __, ...restHeights } = state.barHeights;
			const newCollapsed = new Set(state.collapsedIds);
			newCollapsed.delete(id);
			return { bars: rest, barHeights: restHeights, collapsedIds: newCollapsed };
		});
	},

	updateBarContent: (id, content) => {
		const bars = get().bars;
		if (!bars[id]) return;
		set((state) => ({
			bars: { ...state.bars, [id]: { ...state.bars[id], content } },
			contentVersion: state.contentVersion + 1,
		}));
	},

	toggleCollapse: (id) => {
		set((state) => {
			const bar = state.bars[id];
			if (!bar || bar.collapsible === false) return state;
			const newCollapsed = new Set(state.collapsedIds);
			if (newCollapsed.has(id)) {
				newCollapsed.delete(id);
			} else {
				newCollapsed.add(id);
			}
			return { collapsedIds: newCollapsed };
		});
	},

	setBarHeight: (id, height) => {
		if (get().barHeights[id] === height) return;
		set((state) => ({
			barHeights: { ...state.barHeights, [id]: height },
		}));
	},
}));
