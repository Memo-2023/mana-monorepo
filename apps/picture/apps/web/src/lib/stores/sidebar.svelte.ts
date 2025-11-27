/**
 * Sidebar Store - Svelte 5 Runes Version
 */

import { browser } from '$app/environment';

const SIDEBAR_KEY = 'picture_sidebar_collapsed';

function loadInitialState(): boolean {
	if (!browser) return false;
	const saved = localStorage.getItem(SIDEBAR_KEY);
	return saved === 'true';
}

let isSidebarCollapsed = $state(loadInitialState());

export const sidebarStore = {
	get isCollapsed() {
		return isSidebarCollapsed;
	},

	toggle() {
		isSidebarCollapsed = !isSidebarCollapsed;
		if (browser) {
			localStorage.setItem(SIDEBAR_KEY, String(isSidebarCollapsed));
		}
	},

	setCollapsed(collapsed: boolean) {
		isSidebarCollapsed = collapsed;
		if (browser) {
			localStorage.setItem(SIDEBAR_KEY, String(collapsed));
		}
	},

	expand() {
		isSidebarCollapsed = false;
		if (browser) {
			localStorage.setItem(SIDEBAR_KEY, 'false');
		}
	},

	collapse() {
		isSidebarCollapsed = true;
		if (browser) {
			localStorage.setItem(SIDEBAR_KEY, 'true');
		}
	},
};

// Export for backwards compatibility
export function getIsSidebarCollapsed() {
	return isSidebarCollapsed;
}

export function toggleSidebar() {
	sidebarStore.toggle();
}

export function setSidebarCollapsed(collapsed: boolean) {
	sidebarStore.setCollapsed(collapsed);
}

// Re-export the writable-like interface for backward compatibility
export { isSidebarCollapsed };
