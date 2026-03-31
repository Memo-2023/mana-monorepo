<script lang="ts">
	import type { Task, Subtask, UpdateTaskInput } from '@todo/shared';
	import { STATUS_OPTIONS, RECURRENCE_OPTIONS } from '@todo/shared';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { useTaskForm } from '$lib/composables/useTaskForm.svelte';
	import SubtaskList from './SubtaskList.svelte';
	import {
		PrioritySelector,
		StorypointsSelector,
		DurationPicker,
		FunRatingPicker,
		TagSelector,
	} from './form';
	import { ContactSelector, focusTrap } from '@manacore/shared-ui';
	import { ManaLinkList, ManaLinkPicker } from '@manacore/shared-links/ui';
	import { searchCrossApp } from '$lib/data/cross-app-search';
	import { X } from '@manacore/shared-icons';

	interface Props {
		task: Task;
		open: boolean;
		onClose: () => void;
		onSave: (data: UpdateTaskInput) => void;
		onDelete: (taskId: string) => void;
	}

	let { task, open, onClose, onSave, onDelete }: Props = $props();

	const form = useTaskForm();

	// Link picker state
	let showLinkPicker = $state(false);

	// Initialize form when task changes or modal opens
	$effect(() => {
		if (open && task) {
			form.initFromTask(task);
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
		if (!form.title.trim()) return;

		form.isLoading = true;
		try {
			onSave(form.buildUpdateInput(task));
		} finally {
			form.isLoading = false;
		}
	}

	function handleDelete() {
		if (form.showDeleteConfirm) {
			onDelete(task.id);
		} else {
			form.showDeleteConfirm = true;
		}
	}

	function handleSubtasksChange(newSubtasks: Subtask[]) {
		form.subtasks = newSubtasks;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		use:focusTrap
	>
		<div class="modal-container">
			<!-- Header -->
			<div class="modal-header">
				<h2 class="modal-title">Aufgabe bearbeiten</h2>
				<button type="button" class="close-btn" onclick={onClose} title="Schließen">
					<X size={20} />
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
						bind:value={form.title}
						placeholder="Aufgabentitel..."
					/>
				</div>

				<!-- Beschreibung -->
				<div class="form-section">
					<label class="form-label" for="task-description">Beschreibung</label>
					<textarea
						id="task-description"
						class="form-textarea"
						bind:value={form.description}
						placeholder="Beschreibung hinzufügen..."
						rows="3"
					></textarea>
				</div>

				<!-- Zuständige Person -->
				<div class="form-section">
					<label class="form-label">Zuständig</label>
					<ContactSelector
						selectedContacts={form.assignee}
						onContactsChange={(contacts) => (form.assignee = contacts)}
						onSearch={(q) => contactsStore.searchContacts(q)}
						singleSelect={true}
						allowManualEntry={false}
						placeholder="Person zuweisen..."
						addLabel="Zuweisen"
						searchPlaceholder="Name oder E-Mail..."
						isAvailable={form.contactsAvailable ?? false}
					/>
				</div>

				<!-- Beteiligte Personen -->
				<div class="form-section">
					<label class="form-label">Beteiligte</label>
					<ContactSelector
						selectedContacts={form.involvedContacts}
						onContactsChange={(contacts) => (form.involvedContacts = contacts)}
						onSearch={(q) => contactsStore.searchContacts(q)}
						allowManualEntry={false}
						placeholder="Personen hinzufügen..."
						addLabel="Person hinzufügen"
						searchPlaceholder="Name oder E-Mail..."
						isAvailable={form.contactsAvailable ?? false}
					/>
				</div>

				<!-- Zeitplanung -->
				<div class="form-section">
					<label class="form-label">Zeitplanung</label>
					<div class="form-row">
						<div class="form-field">
							<label class="form-sublabel" for="due-date">Fälligkeitsdatum</label>
							<input id="due-date" type="date" class="form-input-sm" bind:value={form.dueDate} />
						</div>
						<div class="form-field">
							<label class="form-sublabel" for="due-time">Uhrzeit</label>
							<input id="due-time" type="time" class="form-input-sm" bind:value={form.dueTime} />
						</div>
						<div class="form-field">
							<label class="form-sublabel" for="start-date">Startdatum</label>
							<input
								id="start-date"
								type="date"
								class="form-input-sm"
								bind:value={form.startDate}
							/>
						</div>
					</div>
				</div>

				<!-- Priorität -->
				<div class="form-section">
					<label class="form-label">Priorität</label>
					<PrioritySelector value={form.priority} onChange={(p) => (form.priority = p)} />
				</div>

				<!-- Status -->
				<div class="form-section">
					<label class="form-label" for="task-status">Status</label>
					<select id="task-status" class="form-select" bind:value={form.status}>
						{#each STATUS_OPTIONS as s}
							<option value={s.value}>{s.label}</option>
						{/each}
					</select>
				</div>

				<!-- Tags -->
				<div class="form-section">
					<label class="form-label">Tags</label>
					<TagSelector
						selectedIds={form.selectedLabelIds}
						onChange={(ids) => (form.selectedLabelIds = ids)}
					/>
				</div>

				<!-- Subtasks -->
				<div class="form-section">
					<label class="form-label">Subtasks</label>
					<SubtaskList subtasks={form.subtasks} onChange={handleSubtasksChange} />
				</div>

				<!-- Verknüpfungen -->
				<div class="form-section">
					<div class="flex items-center justify-between">
						<label class="form-label">Verknüpfungen</label>
						<button
							type="button"
							class="text-xs text-primary hover:underline"
							onclick={() => (showLinkPicker = true)}
						>
							+ Verknüpfen
						</button>
					</div>
					<ManaLinkList recordRef={{ app: 'todo', collection: 'tasks', id: task.id }} editable />
				</div>

				<ManaLinkPicker
					sourceRef={{ app: 'todo', collection: 'tasks', id: task.id }}
					sourceTitle={form.title || task.title}
					open={showLinkPicker}
					onClose={() => (showLinkPicker = false)}
					onSearch={searchCrossApp}
				/>

				<!-- Wiederholung -->
				<div class="form-section">
					<label class="form-label" for="task-recurrence">Wiederholung</label>
					<select id="task-recurrence" class="form-select" bind:value={form.recurrenceRule}>
						{#each RECURRENCE_OPTIONS as option}
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
						bind:value={form.notes}
						placeholder="Zusätzliche Notizen..."
						rows="3"
					></textarea>
				</div>

				<!-- Storypoints -->
				<div class="form-section">
					<label class="form-label">Storypoints</label>
					<StorypointsSelector value={form.storyPoints} onChange={(v) => (form.storyPoints = v)} />
				</div>

				<!-- Effektive Dauer -->
				<div class="form-section">
					<label class="form-label">Effektive Dauer</label>
					<DurationPicker
						value={form.effectiveDuration}
						onChange={(v) => (form.effectiveDuration = v)}
					/>
				</div>

				<!-- Spaß-Faktor -->
				<div class="form-section">
					<label class="form-label">
						Spaß-Faktor{#if form.funRating !== null}: <span class="fun-rating-value"
								>{form.funRating}</span
							>{/if}
					</label>
					<FunRatingPicker value={form.funRating} onChange={(v) => (form.funRating = v)} />
				</div>
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				<button
					type="button"
					class="btn btn-danger"
					onclick={handleDelete}
					disabled={form.isLoading}
				>
					{form.showDeleteConfirm ? 'Wirklich löschen?' : 'Löschen'}
				</button>
				<div class="footer-right">
					<button
						type="button"
						class="btn btn-secondary"
						onclick={onClose}
						disabled={form.isLoading}
					>
						Abbrechen
					</button>
					<button
						type="button"
						class="btn btn-primary"
						onclick={handleSave}
						disabled={form.isLoading || !form.title.trim()}
					>
						{#if form.isLoading}
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
		z-index: 9995;
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

	/* Mobile: Full screen from bottom, modal covers all UI elements */
	@media (max-width: 640px) {
		.modal-backdrop {
			align-items: flex-end;
			padding: 0;
		}

		.modal-container {
			max-width: 100%;
			max-height: calc(100vh - 60px - env(safe-area-inset-top, 0px));
			border-radius: 1.5rem 1.5rem 0 0;
			margin-bottom: env(safe-area-inset-bottom, 0px);
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

	.fun-rating-value {
		font-weight: 600;
	}
</style>
