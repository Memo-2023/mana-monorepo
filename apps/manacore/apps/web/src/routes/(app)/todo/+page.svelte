<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext, onMount } from 'svelte';
	import type { Observable } from 'dexie';
	import { dropTarget } from '@manacore/shared-ui/dnd';
	import type { DragPayload, TagDragData } from '@manacore/shared-ui/dnd';
	import { useAllTags } from '$lib/stores/tags.svelte';
	import {
		type Task,
		type LocalLabel,
		type LocalBoardView,
		type LocalTodoProject,
		tasksStore,
		taskTable,
		viewStore,
		filterIncomplete,
		filterCompleted,
		filterOverdue,
		filterToday,
		filterUpcoming,
		filterByProject,
		searchTasks,
		sortTasks,
		getTaskStats,
	} from '$lib/modules/todo';
	import {
		Tray,
		CalendarBlank,
		CalendarCheck,
		CheckCircle,
		MagnifyingGlass,
		Gear,
	} from '@manacore/shared-icons';
	import { ShareModal } from '@manacore/shared-uload';

	// Components
	import TaskList from '$lib/modules/todo/components/TaskList.svelte';
	import TaskEditModal from '$lib/modules/todo/components/TaskEditModal.svelte';
	import QuickAddTask from '$lib/modules/todo/components/QuickAddTask.svelte';
	import TodoToolbar from '$lib/modules/todo/components/TodoToolbar.svelte';
	import TagStrip from '$lib/modules/todo/components/TagStrip.svelte';
	import SyncIndicator from '$lib/modules/todo/components/SyncIndicator.svelte';
	import SyntaxHelpOverlay from '$lib/modules/todo/components/SyntaxHelpOverlay.svelte';
	import OnboardingModal from '$lib/modules/todo/components/OnboardingModal.svelte';
	import { TaskListSkeleton, StatisticsSkeleton } from '$lib/modules/todo/components/skeletons';
	import {
		BoardViewRenderer,
		ViewSelector,
		ViewEditorModal,
	} from '$lib/modules/todo/components/board-views';
	import { todoSettings } from '$lib/modules/todo/stores/settings.svelte';

	// Get data from layout context
	const allTasks$: Observable<Task[]> = getContext('tasks');
	const allLabels$: Observable<LocalLabel[]> = getContext('labels');
	const allProjects$: Observable<LocalTodoProject[]> = getContext('projects');
	const allBoardViews$: Observable<LocalBoardView[]> = getContext('boardViews');

	let allTasks = $state<Task[]>([]);
	let allLabels = $state<LocalLabel[]>([]);
	let allProjects = $state<LocalTodoProject[]>([]);
	let allBoardViews = $state<LocalBoardView[]>([]);
	let isLoaded = $state(false);

	$effect(() => {
		const sub = allTasks$.subscribe((t) => {
			allTasks = t;
			isLoaded = true;
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = allLabels$.subscribe((l) => (allLabels = l));
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = allProjects$.subscribe((p) => (allProjects = p));
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = allBoardViews$.subscribe((v) => (allBoardViews = v));
		return () => sub.unsubscribe();
	});

	// Tags for resolving labelIds
	const globalTags = useAllTags();
	const tagList = $derived(
		(globalTags.value ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color }))
	);

	// Stats
	let stats = $derived(getTaskStats(allTasks));

	// Filtered tasks
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
			case 'label':
				tasks = filterIncomplete(allTasks).filter((t) => {
					const ids: string[] = (t.metadata as { labelIds?: string[] })?.labelIds ?? [];
					return ids.includes(viewStore.currentLabelId ?? '');
				});
				break;
			default:
				tasks = filterIncomplete(allTasks);
		}
		if (viewStore.showCompleted && viewStore.currentView !== 'completed') {
			tasks = [...tasks, ...filterCompleted(allTasks)];
		}
		return sortTasks(tasks, viewStore.sortBy, viewStore.sortOrder);
	});

	// Board view state
	let isBoardView = $state(false);
	let activeBoardId = $state<string | null>(null);
	let activeBoard = $derived(
		allBoardViews.find((v) => v.id === activeBoardId) ?? allBoardViews[0] ?? null
	);

	// Modal states
	let editTask = $state<Task | null>(null);
	let shareTask = $state<Task | null>(null);
	let showSyntaxHelp = $state(false);
	let showBoardEditor = $state(false);
	let editBoardView = $state<LocalBoardView | null>(null);
	let showOnboarding = $state(false);

	let shareUrl = $derived(
		shareTask
			? `${typeof window !== 'undefined' ? window.location.origin : ''}/todo?task=${shareTask.id}`
			: ''
	);

	// Check onboarding
	onMount(() => {
		try {
			if (!localStorage.getItem('todo-onboarding-done')) {
				showOnboarding = true;
			}
		} catch {}
	});

	// DnD tag drop handler
	const tagDropCtx = getContext<{
		set: (handler: (tagId: string, payload: DragPayload) => void) => void;
		clear: () => void;
	}>('tagDropHandler');

	onMount(() => {
		tagDropCtx?.set(async (tagId: string, payload: DragPayload) => {
			const taskData = payload.data as TagDragData;
			const task = await taskTable.get(taskData.id);
			if (!task) return;
			const currentLabels: string[] = (task.metadata as { labelIds?: string[] })?.labelIds ?? [];
			if (!currentLabels.includes(tagId)) {
				tasksStore.updateLabels(taskData.id, [...currentLabels, tagId]);
			}
		});
		return () => tagDropCtx?.clear();
	});

	// Board view callbacks
	async function handleBoardQuickAdd(title: string, _columnId: string) {
		await tasksStore.createTask({ title });
	}

	// View navigation
	let views = $derived([
		{ id: 'inbox', label: $_('todo.inbox'), icon: Tray },
		{ id: 'today', label: $_('todo.todayView'), icon: CalendarBlank },
		{ id: 'upcoming', label: $_('todo.upcoming'), icon: CalendarCheck },
		{ id: 'completed', label: $_('todo.completedView'), icon: CheckCircle },
	] as const);
</script>

<svelte:head>
	<title>Todo - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<!-- Header -->
	<header class="mb-4 flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">{$_('todo.title')}</h1>
			{#if isLoaded}
				<div class="mt-1 flex gap-4 text-sm text-muted-foreground">
					<span>{stats.total} {$_('todo.tasks')}</span>
					<span>{stats.completed} {$_('todo.completed')}</span>
					{#if stats.overdue > 0}
						<span class="text-red-500">{stats.overdue} {$_('todo.overdue')}</span>
					{/if}
					{#if stats.today > 0}
						<span class="text-amber-500">{stats.today} {$_('todo.today')}</span>
					{/if}
				</div>
			{:else}
				<StatisticsSkeleton />
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<SyncIndicator />
			<a
				href="/todo/settings"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
				title={$_('todo.settings.title')}
			>
				<Gear size={16} />
			</a>
		</div>
	</header>

	<!-- View Tabs + Toolbar -->
	<div class="mb-3 flex items-center justify-between gap-2">
		<div class="flex gap-1 rounded-lg border border-border bg-card p-1">
			{#each views as view}
				<button
					onclick={() => {
						isBoardView = false;
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
					class="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors
						{!isBoardView && viewStore.currentView === view.id
						? 'bg-primary/10 text-primary'
						: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}"
				>
					<view.icon size={16} />
					<span class="hidden sm:inline">{view.label}</span>
				</button>
			{/each}
		</div>

		<TodoToolbar
			showBoardToggle={allBoardViews.length > 0}
			{isBoardView}
			onToggleBoard={() => (isBoardView = !isBoardView)}
		/>
	</div>

	<!-- Tag Strip -->
	<TagStrip
		labels={allLabels}
		collapsed={todoSettings.filterStripCollapsed}
		onToggleCollapse={() => todoSettings.toggleFilterStrip()}
	/>

	<!-- Search -->
	{#if viewStore.currentView === 'search'}
		<div class="relative mb-4">
			<MagnifyingGlass
				size={18}
				class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				placeholder={$_('todo.search') + '...'}
				value={viewStore.searchQuery}
				oninput={(e) => viewStore.updateSearchQuery(e.currentTarget.value)}
				class="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				autofocus
			/>
		</div>
	{/if}

	<!-- Board View Selector -->
	{#if isBoardView}
		<div class="mb-4">
			<ViewSelector
				views={allBoardViews}
				activeViewId={activeBoardId}
				onSelect={(id) => (activeBoardId = id)}
				onCreateView={() => {
					editBoardView = null;
					showBoardEditor = true;
				}}
			/>
		</div>
	{/if}

	<!-- Quick Add -->
	{#if !isBoardView}
		<QuickAddTask labels={allLabels} onShowSyntaxHelp={() => (showSyntaxHelp = true)} />
	{/if}

	<!-- Main Content -->
	{#if !isLoaded}
		<TaskListSkeleton />
	{:else if isBoardView && activeBoard}
		<BoardViewRenderer
			view={activeBoard}
			tasks={allTasks}
			labels={allLabels}
			wipLimit={todoSettings.wipLimitPerColumn}
			cardSize={todoSettings.kanbanCardSize}
			onToggleComplete={(id) => tasksStore.toggleComplete(id)}
			onSaveTask={(id, data) => tasksStore.updateTask(id, data)}
			onDeleteTask={(id) => tasksStore.deleteTask(id)}
			onQuickAdd={handleBoardQuickAdd}
			onOpenTask={(task) => (editTask = task)}
		/>
	{:else if displayTasks.length === 0}
		<div class="flex flex-col items-center py-12 text-center">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<Tray size={32} class="text-muted-foreground" />
			</div>
			<h2 class="mb-1 text-lg font-semibold text-foreground">
				{#if viewStore.currentView === 'completed'}
					{$_('todo.noTasksCompleted')}
				{:else if viewStore.currentView === 'today'}
					{$_('todo.noTasksToday')}
				{:else if viewStore.currentView === 'upcoming'}
					{$_('todo.noTasksUpcoming')}
				{:else if viewStore.currentView === 'search'}
					{$_('todo.noTasks')}
				{:else}
					{$_('todo.noTasksInbox')}
				{/if}
			</h2>
			<p class="text-sm text-muted-foreground">
				{#if viewStore.currentView === 'inbox'}
					{$_('todo.firstTaskHint')}
				{/if}
			</p>
		</div>
	{:else}
		<TaskList
			tasks={displayTasks}
			tags={tagList}
			compact={todoSettings.compactMode}
			dragEnabled={viewStore.sortBy === 'order'}
			onOpenTask={(task) => (editTask = task)}
		/>

		<p class="mt-4 text-center text-xs text-muted-foreground">
			{displayTasks.length}
			{$_('todo.tasks')}
		</p>
	{/if}

	<!-- Projects Section -->
	{#if !isBoardView && allProjects.length > 0}
		<div class="mt-8">
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				{$_('todo.projects')}
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
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Task Edit Modal -->
{#if editTask}
	<TaskEditModal task={editTask} open={true} onClose={() => (editTask = null)} />
{/if}

<!-- Board Editor Modal -->
<ViewEditorModal
	view={editBoardView}
	open={showBoardEditor}
	onClose={() => (showBoardEditor = false)}
/>

<!-- Syntax Help Overlay -->
<SyntaxHelpOverlay open={showSyntaxHelp} onClose={() => (showSyntaxHelp = false)} />

<!-- Onboarding Modal -->
<OnboardingModal open={showOnboarding} onClose={() => (showOnboarding = false)} />

<!-- Share Modal -->
<ShareModal
	visible={shareTask !== null}
	onClose={() => (shareTask = null)}
	url={shareUrl}
	title={shareTask?.title ?? ''}
	source="todo"
	description={shareTask?.description ?? ''}
/>

<style>
	:global(.mana-drop-target-hover) {
		outline: 2px solid var(--color-primary, #6366f1);
		outline-offset: -2px;
		border-radius: 0.5rem;
		background: rgba(99, 102, 241, 0.06) !important;
	}

	:global(.mana-drop-target-success) {
		animation: drop-success 400ms ease-out;
	}

	@keyframes drop-success {
		0% {
			outline-color: #10b981;
			background: rgba(16, 185, 129, 0.1);
		}
		100% {
			outline-color: transparent;
			background: transparent;
		}
	}
</style>
