<!--
  Todo — Workbench ListView
  Compact task list with quick add, filter by inbox/today/overdue.
  Clicking a task opens the detail view; checkbox toggles completion.
-->
<script lang="ts">
	import {
		useAllTasks,
		filterIncomplete,
		filterToday,
		filterOverdue,
		sortTasks,
		getTaskStats,
	} from './queries';
	import { tasksStore } from './stores/tasks.svelte';
	import { toastStore } from '@mana/shared-ui/toast';
	import { Circle, Check, PencilSimple, Trash, ArrowCounterClockwise } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { dropTarget, dragSource } from '@mana/shared-ui/dnd';
	import type { TagDragData } from '@mana/shared-ui/dnd';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import { addTagId } from '$lib/data/tag-mutations';
	import VoiceCaptureBar from '$lib/components/voice/VoiceCaptureBar.svelte';

	let { navigate, goBack, params }: ViewProps = $props();

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	function getTaskTagIds(task: import('./types').Task): string[] {
		return ((task.metadata as Record<string, unknown>)?.labelIds as string[]) ?? [];
	}

	function handleTagDrop(taskId: string, tagData: TagDragData) {
		const task = tasks.find((t) => t.id === taskId);
		if (!task) return;
		void addTagId(getTaskTagIds(task), tagData.id, (next) => tasksStore.updateLabels(taskId, next));
	}

	type ViewFilter = 'inbox' | 'today' | 'overdue';

	let filter = $state<ViewFilter>('inbox');
	let newTitle = $state('');
	let tasks$ = useAllTasks();
	let tasks = $derived(tasks$.value);

	const stats = $derived(getTaskStats(tasks));
	const filtered = $derived(() => {
		const incomplete = filterIncomplete(tasks);
		switch (filter) {
			case 'today':
				return filterToday(tasks);
			case 'overdue':
				return filterOverdue(tasks);
			default:
				return sortTasks(incomplete, 'order');
		}
	});

	async function addTask() {
		const title = newTitle.trim();
		if (!title) return;
		const data: Record<string, unknown> = { title };
		if (filter === 'today') data.dueDate = new Date().toISOString();
		const task = await tasksStore.createTask(data as { title: string; dueDate?: string });
		newTitle = '';
		// Background LLM enrichment: if the user typed something like
		// "Steuererklärung morgen 14 Uhr hoch", swap in dueDate + priority
		// once mana-llm answers. The task is already in the list with
		// the user's exact title, so this only ever adds detail.
		void tasksStore.enrichTaskFromText(task.id, title);
	}

	async function handleVoiceComplete(blob: Blob, durationMs: number) {
		await tasksStore.createFromVoice(blob, durationMs, 'de');
	}

	// Context menu
	let ctxMenu = $state<{
		visible: boolean;
		x: number;
		y: number;
		task: import('./types').Task | null;
	}>({
		visible: false,
		x: 0,
		y: 0,
		task: null,
	});

	function handleItemContextMenu(e: MouseEvent, task: import('./types').Task) {
		e.preventDefault();
		ctxMenu = { visible: true, x: e.clientX, y: e.clientY, task };
	}

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.task
			? [
					{
						id: 'open',
						label: 'Öffnen',
						icon: PencilSimple,
						action: () => {
							if (ctxMenu.task) navigate('detail', { taskId: ctxMenu.task.id });
						},
					},
					{
						id: 'complete',
						label: ctxMenu.task.isCompleted ? 'Wieder öffnen' : 'Erledigen',
						icon: ctxMenu.task.isCompleted ? ArrowCounterClockwise : Check,
						action: () => {
							if (ctxMenu.task) tasksStore.toggleComplete(ctxMenu.task.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							if (ctxMenu.task) tasksStore.deleteTask(ctxMenu.task.id);
						},
					},
				]
			: []
	);

	async function toggleComplete(e: Event, id: string) {
		e.stopPropagation();
		const task = tasks.find((t) => t.id === id);
		const wasCompleted = task?.isCompleted ?? false;
		await tasksStore.toggleComplete(id);
		toastStore.undo(wasCompleted ? 'Aufgabe wiederhergestellt' : 'Aufgabe erledigt', () =>
			tasksStore.toggleComplete(id)
		);
	}
</script>

<div class="app-view">
	<div class="stats">
		<span>{stats.total} gesamt</span>
		<span>{stats.today} heute</span>
		<span class:overdue={stats.overdue > 0}>{stats.overdue} überfällig</span>
	</div>

	<div class="filter-tabs">
		{#each ['inbox', 'today', 'overdue'] as f}
			<button
				onclick={() => (filter = f as ViewFilter)}
				class="filter-tab"
				class:active={filter === f}
			>
				{f === 'inbox' ? 'Inbox' : f === 'today' ? 'Heute' : 'Überfällig'}
			</button>
		{/each}
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			addTask();
		}}
		class="quick-add"
	>
		<span class="add-icon"><Circle size={18} /></span>
		<input bind:value={newTitle} placeholder="Neue Aufgabe..." class="add-input" />
	</form>

	<VoiceCaptureBar
		idleLabel="Aufgabe sprechen"
		feature="todo-voice-capture"
		reason="Aufgaben werden verschlüsselt gespeichert. Dafür brauchst du ein Mana-Konto."
		onComplete={handleVoiceComplete}
	/>

	<div class="task-list">
		{#each filtered() as task (task.id)}
			{@const taskTagIds = getTaskTagIds(task)}
			{@const taskTags = getTagsByIds(allTags, taskTagIds)}
			<button
				onclick={() =>
					navigate('detail', {
						taskId: task.id,
						_siblingIds: filtered().map((t) => t.id),
						_siblingKey: 'taskId',
					})}
				oncontextmenu={(e) => handleItemContextMenu(e, task)}
				class="task-item"
				use:dragSource={{
					type: 'task',
					data: () => ({
						id: task.id,
						title: task.title,
						dueDate: task.dueDate,
						description: task.description,
					}),
				}}
				use:dropTarget={{
					accepts: ['tag'],
					onDrop: (p) => handleTagDrop(task.id, p.data as unknown as TagDragData),
					canDrop: (p) => !taskTagIds.includes((p.data as unknown as TagDragData).id),
				}}
			>
				<div
					class="checkbox"
					class:checked={task.isCompleted}
					onclick={(e) => toggleComplete(e, task.id)}
					onkeydown={(e) => e.key === 'Enter' && toggleComplete(e, task.id)}
					role="checkbox"
					aria-checked={task.isCompleted}
					tabindex={0}
				>
					{#if task.isCompleted}<Check size={12} />{/if}
				</div>
				<div class="task-content">
					<p class="task-title" class:completed={task.isCompleted}>{task.title}</p>
					{#if task.dueDate || taskTags.length > 0}
						<div class="task-meta">
							{#if task.dueDate}
								<span class="task-due">{new Date(task.dueDate).toLocaleDateString('de')}</span>
							{/if}
							{#each taskTags as tag (tag.id)}
								<span class="tag-pill" style="--tag-color: {tag.color}">
									<span class="tag-dot" style="background: {tag.color}"></span>
									{tag.name}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</button>
		{/each}

		{#if filtered().length === 0}
			<p class="empty">Keine Aufgaben</p>
		{/if}
	</div>

	<ContextMenu
		visible={ctxMenu.visible}
		x={ctxMenu.x}
		y={ctxMenu.y}
		items={ctxMenuItems}
		onClose={() => (ctxMenu = { ...ctxMenu, visible: false, task: null })}
	/>
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 1rem;
		height: 100%;
	}
	.stats {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.overdue {
		color: #ef4444;
	}
	:global(.dark) .stats {
		color: #6b7280;
	}
	.filter-tabs {
		display: flex;
		gap: 0.25rem;
	}
	.filter-tab {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}
	.filter-tab:hover {
		color: #374151;
		background: rgba(0, 0, 0, 0.04);
	}
	.filter-tab.active {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}
	:global(.dark) .filter-tab:hover {
		color: #e5e7eb;
		background: rgba(255, 255, 255, 0.06);
	}
	:global(.dark) .filter-tab.active {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}
	.quick-add {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
	}
	:global(.dark) .quick-add {
		border-color: rgba(255, 255, 255, 0.08);
	}
	.add-icon {
		color: #d1d5db;
		display: flex;
	}
	:global(.dark) .add-icon {
		color: #4b5563;
	}
	.add-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: #374151;
	}
	.add-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .add-input {
		color: #f3f4f6;
	}
	:global(.dark) .add-input::placeholder {
		color: #4b5563;
	}
	.task-list {
		flex: 1;
		overflow-y: auto;
	}
	.task-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		width: 100%;
		padding: 0.375rem 0.25rem;
		border: none;
		background: transparent;
		text-align: left;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.task-item:hover {
		background: rgba(0, 0, 0, 0.03);
	}
	:global(.dark) .task-item:hover {
		background: rgba(255, 255, 255, 0.04);
	}
	.checkbox {
		margin-top: 0.125rem;
		width: 16px;
		height: 16px;
		border-radius: 0.25rem;
		border: 1.5px solid #d1d5db;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.15s;
	}
	.checkbox:hover {
		border-color: #9ca3af;
	}
	.checkbox.checked {
		border-color: #22c55e;
		background: #22c55e;
		color: white;
	}
	:global(.dark) .checkbox {
		border-color: #4b5563;
	}
	.task-content {
		min-width: 0;
		flex: 1;
	}
	.task-title {
		font-size: 0.8125rem;
		color: #374151;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.task-title.completed {
		color: #9ca3af;
		text-decoration: line-through;
	}
	:global(.dark) .task-title {
		color: #e5e7eb;
	}
	:global(.dark) .task-title.completed {
		color: #6b7280;
	}
	.task-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin: 0;
	}
	.task-due {
		font-size: 0.6875rem;
		color: #9ca3af;
	}
	.tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.1875rem;
		padding: 0 0.325rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--tag-color) 12%, transparent);
		font-size: 0.5625rem;
		color: #6b7280;
		line-height: 1.25rem;
		white-space: nowrap;
	}
	:global(.dark) .tag-pill {
		background: color-mix(in srgb, var(--tag-color) 18%, transparent);
		color: #9ca3af;
	}
	.tag-dot {
		width: 5px;
		height: 5px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	:global(.task-item.mana-drop-target-hover) {
		outline: 2px solid rgba(139, 92, 246, 0.4);
		outline-offset: -2px;
		background: rgba(139, 92, 246, 0.06) !important;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	/* Mobile: larger touch targets */
	@media (max-width: 640px) {
		.app-view {
			padding: 0.75rem;
		}

		.task-item {
			padding: 0.625rem 0.375rem;
			min-height: 44px;
		}

		.checkbox {
			width: 20px;
			height: 20px;
		}
	}
</style>
