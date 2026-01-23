/**
 * Navigation Store - Manages navigation state
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const SIDEBAR_MODE_KEY = 'clock_sidebar_mode';
const NAV_COLLAPSED_KEY = 'clock_nav_collapsed';

// Check localStorage for initial values
function getInitialSidebarMode(): boolean {
	if (!browser) return false;
	return localStorage.getItem(SIDEBAR_MODE_KEY) === 'true';
}

function getInitialCollapsed(): boolean {
	if (!browser) return false;
	return localStorage.getItem(NAV_COLLAPSED_KEY) === 'true';
}

// Create stores
export const isSidebarMode = writable(getInitialSidebarMode());
export const isNavCollapsed = writable(getInitialCollapsed());

// Subscribe to persist changes
if (browser) {
	isSidebarMode.subscribe((value) => {
		localStorage.setItem(SIDEBAR_MODE_KEY, String(value));
	});

	isNavCollapsed.subscribe((value) => {
		localStorage.setItem(NAV_COLLAPSED_KEY, String(value));
	});
}
