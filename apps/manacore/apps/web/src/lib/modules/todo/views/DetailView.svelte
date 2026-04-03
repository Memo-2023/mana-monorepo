<!--
  Todo — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { tasksStore } from '../stores/tasks.svelte';
	import { Check, Trash, X } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalTask, TaskPriority } from '../types';
	import { useAllTags, getTagsByIds } from '$lib/stores/tags.svelte';
	import LinkedItems from '$lib/components/links/LinkedItems.svelte';

	let { navigate, goBack, params }: ViewProps = $props();
	let taskId = $derived(params.taskId as string);

	let task = $state<LocalTask | null>(null);
	let confirmDelete = $state(false);

	// Edit fields — always live
	let editTitle = $state('');
	let editDescription = $state('');
	let editDueDate = $state('');
	let editPriority = $state<TaskPriority>('medium');

	// Track whether user is actively editing to prevent overwrite from liveQuery
	let focused = $state(false);

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	function getTaskTagIds(): string[] {
		return ((task?.metadata as Record<string, unknown>)?.labelIds as string[]) ?? [];
	}

	let taskTags = $derived(getTagsByIds(allTags, getTaskTagIds()));

	async function removeTag(tagId: string) {
		const current = getTaskTagIds();
		await tasksStore.updateLabels(
			taskId,
			current.filter((id) => id !== tagId)
		);
	}

	$effect(() => {
		taskId; // track
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalTask>('tasks').get(taskId)).subscribe((val) => {
			task = val ?? null;
			if (val && !focused) {
				editTitle = val.title;
				editDescription = val.description ?? '';
				editDueDate = val.dueDate?.split('T')[0] ?? '';
				editPriority = val.priority;
			}
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		await tasksStore.updateTask(taskId, {
			title: editTitle.trim() || task?.title || 'Untitled',
			description: editDescription.trim() || undefined,
			dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
			priority: editPriority,
		});
	}

	async function handlePriorityChange() {
		await tasksStore.updateTask(taskId, { priority: editPriority });
	}

	async function toggleComplete() {
		await tasksStore.toggleComplete(taskId);
	}

	async function toggleSubtask(subtaskId: string) {
		if (!task?.subtasks) return;
		const updated = task.subtasks.map((s) =>
			s.id === subtaskId
				? {
						...s,
						isCompleted: !s.isCompleted,
						completedAt: !s.isCompleted ? new Date().toISOString() : null,
					}
				: s
		);
		await tasksStore.updateTask(taskId, { subtasks: updated });
	}

	async function deleteTask() {
		await tasksStore.deleteTask(taskId);
		goBack();
	}

	const priorityLabels: Record<TaskPriority, string> = {
		low: 'Niedrig',
		medium: 'Mittel',
		high: 'Hoch',
		urgent: 'Dringend',
	};

	const priorityColors: Record<TaskPriority, string> = {
		low: '#9ca3af',
		medium: '#3b82f6',
		high: '#f59e0b',
		urgent: '#ef4444',
	};
</script>

<div class="detail-view">
	{#if !task}
		<p class="empty">Aufgabe nicht gefunden</p>
	{:else}
		<!-- Title row with checkbox -->
		<div class="title-row">
			<button class="complete-btn" onclick={toggleComplete}>
				<div class="checkbox" class:checked={task.isCompleted}>
					{#if task.isCompleted}<Check size={12} />{/if}
				</div>
			</button>
			<input
				class="title-input"
				class:completed={task.isCompleted}
				bind:value={editTitle}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Titel..."
			/>
		</div>

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Priorität</span>
				<select
					class="prop-select"
					bind:value={editPriority}
					onchange={handlePriorityChange}
					style="color: {priorityColors[editPriority]}"
				>
					{#each ['low', 'medium', 'high', 'urgent'] as const as p}
						<option value={p}>{priorityLabels[p]}</option>
					{/each}
				</select>
			</div>

			<div class="prop-row">
				<span class="prop-label">Fällig</span>
				<input
					type="date"
					class="prop-input"
					bind:value={editDueDate}
					onfocus={() => (focused = true)}
					onblur={saveField}
				/>
			</div>

			{#if task.estimatedDuration}
				<div class="prop-row">
					<span class="prop-label">Dauer</span>
					<span class="prop-value">{task.estimatedDuration} Min.</span>
				</div>
			{/if}
		</div>

		<!-- Tags -->
		{#if taskTags.length > 0}
			<div class="section">
				<span class="section-label">Tags</span>
				<div class="tags-list">
					{#each taskTags as tag (tag.id)}
						<button
							class="tag-pill"
							style="--tag-color: {tag.color}"
							onclick={() => removeTag(tag.id)}
						>
							<span class="tag-dot" style="background: {tag.color}"></span>
							{tag.name}
							<X size={10} />
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Links -->
		<LinkedItems recordRef={{ app: 'todo', collection: 'tasks', id: taskId }} {navigate} />

		<!-- Description -->
		<div class="section">
			<span class="section-label">Beschreibung</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Beschreibung hinzufügen..."
				rows={3}
			></textarea>
		</div>

		<!-- Subtasks -->
		{#if task.subtasks && task.subtasks.length > 0}
			<div class="section">
				<span class="section-label">
					Unteraufgaben ({task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length})
				</span>
				<div class="subtask-list">
					{#each task.subtasks as subtask (subtask.id)}
						<button class="subtask-item" onclick={() => toggleSubtask(subtask.id)}>
							<div class="checkbox small" class:checked={subtask.isCompleted}>
								{#if subtask.isCompleted}<Check size={10} />{/if}
							</div>
							<span class="subtask-title" class:completed={subtask.isCompleted}>
								{subtask.title}
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Metadata -->
		<div class="meta">
			<span>Erstellt: {new Date(task.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if task.updatedAt}
				<span>Bearbeitet: {new Date(task.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Aufgabe wirklich löschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteTask}>Löschen</button>
					<button class="action-btn" onclick={() => (confirmDelete = false)}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={() => (confirmDelete = true)}>
					<Trash size={14} /> Löschen
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	/* Title row */
	.title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.complete-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0.25rem 0 0 0;
		flex-shrink: 0;
	}
	.title-input {
		flex: 1;
		font-size: 1.125rem;
		font-weight: 600;
		border: none;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0;
	}
	.title-input.completed {
		text-decoration: line-through;
		color: #9ca3af;
	}
	.title-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .title-input {
		color: #f3f4f6;
	}
	:global(.dark) .title-input.completed {
		color: #6b7280;
	}
	:global(.dark) .title-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Checkbox */
	.checkbox {
		width: 20px;
		height: 20px;
		border-radius: 0.25rem;
		border: 2px solid #d1d5db;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
	}
	.checkbox.checked {
		border-color: #22c55e;
		background: #22c55e;
		color: white;
	}
	.checkbox.small {
		width: 16px;
		height: 16px;
		border-width: 1.5px;
	}
	:global(.dark) .checkbox {
		border-color: #4b5563;
	}

	/* Properties */
	.properties {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.prop-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0;
	}
	.prop-label {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.prop-value {
		font-size: 0.8125rem;
		color: #374151;
	}
	:global(.dark) .prop-value {
		color: #e5e7eb;
	}
	.prop-select,
	.prop-input {
		font-size: 0.8125rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		transition: border-color 0.15s;
	}
	.prop-select:hover,
	.prop-input:hover,
	.prop-select:focus,
	.prop-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .prop-select,
	:global(.dark) .prop-input {
		color: #e5e7eb;
	}
	:global(.dark) .prop-select:hover,
	:global(.dark) .prop-input:hover,
	:global(.dark) .prop-select:focus,
	:global(.dark) .prop-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Sections */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: none;
		background: color-mix(in srgb, var(--tag-color) 12%, transparent);
		font-size: 0.6875rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.tag-pill:hover {
		background: color-mix(in srgb, var(--tag-color) 20%, transparent);
		color: #ef4444;
	}
	:global(.dark) .tag-pill {
		background: color-mix(in srgb, var(--tag-color) 18%, transparent);
		color: #9ca3af;
	}
	:global(.dark) .tag-pill:hover {
		background: color-mix(in srgb, var(--tag-color) 28%, transparent);
		color: #ef4444;
	}
	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
	}
	.description-input {
		font-size: 0.8125rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: transparent;
		color: #374151;
		padding: 0.5rem;
		outline: none;
		resize: vertical;
		font-family: inherit;
		transition: border-color 0.15s;
	}
	.description-input:hover,
	.description-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.description-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .description-input {
		color: #f3f4f6;
	}
	:global(.dark) .description-input:hover,
	:global(.dark) .description-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .description-input::placeholder {
		color: #4b5563;
	}

	/* Subtasks */
	.subtask-list {
		display: flex;
		flex-direction: column;
	}
	.subtask-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
	}
	.subtask-title {
		font-size: 0.8125rem;
		color: #374151;
	}
	.subtask-title.completed {
		text-decoration: line-through;
		color: #9ca3af;
	}
	:global(.dark) .subtask-title {
		color: #e5e7eb;
	}
	:global(.dark) .subtask-title.completed {
		color: #6b7280;
	}

	/* Meta & actions */
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 0.6875rem;
		color: #9ca3af;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .meta {
		border-color: rgba(255, 255, 255, 0.06);
	}
	.danger-zone {
		padding-top: 0.5rem;
	}
	.confirm-text {
		font-size: 0.8125rem;
		color: #ef4444;
		margin: 0 0 0.5rem;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
	}
	.action-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}
	.action-btn.danger {
		background: #ef4444;
		border-color: #ef4444;
		color: white;
	}
	.action-btn.danger-subtle {
		color: #ef4444;
		border-color: transparent;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	:global(.dark) .action-btn {
		border-color: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}
	:global(.dark) .action-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}
</style>
