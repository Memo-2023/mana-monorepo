<script lang="ts">
	/**
	 * TasksUpcomingWidget - Upcoming tasks for the next 7 days (local-first)
	 *
	 * Reads directly from Todo's IndexedDB via cross-app reader.
	 * Reactive: auto-updates when tasks change (sync, other tabs).
	 */

	import { _ } from 'svelte-i18n';
	import { useUpcomingTasks } from '$lib/data/cross-app-queries';

	const tasks = useUpcomingTasks(7);

	const MAX_DISPLAY = 5;

	const priorityColors: Record<string, string> = {
		urgent: '#ef4444',
		high: '#f97316',
		medium: '#eab308',
		low: '#22c55e',
	};

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (date.toDateString() === today.toDateString()) return 'Heute';
		if (date.toDateString() === tomorrow.toDateString()) return 'Morgen';
		return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
	}

	function isOverdue(dateStr: string): boolean {
		const date = new Date(dateStr);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return date < today;
	}

	function isTodayDate(dateStr: string): boolean {
		return new Date(dateStr).toDateString() === new Date().toDateString();
	}

	const displayedTasks = $derived((tasks.value ?? []).slice(0, MAX_DISPLAY));
	const remainingCount = $derived(Math.max(0, (tasks.value ?? []).length - MAX_DISPLAY));
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>📅</span>
			{$_('dashboard.widgets.tasks_upcoming.title')}
		</h3>
		{#if (tasks.value ?? []).length > 0}
			<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
				{(tasks.value ?? []).length}
			</span>
		{/if}
	</div>

	{#if tasks.loading}
		<div class="space-y-2">
			{#each Array(4) as _}
				<div class="h-8 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if (tasks.value ?? []).length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">📭</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.tasks_upcoming.empty')}
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

					<!-- Content -->
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{task.title}</p>
					</div>

					<!-- Date badge -->
					{#if task.dueDate}
						<span
							class="flex-shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium {isOverdue(
								task.dueDate
							)
								? 'bg-red-500/10 text-red-500'
								: isTodayDate(task.dueDate)
									? 'bg-orange-500/10 text-orange-500'
									: 'bg-muted text-muted-foreground'}"
						>
							{formatDate(task.dueDate)}
						</span>
					{/if}
				</a>
			{/each}

			{#if remainingCount > 0}
				<a
					href="/todo"
					class="block rounded-lg py-2 text-center text-sm text-primary hover:bg-primary/5"
				>
					+{remainingCount} weitere
				</a>
			{/if}
		</div>
	{/if}
</div>
