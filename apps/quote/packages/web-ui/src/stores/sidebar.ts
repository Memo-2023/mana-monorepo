import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const SIDEBAR_KEY = 'sidebar-collapsed';

function createSidebarStore() {
	const stored = browser ? localStorage.getItem(SIDEBAR_KEY) === 'true' : false;
	const { subscribe, set, update } = writable<boolean>(stored);

	return {
		subscribe,
		toggle: () =>
			update((v) => {
				const newValue = !v;
				if (browser) localStorage.setItem(SIDEBAR_KEY, String(newValue));
				return newValue;
			}),
		set: (value: boolean) => {
			if (browser) localStorage.setItem(SIDEBAR_KEY, String(value));
			set(value);
		},
	};
}

export const isSidebarCollapsed = createSidebarStore();
