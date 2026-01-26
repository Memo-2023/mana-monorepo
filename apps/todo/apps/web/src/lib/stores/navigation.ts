import { writable } from 'svelte/store';

export const isSidebarMode = writable(false);
export const isNavCollapsed = writable(false);
export const isToolbarCollapsed = writable(true);
