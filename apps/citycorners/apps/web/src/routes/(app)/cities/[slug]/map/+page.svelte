<script lang="ts">
	import { getContext } from 'svelte';
	import { CaretLeft, GlobeSimple } from '@manacore/shared-icons';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { useAllLocations, filterByCity } from '$lib/data/queries';
	import type { LocalCity } from '$lib/data/local-store';

	const cityCtx = getContext<{ value: LocalCity | undefined }>('currentCity');
	let city = $derived(cityCtx.value);
	let citySlug = $derived($page.params.slug);

	const allLocations = useAllLocations();
	let cityLocations = $derived(city ? filterByCity(allLocations.value, city.id) : []);
	let selectedCategory = $state<string | null>(null);

	const categoryKeys = [
		'sight',
		'restaurant',
		'shop',
		'museum',
		'cafe',
		'bar',
		'park',
		'beach',
		'hotel',
		'event_venue',
		'viewpoint',
	];

	const categoryColors: Record<string, string> = {
		sight: '#2563eb',
		restaurant: '#dc2626',
		shop: '#16a34a',
		museum: '#9333ea',
		cafe: '#b45309',
		bar: '#ea580c',
		park: '#15803d',
		beach: '#0891b2',
		hotel: '#4f46e5',
		event_venue: '#db2777',
		viewpoint: '#0ea5e9',
	};

	let filtered = $derived(
		selectedCategory ? cityLocations.filter((l) => l.category === selectedCategory) : cityLocations
	);

	let lat = $derived(city?.latitude ?? 47.6603);
	let lng = $derived(city?.longitude ?? 9.1757);

	let mapSrc = $derived(
		`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.015},${lng + 0.02},${lat + 0.015}&layer=mapnik&marker=${lat},${lng}`
	);
</script>

<svelte:head>
	<title>{$_('map.title')} - {city?.name || 'CityCorners'}</title>
</svelte:head>

<div class="map-page">
	<header class="mb-4 flex items-start justify-between">
		<div>
			<div class="flex items-center gap-2">
				<a
					href="/cities/{citySlug}"
					class="text-foreground-secondary hover:text-primary transition-colors"
				>
					<CaretLeft size={16} />
				</a>
				<h1 class="text-2xl font-bold text-foreground">{$_('map.title')}</h1>
			</div>
			<p class="text-foreground-secondary">{city?.name} - {$_('map.subtitle')}</p>
		</div>
		<a
			href="https://www.openstreetmap.org/#map=14/{lat}/{lng}"
			target="_blank"
			rel="noopener noreferrer"
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background-card border border-border text-foreground-secondary shadow-sm transition-all hover:text-primary hover:border-primary"
			title={$_('map.openInMaps')}
		>
			<GlobeSimple size={20} />
		</a>
	</header>

	<div class="mb-4 flex flex-wrap gap-2">
		<button
			class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors {selectedCategory ===
			null
				? 'bg-primary text-white'
				: 'bg-background-card text-foreground-secondary hover:bg-background-card-hover border border-border'}"
			onclick={() => (selectedCategory = null)}
		>
			{$_('map.filterAll')}
		</button>
		{#each categoryKeys as cat}
			<button
				class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors {selectedCategory ===
				cat
					? 'bg-primary text-white'
					: 'bg-background-card text-foreground-secondary hover:bg-background-card-hover border border-border'}"
				onclick={() => (selectedCategory = selectedCategory === cat ? null : cat)}
			>
				<div class="w-2.5 h-2.5 rounded-full" style="background:{categoryColors[cat]}"></div>
				{$_(`category.${cat}`)}
			</button>
		{/each}
	</div>

	<div class="map-container rounded-xl overflow-hidden border border-border">
		{#if browser}
			<iframe
				title="Map"
				src={mapSrc}
				class="w-full h-full border-0"
				loading="lazy"
				referrerpolicy="no-referrer"
			></iframe>
		{/if}
	</div>

	{#if filtered.length > 0}
		<div class="mt-4 space-y-2">
			<h2 class="text-sm font-medium text-foreground-secondary">
				{filtered.length}
				{filtered.length === 1 ? $_('map.location') : $_('map.locations')}
			</h2>
			<div class="grid gap-2 sm:grid-cols-2">
				{#each filtered as loc}
					{#if loc.latitude && loc.longitude}
						<a
							href="/cities/{citySlug}/locations/{loc.slug || loc.id}"
							class="flex items-center gap-3 rounded-lg border border-border bg-background-card p-3 transition-colors hover:bg-background-card-hover"
						>
							<div
								class="w-3 h-3 rounded-full flex-shrink-0"
								style="background:{categoryColors[loc.category] || '#6b7280'}"
							></div>
							<div class="min-w-0">
								<p class="text-sm font-medium text-foreground truncate">{loc.name}</p>
								<p class="text-xs text-foreground-secondary">{$_(`category.${loc.category}`)}</p>
							</div>
						</a>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.map-container {
		width: 100%;
		height: calc(100vh - 300px);
		min-height: 400px;
	}
</style>
