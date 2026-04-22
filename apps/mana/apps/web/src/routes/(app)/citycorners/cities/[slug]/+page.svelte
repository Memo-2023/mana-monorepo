<script lang="ts">
	import { getContext } from 'svelte';
	import { CaretLeft, Plus, MapPin, MapTrifold, UsersThree, Heart } from '@mana/shared-icons';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		favoritesStore,
		useAllLocations,
		useAllFavorites,
		getFavoriteIds,
		filterByCity,
		filterByCategory,
		getCityStats,
		CATEGORY_KEYS,
	} from '$lib/modules/citycorners';
	import { isOpenNow } from '$lib/modules/citycorners/utils/opening-hours';
	import type { LocalCity } from '$lib/modules/citycorners/types';

	const cityCtx = getContext<{ value: LocalCity | undefined }>('currentCity');
	let city = $derived(cityCtx.value);

	const allLocations = useAllLocations();
	const allFavorites = useAllFavorites();
	let favoriteIds = $derived(getFavoriteIds(allFavorites.value));

	let selectedCategory = $state<string | null>(null);

	// Filter locations by city
	let cityLocations = $derived(city ? filterByCity(allLocations.value, city.id) : []);

	let categoryCounts = $derived(
		CATEGORY_KEYS.reduce(
			(acc, cat) => {
				acc[cat] = cityLocations.filter((l) => l.category === cat).length;
				return acc;
			},
			{} as Record<string, number>
		)
	);

	let filtered = $derived(filterByCategory(cityLocations, selectedCategory));
	let stats = $derived(getCityStats(cityLocations));

	let citySlug = $derived($page.params.slug);

	function handleFavoriteToggle(e: MouseEvent, locationId: string) {
		e.preventDefault();
		e.stopPropagation();
		favoritesStore.toggle(locationId);
	}
</script>

<svelte:head>
	<title>{city?.name || ''} - CityCorners</title>
</svelte:head>

<header class="mb-6 flex items-start justify-between">
	<div>
		<div class="mb-1 flex items-center gap-2">
			<a href="/citycorners" class="text-foreground-secondary hover:text-primary transition-colors">
				<CaretLeft size={16} />
			</a>
			<h1 class="text-2xl font-bold text-foreground">{city?.name}</h1>
		</div>
		<p class="text-foreground-secondary">
			{#if city?.state}
				{city.state}, {city.country}
			{:else}
				{city?.country}
			{/if}
		</p>
		{#if city?.description}
			<p class="mt-1 text-sm text-foreground-secondary/80">{city.description}</p>
		{/if}
	</div>
	<a
		href="/citycorners/cities/{citySlug}/add"
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-colors hover:bg-primary/90 hover:shadow-lg"
		title={$_('add.title')}
	>
		<Plus size={20} weight="bold" />
	</a>
</header>

<!-- City stats -->
{#if stats.locationCount > 0}
	<div class="mb-6 rounded-xl border border-border bg-background-card p-4">
		<div class="flex flex-wrap gap-6">
			<!-- Location count -->
			<div class="flex items-center gap-2">
				<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<MapPin size={20} />
				</div>
				<div>
					<p class="text-lg font-semibold text-foreground">{stats.locationCount}</p>
					<p class="text-xs text-foreground-secondary">
						{$_('cities.locationsCount', { values: { count: stats.locationCount } })}
					</p>
				</div>
			</div>

			<!-- On map -->
			{#if stats.hasCoordinates > 0}
				<div class="flex items-center gap-2">
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400"
					>
						<MapTrifold size={20} />
					</div>
					<div>
						<p class="text-lg font-semibold text-foreground">{stats.hasCoordinates}</p>
						<p class="text-xs text-foreground-secondary">
							{$_('cities.onMap', { values: { count: stats.hasCoordinates } })}
						</p>
					</div>
				</div>
			{/if}

			<!-- Contributors -->
			{#if stats.contributorCount > 0}
				<div class="flex items-center gap-2">
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"
					>
						<UsersThree size={20} />
					</div>
					<div>
						<p class="text-lg font-semibold text-foreground">{stats.contributorCount}</p>
						<p class="text-xs text-foreground-secondary">
							{$_('cities.contributors', { values: { count: stats.contributorCount } })}
						</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Top categories breakdown -->
		{#if stats.topCategories.length > 1}
			<div class="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
				{#each stats.topCategories as { category, count }}
					<span
						class="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs text-foreground-secondary"
					>
						{$_(`categories.${category}`)}
						<span class="font-medium text-foreground">{count}</span>
					</span>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- Category filter pills -->
<div class="mb-6 flex flex-wrap gap-2">
	<button
		class="rounded-full px-4 py-2 text-sm transition-colors {selectedCategory === null
			? 'bg-primary text-white'
			: 'bg-background-card text-foreground-secondary hover:bg-background-card-hover'}"
		onclick={() => (selectedCategory = null)}
	>
		{$_('home.all')} ({cityLocations.length})
	</button>
	{#each CATEGORY_KEYS as cat}
		{@const count = categoryCounts[cat] || 0}
		{#if count > 0}
			<button
				class="rounded-full px-4 py-2 text-sm transition-colors {selectedCategory === cat
					? 'bg-primary text-white'
					: 'bg-background-card text-foreground-secondary hover:bg-background-card-hover'}"
				onclick={() => (selectedCategory = cat)}
			>
				{$_(`categories.${cat}`)} ({count})
			</button>
		{/if}
	{/each}
</div>

{#if filtered.length === 0}
	<div class="py-12 text-center">
		<span class="mb-2 block text-4xl">📍</span>
		<p class="text-foreground-secondary">
			{#if selectedCategory}
				{$_('home.noResultsCategory', {
					values: { category: $_(`categories.${selectedCategory}`) },
				})}
			{:else}
				{$_('home.noResults')}
			{/if}
		</p>
		<a
			href="/citycorners/cities/{citySlug}/add"
			class="mt-3 inline-block text-sm text-primary hover:underline"
		>
			{$_('home.addFirst')}
		</a>
	</div>
{:else}
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each filtered as location}
			<a
				href="/citycorners/cities/{citySlug}/locations/{location.id}"
				class="group relative overflow-hidden rounded-xl border border-border bg-background-card transition-shadow hover:shadow-lg"
			>
				{#if location.imageUrl}
					<img
						src={location.imageUrl}
						alt={location.name}
						loading="lazy"
						class="h-48 w-full object-cover"
					/>
				{:else}
					<div class="flex h-48 items-center justify-center bg-background-card-hover">
						<span class="text-4xl">📍</span>
					</div>
				{/if}

				{#if authStore.isAuthenticated}
					<button
						class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-colors hover:bg-black/50"
						onclick={(e) => handleFavoriteToggle(e, location.id)}
						title={favoriteIds.has(location.id) ? $_('favorites.remove') : $_('favorites.add')}
					>
						{#if favoriteIds.has(location.id)}
							<Heart size={20} weight="fill" class="text-red-500" />
						{:else}
							<Heart size={20} class="text-white" />
						{/if}
					</button>
				{/if}

				<div class="p-4">
					<div class="mb-1 flex flex-wrap items-center gap-1.5">
						<span class="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
							{$_(`categories.${location.category}`)}
						</span>
					</div>
					<h2 class="text-lg font-semibold text-foreground group-hover:text-primary">
						{location.name}
					</h2>
					{#if location.description}
						<p class="mt-1 line-clamp-2 text-sm text-foreground-secondary">
							{location.description}
						</p>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{/if}
