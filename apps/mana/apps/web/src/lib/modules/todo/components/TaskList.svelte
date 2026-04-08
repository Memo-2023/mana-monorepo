<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Task, TaskPriority } from '../types';
	import { tasksStore } from '../stores/tasks.svelte';
	import TaskItem from './TaskItem.svelte';
	import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { PencilSimple, Check, ArrowCounterClockwise, Trash, Circle } from '@mana/shared-icons';

	interface Props {
		tasks: Task[];
		tags?: { id: string; name: string; color: string }[];
		compact?: boolean;
		dragEnabled?: boolean;
		onOpenTask: (task: Task) => void;
	}

	let { tasks, tags = [], compact = false, dragEnabled = true, onOpenTask }: Props = $props();

	// DnD state
	let items = $state<Task[]>([]);
	$effect(() => {
		items = [...tasks];
	});

	const ctxMenu = useItemContextMenu<Task>();

	function handleContextMenu(task: Task, e: MouseEvent) {
		ctxMenu.open(e, task);
	}

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'open',
						label: $_('todo.edit'),
						icon: PencilSimple,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) onOpenTask(target);
						},
					},
					{
						id: 'complete',
						label: ctxMenu.state.target.isCompleted ? $_('todo.reopen') : $_('todo.markDone'),
						icon: ctxMenu.state.target.isCompleted ? ArrowCounterClockwise : Check,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) tasksStore.toggleComplete(target.id);
						},
					},
					{ id: 'div-priority', label: '', type: 'divider' as const },
					...(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => ({
						id: `priority-${p}`,
						label:
							p === 'urgent'
								? $_('todo.priorityUrgent')
								: p === 'high'
									? $_('todo.priorityHigh')
									: p === 'medium'
										? $_('todo.priorityMedium')
										: $_('todo.priorityLow'),
						icon: Circle,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) tasksStore.updateTask(target.id, { priority: p });
						},
					})),
					{ id: 'div-delete', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: $_('common.delete'),
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) tasksStore.deleteTask(target.id);
						},
					},
				]
			: []
	);

	// DnD handlers
	function handleDndConsider(e: CustomEvent<{ items: Task[] }>) {
		items = e.detail.items;
	}

	function handleDndFinalize(
		e: CustomEvent<{ items: Task[]; info: { source: string; trigger: string } }>
	) {
		items = e.detail.items;
		if (e.detail.info.source === SOURCES.POINTER) {
			tasksStore.reorderTasks(items.map((t) => t.id));
		}
	}

	const flipDurationMs = 200;
</script>

{#if dragEnabled}
	<div
		use:dndzone={{
			items,
			flipDurationMs,
			dropTargetStyle: {},
			dropTargetClasses: ['bg-primary/5', 'rounded-lg'],
		}}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
		class="space-y-0.5"
	>
		{#each items as task (task.id)}
			<div animate:flip={{ duration: flipDurationMs }}>
				<TaskItem
					{task}
					{tags}
					{compact}
					onToggleComplete={() => tasksStore.toggleComplete(task.id)}
					onClick={() => onOpenTask(task)}
					onContextMenu={(e) => handleContextMenu(task, e)}
				/>
			</div>
		{/each}
	</div>
{:else}
	<div class="space-y-0.5">
		{#each tasks as task (task.id)}
			<TaskItem
				{task}
				{tags}
				{compact}
				onToggleComplete={() => tasksStore.toggleComplete(task.id)}
				onClick={() => onOpenTask(task)}
				onContextMenu={(e) => handleContextMenu(task, e)}
			/>
		{/each}
	</div>
{/if}

<ContextMenu
	visible={ctxMenu.state.visible}
	x={ctxMenu.state.x}
	y={ctxMenu.state.y}
	items={ctxMenuItems}
	onClose={ctxMenu.close}
/>
