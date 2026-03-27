<script lang="ts">
	import { onMount } from 'svelte';
	import { format, addDays, subDays, startOfDay } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { Sparkle, ArrowDown } from '@manacore/shared-icons';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { applyTaskFilters } from '$lib/utils/task-filters';
	import TaskList from '$lib/components/TaskList.svelte';
	import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';
	import { TaskListSkeleton } from '$lib/components/skeletons';
	import type { Task } from '@todo/shared';

	let isLoading = $state(true);
	let tipDismissed = $state(false);

	// Build filter criteria from viewStore (reactive)
	let filterCriteria = $derived({
		priorities: viewStore.filterPriorities,
		projectId: viewStore.filterProjectId,
		labelIds: viewStore.filterLabelIds,
		searchQuery: viewStore.filterSearchQuery,
	});

	function applyFilters(tasks: Task[]): Task[] {
		return applyTaskFilters(tasks, filterCriteria);
	}

	onMount(async () => {
		viewStore.setToday();

		try {
			// Fetch tasks (works in both guest and authenticated mode)
			await tasksStore.fetchAllTasks();
		} catch (error) {
			console.error('Failed to load tasks:', error);
		}

		isLoading = false;
	});

	// Derived task lists (with filters applied)
	let overdueTasks = $derived(applyFilters(tasksStore.overdueTasks));
	let todayTasks = $derived(applyFilters(tasksStore.todayTasks));
	let completedTasks = $derived(applyFilters(tasksStore.completedTasks));

	// Tomorrow's tasks
	let tomorrowDate = $derived(addDays(startOfDay(new Date()), 1));
	let dayAfterTomorrowDate = $derived(addDays(startOfDay(new Date()), 2));
	let tomorrowTasks = $derived(
		applyFilters(
			tasksStore.tasks.filter((task) => {
				if (!task.dueDate || task.isCompleted) return false;
				const taskDate = startOfDay(new Date(task.dueDate));
				return taskDate.getTime() === tomorrowDate.getTime();
			})
		)
	);

	// Group upcoming tasks by day (starting from day after tomorrow)
	let groupedUpcomingTasks = $derived(() => {
		const groups: { date: Date; label: string; tasks: Task[] }[] = [];
		const today = startOfDay(new Date());

		// Start from day after tomorrow (day 2) through day 7
		for (let i = 2; i <= 7; i++) {
			const date = addDays(today, i);
			const dayTasks = applyFilters(
				tasksStore.tasks.filter((task) => {
					if (!task.dueDate || task.isCompleted) return false;
					const taskDate = startOfDay(new Date(task.dueDate));
					return taskDate.getTime() === date.getTime();
				})
			);

			if (dayTasks.length > 0) {
				const label = format(date, 'EEEE, d. MMMM', { locale: de });
				groups.push({ date, label, tasks: dayTasks });
			}
		}

		return groups;
	});

	// Total upcoming count (excluding tomorrow)
	let upcomingCount = $derived(
		groupedUpcomingTasks().reduce((sum, group) => sum + group.tasks.length, 0)
	);

	// Check if all sections are empty
	let allEmpty = $derived(
		overdueTasks.length === 0 &&
			todayTasks.length === 0 &&
			tomorrowTasks.length === 0 &&
			upcomingCount === 0 &&
			completedTasks.length === 0
	);

	// Section visibility logic - show only sections with tasks (except "Today" which is always shown when not all empty)
	let showTodaySection = $derived(todayTasks.length > 0 || !allEmpty);
	let showTomorrowSection = $derived(tomorrowTasks.length > 0);
	let showUpcomingSection = $derived(upcomingCount > 0);
	let showCompletedSection = $derived(completedTasks.length > 0);

	// Onboarding tip: show when user has 1-3 active tasks
	let totalActiveTasks = $derived(
		overdueTasks.length + todayTasks.length + tomorrowTasks.length + upcomingCount
	);
	let showOnboardingTip = $derived(totalActiveTasks > 0 && totalActiveTasks <= 3);

	// Syntax example snippets for empty state
	const syntaxExamples = [
		{ text: 'Meeting morgen 14 Uhr', description: 'Datum & Uhrzeit' },
		{ text: 'Einkaufen #privat', description: 'Mit Label' },
		{ text: 'Wichtig erledigen !hoch', description: 'Mit Priorität' },
	];

	// Handle clicking a syntax example
	function handleExampleClick(text: string) {
		window.dispatchEvent(new CustomEvent('quick-input-set', { detail: { text } }));
	}

	// Drag and drop handler - uses optimistic updates for smooth UX
	async function handleTaskDrop(taskId: string, targetDate: Date | 'completed' | 'overdue') {
		const task = tasksStore.tasks.find((t) => t.id === taskId);
		if (!task) return;

		if (targetDate === 'completed') {
			// Mark task as completed (optimistic)
			if (!task.isCompleted) {
				await tasksStore.updateTaskOptimistic(taskId, { isCompleted: true });
			}
		} else if (targetDate === 'overdue') {
			// Set to yesterday (optimistic)
			const yesterday = subDays(startOfDay(new Date()), 1);
			await tasksStore.updateTaskOptimistic(taskId, {
				dueDate: yesterday.toISOString(),
				isCompleted: task.isCompleted ? false : undefined,
			});
		} else {
			// Set to specific date (optimistic)
			await tasksStore.updateTaskOptimistic(taskId, {
				dueDate: targetDate.toISOString(),
				isCompleted: task.isCompleted ? false : undefined,
			});
		}
	}
</script>

<svelte:head>
	<title>Todo</title>
</svelte:head>

<div class="unified-view">
	{#if isLoading || tasksStore.loading}
		<TaskListSkeleton sections={3} tasksPerSection={3} />
	{:else if tasksStore.error}
		<div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
			{tasksStore.error}
		</div>
	{:else if allEmpty}
		<!-- Enhanced empty state -->
		<div class="empty-state-container">
			<div class="empty-state-content">
				<!-- Animated icon -->
				<div class="empty-state-icon">
					<Sparkle size={56} weight="duotone" />
				</div>

				<!-- Motivational message -->
				<h2 class="empty-state-title">Bereit für einen produktiven Tag</h2>

				<!-- Call to action with arrow -->
				<div class="empty-state-cta">
					<p class="empty-state-cta-text">Tippe unten um loszulegen...</p>
					<div class="empty-state-arrow">
						<ArrowDown size={20} weight="bold" />
					</div>
				</div>

				<!-- Syntax examples -->
				<div class="empty-state-examples">
					<p class="examples-label">Schnellstart-Tipps</p>
					<div class="examples-grid">
						{#each syntaxExamples as example}
							<button
								type="button"
								class="example-chip"
								onclick={() => handleExampleClick(example.text)}
								title={example.description}
							>
								{example.text}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="notepad">
			<div class="notepad-content">
				<div class="space-y-2">
					<!-- Overdue Section - only show if there are overdue tasks -->
					{#if overdueTasks.length > 0}
						<CollapsibleSection
							title="Überfällig"
							count={overdueTasks.length}
							icon="warning"
							variant="warning"
							defaultOpen={true}
						>
							<TaskList
								tasks={overdueTasks}
								enableDragDrop
								dropTargetDate="overdue"
								onTaskDrop={handleTaskDrop}
							/>
						</CollapsibleSection>
					{/if}

					<!-- Today Section - always visible when there are any tasks -->
					{#if showTodaySection}
						<CollapsibleSection
							title="Heute"
							count={todayTasks.length}
							icon="today"
							variant="default"
							defaultOpen={true}
						>
							<TaskList
								tasks={todayTasks}
								enableDragDrop
								dropTargetDate={startOfDay(new Date())}
								onTaskDrop={handleTaskDrop}
							/>
						</CollapsibleSection>
					{/if}

					<!-- Tomorrow Section - only show if there are tasks -->
					{#if showTomorrowSection}
						<CollapsibleSection
							title="Morgen"
							count={tomorrowTasks.length}
							icon="upcoming"
							variant="default"
							defaultOpen={true}
						>
							<TaskList
								tasks={tomorrowTasks}
								enableDragDrop
								dropTargetDate={tomorrowDate}
								onTaskDrop={handleTaskDrop}
							/>
						</CollapsibleSection>
					{/if}

					<!-- Upcoming Section - only show if there are tasks -->
					{#if showUpcomingSection}
						<CollapsibleSection
							title="Demnächst"
							count={upcomingCount}
							icon="upcoming"
							variant="default"
							defaultOpen={true}
						>
							<div class="space-y-4">
								{#each groupedUpcomingTasks() as group}
									<div>
										<h3 class="text-sm font-medium text-muted-foreground mb-2 pl-2">
											{group.label}
										</h3>
										<TaskList
											tasks={group.tasks}
											enableDragDrop
											dropTargetDate={group.date}
											onTaskDrop={handleTaskDrop}
										/>
									</div>
								{/each}
							</div>
						</CollapsibleSection>
					{/if}

					<!-- Completed Section - only show if there are completed tasks -->
					{#if showCompletedSection}
						<CollapsibleSection
							title="Erledigt"
							count={completedTasks.length}
							icon="completed"
							variant="success"
							defaultOpen={true}
						>
							<TaskList
								tasks={completedTasks}
								enableDragDrop
								dropTargetDate="completed"
								onTaskDrop={handleTaskDrop}
								showCompleted
							/>
						</CollapsibleSection>
					{/if}

					<!-- Onboarding tip for users with 1-3 tasks -->
					{#if showOnboardingTip && !tipDismissed}
						<div class="onboarding-tip">
							<span class="onboarding-tip-icon">💡</span>
							<span class="onboarding-tip-text">
								Tipp: Nutze <code>#tags</code> und <code>!priorität</code> für bessere Organisation
							</span>
							<button
								class="onboarding-tip-close"
								onclick={() => (tipDismissed = true)}
								title="Tipp ausblenden"
								aria-label="Tipp ausblenden"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.unified-view {
		padding-bottom: 100px;
	}

	/* Empty state container */
	.empty-state-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
		padding: 2rem;
	}

	.empty-state-content {
		text-align: center;
		max-width: 400px;
	}

	.empty-state-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 1.5rem;
		color: hsl(var(--color-primary));
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
		}
	}

	.empty-state-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin-bottom: 1.5rem;
	}

	.empty-state-cta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: hsl(var(--color-surface-hover));
		border-radius: 0.75rem;
		margin-bottom: 2rem;
	}

	.empty-state-cta-text {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.9375rem;
	}

	.empty-state-arrow {
		color: hsl(var(--color-primary));
		animation: bounce 2s ease-in-out infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(4px);
		}
	}

	.empty-state-examples {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.examples-label {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	.examples-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}

	.example-chip {
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 9999px;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.example-chip:hover {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		transform: translateY(-1px);
	}

	.example-chip:active {
		transform: translateY(0);
	}

	/* Onboarding tip */
	.onboarding-tip {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		margin-top: 1rem;
		background: hsl(var(--color-primary) / 0.08);
		border: 1px solid hsl(var(--color-primary) / 0.2);
		border-radius: 0.75rem;
		font-size: 0.875rem;
	}

	.onboarding-tip-icon {
		flex-shrink: 0;
	}

	.onboarding-tip-text {
		color: hsl(var(--color-muted-foreground));
	}

	.onboarding-tip-close {
		flex-shrink: 0;
		margin-left: auto;
		padding: 0.25rem;
		border-radius: 0.375rem;
		color: hsl(var(--color-muted-foreground));
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.onboarding-tip-close:hover {
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-primary) / 0.15);
	}

	.onboarding-tip-text code {
		padding: 0.125rem 0.375rem;
		font-size: 0.8125rem;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
		background: hsl(var(--color-primary) / 0.15);
		border-radius: 0.25rem;
		color: hsl(var(--color-primary));
	}

	/* Notepad container */
	.notepad {
		max-width: 560px;
		margin: 0 auto;
		background: #fffef5;
		border-radius: 0.5rem;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 1px 2px rgba(0, 0, 0, 0.04);
		position: relative;
	}

	:global(.dark) .notepad {
		background: #2a2520;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.notepad-content {
		padding: 0.75rem 1rem 1.5rem 1rem;
		min-height: 200px;
	}

	@media (max-width: 640px) {
		.notepad {
			max-width: 100%;
			border-radius: 0.5rem;
		}
	}
</style>
