<script lang="ts">
	import { getContext } from 'svelte';
	import { isToday, isPast, startOfDay, addDays, subHours, format } from 'date-fns';
	import { t } from 'svelte-i18n';
	import type { Task } from '@todo/shared';
	import { X, Circle, Minus, DotsSixVertical, CornersOut, CornersIn } from '@manacore/shared-icons';
	import KanbanTaskCard from '../kanban/KanbanTaskCard.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { todoSettings } from '$lib/stores/settings.svelte';

	interface Props {
		pageId: string;
		title?: string;
		maximized?: boolean;
		onClose: () => void;
		onMinimize?: () => void;
		onMaximize?: () => void;
		onRename?: (name: string) => void;
	}

	let {
		pageId,
		title: customTitle,
		maximized = false,
		onClose,
		onMinimize,
		onMaximize,
		onRename,
	}: Props = $props();

	const tasksCtx: { readonly value: Task[] } = getContext('tasks');

	let titleEl = $state<HTMLSpanElement | null>(null);
	let isTitleFocused = $state(false);

	// Set initial text content without reactive binding (avoids cursor jump)
	$effect(() => {
		if (titleEl && !isTitleFocused) {
			titleEl.textContent = displayTitle;
		}
	});

	function handleTitleInput() {
		const text = titleEl?.textContent?.trim() ?? '';
		if (text && onRename) onRename(text);
	}

	function handleTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			(e.target as HTMLElement).blur();
		}
	}

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

	let pageMeta = $derived(PAGE_META[pageId] ?? { title: pageId, color: '#6B7280' });
	let displayTitle = $derived(customTitle ?? pageMeta.title);

	let filteredTasks = $derived.by(() => {
		const tasks = tasksCtx.value;
		const today = startOfDay(new Date());
		const weekEnd = addDays(today, 7);

		switch (pageId) {
			case 'todo': {
				const recentCutoff = subHours(new Date(), 24);
				return tasks.filter(
					(t) =>
						!t.isCompleted ||
						(t.isCompleted && t.completedAt && new Date(t.completedAt) >= recentCutoff)
				);
			}
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

	let openTasks = $derived(
		pageId === 'todo' ? filteredTasks.filter((t) => !t.isCompleted) : filteredTasks
	);
	let recentlyCompleted = $derived(
		pageId === 'todo' ? filteredTasks.filter((t) => t.isCompleted) : []
	);

	function formatCompletedTime(completedAt: string): string {
		const date = new Date(completedAt);
		const time = format(date, 'HH:mm');
		if (pageId === 'completed') {
			const dateStr = format(date, 'dd.MM.');
			return $t('page.completedAtDateTime', { values: { date: dateStr, time } });
		}
		return $t('page.completedAtTime', { values: { time } });
	}

	let newTaskTitle = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	async function handleInlineCreate() {
		const title = newTaskTitle.trim();
		if (!title) return;
		const data: { title: string; dueDate?: string } = { title };
		if (pageId === 'today') {
			data.dueDate = new Date().toISOString();
		} else if (pageId === 'this-week') {
			data.dueDate = new Date().toISOString();
		}
		await tasksStore.createTask(data);
		newTaskTitle = '';
		inputEl?.focus();
	}
</script>

<div class="todo-page" class:maximized style="width: {maximized ? '100%' : sheetWidth}">
	<div class="drag-handle-bar">
		<span class="drag-handle">
			<DotsSixVertical size={14} />
		</span>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="page-header" ondragstart={(e) => e.preventDefault()}>
		<div class="header-left">
			<span class="color-dot" style="background-color: {pageMeta.color}"></span>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				bind:this={titleEl}
				class="page-title"
				contenteditable={!!onRename}
				oninput={handleTitleInput}
				onkeydown={handleTitleKeydown}
				onfocus={() => (isTitleFocused = true)}
				onblur={() => (isTitleFocused = false)}
			></span>
			<span class="task-count">{filteredTasks.length}</span>
		</div>
		<div class="header-actions">
			{#if onMinimize}
				<button class="header-btn" onclick={onMinimize} title="Minimieren">
					<Minus size={14} />
				</button>
			{/if}
			{#if onMaximize}
				<button
					class="header-btn"
					onclick={onMaximize}
					title={maximized ? 'Verkleinern' : 'Maximieren'}
				>
					{#if maximized}
						<CornersIn size={14} />
					{:else}
						<CornersOut size={14} />
					{/if}
				</button>
			{/if}
			<button class="header-btn" onclick={onClose} title="Seite schließen">
				<X size={14} />
			</button>
		</div>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="page-body" ondragstart={(e) => e.preventDefault()}>
		{#if pageId === 'completed'}
			{#each filteredTasks as task (task.id)}
				<div class="task-card-wrapper completed-task">
					<KanbanTaskCard
						{task}
						onToggleComplete={() => handleToggle(task)}
						onSave={(data) => handleUpdate(task.id, data)}
						onDelete={() => handleDelete(task.id)}
					/>
					{#if task.completedAt}
						<span class="completed-time">{formatCompletedTime(task.completedAt)}</span>
					{/if}
				</div>
			{/each}
		{:else}
			{#each openTasks as task (task.id)}
				<div class="task-card-wrapper">
					<KanbanTaskCard
						{task}
						onToggleComplete={() => handleToggle(task)}
						onSave={(data) => handleUpdate(task.id, data)}
						onDelete={() => handleDelete(task.id)}
					/>
				</div>
			{/each}

			{#if recentlyCompleted.length > 0}
				<div class="completed-section">
					<span class="completed-label">{$t('page.recentlyCompleted')}</span>
					{#each recentlyCompleted as task (task.id)}
						<div class="task-card-wrapper completed-task">
							<KanbanTaskCard
								{task}
								onToggleComplete={() => handleToggle(task)}
								onSave={(data) => handleUpdate(task.id, data)}
								onDelete={() => handleDelete(task.id)}
							/>
							{#if task.completedAt}
								<span class="completed-time">{formatCompletedTime(task.completedAt)}</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<div class="inline-create">
				<span class="inline-create-icon">
					<Circle size={18} />
				</span>
				<input
					bind:this={inputEl}
					bind:value={newTaskTitle}
					class="inline-create-input"
					placeholder={$t('page.newTaskPlaceholder')}
					onkeydown={(e) => {
						if (e.key === 'Enter') handleInlineCreate();
					}}
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	.todo-page {
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
	:global(.dark) .todo-page {
		background-color: #252220;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.06);
	}

	.todo-page.maximized {
		position: fixed;
		inset: 0;
		z-index: 50;
		width: 100% !important;
		min-height: 100vh;
		border-radius: 0;
		box-shadow: none;
		animation: fadeInScale 0.2s ease-out;
		align-items: center;
	}

	.todo-page.maximized .page-header,
	.todo-page.maximized .page-body {
		width: 100%;
		max-width: 720px;
	}

	.todo-page.maximized .page-header {
		margin: 0 auto;
	}

	.todo-page.maximized .page-body {
		margin: 0 auto;
	}
	@keyframes fadeInScale {
		from {
			opacity: 0.8;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.drag-handle-bar {
		display: flex;
		justify-content: center;
		padding: 0.25rem 0 0;
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 14px;
		color: #d1d5db;
		cursor: grab;
		border-radius: 0.25rem;
		transition: color 0.15s;
	}
	.drag-handle:hover {
		color: #9ca3af;
	}
	.drag-handle:active {
		cursor: grabbing;
	}
	:global(.dark) .drag-handle {
		color: #3f3b38;
	}
	:global(.dark) .drag-handle:hover {
		color: #6b7280;
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
		outline: none;
		border-radius: 0.125rem;
	}
	.page-title[contenteditable='true'] {
		cursor: text;
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

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.header-btn {
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
	.header-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}
	:global(.dark) .header-btn:hover {
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

	.completed-section {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .completed-section {
		border-top-color: rgba(255, 255, 255, 0.08);
	}

	.completed-label {
		font-size: 0.6875rem;
		font-weight: 500;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 0.5rem;
		display: block;
	}

	.completed-task {
		position: relative;
		opacity: 0.6;
	}

	.completed-time {
		position: absolute;
		right: 0.5rem;
		top: 0.5rem;
		font-size: 0.6875rem;
		color: #9ca3af;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.inline-create {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.25rem;
		margin-top: 0.25rem;
	}

	.inline-create-icon {
		flex-shrink: 0;
		color: #d1d5db;
		display: flex;
		align-items: center;
	}
	:global(.dark) .inline-create-icon {
		color: #4b5563;
	}

	.inline-create-input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: #374151;
		outline: none;
	}
	.inline-create-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .inline-create-input {
		color: #f3f4f6;
	}
	:global(.dark) .inline-create-input::placeholder {
		color: #4b5563;
	}
</style>
