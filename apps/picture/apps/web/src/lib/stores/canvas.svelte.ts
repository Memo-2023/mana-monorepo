/**
 * Canvas Store - Svelte 5 Runes Version
 */

import type { BoardItem, BoardImageItem, BoardTextItem } from '$lib/api/boardItems';
import { isImageItem, isTextItem } from '$lib/api/boardItems';

// Canvas items (images and texts on the board)
let canvasItems = $state<BoardItem[]>([]);

// Selected items on canvas
let selectedItemIds = $state<string[]>([]);

// Canvas view state
let canvasZoom = $state(1);
let canvasPan = $state({ x: 0, y: 0 });

// Canvas interaction mode
export type CanvasMode = 'select' | 'pan' | 'draw';
let canvasMode = $state<CanvasMode>('select');

// Canvas tools
let showGrid = $state(true);
let snapToGrid = $state(false);
let gridSize = $state(20);

// UI state
let showPropertiesPanel = $state(false);

// Text editing state
let editingTextId = $state<string | null>(null);

// Loading state
let isLoadingCanvasItems = $state(false);

// History for undo/redo
interface HistoryState {
  items: BoardItem[];
  timestamp: number;
}

let canvasHistory = $state<HistoryState[]>([]);
let canvasHistoryIndex = $state(-1);

// Derived states
const selectedItems = $derived(canvasItems.filter((item) => selectedItemIds.includes(item.id)));

const selectedTextItems = $derived(selectedItems.filter(isTextItem));

const selectedImageItems = $derived(selectedItems.filter(isImageItem));

const hasMixedSelection = $derived(selectedTextItems.length > 0 && selectedImageItems.length > 0);

const hasSelection = $derived(selectedItemIds.length > 0);

const isEditingText = $derived(editingTextId !== null);

const canUndo = $derived(canvasHistoryIndex > 0);

const canRedo = $derived(canvasHistoryIndex < canvasHistory.length - 1);

export const canvasStore = {
  // Getters
  get items() {
    return canvasItems;
  },
  get selectedItemIds() {
    return selectedItemIds;
  },
  get selectedItems() {
    return selectedItems;
  },
  get selectedTextItems() {
    return selectedTextItems;
  },
  get selectedImageItems() {
    return selectedImageItems;
  },
  get hasMixedSelection() {
    return hasMixedSelection;
  },
  get hasSelection() {
    return hasSelection;
  },
  get zoom() {
    return canvasZoom;
  },
  get pan() {
    return canvasPan;
  },
  get mode() {
    return canvasMode;
  },
  get showGrid() {
    return showGrid;
  },
  get snapToGrid() {
    return snapToGrid;
  },
  get gridSize() {
    return gridSize;
  },
  get showPropertiesPanel() {
    return showPropertiesPanel;
  },
  get editingTextId() {
    return editingTextId;
  },
  get isEditingText() {
    return isEditingText;
  },
  get isLoading() {
    return isLoadingCanvasItems;
  },
  get canUndo() {
    return canUndo;
  },
  get canRedo() {
    return canRedo;
  },

  // Setters
  setItems(items: BoardItem[]) {
    canvasItems = items;
  },

  setLoading(loading: boolean) {
    isLoadingCanvasItems = loading;
  },

  setMode(mode: CanvasMode) {
    canvasMode = mode;
  },

  setShowGrid(show: boolean) {
    showGrid = show;
  },

  setSnapToGrid(snap: boolean) {
    snapToGrid = snap;
  },

  setGridSize(size: number) {
    gridSize = size;
  },

  setShowPropertiesPanel(show: boolean) {
    showPropertiesPanel = show;
  },

  // Item management
  addItem(item: BoardItem) {
    canvasItems = [...canvasItems, item];
    saveToHistory();
  },

  updateItem(id: string, updates: Partial<BoardItem>) {
    canvasItems = canvasItems.map((item) => (item.id === id ? { ...item, ...updates } : item));
    saveToHistory();
  },

  removeItem(id: string) {
    canvasItems = canvasItems.filter((item) => item.id !== id);
    selectedItemIds = selectedItemIds.filter((itemId) => itemId !== id);
    saveToHistory();
  },

  removeSelectedItems() {
    const ids = selectedItemIds;
    canvasItems = canvasItems.filter((item) => !ids.includes(item.id));
    selectedItemIds = [];
    saveToHistory();
  },

  // Selection management
  selectItem(id: string, multi = false) {
    if (multi) {
      if (selectedItemIds.includes(id)) {
        selectedItemIds = selectedItemIds.filter((itemId) => itemId !== id);
      } else {
        selectedItemIds = [...selectedItemIds, id];
      }
    } else {
      selectedItemIds = [id];
    }
  },

  selectAll() {
    selectedItemIds = canvasItems.map((item) => item.id);
  },

  deselectAll() {
    selectedItemIds = [];
  },

  // Text editing
  startEditingText(id: string) {
    editingTextId = id;
  },

  stopEditingText() {
    editingTextId = null;
  },

  // Z-index management
  bringToFront(id: string) {
    const maxZIndex = Math.max(...canvasItems.map((item) => item.zIndex));
    canvasStore.updateItem(id, { zIndex: maxZIndex + 1 });
  },

  sendToBack(id: string) {
    const minZIndex = Math.min(...canvasItems.map((item) => item.zIndex));
    canvasStore.updateItem(id, { zIndex: minZIndex - 1 });
  },

  moveForward(id: string) {
    const item = canvasItems.find((i) => i.id === id);
    if (!item) return;

    const itemsAbove = canvasItems.filter((i) => i.zIndex > item.zIndex);
    if (itemsAbove.length === 0) return;

    const nextZIndex = Math.min(...itemsAbove.map((i) => i.zIndex));
    canvasStore.updateItem(id, { zIndex: nextZIndex + 0.5 });
  },

  moveBackward(id: string) {
    const item = canvasItems.find((i) => i.id === id);
    if (!item) return;

    const itemsBelow = canvasItems.filter((i) => i.zIndex < item.zIndex);
    if (itemsBelow.length === 0) return;

    const prevZIndex = Math.max(...itemsBelow.map((i) => i.zIndex));
    canvasStore.updateItem(id, { zIndex: prevZIndex - 0.5 });
  },

  // Zoom functions
  zoomIn() {
    canvasZoom = Math.min(canvasZoom * 1.2, 5);
  },

  zoomOut() {
    canvasZoom = Math.max(canvasZoom / 1.2, 0.1);
  },

  setZoom(zoom: number) {
    canvasZoom = zoom;
  },

  setPan(pan: { x: number; y: number }) {
    canvasPan = pan;
  },

  zoomToFit(containerWidth: number, containerHeight: number, boardWidth: number, boardHeight: number) {
    const scaleX = containerWidth / boardWidth;
    const scaleY = containerHeight / boardHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    canvasZoom = scale;
    canvasPan = { x: 0, y: 0 };
  },

  resetZoom() {
    canvasZoom = 1;
    canvasPan = { x: 0, y: 0 };
  },

  // History management
  undo() {
    if (canvasHistoryIndex <= 0) return;

    const prevState = canvasHistory[canvasHistoryIndex - 1];
    canvasItems = JSON.parse(JSON.stringify(prevState.items));
    canvasHistoryIndex--;
  },

  redo() {
    if (canvasHistoryIndex >= canvasHistory.length - 1) return;

    const nextState = canvasHistory[canvasHistoryIndex + 1];
    canvasItems = JSON.parse(JSON.stringify(nextState.items));
    canvasHistoryIndex++;
  },

  clearHistory() {
    canvasHistory = [];
    canvasHistoryIndex = -1;
  },

  // Reset
  reset() {
    canvasItems = [];
    selectedItemIds = [];
    canvasZoom = 1;
    canvasPan = { x: 0, y: 0 };
    canvasMode = 'select';
    editingTextId = null;
    canvasStore.clearHistory();
  },

  // Grid snapping
  snapPositionToGrid(x: number, y: number): { x: number; y: number } {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  },
};

// Internal helper
function saveToHistory() {
  // Remove any history after current index
  const newHistory = canvasHistory.slice(0, canvasHistoryIndex + 1);

  // Add current state
  newHistory.push({
    items: JSON.parse(JSON.stringify(canvasItems)),
    timestamp: Date.now(),
  });

  // Limit history to 50 states
  if (newHistory.length > 50) {
    newHistory.shift();
  }

  canvasHistory = newHistory;
  canvasHistoryIndex = newHistory.length - 1;
}

// Export for backwards compatibility
export function getCanvasItems() {
  return canvasItems;
}

export function getSelectedItemIds() {
  return selectedItemIds;
}

export function getCanvasZoom() {
  return canvasZoom;
}
