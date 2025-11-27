import { writable, derived, get } from 'svelte/store';
import type { BoardItem, BoardImageItem, BoardTextItem } from '$lib/api/boardItems';
import { isImageItem, isTextItem } from '$lib/api/boardItems';

// Canvas items (images and texts on the board)
export const canvasItems = writable<BoardItem[]>([]);

// Selected items on canvas
export const selectedItemIds = writable<string[]>([]);

// Canvas view state
export const canvasZoom = writable(1);
export const canvasPan = writable({ x: 0, y: 0 });

// Canvas interaction mode
export type CanvasMode = 'select' | 'pan' | 'draw';
export const canvasMode = writable<CanvasMode>('select');

// Canvas tools
export const showGrid = writable(true);
export const snapToGrid = writable(false);
export const gridSize = writable(20);

// UI state
export const showPropertiesPanel = writable(false);

// Text editing state
export const editingTextId = writable<string | null>(null);
export const isEditingText = derived(editingTextId, ($id) => $id !== null);

// Loading state
export const isLoadingCanvasItems = writable(false);

// History for undo/redo
interface HistoryState {
	items: BoardItem[];
	timestamp: number;
}

export const canvasHistory = writable<HistoryState[]>([]);
export const canvasHistoryIndex = writable(-1);

// Derived stores
export const selectedItems = derived(
	[canvasItems, selectedItemIds],
	([$canvasItems, $selectedItemIds]) =>
		$canvasItems.filter((item) => $selectedItemIds.includes(item.id))
);

// Derived: Selected text items only
export const selectedTextItems = derived(selectedItems, ($selectedItems) =>
	$selectedItems.filter(isTextItem)
);

// Derived: Selected image items only
export const selectedImageItems = derived(selectedItems, ($selectedItems) =>
	$selectedItems.filter(isImageItem)
);

// Derived: Check if selection has mixed types
export const hasMixedSelection = derived(
	[selectedTextItems, selectedImageItems],
	([$texts, $images]) => $texts.length > 0 && $images.length > 0
);

export const hasSelection = derived(
	selectedItemIds,
	($selectedItemIds) => $selectedItemIds.length > 0
);

export const canUndo = derived(
	canvasHistoryIndex,
	($canvasHistoryIndex) => $canvasHistoryIndex > 0
);

export const canRedo = derived(
	[canvasHistory, canvasHistoryIndex],
	([$canvasHistory, $canvasHistoryIndex]) => $canvasHistoryIndex < $canvasHistory.length - 1
);

// Helper functions
export function addCanvasItem(item: BoardItem) {
	canvasItems.update((items) => [...items, item]);
	saveToHistory();
}

export function updateCanvasItem(id: string, updates: Partial<BoardItem>) {
	canvasItems.update((items) =>
		items.map((item) => (item.id === id ? { ...item, ...updates } : item))
	);
	saveToHistory();
}

// Text-specific helpers
export function startEditingText(id: string) {
	editingTextId.set(id);
}

export function stopEditingText() {
	editingTextId.set(null);
}

export function removeCanvasItem(id: string) {
	canvasItems.update((items) => items.filter((item) => item.id !== id));
	selectedItemIds.update((ids) => ids.filter((itemId) => itemId !== id));
	saveToHistory();
}

export function removeSelectedItems() {
	const ids = get(selectedItemIds);
	canvasItems.update((items) => items.filter((item) => !ids.includes(item.id)));
	selectedItemIds.set([]);
	saveToHistory();
}

export function selectItem(id: string, multi = false) {
	console.log('[Store] selectItem called:', id, 'multi:', multi);
	if (multi) {
		selectedItemIds.update((ids) => {
			const newIds = ids.includes(id) ? ids.filter((itemId) => itemId !== id) : [...ids, id];
			console.log('[Store] Updated selection (multi):', newIds);
			return newIds;
		});
	} else {
		console.log('[Store] Setting single selection:', [id]);
		selectedItemIds.set([id]);
	}
}

export function selectAll() {
	selectedItemIds.set(get(canvasItems).map((item) => item.id));
}

export function deselectAll() {
	selectedItemIds.set([]);
}

export function bringToFront(id: string) {
	const items = get(canvasItems);
	const maxZIndex = Math.max(...items.map((item) => item.z_index));
	updateCanvasItem(id, { z_index: maxZIndex + 1 });
}

export function sendToBack(id: string) {
	const items = get(canvasItems);
	const minZIndex = Math.min(...items.map((item) => item.z_index));
	updateCanvasItem(id, { z_index: minZIndex - 1 });
}

export function moveForward(id: string) {
	const items = get(canvasItems);
	const item = items.find((i) => i.id === id);
	if (!item) return;

	const itemsAbove = items.filter((i) => i.z_index > item.z_index);
	if (itemsAbove.length === 0) return;

	const nextZIndex = Math.min(...itemsAbove.map((i) => i.z_index));
	updateCanvasItem(id, { z_index: nextZIndex + 0.5 });
}

export function moveBackward(id: string) {
	const items = get(canvasItems);
	const item = items.find((i) => i.id === id);
	if (!item) return;

	const itemsBelow = items.filter((i) => i.z_index < item.z_index);
	if (itemsBelow.length === 0) return;

	const prevZIndex = Math.max(...itemsBelow.map((i) => i.z_index));
	updateCanvasItem(id, { z_index: prevZIndex - 0.5 });
}

// Zoom functions
export function zoomIn() {
	canvasZoom.update((z) => Math.min(z * 1.2, 5));
}

export function zoomOut() {
	canvasZoom.update((z) => Math.max(z / 1.2, 0.1));
}

export function zoomToFit(
	containerWidth: number,
	containerHeight: number,
	boardWidth: number,
	boardHeight: number
) {
	const scaleX = containerWidth / boardWidth;
	const scaleY = containerHeight / boardHeight;
	const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding
	canvasZoom.set(scale);
	canvasPan.set({ x: 0, y: 0 });
}

export function resetZoom() {
	canvasZoom.set(1);
	canvasPan.set({ x: 0, y: 0 });
}

// History management
export function saveToHistory() {
	const items = get(canvasItems);
	const history = get(canvasHistory);
	const index = get(canvasHistoryIndex);

	// Remove any history after current index
	const newHistory = history.slice(0, index + 1);

	// Add current state
	newHistory.push({
		items: JSON.parse(JSON.stringify(items)), // Deep clone
		timestamp: Date.now(),
	});

	// Limit history to 50 states
	if (newHistory.length > 50) {
		newHistory.shift();
	}

	canvasHistory.set(newHistory);
	canvasHistoryIndex.set(newHistory.length - 1);
}

export function undo() {
	const index = get(canvasHistoryIndex);
	if (index <= 0) return;

	const history = get(canvasHistory);
	const prevState = history[index - 1];

	canvasItems.set(JSON.parse(JSON.stringify(prevState.items)));
	canvasHistoryIndex.set(index - 1);
}

export function redo() {
	const index = get(canvasHistoryIndex);
	const history = get(canvasHistory);

	if (index >= history.length - 1) return;

	const nextState = history[index + 1];
	canvasItems.set(JSON.parse(JSON.stringify(nextState.items)));
	canvasHistoryIndex.set(index + 1);
}

export function clearHistory() {
	canvasHistory.set([]);
	canvasHistoryIndex.set(-1);
}

// Reset canvas state
export function resetCanvasState() {
	canvasItems.set([]);
	selectedItemIds.set([]);
	canvasZoom.set(1);
	canvasPan.set({ x: 0, y: 0 });
	clearHistory();
}

// Grid snapping helper
export function snapToGridPoint(value: number, gridSize: number): number {
	return Math.round(value / gridSize) * gridSize;
}

export function snapPositionToGrid(x: number, y: number): { x: number; y: number } {
	const size = get(gridSize);
	const snap = get(snapToGrid);

	if (!snap) return { x, y };

	return {
		x: snapToGridPoint(x, size),
		y: snapToGridPoint(y, size),
	};
}
