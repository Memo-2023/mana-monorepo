<script lang="ts">
	import { goto } from '$app/navigation';
	import type { TaskPriority } from '@todo/shared';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { labelsStore } from '$lib/stores/labels.svelte';
	import { viewStore, type SortBy } from '$lib/stores/view.svelte';
	import { todoSettings } from '$lib/stores/settings.svelte';
	import { X, DotsThree } from '@manacore/shared-icons';

	// Filter dropdown states
	let showFilterDropdown = $state(false);
	let selectedPriorityFilters = $state<TaskPriority[]>([]);
	let selectedProjectFilter = $state<string | null>(null);
	let selectedLabelFilters = $state<string[]>([]);

	const priorities: { value: TaskPriority; label: string; color: string }[] = [
		{ value: 'urgent', label: 'Dringend', color: '#ef4444' },
		{ value: 'high', label: 'Hoch', color: '#f97316' },
		{ value: 'medium', label: 'Normal', color: '#eab308' },
		{ value: 'low', label: 'Niedrig', color: '#3b82f6' },
	];

	// Sort options
	const sortOptions: { id: SortBy; label: string }[] = [
		{ id: 'dueDate', label: 'Datum' },
		{ id: 'priority', label: 'Priorit.' },
		{ id: 'title', label: 'Name' },
	];

	// Count active filters
	let activeFilterCount = $derived(
		selectedPriorityFilters.length + (selectedProjectFilter ? 1 : 0) + selectedLabelFilters.length
	);

	function togglePriorityFilter(priority: TaskPriority) {
		if (selectedPriorityFilters.includes(priority)) {
			selectedPriorityFilters = selectedPriorityFilters.filter((p) => p !== priority);
		} else {
			selectedPriorityFilters = [...selectedPriorityFilters, priority];
		}
	}

	function clearAllFilters() {
		selectedPriorityFilters = [];
		selectedProjectFilter = null;
		selectedLabelFilters = [];
	}

	function handleSortChange(sortBy: SortBy) {
		viewStore.setSort(sortBy, viewStore.sortOrder);
	}

	function closeFilterDropdown() {
		showFilterDropdown = false;
	}
</script>

<svelte:window onclick={closeFilterDropdown} />

<div class="filter-strip-wrapper">
	<div class="filter-strip-container">
		<!-- Clear Filter Button (always rendered to prevent layout shift) -->
		<button
			class="clear-filter-pill glass-pill"
			class:hidden={activeFilterCount === 0}
			onclick={clearAllFilters}
			title="Filter löschen"
			disabled={activeFilterCount === 0}
		>
			<X size={16} weight="bold" />
			<span class="pill-label">Filter</span>
		</button>

		<!-- Kanban View Button -->
		<button class="glass-pill" onclick={() => goto('/kanban')} title="Kanban-Ansicht">
			<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
				/>
			</svg>
			<span class="pill-label">Kanban</span>
		</button>

		<!-- Priority Filter Pills -->
		{#each priorities as priority (priority.value)}
			<button
				class="priority-pill glass-pill"
				class:selected={selectedPriorityFilters.includes(priority.value)}
				onclick={() => togglePriorityFilter(priority.value)}
				title={priority.label}
				style="--priority-color: {priority.color}"
			>
				<span class="priority-dot"></span>
				<span class="pill-label">{priority.label}</span>
			</button>
		{/each}

		<!-- Sort Pills -->
		{#each sortOptions as option (option.id)}
			<button
				class="sort-pill glass-pill"
				class:active={viewStore.sortBy === option.id}
				onclick={() => handleSortChange(option.id)}
				title="Nach {option.label} sortieren"
			>
				<span class="pill-label">{option.label}</span>
			</button>
		{/each}

		<!-- Show Completed Toggle -->
		<button
			class="glass-pill"
			class:active={viewStore.showCompleted}
			onclick={() => viewStore.toggleShowCompleted()}
			title={viewStore.showCompleted ? 'Erledigte ausblenden' : 'Erledigte anzeigen'}
		>
			<svg
				class="pill-icon"
				fill={viewStore.showCompleted ? 'currentColor' : 'none'}
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span class="pill-label">Erledigt</span>
		</button>

		<!-- More Options (Project Filter) -->
		<div class="filter-dropdown-container" onclick={(e) => e.stopPropagation()}>
			<button
				class="more-pill glass-pill"
				onclick={() => (showFilterDropdown = !showFilterDropdown)}
				title="Weitere Filter"
			>
				<DotsThree size={18} weight="bold" />
				<span class="pill-label">Mehr</span>
			</button>

			{#if showFilterDropdown}
				<div class="filter-dropdown" onclick={(e) => e.stopPropagation()}>
					<div class="filter-section">
						<div class="filter-section-header">Projekt</div>
						<select
							class="filter-select"
							value={selectedProjectFilter || ''}
							onchange={(e) => (selectedProjectFilter = e.currentTarget.value || null)}
						>
							<option value="">Alle Projekte</option>
							{#each projectsStore.activeProjects as project}
								<option value={project.id}>{project.name}</option>
							{/each}
						</select>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.filter-strip-wrapper {
		position: fixed;
		bottom: calc(70px + env(safe-area-inset-bottom, 0px)); /* Directly above PillNav */
		left: 0;
		right: 0;
		z-index: 49;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		pointer-events: none;
		transition: bottom 0.2s ease;
	}

	.filter-strip-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: transparent;
		pointer-events: auto;
		width: fit-content;
		max-width: 100%;
		margin-left: auto;
		margin-right: auto;
		padding: 0.5rem 2rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.filter-strip-container::-webkit-scrollbar {
		display: none;
	}

	/* Glass pill styling - same as PillNavigation pills */
	.glass-pill {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.glass-pill:hover {
		transform: scale(1.05);
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .glass-pill:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.glass-pill:active {
		transform: scale(0.98);
	}

	.glass-pill.active {
		background: rgba(139, 92, 246, 0.15);
		border-color: rgba(139, 92, 246, 0.3);
		color: #8b5cf6;
	}

	:global(.dark) .glass-pill.active {
		background: rgba(139, 92, 246, 0.25);
		border-color: rgba(139, 92, 246, 0.4);
	}

	.pill-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.pill-label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #374151;
		white-space: nowrap;
	}

	:global(.dark) .pill-label {
		color: #f3f4f6;
	}

	.glass-pill.active .pill-label {
		color: #8b5cf6;
	}

	/* Priority pills */
	.priority-pill.selected {
		background: var(--priority-color) !important;
		border-color: var(--priority-color) !important;
	}

	.priority-pill.selected .priority-dot {
		background-color: white;
	}

	.priority-pill.selected .pill-label {
		color: white;
	}

	.priority-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--priority-color);
		flex-shrink: 0;
	}

	/* Clear filter pill */
	.clear-filter-pill {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1) !important;
		border-color: rgba(239, 68, 68, 0.3) !important;
	}

	.clear-filter-pill .pill-label {
		color: #ef4444;
		font-weight: 600;
	}

	:global(.dark) .clear-filter-pill {
		color: #f87171;
		background: rgba(239, 68, 68, 0.15) !important;
		border-color: rgba(239, 68, 68, 0.3) !important;
	}

	:global(.dark) .clear-filter-pill .pill-label {
		color: #f87171;
	}

	.clear-filter-pill:hover:not(.hidden) {
		background: rgba(239, 68, 68, 0.2) !important;
		border-color: rgba(239, 68, 68, 0.5) !important;
	}

	.clear-filter-pill.hidden {
		visibility: hidden;
		pointer-events: none;
	}

	/* Filter dropdown */
	.filter-dropdown-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.filter-dropdown {
		position: absolute;
		bottom: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
		min-width: 220px;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.75rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
		z-index: 100;
	}

	:global(.dark) .filter-dropdown {
		background: rgba(30, 30, 30, 0.95);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.filter-section {
		margin-bottom: 0.75rem;
	}

	.filter-section:last-child {
		margin-bottom: 0;
	}

	.filter-section-header {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	:global(.dark) .filter-section-header {
		color: #9ca3af;
	}

	.filter-select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		color: #374151;
		background: rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: border-color 0.15s;
	}

	:global(.dark) .filter-select {
		color: #f3f4f6;
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.filter-select:hover {
		border-color: rgba(139, 92, 246, 0.5);
	}

	.filter-select:focus {
		outline: none;
		border-color: #8b5cf6;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.filter-strip-wrapper {
			left: 0;
			right: 0;
		}

		.filter-strip-container {
			padding: 0.5rem 1rem;
		}

		.pill-label {
			font-size: 0.875rem;
		}
	}
</style>
