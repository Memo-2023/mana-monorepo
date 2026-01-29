<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
	import type { Task, UpdateTaskInput, TaskPriority } from '$lib/api/todos';
	import { PRIORITY_LABELS, PRIORITY_COLORS } from '$lib/api/todos';
	import { toast } from '$lib/stores/toast.svelte';
	import TodoCheckbox from './TodoCheckbox.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import {
		X,
		Calendar,
		Clock,
		Folder,
		Tag,
		Trash,
		CheckSquare,
		WarningCircle,
		CalendarCheck,
		Timer,
	} from '@manacore/shared-icons';
	import { format, parseISO } from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		task: Task;
		onClose: () => void;
	}

	let { task: initialTask, onClose }: Props = $props();

	// Local editable state
	let task = $state<Task>({ ...initialTask });
	let isEditing = $state(false);
	let isSaving = $state(false);
	let isDeleting = $state(false);
	let isToggling = $state(false);

	// Form state - initialized with derived values
	let title = $state(initialTask.title);
	let description = $state(initialTask.description || '');
	let dueDate = $state(initialTask.dueDate ? formatDateForInput(initialTask.dueDate) : '');
	let dueTime = $state(initialTask.dueTime || '');
	let priority = $state<TaskPriority>(initialTask.priority);

	// Time-Blocking fields
	let scheduledDate = $state(
		initialTask.scheduledDate ? formatDateForInput(initialTask.scheduledDate) : ''
	);
	let scheduledStartTime = $state(initialTask.scheduledStartTime || '');
	let scheduledEndTime = $state(initialTask.scheduledEndTime || '');
	let estimatedDuration = $state(initialTask.estimatedDuration?.toString() || '');

	// Sync form state when task changes
	$effect(() => {
		title = task.title;
		description = task.description || '';
		dueDate = task.dueDate ? formatDateForInput(task.dueDate) : '';
		dueTime = task.dueTime || '';
		priority = task.priority;
		// Time-Blocking
		scheduledDate = task.scheduledDate ? formatDateForInput(task.scheduledDate) : '';
		scheduledStartTime = task.scheduledStartTime || '';
		scheduledEndTime = task.scheduledEndTime || '';
		estimatedDuration = task.estimatedDuration?.toString() || '';
	});

	function formatDateForInput(date: string | Date | null | undefined): string {
		if (!date) return '';
		const d = typeof date === 'string' ? parseISO(date) : date;
		return format(d, 'yyyy-MM-dd');
	}

	function formatDisplayDate(date: string | Date | null | undefined): string {
		if (!date) return 'Kein Datum';
		const d = typeof date === 'string' ? parseISO(date) : date;
		return format(d, 'EEEE, d. MMMM yyyy', { locale: de });
	}

	async function handleToggleComplete() {
		isToggling = true;
		const result = await todosStore.toggleComplete(task.id);
		if (result.data) {
			task = result.data;
		} else if (result.error) {
			toast.error(`Fehler: ${result.error.message}`);
		}
		isToggling = false;
	}

	async function handleSave() {
		if (!title.trim()) {
			toast.error('Titel darf nicht leer sein');
			return;
		}

		isSaving = true;

		const updateData: UpdateTaskInput = {
			title: title.trim(),
			description: description.trim() || null,
			dueDate: dueDate || null,
			dueTime: dueTime || null,
			priority,
			// Time-Blocking
			scheduledDate: scheduledDate || null,
			scheduledStartTime: scheduledStartTime || null,
			scheduledEndTime: scheduledEndTime || null,
			estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
		};

		const result = await todosStore.updateTodo(task.id, updateData);

		if (result.error) {
			toast.error(`Fehler beim Speichern: ${result.error.message}`);
		} else if (result.data) {
			task = result.data;
			toast.success('Aufgabe aktualisiert');
			isEditing = false;
		}

		isSaving = false;
	}

	async function handleDelete() {
		if (!confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
			return;
		}

		isDeleting = true;
		const result = await todosStore.deleteTodo(task.id);

		if (result.error) {
			toast.error(`Fehler beim Löschen: ${result.error.message}`);
			isDeleting = false;
		} else {
			toast.success('Aufgabe gelöscht');
			onClose();
		}
	}

	function startEditing() {
		// Reset form state to current task values
		title = task.title;
		description = task.description || '';
		dueDate = task.dueDate ? formatDateForInput(task.dueDate) : '';
		dueTime = task.dueTime || '';
		priority = task.priority;
		// Time-Blocking
		scheduledDate = task.scheduledDate ? formatDateForInput(task.scheduledDate) : '';
		scheduledStartTime = task.scheduledStartTime || '';
		scheduledEndTime = task.scheduledEndTime || '';
		estimatedDuration = task.estimatedDuration?.toString() || '';
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (isEditing) {
				cancelEditing();
			} else {
				onClose();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
	<div class="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
		<!-- Header -->
		<div class="modal-header">
			<div class="header-left">
				<TodoCheckbox
					checked={task.isCompleted}
					loading={isToggling}
					size="lg"
					onchange={handleToggleComplete}
				/>
				{#if !isEditing}
					<h2 id="modal-title" class="modal-title" class:completed={task.isCompleted}>
						{task.title}
					</h2>
				{/if}
			</div>
			<button type="button" class="close-button" onclick={onClose} aria-label="Schließen">
				<X size={20} />
			</button>
		</div>

		<!-- Content -->
		<div class="modal-content">
			{#if isEditing}
				<!-- Edit Mode -->
				<form
					class="edit-form"
					onsubmit={(e) => {
						e.preventDefault();
						handleSave();
					}}
				>
					<div class="form-group">
						<label for="title">Titel</label>
						<input id="title" type="text" bind:value={title} placeholder="Aufgabentitel" required />
					</div>

					<div class="form-group">
						<label for="description">Beschreibung</label>
						<textarea
							id="description"
							bind:value={description}
							placeholder="Beschreibung hinzufügen..."
							rows="3"
						></textarea>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="dueDate">Fälligkeitsdatum</label>
							<input id="dueDate" type="date" bind:value={dueDate} />
						</div>

						<div class="form-group">
							<label for="dueTime">Uhrzeit</label>
							<input id="dueTime" type="time" bind:value={dueTime} />
						</div>
					</div>

					<!-- Time-Blocking Section -->
					<div class="form-section">
						<span class="section-label">
							<CalendarCheck size={16} />
							Zeitplanung (Time-Blocking)
						</span>
						<div class="form-row">
							<div class="form-group">
								<label for="scheduledDate">Geplantes Datum</label>
								<input id="scheduledDate" type="date" bind:value={scheduledDate} />
							</div>
							<div class="form-group">
								<label for="estimatedDuration">Dauer (Min.)</label>
								<input
									id="estimatedDuration"
									type="number"
									min="5"
									max="480"
									step="5"
									bind:value={estimatedDuration}
									placeholder="30"
								/>
							</div>
						</div>
						<div class="form-row">
							<div class="form-group">
								<label for="scheduledStartTime">Startzeit</label>
								<input id="scheduledStartTime" type="time" bind:value={scheduledStartTime} />
							</div>
							<div class="form-group">
								<label for="scheduledEndTime">Endzeit</label>
								<input id="scheduledEndTime" type="time" bind:value={scheduledEndTime} />
							</div>
						</div>
					</div>

					<div class="form-group">
						<span class="label-text">Priorität</span>
						<div class="priority-options">
							{#each Object.entries(PRIORITY_LABELS) as [key, label]}
								<button
									type="button"
									class="priority-option"
									class:selected={priority === key}
									style="--priority-color: {PRIORITY_COLORS[key as TaskPriority]};"
									onclick={() => (priority = key as TaskPriority)}
								>
									<span class="priority-dot"></span>
									{label}
								</button>
							{/each}
						</div>
					</div>
				</form>
			{:else}
				<!-- View Mode -->
				<div class="detail-section">
					{#if task.description}
						<p class="description">{task.description}</p>
					{/if}

					<div class="detail-list">
						<div class="detail-item">
							<Calendar size={16} />
							<span>{formatDisplayDate(task.dueDate)}</span>
						</div>

						{#if task.dueTime}
							<div class="detail-item">
								<Clock size={16} />
								<span>{task.dueTime} Uhr</span>
							</div>
						{/if}

						<!-- Time-Blocking Display -->
						{#if task.scheduledDate}
							<div class="detail-item scheduled">
								<CalendarCheck size={16} />
								<span>
									Geplant: {formatDisplayDate(task.scheduledDate)}
									{#if task.scheduledStartTime}
										um {task.scheduledStartTime}
										{#if task.scheduledEndTime}
											- {task.scheduledEndTime}
										{/if}
									{/if}
								</span>
							</div>
						{/if}

						{#if task.estimatedDuration}
							<div class="detail-item">
								<Timer size={16} />
								<span>Geschätzte Dauer: {task.estimatedDuration} Min.</span>
							</div>
						{/if}

						<div class="detail-item">
							<WarningCircle size={16} />
							<PriorityBadge {priority} variant="pill" showLabel />
						</div>

						{#if task.project}
							<div class="detail-item">
								<Folder size={16} />
								<span class="project-name" style="color: {task.project.color};">
									{task.project.name}
								</span>
							</div>
						{/if}

						{#if task.labels && task.labels.length > 0}
							<div class="detail-item labels-row">
								<Tag size={16} />
								<div class="labels">
									{#each task.labels as label}
										<span class="label-tag" style="--label-color: {label.color};">
											{label.name}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					{#if task.subtasks && task.subtasks.length > 0}
						<div class="subtasks-section">
							<h3>
								<CheckSquare size={16} />
								Unteraufgaben ({task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks
									.length})
							</h3>
							<ul class="subtask-list">
								{#each task.subtasks as subtask}
									<li class:completed={subtask.isCompleted}>
										<span class="subtask-check">{subtask.isCompleted ? '☑' : '☐'}</span>
										{subtask.title}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="modal-footer">
			{#if isEditing}
				<button type="button" class="btn btn-secondary" onclick={cancelEditing} disabled={isSaving}>
					Abbrechen
				</button>
				<button type="button" class="btn btn-primary" onclick={handleSave} disabled={isSaving}>
					{#if isSaving}
						Speichern...
					{:else}
						Speichern
					{/if}
				</button>
			{:else}
				<button type="button" class="btn btn-danger" onclick={handleDelete} disabled={isDeleting}>
					<Trash size={16} />
					{#if isDeleting}
						Löschen...
					{:else}
						Löschen
					{/if}
				</button>
				<button type="button" class="btn btn-primary" onclick={startEditing}> Bearbeiten </button>
			{/if}
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal {
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		background: hsl(var(--color-background));
		border-radius: var(--radius-lg);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.modal-title.completed {
		text-decoration: line-through;
		color: hsl(var(--color-muted-foreground));
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-md);
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 150ms ease;
	}

	.close-button:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.25rem;
	}

	/* View Mode */
	.description {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.6;
		margin: 0 0 1rem;
		white-space: pre-wrap;
	}

	.detail-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.detail-item :global(svg) {
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.detail-item.scheduled {
		background: hsl(var(--color-primary) / 0.1);
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md);
		border-left: 3px solid hsl(var(--color-primary));
	}

	.detail-item.scheduled :global(svg) {
		color: hsl(var(--color-primary));
	}

	.labels-row {
		align-items: flex-start;
	}

	.labels {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.label-tag {
		font-size: 0.75rem;
		color: var(--label-color);
		background: color-mix(in srgb, var(--label-color) 15%, transparent);
		padding: 2px 8px;
		border-radius: 9999px;
	}

	.subtasks-section {
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.subtasks-section h3 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 0.75rem;
	}

	.subtask-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.subtask-list li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}

	.subtask-list li.completed {
		color: hsl(var(--color-muted-foreground));
		text-decoration: line-through;
	}

	.subtask-check {
		font-size: 0.875rem;
	}

	/* Edit Mode */
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-group label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-md);
		border: 1px solid hsl(var(--color-border) / 0.5);
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		color: hsl(var(--color-muted-foreground));
	}

	.section-label :global(svg) {
		color: hsl(var(--color-primary));
	}

	input[type='text'],
	input[type='date'],
	input[type='time'],
	input[type='number'],
	textarea {
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		transition: border-color 150ms ease;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	textarea {
		resize: vertical;
		min-height: 80px;
	}

	.label-text {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.priority-options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.priority-option {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-md);
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.priority-option:hover {
		border-color: var(--priority-color);
	}

	.priority-option.selected {
		border-color: var(--priority-color);
		background: color-mix(in srgb, var(--priority-color) 15%, transparent);
	}

	.priority-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--priority-color);
	}

	/* Footer */
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-md);
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.btn-primary:hover:not(:disabled) {
		background: hsl(var(--color-primary) / 0.9);
	}

	.btn-secondary {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.btn-secondary:hover:not(:disabled) {
		background: hsl(var(--color-muted) / 0.8);
	}

	.btn-danger {
		background: hsl(var(--color-danger) / 0.1);
		color: hsl(var(--color-danger));
	}

	.btn-danger:hover:not(:disabled) {
		background: hsl(var(--color-danger));
		color: white;
	}
</style>
