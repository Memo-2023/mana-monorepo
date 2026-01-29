/**
 * Todo App Skeleton Components
 *
 * App-specific skeleton loaders that match the exact layout of todo components.
 * Built on top of @manacore/shared-ui skeleton primitives.
 */

// App Loading Skeleton (from shared-ui with 'tasks' layout)
export { AppLoadingSkeleton } from '@manacore/shared-ui';

// Task List Skeletons
export { default as TaskItemSkeleton } from './TaskItemSkeleton.svelte';
export { default as TaskListSkeleton } from './TaskListSkeleton.svelte';

// Statistics Skeletons
export { default as StatisticsSkeleton } from './StatisticsSkeleton.svelte';

// Kanban Skeletons
export { default as KanbanColumnSkeleton } from './KanbanColumnSkeleton.svelte';
export { default as KanbanBoardSkeleton } from './KanbanBoardSkeleton.svelte';
