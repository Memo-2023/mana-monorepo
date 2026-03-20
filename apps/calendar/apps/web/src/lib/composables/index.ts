/**
 * Calendar Composables
 * Reusable logic extracted from components
 */

// Visible hours and time indicator
export { useVisibleHours, useCurrentTimeIndicator } from './useVisibleHours.svelte';

// Event drag/drop and resize (comprehensive composable)
export {
	useEventDragDrop,
	type EventDragDropConfig,
	type EventDragState,
	type EventResizeState,
} from './useEventDragDrop.svelte';

// Task drag/drop and resize
export { useTaskDragDrop, type TaskDragDropConfig } from './useTaskDragDrop.svelte';

// Sidebar task drop handling
export { useSidebarDrop, type SidebarDropConfig } from './useSidebarDrop.svelte';

// Drag-to-create
export { useDragToCreate, type DragToCreateConfig } from './useDragToCreate.svelte';

// Keyboard handling
export { useCalendarKeyboard, type CancellableOperation } from './useCalendarKeyboard.svelte';

// Birthday popover management
export { useBirthdayPopover } from './useBirthdayPopover.svelte';
