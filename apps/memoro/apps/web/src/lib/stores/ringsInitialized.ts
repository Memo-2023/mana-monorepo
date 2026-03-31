import { writable } from 'svelte/store';

// Tracks if the rings have been shown already in this session
// Used to prevent intro animation when navigating between pages with rings
export const ringsInitialized = writable(false);
