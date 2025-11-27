/**
 * View Store - Svelte 5 Runes Version
 */

import { browser } from '$app/environment';

export type ViewMode = 'single' | 'grid3' | 'grid5';

const VIEW_MODE_KEY = 'picture_view_mode';

function loadInitialViewMode(): ViewMode {
	if (!browser) {
		return 'grid3';
	}
	const saved = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
	return saved || 'grid3';
}

let viewMode = $state<ViewMode>(loadInitialViewMode());

export const viewStore = {
	get mode() {
		return viewMode;
	},

	set(mode: ViewMode) {
		viewMode = mode;
		if (browser) {
			localStorage.setItem(VIEW_MODE_KEY, mode);
		}
	},

	cycle() {
		const modes: ViewMode[] = ['single', 'grid3', 'grid5'];
		const currentIndex = modes.indexOf(viewMode);
		const nextMode = modes[(currentIndex + 1) % modes.length];
		viewStore.set(nextMode);
	},

	setSingle() {
		viewStore.set('single');
	},

	setGrid3() {
		viewStore.set('grid3');
	},

	setGrid5() {
		viewStore.set('grid5');
	},
};

// Export for backwards compatibility
export function setViewMode(mode: ViewMode) {
	viewStore.set(mode);
}

export function cycleViewMode() {
	viewStore.cycle();
}

export function getViewMode() {
	return viewMode;
}

// Re-export for compatibility
export { viewMode };
