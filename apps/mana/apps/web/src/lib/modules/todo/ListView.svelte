<!--
  Todo — Workbench ListView
  Minimal task list. Inline due-date badges. Floating input at bottom.
-->
<script lang="ts">
	import { formatDate, formatTime } from '$lib/i18n/format';
	import { useAllTasks, filterIncomplete, filterOverdue, filterToday, sortTasks } from './queries';
	import { tasksStore } from './stores/tasks.svelte';
	import { toastStore } from '@mana/shared-ui/toast';
	import { Check } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { PencilSimple, Trash, ArrowCounterClockwise } from '@mana/shared-icons';
	import { dropTarget, dragSource } from '@mana/shared-ui/dnd';
	import type { TagDragData } from '@mana/shared-ui/dnd';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import AgentDot from '$lib/components/ai/AgentDot.svelte';
	import { addTagId } from '$lib/data/tag-mutations';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import FloatingInputBar from '$lib/components/FloatingInputBar.svelte';
	import ScopeEmptyState from '$lib/components/workbench/ScopeEmptyState.svelte';
	import { hasActiveSceneScope } from '$lib/stores/scene-scope.svelte';

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

	let newTitle = $state('');
	let tasks$ = useAllTasks();
	let tasks = $derived(tasks$.value);

	const openTasks = $derived(sortTasks(filterIncomplete(tasks), 'order'));
	const completedTasks = $derived(tasks.filter((t) => t.isCompleted));
	const sorted = $derived([...openTasks, ...completedTasks]);

	function dueBadge(
		task: import('./types').Task
	): { label: string; variant: 'overdue' | 'today' | 'upcoming' } | null {
		if (!task.dueDate || task.isCompleted) return null;
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const tomorrowStart = new Date(todayStart);
		tomorrowStart.setDate(tomorrowStart.getDate() + 1);
		const due = new Date(task.dueDate);
		if (due < todayStart) return { label: 'Überfällig', variant: 'overdue' };
		if (due < tomorrowStart) return { label: 'Heute', variant: 'today' };
		return {
			label: formatDate(due, { day: 'numeric', month: 'short' }),
			variant: 'upcoming',
		};
	}

	async function addTask() {
		const title = newTitle.trim();
		if (!title) return;
		const task = await tasksStore.createTask({ title });
		newTitle = '';
		void tasksStore.enrichTaskFromText(task.id, title);
	}

	async function handleVoiceComplete(blob: Blob, durationMs: number) {
		await tasksStore.createFromVoice(blob, durationMs, 'de');
	}

	const ctxMenu = useItemContextMenu<import('./types').Task>();

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'open',
						label: 'Öffnen',
						icon: PencilSimple,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) navigate('detail', { taskId: target.id });
						},
					},
					{
						id: 'complete',
						label: ctxMenu.state.target.isCompleted ? 'Wieder öffnen' : 'Erledigen',
						icon: ctxMenu.state.target.isCompleted ? ArrowCounterClockwise : Check,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) tasksStore.toggleComplete(target.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
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

<div class="todo-view">
	<div class="task-list">
		{#each sorted as task, i (task.id)}
			{@const taskTagIds = getTaskTagIds(task)}
			{@const taskTags = getTagsByIds(allTags, taskTagIds)}
			{@const badge = dueBadge(task)}
			{#if task.isCompleted && i === openTasks.length && completedTasks.length > 0}
				<hr class="divider" />
			{/if}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				oncontextmenu={(e) => ctxMenu.open(e, task)}
				class="task-item"
				role="listitem"
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
				<button
					type="button"
					class="checkbox"
					class:checked={task.isCompleted}
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						toggleComplete(e, task.id);
					}}
					aria-label={task.isCompleted ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
				>
					{#if task.isCompleted}<Check size={10} weight="bold" />{/if}
				</button>
				<button
					type="button"
					class="task-title-btn"
					onclick={() =>
						navigate('detail', {
							taskId: task.id,
							_siblingIds: sorted.map((t) => t.id),
							_siblingKey: 'taskId',
						})}
				>
					<span class="task-title" class:completed={task.isCompleted}>{task.title}</span>
					<AgentDot record={task} />
				</button>
				<div class="task-right">
					{#each taskTags as tag (tag.id)}
						<span class="tag-dot" style="background: {tag.color}" title={tag.name}></span>
					{/each}
					{#if badge}
						<span class="due-badge {badge.variant}">{badge.label}</span>
					{/if}
					{#if task.isCompleted && task.completedAt}
						<span class="completed-at"
							>{formatTime(new Date(task.completedAt), {
								hour: '2-digit',
								minute: '2-digit',
							})} Uhr, {formatDate(new Date(task.completedAt), {
								day: 'numeric',
								month: 'short',
							})}</span
						>
					{/if}
				</div>
			</div>
		{/each}

		{#if sorted.length === 0}
			{#if hasActiveSceneScope()}
				<ScopeEmptyState label="Aufgaben" />
			{:else}
				<p class="empty">Keine Aufgaben</p>
			{/if}
		{/if}
	</div>

	<FloatingInputBar
		bind:value={newTitle}
		placeholder="Neue Aufgabe..."
		onSubmit={addTask}
		voice
		voiceFeature="todo-voice-capture"
		voiceReason="Aufgaben werden verschlüsselt gespeichert. Dafür brauchst du ein Mana-Konto."
		onVoiceComplete={handleVoiceComplete}
	/>

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenuItems}
		onClose={ctxMenu.close}
	/>
</div>

<style>
	.todo-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
	}
	.task-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0.75rem;
		padding-bottom: 4rem;
	}
	.task-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.25rem;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s;
		border-radius: 0.25rem;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}
	.task-item:hover {
		background: hsl(var(--color-surface-hover));
	}

	/* Round checkbox — monochrome, matches text color */
	.checkbox {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 1.5px solid hsl(var(--color-foreground) / 0.35);
		background: transparent;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.15s;
		cursor: pointer;
		color: transparent;
	}
	.checkbox:hover {
		border-color: hsl(var(--color-foreground) / 0.6);
	}
	.checkbox.checked {
		border-color: hsl(var(--color-foreground));
		background: hsl(var(--color-foreground));
		color: hsl(var(--color-background));
	}

	.task-title-btn {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		padding: 0;
		cursor: pointer;
		text-align: left;
	}
	.task-title {
		display: block;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}
	.task-title.completed {
		color: hsl(var(--color-foreground));
	}

	/* Right side: tags + due badge */
	.task-right {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}
	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.due-badge {
		font-size: 0.625rem;
		font-weight: 500;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		white-space: nowrap;
	}
	.due-badge.overdue {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.1);
	}
	.due-badge.today {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}
	.completed-at {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
	}
	.due-badge.upcoming {
		color: hsl(var(--color-muted-foreground));
		background: hsl(var(--color-muted) / 0.5);
	}

	:global(.task-item.mana-drop-target-hover) {
		outline: 2px solid hsl(var(--color-primary) / 0.4);
		outline-offset: -2px;
		background: hsl(var(--color-primary) / 0.06) !important;
	}

	.divider {
		border: none;
		border-top: 1px solid hsl(var(--color-foreground) / 0.1);
		margin: 0.5rem -0.75rem;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	@media (max-width: 640px) {
		.task-item {
			padding: 0.625rem 0.375rem;
			min-height: 44px;
		}
		.checkbox {
			width: 22px;
			height: 22px;
		}
	}
</style>
