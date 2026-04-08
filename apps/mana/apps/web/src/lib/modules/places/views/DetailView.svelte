<!--
  Places — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { db } from '$lib/data/database';
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { placesStore } from '../stores/places.svelte';
	import { Star, MapPin, X } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalPlace, PlaceCategory, LocalLocationLog } from '../types';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import LinkedItems from '$lib/components/links/LinkedItems.svelte';
	import { removeTagIdWithUndo } from '$lib/data/tag-mutations';

	let { navigate, params, goBack }: ViewProps = $props();
	let placeId = $derived(params.placeId as string);

	let editName = $state('');
	let editDescription = $state('');
	let editAddress = $state('');
	let editCategory = $state<PlaceCategory>('other');
	let editLatitude = $state('');
	let editLongitude = $state('');

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	const detail = useDetailEntity<LocalPlace>({
		id: () => placeId,
		table: 'places',
		onLoad: (p) => {
			editName = p.name ?? '';
			editDescription = p.description ?? '';
			editAddress = p.address ?? '';
			editCategory = p.category ?? 'other';
			editLatitude = p.latitude?.toString() ?? '';
			editLongitude = p.longitude?.toString() ?? '';
		},
	});

	const logsQuery = useLiveQueryWithDefault(async () => {
		const all = await db
			.table<LocalLocationLog>('locationLogs')
			.where('placeId')
			.equals(placeId)
			.reverse()
			.sortBy('timestamp');
		return all.slice(0, 20);
	}, [] as LocalLocationLog[]);
	const logs = $derived(logsQuery.value);

	let placeTags = $derived(getTagsByIds(allTags, detail.entity?.tagIds ?? []));

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
		await removeTagIdWithUndo(detail.entity?.tagIds ?? [], tagId, (next) =>
			placesStore.updateTagIds(placeId, next)
		);
	}

	async function saveField() {
		detail.blur();
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
		const place = detail.entity;
		if (!place || !place.latitude || !place.longitude) return '';
		const lat = place.latitude;
		const lng = place.longitude;
		const bbox = `${lng - 0.005},${lat - 0.003},${lng + 0.005},${lat + 0.003}`;
		return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
	});
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Ort nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Ort wirklich löschen?"
	onConfirmDelete={deletePlace}
>
	{#snippet body(place)}
		<div class="profile-header">
			<div class="place-avatar">
				<MapPin size={20} />
			</div>
			<div class="name-fields">
				<input
					class="name-input"
					bind:value={editName}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="Name"
				/>
			</div>
			<button class="fav-btn" class:active={place.isFavorite} onclick={toggleFavorite}>
				<Star size={18} weight={place.isFavorite ? 'fill' : 'regular'} />
			</button>
		</div>

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
					onfocus={detail.focus}
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
						onfocus={detail.focus}
						onblur={saveField}
						placeholder="Lat"
						type="number"
						step="any"
					/>
					<input
						class="field-input small"
						bind:value={editLongitude}
						onfocus={detail.focus}
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
					class="description-input"
					bind:value={editDescription}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="Notizen zum Ort..."
					rows={2}
				></textarea>
			</div>
		</div>

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

		<LinkedItems recordRef={{ app: 'places', collection: 'places', id: placeId }} {navigate} />

		{#if logs.length > 0}
			<div class="section">
				<span class="section-label">Letzte Besuche</span>
				<div class="log-list">
					{#each logs as log (log.id)}
						<div class="log-row">
							<span class="log-time">{formatDate(log.timestamp)}</span>
							{#if log.accuracy}
								<span class="log-accuracy">±{Math.round(log.accuracy)}m</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

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
	{/snippet}
</DetailViewShell>

<style>
	.profile-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.place-avatar {
		width: 48px;
		height: 48px;
		border-radius: 9999px;
		background: rgba(0, 0, 0, 0.06);
		color: #6b7280;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	:global(.dark) .place-avatar {
		background: rgba(255, 255, 255, 0.08);
		color: #9ca3af;
	}
	.name-fields {
		flex: 1;
		min-width: 0;
	}
	.name-input {
		width: 100%;
		font-size: 1rem;
		font-weight: 600;
		border: 1px solid transparent;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		transition: border-color 0.15s;
	}
	.name-input:hover,
	.name-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .name-input {
		color: #f3f4f6;
	}
	:global(.dark) .name-input:hover,
	:global(.dark) .name-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	.map-container {
		border-radius: 0.5rem;
		overflow: hidden;
		border: 1px solid rgba(0, 0, 0, 0.08);
	}
	:global(.dark) .map-container {
		border-color: rgba(255, 255, 255, 0.08);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.field-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.field-label {
		font-size: 0.75rem;
		color: #9ca3af;
		min-width: 5.5rem;
		padding-top: 0.375rem;
	}
	.field-input,
	.field-select {
		flex: 1;
		min-width: 0;
		font-size: 0.8125rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		text-align: right;
		transition: border-color 0.15s;
	}
	.field-input:hover,
	.field-input:focus,
	.field-select:hover,
	.field-select:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .field-input,
	:global(.dark) .field-select {
		color: #e5e7eb;
	}
	:global(.dark) .field-input:hover,
	:global(.dark) .field-input:focus,
	:global(.dark) .field-select:hover,
	:global(.dark) .field-select:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.field-input.small {
		max-width: 6rem;
	}
	.coords-row {
		display: flex;
		gap: 0.25rem;
		flex: 1;
		justify-content: flex-end;
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
		color: #6b7280;
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
	:global(.dark) .tag-pill {
		color: #9ca3af;
	}

	.log-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
	}
	.log-row {
		display: flex;
		justify-content: space-between;
		color: #6b7280;
	}
	.log-accuracy {
		color: #9ca3af;
	}
</style>
