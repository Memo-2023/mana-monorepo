<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { browser } from '$app/environment';
	import { CaretLeft, GlobeSimple } from '@manacore/shared-icons';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { useAllLocations, filterByCity } from '$lib/data/queries';
	import type { LocalCity, LocalLocation } from '$lib/data/local-store';

	const cityCtx = getContext<{ value: LocalCity | undefined }>('currentCity');
	let city = $derived(cityCtx.value);
	let citySlug = $derived($page.params.slug);

	const allLocations = useAllLocations();
	let cityLocations = $derived(city ? filterByCity(allLocations.value, city.id) : []);
	let mapContainer: HTMLDivElement;
	let map: any = null;
	let locating = $state(false);
	let locationError = $state('');
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

	let allMarkers: any[] = [];
	let markerLayer: any = null;
	let leafletLib: any = null;

	function updateMarkers() {
		if (!map || !leafletLib) return;
		const L = leafletLib;

		if (markerLayer) {
			map.removeLayer(markerLayer);
		}
		for (const m of allMarkers) {
			map.removeLayer(m);
		}
		allMarkers = [];

		const filtered = selectedCategory
			? cityLocations.filter((l) => l.category === selectedCategory)
			: cityLocations;

		const useCluster = filtered.length >= 10;

		if (useCluster && (L as any).markerClusterGroup) {
			markerLayer = (L as any).markerClusterGroup();
		} else {
			markerLayer = null;
		}

		for (const loc of filtered) {
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
						<a href="/cities/${citySlug}/locations/${loc.slug || loc.id}" style="color:${color};font-size:12px;font-weight:600">${$_('detail.showDetails')} &rarr;</a>
					</div>
				`);

				if (useCluster && markerLayer) {
					markerLayer.addLayer(marker);
				} else {
					marker.addTo(map);
					allMarkers.push(marker);
				}
			}
		}

		if (useCluster && markerLayer) {
			map.addLayer(markerLayer);
		}
	}

	onMount(async () => {
		if (!browser) return;

		leafletLib = await import('leaflet');
		const L = leafletLib;
		await import('leaflet/dist/leaflet.css');

		const lat = city?.latitude ?? 47.6603;
		const lng = city?.longitude ?? 9.1757;

		map = L.map(mapContainer).setView([lat, lng], 14);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19,
		}).addTo(map);

		try {
			await import('leaflet.markercluster');
		} catch {
			// clustering not available
		}

		updateMarkers();
	});

	$effect(() => {
		// Re-render markers when category filter or locations change
		const _cat = selectedCategory;
		const _locs = cityLocations;
		if (map && leafletLib) {
			updateMarkers();
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
	<title>{$_('map.title')} - {city?.name || 'CityCorners'}</title>
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
				<GlobeSimple size={20} />
			{/if}
		</button>
	</header>

	{#if locationError}
		<div class="mb-3 rounded-lg bg-red-500/10 p-2 text-xs text-red-500">{locationError}</div>
	{/if}

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
