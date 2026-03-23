<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { favoritesStore } from '$lib/stores/favorites.svelte';

	interface Location {
		id: string;
		name: string;
		category: string;
		description: string;
		imageUrl?: string;
	}

	let allLocations = $state<Location[]>([]);
	let loading = $state(true);

	const backendUrl =
		typeof window !== 'undefined'
			? (window as any).__PUBLIC_BACKEND_URL__ || 'http://localhost:3025'
			: 'http://localhost:3025';

	const categoryLabels: Record<string, string> = {
		sight: 'Sehenswürdigkeit',
		restaurant: 'Restaurant',
		shop: 'Laden',
		museum: 'Museum',
	};

	let favoriteLocations = $derived(allLocations.filter((l) => favoritesStore.isFavorite(l.id)));

	onMount(async () => {
		try {
			const res = await fetch(`${backendUrl}/locations`);
			const data = await res.json();
			allLocations = data.locations;
		} catch (err) {
			console.error('Failed to load locations:', err);
		} finally {
			loading = false;
		}

		if (authStore.isAuthenticated) {
			await favoritesStore.load();
		}
	});

	function handleRemove(e: MouseEvent, locationId: string) {
		e.preventDefault();
		e.stopPropagation();
		favoritesStore.toggle(locationId);
	}
</script>

<svelte:head>
	<title>Favoriten - CityCorners</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-2xl font-bold text-foreground">Favoriten</h1>
	<p class="text-foreground-secondary">Deine gespeicherten Orte</p>
</header>

{#if !authStore.isAuthenticated}
	<div class="rounded-xl border border-border bg-background-card p-8 text-center">
		<p class="mb-4 text-foreground-secondary">Melde dich an, um Favoriten zu speichern.</p>
		<a
			href="/login"
			class="inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
		>
			Anmelden
		</a>
	</div>
{:else if loading}
	<p class="text-foreground-secondary">Laden...</p>
{:else if favoriteLocations.length === 0}
	<div class="rounded-xl border border-border bg-background-card p-8 text-center">
		<span class="mb-2 block text-4xl">💙</span>
		<p class="text-foreground-secondary">
			Noch keine Favoriten. Tippe auf das Herz bei einer Location, um sie zu speichern.
		</p>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each favoriteLocations as location}
			<a
				href="/locations/{location.id}"
				class="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-background-card p-4 transition-shadow hover:shadow-lg"
			>
				{#if location.imageUrl}
					<img
						src={location.imageUrl}
						alt={location.name}
						class="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
					/>
				{:else}
					<div
						class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-background-card-hover"
					>
						<span class="text-2xl">📍</span>
					</div>
				{/if}
				<div class="min-w-0 flex-1">
					<span class="text-xs text-primary"
						>{categoryLabels[location.category] || location.category}</span
					>
					<h3 class="truncate font-semibold text-foreground group-hover:text-primary">
						{location.name}
					</h3>
				</div>
				<button
					class="flex-shrink-0 p-1 text-red-500 transition-colors hover:text-red-600"
					onclick={(e) => handleRemove(e, location.id)}
					title="Aus Favoriten entfernen"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"
						/>
					</svg>
				</button>
			</a>
		{/each}
	</div>
{/if}
