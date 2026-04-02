/**
 * Todo module — barrel exports.
 */

// Stores
export { tasksStore } from './stores/tasks.svelte';
export { boardViewsStore } from './stores/board-views.svelte';
export { viewStore } from './stores/view.svelte';
export { labelsStore } from './stores/labels.svelte';
export { remindersStore } from './stores/reminders.svelte';
export { todoSettings } from './stores/settings.svelte';
export { minimizedPagesStore } from './stores/minimized-pages.svelte';
export { contactsStore } from './stores/contacts.svelte';

// Queries
export {
	useAllTasks,
	useAllLabels,
	useAllBoardViews,
	useAllReminders,
	useAllProjects,
	toTask,
	filterIncomplete,
	filterCompleted,
	filterOverdue,
	filterToday,
	filterUpcoming,
	filterByProject,
	searchTasks,
	sortTasks,
	getPriorityLabel,
	getPriorityColor,
	getTaskStats,
} from './queries';

// Collections
export {
	taskTable,
	todoProjectTable,
	taskTagTable,
	reminderTable,
	boardViewTable,
	TODO_GUEST_SEED,
} from './collections';

// View Grouping
export { groupTasksByView, getDropActionUpdate } from './view-grouping';
export type { GroupedColumn } from './view-grouping';

// Utilities
export {
	parseTaskInput,
	parseMultiTaskInput,
	resolveTaskIds,
	formatDuration,
} from './utils/task-parser';
export { estimateDuration } from './utils/time-estimator';
export type { ParsedTask, ParsedTaskWithIds } from './utils/task-parser';
export type { DurationEstimate } from './utils/time-estimator';

// Composables
export { useTaskForm } from './composables/useTaskForm.svelte';

// Types
export type {
	LocalTask,
	LocalLabel,
	LocalTaskTag,
	LocalReminder,
	LocalBoardView,
	LocalTodoProject,
	Task,
	TaskPriority,
	TaskStatus,
	Subtask,
	ViewType,
	SortBy,
	SortOrder,
	ViewColumn,
	TaskMatcher,
	DropAction,
	ViewFilter,
} from './types';
