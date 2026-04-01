<script lang="ts">
	import { getContext } from 'svelte';
	import type { Observable } from 'dexie';
	import {
		type Task,
		type LocalLabel,
		type LocalBoardView,
		type LocalTodoProject,
		type TaskPriority,
		tasksStore,
		viewStore,
		filterIncomplete,
		filterCompleted,
		filterOverdue,
		filterToday,
		filterUpcoming,
		filterByProject,
		searchTasks,
		sortTasks,
		getPriorityLabel,
		getPriorityColor,
		getTaskStats,
	} from '$lib/modules/todo';
	import {
		Plus,
		Check,
		Circle,
		MagnifyingGlass,
		Tray,
		CalendarBlank,
		CalendarCheck,
		Flag,
		FunnelSimple,
		CaretRight,
		Folder,
		CheckCircle,
	} from '@manacore/shared-icons';

	// Get data from layout context
	const allTasks$: Observable<Task[]> = getContext('tasks');
	const allLabels$: Observable<LocalLabel[]> = getContext('labels');
	const allProjects$: Observable<LocalTodoProject[]> = getContext('projects');

	let allTasks = $state<Task[]>([]);
	let allLabels = $state<LocalLabel[]>([]);
	let allProjects = $state<LocalTodoProject[]>([]);

	$effect(() => {
		const sub = allTasks$.subscribe((t) => {
			allTasks = t;
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = allLabels$.subscribe((l) => {
			allLabels = l;
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = allProjects$.subscribe((p) => {
			allProjects = p;
		});
		return () => sub.unsubscribe();
	});

	// Task stats
	let stats = $derived(getTaskStats(allTasks));

	// Filtered tasks based on current view
	let displayTasks = $derived.by(() => {
		let tasks = allTasks;
		switch (viewStore.currentView) {
			case 'today':
				tasks = [...filterOverdue(allTasks), ...filterToday(allTasks)];
				break;
			case 'upcoming':
				tasks = filterUpcoming(allTasks);
				break;
			case 'completed':
				tasks = filterCompleted(allTasks);
				break;
			case 'search':
				tasks = searchTasks(allTasks, viewStore.searchQuery);
				break;
			default:
				tasks = filterIncomplete(allTasks);
		}
		return sortTasks(tasks, viewStore.sortBy, viewStore.sortOrder);
	});

	// Quick add task
	let newTaskTitle = $state('');
	let isAdding = $state(false);

	async function handleQuickAdd() {
		if (!newTaskTitle.trim()) return;
		await tasksStore.createTask({ title: newTaskTitle.trim() });
		newTaskTitle = '';
		isAdding = false;
	}

	async function handleToggleComplete(e: MouseEvent, task: Task) {
		e.stopPropagation();
		e.preventDefault();
		await tasksStore.toggleComplete(task.id);
	}

	async function handleDeleteTask(e: MouseEvent, task: Task) {
		e.stopPropagation();
		e.preventDefault();
		await tasksStore.deleteTask(task.id);
	}

	// View navigation items
	const views = [
		{ id: 'inbox', label: 'Inbox', icon: Tray },
		{ id: 'today', label: 'Heute', icon: CalendarBlank },
		{ id: 'upcoming', label: 'Bald faellig', icon: CalendarCheck },
		{ id: 'completed', label: 'Erledigt', icon: CheckCircle },
	] as const;

	let selectedTaskId = $state<string | null>(null);
	let selectedTask = $derived(allTasks.find((t) => t.id === selectedTaskId));

	function formatDueDate(date: string | null | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const tomorrowStart = new Date(todayStart);
		tomorrowStart.setDate(tomorrowStart.getDate() + 1);

		if (d < todayStart) return 'Ueberfaellig';
		if (d >= todayStart && d < tomorrowStart) return 'Heute';
		return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
	}

	function getDueDateColor(date: string | null | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		if (d < todayStart) return 'text-red-500';
		return 'text-muted-foreground';
	}
</script>

<svelte:head>
	<title>Todo - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<!-- Header with Stats -->
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Todo</h1>
		<div class="mt-2 flex gap-4 text-sm text-muted-foreground">
			<span>{stats.total} Aufgaben</span>
			<span>{stats.completed} erledigt</span>
			{#if stats.overdue > 0}
				<span class="text-red-500">{stats.overdue} ueberfaellig</span>
			{/if}
			{#if stats.today > 0}
				<span class="text-amber-500">{stats.today} heute</span>
			{/if}
		</div>
	</header>

	<!-- View Tabs -->
	<div class="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1">
		{#each views as view}
			<button
				onclick={() => {
					switch (view.id) {
						case 'inbox':
							viewStore.setInbox();
							break;
						case 'today':
							viewStore.setToday();
							break;
						case 'upcoming':
							viewStore.setUpcoming();
							break;
						case 'completed':
							viewStore.setCompleted();
							break;
					}
				}}
				class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors
					{viewStore.currentView === view.id
					? 'bg-primary/10 text-primary'
					: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}"
			>
				<view.icon size={16} />
				<span class="hidden sm:inline">{view.label}</span>
			</button>
		{/each}
	</div>

	<!-- Search (for search view) -->
	{#if viewStore.currentView === 'search'}
		<div class="relative mb-4">
			<MagnifyingGlass
				size={18}
				class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				placeholder="Aufgaben suchen..."
				value={viewStore.searchQuery}
				oninput={(e) => viewStore.updateSearchQuery(e.currentTarget.value)}
				class="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>
	{/if}

	<!-- Quick Add -->
	{#if isAdding}
		<div class="mb-4 rounded-lg border border-primary bg-card p-3">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleQuickAdd();
				}}
				class="flex gap-2"
			>
				<input
					type="text"
					placeholder="Was moechtest du erledigen?"
					bind:value={newTaskTitle}
					class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
					autofocus
				/>
				<button
					type="submit"
					disabled={!newTaskTitle.trim()}
					class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
				>
					Hinzufuegen
				</button>
				<button
					type="button"
					onclick={() => {
						isAdding = false;
						newTaskTitle = '';
					}}
					class="text-xs text-muted-foreground hover:text-foreground"
				>
					Abbrechen
				</button>
			</form>
		</div>
	{:else}
		<button
			onclick={() => (isAdding = true)}
			class="mb-4 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
		>
			<Plus size={16} />
			Neue Aufgabe
		</button>
	{/if}

	<!-- Task List -->
	{#if displayTasks.length === 0}
		<div class="flex flex-col items-center py-12 text-center">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<Tray size={32} class="text-muted-foreground" />
			</div>
			<h2 class="mb-1 text-lg font-semibold text-foreground">
				{#if viewStore.currentView === 'completed'}
					Noch keine Aufgaben erledigt
				{:else if viewStore.currentView === 'today'}
					Keine Aufgaben fuer heute
				{:else if viewStore.currentView === 'upcoming'}
					Keine anstehenden Aufgaben
				{:else}
					Inbox ist leer
				{/if}
			</h2>
			<p class="text-sm text-muted-foreground">
				{#if viewStore.currentView === 'inbox'}
					Erstelle deine erste Aufgabe mit dem + Button oben.
				{/if}
			</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each displayTasks as task (task.id)}
				<div
					class="group flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-card"
					role="button"
					tabindex="0"
					onclick={() => (selectedTaskId = selectedTaskId === task.id ? null : task.id)}
				>
					<!-- Completion Toggle -->
					<button
						onclick={(e) => handleToggleComplete(e, task)}
						class="mt-0.5 flex-shrink-0 transition-colors
							{task.isCompleted ? 'text-green-500' : `text-muted-foreground hover:text-primary`}"
						title={task.isCompleted ? 'Als offen markieren' : 'Als erledigt markieren'}
					>
						{#if task.isCompleted}
							<Check size={20} weight="bold" />
						{:else}
							<Circle size={20} />
						{/if}
					</button>

					<!-- Task Content -->
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<span
								class="text-sm {task.isCompleted
									? 'line-through text-muted-foreground'
									: 'text-foreground'}"
							>
								{task.title}
							</span>
						</div>

						<!-- Metadata Row -->
						<div class="mt-0.5 flex items-center gap-3 text-xs">
							{#if task.dueDate}
								<span class={getDueDateColor(task.dueDate)}>
									{formatDueDate(task.dueDate)}
								</span>
							{/if}
							{#if task.priority !== 'medium'}
								<span style="color: {getPriorityColor(task.priority)}">
									{getPriorityLabel(task.priority)}
								</span>
							{/if}
							{#if task.subtasks?.length}
								<span class="text-muted-foreground">
									{task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length} Teilaufgaben
								</span>
							{/if}
						</div>

						<!-- Expanded Detail -->
						{#if selectedTaskId === task.id}
							<div class="mt-3 space-y-2 border-t border-border pt-3">
								{#if task.description}
									<p class="text-sm text-muted-foreground">{task.description}</p>
								{/if}

								{#if task.subtasks?.length}
									<div class="space-y-1">
										{#each task.subtasks as subtask (subtask.id)}
											<div class="flex items-center gap-2 text-sm">
												{#if subtask.isCompleted}
													<Check size={14} class="text-green-500" />
												{:else}
													<Circle size={14} class="text-muted-foreground" />
												{/if}
												<span
													class={subtask.isCompleted
														? 'line-through text-muted-foreground'
														: 'text-foreground'}
												>
													{subtask.title}
												</span>
											</div>
										{/each}
									</div>
								{/if}

								<div class="flex gap-2 pt-1">
									<select
										value={task.priority}
										onchange={(e) =>
											tasksStore.updateTask(task.id, {
												priority: e.currentTarget.value as TaskPriority,
											})}
										class="rounded-md border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
									>
										<option value="low">Niedrig</option>
										<option value="medium">Mittel</option>
										<option value="high">Hoch</option>
										<option value="urgent">Dringend</option>
									</select>
									<input
										type="date"
										value={task.dueDate ? task.dueDate.split('T')[0] : ''}
										onchange={(e) =>
											tasksStore.updateTask(task.id, {
												dueDate: e.currentTarget.value
													? new Date(e.currentTarget.value).toISOString()
													: null,
											})}
										class="rounded-md border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
									/>
									<button
										onclick={(e) => handleDeleteTask(e, task)}
										class="ml-auto rounded-md px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-500/10"
									>
										Loeschen
									</button>
								</div>
							</div>
						{/if}
					</div>

					<!-- Priority indicator -->
					{#if task.priority === 'urgent' || task.priority === 'high'}
						<div
							class="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
							style="background-color: {getPriorityColor(task.priority)}"
							title={getPriorityLabel(task.priority)}
						></div>
					{/if}
				</div>
			{/each}
		</div>

		<p class="mt-4 text-center text-xs text-muted-foreground">
			{displayTasks.length} Aufgabe{displayTasks.length !== 1 ? 'n' : ''}
		</p>
	{/if}

	<!-- Projects Section -->
	{#if allProjects.length > 0}
		<div class="mt-8">
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				Projekte
			</h2>
			<div class="space-y-1">
				{#each allProjects as project (project.id)}
					<button
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-card"
					>
						<div
							class="h-3 w-3 rounded-sm"
							style="background-color: {project.color ?? '#6b7280'}"
						></div>
						<span class="flex-1 text-left text-foreground">{project.name}</span>
						<CaretRight size={14} class="text-muted-foreground" />
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Labels Section -->
	{#if allLabels.length > 0}
		<div class="mt-6">
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				Labels
			</h2>
			<div class="flex flex-wrap gap-2">
				{#each allLabels as label (label.id)}
					<button
						onclick={() => viewStore.setLabel(label.id)}
						class="rounded-full border px-3 py-1 text-xs font-medium transition-colors
							{viewStore.currentView === 'label' && viewStore.currentLabelId === label.id
							? 'border-primary bg-primary/10 text-primary'
							: 'border-border text-muted-foreground hover:border-primary/50'}"
					>
						<span
							class="mr-1 inline-block h-2 w-2 rounded-full"
							style="background-color: {label.color}"
						></span>
						{label.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
