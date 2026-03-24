<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
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

	interface LocationImage {
		url: string;
		addedBy?: string;
		addedAt?: string;
	}

	interface NearbyLocation {
		id: string;
		name: string;
		category: string;
		imageUrl?: string;
		distance: number;
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
		images?: LocationImage[];
		timeline?: TimelineEntry[];
		createdBy?: string;
	}

	let location = $state<Location | null>(null);
	let nearbyLocations = $state<NearbyLocation[]>([]);
	let loading = $state(true);
	let mapContainer: HTMLDivElement;
	let shareSuccess = $state(false);
	let showDeleteConfirm = $state(false);
	let deleting = $state(false);

	// Gallery state
	let selectedImageIndex = $state(0);
	let showAddPhoto = $state(false);
	let newPhotoUrl = $state('');
	let addingPhoto = $state(false);
	let photoError = $state('');

	const categoryColors: Record<string, string> = {
		sight: '#2563eb',
		restaurant: '#dc2626',
		shop: '#16a34a',
		museum: '#9333ea',
	};

	let isOwner = $derived(
		location?.createdBy != null &&
			authStore.isAuthenticated &&
			authStore.user?.id === location.createdBy
	);

	// All images: primary imageUrl + gallery images
	let allImages = $derived(() => {
		if (!location) return [];
		const imgs: string[] = [];
		if (location.imageUrl) imgs.push(location.imageUrl);
		if (location.images) {
			for (const img of location.images) {
				if (img.url && !imgs.includes(img.url)) imgs.push(img.url);
			}
		}
		return imgs;
	});

	onMount(async () => {
		try {
			const [locRes, nearbyRes] = await Promise.all([
				fetch(api(`/locations/${$page.params.id}`)),
				fetch(api(`/locations/${$page.params.id}/nearby`)),
			]);
			const locData = await locRes.json();
			location = locData.location;

			if (nearbyRes.ok) {
				const nearbyData = await nearbyRes.json();
				nearbyLocations = nearbyData.locations || [];
			}
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

	async function handleShare() {
		const url = window.location.href;
		const title = location?.name || 'CityCorners';

		if (navigator.share) {
			try {
				await navigator.share({ title, url });
			} catch {
				// User cancelled
			}
		} else {
			await navigator.clipboard.writeText(url);
			shareSuccess = true;
			setTimeout(() => (shareSuccess = false), 2000);
		}
	}

	async function handleDelete() {
		if (!location || deleting) return;
		deleting = true;
		try {
			const token = await authStore.getValidToken();
			const res = await fetch(api(`/locations/${location.id}`), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) goto('/');
		} catch {
			// ignore
		} finally {
			deleting = false;
			showDeleteConfirm = false;
		}
	}

	async function handleAddPhoto() {
		if (!newPhotoUrl.trim() || !location || addingPhoto) return;
		addingPhoto = true;
		photoError = '';
		try {
			const token = await authStore.getValidToken();
			const res = await fetch(api(`/locations/${location.id}/images`), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ imageUrl: newPhotoUrl.trim() }),
			});
			if (res.ok) {
				const data = await res.json();
				location = data.location;
				newPhotoUrl = '';
				showAddPhoto = false;
			} else {
				photoError = $_('gallery.addError');
			}
		} catch {
			photoError = $_('gallery.addError');
		} finally {
			addingPhoto = false;
		}
	}

	function formatDistance(meters: number): string {
		if (meters < 1000) return `${meters} m`;
		return `${(meters / 1000).toFixed(1)} km`;
	}
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
	{@const images = allImages()}

	<!-- Hero image / Gallery -->
	<div class="relative -mx-4 -mt-4 mb-6 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
		{#if images.length > 0}
			<img
				src={images[selectedImageIndex]}
				alt={location.name}
				class="h-72 w-full object-cover sm:h-80"
			/>
		{:else}
			<div
				class="flex h-72 items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 sm:h-80"
			>
				<span class="text-7xl">📍</span>
			</div>
		{/if}

		<!-- Back button overlay -->
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

		<!-- Share + Favorite buttons overlay -->
		<div class="absolute right-4 top-4 flex gap-2">
			<button
				class="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50"
				onclick={handleShare}
				title={$_('detail.share')}
			>
				{#if shareSuccess}
					<svg
						class="h-5 w-5 text-green-400"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
				{:else}
					<svg
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
						/>
					</svg>
				{/if}
			</button>

			{#if authStore.isAuthenticated}
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
			{/if}
		</div>

		<!-- Image counter badge -->
		{#if images.length > 1}
			<div
				class="absolute bottom-4 right-4 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm"
			>
				{selectedImageIndex + 1} / {images.length}
			</div>
		{/if}

		<!-- Category badge -->
		<div class="absolute bottom-4 left-4">
			<span
				class="rounded-full px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
				style="background: {categoryColors[location.category] || '#6b7280'}cc"
			>
				{$_(`category.${location.category}`)}
			</span>
		</div>
	</div>

	<!-- Gallery thumbnails -->
	{#if images.length > 1}
		<div class="mb-6 flex gap-2 overflow-x-auto pb-1">
			{#each images as img, i}
				<button
					onclick={() => (selectedImageIndex = i)}
					class="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all {selectedImageIndex ===
					i
						? 'border-primary shadow-md'
						: 'border-transparent opacity-60 hover:opacity-100'}"
				>
					<img src={img} alt="" class="h-full w-full object-cover" loading="lazy" />
				</button>
			{/each}
			{#if authStore.isAuthenticated}
				<button
					onclick={() => (showAddPhoto = !showAddPhoto)}
					class="flex h-16 w-20 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border text-foreground-secondary transition-colors hover:border-primary hover:text-primary"
					title={$_('gallery.addPhoto')}
				>
					<svg
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
				</button>
			{/if}
		</div>
	{:else if authStore.isAuthenticated}
		<div class="mb-4">
			<button
				onclick={() => (showAddPhoto = !showAddPhoto)}
				class="text-sm text-foreground-secondary hover:text-primary transition-colors"
			>
				+ {$_('gallery.addPhoto')}
			</button>
		</div>
	{/if}

	<!-- Add photo form -->
	{#if showAddPhoto}
		<div class="mb-6 rounded-xl border border-border bg-background-card p-4">
			<p class="mb-3 text-sm font-medium text-foreground">{$_('gallery.addPhoto')}</p>
			{#if photoError}
				<div class="mb-3 rounded-lg bg-red-500/10 p-2 text-xs text-red-500">{photoError}</div>
			{/if}
			<div class="flex gap-2">
				<input
					type="url"
					bind:value={newPhotoUrl}
					placeholder={$_('add.imageUrlPlaceholder')}
					class="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					onkeydown={(e) => e.key === 'Enter' && handleAddPhoto()}
				/>
				<button
					onclick={handleAddPhoto}
					disabled={!newPhotoUrl.trim() || addingPhoto}
					class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
				>
					{addingPhoto ? '...' : $_('gallery.add')}
				</button>
			</div>
		</div>
	{/if}

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

		<!-- Owner actions -->
		{#if isOwner}
			<div class="flex gap-3">
				<a
					href="/locations/{location.id}/edit"
					class="flex items-center gap-2 rounded-lg border border-border bg-background-card px-4 py-2.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-card-hover hover:text-foreground"
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
							d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
						/>
					</svg>
					{$_('detail.edit')}
				</a>
				<button
					onclick={() => (showDeleteConfirm = true)}
					class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
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
							d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
						/>
					</svg>
					{$_('detail.delete')}
				</button>
			</div>
		{/if}

		<!-- Delete confirmation -->
		{#if showDeleteConfirm}
			<div
				class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30"
			>
				<p class="mb-3 text-sm text-red-700 dark:text-red-300">{$_('detail.deleteConfirm')}</p>
				<div class="flex gap-2">
					<button
						onclick={() => (showDeleteConfirm = false)}
						class="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground-secondary hover:bg-background-card-hover"
					>
						{$_('detail.cancel')}
					</button>
					<button
						onclick={handleDelete}
						disabled={deleting}
						class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
					>
						{deleting ? $_('detail.deleting') : $_('detail.confirmDelete')}
					</button>
				</div>
			</div>
		{/if}

		<!-- Map + Directions -->
		{#if location.latitude && location.longitude}
			<div class="overflow-hidden rounded-xl border border-border">
				<div bind:this={mapContainer} class="h-52 w-full"></div>
				<div class="flex divide-x divide-border border-t border-border">
					<a
						href="/map"
						class="flex flex-1 items-center justify-center gap-2 bg-background-card px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:text-primary"
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
								d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
							/>
						</svg>
						{$_('detail.showOnMap')}
					</a>
					<a
						href="https://www.google.com/maps/dir/?api=1&destination={location.latitude},{location.longitude}"
						target="_blank"
						rel="noopener noreferrer"
						class="flex flex-1 items-center justify-center gap-2 bg-background-card px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:text-primary"
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
								d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
							/>
						</svg>
						{$_('detail.directions')}
					</a>
					<a
						href="https://www.openstreetmap.org/?mlat={location.latitude}&mlon={location.longitude}#map=17/{location.latitude}/{location.longitude}"
						target="_blank"
						rel="noopener noreferrer"
						class="flex flex-1 items-center justify-center gap-2 bg-background-card px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:text-primary"
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
			</div>
		{/if}

		<!-- Timeline -->
		{#if location.timeline && location.timeline.length > 0}
			<div>
				<h2 class="mb-4 text-xl font-semibold text-foreground">{$_('detail.history')}</h2>
				<div class="relative space-y-0">
					{#each location.timeline as entry, i}
						<div class="relative flex gap-4 pb-6">
							{#if i < location.timeline!.length - 1}
								<div class="absolute left-[11px] top-6 h-full w-0.5 bg-border"></div>
							{/if}
							<div
								class="relative z-10 mt-1.5 h-6 w-6 flex-shrink-0 rounded-full border-2 border-primary bg-background flex items-center justify-center"
							>
								<div class="h-2 w-2 rounded-full bg-primary"></div>
							</div>
							<div>
								<span class="font-mono text-sm font-bold text-primary">{entry.year}</span>
								<p class="mt-0.5 text-sm text-foreground-secondary">{entry.event}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Nearby locations -->
		{#if nearbyLocations.length > 0}
			<div>
				<h2 class="mb-4 text-xl font-semibold text-foreground">{$_('detail.nearby')}</h2>
				<div class="flex gap-3 overflow-x-auto pb-1">
					{#each nearbyLocations as nearby}
						<a
							href="/locations/{nearby.id}"
							class="flex-shrink-0 w-40 overflow-hidden rounded-xl border border-border bg-background-card transition-shadow hover:shadow-md"
						>
							{#if nearby.imageUrl}
								<img
									src={nearby.imageUrl}
									alt={nearby.name}
									loading="lazy"
									class="h-24 w-full object-cover"
								/>
							{:else}
								<div class="flex h-24 items-center justify-center bg-background-card-hover">
									<span class="text-2xl">📍</span>
								</div>
							{/if}
							<div class="p-2.5">
								<p class="text-sm font-medium text-foreground line-clamp-1">{nearby.name}</p>
								<p class="mt-0.5 text-xs text-foreground-secondary">
									{$_(`category.${nearby.category}`)} · {formatDistance(nearby.distance)}
								</p>
							</div>
						</a>
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
