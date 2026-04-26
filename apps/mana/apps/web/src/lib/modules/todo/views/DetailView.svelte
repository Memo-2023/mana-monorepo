<!--
  Todo — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { db } from '$lib/data/database';
	import { decryptRecord } from '$lib/data/crypto';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { tasksStore } from '../stores/tasks.svelte';
	import { getBlock, decryptBlock } from '$lib/data/time-blocks/service';
	import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
	import { Check, X, CalendarBlank } from '@mana/shared-icons';
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
	import SlotSuggestions from '$lib/modules/calendar/components/SlotSuggestions.svelte';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalTask, TaskPriority } from '../types';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import LinkedItems from '$lib/components/links/LinkedItems.svelte';
	import { toastStore } from '@mana/shared-ui/toast';
	import { removeTagIdWithUndo } from '$lib/data/tag-mutations';

	let { navigate, params, goBack }: ViewProps = $props();
	let taskId = $derived(params.taskId as string);

	type TaskBundle = LocalTask & { _block: LocalTimeBlock | null };

	let editTitle = $state('');
	let editDescription = $state('');
	let editDueDate = $state('');
	let editPriority = $state<TaskPriority>('medium');

	let scheduleDate = $state('');
	let scheduleTime = $state('');
	let isScheduled = $state(false);

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	const detail = useDetailEntity<TaskBundle>({
		id: () => taskId,
		loader: async (id) => {
			const t = await db.table<LocalTask>('tasks').get(id);
			if (!t) return null;
			const block = t.scheduledBlockId ? await getBlock(t.scheduledBlockId) : null;
			// Decrypt clones so the inline editor binds to plaintext title /
			// description / metadata. The on-disk rows stay encrypted.
			const decryptedTask = (await decryptRecord('tasks', { ...t })) as LocalTask;
			const decryptedBlock = block ? await decryptBlock(block) : null;
			return { ...decryptedTask, _block: decryptedBlock } as TaskBundle;
		},
		onLoad: (bundle) => {
			editTitle = bundle.title;
			editDescription = bundle.description ?? '';
			editDueDate = bundle.dueDate?.split('T')[0] ?? '';
			editPriority = bundle.priority;
			if (bundle._block) {
				isScheduled = true;
				scheduleDate = bundle._block.startDate.split('T')[0];
				scheduleTime = bundle._block.startDate.includes('T')
					? (bundle._block.startDate.split('T')[1]?.substring(0, 5) ?? '')
					: '';
			} else {
				isScheduled = false;
				scheduleDate = '';
				scheduleTime = '';
			}
		},
	});

	function getTaskTagIds(): string[] {
		return ((detail.entity?.metadata as Record<string, unknown>)?.labelIds as string[]) ?? [];
	}

	let taskTags = $derived(getTagsByIds(allTags, getTaskTagIds()));

	async function removeTag(tagId: string) {
		await removeTagIdWithUndo(getTaskTagIds(), tagId, (next) =>
			tasksStore.updateLabels(taskId, next)
		);
	}

	async function saveField() {
		detail.blur();
		await tasksStore.updateTask(taskId, {
			title: editTitle.trim() || detail.entity?.title || 'Untitled',
			description: editDescription.trim() || undefined,
			dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
			priority: editPriority,
			_scheduleStartDate: isScheduled && scheduleDate ? scheduleDate : null,
			_scheduleStartTime: isScheduled && scheduleTime ? scheduleTime : null,
		});
	}

	async function toggleSchedule() {
		if (isScheduled) {
			isScheduled = false;
			scheduleDate = '';
			scheduleTime = '';
		} else {
			isScheduled = true;
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			scheduleDate = tomorrow.toISOString().split('T')[0];
			scheduleTime = '09:00';
		}
		await saveField();
	}

	async function handleVisibilityChange(next: VisibilityLevel) {
		await tasksStore.setVisibility(taskId, next);
	}

	async function handlePriorityChange() {
		await tasksStore.updateTask(taskId, { priority: editPriority });
	}

	async function toggleComplete() {
		await tasksStore.toggleComplete(taskId);
	}

	async function toggleSubtask(subtaskId: string) {
		const task = detail.entity;
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
		const id = taskId;
		await tasksStore.deleteTask(id);
		goBack();
		toastStore.undo('Aufgabe gelöscht', () => {
			db.table('tasks').update(id, { deletedAt: undefined });
		});
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

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Aufgabe nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Aufgabe wirklich löschen?"
	onConfirmDelete={deleteTask}
>
	{#snippet body(task)}
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
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Titel..."
			/>
		</div>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Sichtbarkeit</span>
				<VisibilityPicker level={task.visibility ?? 'private'} onChange={handleVisibilityChange} />
			</div>

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
					onfocus={detail.focus}
					onblur={saveField}
				/>
			</div>

			{#if task.estimatedDuration}
				<div class="prop-row">
					<span class="prop-label">Dauer</span>
					<span class="prop-value">{Math.round(task.estimatedDuration / 60)} Min.</span>
				</div>
			{/if}

			<div class="prop-row">
				<span class="prop-label">Kalender</span>
				{#if isScheduled}
					<div class="schedule-fields">
						<input
							type="date"
							class="prop-input"
							bind:value={scheduleDate}
							onfocus={detail.focus}
							onblur={saveField}
						/>
						<input
							type="time"
							class="prop-input"
							bind:value={scheduleTime}
							onfocus={detail.focus}
							onblur={saveField}
						/>
						<button
							class="unschedule-btn"
							onclick={toggleSchedule}
							aria-label="Vom Kalender entfernen"
						>
							<X size={12} />
						</button>
					</div>
				{:else}
					<div class="schedule-options">
						<button class="schedule-btn" onclick={toggleSchedule}>
							<CalendarBlank size={14} />
							Planen
						</button>
						<SlotSuggestions
							minDurationMinutes={task.estimatedDuration
								? Math.round(task.estimatedDuration / 60)
								: 60}
							onSelect={(start) => {
								isScheduled = true;
								scheduleDate = start.toISOString().split('T')[0];
								scheduleTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
								saveField();
							}}
						/>
					</div>
				{/if}
			</div>
		</div>

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

		<LinkedItems recordRef={{ app: 'todo', collection: 'tasks', id: taskId }} {navigate} />

		<div class="section">
			<span class="section-label">Beschreibung</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Beschreibung hinzufügen..."
				rows={3}
			></textarea>
		</div>

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

		<div class="meta">
			<span>Erstellt: {formatDate(new Date(task.createdAt ?? ''))}</span>
			{#if task.updatedAt}
				<span>Bearbeitet: {formatDate(new Date(task.updatedAt))}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>

<style>
	.title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.complete-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0.125rem;
		flex-shrink: 0;
	}
	.checkbox {
		width: 18px;
		height: 18px;
		border-radius: 4px;
		border: 1.5px solid #d1d5db;
		display: flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--color-primary-foreground));
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.checkbox.checked {
		background: hsl(var(--color-success));
		border-color: hsl(var(--color-success));
	}
	.checkbox.small {
		width: 14px;
		height: 14px;
		border-radius: 3px;
	}
	:global(.detail-view .title-input.completed) {
		text-decoration: line-through;
		color: hsl(var(--color-muted-foreground));
	}

	.schedule-fields {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}
	.schedule-options {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.schedule-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.schedule-btn:hover {
		background: hsl(var(--color-surface-hover));
	}
	.unschedule-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0.125rem;
		color: hsl(var(--color-muted-foreground));
		display: flex;
		align-items: center;
	}
	.unschedule-btn:hover {
		color: hsl(var(--color-error));
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
		background: color-mix(in srgb, var(--tag-color) 12%, transparent);
		border: none;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.tag-pill:hover {
		opacity: 0.8;
	}
	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
	}
	.subtask-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.subtask-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.375rem;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		border-radius: 0.25rem;
		transition: background 0.15s;
	}
	.subtask-item:hover {
		background: hsl(var(--color-surface-hover));
	}
	.subtask-title {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}
	.subtask-title.completed {
		text-decoration: line-through;
		color: hsl(var(--color-muted-foreground));
	}
</style>
