import { writable } from 'svelte/store';

// Store for sidebar mode (pill vs sidebar navigation)
export const isSidebarMode = writable(false);

// Store for collapsed state
export const isNavCollapsed = writable(false);
