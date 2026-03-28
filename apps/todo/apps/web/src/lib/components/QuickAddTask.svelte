<script lang="ts">
	import { onMount } from 'svelte';
	import { getContext } from 'svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import type { Project } from '@todo/shared';
	import { getActiveProjects, getProjectById } from '$lib/data/task-queries';

	const projectsCtx: { readonly value: Project[] } = getContext('projects');
	import type { TaskPriority } from '@todo/shared';
	import { PRIORITY_OPTIONS } from '@todo/shared';
	import { format, addDays } from 'date-fns';
	import { de } from 'date-fns/locale';

	let inputValue = $state('');
	let isLoading = $state(false);
	let inputRef: HTMLInputElement;

	// Task options
	let selectedDate = $state<Date>(new Date());
	let selectedPriority = $state<TaskPriority>('medium');
	let selectedProjectId = $state<string | undefined>(undefined);

	// Dropdown states
	let showDatePicker = $state(false);
	let showPriorityPicker = $state(false);
	let showProjectPicker = $state(false);

	// Quick date options
	const dateOptions = [
		{ label: 'Heute', date: new Date() },
		{ label: 'Morgen', date: addDays(new Date(), 1) },
		{ label: 'In 3 Tagen', date: addDays(new Date(), 3) },
		{ label: 'Nächste Woche', date: addDays(new Date(), 7) },
	];

	// Derived values
	let currentPriority = $derived(PRIORITY_OPTIONS.find((p) => p.value === selectedPriority)!);
	let selectedProject = $derived(
		selectedProjectId ? getProjectById(projectsCtx.value, selectedProjectId) : undefined
	);
	let dateLabel = $derived(() => {
		const today = new Date();
		if (selectedDate.toDateString() === today.toDateString()) return 'Heute';
		if (selectedDate.toDateString() === addDays(today, 1).toDateString()) return 'Morgen';
		return format(selectedDate, 'dd. MMM', { locale: de });
	});

	onMount(() => {
		inputRef?.focus();

		// Set project if in project view
		if (viewStore.currentView === 'project' && viewStore.currentProjectId) {
			selectedProjectId = viewStore.currentProjectId;
		}
	});

	async function handleSubmit(event: Event) {
		event.preventDefault();

		const title = inputValue.trim();
		if (!title || isLoading) return;

		isLoading = true;

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
			if (viewStore.currentView !== 'project') {
				selectedProjectId = undefined;
			}
		} catch (error) {
			console.error('Failed to create task:', error);
		} finally {
			isLoading = false;
			// Focus after isLoading is reset (input is no longer disabled)
			requestAnimationFrame(() => {
				inputRef?.focus();
			});
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			inputValue = '';
			showDatePicker = false;
			showPriorityPicker = false;
			showProjectPicker = false;
			inputRef?.blur();
		}
	}

	function closeAllPickers() {
		showDatePicker = false;
		showPriorityPicker = false;
		showProjectPicker = false;
	}

	function toggleDatePicker() {
		showDatePicker = !showDatePicker;
		showPriorityPicker = false;
		showProjectPicker = false;
	}

	function togglePriorityPicker() {
		showPriorityPicker = !showPriorityPicker;
		showDatePicker = false;
		showProjectPicker = false;
	}

	function toggleProjectPicker() {
		showProjectPicker = !showProjectPicker;
		showDatePicker = false;
		showPriorityPicker = false;
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
</script>

<svelte:window onclick={closeAllPickers} />

<form onsubmit={handleSubmit} class="quick-add-form">
	<div class="quick-add-wrapper">
		<!-- Plus icon -->
		<div class="quick-add-icon">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
		</div>

		<!-- Input -->
		<input
			bind:this={inputRef}
			bind:value={inputValue}
			onkeydown={handleKeydown}
			type="text"
			placeholder="Neue Aufgabe hinzufügen..."
			class="quick-add-input"
			disabled={isLoading}
		/>

		<!-- Options -->
		<div class="quick-add-options">
			<!-- Date picker -->
			<div class="option-wrapper">
				<button
					type="button"
					class="option-btn"
					class:active={showDatePicker}
					onclick={(e) => {
						e.stopPropagation();
						toggleDatePicker();
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
					<div class="dropdown" onclick={(e) => e.stopPropagation()} role="menu">
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
						togglePriorityPicker();
					}}
					title="Priorität"
				>
					<svg
						class="option-icon"
						fill="none"
						viewBox="0 0 24 24"
						stroke={currentPriority.color}
						style="color: {currentPriority.color}"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
						/>
					</svg>
				</button>

				{#if showPriorityPicker}
					<div class="dropdown" onclick={(e) => e.stopPropagation()} role="menu">
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
						toggleProjectPicker();
					}}
					title="Projekt"
				>
					<svg
						class="option-icon"
						fill="none"
						viewBox="0 0 24 24"
						stroke={selectedProject?.color || 'currentColor'}
						style={selectedProject ? `color: ${selectedProject.color}` : ''}
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
					<div class="dropdown" onclick={(e) => e.stopPropagation()} role="menu">
						<button
							type="button"
							class="dropdown-item"
							class:selected={!selectedProjectId}
							onclick={() => selectProject(undefined)}
						>
							<span class="project-dot" style="background-color: #6b7280"></span>
							Kein Projekt
						</button>
						{#each getActiveProjects(projectsCtx.value) as project}
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

			<!-- Divider -->
			<div class="option-divider"></div>

			<!-- Submit button -->
			<button type="submit" class="submit-btn" disabled={isLoading || !inputValue.trim()}>
				{#if isLoading}
					<div
						class="animate-spin h-4 w-4 border-2 border-white border-r-transparent rounded-full"
					></div>
				{:else}
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
	</div>
</form>

<style>
	.quick-add-form {
		margin-bottom: 1.5rem;
	}

	/* Mobile: Fixed at bottom */
	@media (max-width: 768px) {
		.quick-add-form {
			position: fixed;
			bottom: calc(env(safe-area-inset-bottom, 0px) + 70px);
			left: 1rem;
			right: 1rem;
			margin-bottom: 0;
			z-index: 100;
		}
	}

	.quick-add-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transition: all 0.2s;
	}

	:global(.dark) .quick-add-wrapper {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.quick-add-wrapper:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .quick-add-wrapper:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.quick-add-wrapper:focus-within {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(139, 92, 246, 0.5);
		transform: translateY(-1px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05),
			0 0 0 3px rgba(139, 92, 246, 0.1);
	}

	:global(.dark) .quick-add-wrapper:focus-within {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(139, 92, 246, 0.5);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.3),
			0 0 0 3px rgba(139, 92, 246, 0.2);
	}

	.quick-add-icon {
		color: var(--color-muted-foreground, #6b7280);
		flex-shrink: 0;
	}

	.quick-add-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: 0.875rem;
		color: var(--color-foreground, #374151);
		min-width: 0;
	}

	.quick-add-input::placeholder {
		color: var(--color-muted-foreground, #9ca3af);
	}

	:global(.dark) .quick-add-input {
		color: #f3f4f6;
	}

	:global(.dark) .quick-add-input::placeholder {
		color: #9ca3af;
	}

	/* Options container */
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
		padding: 0.375rem 0.5rem;
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
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.option-label {
		display: none;
	}

	@media (min-width: 640px) {
		.option-label {
			display: inline;
		}
	}

	.option-divider {
		width: 1px;
		height: 1.25rem;
		background: rgba(0, 0, 0, 0.1);
		margin: 0 0.25rem;
	}

	:global(.dark) .option-divider {
		background: rgba(255, 255, 255, 0.15);
	}

	/* Dropdown */
	.dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 140px;
		padding: 0.375rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		z-index: 50;
	}

	/* Mobile: Dropdown opens upward */
	@media (max-width: 768px) {
		.dropdown {
			top: auto;
			bottom: calc(100% + 0.5rem);
			box-shadow:
				0 -10px 15px -3px rgba(0, 0, 0, 0.1),
				0 -4px 6px -2px rgba(0, 0, 0, 0.05);
		}
	}

	:global(.dark) .dropdown {
		background: rgba(40, 40, 40, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
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

	:global(.dark) .dropdown-item.selected {
		background: rgba(139, 92, 246, 0.2);
	}

	.priority-dot,
	.project-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	/* Submit button */
	.submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		background: #8b5cf6;
		color: white;
		cursor: pointer;
		border-radius: 9999px;
		transition: all 0.15s;
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
</style>
