<script lang="ts">
	import type {
		Task,
		Subtask,
		TaskPriority,
		TaskStatus,
		EffectiveDuration,
		UpdateTaskInput,
	} from '@todo/shared';
	import type { ContactReference, ContactOrManual } from '@manacore/shared-types';
	import { STATUS_OPTIONS, RECURRENCE_OPTIONS } from '@todo/shared';
	import { getContext } from 'svelte';
	import type { Project } from '@todo/shared';
	import { getActiveProjects } from '$lib/data/task-queries';

	const projectsCtx: { readonly value: Project[] } = getContext('projects');
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { format } from 'date-fns';
	import SubtaskList from './SubtaskList.svelte';
	import {
		PrioritySelector,
		StorypointsSelector,
		DurationPicker,
		FunRatingPicker,
		TagSelector,
	} from './form';
	import { ContactSelector, focusTrap } from '@manacore/shared-ui';
	import { ManaLinkList } from '@manacore/shared-links/ui';

	interface Props {
		task: Task;
		open: boolean;
		onClose: () => void;
		onSave: (data: UpdateTaskInput) => void;
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
	let effectiveDuration = $state<EffectiveDuration | null>(null);
	let funRating = $state<number | null>(null);
	// Contact associations
	let assignee = $state<ContactOrManual[]>([]);
	let involvedContacts = $state<ContactOrManual[]>([]);
	let contactsAvailable = $state<boolean | null>(null);

	// UI state
	let isLoading = $state(false);
	let showDeleteConfirm = $state(false);

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
			// Metadata fields
			storyPoints = task.metadata?.storyPoints ?? null;
			effectiveDuration = task.metadata?.effectiveDuration ?? null;
			funRating = task.metadata?.funRating ?? null;
			// Contact associations
			assignee = task.metadata?.assignee ? [task.metadata.assignee] : [];
			involvedContacts = task.metadata?.involvedContacts || [];
			showDeleteConfirm = false;

			// Check contacts availability
			contactsStore.checkAvailability().then((available) => {
				contactsAvailable = available;
			});
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

	// Extract ContactReference from ContactOrManual (filter out manual entries for now)
	function toContactReference(contact: ContactOrManual): ContactReference | null {
		if ('isManual' in contact && contact.isManual) {
			return null; // Manual entries not stored as contacts
		}
		return contact as ContactReference;
	}

	async function handleSave() {
		if (!title.trim()) return;

		isLoading = true;
		try {
			// Convert assignee array to single ContactReference
			const assigneeRef = assignee.length > 0 ? toContactReference(assignee[0]) : null;
			// Convert involved contacts to array of ContactReferences
			const involvedRefs = involvedContacts
				.map(toContactReference)
				.filter((c): c is ContactReference => c !== null);

			const data: UpdateTaskInput = {
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
					assignee: assigneeRef ?? undefined,
					involvedContacts: involvedRefs.length > 0 ? involvedRefs : undefined,
				},
				labelIds: selectedLabelIds,
			};

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

	function handleSubtasksChange(newSubtasks: Subtask[]) {
		subtasks = newSubtasks;
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

				<!-- Zuständige Person -->
				<div class="form-section">
					<label class="form-label">Zuständig</label>
					<ContactSelector
						selectedContacts={assignee}
						onContactsChange={(contacts) => (assignee = contacts)}
						onSearch={(q) => contactsStore.searchContacts(q)}
						singleSelect={true}
						allowManualEntry={false}
						placeholder="Person zuweisen..."
						addLabel="Zuweisen"
						searchPlaceholder="Name oder E-Mail..."
						isAvailable={contactsAvailable ?? false}
					/>
				</div>

				<!-- Beteiligte Personen -->
				<div class="form-section">
					<label class="form-label">Beteiligte</label>
					<ContactSelector
						selectedContacts={involvedContacts}
						onContactsChange={(contacts) => (involvedContacts = contacts)}
						onSearch={(q) => contactsStore.searchContacts(q)}
						allowManualEntry={false}
						placeholder="Personen hinzufügen..."
						addLabel="Person hinzufügen"
						searchPlaceholder="Name oder E-Mail..."
						isAvailable={contactsAvailable ?? false}
					/>
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
					<PrioritySelector value={priority} onChange={(p) => (priority = p)} />
				</div>

				<!-- Status -->
				<div class="form-section">
					<label class="form-label" for="task-status">Status</label>
					<select id="task-status" class="form-select" bind:value={status}>
						{#each STATUS_OPTIONS as s}
							<option value={s.value}>{s.label}</option>
						{/each}
					</select>
				</div>

				<!-- Projekt -->
				<div class="form-section">
					<label class="form-label" for="task-project">Projekt</label>
					<select id="task-project" class="form-select" bind:value={projectId}>
						<option value={null}>Kein Projekt</option>
						{#each getActiveProjects(projectsCtx.value) as project}
							<option value={project.id}>
								{project.name}
							</option>
						{/each}
					</select>
				</div>

				<!-- Tags -->
				<div class="form-section">
					<label class="form-label">Tags</label>
					<TagSelector
						selectedIds={selectedLabelIds}
						onChange={(ids) => (selectedLabelIds = ids)}
					/>
				</div>

				<!-- Subtasks -->
				<div class="form-section">
					<label class="form-label">Subtasks</label>
					<SubtaskList {subtasks} onChange={handleSubtasksChange} />
				</div>

				<!-- Verknüpfungen -->
				<div class="form-section">
					<label class="form-label">Verknüpfungen</label>
					<ManaLinkList recordRef={{ app: 'todo', collection: 'tasks', id: task.id }} editable />
				</div>

				<!-- Wiederholung -->
				<div class="form-section">
					<label class="form-label" for="task-recurrence">Wiederholung</label>
					<select id="task-recurrence" class="form-select" bind:value={recurrenceRule}>
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
						bind:value={notes}
						placeholder="Zusätzliche Notizen..."
						rows="3"
					></textarea>
				</div>

				<!-- Storypoints -->
				<div class="form-section">
					<label class="form-label">Storypoints</label>
					<StorypointsSelector value={storyPoints} onChange={(v) => (storyPoints = v)} />
				</div>

				<!-- Effektive Dauer -->
				<div class="form-section">
					<label class="form-label">Effektive Dauer</label>
					<DurationPicker value={effectiveDuration} onChange={(v) => (effectiveDuration = v)} />
				</div>

				<!-- Spaß-Faktor -->
				<div class="form-section">
					<label class="form-label">
						Spaß-Faktor{#if funRating !== null}: <span class="fun-rating-value">{funRating}</span
							>{/if}
					</label>
					<FunRatingPicker value={funRating} onChange={(v) => (funRating = v)} />
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
