<script lang="ts">
	import type { TaskPriority } from '@todo/shared';
	import { PRIORITY_OPTIONS } from '@todo/shared';
	import { viewStore, type SortBy } from '$lib/stores/view.svelte';
	import { todoSettings } from '$lib/stores/settings.svelte';
	import { PillToolbarButton, PillToolbarDivider, PillViewSwitcher } from '@manacore/shared-ui';
	import { CheckCircle, Columns, Funnel } from '@manacore/shared-icons';

	interface Props {
		/** Vertical layout (for sidebar mode) */
		vertical?: boolean;
		/** Current sort field */
		sortBy?: SortBy;
		/** Sort change callback */
		onSortChange?: (sortBy: SortBy) => void;
		/** Show completed tasks toggle */
		showCompleted?: boolean;
		/** Toggle show completed callback */
		onToggleShowCompleted?: () => void;
	}

	let {
		vertical = false,
		sortBy = viewStore.sortBy,
		onSortChange = (s: SortBy) => viewStore.setSort(s, viewStore.sortOrder),
		showCompleted = viewStore.showCompleted,
		onToggleShowCompleted = () => viewStore.toggleShowCompleted(),
	}: Props = $props();

	// Filter dropdown states
	let showFilterDropdown = $state(false);
	let selectedPriorityFilters = $state<TaskPriority[]>([]);
	let selectedLabelFilters = $state<string[]>([]);

	const priorities: { value: TaskPriority; label: string; color: string }[] = [
		{ value: 'urgent', label: 'Dringend', color: '#ef4444' },
		{ value: 'high', label: 'Hoch', color: '#f97316' },
		{ value: 'medium', label: 'Normal', color: '#eab308' },
		{ value: 'low', label: 'Niedrig', color: '#3b82f6' },
	];

	// Sort options
	const sortOptions = [
		{ id: 'dueDate', label: 'Datum', title: 'Nach Fälligkeitsdatum sortieren' },
		{ id: 'priority', label: 'Priorität', title: 'Nach Priorität sortieren' },
		{ id: 'title', label: 'Name', title: 'Alphabetisch sortieren' },
	];

	// Count active filters
	let activeFilterCount = $derived(selectedPriorityFilters.length + selectedLabelFilters.length);

	function handleSortChange(value: string) {
		onSortChange(value as SortBy);
	}

	function closeAllDropdowns() {
		showFilterDropdown = false;
	}

	function togglePriorityFilter(priority: TaskPriority) {
		if (selectedPriorityFilters.includes(priority)) {
			selectedPriorityFilters = selectedPriorityFilters.filter((p) => p !== priority);
		} else {
			selectedPriorityFilters = [...selectedPriorityFilters, priority];
		}
	}

	function clearAllFilters() {
		selectedPriorityFilters = [];
		selectedLabelFilters = [];
	}
</script>

<svelte:window onclick={closeAllDropdowns} />

<div class="toolbar-content" class:vertical>
	<!-- Board View Button — cycle layout mode -->
	<PillToolbarButton
		onclick={() => {
			const modes = ['fokus', 'uebersicht', 'matrix'] as const;
			const idx = modes.indexOf(todoSettings.activeLayoutMode);
			todoSettings.set('activeLayoutMode', modes[(idx + 1) % modes.length]);
		}}
		title="Ansicht wechseln"
	>
		<Columns size={20} />
	</PillToolbarButton>

	{#if !vertical}
		<PillToolbarDivider />
	{/if}

	<!-- Filter Button -->
	<div class="filter-dropdown-container" onclick={(e) => e.stopPropagation()}>
		<PillToolbarButton
			onclick={() => {
				showFilterDropdown = !showFilterDropdown;
			}}
			active={activeFilterCount > 0}
			title="Filter"
		>
			<Funnel size={20} />
			{#if activeFilterCount > 0}
				<span class="filter-count">{activeFilterCount}</span>
			{/if}
		</PillToolbarButton>

		{#if showFilterDropdown}
			<div class="filter-dropdown" class:vertical onclick={(e) => e.stopPropagation()}>
				<div class="filter-section">
					<div class="filter-section-header">Priorität</div>
					<div class="filter-chips">
						{#each priorities as priority}
							<button
								type="button"
								class="filter-chip"
								class:selected={selectedPriorityFilters.includes(priority.value)}
								onclick={() => togglePriorityFilter(priority.value)}
							>
								<span class="chip-dot" style="background-color: {priority.color}"></span>
								{priority.label}
							</button>
						{/each}
					</div>
				</div>

				{#if activeFilterCount > 0}
					<button type="button" class="clear-filters-btn" onclick={clearAllFilters}>
						Filter zurücksetzen
					</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if !vertical}
		<PillToolbarDivider />
	{/if}

	<!-- Sort Toggle -->
	<PillViewSwitcher
		options={sortOptions}
		value={sortBy}
		onChange={handleSortChange}
		embedded={true}
	/>

	{#if !vertical}
		<PillToolbarDivider />
	{/if}

	<!-- Show Completed Toggle -->
	<PillToolbarButton
		onclick={onToggleShowCompleted}
		active={showCompleted}
		title={showCompleted ? 'Erledigte ausblenden' : 'Erledigte anzeigen'}
	>
		<CheckCircle size={20} />
	</PillToolbarButton>
</div>

<style>
	.toolbar-content {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.toolbar-content.vertical {
		flex-direction: column;
		align-items: stretch;
		gap: 0.5rem;
		width: 100%;
	}

	/* All elements in vertical mode - full width, left aligned */
	.toolbar-content.vertical :global(.pill-toolbar-btn),
	.toolbar-content.vertical :global(.pill-dropdown .trigger-button),
	.toolbar-content.vertical :global(button) {
		width: 100%;
		justify-content: flex-start;
		text-align: left;
	}

	/* PillViewSwitcher in vertical mode */
	.toolbar-content.vertical :global(.pill-view-switcher) {
		flex-direction: column;
		gap: 0.25rem;
		padding: 0;
		background: transparent;
		border: none;
		box-shadow: none;
		width: 100%;
	}

	/* Hide the sliding indicator in vertical mode */
	.toolbar-content.vertical :global(.pill-view-switcher .sliding-indicator) {
		display: none;
	}

	.toolbar-content.vertical :global(.pill-view-switcher .switcher-btn) {
		width: 100%;
		justify-content: flex-start;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		background: transparent;
		border: 1px solid transparent;
	}

	.toolbar-content.vertical :global(.pill-view-switcher .switcher-btn:hover) {
		background: hsl(var(--color-foreground) / 0.05);
	}

	.toolbar-content.vertical :global(.pill-view-switcher .switcher-btn.active) {
		background: hsl(var(--color-primary) / 0.15);
		border-color: hsl(var(--color-primary) / 0.25);
	}

	/* Filter dropdown container */
	.filter-dropdown-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.filter-count {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 1rem;
		height: 1rem;
		padding: 0 0.25rem;
		font-size: 0.625rem;
		font-weight: 600;
		color: white;
		background: #8b5cf6;
		border-radius: 9999px;
	}

	.filter-dropdown {
		position: absolute;
		bottom: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
		min-width: 260px;
		padding: 0.75rem;
		background: var(--color-surface-elevated-3);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		box-shadow: var(--shadow-xl);
		z-index: 100;
	}

	/* Dropdown in vertical mode opens downward */
	.filter-dropdown.vertical {
		bottom: auto;
		top: calc(100% + 0.5rem);
	}

	.filter-section {
		margin-bottom: 0.75rem;
	}

	.filter-section:last-of-type {
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

	.filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.filter-chip {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #374151;
		background: rgba(0, 0, 0, 0.05);
		border: 1px solid transparent;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .filter-chip {
		color: #f3f4f6;
		background: rgba(255, 255, 255, 0.1);
	}

	.filter-chip:hover {
		background: rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .filter-chip:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.filter-chip.selected {
		background: rgba(139, 92, 246, 0.15);
		border-color: rgba(139, 92, 246, 0.3);
		color: #8b5cf6;
	}

	.chip-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
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

	.clear-filters-btn {
		width: 100%;
		margin-top: 0.75rem;
		padding: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #6b7280;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: color 0.15s;
	}

	.clear-filters-btn:hover {
		color: #374151;
	}

	:global(.dark) .clear-filters-btn:hover {
		color: #f3f4f6;
	}
</style>
