<!--
  Places — Workbench ListView
  Location tracking toggle, place list with search + quick create.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalPlace } from './types';
	import { placesStore } from './stores/places.svelte';
	import { trackingStore } from './stores/tracking.svelte';
	import { Star, MapPin, Plus, PencilSimple, Trash } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { dropTarget, dragSource } from '@manacore/shared-ui/dnd';
	import type { TagDragData } from '@manacore/shared-ui/dnd';
	import { useAllTags, getTagsByIds } from '$lib/stores/tags.svelte';

	let { navigate, goBack, params }: ViewProps = $props();

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	function handleTagDrop(placeId: string, tagData: TagDragData) {
		const place = places.find((p) => p.id === placeId);
		if (!place) return;
		const current = place.tagIds ?? [];
		if (!current.includes(tagData.id)) {
			placesStore.updateTagIds(placeId, [...current, tagData.id]);
		}
	}

	let places = $state<LocalPlace[]>([]);
	let search = $state('');

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalPlace>('places')
				.toArray()
				.then((all) => all.filter((p) => !p.deletedAt && !p.isArchived));
		}).subscribe((val) => {
			places = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const filtered = $derived(() => {
		if (!search.trim()) return places;
		const q = search.toLowerCase();
		return places.filter(
			(p) =>
				p.name?.toLowerCase().includes(q) ||
				p.address?.toLowerCase().includes(q) ||
				p.category?.toLowerCase().includes(q)
		);
	});

	const CATEGORY_LABELS: Record<string, string> = {
		home: 'Zuhause',
		work: 'Arbeit',
		food: 'Essen',
		shopping: 'Einkauf',
		transit: 'Transit',
		leisure: 'Freizeit',
		other: 'Sonstiges',
	};

	// Quick create
	let newName = $state('');

	async function createPlace() {
		const name = newName.trim();
		if (!name) return;

		// Use current position if tracking, otherwise default to 0,0
		const lat = trackingStore.currentPosition?.coords.latitude ?? 0;
		const lng = trackingStore.currentPosition?.coords.longitude ?? 0;

		const place = await placesStore.createPlace({ name, latitude: lat, longitude: lng });
		newName = '';
		navigate('detail', { placeId: place.id });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			createPlace();
		}
	}

	function openDetail(placeId: string) {
		const ids = filtered().map((p) => p.id);
		navigate('detail', { placeId, _siblingIds: ids, _siblingKey: 'placeId' });
	}

	// Context menu
	let ctxMenu = $state<{ visible: boolean; x: number; y: number; place: LocalPlace | null }>({
		visible: false,
		x: 0,
		y: 0,
		place: null,
	});

	function handleItemContextMenu(e: MouseEvent, place: LocalPlace) {
		e.preventDefault();
		ctxMenu = { visible: true, x: e.clientX, y: e.clientY, place };
	}

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.place
			? [
					{
						id: 'open',
						label: 'Öffnen',
						icon: PencilSimple,
						action: () => {
							if (ctxMenu.place) openDetail(ctxMenu.place.id);
						},
					},
					{
						id: 'favorite',
						label: ctxMenu.place.isFavorite ? 'Favorit entfernen' : 'Als Favorit',
						icon: Star,
						action: () => {
							if (ctxMenu.place) placesStore.toggleFavorite(ctxMenu.place.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							if (ctxMenu.place) placesStore.deletePlace(ctxMenu.place.id);
						},
					},
				]
			: []
	);

	function formatCoords(lat: number, lng: number): string {
		return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
	}
</script>

<div class="places-list-view">
	<!-- Tracking Section -->
	<div class="tracking-section">
		<div class="tracking-row">
			<button
				class="tracking-toggle"
				class:active={trackingStore.isTracking}
				onclick={() =>
					trackingStore.isTracking ? trackingStore.stopTracking() : trackingStore.startTracking()}
			>
				<span class="tracking-dot" class:pulse={trackingStore.isTracking}></span>
				{trackingStore.isTracking ? 'Tracking aktiv' : 'Tracking starten'}
			</button>
			{#if trackingStore.currentPosition}
				<span class="tracking-coords">
					{formatCoords(
						trackingStore.currentPosition.coords.latitude,
						trackingStore.currentPosition.coords.longitude
					)}
				</span>
			{/if}
		</div>
		{#if trackingStore.error}
			<span class="tracking-error">{trackingStore.error}</span>
		{/if}
	</div>

	<!-- Search -->
	<div class="search-row">
		<input class="search-input" type="text" placeholder="Orte suchen..." bind:value={search} />
	</div>

	<!-- Quick Create -->
	<div class="create-row">
		<input
			class="create-input"
			type="text"
			placeholder="Neuen Ort erstellen..."
			bind:value={newName}
			onkeydown={handleKeydown}
		/>
		<button class="create-btn" onclick={createPlace} disabled={!newName.trim()}>
			<Plus size={14} />
		</button>
	</div>

	<!-- Place List -->
	<div class="place-list">
		{#each filtered() as place (place.id)}
			{@const tags = getTagsByIds(allTags, place.tagIds ?? [])}
			<button
				class="place-item"
				onclick={() => openDetail(place.id)}
				oncontextmenu={(e) => handleItemContextMenu(e, place)}
				use:dropTarget={{
					accepts: ['tag'],
					onDrop: (payload) => handleTagDrop(place.id, payload.data as unknown as TagDragData),
				}}
				use:dragSource={{
					type: 'place',
					data: () => ({ ...place }),
				}}
			>
				<div class="place-icon">
					<MapPin size={16} />
				</div>
				<div class="place-info">
					<span class="place-name">
						{place.name}
						{#if place.isFavorite}
							<Star size={10} weight="fill" class="fav-star" />
						{/if}
					</span>
					<span class="place-meta">
						{#if place.category}
							<span class="category-badge">{CATEGORY_LABELS[place.category] ?? place.category}</span
							>
						{/if}
						{#if place.latitude && place.longitude}
							<span class="coords">{formatCoords(place.latitude, place.longitude)}</span>
						{/if}
					</span>
					{#if tags.length > 0}
						<div class="place-tags">
							{#each tags as tag (tag.id)}
								<span class="tag-dot" style="background: {tag.color}" title={tag.name}></span>
							{/each}
						</div>
					{/if}
				</div>
				<div class="place-stats">
					{#if (place.visitCount ?? 0) > 0}
						<span class="visit-count">{place.visitCount}x</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<ContextMenu
		visible={ctxMenu.visible}
		x={ctxMenu.x}
		y={ctxMenu.y}
		items={ctxMenuItems}
		onClose={() => (ctxMenu = { ...ctxMenu, visible: false, place: null })}
	/>

	{#if filtered().length === 0 && !search}
		<div class="empty">
			<p>Noch keine Orte gespeichert.</p>
			<p class="empty-hint">Starte das Tracking oder erstelle einen Ort manuell.</p>
		</div>
	{/if}

	{#if filtered().length === 0 && search}
		<div class="empty">
			<p>Keine Orte gefunden.</p>
		</div>
	{/if}
</div>

<style>
	.places-list-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	/* ── Tracking ──────────────────────────────── */
	.tracking-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem;
		border-radius: 0.75rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
	}

	.tracking-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tracking-toggle {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
		background: transparent;
		color: var(--color-foreground);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.tracking-toggle.active {
		background: rgba(14, 165, 233, 0.1);
		border-color: rgba(14, 165, 233, 0.3);
		color: #0ea5e9;
	}

	.tracking-toggle:hover {
		border-color: #0ea5e9;
	}

	.tracking-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: #6b7280;
		flex-shrink: 0;
	}

	.tracking-dot.pulse {
		background: #0ea5e9;
		animation: dot-pulse 2s ease-in-out infinite;
	}

	.tracking-coords {
		font-size: 0.6875rem;
		color: var(--color-muted-foreground);
		font-variant-numeric: tabular-nums;
	}

	.tracking-error {
		font-size: 0.6875rem;
		color: #ef4444;
	}

	/* ── Search ───────────────────────────────── */
	.search-row {
		display: flex;
	}

	.search-input {
		flex: 1;
		padding: 0.375rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: transparent;
		color: var(--color-foreground);
		font-size: 0.8125rem;
		outline: none;
	}

	.search-input:focus {
		border-color: #0ea5e9;
	}

	.search-input::placeholder {
		color: var(--color-muted-foreground);
	}

	/* ── Quick Create ─────────────────────────── */
	.create-row {
		display: flex;
		gap: 0.375rem;
	}

	.create-input {
		flex: 1;
		padding: 0.375rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: transparent;
		color: var(--color-foreground);
		font-size: 0.8125rem;
		outline: none;
	}

	.create-input:focus {
		border-color: #0ea5e9;
	}

	.create-input::placeholder {
		color: var(--color-muted-foreground);
	}

	.create-btn {
		padding: 0.375rem 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: transparent;
		color: var(--color-foreground);
		cursor: pointer;
		display: flex;
		align-items: center;
		transition: all 0.15s;
	}

	.create-btn:hover:not(:disabled) {
		background: rgba(14, 165, 233, 0.1);
		border-color: #0ea5e9;
		color: #0ea5e9;
	}

	.create-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	/* ── Place List ───────────────────────────── */
	.place-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.place-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		border: none;
		background: transparent;
		color: var(--color-foreground);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
		width: 100%;
	}

	.place-item:hover {
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
	}

	.place-icon {
		color: #0ea5e9;
		display: flex;
		flex-shrink: 0;
	}

	.place-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.place-name {
		font-size: 0.8125rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.place-name :global(.fav-star) {
		color: #f59e0b;
		flex-shrink: 0;
	}

	.place-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.6875rem;
		color: var(--color-muted-foreground);
	}

	.category-badge {
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		background: rgba(14, 165, 233, 0.1);
		color: #0ea5e9;
		font-size: 0.625rem;
		font-weight: 500;
	}

	.coords {
		font-variant-numeric: tabular-nums;
	}

	.place-tags {
		display: flex;
		gap: 0.25rem;
	}

	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.place-stats {
		flex-shrink: 0;
	}

	.visit-count {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color-muted-foreground);
		font-variant-numeric: tabular-nums;
	}

	/* ── Empty ────────────────────────────────── */
	.empty {
		text-align: center;
		color: var(--color-muted-foreground);
		font-size: 0.8125rem;
		padding: 2rem 0;
	}

	.empty-hint {
		font-size: 0.75rem;
		opacity: 0.7;
		margin-top: 0.25rem;
	}

	@keyframes dot-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	@media (max-width: 640px) {
		.places-list-view {
			padding: 0.5rem;
		}
		.place-item {
			padding: 0.625rem;
			min-height: 44px;
		}
	}
</style>
