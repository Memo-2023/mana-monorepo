<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { favoritesStore } from '$lib/stores/favorites.svelte';
	import { api } from '$lib/api';

	interface Location {
		id: string;
		name: string;
		category: string;
		description: string;
		address?: string;
		latitude?: number;
		longitude?: number;
		imageUrl?: string;
	}

	let locations = $state<Location[]>([]);
	let loading = $state(true);
	let selectedCategory = $state<string | null>(null);

	const categoryKeys = ['sight', 'restaurant', 'shop', 'museum'];

	let categoryCounts = $derived(
		categoryKeys.reduce(
			(acc, cat) => {
				acc[cat] = locations.filter((l) => l.category === cat).length;
				return acc;
			},
			{} as Record<string, number>
		)
	);

	let filtered = $derived(
		selectedCategory ? locations.filter((l) => l.category === selectedCategory) : locations
	);

	onMount(async () => {
		try {
			const res = await fetch(api('/locations'));
			const data = await res.json();
			locations = data.locations;
		} catch (err) {
			console.error('Failed to load locations:', err);
		} finally {
			loading = false;
		}

		if (authStore.isAuthenticated) {
			favoritesStore.load();
		}
	});

	function handleFavoriteToggle(e: MouseEvent, locationId: string) {
		e.preventDefault();
		e.stopPropagation();
		favoritesStore.toggle(locationId);
	}
</script>

<svelte:head>
	<title>{$_('app.name')} - {$_('app.tagline')}</title>
</svelte:head>

<header class="mb-6 flex items-start justify-between">
	<div>
		<h1 class="text-2xl font-bold text-foreground">{$_('home.title')}</h1>
		<p class="text-foreground-secondary">{$_('home.subtitle')}</p>
	</div>
	<a
		href="/add"
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
		title={$_('add.title')}
	>
		<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
		</svg>
	</a>
</header>

<div class="mb-6 flex flex-wrap gap-2">
	<button
		class="rounded-full px-4 py-2 text-sm transition-colors {selectedCategory === null
			? 'bg-primary text-white'
			: 'bg-background-card text-foreground-secondary hover:bg-background-card-hover'}"
		onclick={() => (selectedCategory = null)}
	>
		{$_('home.all')} ({locations.length})
	</button>
	{#each categoryKeys as cat}
		<button
			class="rounded-full px-4 py-2 text-sm transition-colors {selectedCategory === cat
				? 'bg-primary text-white'
				: 'bg-background-card text-foreground-secondary hover:bg-background-card-hover'}"
			onclick={() => (selectedCategory = cat)}
		>
			{$_(`categories.${cat}`)} ({categoryCounts[cat] || 0})
		</button>
	{/each}
</div>

{#if loading}
	<p class="text-foreground-secondary">{$_('home.loading')}</p>
{:else if filtered.length === 0}
	<div class="py-12 text-center">
		<span class="mb-2 block text-4xl"
			>{selectedCategory === 'restaurant'
				? '🍽️'
				: selectedCategory === 'museum'
					? '🏛️'
					: selectedCategory === 'shop'
						? '🛍️'
						: selectedCategory === 'sight'
							? '🏰'
							: '📍'}</span
		>
		<p class="text-foreground-secondary">
			{#if selectedCategory}
				{$_('home.noResultsCategory', {
					values: { category: $_(`categories.${selectedCategory}`) },
				})}
			{:else}
				{$_('home.noResults')}
			{/if}
		</p>
		<a href="/add" class="mt-3 inline-block text-sm text-primary hover:underline">
			{$_('home.addFirst')}
		</a>
	</div>
{:else}
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each filtered as location}
			<a
				href="/locations/{location.id}"
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

				<!-- Favorite button -->
				{#if authStore.isAuthenticated}
					<button
						class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-all hover:bg-black/50"
						onclick={(e) => handleFavoriteToggle(e, location.id)}
						title={favoritesStore.isFavorite(location.id)
							? $_('favorites.remove')
							: $_('favorites.add')}
					>
						{#if favoritesStore.isFavorite(location.id)}
							<svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"
								/>
							</svg>
						{:else}
							<svg
								class="h-5 w-5 text-white"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
								/>
							</svg>
						{/if}
					</button>
				{/if}

				<div class="p-4">
					<span
						class="mb-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
					>
						{$_(`categories.${location.category}`)}
					</span>
					<h2 class="text-lg font-semibold text-foreground group-hover:text-primary">
						{location.name}
					</h2>
					<p class="mt-1 line-clamp-2 text-sm text-foreground-secondary">
						{location.description}
					</p>
				</div>
			</a>
		{/each}
	</div>
{/if}
