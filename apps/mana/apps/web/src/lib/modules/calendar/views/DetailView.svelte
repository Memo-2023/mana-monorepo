<!--
  Calendar — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { db } from '$lib/data/database';
	import { decryptRecord } from '$lib/data/crypto';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { eventsStore } from '../stores/events.svelte';
	import { MapPin, Clock, X } from '@mana/shared-icons';
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalEvent } from '../types';
	import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import LinkedItems from '$lib/components/links/LinkedItems.svelte';
	import { toastStore } from '@mana/shared-ui/toast';
	import { removeTagIdWithUndo } from '$lib/data/tag-mutations';

	let { navigate, params, goBack }: ViewProps = $props();
	let eventId = $derived(params.eventId as string);

	type EventBundle = LocalEvent & { _block: LocalTimeBlock | null };

	let editTitle = $state('');
	let editDate = $state('');
	let editStartTime = $state('');
	let editEndTime = $state('');
	let editLocation = $state('');
	let editDescription = $state('');
	let editAllDay = $state(false);

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	const detail = useDetailEntity<EventBundle>({
		id: () => eventId,
		loader: async (id) => {
			const ev = await db.table<LocalEvent>('events').get(id);
			if (!ev) return null;
			const block = ev.timeBlockId
				? await db.table<LocalTimeBlock>('timeBlocks').get(ev.timeBlockId)
				: null;
			// Both rows carry encrypted title/description (events also encrypts
			// location). Decrypt clones so the inline editor binds to plaintext.
			const decryptedEvent = (await decryptRecord('events', { ...ev })) as LocalEvent;
			const decryptedBlock = block
				? ((await decryptRecord('timeBlocks', { ...block })) as LocalTimeBlock)
				: null;
			return { ...decryptedEvent, _block: decryptedBlock } as EventBundle;
		},
		onLoad: (bundle) => {
			const tb = bundle._block;
			editTitle = bundle.title;
			if (tb) {
				editDate = tb.startDate.split('T')[0];
				editStartTime = tb.startDate.includes('T')
					? (tb.startDate.split('T')[1]?.substring(0, 5) ?? '')
					: '';
				const endStr = tb.endDate ?? tb.startDate;
				editEndTime = endStr.includes('T') ? (endStr.split('T')[1]?.substring(0, 5) ?? '') : '';
				editAllDay = tb.allDay;
			}
			editLocation = bundle.location ?? '';
			editDescription = bundle.description ?? '';
		},
	});

	let eventTags = $derived(getTagsByIds(allTags, detail.entity?.tagIds ?? []));

	async function removeTag(tagId: string) {
		await removeTagIdWithUndo(detail.entity?.tagIds ?? [], tagId, (next) =>
			eventsStore.updateTagIds(eventId, next)
		);
	}

	async function saveField() {
		detail.blur();
		const startTime = editAllDay ? `${editDate}T00:00:00` : `${editDate}T${editStartTime}:00`;
		const endTime = editAllDay ? `${editDate}T23:59:59` : `${editDate}T${editEndTime}:00`;
		await eventsStore.updateEvent(eventId, {
			title: editTitle.trim() || detail.entity?.title || 'Untitled',
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

	async function handleVisibilityChange(next: VisibilityLevel) {
		await eventsStore.setVisibility(eventId, next);
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

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Termin nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Termin wirklich löschen?"
	onConfirmDelete={deleteEvent}
>
	{#snippet body(event)}
		<input
			class="title-input"
			bind:value={editTitle}
			onfocus={detail.focus}
			onblur={saveField}
			placeholder="Titel..."
		/>

		<div class="properties">
			<div class="prop-row prop-row--labeled">
				<span class="prop-label">Sichtbarkeit</span>
				<VisibilityPicker level={event.visibility ?? 'private'} onChange={handleVisibilityChange} />
			</div>

			<div class="prop-row">
				<span class="prop-icon"><Clock size={14} /></span>
				<div class="time-fields">
					<input
						type="date"
						class="prop-input"
						bind:value={editDate}
						onfocus={detail.focus}
						onblur={saveField}
					/>
					{#if !editAllDay}
						<div class="time-range">
							<input
								type="time"
								class="prop-input"
								bind:value={editStartTime}
								onfocus={detail.focus}
								onblur={saveField}
							/>
							<span class="time-sep">—</span>
							<input
								type="time"
								class="prop-input"
								bind:value={editEndTime}
								onfocus={detail.focus}
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
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="Ort hinzufügen..."
				/>
			</div>

			{#if event._block?.recurrenceRule}
				<div class="prop-row">
					<span class="prop-icon">🔁</span>
					<span class="prop-value recurrence">{event._block.recurrenceRule}</span>
				</div>
			{/if}
		</div>

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

		<LinkedItems recordRef={{ app: 'calendar', collection: 'events', id: eventId }} {navigate} />

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

		<div class="meta">
			{#if event.createdAt}
				<span>Erstellt: {formatDate(new Date(event.createdAt))}</span>
			{/if}
			{#if event.updatedAt}
				<span>Bearbeitet: {formatDate(new Date(event.updatedAt))}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>

<style>
	.prop-row--labeled {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.prop-row--labeled .prop-label {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		min-width: 5rem;
		flex-shrink: 0;
	}
	.prop-icon {
		display: flex;
		align-items: center;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
		width: 1rem;
	}
	.time-fields {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		flex: 1;
	}
	.time-range {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.time-sep {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
	}
	.allday-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	:global(.detail-view .prop-input.wide) {
		flex: 1;
		min-width: 0;
		max-width: none;
		text-align: left;
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
		transition: opacity 0.15s;
	}
	.tag-pill:hover {
		opacity: 0.8;
	}
	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
	}
	.recurrence {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
