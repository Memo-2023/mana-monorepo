<script lang="ts">
	/**
	 * TasksTodayWidget - Today's tasks from Todo app
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { todoService, type Task } from '$lib/api/services';
	import { APP_URLS } from '@manacore/shared-branding';
	import { format, isToday, isTomorrow, isPast } from 'date-fns';
	import { de } from 'date-fns/locale';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	function formatDueDate(dueDate?: string): string | null {
		if (!dueDate) return null;
		const date = new Date(dueDate);
		if (isToday(date)) return 'Heute';
		if (isTomorrow(date)) return 'Morgen';
		return format(date, 'dd. MMM', { locale: de });
	}

	function isOverdue(dueDate?: string): boolean {
		if (!dueDate) return false;
		const date = new Date(dueDate);
		return isPast(date) && !isToday(date);
	}

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

		const result = await todoService.getAllOpenTasks();

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

	const displayedTasks = $derived((data || []).slice(0, MAX_DISPLAY));
	const remainingCount = $derived(Math.max(0, (data || []).length - MAX_DISPLAY));
	const completedCount = $derived((data || []).filter((t) => t.isCompleted).length);
	const totalCount = $derived((data || []).length);

	function getSubtaskProgress(task: Task): string | null {
		if (!task.subtasks || task.subtasks.length === 0) return null;
		const done = task.subtasks.filter((s) => s.isCompleted).length;
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
				{completedCount}/{totalCount}
			</span>
		{/if}
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if totalCount === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">🎉</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.tasks_today.empty')}
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

					<!-- Checkbox -->
					<div
						class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 {task.isCompleted
							? 'border-primary bg-primary'
							: 'border-muted-foreground/40'}"
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
						<!-- Meta row: time, subtasks, labels -->
						{#if task.dueTime || getSubtaskProgress(task) || (task.labels && task.labels.length > 0)}
							<div class="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
								{#if task.dueTime}
									<span>{task.dueTime}</span>
								{/if}
								{#if getSubtaskProgress(task)}
									<span class="flex items-center gap-0.5">
										<svg
											class="h-3 w-3"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
											/>
										</svg>
										{getSubtaskProgress(task)}
									</span>
								{/if}
								{#if task.labels && task.labels.length > 0}
									{#each task.labels.slice(0, 2) as label}
										<span class="flex items-center gap-1">
											<span
												class="inline-block h-2 w-2 rounded-full"
												style="background-color: {label.color}"
											></span>
											{label.name}
										</span>
									{/each}
									{#if task.labels.length > 2}
										<span>+{task.labels.length - 2}</span>
									{/if}
								{/if}
							</div>
						{/if}
					</div>
				</a>
			{/each}

			{#if remainingCount > 0}
				<a
					href={todoUrl}
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
