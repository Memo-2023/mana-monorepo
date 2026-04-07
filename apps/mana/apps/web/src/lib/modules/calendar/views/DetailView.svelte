<!--
  Calendar — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { decryptRecord } from '$lib/data/crypto';
	import { eventsStore } from '../stores/events.svelte';
	import { Trash, MapPin, Clock, X } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalEvent } from '../types';
	import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import LinkedItems from '$lib/components/links/LinkedItems.svelte';
	import { toastStore } from '@mana/shared-ui/toast';

	let { navigate, goBack, params }: ViewProps = $props();
	let eventId = $derived(params.eventId as string);

	let event = $state<LocalEvent | null>(null);
	let timeBlock = $state<LocalTimeBlock | null>(null);
	let confirmDelete = $state(false);

	let editTitle = $state('');
	let editDate = $state('');
	let editStartTime = $state('');
	let editEndTime = $state('');
	let editLocation = $state('');
	let editDescription = $state('');
	let editAllDay = $state(false);

	let focused = $state(false);

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);
	let eventTags = $derived(getTagsByIds(allTags, event?.tagIds ?? []));

	async function removeTag(tagId: string) {
		const current = event?.tagIds ?? [];
		const removed = current.filter((id) => id !== tagId);
		await eventsStore.updateTagIds(eventId, removed);
		toastStore.undo('Tag entfernt', () => {
			eventsStore.updateTagIds(eventId, current);
		});
	}

	$effect(() => {
		eventId; // track
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			const ev = await db.table<LocalEvent>('events').get(eventId);
			if (!ev) return { event: null, block: null };
			const block = ev.timeBlockId
				? await db.table<LocalTimeBlock>('timeBlocks').get(ev.timeBlockId)
				: null;
			// Both rows carry encrypted title/description (events also encrypts
			// location). Decrypt clones so the inline editor binds to plaintext.
			const decryptedEvent = await decryptRecord('events', { ...ev });
			const decryptedBlock = block ? await decryptRecord('timeBlocks', { ...block }) : null;
			return { event: decryptedEvent, block: decryptedBlock };
		}).subscribe((val) => {
			event = val?.event ?? null;
			timeBlock = val?.block ?? null;
			if (val?.event && val?.block && !focused) {
				const tb = val.block;
				editTitle = val.event.title;
				editDate = tb.startDate.split('T')[0];
				editStartTime = tb.startDate.includes('T')
					? tb.startDate.split('T')[1]?.substring(0, 5)
					: '';
				const endStr = tb.endDate ?? tb.startDate;
				editEndTime = endStr.includes('T') ? endStr.split('T')[1]?.substring(0, 5) : '';
				editLocation = val.event.location ?? '';
				editDescription = val.event.description ?? '';
				editAllDay = tb.allDay;
			}
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		const startTime = editAllDay ? `${editDate}T00:00:00` : `${editDate}T${editStartTime}:00`;
		const endTime = editAllDay ? `${editDate}T23:59:59` : `${editDate}T${editEndTime}:00`;

		await eventsStore.updateEvent(eventId, {
			title: editTitle.trim() || event?.title || 'Untitled',
			startTime,
			endTime,
			isAllDay: editAllDay,
			location: editLocation.trim() || null,
			description: editDescription.trim() || null,
		});
	}

	async function handleAllDayChange() {
		await saveField();
	}

	async function deleteEvent() {
		const id = eventId;
		await eventsStore.deleteEvent(id);
		goBack();
		toastStore.undo('Termin gelöscht', () => {
			db.table('events').update(id, { deletedAt: undefined, updatedAt: new Date().toISOString() });
		});
	}
</script>

<div class="detail-view">
	{#if !event}
		<p class="empty">Termin nicht gefunden</p>
	{:else}
		<!-- Title -->
		<input
			class="title-input"
			bind:value={editTitle}
			onfocus={() => (focused = true)}
			onblur={saveField}
			placeholder="Titel..."
		/>

		<!-- Time -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-icon"><Clock size={14} /></span>
				<div class="time-fields">
					<input
						type="date"
						class="prop-input"
						bind:value={editDate}
						onfocus={() => (focused = true)}
						onblur={saveField}
					/>
					{#if !editAllDay}
						<div class="time-range">
							<input
								type="time"
								class="prop-input"
								bind:value={editStartTime}
								onfocus={() => (focused = true)}
								onblur={saveField}
							/>
							<span class="time-sep">—</span>
							<input
								type="time"
								class="prop-input"
								bind:value={editEndTime}
								onfocus={() => (focused = true)}
								onblur={saveField}
							/>
						</div>
					{/if}
					<label class="allday-label">
						<input type="checkbox" bind:checked={editAllDay} onchange={handleAllDayChange} />
						Ganztägig
					</label>
				</div>
			</div>

			<div class="prop-row">
				<span class="prop-icon"><MapPin size={14} /></span>
				<input
					class="prop-input wide"
					bind:value={editLocation}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Ort hinzufügen..."
				/>
			</div>

			{#if timeBlock?.recurrenceRule}
				<div class="prop-row">
					<span class="prop-icon">🔁</span>
					<span class="prop-value recurrence">{timeBlock.recurrenceRule}</span>
				</div>
			{/if}
		</div>

		<!-- Tags -->
		{#if eventTags.length > 0}
			<div class="section">
				<span class="section-label">Tags</span>
				<div class="tags-list">
					{#each eventTags as tag (tag.id)}
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
		<LinkedItems recordRef={{ app: 'calendar', collection: 'events', id: eventId }} {navigate} />

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

		<!-- Metadata -->
		<div class="meta">
			{#if event.createdAt}
				<span>Erstellt: {new Date(event.createdAt).toLocaleDateString('de')}</span>
			{/if}
			{#if event.updatedAt}
				<span>Bearbeitet: {new Date(event.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Termin wirklich löschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteEvent}>Löschen</button>
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

	.title-input {
		font-size: 1.125rem;
		font-weight: 600;
		border: none;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0;
	}
	.title-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .title-input {
		color: #f3f4f6;
	}
	:global(.dark) .title-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	.properties {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.prop-row {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
	}
	.prop-icon {
		color: #9ca3af;
		display: flex;
		margin-top: 0.25rem;
		flex-shrink: 0;
	}
	.prop-value.recurrence {
		font-size: 0.75rem;
		color: #6b7280;
	}
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
	.prop-input:hover,
	.prop-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.prop-input.wide {
		flex: 1;
	}
	.prop-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .prop-input {
		color: #e5e7eb;
	}
	:global(.dark) .prop-input:hover,
	:global(.dark) .prop-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .prop-input::placeholder {
		color: #4b5563;
	}
	.time-fields {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.time-range {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.time-sep {
		color: #9ca3af;
		font-size: 0.75rem;
	}
	.allday-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
	}

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

	@media (max-width: 640px) {
		.detail-view {
			padding: 0.75rem;
		}
		.action-btn,
		.tag-pill {
			min-height: 44px;
		}
		.prop-input,
		.allday-label {
			min-height: 44px;
		}
	}
</style>
