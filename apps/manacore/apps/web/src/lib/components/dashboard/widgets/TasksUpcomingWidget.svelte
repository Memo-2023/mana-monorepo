<script lang="ts">
	/**
	 * TasksUpcomingWidget - Upcoming tasks for the next 7 days
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { todoService, type Task } from '$lib/api/services';
	import { APP_URLS } from '@manacore/shared-branding';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<Task[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	const MAX_DISPLAY = 5;

	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const todoUrl = isDev ? APP_URLS.todo.dev : APP_URLS.todo.prod;

	const priorityColors: Record<string, string> = {
		urgent: '#ef4444',
		high: '#f97316',
		medium: '#eab308',
		low: '#22c55e',
	};

	async function load() {
		state = 'loading';
		retrying = true;

		const result = await todoService.getUpcomingTasks(7);

		if (result.data) {
			data = result.data;
			state = 'success';
			retryCount = 0;
		} else {
			error = result.error;
			state = 'error';

			const isServiceUnavailable = error?.includes('nicht erreichbar');
			if (!isServiceUnavailable && retryCount < 3) {
				retryCount++;
				setTimeout(load, 5000 * retryCount);
			}
		}

		retrying = false;
	}

	onMount(load);

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

	function isToday(dateStr: string): boolean {
		return new Date(dateStr).toDateString() === new Date().toDateString();
	}

	const displayedTasks = $derived(data.slice(0, MAX_DISPLAY));
	const remainingCount = $derived(Math.max(0, data.length - MAX_DISPLAY));
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>📅</span>
			{$_('dashboard.widgets.tasks_upcoming.title')}
		</h3>
		{#if data.length > 0}
			<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
				{data.length}
			</span>
		{/if}
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if data.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">📭</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.tasks_upcoming.empty')}
			</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each displayedTasks as task}
				<a
					href="{todoUrl}/task/{task.id}"
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
						<!-- Meta row: labels -->
						{#if task.labels && task.labels.length > 0}
							<div class="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
								{#each task.labels.slice(0, 2) as label}
									<span class="flex items-center gap-1">
										<span
											class="inline-block h-2 w-2 rounded-full"
											style="background-color: {label.color}"
										></span>
										{label.name}
									</span>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Date badge -->
					{#if task.dueDate}
						<span
							class="flex-shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium {isOverdue(
								task.dueDate
							)
								? 'bg-red-500/10 text-red-500'
								: isToday(task.dueDate)
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
					href={todoUrl}
					target="_blank"
					rel="noopener"
					class="block rounded-lg py-2 text-center text-sm text-primary hover:bg-primary/5"
				>
					+{remainingCount} weitere
				</a>
			{/if}
		</div>
	{/if}
</div>
