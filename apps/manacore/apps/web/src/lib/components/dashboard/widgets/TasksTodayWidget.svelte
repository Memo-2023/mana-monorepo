<script lang="ts">
	/**
	 * TasksTodayWidget - Today's tasks from Todo app
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { todoService, type Task } from '$lib/api/services';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<Task[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	const MAX_DISPLAY = 5;

	async function load() {
		state = 'loading';
		retrying = true;

		const result = await todoService.getTodayTasks();

		if (result.data) {
			data = result.data;
			state = 'success';
			retryCount = 0;
		} else {
			error = result.error;
			state = 'error';

			// Auto-retry up to 3 times
			if (retryCount < 3) {
				retryCount++;
				setTimeout(load, 5000 * retryCount);
			}
		}

		retrying = false;
	}

	onMount(load);

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'urgent':
				return 'text-red-500';
			case 'high':
				return 'text-orange-500';
			case 'medium':
				return 'text-yellow-500';
			default:
				return 'text-muted-foreground';
		}
	}

	const displayedTasks = $derived(data.slice(0, MAX_DISPLAY));
	const remainingCount = $derived(Math.max(0, data.length - MAX_DISPLAY));
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>✅</span>
			{$_('dashboard.widgets.tasks_today.title')}
		</h3>
		{#if data.length > 0}
			<span class="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
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
			<div class="mb-2 text-3xl">🎉</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.tasks_today.empty')}
			</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each displayedTasks as task}
				<div
					class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
				>
					<div
						class="h-4 w-4 rounded border-2 {task.isCompleted
							? 'border-primary bg-primary'
							: 'border-muted-foreground'}"
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
					</div>
					<div class="min-w-0 flex-1">
						<p
							class="truncate text-sm font-medium {task.isCompleted
								? 'text-muted-foreground line-through'
								: ''}"
						>
							{task.title}
						</p>
						{#if task.dueTime}
							<p class="text-xs text-muted-foreground">{task.dueTime}</p>
						{/if}
					</div>
					{#if !task.isCompleted && task.priority !== 'low'}
						<span class={getPriorityColor(task.priority)}>●</span>
					{/if}
				</div>
			{/each}

			{#if remainingCount > 0}
				<a
					href="http://localhost:5188"
					target="_blank"
					rel="noopener"
					class="block rounded-lg py-2 text-center text-sm text-primary hover:bg-primary/5"
				>
					{$_('dashboard.widgets.tasks_today.view_all', { values: { count: remainingCount } })}
				</a>
			{/if}
		</div>
	{/if}
</div>
