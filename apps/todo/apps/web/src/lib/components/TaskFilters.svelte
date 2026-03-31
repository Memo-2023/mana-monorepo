<script lang="ts">
	import { goto } from '$app/navigation';
	import type { TaskPriority } from '@todo/shared';
	import { getContext } from 'svelte';
	import type { Project } from '@todo/shared';
	import { getActiveProjects } from '$lib/data/task-queries';

	const projectsCtx: { readonly value: Project[] } = getContext('projects');
	import type { Tag } from '@manacore/shared-tags';

	const tagsCtx: { readonly value: Tag[] } = getContext('tags');
	import type { SortBy, SortOrder } from '$lib/stores/view.svelte';
	import {
		CaretDown,
		Check,
		CheckCircle,
		Columns,
		DotsThree,
		MagnifyingGlass,
		X,
	} from '@manacore/shared-icons';

	interface Props {
		// Layout
		variant: 'strip' | 'bar';

		// Filter state (owned by parent)
		selectedPriorities: TaskPriority[];
		selectedProjectId: string | null;
		selectedLabelIds: string[];
		searchQuery: string;

		// Callbacks
		onPrioritiesChange: (priorities: TaskPriority[]) => void;
		onProjectChange: (projectId: string | null) => void;
		onLabelsChange: (labelIds: string[]) => void;
		onSearchChange: (query: string) => void;
		onClearFilters: () => void;

		// Sort (strip variant)
		sortBy?: SortBy;
		sortOrder?: SortOrder;
		onSortChange?: (sortBy: SortBy) => void;

		// Feature toggles
		showSort?: boolean;
		showSearch?: boolean;
		showLabels?: boolean;
		showCompleted?: boolean;
		showKanbanNav?: boolean;

		// Completed toggle
		isCompletedVisible?: boolean;
		onToggleCompleted?: () => void;
	}

	let {
		variant,
		selectedPriorities,
		selectedProjectId,
		selectedLabelIds,
		searchQuery,
		onPrioritiesChange,
		onProjectChange,
		onLabelsChange,
		onSearchChange,
		onClearFilters,
		sortBy,
		sortOrder,
		onSortChange,
		showSort = false,
		showSearch = false,
		showLabels = false,
		showCompleted = false,
		showKanbanNav = false,
		isCompletedVisible = false,
		onToggleCompleted,
	}: Props = $props();

	const priorities: { value: TaskPriority; label: string; color: string; bgColor: string }[] = [
		{ value: 'urgent', label: 'Dringend', color: '#ef4444', bgColor: 'bg-red-500' },
		{ value: 'high', label: 'Hoch', color: '#f97316', bgColor: 'bg-orange-500' },
		{ value: 'medium', label: 'Normal', color: '#eab308', bgColor: 'bg-yellow-500' },
		{ value: 'low', label: 'Niedrig', color: '#3b82f6', bgColor: 'bg-blue-500' },
	];

	const sortOptions: { id: SortBy; label: string }[] = [
		{ id: 'dueDate', label: 'Datum' },
		{ id: 'priority', label: 'Priorit.' },
		{ id: 'title', label: 'Name' },
	];

	// Dropdown states
	let showFilterDropdown = $state(false);
	let showLabelsDropdown = $state(false);

	let hasActiveFilters = $derived(
		selectedPriorities.length > 0 ||
			selectedProjectId !== null ||
			selectedLabelIds.length > 0 ||
			searchQuery.trim() !== ''
	);

	function togglePriority(priority: TaskPriority) {
		if (selectedPriorities.includes(priority)) {
			onPrioritiesChange(selectedPriorities.filter((p) => p !== priority));
		} else {
			onPrioritiesChange([...selectedPriorities, priority]);
		}
	}

	function toggleLabel(labelId: string) {
		if (selectedLabelIds.includes(labelId)) {
			onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
		} else {
			onLabelsChange([...selectedLabelIds, labelId]);
		}
	}

	function closeFilterDropdown() {
		showFilterDropdown = false;
	}
</script>

<svelte:window onclick={closeFilterDropdown} />

{#if variant === 'strip'}
	<!-- ==================== STRIP VARIANT ==================== -->
	<div class="filter-strip-wrapper">
		<div class="filter-strip-container">
			<!-- Clear Filter Button -->
			<button
				class="clear-filter-pill glass-pill"
				class:hidden={!hasActiveFilters}
				onclick={onClearFilters}
				title="Filter löschen"
				disabled={!hasActiveFilters}
			>
				<X size={16} weight="bold" />
				<span class="pill-label">Filter</span>
			</button>

			<!-- Kanban View Button -->
			{#if showKanbanNav}
				<button class="glass-pill" onclick={() => goto('/kanban')} title="Kanban-Ansicht">
					<Columns size={18} />
					<span class="pill-label">Kanban</span>
				</button>
			{/if}

			<!-- Priority Filter Pills -->
			{#each priorities as priority (priority.value)}
				<button
					class="priority-pill glass-pill"
					class:selected={selectedPriorities.includes(priority.value)}
					onclick={() => togglePriority(priority.value)}
					title={priority.label}
					style="--priority-color: {priority.color}"
				>
					<span class="priority-dot"></span>
					<span class="pill-label">{priority.label}</span>
				</button>
			{/each}

			<!-- Sort Pills -->
			{#if showSort && onSortChange}
				{#each sortOptions as option (option.id)}
					<button
						class="sort-pill glass-pill"
						class:active={sortBy === option.id}
						onclick={() => onSortChange(option.id)}
						title="Nach {option.label} sortieren"
					>
						<span class="pill-label">{option.label}</span>
					</button>
				{/each}
			{/if}

			<!-- Show Completed Toggle -->
			{#if showCompleted && onToggleCompleted}
				<button
					class="glass-pill"
					class:active={isCompletedVisible}
					onclick={onToggleCompleted}
					title={isCompletedVisible ? 'Erledigte ausblenden' : 'Erledigte anzeigen'}
				>
					<CheckCircle size={20} class="pill-icon" />
					<span class="pill-label">Erledigt</span>
				</button>
			{/if}

			<!-- More Options (Project Filter + Labels) -->
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
								value={selectedProjectId || ''}
								onchange={(e) => onProjectChange(e.currentTarget.value || null)}
							>
								<option value="">Alle Projekte</option>
								{#each getActiveProjects(projectsCtx.value) as project}
									<option value={project.id}>{project.name}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<!-- ==================== BAR VARIANT ==================== -->
	<div class="kanban-filters glass-pill-bar rounded-2xl p-4">
		<div class="flex flex-col gap-4">
			<!-- Row 1: Search and Clear -->
			{#if showSearch}
				<div class="flex items-center gap-4">
					<div class="relative flex-1 max-w-xs">
						<MagnifyingGlass
							size={16}
							class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
						/>
						<input
							type="text"
							value={searchQuery}
							oninput={(e) => onSearchChange(e.currentTarget.value)}
							placeholder="Aufgaben suchen..."
							class="w-full pl-10 pr-8 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground transition-all"
						/>
						{#if searchQuery}
							<button
								class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
								onclick={() => onSearchChange('')}
							>
								<X size={16} />
							</button>
						{/if}
					</div>

					{#if hasActiveFilters}
						<button
							class="ml-auto px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
							onclick={onClearFilters}
						>
							<X size={16} />
							Zurücksetzen
						</button>
					{/if}
				</div>
			{/if}

			<!-- Row 2: Filter Pills -->
			<div class="flex flex-wrap items-center gap-3">
				<!-- Priority filters -->
				<div class="filter-group flex items-center gap-2">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
						>Priorität</span
					>
					<div class="flex items-center gap-1">
						{#each priorities as priority}
							<button
								class="filter-pill px-3 py-1.5 text-xs font-medium rounded-full transition-all border {selectedPriorities.includes(
									priority.value
								)
									? `${priority.bgColor} text-white border-transparent shadow-sm`
									: 'bg-background border-border text-foreground hover:border-primary/50 hover:bg-muted/50'}"
								onclick={() => togglePriority(priority.value)}
							>
								{priority.label}
							</button>
						{/each}
					</div>
				</div>

				<div class="h-6 w-px bg-border hidden sm:block"></div>

				<!-- Project filter -->
				<div class="filter-group flex items-center gap-2">
					<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
						>Projekt</span
					>
					<select
						class="px-3 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer"
						value={selectedProjectId || ''}
						onchange={(e) => onProjectChange(e.currentTarget.value || null)}
					>
						<option value="">Alle Projekte</option>
						{#each getActiveProjects(projectsCtx.value) as project}
							<option value={project.id}>{project.name}</option>
						{/each}
					</select>
				</div>

				<!-- Labels filter -->
				{#if showLabels}
					<div class="h-6 w-px bg-border hidden sm:block"></div>

					<div class="filter-group flex items-center gap-2 relative">
						<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
							>Tags</span
						>
						<button
							class="flex items-center gap-2 px-3 py-1.5 text-sm bg-background border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all"
							onclick={() => (showLabelsDropdown = !showLabelsDropdown)}
						>
							{#if selectedLabelIds.length > 0}
								<div class="flex items-center gap-1">
									{#each selectedLabelIds.slice(0, 3) as labelId}
										{@const label = tagsCtx.value.find((l) => l.id === labelId)}
										{#if label}
											<div
												class="w-3 h-3 rounded-full ring-2 ring-background"
												style="background-color: {label.color}"
											></div>
										{/if}
									{/each}
									{#if selectedLabelIds.length > 3}
										<span class="text-xs text-muted-foreground">+{selectedLabelIds.length - 3}</span
										>
									{/if}
								</div>
							{:else}
								<span class="text-muted-foreground">Auswählen</span>
							{/if}
							<CaretDown
								size={16}
								class="text-muted-foreground transition-transform {showLabelsDropdown
									? 'rotate-180'
									: ''}"
							/>
						</button>

						{#if showLabelsDropdown}
							<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
							<div class="fixed inset-0 z-40" onclick={() => (showLabelsDropdown = false)}></div>
							<div
								class="absolute top-full left-0 mt-2 z-50 min-w-[220px] bg-popover border border-border rounded-xl shadow-lg p-2 animate-in fade-in slide-in-from-top-2 duration-150"
							>
								{#if tagsCtx.value.length === 0}
									<p class="text-sm text-muted-foreground p-3 text-center">Keine Tags vorhanden</p>
								{:else}
									<div class="max-h-[200px] overflow-y-auto">
										{#each tagsCtx.value as label}
											<button
												class="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
												onclick={() => toggleLabel(label.id)}
											>
												<div
													class="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-popover transition-all {selectedLabelIds.includes(
														label.id
													)
														? 'ring-primary'
														: 'ring-transparent'}"
													style="background-color: {label.color}"
												></div>
												<span class="flex-1 text-left truncate">{label.name}</span>
												{#if selectedLabelIds.includes(label.id)}
													<Check size={16} class="text-primary" />
												{/if}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* ==================== STRIP VARIANT STYLES ==================== */
	.filter-strip-wrapper {
		position: fixed;
		bottom: calc(70px + env(safe-area-inset-bottom, 0px));
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

	/* Glass pill styling */
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

	/* Responsive strip */
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

	/* ==================== BAR VARIANT STYLES ==================== */
	.glass-pill-bar {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .glass-pill-bar {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	/* Animation utilities */
	.animate-in {
		animation: animateIn 0.15s ease-out;
	}

	.fade-in {
		--tw-enter-opacity: 0;
	}

	.slide-in-from-top-2 {
		--tw-enter-translate-y: -0.5rem;
	}

	@keyframes animateIn {
		from {
			opacity: var(--tw-enter-opacity, 1);
			transform: translateY(var(--tw-enter-translate-y, 0));
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
