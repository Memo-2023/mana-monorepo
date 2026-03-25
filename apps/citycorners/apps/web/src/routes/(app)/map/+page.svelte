<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { _ } from 'svelte-i18n';
	import { api } from '$lib/api';

	interface Location {
		id: string;
		slug?: string;
		name: string;
		category: string;
		description: string;
		address?: string;
		latitude?: number;
		longitude?: number;
		imageUrl?: string;
	}

	let locations = $state<Location[]>([]);
	let mapContainer: HTMLDivElement;
	let map: any = null;
	let locating = $state(false);
	let locationError = $state('');

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

	onMount(async () => {
		try {
			const res = await fetch(api('/locations'));
			const data = await res.json();
			locations = data.locations;
		} catch (err) {
			console.error('Failed to load locations:', err);
		}

		if (!browser) return;

		const L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		map = L.map(mapContainer).setView([47.6603, 9.1757], 14);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19,
		}).addTo(map);

		const useCluster = locations.length >= 10;
		let markerLayer: any;

		if (useCluster) {
			const { default: MCG } = await import('leaflet.markercluster');
			markerLayer = (L as any).markerClusterGroup();
		}

		for (const loc of locations) {
			if (loc.latitude && loc.longitude) {
				const color = categoryColors[loc.category] || '#6b7280';

				const icon = L.divIcon({
					className: 'custom-marker',
					html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
					iconSize: [28, 28],
					iconAnchor: [14, 14],
				});

				const marker = L.marker([loc.latitude, loc.longitude], { icon });

				marker.bindPopup(`
					<div style="min-width:180px">
						<strong style="font-size:14px">${loc.name}</strong>
						<div style="color:${color};font-size:12px;margin:4px 0">${$_(`category.${loc.category}`)}</div>
						<p style="font-size:12px;color:#666;margin:4px 0">${loc.description.substring(0, 100)}...</p>
						<a href="/locations/${loc.slug || loc.id}" style="color:${color};font-size:12px;font-weight:600">${$_('detail.showDetails')} &rarr;</a>
					</div>
				`);

				if (useCluster && markerLayer) {
					markerLayer.addLayer(marker);
				} else {
					marker.addTo(map);
				}
			}
		}

		if (useCluster && markerLayer) {
			map.addLayer(markerLayer);
		}
	});

	function handleLocateMe() {
		if (!browser || !map || !navigator.geolocation) {
			locationError = $_('map.geolocationNotSupported');
			return;
		}

		locating = true;
		locationError = '';

		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const { latitude, longitude } = pos.coords;
				const L = await import('leaflet');

				map.setView([latitude, longitude], 16);

				// Add user marker
				const userIcon = L.divIcon({
					className: 'custom-marker',
					html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 2px 6px rgba(0,0,0,0.3);"></div>`,
					iconSize: [16, 16],
					iconAnchor: [8, 8],
				});

				L.marker([latitude, longitude], { icon: userIcon })
					.addTo(map)
					.bindPopup($_('map.yourLocation'))
					.openPopup();

				locating = false;
			},
			() => {
				locationError = $_('map.geolocationError');
				locating = false;
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}
</script>

<svelte:head>
	<title>{$_('map.title')} - CityCorners</title>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
	<link
		rel="stylesheet"
		href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
		crossorigin=""
	/>
	<link
		rel="stylesheet"
		href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
		crossorigin=""
	/>
</svelte:head>

<div class="map-page">
	<header class="mb-4 flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">{$_('map.title')}</h1>
			<p class="text-foreground-secondary">{$_('map.subtitle')}</p>
		</div>
		<button
			onclick={handleLocateMe}
			disabled={locating}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background-card border border-border text-foreground-secondary shadow-sm transition-all hover:text-primary hover:border-primary disabled:opacity-50"
			title={$_('map.locateMe')}
		>
			{#if locating}
				<div
					class="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"
				></div>
			{:else}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
					/>
				</svg>
			{/if}
		</button>
	</header>

	{#if locationError}
		<div class="mb-3 rounded-lg bg-red-500/10 p-2 text-xs text-red-500">{locationError}</div>
	{/if}

	<div class="legend mb-4 flex flex-wrap gap-3">
		{#each Object.entries(categoryColors) as [key, color]}
			<div class="flex items-center gap-1.5 text-sm text-foreground-secondary">
				<div class="w-3 h-3 rounded-full" style="background:{color}"></div>
				{$_(`category.${key}`)}
			</div>
		{/each}
	</div>

	<div
		bind:this={mapContainer}
		class="map-container rounded-xl overflow-hidden border border-border"
	></div>
</div>

<style>
	.map-container {
		width: 100%;
		height: calc(100vh - 300px);
		min-height: 400px;
	}

	:global(.custom-marker) {
		background: transparent !important;
		border: none !important;
	}
</style>
