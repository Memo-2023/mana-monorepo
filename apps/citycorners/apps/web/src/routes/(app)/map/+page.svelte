<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { _ } from 'svelte-i18n';

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
	let mapContainer: HTMLDivElement;
	let map: any = null;

	const backendUrl =
		typeof window !== 'undefined'
			? (window as any).__PUBLIC_BACKEND_URL__ || 'http://localhost:3025'
			: 'http://localhost:3025';

	const categoryColors: Record<string, string> = {
		sight: '#2563eb',
		restaurant: '#dc2626',
		shop: '#16a34a',
		museum: '#9333ea',
	};

	const categoryLabels: Record<string, string> = {
		sight: 'Sehenswürdigkeit',
		restaurant: 'Restaurant',
		shop: 'Laden',
		museum: 'Museum',
	};

	onMount(async () => {
		// Load locations
		try {
			const res = await fetch(`${backendUrl}/locations`);
			const data = await res.json();
			locations = data.locations;
		} catch (err) {
			console.error('Failed to load locations:', err);
		}

		if (!browser) return;

		// Dynamically import Leaflet (client-side only)
		const L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		// Center on Konstanz
		map = L.map(mapContainer).setView([47.6603, 9.1757], 14);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19,
		}).addTo(map);

		// Add markers for locations with coordinates
		for (const loc of locations) {
			if (loc.latitude && loc.longitude) {
				const color = categoryColors[loc.category] || '#6b7280';

				const icon = L.divIcon({
					className: 'custom-marker',
					html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
					iconSize: [28, 28],
					iconAnchor: [14, 14],
				});

				const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map);

				marker.bindPopup(`
					<div style="min-width:180px">
						<strong style="font-size:14px">${loc.name}</strong>
						<div style="color:${color};font-size:12px;margin:4px 0">${categoryLabels[loc.category] || loc.category}</div>
						<p style="font-size:12px;color:#666;margin:4px 0">${loc.description.substring(0, 100)}...</p>
						<a href="/locations/${loc.id}" style="color:${color};font-size:12px;font-weight:600">Details &rarr;</a>
					</div>
				`);
			}
		}
	});
</script>

<svelte:head>
	<title>{$_('map.title')} - CityCorners</title>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
</svelte:head>

<div class="map-page">
	<header class="mb-4">
		<h1 class="text-2xl font-bold text-foreground">{$_('map.title')}</h1>
		<p class="text-foreground-secondary">{$_('map.subtitle')}</p>
	</header>

	<div class="legend mb-4 flex flex-wrap gap-3">
		{#each Object.entries(categoryColors) as [key, color]}
			<div class="flex items-center gap-1.5 text-sm text-foreground-secondary">
				<div class="w-3 h-3 rounded-full" style="background:{color}"></div>
				{categoryLabels[key]}
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
