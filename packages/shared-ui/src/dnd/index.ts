// Types
export type {
	DragType,
	DragPayload,
	TagDragData,
	TaskDragData,
	DragSourceOptions,
	DropTargetOptions,
	PassiveDropZoneOptions,
	ActionZoneProps,
} from './types';

// Actions
export { dragSource } from './drag-source';
export { dropTarget } from './drop-target';
export { passiveDropZone } from './passive-drop';

// State
export {
	dragState,
	startDrag,
	endDrag,
	updatePointer,
	setHoveredTarget,
	registerSvelteActionDrag,
	clearSvelteActionDrag,
	isTypeBeingDragged,
} from './drag-state.svelte';

// Components
export { default as DragPreview } from './DragPreview.svelte';
export { default as ActionZone } from './ActionZone.svelte';
