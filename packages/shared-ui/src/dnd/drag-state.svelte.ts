/**
 * Global reactive drag state.
 *
 * Shared between dragSource, dropTarget, passiveDropZone, and UI components
 * (DragPreview, ActionZone) so they can coordinate visuals.
 */

import type { DragPayload, DragType } from './types';

// ── State ───────────────────────────────────────────────────

/** The item currently being dragged (Layer 1: pointer-events system). */
let activeDrag = $state<DragPayload | null>(null);

/** Current pointer position during drag (screen coordinates). */
let pointerX = $state(0);
let pointerY = $state(0);

/** The ID of the drop target currently being hovered. */
let hoveredTargetId = $state<string | null>(null);

/**
 * Whether a svelte-dnd-action drag is in progress (Layer 2).
 * Set by passiveDropZone when it detects aria-grabbed elements.
 */
let svelteActionDragActive = $state(false);

/**
 * Payload inferred from svelte-dnd-action drag (for passiveDropZone).
 * Set via registerSvelteActionDrag() from the app.
 */
let svelteActionPayload = $state<DragPayload | null>(null);

// ── Accessors ───────────────────────────────────────────────

export const dragState = {
	get activeDrag() {
		return activeDrag;
	},
	get pointerX() {
		return pointerX;
	},
	get pointerY() {
		return pointerY;
	},
	get hoveredTargetId() {
		return hoveredTargetId;
	},
	get isDragging() {
		return activeDrag !== null;
	},
	get svelteActionDragActive() {
		return svelteActionDragActive;
	},
	get svelteActionPayload() {
		return svelteActionPayload;
	},
	/** True if ANY drag is happening (Layer 1 or Layer 2). */
	get anyDragActive() {
		return activeDrag !== null || svelteActionDragActive;
	},
};

// ── Mutations ───────────────────────────────────────────────

export function startDrag(payload: DragPayload) {
	activeDrag = payload;
}

export function updatePointer(x: number, y: number) {
	pointerX = x;
	pointerY = y;
}

export function setHoveredTarget(id: string | null) {
	hoveredTargetId = id;
}

export function endDrag() {
	activeDrag = null;
	hoveredTargetId = null;
}

/**
 * Called by app code to inform the passive layer that a svelte-dnd-action
 * drag has started, along with the payload of the dragged item.
 *
 * Usage in TaskList:
 *   onconsider={(e) => {
 *     registerSvelteActionDrag({ type: 'task', data: { id: e.detail.info.id } });
 *   }}
 *   onfinalize={(e) => {
 *     clearSvelteActionDrag();
 *   }}
 */
export function registerSvelteActionDrag(payload: DragPayload) {
	svelteActionDragActive = true;
	svelteActionPayload = payload;
}

export function clearSvelteActionDrag() {
	svelteActionDragActive = false;
	svelteActionPayload = null;
	hoveredTargetId = null;
}

/**
 * Check whether a given drag type is currently active (either layer).
 */
export function isTypeBeingDragged(type: DragType): boolean {
	if (activeDrag?.type === type) return true;
	if (svelteActionPayload?.type === type) return true;
	return false;
}
