<!--
  CityCorners — Workbench ListView
  Locations list grouped by category with favorites.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalLocation, LocalFavorite } from './types';
	import { CATEGORY_COLORS } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate }: ViewProps = $props();

	const locationsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalLocation>('ccLocations').toArray();
		return all.filter((l) => !l.deletedAt);
	}, [] as LocalLocation[]);

	const favoritesQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalFavorite>('ccFavorites').toArray();
		return all.filter((f) => !f.deletedAt);
	}, [] as LocalFavorite[]);

	const locations = $derived(locationsQuery.value);
	const favorites = $derived(favoritesQuery.value);

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

<BaseListView items={locations} getKey={(l) => l.id} emptyTitle="Keine Orte">
	{#snippet header()}
		<span>{locations.length} Orte</span>
		<span>{favorites.length} Favoriten</span>
	{/snippet}

	{#snippet item(location)}
		<button
			onclick={() =>
				navigate('detail', {
					locationId: location.id,
					_siblingIds: locations.map((l) => l.id),
					_siblingKey: 'locationId',
				})}
			class="flex w-full min-h-[44px] items-start gap-2 rounded-md px-2 py-2 transition-colors hover:bg-muted/50 cursor-pointer text-left"
		>
			<div
				class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
				style="background: {CATEGORY_COLORS[location.category] ??
					'hsl(var(--color-muted-foreground))'}"
			></div>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1">
					<p class="truncate text-sm text-foreground">{location.name}</p>
					{#if favoriteIds.has(location.id)}
						<span class="text-xs text-warning">&#9733;</span>
					{/if}
				</div>
				<p class="text-xs text-muted-foreground">
					{categoryLabels[location.category] ?? location.category}
				</p>
			</div>
		</button>
	{/snippet}
</BaseListView>
