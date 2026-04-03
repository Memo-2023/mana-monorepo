<!--
  CityCorners — Workbench ListView
  Locations list grouped by category with favorites.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalLocation, LocalFavorite } from './types';
	import { CATEGORY_COLORS } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate, goBack, params }: ViewProps = $props();

	let locations = $state<LocalLocation[]>([]);
	let favorites = $state<LocalFavorite[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalLocation>('ccLocations')
				.toArray()
				.then((all) => all.filter((l) => !l.deletedAt));
		}).subscribe((val) => {
			locations = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalFavorite>('ccFavorites')
				.toArray()
				.then((all) => all.filter((f) => !f.deletedAt));
		}).subscribe((val) => {
			favorites = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const favoriteIds = $derived(new Set(favorites.map((f) => f.locationId)));

	const categoryLabels: Record<string, string> = {
		sight: 'Sehenswürdigkeit',
		restaurant: 'Restaurant',
		shop: 'Laden',
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

<div class="flex h-full flex-col gap-3 p-4">
	<div class="flex gap-3 text-xs text-white/40">
		<span>{locations.length} Orte</span>
		<span>{favorites.length} Favoriten</span>
	</div>

	<div class="flex-1 overflow-auto">
		{#each locations as location (location.id)}
			<button
				onclick={() =>
					navigate('detail', {
						locationId: location.id,
						_siblingIds: locations.map((l) => l.id),
						_siblingKey: 'locationId',
					})}
				class="flex w-full items-start gap-2 rounded-md px-2 py-2 transition-colors hover:bg-white/5 cursor-pointer text-left"
			>
				<div
					class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
					style="background: {CATEGORY_COLORS[location.category] ?? '#666'}"
				></div>
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-1">
						<p class="truncate text-sm text-white/80">{location.name}</p>
						{#if favoriteIds.has(location.id)}
							<span class="text-xs text-yellow-400">&#9733;</span>
						{/if}
					</div>
					<p class="text-xs text-white/40">
						{categoryLabels[location.category] ?? location.category}
					</p>
				</div>
			</button>
		{/each}

		{#if locations.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Orte</p>
		{/if}
	</div>
</div>
