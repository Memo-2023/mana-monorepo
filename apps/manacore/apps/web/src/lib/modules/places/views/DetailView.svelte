<!--
  Places — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { placesStore } from '../stores/places.svelte';
	import { Trash, Star, MapPin, X } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalPlace, PlaceCategory, LocalLocationLog } from '../types';
	import { useAllTags, getTagsByIds } from '$lib/stores/tags.svelte';
	import LinkedItems from '$lib/components/links/LinkedItems.svelte';

	let { navigate, goBack, params }: ViewProps = $props();
	let placeId = $derived(params.placeId as string);

	let place = $state<LocalPlace | null>(null);
	let logs = $state<LocalLocationLog[]>([]);
	let confirmDelete = $state(false);
	let focused = $state(false);

	let editName = $state('');
	let editDescription = $state('');
	let editAddress = $state('');
	let editCategory = $state<PlaceCategory>('other');
	let editLatitude = $state('');
	let editLongitude = $state('');

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);
	let placeTags = $derived(getTagsByIds(allTags, place?.tagIds ?? []));

	const CATEGORIES: { value: PlaceCategory; label: string }[] = [
		{ value: 'home', label: 'Zuhause' },
		{ value: 'work', label: 'Arbeit' },
		{ value: 'food', label: 'Essen' },
		{ value: 'shopping', label: 'Einkauf' },
		{ value: 'transit', label: 'Transit' },
		{ value: 'leisure', label: 'Freizeit' },
		{ value: 'other', label: 'Sonstiges' },
	];

	async function removeTag(tagId: string) {
		const current = place?.tagIds ?? [];
		await placesStore.updateTagIds(
			placeId,
			current.filter((id) => id !== tagId)
		);
	}

	$effect(() => {
		placeId; // track
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalPlace>('places').get(placeId)).subscribe((val) => {
			place = val ?? null;
			if (val && !focused) syncFields(val);
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(() =>
			db
				.table<LocalLocationLog>('locationLogs')
				.where('placeId')
				.equals(placeId)
				.reverse()
				.sortBy('timestamp')
		).subscribe((val) => {
			logs = (val ?? []).slice(0, 20);
		});
		return () => sub.unsubscribe();
	});

	function syncFields(p: LocalPlace) {
		editName = p.name ?? '';
		editDescription = p.description ?? '';
		editAddress = p.address ?? '';
		editCategory = p.category ?? 'other';
		editLatitude = p.latitude?.toString() ?? '';
		editLongitude = p.longitude?.toString() ?? '';
	}

	async function saveField() {
		focused = false;
		const lat = parseFloat(editLatitude);
		const lng = parseFloat(editLongitude);
		await placesStore.updatePlace(placeId, {
			name: editName.trim() || 'Unbenannt',
			description: editDescription.trim() || null,
			address: editAddress.trim() || null,
			category: editCategory,
			latitude: isNaN(lat) ? 0 : lat,
			longitude: isNaN(lng) ? 0 : lng,
		} as Record<string, unknown>);
	}

	async function onCategoryChange(e: Event) {
		editCategory = (e.target as HTMLSelectElement).value as PlaceCategory;
		await saveField();
	}

	async function toggleFavorite() {
		await placesStore.toggleFavorite(placeId);
	}

	async function deletePlace() {
		await placesStore.deletePlace(placeId);
		goBack();
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('de', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	let mapUrl = $derived.by(() => {
		if (!place || !place.latitude || !place.longitude) return '';
		const lat = place.latitude;
		const lng = place.longitude;
		const bbox = `${lng - 0.005},${lat - 0.003},${lng + 0.005},${lat + 0.003}`;
		return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
	});
</script>

<div class="detail-view">
	{#if !place}
		<p class="empty">Ort nicht gefunden</p>
	{:else}
		<!-- Header -->
		<div class="profile-header">
			<div class="place-avatar">
				<MapPin size={20} />
			</div>
			<div class="name-fields">
				<input
					class="name-input"
					bind:value={editName}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Name"
				/>
			</div>
			<button class="fav-btn" class:active={place.isFavorite} onclick={toggleFavorite}>
				<Star size={18} weight={place.isFavorite ? 'fill' : 'regular'} />
			</button>
		</div>

		<!-- Map Preview -->
		{#if mapUrl}
			<div class="map-container">
				<iframe
					title="Kartenvorschau"
					src={mapUrl}
					width="100%"
					height="160"
					frameborder="0"
					loading="lazy"
				></iframe>
			</div>
		{/if}

		<!-- Fields -->
		<div class="fields">
			<div class="field-row">
				<span class="field-label">Kategorie</span>
				<select class="field-select" value={editCategory} onchange={onCategoryChange}>
					{#each CATEGORIES as cat}
						<option value={cat.value}>{cat.label}</option>
					{/each}
				</select>
			</div>

			<div class="field-row">
				<span class="field-label">Adresse</span>
				<input
					class="field-input"
					bind:value={editAddress}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Adresse eingeben..."
				/>
			</div>

			<div class="field-row">
				<span class="field-label">Koordinaten</span>
				<div class="coords-row">
					<input
						class="field-input small"
						bind:value={editLatitude}
						onfocus={() => (focused = true)}
						onblur={saveField}
						placeholder="Lat"
						type="number"
						step="any"
					/>
					<input
						class="field-input small"
						bind:value={editLongitude}
						onfocus={() => (focused = true)}
						onblur={saveField}
						placeholder="Lng"
						type="number"
						step="any"
					/>
				</div>
			</div>

			<div class="field-row">
				<span class="field-label">Beschreibung</span>
				<textarea
					class="field-textarea"
					bind:value={editDescription}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Notizen zum Ort..."
					rows={2}
				></textarea>
			</div>
		</div>

		<!-- Tags -->
		{#if placeTags.length > 0}
			<div class="section">
				<span class="section-label">Tags</span>
				<div class="tags-list">
					{#each placeTags as tag (tag.id)}
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
		<LinkedItems recordRef={{ app: 'places', collection: 'places', id: placeId }} {navigate} />

		<!-- Visit Log -->
		{#if logs.length > 0}
			<div class="section">
				<span class="section-label">Letzte Besuche</span>
				<div class="log-list">
					{#each logs as log (log.id)}
						<div class="log-row">
							<span class="log-time">{formatDate(log.timestamp)}</span>
							{#if log.accuracy}
								<span class="log-accuracy">&pm;{Math.round(log.accuracy)}m</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Stats & Meta -->
		<div class="meta">
			{#if (place.visitCount ?? 0) > 0}
				<span>Besuche: {place.visitCount}</span>
			{/if}
			{#if place.lastVisitedAt}
				<span>Letzter Besuch: {formatDate(place.lastVisitedAt)}</span>
			{/if}
			{#if place.createdAt}
				<span>Erstellt: {new Date(place.createdAt).toLocaleDateString('de')}</span>
			{/if}
			{#if place.updatedAt}
				<span>Bearbeitet: {new Date(place.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Ort wirklich loeschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deletePlace}>Loeschen</button>
					<button class="action-btn" onclick={() => (confirmDelete = false)}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={() => (confirmDelete = true)}>
					<Trash size={14} /> Loeschen
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

	/* Header */
	.profile-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.place-avatar {
		width: 48px;
		height: 48px;
		border-radius: 9999px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(14, 165, 233, 0.1);
		color: #0ea5e9;
	}
	.name-fields {
		flex: 1;
		min-width: 0;
	}
	.name-input {
		font-size: 0.9375rem;
		font-weight: 600;
		border: none;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0.125rem 0;
		width: 100%;
	}
	.name-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	.name-input::placeholder {
		color: #c0bfba;
		font-weight: 400;
	}
	:global(.dark) .name-input {
		color: #f3f4f6;
	}
	:global(.dark) .name-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .name-input::placeholder {
		color: #4b5563;
	}
	.fav-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		color: #d1d5db;
		padding: 0.25rem;
		transition: color 0.15s;
		flex-shrink: 0;
	}
	.fav-btn.active {
		color: #f59e0b;
	}
	.fav-btn:hover {
		color: #f59e0b;
	}

	/* Map */
	.map-container {
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
	}
	.map-container iframe {
		display: block;
	}

	/* Fields */
	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.field-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.field-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
	}
	.field-input,
	.field-textarea,
	.field-select {
		font-size: 0.8125rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		transition: border-color 0.15s;
		font-family: inherit;
	}
	.field-input:hover,
	.field-input:focus,
	.field-textarea:hover,
	.field-textarea:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.field-input::placeholder,
	.field-textarea::placeholder {
		color: #c0bfba;
	}
	.field-input.small {
		flex: 1;
	}
	.field-select {
		cursor: pointer;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
	}
	.field-textarea {
		resize: vertical;
	}
	:global(.dark) .field-input,
	:global(.dark) .field-textarea,
	:global(.dark) .field-select {
		color: #e5e7eb;
	}
	:global(.dark) .field-input:hover,
	:global(.dark) .field-input:focus,
	:global(.dark) .field-textarea:hover,
	:global(.dark) .field-textarea:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .field-input::placeholder,
	:global(.dark) .field-textarea::placeholder {
		color: #4b5563;
	}
	:global(.dark) .field-select {
		border-color: rgba(255, 255, 255, 0.1);
		background: transparent;
	}

	.coords-row {
		display: flex;
		gap: 0.375rem;
	}

	/* Tags */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
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

	/* Visit Log */
	.log-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.log-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.125rem 0;
		font-size: 0.75rem;
	}
	.log-time {
		color: var(--color-foreground);
		font-variant-numeric: tabular-nums;
	}
	.log-accuracy {
		color: var(--color-muted-foreground);
		font-size: 0.6875rem;
	}

	/* Meta */
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

	/* Delete */
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
		.fav-btn,
		.action-btn,
		.tag-pill {
			min-height: 44px;
		}
		.field-input,
		.field-textarea,
		.field-select {
			min-height: 44px;
		}
	}
</style>
