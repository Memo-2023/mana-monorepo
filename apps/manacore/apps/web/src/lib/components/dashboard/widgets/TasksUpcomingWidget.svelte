<script lang="ts">
	/**
	 * TasksUpcomingWidget - Upcoming tasks for the next 7 days
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { todoService, type Task } from '$lib/api/services';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let loadingState = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<Task[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	const MAX_DISPLAY = 5;

	async function load() {
		loadingState = 'loading';
		retrying = true;

		const result = await todoService.getUpcomingTasks(7);

		if (result.data) {
			data = result.data;
			loadingState = 'success';
			retryCount = 0;
		} else {
			error = result.error;
			loadingState = 'error';

			// Don't retry if service is unavailable (network error)
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

		if (date.toDateString() === today.toDateString()) {
			return 'Heute';
		}
		if (date.toDateString() === tomorrow.toDateString()) {
			return 'Morgen';
		}

		return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
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
			<span class="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
				{data.length}
			</span>
		{/if}
	</div>

	{#if loadingState === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if loadingState === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if data.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">📭</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.tasks_upcoming.empty')}
			</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each displayedTasks as task}
				<div
					class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
				>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{task.title}</p>
						{#if task.dueDate}
							<p class="text-xs text-muted-foreground">{formatDate(task.dueDate)}</p>
						{/if}
					</div>
				</div>
			{/each}

			{#if remainingCount > 0}
				<a
					href="http://localhost:5188"
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
