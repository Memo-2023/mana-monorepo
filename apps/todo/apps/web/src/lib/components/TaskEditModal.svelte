<script lang="ts">
	import type {
		Task,
		Subtask,
		TaskPriority,
		TaskStatus,
		DurationUnit,
		EffectiveDuration,
	} from '@todo/shared';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { labelsStore } from '$lib/stores/labels.svelte';
	import { format } from 'date-fns';
	import SubtaskList from './SubtaskList.svelte';

	interface Props {
		task: Task;
		open: boolean;
		onClose: () => void;
		onSave: (data: Partial<Task>) => void;
		onDelete: (taskId: string) => void;
	}

	let { task, open, onClose, onSave, onDelete }: Props = $props();

	// Form state - initialized from task
	let title = $state('');
	let description = $state('');
	let dueDate = $state('');
	let dueTime = $state('');
	let startDate = $state('');
	let priority = $state<TaskPriority>('medium');
	let status = $state<TaskStatus>('pending');
	let projectId = $state<string | null>(null);
	let selectedLabelIds = $state<string[]>([]);
	let subtasks = $state<Subtask[]>([]);
	let recurrenceRule = $state('');
	let notes = $state('');
	let storyPoints = $state<number | null>(null);
	let effectiveDurationValue = $state<number | null>(null);
	let effectiveDurationUnit = $state<DurationUnit>('hours');
	let funRating = $state<number | null>(null);
	let showCustomDuration = $state(false);

	// UI state
	let showLabelDropdown = $state(false);
	let isLoading = $state(false);
	let showDeleteConfirm = $state(false);

	// Priority options
	const priorities: { value: TaskPriority; label: string; color: string }[] = [
		{ value: 'low', label: 'Niedrig', color: '#22c55e' },
		{ value: 'medium', label: 'Mittel', color: '#eab308' },
		{ value: 'high', label: 'Hoch', color: '#f97316' },
		{ value: 'urgent', label: 'Dringend', color: '#ef4444' },
	];

	// Status options
	const statuses: { value: TaskStatus; label: string }[] = [
		{ value: 'pending', label: 'Ausstehend' },
		{ value: 'in_progress', label: 'In Bearbeitung' },
		{ value: 'completed', label: 'Abgeschlossen' },
		{ value: 'cancelled', label: 'Abgebrochen' },
	];

	// Recurrence options
	const recurrenceOptions = [
		{ value: '', label: 'Keine Wiederholung' },
		{ value: 'FREQ=DAILY', label: 'Täglich' },
		{ value: 'FREQ=WEEKLY', label: 'Wöchentlich' },
		{ value: 'FREQ=WEEKLY;INTERVAL=2', label: 'Alle 2 Wochen' },
		{ value: 'FREQ=MONTHLY', label: 'Monatlich' },
		{ value: 'FREQ=YEARLY', label: 'Jährlich' },
	];

	// Storypoints options (Fibonacci)
	const storyPointOptions = [1, 2, 3, 5, 8, 13, 21];

	// Quick duration options
	const durationOptions: { label: string; value: number; unit: DurationUnit }[] = [
		{ label: '15m', value: 15, unit: 'minutes' },
		{ label: '30m', value: 30, unit: 'minutes' },
		{ label: '1h', value: 1, unit: 'hours' },
		{ label: '2h', value: 2, unit: 'hours' },
		{ label: '4h', value: 4, unit: 'hours' },
		{ label: '1d', value: 1, unit: 'days' },
		{ label: '2d', value: 2, unit: 'days' },
	];

	// Duration unit options
	const durationUnitOptions: { value: DurationUnit; label: string }[] = [
		{ value: 'minutes', label: 'Minuten' },
		{ value: 'hours', label: 'Stunden' },
		{ value: 'days', label: 'Tage' },
	];

	// Fun rating color helper
	function getFunRatingColor(rating: number): string {
		if (rating <= 3) return '#ef4444'; // red
		if (rating <= 6) return '#eab308'; // yellow
		return '#22c55e'; // green
	}

	// Initialize form when task changes or modal opens
	$effect(() => {
		if (open && task) {
			title = task.title || '';
			description = task.description || '';
			dueDate = task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '';
			dueTime = task.dueTime || '';
			startDate = task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '';
			priority = task.priority || 'medium';
			status = task.status || 'pending';
			projectId = task.projectId || null;
			selectedLabelIds = task.labels?.map((l) => l.id) || [];
			subtasks = task.subtasks ? [...task.subtasks] : [];
			recurrenceRule = task.recurrenceRule || '';
			notes = task.metadata?.notes || '';
			// New metadata fields
			storyPoints = task.metadata?.storyPoints ?? null;
			if (task.metadata?.effectiveDuration) {
				effectiveDurationValue = task.metadata.effectiveDuration.value;
				effectiveDurationUnit = task.metadata.effectiveDuration.unit;
				// Check if it's a custom value not in quick options
				const isQuickOption = durationOptions.some(
					(opt) =>
						opt.value === task.metadata?.effectiveDuration?.value &&
						opt.unit === task.metadata?.effectiveDuration?.unit
				);
				showCustomDuration = !isQuickOption;
			} else {
				effectiveDurationValue = null;
				effectiveDurationUnit = 'hours';
				showCustomDuration = false;
			}
			funRating = task.metadata?.funRating ?? null;
			showDeleteConfirm = false;
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		} else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	async function handleSave() {
		if (!title.trim()) return;

		isLoading = true;
		try {
			// Build effective duration object
			let effectiveDuration: EffectiveDuration | null = null;
			if (effectiveDurationValue !== null && effectiveDurationValue > 0) {
				effectiveDuration = {
					value: effectiveDurationValue,
					unit: effectiveDurationUnit,
				};
			}

			const data: Partial<Task> = {
				title: title.trim(),
				description: description.trim() || null,
				dueDate: dueDate ? new Date(dueDate).toISOString() : null,
				dueTime: dueTime || null,
				startDate: startDate ? new Date(startDate).toISOString() : null,
				priority,
				status,
				projectId: projectId || null,
				subtasks: subtasks.length > 0 ? subtasks : null,
				recurrenceRule: recurrenceRule || null,
				metadata: {
					...task.metadata,
					notes: notes.trim() || undefined,
					storyPoints: storyPoints ?? undefined,
					effectiveDuration: effectiveDuration ?? undefined,
					funRating: funRating ?? undefined,
				},
			};

			// Include labelIds for the update
			(data as any).labelIds = selectedLabelIds;

			onSave(data);
		} finally {
			isLoading = false;
		}
	}

	function handleDelete() {
		if (showDeleteConfirm) {
			onDelete(task.id);
		} else {
			showDeleteConfirm = true;
		}
	}

	function toggleLabel(labelId: string) {
		if (selectedLabelIds.includes(labelId)) {
			selectedLabelIds = selectedLabelIds.filter((id) => id !== labelId);
		} else {
			selectedLabelIds = [...selectedLabelIds, labelId];
		}
	}

	function handleSubtasksChange(newSubtasks: Subtask[]) {
		subtasks = newSubtasks;
	}

	function selectQuickDuration(opt: { value: number; unit: DurationUnit }) {
		effectiveDurationValue = opt.value;
		effectiveDurationUnit = opt.unit;
		showCustomDuration = false;
	}

	function isQuickDurationSelected(opt: { value: number; unit: DurationUnit }): boolean {
		return (
			effectiveDurationValue === opt.value &&
			effectiveDurationUnit === opt.unit &&
			!showCustomDuration
		);
	}

	function clearDuration() {
		effectiveDurationValue = null;
		effectiveDurationUnit = 'hours';
		showCustomDuration = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="modal-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true">
		<div class="modal-container">
			<!-- Header -->
			<div class="modal-header">
				<h2 class="modal-title">Aufgabe bearbeiten</h2>
				<button type="button" class="close-btn" onclick={onClose} title="Schließen">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="modal-content">
				<!-- Titel -->
				<div class="form-section">
					<label class="form-label" for="task-title">Titel</label>
					<input
						id="task-title"
						type="text"
						class="form-input"
						bind:value={title}
						placeholder="Aufgabentitel..."
					/>
				</div>

				<!-- Beschreibung -->
				<div class="form-section">
					<label class="form-label" for="task-description">Beschreibung</label>
					<textarea
						id="task-description"
						class="form-textarea"
						bind:value={description}
						placeholder="Beschreibung hinzufügen..."
						rows="3"
					></textarea>
				</div>

				<!-- Zeitplanung -->
				<div class="form-section">
					<label class="form-label">Zeitplanung</label>
					<div class="form-row">
						<div class="form-field">
							<label class="form-sublabel" for="due-date">Fälligkeitsdatum</label>
							<input id="due-date" type="date" class="form-input-sm" bind:value={dueDate} />
						</div>
						<div class="form-field">
							<label class="form-sublabel" for="due-time">Uhrzeit</label>
							<input id="due-time" type="time" class="form-input-sm" bind:value={dueTime} />
						</div>
						<div class="form-field">
							<label class="form-sublabel" for="start-date">Startdatum</label>
							<input id="start-date" type="date" class="form-input-sm" bind:value={startDate} />
						</div>
					</div>
				</div>

				<!-- Priorität -->
				<div class="form-section">
					<label class="form-label">Priorität</label>
					<div class="priority-buttons">
						{#each priorities as p}
							<button
								type="button"
								class="priority-btn"
								class:selected={priority === p.value}
								style="--priority-color: {p.color}"
								onclick={() => (priority = p.value)}
							>
								<span class="priority-dot" style="background-color: {p.color}"></span>
								{p.label}
							</button>
						{/each}
					</div>
				</div>

				<!-- Status -->
				<div class="form-section">
					<label class="form-label" for="task-status">Status</label>
					<select id="task-status" class="form-select" bind:value={status}>
						{#each statuses as s}
							<option value={s.value}>{s.label}</option>
						{/each}
					</select>
				</div>

				<!-- Projekt -->
				<div class="form-section">
					<label class="form-label" for="task-project">Projekt</label>
					<select id="task-project" class="form-select" bind:value={projectId}>
						<option value={null}>Kein Projekt</option>
						{#each projectsStore.activeProjects as project}
							<option value={project.id}>
								{project.name}
							</option>
						{/each}
					</select>
				</div>

				<!-- Labels -->
				<div class="form-section">
					<label class="form-label">Labels</label>
					<div class="label-selector">
						<button
							type="button"
							class="label-trigger"
							onclick={() => (showLabelDropdown = !showLabelDropdown)}
						>
							{#if selectedLabelIds.length === 0}
								<span class="text-muted">Labels auswählen...</span>
							{:else}
								<div class="selected-labels">
									{#each selectedLabelIds.slice(0, 3) as labelId}
										{@const label = labelsStore.getById(labelId)}
										{#if label}
											<span class="label-tag" style="--label-color: {label.color}">
												{label.name}
											</span>
										{/if}
									{/each}
									{#if selectedLabelIds.length > 3}
										<span class="label-more">+{selectedLabelIds.length - 3}</span>
									{/if}
								</div>
							{/if}
							<svg class="dropdown-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>

						{#if showLabelDropdown}
							<div class="label-dropdown">
								{#each labelsStore.labels as label}
									<button
										type="button"
										class="label-option"
										class:selected={selectedLabelIds.includes(label.id)}
										onclick={() => toggleLabel(label.id)}
									>
										<span class="label-dot" style="background-color: {label.color}"></span>
										<span class="label-name">{label.name}</span>
										{#if selectedLabelIds.includes(label.id)}
											<svg class="check-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										{/if}
									</button>
								{/each}
								{#if labelsStore.labels.length === 0}
									<div class="no-labels">Keine Labels vorhanden</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Subtasks -->
				<div class="form-section">
					<label class="form-label">Subtasks</label>
					<SubtaskList {subtasks} onChange={handleSubtasksChange} />
				</div>

				<!-- Wiederholung -->
				<div class="form-section">
					<label class="form-label" for="task-recurrence">Wiederholung</label>
					<select id="task-recurrence" class="form-select" bind:value={recurrenceRule}>
						{#each recurrenceOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<!-- Notizen -->
				<div class="form-section">
					<label class="form-label" for="task-notes">Notizen</label>
					<textarea
						id="task-notes"
						class="form-textarea"
						bind:value={notes}
						placeholder="Zusätzliche Notizen..."
						rows="3"
					></textarea>
				</div>

				<!-- Storypoints -->
				<div class="form-section">
					<label class="form-label">Storypoints</label>
					<div class="storypoint-buttons">
						{#each storyPointOptions as sp}
							<button
								type="button"
								class="storypoint-btn"
								class:selected={storyPoints === sp}
								onclick={() => (storyPoints = storyPoints === sp ? null : sp)}
							>
								{sp}
							</button>
						{/each}
						{#if storyPoints !== null}
							<button
								type="button"
								class="storypoint-clear"
								onclick={() => (storyPoints = null)}
								title="Zurücksetzen"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						{/if}
					</div>
				</div>

				<!-- Effektive Dauer -->
				<div class="form-section">
					<label class="form-label">Effektive Dauer</label>
					<div class="duration-buttons">
						{#each durationOptions as opt}
							<button
								type="button"
								class="duration-btn"
								class:selected={isQuickDurationSelected(opt)}
								onclick={() => selectQuickDuration(opt)}
							>
								{opt.label}
							</button>
						{/each}
						<button
							type="button"
							class="duration-btn"
							class:selected={showCustomDuration}
							onclick={() => (showCustomDuration = !showCustomDuration)}
						>
							...
						</button>
						{#if effectiveDurationValue !== null}
							<button
								type="button"
								class="duration-clear"
								onclick={clearDuration}
								title="Zurücksetzen"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						{/if}
					</div>
					{#if showCustomDuration}
						<div class="duration-custom">
							<input
								type="number"
								class="form-input-sm duration-input"
								bind:value={effectiveDurationValue}
								placeholder="Wert"
								min="1"
							/>
							<select class="form-select duration-unit" bind:value={effectiveDurationUnit}>
								{#each durationUnitOptions as unit}
									<option value={unit.value}>{unit.label}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>

				<!-- Spaß-Faktor -->
				<div class="form-section">
					<label class="form-label">
						Spaß-Faktor{#if funRating !== null}: <span
								class="fun-rating-value"
								style="color: {getFunRatingColor(funRating)}">{funRating}</span
							>{/if}
					</label>
					<div class="fun-rating">
						{#each Array(10) as _, i}
							{@const rating = i + 1}
							<button
								type="button"
								class="fun-rating-dot"
								class:filled={funRating !== null && rating <= funRating}
								style="--dot-color: {getFunRatingColor(rating)}"
								onclick={() => (funRating = funRating === rating ? null : rating)}
								title={rating}
							>
								<span class="dot"></span>
							</button>
						{/each}
						{#if funRating !== null}
							<button
								type="button"
								class="fun-rating-clear"
								onclick={() => (funRating = null)}
								title="Zurücksetzen"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						{/if}
					</div>
					<div class="fun-rating-labels">
						<span>1</span>
						<span>5</span>
						<span>10</span>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				<button type="button" class="btn btn-danger" onclick={handleDelete} disabled={isLoading}>
					{showDeleteConfirm ? 'Wirklich löschen?' : 'Löschen'}
				</button>
				<div class="footer-right">
					<button type="button" class="btn btn-secondary" onclick={onClose} disabled={isLoading}>
						Abbrechen
					</button>
					<button
						type="button"
						class="btn btn-primary"
						onclick={handleSave}
						disabled={isLoading || !title.trim()}
					>
						{#if isLoading}
							<div class="spinner"></div>
						{:else}
							Speichern
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		padding: 4rem 2rem;
	}

	.modal-container {
		width: 100%;
		max-width: 600px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	:global(.dark) .modal-container {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	/* Mobile: Full screen from bottom, above QuickAdd bar */
	@media (max-width: 640px) {
		.modal-backdrop {
			align-items: flex-end;
			padding: 0;
			/* QuickAdd is at bottom: 70px + ~60px height = 130px, plus PillNav */
			padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 140px);
		}

		.modal-container {
			max-width: 100%;
			max-height: calc(100vh - 160px); /* Account for QuickAdd + PillNav */
			border-radius: 1.5rem 1.5rem 0 0;
		}
	}

	/* Header */
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .modal-header {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
	}

	:global(.dark) .modal-title {
		color: #f3f4f6;
	}

	.close-btn {
		padding: 0.5rem;
		border: none;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		border-radius: 0.5rem;
		transition: all 0.15s;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark) .close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
	}

	/* Content */
	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* Form sections */
	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	:global(.dark) .form-label {
		color: #e5e7eb;
	}

	.form-sublabel {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	@media (max-width: 480px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.form-input,
	.form-textarea,
	.form-select,
	.form-input-sm {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.8);
		font-size: 0.875rem;
		color: #374151;
		transition: all 0.15s;
	}

	:global(.dark) .form-input,
	:global(.dark) .form-textarea,
	:global(.dark) .form-select,
	:global(.dark) .form-input-sm {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	.form-input:focus,
	.form-textarea:focus,
	.form-select:focus,
	.form-input-sm:focus {
		outline: none;
		border-color: #8b5cf6;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
	}

	.form-input-sm {
		padding: 0.5rem 0.75rem;
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
	}

	/* Priority buttons */
	.priority-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.priority-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.8);
		font-size: 0.8125rem;
		color: #374151;
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .priority-btn {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
		color: #e5e7eb;
	}

	.priority-btn:hover {
		border-color: var(--priority-color);
	}

	.priority-btn.selected {
		background: color-mix(in srgb, var(--priority-color) 15%, transparent);
		border-color: var(--priority-color);
		color: var(--priority-color);
	}

	.priority-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
	}

	/* Label selector */
	.label-selector {
		position: relative;
	}

	.label-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.875rem;
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .label-trigger {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.label-trigger:hover {
		border-color: rgba(0, 0, 0, 0.25);
	}

	.text-muted {
		color: #9ca3af;
		font-size: 0.875rem;
	}

	.selected-labels {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.label-tag {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--label-color) 15%, transparent);
		color: var(--label-color);
		font-weight: 500;
	}

	.label-more {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.dropdown-arrow {
		width: 1rem;
		height: 1rem;
		color: #9ca3af;
	}

	.label-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		max-height: 200px;
		overflow-y: auto;
		padding: 0.375rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		z-index: 10;
	}

	:global(.dark) .label-dropdown {
		background: rgba(40, 40, 40, 0.95);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.label-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.15s;
		text-align: left;
	}

	.label-option:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .label-option:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.label-option.selected {
		background: rgba(139, 92, 246, 0.1);
	}

	.label-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.label-name {
		flex: 1;
		font-size: 0.875rem;
		color: #374151;
	}

	:global(.dark) .label-name {
		color: #e5e7eb;
	}

	.check-icon {
		width: 1rem;
		height: 1rem;
		color: #8b5cf6;
	}

	.no-labels {
		padding: 0.75rem;
		text-align: center;
		font-size: 0.875rem;
		color: #9ca3af;
	}

	/* Footer */
	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .modal-footer {
		border-top-color: rgba(255, 255, 255, 0.1);
	}

	.footer-right {
		display: flex;
		gap: 0.75rem;
	}

	/* Buttons */
	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border: none;
		border-radius: 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #8b5cf6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #7c3aed;
	}

	.btn-secondary {
		background: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark) .btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn-danger {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.btn-danger:hover:not(:disabled) {
		background: #ef4444;
		color: white;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top-color: white;
		border-radius: 9999px;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Storypoints */
	.storypoint-buttons {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.storypoint-btn {
		min-width: 2.25rem;
		height: 2.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.5rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.8);
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .storypoint-btn {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
		color: #e5e7eb;
	}

	.storypoint-btn:hover {
		border-color: #8b5cf6;
	}

	.storypoint-btn.selected {
		background: rgba(139, 92, 246, 0.15);
		border-color: #8b5cf6;
		color: #8b5cf6;
	}

	.storypoint-clear,
	.duration-clear,
	.fun-rating-clear {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		border-radius: 9999px;
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		cursor: pointer;
		transition: all 0.15s;
	}

	.storypoint-clear:hover,
	.duration-clear:hover,
	.fun-rating-clear:hover {
		background: rgba(239, 68, 68, 0.2);
	}

	/* Duration */
	.duration-buttons {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.duration-btn {
		padding: 0.5rem 0.75rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.8);
		font-size: 0.8125rem;
		color: #374151;
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .duration-btn {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
		color: #e5e7eb;
	}

	.duration-btn:hover {
		border-color: #8b5cf6;
	}

	.duration-btn.selected {
		background: rgba(139, 92, 246, 0.15);
		border-color: #8b5cf6;
		color: #8b5cf6;
	}

	.duration-custom {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.duration-input {
		width: 80px;
	}

	.duration-unit {
		width: 120px;
	}

	/* Fun Rating */
	.fun-rating {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.fun-rating-dot {
		padding: 0.25rem;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: transform 0.15s;
	}

	.fun-rating-dot:hover {
		transform: scale(1.2);
	}

	.fun-rating-dot .dot {
		display: block;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 9999px;
		background: rgba(0, 0, 0, 0.1);
		transition: all 0.15s;
	}

	:global(.dark) .fun-rating-dot .dot {
		background: rgba(255, 255, 255, 0.15);
	}

	.fun-rating-dot.filled .dot {
		background: var(--dot-color);
	}

	.fun-rating-labels {
		display: flex;
		justify-content: space-between;
		padding: 0 0.25rem;
		margin-top: 0.25rem;
		font-size: 0.6875rem;
		color: #9ca3af;
	}

	.fun-rating-value {
		font-weight: 600;
	}
</style>
