<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Task, TaskPriority } from '../types';
	import { tasksStore } from '../stores/tasks.svelte';
	import TaskItem from './TaskItem.svelte';
	import { dndzone, SOURCES, TRIGGERS } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

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

	// Context menu
	let contextMenu = $state<{ x: number; y: number; task: Task } | null>(null);

	function handleContextMenu(task: Task, e: MouseEvent) {
		contextMenu = { x: e.clientX, y: e.clientY, task };
	}

	function closeContextMenu() {
		contextMenu = null;
	}

	async function handleSetPriority(priority: TaskPriority) {
		if (!contextMenu) return;
		await tasksStore.updateTask(contextMenu.task.id, { priority });
		closeContextMenu();
	}

	async function handleComplete() {
		if (!contextMenu) return;
		await tasksStore.toggleComplete(contextMenu.task.id);
		closeContextMenu();
	}

	async function handleDelete() {
		if (!contextMenu) return;
		await tasksStore.deleteTask(contextMenu.task.id);
		closeContextMenu();
	}

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

<!-- Context Menu -->
{#if contextMenu}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-[9990]" onclick={closeContextMenu}></div>
	<div
		class="fixed z-[9991] min-w-[160px] rounded-lg border border-border bg-card p-1 shadow-xl"
		style="left: {contextMenu.x}px; top: {contextMenu.y}px"
	>
		<button
			onclick={() => {
				onOpenTask(contextMenu!.task);
				closeContextMenu();
			}}
			class="flex w-full items-center rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted"
		>
			{$_('todo.edit')}
		</button>
		<button
			onclick={handleComplete}
			class="flex w-full items-center rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-muted"
		>
			{contextMenu.task.isCompleted ? $_('todo.reopen') : $_('todo.markDone')}
		</button>
		<div class="my-1 border-t border-border"></div>
		<div class="px-3 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-muted-foreground">
			{$_('todo.priority')}
		</div>
		{#each ['urgent', 'high', 'medium', 'low'] as p}
			<button
				onclick={() => handleSetPriority(p as TaskPriority)}
				class="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted
					{contextMenu.task.priority === p ? 'text-primary font-medium' : 'text-foreground'}"
			>
				<span
					class="h-2 w-2 rounded-full"
					style="background-color: {p === 'urgent'
						? '#ef4444'
						: p === 'high'
							? '#f59e0b'
							: p === 'medium'
								? '#3b82f6'
								: '#6b7280'}"
				></span>
				{p === 'urgent'
					? $_('todo.priorityUrgent')
					: p === 'high'
						? $_('todo.priorityHigh')
						: p === 'medium'
							? $_('todo.priorityMedium')
							: $_('todo.priorityLow')}
			</button>
		{/each}
		<div class="my-1 border-t border-border"></div>
		<button
			onclick={handleDelete}
			class="flex w-full items-center rounded-md px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
		>
			{$_('common.delete')}
		</button>
	</div>
{/if}
