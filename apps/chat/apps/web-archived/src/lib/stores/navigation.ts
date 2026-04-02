import { writable } from 'svelte/store';
import { createSimpleNavigationStores } from '@manacore/shared-stores';

export const { isNavCollapsed } = createSimpleNavigationStores();

/** Whether the app is in sidebar mode (e.g., embedded in another app) */
export const isSidebarMode = writable(false);
