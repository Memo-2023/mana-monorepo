/**
 * Navigation store for sidebar mode state
 */

import { writable } from 'svelte/store';

export const isSidebarMode = writable(false);
export const isNavCollapsed = writable(false);
