/**
 * Boards Store - Svelte 5 Runes Version
 */

import type { Board, BoardWithCount } from '$lib/api/boards';

// State using Svelte 5 runes
let boards = $state<BoardWithCount[]>([]);
let currentBoard = $state<Board | null>(null);
let isLoadingBoards = $state(false);
let isLoadingBoard = $state(false);
let currentBoardsPage = $state(1);
let hasBoardsMore = $state(true);
let selectedBoard = $state<Board | null>(null);
let showCreateBoardModal = $state(false);
let showShareBoardModal = $state(false);
let shareBoardId = $state<string | null>(null);

// Derived state
const boardSettings = $derived({
  width: currentBoard?.canvasWidth || 2000,
  height: currentBoard?.canvasHeight || 1500,
  backgroundColor: currentBoard?.backgroundColor || '#ffffff',
});

export const boardsStore = {
  get boards() {
    return boards;
  },
  get currentBoard() {
    return currentBoard;
  },
  get isLoadingBoards() {
    return isLoadingBoards;
  },
  get isLoadingBoard() {
    return isLoadingBoard;
  },
  get currentBoardsPage() {
    return currentBoardsPage;
  },
  get hasBoardsMore() {
    return hasBoardsMore;
  },
  get selectedBoard() {
    return selectedBoard;
  },
  get showCreateBoardModal() {
    return showCreateBoardModal;
  },
  get showShareBoardModal() {
    return showShareBoardModal;
  },
  get shareBoardId() {
    return shareBoardId;
  },
  get boardSettings() {
    return boardSettings;
  },

  setBoards(newBoards: BoardWithCount[]) {
    boards = newBoards;
  },

  appendBoards(newBoards: BoardWithCount[]) {
    boards = [...boards, ...newBoards];
  },

  addBoard(board: BoardWithCount) {
    boards = [board, ...boards];
  },

  updateBoardInList(boardId: string, updates: Partial<Board>) {
    boards = boards.map((board) => (board.id === boardId ? { ...board, ...updates } : board));
  },

  removeBoardFromList(boardId: string) {
    boards = boards.filter((board) => board.id !== boardId);
  },

  incrementBoardItemCount(boardId: string) {
    boards = boards.map((board) =>
      board.id === boardId ? { ...board, itemCount: board.itemCount + 1 } : board,
    );
  },

  decrementBoardItemCount(boardId: string) {
    boards = boards.map((board) =>
      board.id === boardId ? { ...board, itemCount: Math.max(0, board.itemCount - 1) } : board,
    );
  },

  setCurrentBoard(board: Board | null) {
    currentBoard = board;
  },

  setLoadingBoards(loading: boolean) {
    isLoadingBoards = loading;
  },

  setLoadingBoard(loading: boolean) {
    isLoadingBoard = loading;
  },

  setCurrentBoardsPage(page: number) {
    currentBoardsPage = page;
  },

  setHasBoardsMore(more: boolean) {
    hasBoardsMore = more;
  },

  setSelectedBoard(board: Board | null) {
    selectedBoard = board;
  },

  setShowCreateBoardModal(show: boolean) {
    showCreateBoardModal = show;
  },

  setShowShareBoardModal(show: boolean) {
    showShareBoardModal = show;
  },

  setShareBoardId(id: string | null) {
    shareBoardId = id;
  },

  resetBoardsState() {
    boards = [];
    currentBoardsPage = 1;
    hasBoardsMore = true;
  },
};

// Export individual getters for backwards compatibility
export function getBoards() {
  return boards;
}

export function getCurrentBoard() {
  return currentBoard;
}

export function getBoardSettings() {
  return boardSettings;
}
