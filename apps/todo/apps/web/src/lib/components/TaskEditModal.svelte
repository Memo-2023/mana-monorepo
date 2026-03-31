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
	import { X, Trash } from '@manacore/shared-icons';

	interface Props {
		task: Task;
		open: boolean;
		onClose: () => void;
		onSave: (data: UpdateTaskInput) => void;
		onDelete: (taskId: string) => void;
	}

	let { task, open, onClose, onSave, onDelete }: Props = $props();

	const form = useTaskForm();
	let showLinkPicker = $state(false);

	$effect(() => {
		if (open && task) form.initFromTask(task);
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
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
		if (form.showDeleteConfirm) onDelete(task.id);
		else form.showDeleteConfirm = true;
	}

	function handleSubtasksChange(newSubtasks: Subtask[]) {
		form.subtasks = newSubtasks;
	}

	function autoGrow(node: HTMLTextAreaElement) {
		function resize() {
			node.style.height = 'auto';
			node.style.height = node.scrollHeight + 'px';
		}
		node.addEventListener('input', resize);
		resize();
		return { destroy: () => node.removeEventListener('input', resize) };
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true" use:focusTrap>
		<div class="page">
			<!-- Top bar -->
			<div class="top-bar">
				<div class="top-left">
					{#if form.showDeleteConfirm}
						<span class="delete-confirm-text">Wirklich löschen?</span>
						<button class="btn-ghost-danger" onclick={handleDelete}>Ja, löschen</button>
						<button class="btn-ghost" onclick={() => (form.showDeleteConfirm = false)}
							>Abbrechen</button
						>
					{:else}
						<button class="btn-icon-danger" onclick={handleDelete} title="Aufgabe löschen">
							<Trash size={16} />
						</button>
					{/if}
				</div>
				<div class="top-right">
					<button
						class="btn-save"
						onclick={handleSave}
						disabled={form.isLoading || !form.title.trim()}
					>
						{#if form.isLoading}<span class="spinner"></span>{:else}Speichern{/if}
					</button>
					<button class="btn-close" onclick={onClose} title="Schließen"><X size={18} /></button>
				</div>
			</div>

			<!-- Title -->
			<div class="title-area">
				<textarea
					class="title-input"
					bind:value={form.title}
					placeholder="Aufgabentitel..."
					rows="1"
					use:autoGrow
				></textarea>
			</div>

			<!-- Content: Description (left) + Subtasks/Links (right) -->
			<div class="content-grid">
				<div class="col-desc">
					<span class="col-label">Beschreibung</span>
					<textarea
						class="desc-textarea"
						bind:value={form.description}
						placeholder="Beschreibung hinzufügen..."
						rows="5"
					></textarea>
				</div>

				<div class="col-subtasks">
					<span class="col-label">Subtasks</span>
					<SubtaskList subtasks={form.subtasks} onChange={handleSubtasksChange} />

					<div class="links-block">
						<div class="links-header">
							<span class="col-label">Verknüpfungen</span>
							<button class="link-add" onclick={() => (showLinkPicker = true)}>+ Verknüpfen</button>
						</div>
						<ManaLinkList recordRef={{ app: 'todo', collection: 'tasks', id: task.id }} editable />
					</div>
				</div>
			</div>

			<!-- Properties strip: all metadata horizontal -->
			<div class="props-strip">
				<!-- Status -->
				<div class="prop">
					<span class="prop-label">Status</span>
					<select class="prop-select" bind:value={form.status}>
						{#each STATUS_OPTIONS as s}
							<option value={s.value}>{s.label}</option>
						{/each}
					</select>
				</div>

				<div class="prop-divider"></div>

				<!-- Priorität -->
				<div class="prop prop-priority">
					<span class="prop-label">Priorität</span>
					<PrioritySelector value={form.priority} onChange={(p) => (form.priority = p)} />
				</div>

				<div class="prop-divider"></div>

				<!-- Fälligkeit -->
				<div class="prop">
					<span class="prop-label">Fälligkeit</span>
					<input type="date" class="prop-input" bind:value={form.dueDate} />
				</div>

				<!-- Uhrzeit -->
				<div class="prop">
					<span class="prop-label">Uhrzeit</span>
					<input type="time" class="prop-input" bind:value={form.dueTime} />
				</div>

				<!-- Startdatum -->
				<div class="prop">
					<span class="prop-label">Startdatum</span>
					<input type="date" class="prop-input" bind:value={form.startDate} />
				</div>

				<!-- Wiederholung -->
				<div class="prop">
					<span class="prop-label">Wiederholung</span>
					<select class="prop-select" bind:value={form.recurrenceRule}>
						{#each RECURRENCE_OPTIONS as o}
							<option value={o.value}>{o.label}</option>
						{/each}
					</select>
				</div>

				<div class="prop-divider"></div>

				<!-- Tags -->
				<div class="prop prop-tags">
					<span class="prop-label">Tags</span>
					<TagSelector
						selectedIds={form.selectedLabelIds}
						onChange={(ids) => (form.selectedLabelIds = ids)}
					/>
				</div>

				<div class="prop-divider"></div>

				<!-- Zuständig -->
				<div class="prop prop-contact">
					<span class="prop-label">Zuständig</span>
					<ContactSelector
						selectedContacts={form.assignee}
						onContactsChange={(c) => (form.assignee = c)}
						onSearch={(q) => contactsStore.searchContacts(q)}
						singleSelect={true}
						allowManualEntry={false}
						placeholder="Zuweisen..."
						addLabel="Zuweisen"
						searchPlaceholder="Name oder E-Mail..."
						isAvailable={form.contactsAvailable ?? false}
					/>
				</div>

				<!-- Beteiligte -->
				<div class="prop prop-contact">
					<span class="prop-label">Beteiligte</span>
					<ContactSelector
						selectedContacts={form.involvedContacts}
						onContactsChange={(c) => (form.involvedContacts = c)}
						onSearch={(q) => contactsStore.searchContacts(q)}
						allowManualEntry={false}
						placeholder="Hinzufügen..."
						addLabel="Hinzufügen"
						searchPlaceholder="Name oder E-Mail..."
						isAvailable={form.contactsAvailable ?? false}
					/>
				</div>

				<div class="prop-divider"></div>

				<!-- Storypoints -->
				<div class="prop">
					<span class="prop-label">Storypoints</span>
					<StorypointsSelector value={form.storyPoints} onChange={(v) => (form.storyPoints = v)} />
				</div>

				<!-- Effektive Dauer -->
				<div class="prop">
					<span class="prop-label">Dauer</span>
					<DurationPicker
						value={form.effectiveDuration}
						onChange={(v) => (form.effectiveDuration = v)}
					/>
				</div>

				<!-- Spaß-Faktor -->
				<div class="prop">
					<span class="prop-label">Spaß{form.funRating !== null ? ` (${form.funRating})` : ''}</span
					>
					<FunRatingPicker value={form.funRating} onChange={(v) => (form.funRating = v)} />
				</div>
			</div>

			<ManaLinkPicker
				sourceRef={{ app: 'todo', collection: 'tasks', id: task.id }}
				sourceTitle={form.title || task.title}
				open={showLinkPicker}
				onClose={() => (showLinkPicker = false)}
				onSearch={searchCrossApp}
			/>
		</div>
	</div>
{/if}

<style>
	/* ── Backdrop ─────────────────────────────────────────── */
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9995;
		padding: 2rem;
	}

	/* ── Page ─────────────────────────────────────────────── */
	.page {
		container-type: inline-size;
		width: 100%;
		max-width: 1040px;
		max-height: calc(100vh - 4rem);
		display: flex;
		flex-direction: column;
		background: var(--color-surface-elevated-2);
		border: 1px solid var(--color-border);
		border-radius: 1.5rem;
		box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.3);
		overflow: hidden;
	}

	/* ── Top bar ──────────────────────────────────────────── */
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 1.25rem;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.top-left,
	.top-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.delete-confirm-text {
		font-size: 0.8125rem;
		color: var(--color-error);
		font-weight: 500;
	}

	.btn-ghost {
		padding: 0.3rem 0.625rem;
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: var(--color-muted-foreground);
		cursor: pointer;
		border-radius: 0.5rem;
		transition: background 0.15s;
	}

	.btn-ghost:hover {
		background: var(--color-surface-hover);
	}

	.btn-ghost-danger {
		padding: 0.3rem 0.625rem;
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: var(--color-error);
		cursor: pointer;
		border-radius: 0.5rem;
		transition: background 0.15s;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.btn-ghost-danger:hover {
		background: color-mix(in srgb, var(--color-error) 8%, transparent);
	}

	.btn-icon-danger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.875rem;
		height: 1.875rem;
		border: none;
		background: transparent;
		color: var(--color-muted-foreground);
		cursor: pointer;
		border-radius: 0.5rem;
		transition: all 0.15s;
	}

	.btn-icon-danger:hover {
		background: color-mix(in srgb, var(--color-error) 8%, transparent);
		color: var(--color-error);
	}

	.btn-save {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.875rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 0.625rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-save:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.btn-save:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.btn-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.875rem;
		height: 1.875rem;
		border: none;
		background: transparent;
		color: var(--color-muted-foreground);
		cursor: pointer;
		border-radius: 0.5rem;
		transition: all 0.15s;
	}

	.btn-close:hover {
		background: var(--color-surface-hover);
		color: var(--color-foreground);
	}

	/* ── Title ────────────────────────────────────────────── */
	.title-area {
		padding: 1rem 1.5rem 0.75rem;
		flex-shrink: 0;
	}

	.title-input {
		width: 100%;
		border: none;
		background: transparent;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-foreground);
		line-height: 1.3;
		resize: none;
		overflow: hidden;
		padding: 0;
		outline: none;
		font-family: inherit;
	}

	.title-input::placeholder {
		color: var(--color-border);
	}

	/* ── Content grid: Description | Subtasks/Links ───────── */
	.content-grid {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		border-top: 1px solid var(--color-border);
		overflow: hidden;
		min-height: 0;
	}

	/* Single column on narrow */
	@container (max-width: 600px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}

	.col-desc,
	.col-subtasks {
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		overflow-y: auto;
	}

	.col-subtasks {
		border-left: 1px solid var(--color-border);
	}

	.col-label {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted-foreground);
		flex-shrink: 0;
	}

	.desc-textarea {
		flex: 1;
		width: 100%;
		border: none;
		background: transparent;
		font-size: 0.875rem;
		color: var(--color-foreground);
		resize: none;
		font-family: inherit;
		line-height: 1.6;
		outline: none;
		min-height: 100px;
	}

	.desc-textarea::placeholder {
		color: var(--color-border);
	}

	.links-block {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.links-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.link-add {
		border: none;
		background: transparent;
		font-size: 0.75rem;
		color: var(--color-primary);
		cursor: pointer;
		padding: 0.125rem 0.25rem;
		border-radius: 0.375rem;
		transition: background 0.15s;
	}

	.link-add:hover {
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	}

	/* ── Properties strip ─────────────────────────────────── */
	.props-strip {
		display: flex;
		flex-wrap: wrap;
		align-items: stretch;
		flex-shrink: 0;
		border-top: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.prop {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem 0.875rem;
		border-right: 1px solid var(--color-border);
	}

	.prop:last-child {
		border-right: none;
	}

	.prop-priority {
		min-width: 200px;
	}

	.prop-tags {
		min-width: 140px;
		flex: 1;
	}

	.prop-contact {
		min-width: 130px;
	}

	.prop-label {
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--color-muted-foreground);
		white-space: nowrap;
	}

	.prop-input,
	.prop-select {
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: var(--color-foreground);
		font-family: inherit;
		padding: 0;
		outline: none;
		cursor: pointer;
		min-width: 0;
	}

	:global(.dark) .prop-select {
		color-scheme: dark;
	}

	.prop-input:focus,
	.prop-select:focus {
		color: var(--color-primary);
	}

	.prop-divider {
		width: 1px;
		background: var(--color-border);
		margin: 0.375rem 0;
		flex-shrink: 0;
	}

	/* ── Spinner ──────────────────────────────────────────── */
	.spinner {
		width: 0.875rem;
		height: 0.875rem;
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

	/* ── Mobile ───────────────────────────────────────────── */
	@media (max-width: 640px) {
		.backdrop {
			align-items: flex-end;
			padding: 0;
		}

		.page {
			max-width: 100%;
			max-height: calc(100vh - 60px - env(safe-area-inset-top, 0px));
			border-radius: 1.5rem 1.5rem 0 0;
			margin-bottom: env(safe-area-inset-bottom, 0px);
		}

		.content-grid {
			grid-template-columns: 1fr;
			overflow-y: auto;
		}

		.col-subtasks {
			border-left: none;
			border-top: 1px solid var(--color-border);
		}
	}
</style>
