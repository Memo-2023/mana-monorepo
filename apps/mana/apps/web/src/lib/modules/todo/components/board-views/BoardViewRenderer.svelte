<script lang="ts">
	import type { Task, LocalLabel, LocalBoardView } from '../../types';
	import KanbanLayout from './KanbanLayout.svelte';
	import GridLayout from './GridLayout.svelte';
	import FokusLayout from './FokusLayout.svelte';

	interface Props {
		view: LocalBoardView;
		tasks: Task[];
		labels: LocalLabel[];
		wipLimit?: number | null;
		cardSize?: 'compact' | 'normal' | 'large';
		onToggleComplete: (taskId: string) => void;
		onSaveTask: (taskId: string, data: Partial<Task>) => void;
		onDeleteTask: (taskId: string) => void;
		onQuickAdd: (title: string, columnId: string) => void;
		onOpenTask: (task: Task) => void;
	}

	let {
		view,
		tasks,
		labels,
		wipLimit = null,
		cardSize = 'normal',
		onToggleComplete,
		onSaveTask,
		onDeleteTask,
		onQuickAdd,
		onOpenTask,
	}: Props = $props();
</script>

{#if view.layout === 'grid'}
	<GridLayout {view} {tasks} {labels} {onToggleComplete} {onSaveTask} {onDeleteTask} {onOpenTask} />
{:else if view.layout === 'fokus'}
	<FokusLayout {view} {tasks} {labels} {onToggleComplete} {onOpenTask} />
{:else}
	<KanbanLayout
		{view}
		{tasks}
		{labels}
		{wipLimit}
		{cardSize}
		{onToggleComplete}
		{onSaveTask}
		{onDeleteTask}
		{onQuickAdd}
		{onOpenTask}
	/>
{/if}
