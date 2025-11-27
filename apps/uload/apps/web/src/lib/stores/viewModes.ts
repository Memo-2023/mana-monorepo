import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ViewMode = 'cards' | 'list' | 'stats';

interface ViewModes {
	tags: ViewMode;
	links: ViewMode;
	dashboard: ViewMode;
}

const defaultViewModes: ViewModes = {
	tags: 'cards',
	links: 'list',
	dashboard: 'list',
};

function createViewModes() {
	const initialValue = browser
		? JSON.parse(localStorage.getItem('viewModes') || JSON.stringify(defaultViewModes))
		: defaultViewModes;

	const { subscribe, set, update } = writable<ViewModes>(initialValue);

	return {
		subscribe,
		setTagsView: (view: ViewMode) => {
			update((modes) => {
				const newModes = { ...modes, tags: view };
				if (browser) {
					localStorage.setItem('viewModes', JSON.stringify(newModes));
				}
				return newModes;
			});
		},
		setLinksView: (view: ViewMode) => {
			update((modes) => {
				const newModes = { ...modes, links: view };
				if (browser) {
					localStorage.setItem('viewModes', JSON.stringify(newModes));
				}
				return newModes;
			});
		},
		setDashboardView: (view: ViewMode) => {
			update((modes) => {
				const newModes = { ...modes, dashboard: view };
				if (browser) {
					localStorage.setItem('viewModes', JSON.stringify(newModes));
				}
				return newModes;
			});
		},
		reset: () => {
			set(defaultViewModes);
			if (browser) {
				localStorage.setItem('viewModes', JSON.stringify(defaultViewModes));
			}
		},
	};
}

export const viewModes = createViewModes();
