<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { TaskPriority } from '@todo/shared';
	import type { LocalBoardView } from '$lib/data/local-store';
	import { useAllBoardViews } from '$lib/data/task-queries';
	import { ViewSelector, BoardViewRenderer, ViewEditorModal } from '$lib/components/board-views';
	import { boardViewsStore } from '$lib/stores/board-views.svelte';
	import { todoSettings } from '$lib/stores/settings.svelte';
	import TaskFilters from '$lib/components/TaskFilters.svelte';

	// Live query for board views
	const boardViews = useAllBoardViews();

	// Active view — persisted in localStorage
	const STORAGE_KEY = 'todo:activeViewId';
	let activeViewId = $state<string | null>(null);

	onMount(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			activeViewId = stored;
		}
	});

	// Auto-select first view when views load and nothing is selected
	$effect(() => {
		if (boardViews.value.length > 0 && !activeViewId) {
			activeViewId = boardViews.value[0].id;
		}
		// If stored view no longer exists, fall back to first
		if (
			activeViewId &&
			boardViews.value.length > 0 &&
			!boardViews.value.find((v) => v.id === activeViewId)
		) {
			activeViewId = boardViews.value[0].id;
		}
	});

	let activeView = $derived(boardViews.value.find((v) => v.id === activeViewId) ?? null);
	let pageTitle = $derived(activeView?.name ?? 'Aufgaben');

	// Map layout mode to BoardViewRenderer layoutOverride
	const LAYOUT_MAP = {
		fokus: 'fokus',
		uebersicht: 'kanban',
		matrix: 'grid',
	} as const;

	let layoutOverride = $derived(LAYOUT_MAP[todoSettings.activeLayoutMode]);

	function handleSelectView(viewId: string) {
		activeViewId = viewId;
		localStorage.setItem(STORAGE_KEY, viewId);
	}

	// ─── Editor Modal ──────────────────────────────────────
	let showEditor = $state(false);
	let editingView = $state<LocalBoardView | null>(null);

	function handleCreateView() {
		editingView = null;
		showEditor = true;
	}

	function handleEditView(view: LocalBoardView) {
		editingView = view;
		showEditor = true;
	}

	async function handleSaveView(data: Partial<LocalBoardView>) {
		if (editingView) {
			await boardViewsStore.updateView(editingView.id, data);
		} else {
			const newView = await boardViewsStore.createView({
				name: data.name ?? 'Neue View',
				icon: data.icon ?? 'columns',
				groupBy: data.groupBy ?? 'status',
				layout: data.layout ?? 'kanban',
				columns: data.columns ?? [],
				order: boardViews.value.length,
			});
			if (newView?.id) {
				handleSelectView(newView.id);
			}
		}
		showEditor = false;
		editingView = null;
	}

	async function handleDeleteView() {
		if (!editingView) return;
		await boardViewsStore.deleteView(editingView.id);
		showEditor = false;
		editingView = null;
	}

	async function handleReorderViews(viewIds: string[]) {
		await boardViewsStore.reorderViews(viewIds);
	}

	// ─── Filter state ──────────────────────────────────────
	let filterPriorities = $state<TaskPriority[]>([]);
	let filterProjectId = $state<string | null>(null);
	let filterLabelIds = $state<string[]>([]);
	let filterSearchQuery = $state('');
	let showFilters = $state(false);

	let previousViewId = $state<string | null>(null);
	$effect(() => {
		if (activeView && activeView.id !== previousViewId) {
			previousViewId = activeView.id;
			if (activeView.filter) {
				filterPriorities = (activeView.filter.priorities ?? []) as TaskPriority[];
				filterProjectId = activeView.filter.projectId ?? null;
				filterLabelIds = activeView.filter.tagIds ?? [];
			} else {
				filterPriorities = [];
				filterProjectId = null;
				filterLabelIds = [];
			}
			filterSearchQuery = '';
		}
	});

	function clearFilters() {
		filterPriorities = [];
		filterProjectId = null;
		filterLabelIds = [];
		filterSearchQuery = '';
	}

	async function saveFiltersToView() {
		if (!activeViewId) return;
		const filter: { projectId?: string; tagIds?: string[]; priorities?: string[] } = {};
		if (filterProjectId) filter.projectId = filterProjectId;
		if (filterLabelIds.length > 0) filter.tagIds = filterLabelIds;
		if (filterPriorities.length > 0) filter.priorities = filterPriorities;
		const hasFilter = Object.keys(filter).length > 0;
		await boardViewsStore.updateView(activeViewId, { filter: hasFilter ? filter : undefined });
	}

	let hasActiveFilters = $derived(
		filterPriorities.length > 0 ||
			filterProjectId !== null ||
			filterLabelIds.length > 0 ||
			filterSearchQuery.trim() !== ''
	);

	let isMobile = $state(false);

	function checkMobile() {
		isMobile = window.innerWidth < 768;
	}

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', checkMobile);
		}
	});
</script>

<svelte:head>
	<title>{pageTitle} - Todo</title>
</svelte:head>

<div class="board-page">
	<!-- View Selector - Top on Desktop -->
	{#if !isMobile}
		<ViewSelector
			views={boardViews.value}
			{activeViewId}
			onSelect={handleSelectView}
			onCreate={handleCreateView}
			onEdit={handleEditView}
			onReorder={handleReorderViews}
		/>
	{/if}

	<!-- Header -->
	<div class="mb-6 flex items-center justify-between px-4 sm:px-6 lg:px-8">
		<h1 class="page-title">{pageTitle}</h1>
		<button
			type="button"
			onclick={() => (showFilters = !showFilters)}
			class="filter-button px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 {showFilters ||
			hasActiveFilters
				? 'active'
				: ''}"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
			</svg>
			Filter
			{#if hasActiveFilters}
				<span
					class="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary-foreground text-primary"
				>
					{filterPriorities.length +
						(filterProjectId ? 1 : 0) +
						filterLabelIds.length +
						(filterSearchQuery ? 1 : 0)}
				</span>
			{/if}
		</button>
	</div>

	<!-- Collapsible Filters -->
	{#if showFilters}
		<div class="mb-6 px-4 sm:px-6 lg:px-8 animate-in slide-in-from-top-2 duration-200">
			<TaskFilters
				variant="bar"
				selectedPriorities={filterPriorities}
				selectedProjectId={filterProjectId}
				selectedLabelIds={filterLabelIds}
				searchQuery={filterSearchQuery}
				onPrioritiesChange={(priorities: TaskPriority[]) => (filterPriorities = priorities)}
				onProjectChange={(projectId: string | null) => (filterProjectId = projectId)}
				onLabelsChange={(labelIds: string[]) => (filterLabelIds = labelIds)}
				onSearchChange={(query: string) => (filterSearchQuery = query)}
				onClearFilters={clearFilters}
				showSearch={true}
				showLabels={true}
			/>
			{#if hasActiveFilters}
				<div class="mt-2 flex items-center gap-2">
					<button type="button" class="save-filter-btn" onclick={saveFiltersToView}>
						<svg
							class="h-3.5 w-3.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
							<polyline points="17 21 17 13 7 13 7 21" />
							<polyline points="7 3 7 8 15 8" />
						</svg>
						Filter speichern
					</button>
					{#if activeView?.filter}
						<button
							type="button"
							class="clear-saved-filter-btn"
							onclick={async () => {
								clearFilters();
								if (activeViewId) {
									await boardViewsStore.updateView(activeViewId, { filter: undefined });
								}
							}}
						>
							Gespeicherten Filter entfernen
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Board Content -->
	<div class="board-container" class:mobile-bottom-padding={isMobile}>
		{#if activeView}
			<BoardViewRenderer
				view={{
					...activeView,
					filter: hasActiveFilters
						? {
								projectId: filterProjectId ?? undefined,
								tagIds: filterLabelIds.length > 0 ? filterLabelIds : undefined,
								priorities: filterPriorities.length > 0 ? filterPriorities : undefined,
							}
						: activeView.filter,
				}}
				{layoutOverride}
			/>
		{:else if boardViews.value.length === 0}
			<div class="empty-state">
				<p class="text-muted-foreground">Views werden geladen...</p>
			</div>
		{/if}
	</div>

	<!-- View Selector - Bottom on Mobile -->
	{#if isMobile}
		<div class="mobile-selector">
			<ViewSelector
				views={boardViews.value}
				{activeViewId}
				onSelect={handleSelectView}
				onCreate={handleCreateView}
				onEdit={handleEditView}
			/>
		</div>
	{/if}
</div>

<!-- View Editor Modal -->
<ViewEditorModal
	open={showEditor}
	view={editingView}
	onSave={handleSaveView}
	onDelete={handleDeleteView}
	onClose={() => {
		showEditor = false;
		editingView = null;
	}}
/>

<style>
	.board-page {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 140px);
	}

	.page-title {
		font-size: 1.875rem;
		font-weight: 700;
		color: var(--foreground);
		margin: 0;
	}

	.board-container {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.board-container.mobile-bottom-padding {
		padding-bottom: 70px;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	/* Mobile selector fixed at bottom */
	.mobile-selector {
		position: fixed;
		bottom: 70px;
		left: 0;
		right: 0;
		z-index: 40;
		background: linear-gradient(to top, var(--background) 0%, transparent 100%);
		padding-bottom: 0.75rem;
	}

	/* Glass-Pill filter button */
	.filter-button {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: #6b7280;
	}

	:global(.dark) .filter-button {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #9ca3af;
	}

	.filter-button:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark) .filter-button:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
		color: #f3f4f6;
	}

	.filter-button.active {
		background: #8b5cf6;
		border-color: #8b5cf6;
		color: white;
		box-shadow:
			0 4px 6px -1px rgba(139, 92, 246, 0.3),
			0 2px 4px -1px rgba(139, 92, 246, 0.2);
	}

	.filter-button.active:hover {
		background: #7c3aed;
		border-color: #7c3aed;
		color: white;
	}

	.save-filter-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #8b5cf6;
		background: rgba(139, 92, 246, 0.1);
		border: 1px solid rgba(139, 92, 246, 0.2);
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.save-filter-btn:hover {
		background: rgba(139, 92, 246, 0.2);
		border-color: rgba(139, 92, 246, 0.3);
	}

	:global(.dark) .save-filter-btn {
		color: #a78bfa;
		background: rgba(139, 92, 246, 0.15);
		border-color: rgba(139, 92, 246, 0.25);
	}

	:global(.dark) .save-filter-btn:hover {
		background: rgba(139, 92, 246, 0.25);
		border-color: rgba(139, 92, 246, 0.35);
	}

	.clear-saved-filter-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.clear-saved-filter-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.2);
	}

	:global(.dark) .clear-saved-filter-btn {
		color: #9ca3af;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .clear-saved-filter-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.3);
	}

	.animate-in {
		animation: animateIn 0.2s ease-out;
	}

	.slide-in-from-top-2 {
		--tw-enter-translate-y: -0.5rem;
	}

	@keyframes animateIn {
		from {
			opacity: 0;
			transform: translateY(var(--tw-enter-translate-y, 0));
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
