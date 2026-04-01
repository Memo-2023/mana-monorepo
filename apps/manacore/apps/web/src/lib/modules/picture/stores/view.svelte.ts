/**
 * Picture View Store — Manages gallery view mode (grid size).
 */

import { browser } from '$app/environment';
import type { ViewMode } from '../types';

const VIEW_MODE_KEY = 'manacore-picture-view-mode';

let viewMode = $state<ViewMode>('grid3');

export const pictureViewStore = {
	get viewMode() {
		return viewMode;
	},

	initialize() {
		if (!browser) return;
		const saved = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
		if (saved) viewMode = saved;
	},

	setViewMode(mode: ViewMode) {
		viewMode = mode;
		if (browser) {
			localStorage.setItem(VIEW_MODE_KEY, mode);
		}
	},

	cycleViewMode() {
		const modes: ViewMode[] = ['single', 'grid3', 'grid5'];
		const currentIndex = modes.indexOf(viewMode);
		const nextMode = modes[(currentIndex + 1) % modes.length];
		viewMode = nextMode;
		if (browser) {
			localStorage.setItem(VIEW_MODE_KEY, nextMode);
		}
	},
};
