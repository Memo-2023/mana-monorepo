// Zentrale Svelte Stores für Spielstatus, Leveldaten etc.
import { writable } from 'svelte/store';

export const gameMode = writable('play'); // 'play' oder 'editor'
export const currentLevel = writable(null);
export const playerStats = writable({ attempts: 0 });
export const levels = writable([]); // initial aus levels.js/json
