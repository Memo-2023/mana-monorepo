<script lang="ts">
	/**
	 * TasksTodayWidget - Today's tasks from Todo app (local-first)
	 *
	 * Reads directly from Todo's IndexedDB via cross-app reader.
	 * Reactive: auto-updates when tasks change (sync, other tabs).
	 */

	import { _ } from 'svelte-i18n';
	import { useOpenTasks } from '$lib/data/cross-app-queries';
	import { db } from '$lib/data/database';
	import { format, isToday, isTomorrow, isPast } from 'date-fns';
	import { de } from 'date-fns/locale';

	function formatDueDate(dueDate?: string | null): string | null {
		if (!dueDate) return null;
		const date = new Date(dueDate);
		if (isToday(date)) return 'Heute';
		if (isTomorrow(date)) return 'Morgen';
		return format(date, 'dd. MMM', { locale: de });
	}

	function isOverdue(dueDate?: string | null): boolean {
		if (!dueDate) return false;
		const date = new Date(dueDate);
		return isPast(date) && !isToday(date);
	}

	const tasks = useOpenTasks();

	const MAX_DISPLAY = 5;

	const priorityColors: Record<string, string> = {
		urgent: '#ef4444',
		high: '#f97316',
		medium: '#eab308',
		low: '#22c55e',
	};

	const displayedTasks = $derived((tasks.value ?? []).slice(0, MAX_DISPLAY));
	const remainingCount = $derived(Math.max(0, (tasks.value ?? []).length - MAX_DISPLAY));
	const totalCount = $derived((tasks.value ?? []).length);

	// Track tasks being toggled (for optimistic UI)
	let togglingIds: Set<string> = $state(new Set());

	async function handleToggleComplete(e: MouseEvent, task: any) {
		e.preventDefault();
		e.stopPropagation();

		if (togglingIds.has(task.id)) return;

		togglingIds = new Set([...togglingIds, task.id]);

		// Write directly to unified IndexedDB — Dexie hooks track the change for sync
		await db.table('tasks').update(task.id, {
			isCompleted: !task.isCompleted,
			completedAt: task.isCompleted ? null : new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		togglingIds = new Set([...togglingIds].filter((id) => id !== task.id));
	}

	function getSubtaskProgress(task: any): string | null {
		if (!task.subtasks || task.subtasks.length === 0) return null;
		const done = task.subtasks.filter((s: any) => s.isCompleted).length;
		return `${done}/${task.subtasks.length}`;
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>✅</span>
			{$_('dashboard.widgets.tasks_today.title')}
		</h3>
		{#if totalCount > 0}
			<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
				{totalCount}
			</span>
		{/if}
	</div>

	{#if tasks.loading}
		<div class="space-y-2">
			{#each Array(4) as _}
				<div class="h-8 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if totalCount === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">🎉</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.tasks_today.empty')}
			</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each displayedTasks as task (task.id)}
				<a
					href="/todo"
					class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
				>
					<!-- Priority dot -->
					<div
						class="h-2 w-2 flex-shrink-0 rounded-full"
						style="background-color: {priorityColors[task.priority] || priorityColors.medium}"
					></div>

					<!-- Checkbox -->
					<button
						onclick={(e) => handleToggleComplete(e, task)}
						class="flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-colors {task.isCompleted
							? 'border-primary bg-primary'
							: 'border-muted-foreground/40 hover:border-primary/60'} {togglingIds.has(task.id)
							? 'opacity-50'
							: ''}"
						aria-label={task.isCompleted ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
						disabled={togglingIds.has(task.id)}
					>
						{#if task.isCompleted}
							<svg
								class="h-full w-full text-primary-foreground"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
							>
								<path d="M20 6L9 17l-5-5" />
							</svg>
						{/if}
					</button>

					<!-- Content -->
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<p
								class="truncate text-sm font-medium {task.isCompleted
									? 'text-muted-foreground line-through'
									: ''}"
							>
								{task.title}
							</p>
							{#if formatDueDate(task.dueDate)}
								<span
									class="flex-shrink-0 text-xs {isOverdue(task.dueDate)
										? 'text-red-500'
										: 'text-muted-foreground'}"
								>
									{formatDueDate(task.dueDate)}
								</span>
							{/if}
						</div>
						{#if task.dueTime || getSubtaskProgress(task)}
							<div class="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
								{#if task.dueTime}
									<span>{task.dueTime}</span>
								{/if}
								{#if getSubtaskProgress(task)}
									<span>{getSubtaskProgress(task)}</span>
								{/if}
							</div>
						{/if}
					</div>
				</a>
			{/each}

			{#if remainingCount > 0}
				<a
					href="/todo"
					class="block rounded-lg py-2 text-center text-sm text-primary hover:bg-primary/5"
				>
					{$_('dashboard.widgets.tasks_today.view_all', { values: { count: remainingCount } })}
				</a>
			{/if}
		</div>
	{/if}
</div>
