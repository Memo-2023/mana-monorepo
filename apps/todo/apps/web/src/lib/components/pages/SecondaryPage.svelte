<script lang="ts">
	import { getContext } from 'svelte';
	import { isToday, isPast, startOfDay, addDays } from 'date-fns';
	import type { Task } from '@todo/shared';
	import { X } from '@manacore/shared-icons';
	import KanbanTaskCard from '../kanban/KanbanTaskCard.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { todoSettings } from '$lib/stores/settings.svelte';

	interface Props {
		pageId: string;
		onClose: () => void;
	}

	let { pageId, onClose }: Props = $props();

	const tasksCtx: { readonly value: Task[] } = getContext('tasks');

	const PAGE_META: Record<string, { title: string; color: string }> = {
		todo: { title: 'To Do', color: '#6B7280' },
		completed: { title: 'Erledigt', color: '#22C55E' },
		today: { title: 'Heute', color: '#F59E0B' },
		overdue: { title: 'Überfällig', color: '#EF4444' },
		all: { title: 'Alle Aufgaben', color: '#3B82F6' },
		'high-priority': { title: 'Hohe Priorität', color: '#EF4444' },
		'this-week': { title: 'Diese Woche', color: '#8B5CF6' },
		'no-date': { title: 'Ohne Datum', color: '#6B7280' },
	};

	let meta = $derived(PAGE_META[pageId] ?? { title: pageId, color: '#6B7280' });

	let filteredTasks = $derived.by(() => {
		const tasks = tasksCtx.value;
		const today = startOfDay(new Date());
		const weekEnd = addDays(today, 7);

		switch (pageId) {
			case 'todo':
				return tasks.filter((t) => !t.isCompleted);
			case 'completed':
				return tasks.filter((t) => t.isCompleted);
			case 'today':
				return tasks.filter(
					(t) =>
						!t.isCompleted &&
						t.dueDate &&
						(isToday(new Date(t.dueDate)) || isPast(startOfDay(new Date(t.dueDate))))
				);
			case 'overdue':
				return tasks.filter(
					(t) =>
						!t.isCompleted &&
						t.dueDate &&
						isPast(startOfDay(new Date(t.dueDate))) &&
						!isToday(new Date(t.dueDate))
				);
			case 'all':
				return tasks;
			case 'high-priority':
				return tasks.filter(
					(t) => !t.isCompleted && (t.priority === 'urgent' || t.priority === 'high')
				);
			case 'this-week':
				return tasks.filter(
					(t) =>
						!t.isCompleted &&
						t.dueDate &&
						new Date(t.dueDate) <= weekEnd &&
						new Date(t.dueDate) >= today
				);
			case 'no-date':
				return tasks.filter((t) => !t.isCompleted && !t.dueDate);
			default:
				return [];
		}
	});

	function handleToggle(task: Task) {
		if (task.isCompleted) {
			tasksStore.uncompleteTask(task.id);
		} else {
			tasksStore.completeTask(task.id);
		}
	}

	function handleDelete(taskId: string) {
		tasksStore.deleteTask(taskId);
	}

	function handleUpdate(taskId: string, data: Partial<Task>) {
		const updateData: Record<string, unknown> = {};
		if (data.title !== undefined) updateData.title = data.title;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.priority !== undefined) updateData.priority = data.priority;
		if (data.dueDate !== undefined) {
			updateData.dueDate = data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate;
		}
		tasksStore.updateTask(taskId, updateData);
	}

	const PAGE_WIDTH_MAP: Record<string, string> = {
		narrow: 'min(360px, 85vw)',
		medium: 'min(480px, 85vw)',
		wide: 'min(640px, 90vw)',
		full: 'min(840px, 95vw)',
	};

	let sheetWidth = $derived(PAGE_WIDTH_MAP[todoSettings.pageWidth] || PAGE_WIDTH_MAP.medium);
</script>

<div class="secondary-page" style="width: {sheetWidth}">
	<div class="page-header">
		<div class="header-left">
			<span class="color-dot" style="background-color: {meta.color}"></span>
			<span class="page-title">{meta.title}</span>
			<span class="task-count">{filteredTasks.length}</span>
		</div>
		<button class="close-btn" onclick={onClose} title="Seite schließen">
			<X size={14} />
		</button>
	</div>

	<div class="page-body">
		{#if filteredTasks.length === 0}
			<div class="empty-state">
				<p>Keine Aufgaben</p>
			</div>
		{:else}
			{#each filteredTasks as task (task.id)}
				<div class="task-card-wrapper">
					<KanbanTaskCard
						{task}
						onToggleComplete={() => handleToggle(task)}
						onSave={(data) => handleUpdate(task.id, data)}
						onDelete={() => handleDelete(task.id)}
					/>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.secondary-page {
		flex: 0 0 auto;
		min-height: 60vh;
		background: #fffef5;
		border-radius: 0.375rem;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		animation: fadeIn 0.25s ease-out;
	}
	:global(.dark) .secondary-page {
		background-color: #252220;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.06);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.color-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.page-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}
	:global(.dark) .page-title {
		color: #f3f4f6;
	}

	.task-count {
		font-size: 0.75rem;
		font-weight: 500;
		color: #9ca3af;
		background: rgba(0, 0, 0, 0.05);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
	}
	:global(.dark) .task-count {
		background: rgba(255, 255, 255, 0.1);
		color: #6b7280;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.close-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}
	:global(.dark) .close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	.page-body {
		flex: 1;
		padding: 0.75rem 1rem;
		overflow-y: auto;
	}

	.task-card-wrapper {
		margin-bottom: 0.5rem;
	}
	.task-card-wrapper:last-child {
		margin-bottom: 0;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 120px;
	}
	.empty-state p {
		font-size: 0.8125rem;
		color: #9ca3af;
	}
</style>
