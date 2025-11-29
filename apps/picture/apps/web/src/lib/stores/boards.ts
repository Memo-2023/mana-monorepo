import { writable, derived } from 'svelte/store';
import type { Board, BoardWithCount } from '$lib/api/boards';

// Current boards list
export const boards = writable<BoardWithCount[]>([]);

// Current board being edited
export const currentBoard = writable<Board | null>(null);

// Loading states
export const isLoadingBoards = writable(false);
export const isLoadingBoard = writable(false);

// Pagination
export const currentBoardsPage = writable(1);
export const hasBoardsMore = writable(true);

// Selected board (for actions like delete, duplicate)
export const selectedBoard = writable<Board | null>(null);

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

// Helper functions for board management
export function resetBoardsState() {
	boards.set([]);
	currentBoardsPage.set(1);
	hasBoardsMore.set(true);
}

export function addBoard(board: BoardWithCount) {
	boards.update((current) => [board, ...current]);
}

export function updateBoardInList(boardId: string, updates: Partial<Board>) {
	boards.update((current) =>
		current.map((board) => (board.id === boardId ? { ...board, ...updates } : board))
	);
}

export function removeBoardFromList(boardId: string) {
	boards.update((current) => current.filter((board) => board.id !== boardId));
}

export function incrementBoardItemCount(boardId: string) {
	boards.update((current) =>
		current.map((board) =>
			board.id === boardId ? { ...board, itemCount: board.itemCount + 1 } : board
		)
	);
}

export function decrementBoardItemCount(boardId: string) {
	boards.update((current) =>
		current.map((board) =>
			board.id === boardId ? { ...board, itemCount: Math.max(0, board.itemCount - 1) } : board
		)
	);
}
