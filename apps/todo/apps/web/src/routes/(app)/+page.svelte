<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { format, addDays, subDays, startOfDay } from 'date-fns';
	import { de } from 'date-fns/locale';
	import {
		Sparkle,
		ArrowDown,
		Warning,
		CalendarBlank,
		CalendarDots,
		CheckCircle,
	} from '@manacore/shared-icons';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { applyTaskFilters } from '$lib/utils/task-filters';
	import { filterOverdue, filterToday, filterCompleted } from '$lib/data/task-queries';
	import TaskList from '$lib/components/TaskList.svelte';
	import { TaskListSkeleton } from '$lib/components/skeletons';
	import type { Task } from '@todo/shared';

	// Live tasks from layout context — auto-updates on IndexedDB changes
	const allTasks: { readonly value: Task[]; readonly loading: boolean; readonly error: unknown } =
		getContext('tasks');

	let tipDismissed = $state(false);
	let completedOpen = $state(false);

	// Stable date references (computed once, not on every re-render)
	const today = startOfDay(new Date());
	const tomorrow = addDays(today, 1);

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

	onMount(() => {
		viewStore.setToday();
	});

	// Derived task lists (with filters applied) — automatically reactive via liveQuery
	let overdueTasks = $derived(applyFilters(filterOverdue(allTasks.value)));
	let todayTasks = $derived(applyFilters(filterToday(allTasks.value)));
	let completedTasks = $derived(applyFilters(filterCompleted(allTasks.value)));

	// Tomorrow's tasks
	let tomorrowTasks = $derived(
		applyFilters(
			allTasks.value.filter((task) => {
				if (!task.dueDate || task.isCompleted) return false;
				const taskDate = startOfDay(new Date(task.dueDate));
				return taskDate.getTime() === tomorrow.getTime();
			})
		)
	);

	// Group upcoming tasks by day (starting from day after tomorrow)
	let groupedUpcomingTasks = $derived.by(() => {
		const groups: { date: Date; label: string; tasks: Task[] }[] = [];

		for (let i = 2; i <= 7; i++) {
			const date = addDays(today, i);
			const dayTasks = applyFilters(
				allTasks.value.filter((task) => {
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
		groupedUpcomingTasks.reduce((sum, group) => sum + group.tasks.length, 0)
	);

	// Check if all sections are empty
	let allEmpty = $derived(
		overdueTasks.length === 0 &&
			todayTasks.length === 0 &&
			tomorrowTasks.length === 0 &&
			upcomingCount === 0 &&
			completedTasks.length === 0
	);

	// Section visibility logic
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

	function handleExampleClick(text: string) {
		window.dispatchEvent(new CustomEvent('quick-input-set', { detail: { text } }));
	}

	// Drag and drop handler
	async function handleTaskDrop(taskId: string, targetDate: Date | 'completed' | 'overdue') {
		const task = allTasks.value.find((t) => t.id === taskId);
		if (!task) return;

		if (targetDate === 'completed') {
			if (!task.isCompleted) {
				await tasksStore.updateTaskOptimistic(taskId, { isCompleted: true });
			}
		} else if (targetDate === 'overdue') {
			const yesterday = subDays(today, 1);
			await tasksStore.updateTaskOptimistic(taskId, {
				dueDate: yesterday.toISOString(),
				isCompleted: task.isCompleted ? false : undefined,
			});
		} else {
			await tasksStore.updateTaskOptimistic(taskId, {
				dueDate: targetDate.toISOString(),
				isCompleted: task.isCompleted ? false : undefined,
			});
		}
	}

	// Build pages array from visible sections
	let pages = $derived.by(() => {
		const p: { id: string; label: string; icon: string }[] = [];
		if (overdueTasks.length > 0) p.push({ id: 'overdue', label: 'Überfällig', icon: 'warning' });
		if (showTodaySection) p.push({ id: 'today', label: 'Heute', icon: 'calendar' });
		if (showTomorrowSection) p.push({ id: 'tomorrow', label: 'Morgen', icon: 'calendar-dots' });
		if (showUpcomingSection) p.push({ id: 'upcoming', label: 'Demnächst', icon: 'calendar-dots' });
		if (showCompletedSection) p.push({ id: 'completed', label: 'Erledigt', icon: 'check' });
		return p;
	});

	let activePage = $state(0);
	let scrollContainer: HTMLDivElement | undefined = $state();

	function scrollToPage(index: number) {
		if (!scrollContainer) return;
		const sheets = scrollContainer.querySelectorAll('.notepad-sheet');
		if (sheets[index]) {
			sheets[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
		}
	}

	function handleScroll() {
		if (!scrollContainer) return;
		const sheets = scrollContainer.querySelectorAll('.notepad-sheet');
		const containerRect = scrollContainer.getBoundingClientRect();
		const center = containerRect.left + containerRect.width / 2;

		let closest = 0;
		let closestDist = Infinity;
		sheets.forEach((sheet, i) => {
			const rect = sheet.getBoundingClientRect();
			const sheetCenter = rect.left + rect.width / 2;
			const dist = Math.abs(sheetCenter - center);
			if (dist < closestDist) {
				closestDist = dist;
				closest = i;
			}
		});
		activePage = closest;
	}
</script>

<svelte:head>
	<title>Todo</title>
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		const target = e.target as HTMLElement;
		const isInQuickInput = target.closest('.quick-input-bar');
		if (isInQuickInput && (e.key === 'ArrowUp' || (e.key === 'Tab' && !e.shiftKey))) {
			const firstTitle = document.querySelector<HTMLElement>('.task-title[contenteditable]');
			if (firstTitle) {
				e.preventDefault();
				firstTitle.focus();
			}
		}
	}}
/>

{#if allTasks.loading}
	<div class="notepad-page">
		<div class="scroll-track">
			<div class="notepad-sheet">
				<TaskListSkeleton sections={3} tasksPerSection={3} />
			</div>
		</div>
	</div>
{:else if allTasks.error}
	<div class="notepad-page">
		<div class="scroll-track">
			<div class="notepad-sheet">
				<div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
					{allTasks.error}
				</div>
			</div>
		</div>
	</div>
{:else if allEmpty}
	<div class="notepad-page">
		<div class="scroll-track">
			<div class="notepad-sheet">
				<div class="empty-state-container">
					<div class="empty-state-content">
						<div class="empty-state-icon">
							<Sparkle size={56} weight="duotone" />
						</div>
						<h2 class="empty-state-title">Bereit für einen produktiven Tag</h2>
						<div class="empty-state-cta">
							<p class="empty-state-cta-text">Tippe unten um loszulegen...</p>
							<div class="empty-state-arrow">
								<ArrowDown size={20} weight="bold" />
							</div>
						</div>
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
			</div>
		</div>
	</div>
{:else}
	<!-- Page tabs -->
	{#if pages.length > 1}
		<div class="page-tabs">
			{#each pages as page, i}
				<button class="page-tab" class:active={activePage === i} onclick={() => scrollToPage(i)}>
					{page.label}
				</button>
			{/each}
		</div>
	{/if}

	<div class="notepad-page">
		<div class="scroll-track" bind:this={scrollContainer} onscroll={handleScroll}>
			<!-- Overdue page -->
			{#if overdueTasks.length > 0}
				<div class="notepad-sheet">
					<div class="sheet-header sheet-header-warning">
						<Warning size={18} weight="bold" />
						<span>Überfällig</span>
						<span class="section-count">{overdueTasks.length}</span>
					</div>
					<div class="sheet-content">
						<TaskList
							tasks={overdueTasks}
							enableDragDrop
							dropTargetDate="overdue"
							onTaskDrop={handleTaskDrop}
						/>
					</div>
				</div>
			{/if}

			<!-- Today page -->
			{#if showTodaySection}
				<div class="notepad-sheet">
					<div class="sheet-header">
						<CalendarBlank size={18} weight="bold" />
						<span>Heute</span>
						{#if todayTasks.length > 0}
							<span class="section-count">{todayTasks.length}</span>
						{/if}
					</div>
					<div class="sheet-content">
						<TaskList
							tasks={todayTasks}
							enableDragDrop
							dropTargetDate={today}
							onTaskDrop={handleTaskDrop}
						/>
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
			{/if}

			<!-- Tomorrow page -->
			{#if showTomorrowSection}
				<div class="notepad-sheet">
					<div class="sheet-header">
						<CalendarDots size={18} weight="bold" />
						<span>Morgen</span>
						<span class="section-count">{tomorrowTasks.length}</span>
					</div>
					<div class="sheet-content">
						<TaskList
							tasks={tomorrowTasks}
							enableDragDrop
							dropTargetDate={tomorrow}
							onTaskDrop={handleTaskDrop}
						/>
					</div>
				</div>
			{/if}

			<!-- Upcoming page -->
			{#if showUpcomingSection}
				<div class="notepad-sheet">
					<div class="sheet-header">
						<CalendarDots size={18} weight="bold" />
						<span>Demnächst</span>
						<span class="section-count">{upcomingCount}</span>
					</div>
					<div class="sheet-content">
						{#each groupedUpcomingTasks as group}
							<div class="subsection">
								<h3 class="subsection-label">{group.label}</h3>
								<TaskList
									tasks={group.tasks}
									enableDragDrop
									dropTargetDate={group.date}
									onTaskDrop={handleTaskDrop}
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Completed page -->
			{#if showCompletedSection}
				<div class="notepad-sheet sheet-completed">
					<div class="sheet-header">
						<CheckCircle size={18} weight="bold" />
						<span>Erledigt</span>
						<span class="section-count">{completedTasks.length}</span>
					</div>
					<div class="sheet-content">
						<TaskList
							tasks={completedTasks}
							enableDragDrop
							dropTargetDate="completed"
							onTaskDrop={handleTaskDrop}
							showCompleted
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* ── Page tabs ── */
	.page-tabs {
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem 1.5rem 0;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.page-tabs::-webkit-scrollbar {
		display: none;
	}

	.page-tab {
		padding: 0.375rem 0.875rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #9ca3af;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s ease;
	}

	.page-tab:hover {
		color: #6b7280;
	}

	.page-tab.active {
		color: hsl(var(--color-primary));
		border-bottom-color: hsl(var(--color-primary));
	}

	:global(.dark) .page-tab {
		color: #6b7280;
	}
	:global(.dark) .page-tab:hover {
		color: #9ca3af;
	}
	:global(.dark) .page-tab.active {
		color: hsl(var(--color-primary-light, var(--color-primary)));
		border-bottom-color: hsl(var(--color-primary-light, var(--color-primary)));
	}

	/* ── Notepad page — horizontal scroll wrapper ── */
	.notepad-page {
		padding-bottom: 100px;
	}

	.scroll-track {
		display: flex;
		gap: 1.5rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-padding: 1.5rem;
		padding: 1rem 1.5rem 2rem;
		scrollbar-width: none;
	}
	.scroll-track::-webkit-scrollbar {
		display: none;
	}

	/* ── Paper sheet ── */
	.notepad-sheet {
		flex: 0 0 auto;
		width: min(840px, 85vw);
		min-height: 60vh;
		scroll-snap-align: center;
		background: #fffef5;
		border-radius: 0.375rem;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	:global(.dark) .notepad-sheet {
		background-color: #252220;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.06);
	}

	.sheet-completed {
		opacity: 0.75;
	}

	/* ── Sheet header ── */
	.sheet-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .sheet-header {
		color: #d1d5db;
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}

	.sheet-header-warning {
		color: #dc2626;
	}
	:global(.dark) .sheet-header-warning {
		color: #f87171;
	}

	.section-count {
		font-size: 0.6875rem;
		font-weight: 500;
		background: rgba(0, 0, 0, 0.06);
		color: #6b7280;
		padding: 0.0625rem 0.4375rem;
		border-radius: 9999px;
		line-height: 1.4;
	}
	:global(.dark) .section-count {
		background: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}
	.sheet-header-warning .section-count {
		background: rgba(220, 38, 38, 0.1);
		color: #dc2626;
	}
	:global(.dark) .sheet-header-warning .section-count {
		background: rgba(248, 113, 113, 0.15);
		color: #f87171;
	}

	/* ── Sheet content ── */
	.sheet-content {
		flex: 1;
		padding: 0.5rem 0;
	}

	/* ── Subsections (upcoming days) ── */
	.subsection {
		margin: 0;
		padding: 0;
	}

	.subsection-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #9ca3af;
		min-height: 2.5rem;
		display: flex;
		align-items: center;
		padding: 0 1.5rem;
		margin: 0;
	}
	:global(.dark) .subsection-label {
		color: #6b7280;
	}

	/* ── Empty state ── */
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
		color: #374151;
		margin-bottom: 1.5rem;
	}
	:global(.dark) .empty-state-title {
		color: #f3f4f6;
	}

	.empty-state-cta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: rgba(0, 0, 0, 0.04);
		border-radius: 0.75rem;
		margin-bottom: 2rem;
	}
	:global(.dark) .empty-state-cta {
		background: rgba(255, 255, 255, 0.06);
	}

	.empty-state-cta-text {
		color: #6b7280;
		font-size: 0.9375rem;
	}
	:global(.dark) .empty-state-cta-text {
		color: #9ca3af;
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
		color: #9ca3af;
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
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		color: #374151;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	:global(.dark) .example-chip {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.12);
		color: #e5e7eb;
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

	/* ── Onboarding tip ── */
	.onboarding-tip {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.5rem;
		margin: 0.5rem 0;
		font-size: 0.875rem;
	}

	.onboarding-tip-icon {
		flex-shrink: 0;
	}

	.onboarding-tip-text {
		color: #6b7280;
	}
	:global(.dark) .onboarding-tip-text {
		color: #9ca3af;
	}

	.onboarding-tip-close {
		flex-shrink: 0;
		margin-left: auto;
		padding: 0.25rem;
		border-radius: 0.375rem;
		color: #9ca3af;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.onboarding-tip-close:hover {
		color: #374151;
		background: hsl(var(--color-primary) / 0.15);
	}
	:global(.dark) .onboarding-tip-close:hover {
		color: #f3f4f6;
	}

	.onboarding-tip-text code {
		padding: 0.125rem 0.375rem;
		font-size: 0.8125rem;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
		background: hsl(var(--color-primary) / 0.15);
		border-radius: 0.25rem;
		color: hsl(var(--color-primary));
	}
</style>
