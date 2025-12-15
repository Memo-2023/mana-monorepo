<script lang="ts">
	import { goto } from '$app/navigation';
	import type { TaskPriority } from '@todo/shared';
	import { PRIORITY_OPTIONS } from '@todo/shared';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { labelsStore } from '$lib/stores/labels.svelte';
	import { viewStore, type SortBy } from '$lib/stores/view.svelte';
	import { format, addDays } from 'date-fns';
	import { de } from 'date-fns/locale';
	import {
		PillToolbar,
		PillToolbarButton,
		PillToolbarDivider,
		PillViewSwitcher,
	} from '@manacore/shared-ui';

	interface Props {
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
		sortBy = viewStore.sortBy,
		onSortChange = (s: SortBy) => viewStore.setSort(s, viewStore.sortOrder),
		showCompleted = viewStore.showCompleted,
		onToggleShowCompleted = () => viewStore.toggleShowCompleted(),
	}: Props = $props();

	// Quick add task state
	let inputValue = $state('');
	let isCreating = $state(false);
	let showQuickAddOptions = $state(false);
	let selectedDate = $state<Date>(new Date());
	let selectedPriority = $state<TaskPriority>('medium');
	let selectedProjectId = $state<string | undefined>(undefined);

	// Dropdown states
	let showDatePicker = $state(false);
	let showPriorityPicker = $state(false);
	let showProjectPicker = $state(false);

	// Filter dropdown states
	let showFilterDropdown = $state(false);
	let selectedPriorityFilters = $state<TaskPriority[]>([]);
	let selectedProjectFilter = $state<string | null>(null);
	let selectedLabelFilters = $state<string[]>([]);

	// Quick date options
	const dateOptions = [
		{ label: 'Heute', date: new Date() },
		{ label: 'Morgen', date: addDays(new Date(), 1) },
		{ label: 'In 3 Tagen', date: addDays(new Date(), 3) },
		{ label: 'Nächste Woche', date: addDays(new Date(), 7) },
	];

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

	// Derived values
	let currentPriority = $derived(PRIORITY_OPTIONS.find((p) => p.value === selectedPriority)!);
	let selectedProject = $derived(
		selectedProjectId ? projectsStore.getById(selectedProjectId) : undefined
	);
	let dateLabel = $derived(() => {
		const today = new Date();
		if (selectedDate.toDateString() === today.toDateString()) return 'Heute';
		if (selectedDate.toDateString() === addDays(today, 1).toDateString()) return 'Morgen';
		return format(selectedDate, 'dd. MMM', { locale: de });
	});

	// Count active filters
	let activeFilterCount = $derived(
		selectedPriorityFilters.length + (selectedProjectFilter ? 1 : 0) + selectedLabelFilters.length
	);

	function handleSortChange(value: string) {
		onSortChange(value as SortBy);
	}

	function closeAllDropdowns() {
		showDatePicker = false;
		showPriorityPicker = false;
		showProjectPicker = false;
		showFilterDropdown = false;
	}

	async function handleSubmit(event?: Event) {
		event?.preventDefault();

		const title = inputValue.trim();
		if (!title || isCreating) return;

		isCreating = true;

		try {
			await tasksStore.createTask({
				title,
				projectId: selectedProjectId,
				dueDate: selectedDate.toISOString(),
				priority: selectedPriority,
			});

			// Reset form
			inputValue = '';
			selectedDate = new Date();
			selectedPriority = 'medium';
			selectedProjectId = undefined;
			showQuickAddOptions = false;
		} catch (error) {
			console.error('Failed to create task:', error);
		} finally {
			isCreating = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && inputValue.trim()) {
			handleSubmit();
		} else if (event.key === 'Escape') {
			inputValue = '';
			showQuickAddOptions = false;
			closeAllDropdowns();
		}
	}

	function handleInputFocus() {
		showQuickAddOptions = true;
	}

	function selectDate(date: Date) {
		selectedDate = date;
		showDatePicker = false;
	}

	function selectPriority(priority: TaskPriority) {
		selectedPriority = priority;
		showPriorityPicker = false;
	}

	function selectProject(projectId: string | undefined) {
		selectedProjectId = projectId;
		showProjectPicker = false;
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
		selectedProjectFilter = null;
		selectedLabelFilters = [];
	}
</script>

<svelte:window onclick={closeAllDropdowns} />

<PillToolbar topOffset="70px">
	<!-- Quick Add Input -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="quick-add-section" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
		<div class="quick-add-input-wrapper">
			<svg class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			<input
				type="text"
				bind:value={inputValue}
				onkeydown={handleKeydown}
				onfocus={handleInputFocus}
				placeholder="Neue Aufgabe..."
				class="quick-add-input"
				disabled={isCreating}
			/>
		</div>

		<!-- Quick add options (visible when focused or has input) -->
		{#if showQuickAddOptions || inputValue.trim()}
			<div class="quick-add-options">
				<!-- Date picker -->
				<div class="option-wrapper">
					<button
						type="button"
						class="option-btn"
						class:active={showDatePicker}
						onclick={(e) => {
							e.stopPropagation();
							showDatePicker = !showDatePicker;
							showPriorityPicker = false;
							showProjectPicker = false;
						}}
						title="Fälligkeitsdatum"
					>
						<svg class="option-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<span class="option-label">{dateLabel()}</span>
					</button>

					{#if showDatePicker}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="dropdown"
							onclick={(e) => e.stopPropagation()}
							onkeydown={() => {}}
							role="menu"
							tabindex="-1"
						>
							{#each dateOptions as option}
								<button
									type="button"
									class="dropdown-item"
									class:selected={selectedDate.toDateString() === option.date.toDateString()}
									onclick={() => selectDate(option.date)}
								>
									{option.label}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Priority picker -->
				<div class="option-wrapper">
					<button
						type="button"
						class="option-btn"
						class:active={showPriorityPicker}
						onclick={(e) => {
							e.stopPropagation();
							showPriorityPicker = !showPriorityPicker;
							showDatePicker = false;
							showProjectPicker = false;
						}}
						title="Priorität"
					>
						<svg class="option-icon" fill="none" viewBox="0 0 24 24" stroke={currentPriority.color}>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
							/>
						</svg>
					</button>

					{#if showPriorityPicker}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="dropdown"
							onclick={(e) => e.stopPropagation()}
							onkeydown={() => {}}
							role="menu"
							tabindex="-1"
						>
							{#each PRIORITY_OPTIONS as priority}
								<button
									type="button"
									class="dropdown-item"
									class:selected={selectedPriority === priority.value}
									onclick={() => selectPriority(priority.value)}
								>
									<span class="priority-dot" style="background-color: {priority.color}"></span>
									{priority.label}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Project picker -->
				<div class="option-wrapper">
					<button
						type="button"
						class="option-btn"
						class:active={showProjectPicker}
						onclick={(e) => {
							e.stopPropagation();
							showProjectPicker = !showProjectPicker;
							showDatePicker = false;
							showPriorityPicker = false;
						}}
						title="Projekt"
					>
						<svg
							class="option-icon"
							fill="none"
							viewBox="0 0 24 24"
							stroke={selectedProject?.color || 'currentColor'}
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
							/>
						</svg>
					</button>

					{#if showProjectPicker}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="dropdown"
							onclick={(e) => e.stopPropagation()}
							onkeydown={() => {}}
							role="menu"
							tabindex="-1"
						>
							<button
								type="button"
								class="dropdown-item"
								class:selected={!selectedProjectId}
								onclick={() => selectProject(undefined)}
							>
								<span class="project-dot" style="background-color: #6b7280"></span>
								Kein Projekt
							</button>
							{#each projectsStore.activeProjects as project}
								<button
									type="button"
									class="dropdown-item"
									class:selected={selectedProjectId === project.id}
									onclick={() => selectProject(project.id)}
								>
									<span class="project-dot" style="background-color: {project.color}"></span>
									{project.name}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Submit button -->
				<button
					type="button"
					class="submit-btn"
					disabled={isCreating || !inputValue.trim()}
					onclick={() => handleSubmit()}
				>
					{#if isCreating}
						<div class="spinner"></div>
					{:else}
						<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 7l5 5m0 0l-5 5m5-5H6"
							/>
						</svg>
					{/if}
				</button>
			</div>
		{/if}
	</div>

	<PillToolbarDivider />

	<!-- Kanban View Button -->
	<PillToolbarButton onclick={() => goto('/kanban')} title="Kanban-Ansicht">
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
			/>
		</svg>
	</PillToolbarButton>

	<PillToolbarDivider />

	<!-- Filter Button -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="filter-dropdown-container" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
		<PillToolbarButton
			onclick={() => {
				showFilterDropdown = !showFilterDropdown;
				closeAllDropdowns();
			}}
			active={activeFilterCount > 0}
			title="Filter"
		>
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
				/>
			</svg>
			{#if activeFilterCount > 0}
				<span class="filter-count">{activeFilterCount}</span>
			{/if}
		</PillToolbarButton>

		{#if showFilterDropdown}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="filter-dropdown"
				onclick={(e) => e.stopPropagation()}
				onkeydown={() => {}}
				role="menu"
				tabindex="-1"
			>
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

				{#if activeFilterCount > 0}
					<button type="button" class="clear-filters-btn" onclick={clearAllFilters}>
						Filter zurücksetzen
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<PillToolbarDivider />

	<!-- Sort Toggle -->
	<PillViewSwitcher
		options={sortOptions}
		value={sortBy}
		onChange={handleSortChange}
		embedded={true}
	/>

	<PillToolbarDivider />

	<!-- Show Completed Toggle -->
	<PillToolbarButton
		onclick={onToggleShowCompleted}
		active={showCompleted}
		title={showCompleted ? 'Erledigte ausblenden' : 'Erledigte anzeigen'}
	>
		<svg fill={showCompleted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	</PillToolbarButton>
</PillToolbar>

<style>
	/* Quick Add Section */
	.quick-add-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
		max-width: 400px;
	}

	.quick-add-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex: 1;
		min-width: 0;
	}

	.input-icon {
		width: 1rem;
		height: 1rem;
		color: #9ca3af;
		flex-shrink: 0;
	}

	.quick-add-input {
		flex: 1;
		min-width: 0;
		background: transparent;
		border: none;
		outline: none;
		font-size: 0.875rem;
		color: #374151;
	}

	:global(.dark) .quick-add-input {
		color: #f3f4f6;
	}

	.quick-add-input::placeholder {
		color: #9ca3af;
	}

	.quick-add-input:disabled {
		opacity: 0.5;
	}

	/* Quick add options */
	.quick-add-options {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.option-wrapper {
		position: relative;
	}

	.option-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.375rem;
		border: none;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		border-radius: 9999px;
		transition: all 0.15s;
		font-size: 0.75rem;
	}

	:global(.dark) .option-btn {
		color: #9ca3af;
	}

	.option-btn:hover,
	.option-btn.active {
		background: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark) .option-btn:hover,
	:global(.dark) .option-btn.active {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	.option-icon {
		width: 0.875rem;
		height: 0.875rem;
		flex-shrink: 0;
	}

	.option-label {
		display: none;
	}

	@media (min-width: 768px) {
		.option-label {
			display: inline;
		}
	}

	/* Submit button */
	.submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: #8b5cf6;
		color: white;
		cursor: pointer;
		border-radius: 9999px;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.submit-btn:hover:not(:disabled) {
		background: #7c3aed;
		transform: scale(1.05);
	}

	.submit-btn:disabled {
		background: #d1d5db;
		cursor: not-allowed;
	}

	:global(.dark) .submit-btn:disabled {
		background: #4b5563;
	}

	.submit-btn svg {
		width: 0.875rem;
		height: 0.875rem;
	}

	.spinner {
		width: 0.75rem;
		height: 0.75rem;
		border: 2px solid white;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Dropdowns */
	.dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
		min-width: 140px;
		padding: 0.375rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
		z-index: 50;
	}

	:global(.dark) .dropdown {
		background: rgba(40, 40, 40, 0.95);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		color: #374151;
		cursor: pointer;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		text-align: left;
		transition: background 0.15s;
	}

	:global(.dark) .dropdown-item {
		color: #f3f4f6;
	}

	.dropdown-item:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .dropdown-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.dropdown-item.selected {
		background: rgba(139, 92, 246, 0.1);
		color: #8b5cf6;
	}

	.priority-dot,
	.project-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
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
		top: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
		min-width: 260px;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.75rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
		z-index: 50;
	}

	:global(.dark) .filter-dropdown {
		background: rgba(30, 30, 30, 0.95);
		border-color: rgba(255, 255, 255, 0.1);
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
