<script lang="ts">
	import { Plus, MapPin, User } from '@manacore/shared-icons';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		useAllCities,
		useAllLocations,
		searchCities,
		getLocationCountByCity,
		getPlatformStats,
		filterByCity,
		getCityStats,
	} from '$lib/modules/citycorners/queries';

	const allCities = useAllCities();
	const allLocations = useAllLocations();

	let searchQuery = $state('');

	let locationCounts = $derived(getLocationCountByCity(allLocations.value));
	let platformStats = $derived(getPlatformStats(allCities.value, allLocations.value));

	let filtered = $derived(searchCities(allCities.value, searchQuery));
</script>

<svelte:head>
	<title>{$_('app.name')} - {$_('app.tagline')}</title>
</svelte:head>

<header class="mb-6 flex items-start justify-between">
	<div>
		<h1 class="text-2xl font-bold text-foreground">{$_('cities.title')}</h1>
		<p class="text-foreground-secondary">{$_('cities.subtitle')}</p>
	</div>
	{#if authStore.isAuthenticated}
		<a
			href="/citycorners/add-city"
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
			title={$_('cities.add')}
		>
			<Plus size={20} weight="bold" />
		</a>
	{/if}
</header>

<!-- Platform stats -->
{#if platformStats.totalCities > 0}
	<div class="mb-6 flex flex-wrap gap-4 rounded-xl border border-border bg-background-card p-4">
		<div class="flex items-center gap-2">
			<span class="text-lg">🏙️</span>
			<div>
				<p class="text-lg font-semibold text-foreground">{platformStats.totalCities}</p>
				<p class="text-xs text-foreground-secondary">{$_('nav.cities')}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-lg">📍</span>
			<div>
				<p class="text-lg font-semibold text-foreground">{platformStats.totalLocations}</p>
				<p class="text-xs text-foreground-secondary">{$_('home.title')}</p>
			</div>
		</div>
		{#if platformStats.totalContributors > 0}
			<div class="flex items-center gap-2">
				<span class="text-lg">👥</span>
				<div>
					<p class="text-lg font-semibold text-foreground">{platformStats.totalContributors}</p>
					<p class="text-xs text-foreground-secondary">
						{$_('cities.totalContributors', {
							values: { count: platformStats.totalContributors },
						})}
					</p>
				</div>
			</div>
		{/if}
	</div>
{/if}

<!-- Search -->
<div class="mb-6">
	<input
		type="text"
		bind:value={searchQuery}
		placeholder={$_('cities.search')}
		class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
	/>
</div>

{#if filtered.length === 0}
	<div class="py-12 text-center">
		<span class="mb-2 block text-4xl">🏙️</span>
		<p class="text-foreground-secondary">{$_('cities.empty')}</p>
		{#if authStore.isAuthenticated}
			<a
				href="/citycorners/add-city"
				class="mt-3 inline-block text-sm text-primary hover:underline"
			>
				{$_('cities.add')}
			</a>
		{/if}
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each filtered as city}
			{@const count = locationCounts.get(city.id) || 0}
			{@const cityStats = getCityStats(filterByCity(allLocations.value, city.id))}
			<a
				href="/citycorners/cities/{city.slug}"
				class="group relative overflow-hidden rounded-xl border border-border bg-background-card transition-shadow hover:shadow-lg"
			>
				{#if city.imageUrl}
					<img
						src={city.imageUrl}
						alt={city.name}
						loading="lazy"
						class="h-40 w-full object-cover"
					/>
				{:else}
					<div
						class="flex h-40 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5"
					>
						<span class="text-5xl">🏙️</span>
					</div>
				{/if}

				<div class="p-4">
					<h2 class="text-lg font-semibold text-foreground group-hover:text-primary">
						{city.name}
					</h2>
					<p class="text-sm text-foreground-secondary">
						{#if city.state}
							{city.state}, {city.country}
						{:else}
							{city.country}
						{/if}
					</p>
					{#if city.description}
						<p class="mt-1 line-clamp-2 text-sm text-foreground-secondary/80">
							{city.description}
						</p>
					{/if}
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<span
							class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
						>
							<MapPin size={12} />
							{count}
						</span>
						{#if cityStats.contributorCount > 0}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400"
							>
								<User size={12} />
								{cityStats.contributorCount}
							</span>
						{/if}
						{#each cityStats.topCategories.slice(0, 2) as { category }}
							<span
								class="rounded-full bg-background-card-hover px-2 py-0.5 text-xs text-foreground-secondary"
							>
								{$_(`categories.${category}`)}
							</span>
						{/each}
					</div>
				</div>
			</a>
		{/each}
	</div>
{/if}
