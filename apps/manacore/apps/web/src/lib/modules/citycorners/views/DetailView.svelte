<!--
  CityCorners — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { favoritesStore } from '../stores/favorites.svelte';
	import { toastStore } from '@manacore/shared-ui/toast';
	import { Star, Trash } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalLocation, LocalFavorite } from '../types';
	import { CATEGORY_COLORS } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let locationId = $derived(params.locationId as string);

	let location = $state<LocalLocation | null>(null);
	let isFavorite = $state(false);
	let confirmDelete = $state(false);

	// Edit fields
	let editName = $state('');
	let editCategory = $state<LocalLocation['category']>('sight');
	let editDescription = $state('');
	let editAddress = $state('');

	let focused = $state(false);

	$effect(() => {
		locationId;
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalLocation>('ccLocations').get(locationId)).subscribe(
			(val) => {
				location = val ?? null;
				if (val && !focused) {
					editName = val.name;
					editCategory = val.category;
					editDescription = val.description ?? '';
					editAddress = val.address ?? '';
				}
			}
		);
		return () => sub.unsubscribe();
	});

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
		focused = false;
		await db.table('ccLocations').update(locationId, {
			name: editName.trim() || location?.name || 'Ohne Name',
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
		const id = locationId;
		await db.table('ccLocations').update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		goBack();
		toastStore.undo('Ort gelöscht', () => {
			db.table('ccLocations').update(id, {
				deletedAt: undefined,
				updatedAt: new Date().toISOString(),
			});
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

<div class="detail-view">
	{#if !location}
		<p class="empty">Ort nicht gefunden</p>
	{:else}
		<!-- Title row with favorite -->
		<div class="title-row">
			<input
				class="title-input"
				bind:value={editName}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Name..."
			/>
			<button class="fav-btn" onclick={toggleFavorite}>
				<Star size={18} weight={isFavorite ? 'fill' : 'regular'} />
			</button>
		</div>

		<!-- Category dot -->
		<div class="category-row">
			<div class="category-dot" style="background: {CATEGORY_COLORS[editCategory] ?? '#666'}"></div>
			<select class="prop-select" bind:value={editCategory} onchange={handleCategoryChange}>
				{#each Object.entries(categoryLabels) as [key, label]}
					<option value={key}>{label}</option>
				{/each}
			</select>
		</div>

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">Adresse</span>
				<input
					class="prop-input address-input"
					bind:value={editAddress}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Adresse..."
				/>
			</div>
		</div>

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
			<span>Erstellt: {new Date(location.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if location.updatedAt}
				<span>Bearbeitet: {new Date(location.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Ort wirklich löschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteLocation}>Löschen</button>
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
	.title-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .title-input {
		color: #f3f4f6;
	}
	:global(.dark) .title-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.fav-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0.125rem;
		color: #eab308;
		flex-shrink: 0;
		transition: transform 0.15s;
	}
	.fav-btn:hover {
		transform: scale(1.15);
	}

	/* Category row */
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
	.address-input {
		flex: 1;
		min-width: 0;
		margin-left: 0.5rem;
		text-align: right;
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
