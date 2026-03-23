<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { favoritesStore } from '$lib/stores/favorites.svelte';
	import { api } from '$lib/api';

	interface TimelineEntry {
		year: string;
		event: string;
	}

	interface Location {
		id: string;
		name: string;
		category: string;
		description: string;
		address?: string;
		latitude?: number;
		longitude?: number;
		imageUrl?: string;
		timeline?: TimelineEntry[];
	}

	let location = $state<Location | null>(null);
	let loading = $state(true);
	let mapContainer: HTMLDivElement;

	const categoryLabels: Record<string, string> = {
		sight: 'Sehenswürdigkeit',
		restaurant: 'Restaurant',
		shop: 'Laden',
		museum: 'Museum',
	};

	const categoryColors: Record<string, string> = {
		sight: '#2563eb',
		restaurant: '#dc2626',
		shop: '#16a34a',
		museum: '#9333ea',
	};

	onMount(async () => {
		try {
			const res = await fetch(api(`/locations/${$page.params.id}`));
			const data = await res.json();
			location = data.location;
		} catch (err) {
			console.error('Failed to load location:', err);
		} finally {
			loading = false;
		}

		if (authStore.isAuthenticated) {
			favoritesStore.load();
		}
	});

	// Initialize mini map after location loads
	$effect(() => {
		if (!browser || !location || !location.latitude || !location.longitude || !mapContainer) return;

		const initMap = async () => {
			const L = await import('leaflet');

			const map = L.map(mapContainer, { zoomControl: false, attributionControl: false }).setView(
				[location!.latitude!, location!.longitude!],
				16
			);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
			}).addTo(map);

			const color = categoryColors[location!.category] || '#6b7280';
			const icon = L.divIcon({
				className: 'custom-marker',
				html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
				iconSize: [32, 32],
				iconAnchor: [16, 16],
			});

			L.marker([location!.latitude!, location!.longitude!], { icon }).addTo(map);
		};

		initMap();
	});
</script>

<svelte:head>
	<title>{location?.name || 'Location'} - CityCorners</title>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center py-20">
		<div
			class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
		></div>
	</div>
{:else if !location}
	<div class="py-20 text-center">
		<span class="mb-4 block text-5xl">🔍</span>
		<p class="text-foreground-secondary">{$_('detail.notFound')}</p>
		<a href="/" class="mt-4 inline-block text-sm text-primary hover:underline"
			>{$_('detail.back')}</a
		>
	</div>
{:else}
	<!-- Hero image with overlay -->
	<div class="relative -mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
		{#if location.imageUrl}
			<img src={location.imageUrl} alt={location.name} class="h-72 w-full object-cover sm:h-80" />
		{:else}
			<div
				class="flex h-72 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 sm:h-80"
			>
				<span class="text-7xl">📍</span>
			</div>
		{/if}

		<!-- Back button + Favorite button overlay -->
		<div class="absolute left-4 top-4">
			<a
				href="/"
				class="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
			</a>
		</div>

		{#if authStore.isAuthenticated}
			<div class="absolute right-4 top-4">
				<button
					class="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-all hover:bg-black/50"
					onclick={() => favoritesStore.toggle(location!.id)}
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
			</div>
		{/if}

		<!-- Category badge on image -->
		<div class="absolute bottom-4 left-4">
			<span
				class="rounded-full px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
				style="background: {categoryColors[location.category] || '#6b7280'}cc"
			>
				{categoryLabels[location.category] || location.category}
			</span>
		</div>
	</div>

	<!-- Content -->
	<div class="space-y-6">
		<div>
			<h1 class="text-3xl font-bold text-foreground">{location.name}</h1>
			{#if location.address}
				<p class="mt-2 flex items-center gap-1.5 text-foreground-secondary">
					<svg
						class="h-4 w-4 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
						/>
					</svg>
					{location.address}
				</p>
			{/if}
		</div>

		<p class="text-base leading-relaxed text-foreground">{location.description}</p>

		<!-- Mini Map -->
		{#if location.latitude && location.longitude}
			<div class="overflow-hidden rounded-xl border border-border">
				<div bind:this={mapContainer} class="h-52 w-full"></div>
				<a
					href="https://www.openstreetmap.org/?mlat={location.latitude}&mlon={location.longitude}#map=17/{location.latitude}/{location.longitude}"
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center justify-center gap-2 border-t border-border bg-background-card px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:text-primary"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
						/>
					</svg>
					{$_('detail.openInMaps')}
				</a>
			</div>
		{/if}

		<!-- Timeline -->
		{#if location.timeline && location.timeline.length > 0}
			<div>
				<h2 class="mb-4 text-xl font-semibold text-foreground">{$_('detail.history')}</h2>
				<div class="relative space-y-0">
					{#each location.timeline as entry, i}
						<div class="relative flex gap-4 pb-6 {i < location.timeline!.length - 1 ? '' : ''}">
							<!-- Timeline line -->
							{#if i < location.timeline!.length - 1}
								<div class="absolute left-[11px] top-6 h-full w-0.5 bg-border"></div>
							{/if}
							<!-- Dot -->
							<div
								class="relative z-10 mt-1.5 h-6 w-6 flex-shrink-0 rounded-full border-2 border-primary bg-background flex items-center justify-center"
							>
								<div class="h-2 w-2 rounded-full bg-primary"></div>
							</div>
							<!-- Content -->
							<div>
								<span class="font-mono text-sm font-bold text-primary">{entry.year}</span>
								<p class="mt-0.5 text-sm text-foreground-secondary">{entry.event}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	:global(.custom-marker) {
		background: transparent !important;
		border: none !important;
	}
</style>
