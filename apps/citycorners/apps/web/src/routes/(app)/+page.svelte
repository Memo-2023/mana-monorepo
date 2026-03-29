<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		useAllCities,
		useAllLocations,
		searchCities,
		getLocationCountByCity,
	} from '$lib/data/queries';

	const allCities = useAllCities();
	const allLocations = useAllLocations();

	let searchQuery = $state('');

	let locationCounts = $derived(getLocationCountByCity(allLocations.value));

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
			href="/add-city"
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
			title={$_('cities.add')}
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
		</a>
	{/if}
</header>

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
			<a href="/add-city" class="mt-3 inline-block text-sm text-primary hover:underline">
				{$_('cities.add')}
			</a>
		{/if}
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each filtered as city}
			<a
				href="/cities/{city.slug}"
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
					<div class="mt-2 text-xs text-foreground-secondary/60">
						{@const count = locationCounts.get(city.id) || 0}
						{#if count > 0}
							{$_('cities.locationsCount', { values: { count } })}
						{:else}
							{$_('cities.noLocationsYet')}
						{/if}
					</div>
				</div>
			</a>
		{/each}
	</div>
{/if}
