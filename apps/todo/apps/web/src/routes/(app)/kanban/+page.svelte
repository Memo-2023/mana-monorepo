<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { TaskPriority } from '@todo/shared';
	import { useAllBoardViews } from '$lib/data/task-queries';
	import { ViewSelector, BoardViewRenderer } from '$lib/components/board-views';
	import TaskFilters from '$lib/components/TaskFilters.svelte';

	// Live query for board views
	const boardViews = useAllBoardViews();

	// Active view — persisted in localStorage
	const STORAGE_KEY = 'todo:activeViewId';
	let activeViewId = $state<string | null>(null);

	// Initialize from localStorage
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
		if (activeViewId && boardViews.value.length > 0 && !boardViews.value.find((v) => v.id === activeViewId)) {
			activeViewId = boardViews.value[0].id;
		}
	});

	// Derive the active view object
	let activeView = $derived(boardViews.value.find((v) => v.id === activeViewId) ?? null);
	let boardTitle = $derived(activeView?.name ?? 'Board');

	function handleSelectView(viewId: string) {
		activeViewId = viewId;
		localStorage.setItem(STORAGE_KEY, viewId);
	}

	// Filter state
	let filterPriorities = $state<TaskPriority[]>([]);
	let filterProjectId = $state<string | null>(null);
	let filterLabelIds = $state<string[]>([]);
	let filterSearchQuery = $state('');
	let showFilters = $state(false);

	function clearFilters() {
		filterPriorities = [];
		filterProjectId = null;
		filterLabelIds = [];
		filterSearchQuery = '';
	}

	let hasActiveFilters = $derived(
		filterPriorities.length > 0 ||
			filterProjectId !== null ||
			filterLabelIds.length > 0 ||
			filterSearchQuery.trim() !== ''
	);

	// Responsive state
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
	<title>{boardTitle} - Todo</title>
</svelte:head>

<div class="board-page">
	<!-- View Selector - Top on Desktop -->
	{#if !isMobile}
		<ViewSelector
			views={boardViews.value}
			{activeViewId}
			onSelect={handleSelectView}
		/>
	{/if}

	<!-- Header -->
	<div class="mb-6 flex items-center justify-between px-4 sm:px-6 lg:px-8">
		<h1 class="page-title">{boardTitle}</h1>
		<button
			type="button"
			onclick={() => (showFilters = !showFilters)}
			class="filter-button px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 {showFilters || hasActiveFilters ? 'active' : ''}"
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
		</div>
	{/if}

	<!-- Board Content -->
	<div class="board-container" class:mobile-bottom-padding={isMobile}>
		{#if activeView}
			<BoardViewRenderer view={activeView} />
		{:else if boardViews.value.length === 0}
			<div class="empty-state">
				<p class="text-muted-foreground">Board Views werden geladen...</p>
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
			/>
		</div>
	{/if}
</div>

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
		bottom: 70px; /* Above PillNav */
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

	/* Animations */
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
