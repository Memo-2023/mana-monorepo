<script lang="ts">
	import type { Task, TaskTag } from '../../types';
	import type { GroupedColumn } from '../../view-grouping';
	import ViewColumnHeader from './ViewColumnHeader.svelte';
	import KanbanTaskCard from '../kanban/KanbanTaskCard.svelte';
	import QuickAddTaskInline from '../kanban/QuickAddTaskInline.svelte';
	import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	interface Props {
		column: GroupedColumn;
		labels: TaskTag[];
		wipLimit?: number | null;
		cardSize?: 'compact' | 'normal' | 'large';
		onToggleComplete: (taskId: string) => void;
		onSaveTask: (taskId: string, data: Partial<Task>) => void;
		onDeleteTask: (taskId: string) => void;
		onQuickAdd: (title: string, columnId: string) => void;
		onOpenTask: (task: Task) => void;
		onDropTask?: (taskId: string, columnId: string) => void;
	}

	let {
		column,
		labels,
		wipLimit = null,
		cardSize = 'normal',
		onToggleComplete,
		onSaveTask,
		onDeleteTask,
		onQuickAdd,
		onOpenTask,
		onDropTask,
	}: Props = $props();

	// DnD items — tracks the current column's tasks for drag operations
	let items = $state<Task[]>([]);
	$effect(() => {
		items = [...column.tasks];
	});

	const flipDurationMs = 200;

	function handleDndConsider(e: CustomEvent<{ items: Task[] }>) {
		items = e.detail.items;
	}

	function handleDndFinalize(
		e: CustomEvent<{ items: Task[]; info: { source: string; trigger: string } }>
	) {
		items = e.detail.items;
		// Notify parent about tasks that were dropped into this column
		if (e.detail.info.source === SOURCES.POINTER) {
			for (const task of items) {
				// If task wasn't originally in this column, it was dropped here
				if (!column.tasks.find((t) => t.id === task.id)) {
					onDropTask?.(task.id, column.id);
				}
			}
		}
	}
</script>

<div class="flex min-w-[260px] max-w-[340px] flex-shrink-0 flex-col rounded-xl bg-muted/30">
	<ViewColumnHeader {column} {wipLimit} />

	<div
		use:dndzone={{
			items,
			flipDurationMs,
			dropTargetStyle: {},
			dropTargetClasses: ['ring-2', 'ring-primary/30', 'rounded-lg'],
			type: 'kanban-task',
		}}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
		class="flex min-h-[60px] flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-2"
		class:py-0={cardSize === 'compact'}
	>
		{#each items as task (task.id)}
			<div animate:flip={{ duration: flipDurationMs }}>
				<div
					onclick={() => onOpenTask(task)}
					onkeydown={(e) => e.key === 'Enter' && onOpenTask(task)}
					role="button"
					tabindex="0"
					class="cursor-pointer"
				>
					<KanbanTaskCard
						{task}
						{labels}
						onToggleComplete={() => onToggleComplete(task.id)}
						onSave={(data) => onSaveTask(task.id, data)}
						onDelete={() => onDeleteTask(task.id)}
					/>
				</div>
			</div>
		{/each}
	</div>

	<div class="px-1 pb-1">
		<QuickAddTaskInline onAdd={(title) => onQuickAdd(title, column.id)} />
	</div>
</div>
