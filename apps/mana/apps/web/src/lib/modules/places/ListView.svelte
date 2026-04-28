<!--
  Places — Workbench ListView
  Location tracking toggle, place list with search + quick create.
-->
<script lang="ts">
	import type { Place } from './types';
	import { useAllPlaces } from './queries';
	import { placesStore } from './stores/places.svelte';
	import { trackingStore } from './stores/tracking.svelte';
	import {
		searchAddressDetailed,
		reverseGeocode,
		formatAddress,
		formatLocality,
		formatFullAddress,
		type GeocodingNotice,
		type GeocodingResult,
	} from '$lib/geocoding';
	import { _ } from 'svelte-i18n';
	import { Star, MapPin, Plus, PencilSimple, Trash, MagnifyingGlass } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { dropTarget, dragSource } from '@mana/shared-ui/dnd';
	import type { TagDragData } from '@mana/shared-ui/dnd';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import { addTagId } from '$lib/data/tag-mutations';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';

	let { navigate, goBack, params }: ViewProps = $props();

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	function handleTagDrop(placeId: string, tagData: TagDragData) {
		const place = places.find((p) => p.id === placeId);
		if (!place) return;
		void addTagId(place.tagIds ?? [], tagData.id, (next) =>
			placesStore.updateTagIds(placeId, next)
		);
	}

	const placesQuery = useAllPlaces();
	let places = $derived(placesQuery.value);
	let search = $state('');

	const filtered = $derived.by(() => {
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

	// --- Reverse geocode of current tracking position ---
	// When tracking is active we have fresh coordinates every few seconds, but
	// the GeolocationPosition object is replaced on every update. We debounce
	// by ~1.5 s and round to ~10 m precision so we only hit the geocoding
	// service when the user has actually moved, not on every micro-jitter.
	let currentLocationResult = $state<GeocodingResult | null>(null);
	let lastReverseKey = '';
	let reverseDebounce: ReturnType<typeof setTimeout> | undefined;

	// Inline editing: user can tap the location label, type a different
	// address, and pick an autocomplete suggestion. Useful when GPS snaps
	// to a nearby building but the user is actually next door.
	let editingLocation = $state(false);
	let locationDraft = $state('');
	let locationSuggestions = $state<GeocodingResult[]>([]);
	let locationNotice = $state<GeocodingNotice | undefined>(undefined);
	let showLocationSuggestions = $state(false);
	let locationDebounce: ReturnType<typeof setTimeout> | undefined;
	let locationInputEl = $state<HTMLInputElement | null>(null);

	const currentLocationFull = $derived(
		currentLocationResult ? formatFullAddress(currentLocationResult) : null
	);
	const currentLocationName = $derived(
		currentLocationResult
			? currentLocationResult.name || formatLocality(currentLocationResult)
			: null
	);

	$effect(() => {
		const pos = trackingStore.currentPosition;
		if (!pos) {
			currentLocationResult = null;
			lastReverseKey = '';
			return;
		}
		if (editingLocation) return; // don't clobber user typing

		// Round to ~10 m precision (4 decimal places) so we don't re-fetch
		// on every tiny coordinate drift while standing still.
		const lat = pos.coords.latitude.toFixed(4);
		const lon = pos.coords.longitude.toFixed(4);
		const key = `${lat},${lon}`;
		if (key === lastReverseKey) return;
		lastReverseKey = key;

		clearTimeout(reverseDebounce);
		reverseDebounce = setTimeout(async () => {
			const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
			if (result) {
				currentLocationResult = result;
			}
		}, 1500);
	});

	function startEditLocation() {
		locationDraft = currentLocationFull ?? '';
		editingLocation = true;
		queueMicrotask(() => {
			locationInputEl?.focus();
			locationInputEl?.select();
		});
	}

	function cancelEditLocation() {
		editingLocation = false;
		showLocationSuggestions = false;
		locationSuggestions = [];
		locationNotice = undefined;
		locationDraft = '';
	}

	function onLocationDraftInput() {
		clearTimeout(locationDebounce);
		const q = locationDraft.trim();
		if (q.length < 2) {
			locationSuggestions = [];
			locationNotice = undefined;
			showLocationSuggestions = false;
			return;
		}
		locationDebounce = setTimeout(async () => {
			const pos = trackingStore.currentPosition;
			const outcome = await searchAddressDetailed(q, {
				limit: 6,
				focusLat: pos?.coords.latitude,
				focusLon: pos?.coords.longitude,
			});
			locationSuggestions = outcome.results;
			locationNotice = outcome.notice;
			// Show the dropdown when we have results OR when we have a
			// notice to display (sensitive-query-blocked queries return
			// empty results but should still surface the explainer).
			showLocationSuggestions = outcome.results.length > 0 || !!outcome.notice;
		}, 250);
	}

	function selectLocationSuggestion(result: GeocodingResult) {
		currentLocationResult = result;
		editingLocation = false;
		showLocationSuggestions = false;
		locationSuggestions = [];
	}

	function onLocationKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') cancelEditLocation();
	}

	// --- Address autocomplete ---
	let addressQuery = $state('');
	let suggestions = $state<GeocodingResult[]>([]);
	let suggestionsNotice = $state<GeocodingNotice | undefined>(undefined);
	let showSuggestions = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	function onAddressInput() {
		clearTimeout(debounceTimer);
		if (addressQuery.trim().length < 2) {
			suggestions = [];
			suggestionsNotice = undefined;
			showSuggestions = false;
			return;
		}
		debounceTimer = setTimeout(async () => {
			const focusLat = trackingStore.currentPosition?.coords.latitude;
			const focusLon = trackingStore.currentPosition?.coords.longitude;
			const outcome = await searchAddressDetailed(addressQuery, {
				limit: 6,
				focusLat,
				focusLon,
			});
			suggestions = outcome.results;
			suggestionsNotice = outcome.notice;
			// Same as the tracking-edit input: show the dropdown when we
			// have either results OR a notice. A sensitive query with
			// empty results still needs to surface the explainer.
			showSuggestions = outcome.results.length > 0 || !!outcome.notice;
		}, 300);
	}

	async function selectSuggestion(result: GeocodingResult) {
		showSuggestions = false;
		addressQuery = '';
		const place = await placesStore.createPlace({
			name: result.name || result.label,
			latitude: result.latitude,
			longitude: result.longitude,
			address: formatAddress(result.address),
			category: result.category,
		});
		navigate('detail', { placeId: place.id });
	}

	function onAddressKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			showSuggestions = false;
		}
	}

	function onAddressBlur() {
		// Delay to allow click on suggestion
		setTimeout(() => {
			showSuggestions = false;
		}, 200);
	}

	// Quick create (manual name)
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
		const ids = filtered.map((p) => p.id);
		navigate('detail', { placeId, _siblingIds: ids, _siblingKey: 'placeId' });
	}

	const ctxMenu = useItemContextMenu<Place>();

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'open',
						label: 'Öffnen',
						icon: PencilSimple,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) openDetail(target.id);
						},
					},
					{
						id: 'favorite',
						label: ctxMenu.state.target.isFavorite ? 'Favorit entfernen' : 'Als Favorit',
						icon: Star,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) placesStore.toggleFavorite(target.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) placesStore.deletePlace(target.id);
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
				<div class="tracking-location">
					{#if editingLocation}
						<div class="tracking-edit-wrapper">
							<input
								bind:this={locationInputEl}
								class="tracking-edit-input"
								type="text"
								bind:value={locationDraft}
								oninput={onLocationDraftInput}
								onkeydown={onLocationKeydown}
								onblur={() => setTimeout(cancelEditLocation, 200)}
								placeholder="Adresse suchen..."
							/>
							{#if showLocationSuggestions}
								<div class="tracking-suggestions">
									{#if locationNotice === 'sensitive_local_unavailable'}
										<div class="suggestion-notice notice-sensitive">
											<div class="suggestion-notice-title">
												{$_('places.geocoding_notice.sensitive_local_unavailable_title')}
											</div>
											<div class="suggestion-notice-body">
												{$_('places.geocoding_notice.sensitive_local_unavailable_body')}
											</div>
										</div>
									{:else if locationNotice === 'fallback_used'}
										<div
											class="suggestion-notice notice-fallback"
											title={$_('places.geocoding_notice.fallback_used_title')}
										>
											{$_('places.geocoding_notice.fallback_used_badge')}
										</div>
									{/if}
									{#each locationSuggestions as result}
										<button
											type="button"
											class="tracking-suggestion"
											onclick={() => selectLocationSuggestion(result)}
										>
											<div class="tracking-suggestion-name">
												{result.name || formatLocality(result)}
											</div>
											<div class="tracking-suggestion-full">
												{formatFullAddress(result)}
											</div>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<button
							type="button"
							class="tracking-display"
							onclick={startEditLocation}
							title="Adresse bearbeiten"
						>
							{#if currentLocationName}
								<span class="tracking-label">
									<MapPin size={10} weight="fill" />
									{currentLocationName}
								</span>
							{/if}
							{#if currentLocationFull}
								<span class="tracking-address">{currentLocationFull}</span>
							{:else}
								<span class="tracking-coords">
									{formatCoords(
										trackingStore.currentPosition.coords.latitude,
										trackingStore.currentPosition.coords.longitude
									)}
								</span>
							{/if}
						</button>
					{/if}
				</div>
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

	<!-- Address Search (Geocoding) -->
	<div class="address-search">
		<div class="address-input-row">
			<MagnifyingGlass size={14} class="address-icon" />
			<input
				class="address-input"
				type="text"
				placeholder="Adresse suchen..."
				bind:value={addressQuery}
				oninput={onAddressInput}
				onkeydown={onAddressKeydown}
				onblur={onAddressBlur}
				onfocus={() => {
					if (suggestions.length > 0) showSuggestions = true;
				}}
			/>
		</div>
		{#if showSuggestions}
			<div class="suggestions">
				{#if suggestionsNotice === 'sensitive_local_unavailable'}
					<div class="suggestion-notice notice-sensitive">
						<div class="suggestion-notice-title">
							{$_('places.geocoding_notice.sensitive_local_unavailable_title')}
						</div>
						<div class="suggestion-notice-body">
							{$_('places.geocoding_notice.sensitive_local_unavailable_body')}
						</div>
					</div>
				{:else if suggestionsNotice === 'fallback_used'}
					<div
						class="suggestion-notice notice-fallback"
						title={$_('places.geocoding_notice.fallback_used_title')}
					>
						{$_('places.geocoding_notice.fallback_used_badge')}
					</div>
				{/if}
				{#each suggestions as result}
					<button class="suggestion-item" onclick={() => selectSuggestion(result)}>
						<div class="suggestion-icon">
							<MapPin size={14} />
						</div>
						<div class="suggestion-info">
							<span class="suggestion-name">{result.name || result.label}</span>
							<span class="suggestion-address">{formatAddress(result.address)}</span>
						</div>
						{#if result.category !== 'other'}
							<span class="suggestion-category"
								>{CATEGORY_LABELS[result.category] ?? result.category}</span
							>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Quick Create (manual) -->
	<div class="create-row">
		<input
			class="create-input"
			type="text"
			placeholder="Oder manuell erstellen..."
			bind:value={newName}
			onkeydown={handleKeydown}
		/>
		<button class="create-btn" onclick={createPlace} disabled={!newName.trim()}>
			<Plus size={14} />
		</button>
	</div>

	<!-- Place List -->
	<div class="place-list">
		{#each filtered as place (place.id)}
			{@const tags = getTagsByIds(allTags, place.tagIds ?? [])}
			<button
				class="place-item"
				onclick={() => openDetail(place.id)}
				oncontextmenu={(e) => ctxMenu.open(e, place)}
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
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenuItems}
		onClose={ctxMenu.close}
	/>

	{#if filtered.length === 0 && !search}
		<div class="empty">
			<p>Noch keine Orte gespeichert.</p>
			<p class="empty-hint">Starte das Tracking oder erstelle einen Ort manuell.</p>
		</div>
	{/if}

	{#if filtered.length === 0 && search}
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
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
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
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
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

	.tracking-location {
		flex: 1;
		min-width: 0;
		display: flex;
		justify-content: flex-end;
		position: relative;
	}

	.tracking-display {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.0625rem;
		min-width: 0;
		max-width: 100%;
		padding: 0.25rem 0.375rem;
		border-radius: 0.375rem;
		border: 1px solid transparent;
		background: transparent;
		cursor: pointer;
		text-align: right;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.tracking-display:hover {
		background: rgba(14, 165, 233, 0.06);
		border-color: rgba(14, 165, 233, 0.2);
	}

	.tracking-label {
		display: inline-flex;
		align-items: center;
		gap: 0.1875rem;
		font-size: 0.75rem;
		color: #0ea5e9;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 220px;
	}

	.tracking-address {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 260px;
	}

	.tracking-coords {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.tracking-edit-wrapper {
		position: relative;
		min-width: 240px;
		max-width: 320px;
		flex: 1;
	}

	.tracking-edit-input {
		width: 100%;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid #0ea5e9;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		outline: none;
	}

	.tracking-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.25rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
		z-index: 60;
		overflow: hidden;
		max-height: 280px;
		overflow-y: auto;
	}

	.tracking-suggestion {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		padding: 0.375rem 0.5rem;
		width: 100%;
		border: none;
		background: transparent;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		text-align: left;
	}

	.tracking-suggestion:hover {
		background: hsl(var(--color-muted));
	}

	.tracking-suggestion + .tracking-suggestion {
		border-top: 1px solid hsl(var(--color-border) / 0.5);
	}

	.tracking-suggestion-name {
		font-size: 0.75rem;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tracking-suggestion-full {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		outline: none;
	}

	.search-input:focus {
		border-color: #0ea5e9;
	}

	.search-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Address Search ───────────────────────── */
	.address-search {
		position: relative;
	}

	.address-input-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		transition: border-color 0.15s;
	}

	.address-input-row:focus-within {
		border-color: #0ea5e9;
	}

	.address-input-row :global(.address-icon) {
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.address-input {
		flex: 1;
		border: none;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		outline: none;
	}

	.address-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.25rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 50;
		overflow: hidden;
	}

	.suggestion-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		width: 100%;
		border: none;
		background: transparent;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
	}

	.suggestion-item:hover {
		background: hsl(var(--color-muted));
	}

	.suggestion-item + .suggestion-item {
		border-top: 1px solid hsl(var(--color-border) / 0.5);
	}

	/* ── Privacy notices in suggestion dropdown ─────────────────
	   Two visual styles:
	   - notice-sensitive: full explainer block (sensitive query was
	     blocked from public APIs). Soft amber tone.
	   - notice-fallback: tiny right-aligned badge (results came from
	     a public-API fallback). Muted footer style. */
	.suggestion-notice {
		padding: 0.5rem 0.625rem;
		font-size: 0.75rem;
	}
	.notice-sensitive {
		background: hsl(40 90% 96%);
		color: hsl(40 80% 24%);
		border-bottom: 1px solid hsl(40 60% 85%);
	}
	:global(.dark) .notice-sensitive {
		background: hsl(40 30% 16%);
		color: hsl(40 80% 78%);
		border-bottom-color: hsl(40 30% 28%);
	}
	.suggestion-notice-title {
		font-weight: 600;
		margin-bottom: 0.125rem;
	}
	.suggestion-notice-body {
		font-size: 0.6875rem;
		line-height: 1.4;
	}
	.notice-fallback {
		text-align: right;
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
		padding: 0.25rem 0.625rem;
		background: hsl(var(--color-muted) / 0.3);
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
	}

	.suggestion-icon {
		color: #0ea5e9;
		flex-shrink: 0;
	}

	.suggestion-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		min-width: 0;
	}

	.suggestion-name {
		font-size: 0.8125rem;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.suggestion-address {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.suggestion-category {
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		background: rgba(14, 165, 233, 0.1);
		color: #0ea5e9;
		font-size: 0.5625rem;
		font-weight: 500;
		flex-shrink: 0;
		white-space: nowrap;
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
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		outline: none;
	}

	.create-input:focus {
		border-color: #0ea5e9;
	}

	.create-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.create-btn {
		padding: 0.375rem 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
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
		color: hsl(var(--color-foreground));
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
		width: 100%;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}

	.place-item:hover {
		background: hsl(var(--color-muted));
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
		color: hsl(var(--color-muted-foreground));
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
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	/* ── Empty ────────────────────────────────── */
	.empty {
		text-align: center;
		color: hsl(var(--color-muted-foreground));
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
