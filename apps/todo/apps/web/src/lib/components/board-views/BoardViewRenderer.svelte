<script lang="ts">
	import { getContext } from 'svelte';
	import type { Task, Project } from '@todo/shared';
	import type { LocalBoardView } from '$lib/data/local-store';
	import { groupTasksByView, getDropActionUpdate } from '$lib/data/view-grouping';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import KanbanLayout from './KanbanLayout.svelte';
	import GridLayout from './GridLayout.svelte';
	import FokusLayout from './FokusLayout.svelte';

	interface Props {
		view: LocalBoardView;
		layoutOverride?: 'kanban' | 'grid' | 'fokus';
		onColumnRename?: (colIdx: number, name: string) => void;
		onColumnColorChange?: (colIdx: number, color: string) => void;
		onColumnMove?: (colIdx: number, dir: -1 | 1) => void;
		onColumnDelete?: (colIdx: number) => void;
		onAddColumn?: () => void;
	}

	let {
		view,
		layoutOverride,
		onColumnRename,
		onColumnColorChange,
		onColumnMove,
		onColumnDelete,
		onAddColumn,
	}: Props = $props();

	let activeLayout = $derived(layoutOverride || view.layout);

	// Get tasks and projects from context (set by layout)
	const tasksCtx: { readonly value: Task[] } = getContext('tasks');
	const projectsCtx: { readonly value: Project[] } = getContext('projects');

	// Group tasks by the current view configuration
	let columns = $derived(groupTasksByView(view, tasksCtx.value, projectsCtx.value));

	// ─── Task Callbacks ──────────────────────────────────────

	function handleTaskDrop(taskId: string, columnId: string) {
		const targetColumn = columns.find((c) => c.id === columnId);
		if (!targetColumn?.onDrop) return;

		const update = getDropActionUpdate(targetColumn.onDrop);
		if (Object.keys(update).length > 0) {
			tasksStore.updateTask(taskId, update);
		}
	}

	function handleTaskToggle(task: Task) {
		if (task.isCompleted) {
			tasksStore.uncompleteTask(task.id);
		} else {
			tasksStore.completeTask(task.id);
		}
	}

	function handleTaskDelete(taskId: string) {
		tasksStore.deleteTask(taskId);
	}

	function handleTaskUpdate(taskId: string, data: Partial<Task>) {
		const updateData: Record<string, unknown> = {};
		if (data.title !== undefined) updateData.title = data.title;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.projectId !== undefined) updateData.projectId = data.projectId;
		if (data.dueDate !== undefined) {
			updateData.dueDate = data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate;
		}
		if (data.priority !== undefined) updateData.priority = data.priority;
		if (data.status !== undefined) updateData.status = data.status;
		if (data.subtasks !== undefined) updateData.subtasks = data.subtasks;
		if (data.recurrenceRule !== undefined) updateData.recurrenceRule = data.recurrenceRule;
		if (data.metadata !== undefined) updateData.metadata = data.metadata;
		if (data.labels !== undefined) updateData.labelIds = data.labels?.map((l) => l.id);

		tasksStore.updateTask(taskId, updateData);
	}
</script>

{#if activeLayout === 'fokus'}
	<FokusLayout
		{columns}
		onTaskDrop={handleTaskDrop}
		onTaskToggle={handleTaskToggle}
		onTaskDelete={handleTaskDelete}
		onTaskUpdate={handleTaskUpdate}
		{onColumnRename}
		{onColumnColorChange}
		{onColumnMove}
		{onColumnDelete}
		{onAddColumn}
	/>
{:else if activeLayout === 'grid'}
	<GridLayout
		{columns}
		onTaskDrop={handleTaskDrop}
		onTaskToggle={handleTaskToggle}
		onTaskDelete={handleTaskDelete}
		onTaskUpdate={handleTaskUpdate}
		{onColumnRename}
		{onColumnColorChange}
		{onColumnMove}
		{onColumnDelete}
		{onAddColumn}
	/>
{:else}
	<KanbanLayout
		{columns}
		onTaskDrop={handleTaskDrop}
		onTaskToggle={handleTaskToggle}
		onTaskDelete={handleTaskDelete}
		onTaskUpdate={handleTaskUpdate}
		{onColumnRename}
		{onColumnColorChange}
		{onColumnMove}
		{onColumnDelete}
		{onAddColumn}
	/>
{/if}
