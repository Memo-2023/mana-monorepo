import { writable } from 'svelte/store';
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

export const viewMode = writable<ViewMode>(loadInitialViewMode());

export function setViewMode(mode: ViewMode) {
	viewMode.set(mode);
	if (browser) {
		localStorage.setItem(VIEW_MODE_KEY, mode);
	}
}

export function cycleViewMode() {
	viewMode.update((current) => {
		const modes: ViewMode[] = ['single', 'grid3', 'grid5'];
		const currentIndex = modes.indexOf(current);
		const nextMode = modes[(currentIndex + 1) % modes.length];
		if (browser) {
			localStorage.setItem(VIEW_MODE_KEY, nextMode);
		}
		return nextMode;
	});
}
