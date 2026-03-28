import { writable, derived } from 'svelte/store';
import type { Board } from '$lib/api/boards';

/**
 * UI-only state for board editing.
 * Board list reads are handled by useLiveQuery hooks in queries.ts.
 */

// Current board being edited (on the canvas page)
export const currentBoard = writable<Board | null>(null);

// Create board modal
export const showCreateBoardModal = writable(false);

// Share board modal
export const showShareBoardModal = writable(false);
export const shareBoardId = writable<string | null>(null);

// Board settings (for canvas)
export const boardSettings = derived(currentBoard, ($currentBoard) => ({
	width: $currentBoard?.canvasWidth || 2000,
	height: $currentBoard?.canvasHeight || 1500,
	backgroundColor: $currentBoard?.backgroundColor || '#ffffff',
}));
