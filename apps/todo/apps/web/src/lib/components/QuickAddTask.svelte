<script lang="ts">
	import { onMount } from 'svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import {
		parseMultiTaskInput,
		resolveTaskIds,
		formatParsedTaskPreview,
		formatDuration,
	} from '$lib/utils/task-parser';
	import { estimateDuration, type CompletedTaskData } from '$lib/utils/time-estimator';
	import { taskCollection } from '$lib/data/local-store';
	import { labelCollection } from '$lib/data/local-store';
	import { todoSettings } from '$lib/stores/settings.svelte';

	import type { TaskPriority } from '@todo/shared';
	import { PRIORITY_OPTIONS } from '@todo/shared';
	import { format, addDays } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { CalendarBlank, Plus, Flag, ArrowRight } from '@manacore/shared-icons';

	let inputValue = $state('');
	let isLoading = $state(false);
	let inputRef: HTMLInputElement;

	// Task options (used as fallback when parser doesn't extract these)
	let selectedDate = $state<Date>(new Date());
	let selectedPriority = $state<TaskPriority>('medium');

	// Dropdown states
	let showDatePicker = $state(false);
	let showPriorityPicker = $state(false);

	// Parser preview
	let parsePreview = $state('');
	let parsedTaskCount = $state(0);
	let autoEstimatedDuration = $state<number | null>(null); // auto-applied, shown in preview
	let estimateDebounce: ReturnType<typeof setTimeout> | undefined;

	// Quick date options
	const dateOptions = [
		{ label: 'Heute', date: new Date() },
		{ label: 'Morgen', date: addDays(new Date(), 1) },
		{ label: 'In 3 Tagen', date: addDays(new Date(), 3) },
		{ label: 'Nächste Woche', date: addDays(new Date(), 7) },
	];

	// Derived values
	let currentPriority = $derived(PRIORITY_OPTIONS.find((p) => p.value === selectedPriority)!);
	let dateLabel = $derived(() => {
		const today = new Date();
		if (selectedDate.toDateString() === today.toDateString()) return 'Heute';
		if (selectedDate.toDateString() === addDays(today, 1).toDateString()) return 'Morgen';
		return format(selectedDate, 'dd. MMM', { locale: de });
	});

	// Update parse preview on input change
	$effect(() => {
		const text = inputValue.trim();
		if (!text) {
			parsePreview = '';
			parsedTaskCount = 0;
			autoEstimatedDuration = null;
			return;
		}

		const tasks = parseMultiTaskInput(text);
		parsedTaskCount = tasks.length;

		// Build preview from first task
		if (tasks.length > 0) {
			const previews = tasks.map((t) => formatParsedTaskPreview(t)).filter(Boolean);
			if (tasks.length > 1) {
				previews.unshift(`${tasks.length} Aufgaben`);
			}
			parsePreview = previews.join(' · ');
		}

		// Auto-estimate duration if enabled and no explicit duration
		clearTimeout(estimateDebounce);
		if (todoSettings.smartDurationEnabled && tasks.length === 1 && !tasks[0].estimatedDuration) {
			estimateDebounce = setTimeout(() => runEstimate(tasks[0]), 400);
		} else {
			autoEstimatedDuration = null;
		}
	});

	async function runEstimate(parsed: ReturnType<typeof parseMultiTaskInput>[0]) {
		if (!todoSettings.smartDurationEnabled) {
			autoEstimatedDuration = null;
			return;
		}

		try {
			const allTasks = await taskCollection.getAll();
			const completed: CompletedTaskData[] = allTasks
				.filter((t) => t.isCompleted && t.completedAt)
				.map((t) => ({
					title: t.title,
					priority: t.priority,
					estimatedDuration: t.estimatedDuration,
					completedAt: t.completedAt,
					createdAt: t.createdAt,
				}));

			const estimate = estimateDuration(
				{
					title: parsed.title,
					priority: selectedPriority,
				},
				completed
			);

			// Auto-apply: use estimate if available, otherwise fall back to default
			autoEstimatedDuration = estimate?.minutes ?? todoSettings.defaultTaskDuration;
		} catch {
			autoEstimatedDuration = todoSettings.defaultTaskDuration;
		}
	}

	onMount(() => {
		inputRef?.focus();
	});

	async function handleSubmit(event: Event) {
		event.preventDefault();

		const text = inputValue.trim();
		if (!text || isLoading) return;

		isLoading = true;

		try {
			const allLabels = await labelCollection.getAll();
			const labels = allLabels.map((l) => ({ id: l.id, name: l.name }));

			const parsedTasks = parseMultiTaskInput(text);

			for (const parsed of parsedTasks) {
				const resolved = resolveTaskIds(parsed, labels);

				// Duration: explicit from parser > auto-estimated > default (if enabled)
				const duration =
					resolved.estimatedDuration ??
					(todoSettings.smartDurationEnabled ? autoEstimatedDuration : undefined) ??
					undefined;

				await tasksStore.createTask({
					title: resolved.title,
					dueDate: resolved.dueDate ?? selectedDate.toISOString(),
					priority: resolved.priority ?? selectedPriority,
					labelIds: resolved.labelIds.length > 0 ? resolved.labelIds : undefined,
					recurrenceRule: resolved.recurrenceRule,
					estimatedDuration: duration,
					subtasks: resolved.subtasks?.map((s, i) => ({
						id: crypto.randomUUID(),
						title: s,
						isCompleted: false,
						order: i,
					})),
				});
			}

			// Reset form
			inputValue = '';
			parsePreview = '';
			parsedTaskCount = 0;
			autoEstimatedDuration = null;
			selectedDate = new Date();
			selectedPriority = 'medium';
		} catch (error) {
			console.error('Failed to create task:', error);
		} finally {
			isLoading = false;
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
			inputRef?.blur();
		}
	}

	function closeAllPickers() {
		showDatePicker = false;
		showPriorityPicker = false;
	}

	function toggleDatePicker() {
		showDatePicker = !showDatePicker;
		showPriorityPicker = false;
	}

	function togglePriorityPicker() {
		showPriorityPicker = !showPriorityPicker;
		showDatePicker = false;
	}

	function selectDate(date: Date) {
		selectedDate = date;
		showDatePicker = false;
	}

	function selectPriority(priority: TaskPriority) {
		selectedPriority = priority;
		showPriorityPicker = false;
	}
</script>

<svelte:window onclick={closeAllPickers} />

<form onsubmit={handleSubmit} class="quick-add-form">
	<!-- Parse preview + auto-duration -->
	{#if parsePreview || autoEstimatedDuration}
		<div class="parse-preview">
			{#if parsePreview}
				<span class="preview-text">{parsePreview}</span>
			{/if}
			{#if autoEstimatedDuration}
				<span class="auto-duration">~{formatDuration(autoEstimatedDuration)}</span>
			{/if}
		</div>
	{/if}

	<div class="quick-add-wrapper">
		<!-- Plus icon -->
		<div class="quick-add-icon">
			<Plus size={16} />
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
					<CalendarBlank size={20} class="option-icon" />
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
					<Flag size={16} color={currentPriority.color} />
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

			<!-- Divider -->
			<div class="option-divider"></div>

			<!-- Submit button -->
			<button type="submit" class="submit-btn" disabled={isLoading || !inputValue.trim()}>
				{#if isLoading}
					<div
						class="animate-spin h-4 w-4 border-2 border-white border-r-transparent rounded-full"
					></div>
				{:else}
					<ArrowRight size={16} />
				{/if}
			</button>
		</div>
	</div>
</form>

<style>
	.quick-add-form {
		margin-bottom: 1.5rem;
	}

	.parse-preview {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 1rem;
		margin-bottom: 0.25rem;
		font-size: 0.75rem;
		color: var(--color-muted-foreground, #6b7280);
		flex-wrap: wrap;
	}

	.preview-text {
		opacity: 0.8;
	}

	.auto-duration {
		display: inline-flex;
		padding: 0.0625rem 0.4rem;
		background: rgba(139, 92, 246, 0.08);
		color: #8b5cf6;
		border-radius: 9999px;
		font-size: 0.65rem;
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
		background: var(--color-surface-elevated-3);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-xl);
		z-index: 50;
	}

	/* Mobile: Dropdown opens upward */
	@media (max-width: 768px) {
		.dropdown {
			top: auto;
			bottom: calc(100% + 0.5rem);
		}
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		color: var(--color-foreground);
		cursor: pointer;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		text-align: left;
		transition: background 0.15s;
	}

	.dropdown-item:hover {
		background: var(--color-surface-hover);
	}

	.dropdown-item.selected {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
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
