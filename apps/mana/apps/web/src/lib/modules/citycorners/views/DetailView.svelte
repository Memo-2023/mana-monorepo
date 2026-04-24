<!--
  CityCorners — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { favoritesStore } from '../stores/favorites.svelte';
	import { Star } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalLocation, LocalFavorite } from '../types';
	import { CATEGORY_COLORS } from '../types';

	let { params, goBack }: ViewProps = $props();
	let locationId = $derived(params.locationId as string);

	let editName = $state('');
	let editCategory = $state<LocalLocation['category']>('sight');
	let editDescription = $state('');
	let editAddress = $state('');

	const detail = useDetailEntity<LocalLocation>({
		id: () => locationId,
		table: 'ccLocations',
		onLoad: (val) => {
			editName = val.name;
			editCategory = val.category;
			editDescription = val.description ?? '';
			editAddress = val.address ?? '';
		},
	});

	let isFavorite = $state(false);
	$effect(() => {
		const sub = liveQuery(async () => {
			const all = await db.table<LocalFavorite>('ccFavorites').toArray();
			return all.find((f) => f.locationId === locationId && !f.deletedAt);
		}).subscribe((val) => {
			isFavorite = !!val;
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		detail.blur();
		await db.table('ccLocations').update(locationId, {
			name: editName.trim() || detail.entity?.name || 'Ohne Name',
			category: editCategory,
			description: editDescription.trim() || undefined,
			address: editAddress.trim() || undefined,
			updatedAt: new Date().toISOString(),
		});
	}

	async function handleCategoryChange() {
		await db.table('ccLocations').update(locationId, {
			category: editCategory,
			updatedAt: new Date().toISOString(),
		});
	}

	async function toggleFavorite() {
		await favoritesStore.toggle(locationId);
	}

	async function deleteLocation() {
		await db.table('ccLocations').update(locationId, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	}

	const categoryLabels: Record<LocalLocation['category'], string> = {
		sight: 'Sehenswürdigkeit',
		restaurant: 'Restaurant',
		shop: 'Geschäft',
		museum: 'Museum',
		cafe: 'Café',
		bar: 'Bar',
		park: 'Park',
		beach: 'Strand',
		hotel: 'Hotel',
		event_venue: 'Veranstaltungsort',
		viewpoint: 'Aussichtspunkt',
	};
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Ort nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Ort wirklich löschen?"
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: 'Ort gelöscht',
			delete: deleteLocation,
			goBack,
		})}
>
	{#snippet body(location)}
		<div class="title-row">
			<input
				class="title-input"
				bind:value={editName}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Name..."
			/>
			<button class="fav-btn" class:active={isFavorite} onclick={toggleFavorite}>
				<Star size={18} weight={isFavorite ? 'fill' : 'regular'} />
			</button>
		</div>

		<div class="category-row">
			<div class="category-dot" style="background: {CATEGORY_COLORS[editCategory] ?? '#666'}"></div>
			<select class="prop-select" bind:value={editCategory} onchange={handleCategoryChange}>
				{#each Object.entries(categoryLabels) as [key, label]}
					<option value={key}>{label}</option>
				{/each}
			</select>
		</div>

		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Adresse</span>
				<input
					class="prop-input"
					bind:value={editAddress}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="Adresse..."
				/>
			</div>
		</div>

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
			<span>Erstellt: {formatDate(new Date(location.createdAt ?? ''))}</span>
			{#if location.updatedAt}
				<span>Bearbeitet: {formatDate(new Date(location.updatedAt))}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>

<style>
	.category-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.category-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
