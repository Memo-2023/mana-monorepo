import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const SIDEBAR_KEY = 'picture_sidebar_collapsed';

function loadInitialState(): boolean {
	if (!browser) return false;
	const saved = localStorage.getItem(SIDEBAR_KEY);
	return saved === 'true';
}

export const isSidebarCollapsed = writable<boolean>(loadInitialState());

export function toggleSidebar() {
	isSidebarCollapsed.update((collapsed) => {
		const newState = !collapsed;
		if (browser) {
			localStorage.setItem(SIDEBAR_KEY, String(newState));
		}
		return newState;
	});
}

export function setSidebarCollapsed(collapsed: boolean) {
	isSidebarCollapsed.set(collapsed);
	if (browser) {
		localStorage.setItem(SIDEBAR_KEY, String(collapsed));
	}
}
