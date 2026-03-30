<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { format, addDays, subDays, startOfDay } from 'date-fns';
	import { de } from 'date-fns/locale';
	import {
		Sparkle,
		ArrowDown,
		ArrowLeft,
		ArrowRight,
		Warning,
		CalendarBlank,
		CalendarDots,
		CheckCircle,
		Plus,
		Trash,
		PencilSimple,
		GearSix,
		X,
		Star,
		Lightning,
		Clock,
		Fire,
		Leaf,
		Heart,
	} from '@manacore/shared-icons';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import {
		todoSettings,
		type PageConfig,
		type PageMode,
		type PageIcon,
		type PageWidth,
	} from '$lib/stores/settings.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { applyTaskFilters } from '$lib/utils/task-filters';
	import { filterOverdue, filterToday, filterCompleted } from '$lib/data/task-queries';
	import TaskList from '$lib/components/TaskList.svelte';
	import { TaskListSkeleton } from '$lib/components/skeletons';
	import type { Task } from '@todo/shared';

	const allTasks: { readonly value: Task[]; readonly loading: boolean; readonly error: unknown } =
		getContext('tasks');

	let tipDismissed = $state(false);
	let editMode = $state(false);
	let filterOpenId = $state<string | null>(null);

	const today = startOfDay(new Date());
	const tomorrow = addDays(today, 1);

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

	// ── Derived task lists ──
	let activeTasks = $derived(applyFilters(allTasks.value.filter((t) => !t.isCompleted)));
	let completedTasks = $derived(applyFilters(filterCompleted(allTasks.value)));

	// Date-mode lists
	let overdueTasks = $derived(applyFilters(filterOverdue(allTasks.value)));
	let todayTasks = $derived(applyFilters(filterToday(allTasks.value)));
	let tomorrowTasks = $derived(
		applyFilters(
			allTasks.value.filter((task) => {
				if (!task.dueDate || task.isCompleted) return false;
				const taskDate = startOfDay(new Date(task.dueDate));
				return taskDate.getTime() === tomorrow.getTime();
			})
		)
	);
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
				groups.push({
					date,
					label: format(date, 'EEEE, d. MMMM', { locale: de }),
					tasks: dayTasks,
				});
			}
		}
		return groups;
	});
	let upcomingCount = $derived(groupedUpcomingTasks.reduce((sum, g) => sum + g.tasks.length, 0));

	// Priority-mode lists
	let urgentImportant = $derived(
		activeTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high')
	);
	let importantLater = $derived(
		activeTasks.filter((t) => t.priority === 'medium' || t.priority === 'low' || !t.priority)
	);

	// Custom-mode filter
	function filterByPageConfig(config: PageConfig): Task[] {
		let tasks = config.filter.completed
			? applyFilters(allTasks.value.filter((t) => t.isCompleted))
			: activeTasks;
		if (config.filter.priorities?.length) {
			tasks = tasks.filter((t) => config.filter.priorities!.includes(t.priority as any));
		}
		if (config.filter.dateRange && config.filter.dateRange !== 'any') {
			tasks = tasks.filter((t) => {
				if (!t.dueDate) return false;
				const d = startOfDay(new Date(t.dueDate));
				switch (config.filter.dateRange) {
					case 'overdue':
						return d.getTime() < today.getTime();
					case 'today':
						return d.getTime() === today.getTime();
					case 'tomorrow':
						return d.getTime() === tomorrow.getTime();
					case 'upcoming':
						return d.getTime() > tomorrow.getTime();
					default:
						return true;
				}
			});
		}
		return tasks;
	}

	let customPageData = $derived(
		todoSettings.customPages.map((c) => ({ config: c, tasks: filterByPageConfig(c) }))
	);
	let allEmpty = $derived(activeTasks.length === 0 && completedTasks.length === 0);
	let showOnboardingTip = $derived(activeTasks.length > 0 && activeTasks.length <= 3);

	const syntaxExamples = [
		{ text: 'Meeting morgen 14 Uhr', description: 'Datum & Uhrzeit' },
		{ text: 'Einkaufen #privat', description: 'Mit Label' },
		{ text: 'Wichtig erledigen !hoch', description: 'Mit Priorität' },
	];

	function handleExampleClick(text: string) {
		window.dispatchEvent(new CustomEvent('quick-input-set', { detail: { text } }));
	}

	async function handleTaskDrop(taskId: string, targetDate: Date | 'completed' | 'overdue') {
		const task = allTasks.value.find((t) => t.id === taskId);
		if (!task) return;
		if (targetDate === 'completed') {
			if (!task.isCompleted) await tasksStore.updateTaskOptimistic(taskId, { isCompleted: true });
		} else if (targetDate === 'overdue') {
			await tasksStore.updateTaskOptimistic(taskId, {
				dueDate: subDays(today, 1).toISOString(),
				isCompleted: task.isCompleted ? false : undefined,
			});
		} else {
			await tasksStore.updateTaskOptimistic(taskId, {
				dueDate: targetDate.toISOString(),
				isCompleted: task.isCompleted ? false : undefined,
			});
		}
	}

	// Scroll tracking
	let scrollContainer: HTMLDivElement | undefined = $state();
	let activePage = $state(0);
	let sheetCount = $state(0);

	function handleScroll() {
		if (!scrollContainer) return;
		const sheets = scrollContainer.querySelectorAll('.notepad-sheet');
		sheetCount = sheets.length;
		const containerRect = scrollContainer.getBoundingClientRect();
		const center = containerRect.left + containerRect.width / 2;
		let closest = 0;
		let closestDist = Infinity;
		sheets.forEach((sheet, i) => {
			const rect = sheet.getBoundingClientRect();
			const dist = Math.abs(rect.left + rect.width / 2 - center);
			if (dist < closestDist) {
				closestDist = dist;
				closest = i;
			}
		});
		activePage = closest;
	}

	$effect(() => {
		if (scrollContainer) sheetCount = scrollContainer.querySelectorAll('.notepad-sheet').length;
	});

	// ── Inline edit mode helpers ──
	const PAGE_WIDTH_MAP: Record<string, string> = {
		narrow: 'min(640px, 85vw)',
		medium: 'min(840px, 85vw)',
		wide: 'min(1024px, 92vw)',
		full: '92vw',
	};

	let sheetWidth = $derived(PAGE_WIDTH_MAP[todoSettings.pageWidth] || PAGE_WIDTH_MAP.medium);

	const ICON_OPTIONS: { value: PageIcon; label: string }[] = [
		{ value: 'warning', label: '⚠️' },
		{ value: 'calendar', label: '📅' },
		{ value: 'calendar-dots', label: '📆' },
		{ value: 'check', label: '✅' },
		{ value: 'star', label: '⭐' },
		{ value: 'lightning', label: '⚡' },
		{ value: 'clock', label: '🕐' },
		{ value: 'fire', label: '🔥' },
		{ value: 'leaf', label: '🍃' },
		{ value: 'heart', label: '❤️' },
	];

	function setPageIcon(id: string, icon: PageIcon) {
		const pages = clonePages(todoSettings.customPages);
		const p = pages.find((pg: PageConfig) => pg.id === id);
		if (p) {
			p.icon = icon;
			todoSettings.set('customPages', pages);
		}
	}

	const WIDTH_OPTIONS: { value: PageWidth; label: string }[] = [
		{ value: 'narrow', label: 'S' },
		{ value: 'medium', label: 'M' },
		{ value: 'wide', label: 'L' },
		{ value: 'full', label: 'XL' },
	];

	const PRIORITY_CHIPS = [
		{ value: 'urgent' as const, label: 'Dringend', color: '#ef4444' },
		{ value: 'high' as const, label: 'Hoch', color: '#f97316' },
		{ value: 'medium' as const, label: 'Mittel', color: '#eab308' },
		{ value: 'low' as const, label: 'Niedrig', color: '#22c55e' },
	];

	function clonePages(pages: PageConfig[]): PageConfig[] {
		return JSON.parse(JSON.stringify(pages));
	}

	function ensureCustomPages(): PageConfig[] {
		if (todoSettings.customPages.length > 0) return clonePages(todoSettings.customPages);
		if (todoSettings.pageMode === 'priority') {
			return [
				{
					id: crypto.randomUUID(),
					label: 'Wichtig & Dringend',
					icon: 'fire' as PageIcon,
					filter: { priorities: ['urgent', 'high'] },
				},
				{
					id: crypto.randomUUID(),
					label: 'Wichtig & Später',
					icon: 'calendar-dots' as PageIcon,
					filter: { priorities: ['medium', 'low'] },
				},
				{
					id: crypto.randomUUID(),
					label: 'Erledigt',
					icon: 'check' as PageIcon,
					filter: { completed: true },
				},
			];
		}
		return [
			{
				id: crypto.randomUUID(),
				label: 'Heute',
				icon: 'calendar' as PageIcon,
				filter: { dateRange: 'today' },
			},
			{
				id: crypto.randomUUID(),
				label: 'Morgen',
				icon: 'calendar-dots' as PageIcon,
				filter: { dateRange: 'tomorrow' },
			},
			{
				id: crypto.randomUUID(),
				label: 'Erledigt',
				icon: 'check' as PageIcon,
				filter: { completed: true },
			},
		];
	}

	function enterEditMode() {
		const pages = ensureCustomPages();
		todoSettings.set('customPages', pages);
		todoSettings.set('pageMode', 'custom');
		editMode = true;
	}

	function exitEditMode() {
		editMode = false;
		filterOpenId = null;
	}

	function updatePageLabel(id: string, label: string) {
		const pages = clonePages(todoSettings.customPages);
		const p = pages.find((pg: PageConfig) => pg.id === id);
		if (p) {
			p.label = label;
			todoSettings.set('customPages', pages);
		}
	}

	function removePage(id: string) {
		todoSettings.set(
			'customPages',
			todoSettings.customPages.filter((p: PageConfig) => p.id !== id)
		);
		if (filterOpenId === id) filterOpenId = null;
	}

	function addPage() {
		const newPage: PageConfig = { id: crypto.randomUUID(), label: 'Neue Seite', filter: {} };
		todoSettings.set('customPages', [...todoSettings.customPages, newPage]);
		filterOpenId = newPage.id;
		// Scroll to end after render
		requestAnimationFrame(() => {
			if (scrollContainer)
				scrollContainer.scrollTo({ left: scrollContainer.scrollWidth, behavior: 'smooth' });
		});
	}

	function togglePriority(id: string, priority: 'low' | 'medium' | 'high' | 'urgent') {
		const pages = clonePages(todoSettings.customPages);
		const p = pages.find((pg: PageConfig) => pg.id === id);
		if (!p) return;
		const cur = p.filter.priorities || [];
		p.filter.priorities = cur.includes(priority)
			? cur.filter((x: string) => x !== priority)
			: [...cur, priority];
		if (p.filter.priorities.length === 0) p.filter.priorities = undefined;
		todoSettings.set('customPages', pages);
	}

	function setDateRange(id: string, val: string) {
		const pages = clonePages(todoSettings.customPages);
		const p = pages.find((pg: PageConfig) => pg.id === id);
		if (!p) return;
		p.filter.dateRange = val === 'any' ? undefined : (val as any);
		todoSettings.set('customPages', pages);
	}

	function toggleCompleted(id: string) {
		const pages = clonePages(todoSettings.customPages);
		const p = pages.find((pg: PageConfig) => pg.id === id);
		if (!p) return;
		p.filter.completed = p.filter.completed ? undefined : true;
		todoSettings.set('customPages', pages);
	}

	function movePage(id: string, dir: -1 | 1) {
		const pages = clonePages(todoSettings.customPages);
		const idx = pages.findIndex((p: PageConfig) => p.id === id);
		const target = idx + dir;
		if (target < 0 || target >= pages.length) return;
		[pages[idx], pages[target]] = [pages[target], pages[idx]];
		todoSettings.set('customPages', pages);
	}
</script>

<svelte:head>
	<title>Todo</title>
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && editMode) {
			exitEditMode();
			return;
		}
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
			<div class="notepad-sheet"><TaskListSkeleton sections={3} tasksPerSection={3} /></div>
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
{:else if allEmpty && !editMode}
	<div class="notepad-page">
		<div class="scroll-track">
			<div class="notepad-sheet">
				<div class="empty-state-container">
					<div class="empty-state-content">
						<div class="empty-state-icon"><Sparkle size={56} weight="duotone" /></div>
						<h2 class="empty-state-title">Bereit für einen produktiven Tag</h2>
						<div class="empty-state-cta">
							<p class="empty-state-cta-text">Tippe unten um loszulegen...</p>
							<div class="empty-state-arrow"><ArrowDown size={20} weight="bold" /></div>
						</div>
						<div class="empty-state-examples">
							<p class="examples-label">Schnellstart-Tipps</p>
							<div class="examples-grid">
								{#each syntaxExamples as example}
									<button
										type="button"
										class="example-chip"
										onclick={() => handleExampleClick(example.text)}
										title={example.description}>{example.text}</button
									>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="notepad-page" class:edit-mode={editMode}>
		{#if editMode}
			<div class="edit-toolbar">
				<span class="edit-toolbar-label">Seitenbreite</span>
				<div class="width-pills">
					{#each WIDTH_OPTIONS as opt}
						<button
							class="width-pill"
							class:active={todoSettings.pageWidth === opt.value}
							onclick={() => todoSettings.set('pageWidth', opt.value)}>{opt.label}</button
						>
					{/each}
				</div>
			</div>
		{/if}
		<div
			class="scroll-track"
			style="--sheet-width: {sheetWidth}"
			bind:this={scrollContainer}
			onscroll={handleScroll}
		>
			{#if todoSettings.pageMode === 'custom' || editMode}
				<!-- ══ Custom / Edit mode ══ -->
				{#each customPageData as { config, tasks }, pageIdx (config.id)}
					<div class="sheet-with-arrows" style="--sheet-width: {sheetWidth}">
						{#if editMode && pageIdx > 0}
							<button class="arrow-move" onclick={() => movePage(config.id, -1)} title="Nach links">
								<ArrowLeft size={20} weight="bold" />
							</button>
						{/if}
						<div class="notepad-sheet" class:sheet-completed={config.filter.completed}>
							{#if editMode}
								<div class="sheet-header sheet-header-edit">
									<input
										class="edit-title-input"
										type="text"
										value={config.label}
										oninput={(e) =>
											updatePageLabel(config.id, (e.target as HTMLInputElement).value)}
									/>
									<button
										class="edit-filter-btn"
										class:active={filterOpenId === config.id}
										onclick={() => (filterOpenId = filterOpenId === config.id ? null : config.id)}
										title="Filter"
									>
										<GearSix size={16} weight="bold" />
									</button>
									<button
										class="edit-delete-btn"
										onclick={() => removePage(config.id)}
										title="Seite löschen"
										disabled={todoSettings.customPages.length <= 1}
									>
										<Trash size={14} weight="bold" />
									</button>
								</div>

								{#if filterOpenId === config.id}
									<div class="filter-panel">
										<div class="filter-row">
											<span class="filter-label">Icon</span>
											<div class="icon-chips">
												{#each ICON_OPTIONS as opt}
													<button
														class="icon-chip"
														class:selected={config.icon === opt.value}
														onclick={() => setPageIcon(config.id, opt.value)}>{opt.label}</button
													>
												{/each}
											</div>
										</div>
										<div class="filter-row">
											<span class="filter-label">Prioritäten</span>
											<div class="filter-chips">
												{#each PRIORITY_CHIPS as chip}
													<button
														class="filter-chip"
														class:selected={config.filter.priorities?.includes(chip.value)}
														style="--chip-color: {chip.color}"
														onclick={() => togglePriority(config.id, chip.value)}
														>{chip.label}</button
													>
												{/each}
											</div>
										</div>
										<div class="filter-row">
											<span class="filter-label">Zeitraum</span>
											<select
												class="filter-select"
												value={config.filter.dateRange || 'any'}
												onchange={(e) =>
													setDateRange(config.id, (e.target as HTMLSelectElement).value)}
											>
												<option value="any">Alle</option>
												<option value="overdue">Überfällig</option>
												<option value="today">Heute</option>
												<option value="tomorrow">Morgen</option>
												<option value="upcoming">Demnächst</option>
											</select>
										</div>
										<div class="filter-row">
											<label class="filter-toggle">
												<input
													type="checkbox"
													checked={config.filter.completed ?? false}
													onchange={() => toggleCompleted(config.id)}
												/>
												<span>Nur erledigte</span>
											</label>
										</div>
									</div>
								{/if}
							{:else}
								<div
									class="sheet-header"
									class:sheet-header-urgent={config.filter.priorities?.some(
										(p) => p === 'urgent' || p === 'high'
									)}
								>
									{#if config.icon === 'star'}<Star size={18} weight="bold" />
									{:else if config.icon === 'lightning'}<Lightning size={18} weight="bold" />
									{:else if config.icon === 'clock'}<Clock size={18} weight="bold" />
									{:else if config.icon === 'fire'}<Fire size={18} weight="bold" />
									{:else if config.icon === 'leaf'}<Leaf size={18} weight="bold" />
									{:else if config.icon === 'heart'}<Heart size={18} weight="bold" />
									{:else if config.icon === 'check' || config.filter.completed}<CheckCircle
											size={18}
											weight="bold"
										/>
									{:else if config.icon === 'warning'}<Warning size={18} weight="bold" />
									{:else if config.icon === 'calendar'}<CalendarBlank size={18} weight="bold" />
									{:else}<CalendarDots size={18} weight="bold" />
									{/if}
									<span>{config.label}</span>
									{#if tasks.length > 0}<span class="section-count">{tasks.length}</span>{/if}
								</div>
							{/if}

							<div class="sheet-content">
								<TaskList
									{tasks}
									enableDragDrop={!editMode}
									dropTargetDate={today}
									onTaskDrop={handleTaskDrop}
									showCompleted={config.filter.completed ?? false}
								/>
							</div>
						</div>
						{#if editMode && pageIdx < customPageData.length - 1}
							<button class="arrow-move" onclick={() => movePage(config.id, 1)} title="Nach rechts">
								<ArrowRight size={20} weight="bold" />
							</button>
						{/if}
					</div>
				{/each}

				{#if editMode}
					<div
						class="notepad-sheet add-page-sheet"
						style="width: {sheetWidth}"
						role="button"
						tabindex="0"
						onclick={addPage}
						onkeydown={(e) => e.key === 'Enter' && addPage()}
					>
						<Plus size={32} weight="light" />
						<span>Neue Seite</span>
					</div>
				{/if}
			{:else if todoSettings.pageMode === 'priority'}
				<!-- ══ Priority mode ══ -->
				{#if urgentImportant.length > 0}
					<div class="notepad-sheet">
						<div class="sheet-header sheet-header-urgent">
							<Warning size={18} weight="bold" /><span>Wichtig & Dringend</span><span
								class="section-count">{urgentImportant.length}</span
							>
						</div>
						<div class="sheet-content">
							<TaskList
								tasks={urgentImportant}
								enableDragDrop
								dropTargetDate="overdue"
								onTaskDrop={handleTaskDrop}
							/>
						</div>
					</div>
				{/if}
				<div class="notepad-sheet">
					<div class="sheet-header">
						<CalendarDots size={18} weight="bold" /><span>Wichtig & Später</span><span
							class="section-count">{importantLater.length}</span
						>
					</div>
					<div class="sheet-content">
						<TaskList
							tasks={importantLater}
							enableDragDrop
							dropTargetDate={today}
							onTaskDrop={handleTaskDrop}
						/>
						{#if showOnboardingTip && !tipDismissed}
							<div class="onboarding-tip">
								<span>💡</span>
								<span class="onboarding-tip-text"
									>Tipp: Nutze <code>!hoch</code> oder <code>!dringend</code> um Tasks auf die erste
									Seite zu setzen</span
								>
								<button
									class="onboarding-tip-close"
									onclick={() => (tipDismissed = true)}
									aria-label="Tipp ausblenden"
								>
									<X size={14} />
								</button>
							</div>
						{/if}
					</div>
				</div>
				{#if completedTasks.length > 0}
					<div class="notepad-sheet sheet-completed">
						<div class="sheet-header">
							<CheckCircle size={18} weight="bold" /><span>Erledigt</span><span
								class="section-count">{completedTasks.length}</span
							>
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
			{:else}
				<!-- ══ Date mode ══ -->
				{#if overdueTasks.length > 0}
					<div class="notepad-sheet">
						<div class="sheet-header sheet-header-urgent">
							<Warning size={18} weight="bold" /><span>Überfällig</span><span class="section-count"
								>{overdueTasks.length}</span
							>
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
				<div class="notepad-sheet">
					<div class="sheet-header">
						<CalendarBlank size={18} weight="bold" /><span>Heute</span
						>{#if todayTasks.length > 0}<span class="section-count">{todayTasks.length}</span>{/if}
					</div>
					<div class="sheet-content">
						<TaskList
							tasks={todayTasks}
							enableDragDrop
							dropTargetDate={today}
							onTaskDrop={handleTaskDrop}
						/>
					</div>
				</div>
				{#if tomorrowTasks.length > 0}
					<div class="notepad-sheet">
						<div class="sheet-header">
							<CalendarDots size={18} weight="bold" /><span>Morgen</span><span class="section-count"
								>{tomorrowTasks.length}</span
							>
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
				{#if upcomingCount > 0}
					<div class="notepad-sheet">
						<div class="sheet-header">
							<CalendarDots size={18} weight="bold" /><span>Demnächst</span><span
								class="section-count">{upcomingCount}</span
							>
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
				{#if completedTasks.length > 0}
					<div class="notepad-sheet sheet-completed">
						<div class="sheet-header">
							<CheckCircle size={18} weight="bold" /><span>Erledigt</span><span
								class="section-count">{completedTasks.length}</span
							>
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
			{/if}
		</div>

		<!-- Page dots -->
		{#if sheetCount > 1 && !editMode}
			<div class="page-dots">
				{#each Array(sheetCount) as _, i}
					<div class="page-dot" class:active={activePage === i}></div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Edit FAB -->
	<button
		class="edit-fab"
		class:active={editMode}
		onclick={() => (editMode ? exitEditMode() : enterEditMode())}
		title={editMode ? 'Fertig' : 'Seiten bearbeiten'}
	>
		{#if editMode}
			<CheckCircle size={22} weight="bold" />
		{:else}
			<PencilSimple size={20} weight="bold" />
		{/if}
	</button>
{/if}

<style>
	/* ── Layout ── */
	.notepad-page {
		padding-bottom: 100px;
	}

	/* ── Edit toolbar ── */
	.edit-toolbar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1.5rem;
	}
	.edit-toolbar-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #9ca3af;
		white-space: nowrap;
	}
	:global(.dark) .edit-toolbar-label {
		color: #6b7280;
	}
	.width-pills {
		display: flex;
		gap: 0.25rem;
	}
	.width-pill {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		border: 1.5px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.1s;
	}
	.width-pill.active {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	.width-pill:hover:not(.active) {
		border-color: rgba(0, 0, 0, 0.2);
		color: #374151;
	}
	:global(.dark) .width-pill {
		border-color: rgba(255, 255, 255, 0.12);
		color: #9ca3af;
	}
	:global(.dark) .width-pill.active {
		background: hsl(var(--color-primary) / 0.15);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	:global(.dark) .width-pill:hover:not(.active) {
		border-color: rgba(255, 255, 255, 0.25);
		color: #e5e7eb;
	}
	.scroll-track {
		display: flex;
		gap: 1.5rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-padding: 1.5rem;
		padding: 1rem 1.5rem 1rem;
		scrollbar-width: none;
	}
	.scroll-track::-webkit-scrollbar {
		display: none;
	}

	/* ── Paper sheet ── */
	.notepad-sheet {
		flex: 0 0 auto;
		width: var(--sheet-width, min(840px, 85vw));
		min-height: 60vh;
		scroll-snap-align: center;
		background: #fffef5;
		border-radius: 0.375rem;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
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

	/* ── Sheet with arrows wrapper ── */
	.sheet-with-arrows {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		flex: 0 0 auto;
		scroll-snap-align: center;
		padding-top: 0.25rem;
	}
	.sheet-with-arrows .notepad-sheet {
		scroll-snap-align: none;
		width: var(--sheet-width, min(840px, 85vw));
	}
	.arrow-move {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		margin-top: 0.625rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 50%;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
	}
	.arrow-move:hover {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary) / 0.3);
		transform: scale(1.1);
	}
	.arrow-move:active {
		transform: scale(0.95);
	}
	:global(.dark) .arrow-move {
		background: rgba(40, 40, 40, 0.9);
		border-color: rgba(255, 255, 255, 0.12);
		color: #9ca3af;
	}
	:global(.dark) .arrow-move:hover {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.15);
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
	.sheet-header-urgent {
		color: #dc2626;
	}
	:global(.dark) .sheet-header-urgent {
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
	.sheet-header-urgent .section-count {
		background: rgba(220, 38, 38, 0.1);
		color: #dc2626;
	}
	:global(.dark) .sheet-header-urgent .section-count {
		background: rgba(248, 113, 113, 0.15);
		color: #f87171;
	}

	.sheet-content {
		flex: 1;
		padding: 0.5rem 0;
	}

	/* ── Edit-mode header ── */
	.sheet-header-edit {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1rem;
		border-bottom: 1px solid hsl(var(--color-primary) / 0.2);
		background: hsl(var(--color-primary) / 0.04);
	}

	.edit-title-input {
		flex: 1;
		padding: 0.375rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		border: 1.5px solid hsl(var(--color-primary) / 0.3);
		border-radius: 0.375rem;
		background: white;
		color: #374151;
		min-width: 0;
	}
	:global(.dark) .edit-title-input {
		background: rgba(255, 255, 255, 0.08);
		border-color: hsl(var(--color-primary) / 0.4);
		color: #e5e7eb;
	}
	.edit-title-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 2px hsl(var(--color-primary) / 0.15);
	}

	.edit-filter-btn,
	.edit-delete-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		color: #9ca3af;
		transition: all 0.1s;
		flex-shrink: 0;
	}
	.edit-filter-btn:hover,
	.edit-filter-btn.active {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}
	.edit-delete-btn:hover:not(:disabled) {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}
	.edit-delete-btn:disabled {
		opacity: 0.2;
		cursor: default;
	}

	/* ── Inline filter panel ── */
	.filter-panel {
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		background: hsl(var(--color-primary) / 0.02);
		border-bottom: 1px solid hsl(var(--color-primary) / 0.1);
	}
	.filter-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.filter-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #6b7280;
		min-width: 5rem;
	}
	:global(.dark) .filter-label {
		color: #9ca3af;
	}

	.filter-chips {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.filter-chip {
		padding: 0.1875rem 0.5rem;
		font-size: 0.6875rem;
		font-weight: 500;
		border: 1.5px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.1s;
	}
	.filter-chip.selected {
		background: color-mix(in srgb, var(--chip-color) 15%, transparent);
		border-color: var(--chip-color);
		color: var(--chip-color);
	}
	:global(.dark) .filter-chip {
		border-color: rgba(255, 255, 255, 0.15);
		color: #9ca3af;
	}
	:global(.dark) .filter-chip.selected {
		background: color-mix(in srgb, var(--chip-color) 20%, transparent);
		border-color: var(--chip-color);
		color: var(--chip-color);
	}

	.icon-chips {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.icon-chip {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		border: 1.5px solid rgba(0, 0, 0, 0.08);
		border-radius: 0.375rem;
		background: transparent;
		cursor: pointer;
		transition: all 0.1s;
	}
	.icon-chip.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}
	.icon-chip:hover {
		border-color: hsl(var(--color-primary) / 0.5);
	}
	:global(.dark) .icon-chip {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .icon-chip.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.15);
	}

	.filter-select {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 0.375rem;
		background: white;
		color: #374151;
	}
	:global(.dark) .filter-select {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.12);
		color: #e5e7eb;
	}

	.filter-toggle {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: #374151;
		cursor: pointer;
	}
	:global(.dark) .filter-toggle {
		color: #e5e7eb;
	}
	.filter-toggle input {
		accent-color: hsl(var(--color-primary));
	}

	/* ── Add page sheet ── */
	.add-page-sheet {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		cursor: pointer;
		min-height: 40vh;
		border: 2px dashed hsl(var(--color-primary) / 0.25);
		background: hsl(var(--color-primary) / 0.02);
		color: hsl(var(--color-primary) / 0.5);
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.15s;
		animation: none;
	}
	.add-page-sheet:hover {
		border-color: hsl(var(--color-primary) / 0.5);
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.05);
	}

	/* ── Edit FAB ── */
	.edit-fab {
		position: fixed;
		bottom: calc(env(safe-area-inset-bottom, 0px) + 5rem);
		right: 1rem;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.9);
		color: #6b7280;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.12),
			0 0 0 1px rgba(0, 0, 0, 0.06);
		transition: all 0.2s ease;
		z-index: 1001;
	}
	.edit-fab:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
	}
	.edit-fab.active {
		background: hsl(var(--color-primary));
		color: white;
		box-shadow: 0 2px 12px hsl(var(--color-primary) / 0.4);
	}
	:global(.dark) .edit-fab {
		background: rgba(30, 30, 30, 0.9);
		color: #9ca3af;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 0 0 1px rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .edit-fab.active {
		background: hsl(var(--color-primary));
		color: white;
	}

	/* ── Subsections ── */
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

	/* ── Page dots ── */
	.page-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}
	.page-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.15);
		transition: all 0.2s ease;
	}
	.page-dot.active {
		background: hsl(var(--color-primary));
		transform: scale(1.3);
	}
	:global(.dark) .page-dot {
		background: rgba(255, 255, 255, 0.2);
	}
	:global(.dark) .page-dot.active {
		background: hsl(var(--color-primary));
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

	/* ── Onboarding tip ── */
	.onboarding-tip {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.5rem;
		margin: 0.5rem 0;
		font-size: 0.875rem;
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
		font-family: ui-monospace, monospace;
		background: hsl(var(--color-primary) / 0.15);
		border-radius: 0.25rem;
		color: hsl(var(--color-primary));
	}
</style>
