<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		CaretLeft,
		Check,
		ShareNetwork,
		Heart,
		Plus,
		MapPin,
		PencilSimple,
		Trash,
		MapTrifold,
		NavigationArrow,
		ArrowSquareOut,
		Star,
	} from '@manacore/shared-icons';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		favoritesStore,
		useAllFavorites,
		useAllLocations,
		getFavoriteIds,
		filterByCity,
		ccLocationTable,
		CATEGORY_COLORS,
	} from '$lib/modules/citycorners';
	import {
		isOpenNow,
		haversine,
		formatDistance,
	} from '$lib/modules/citycorners/utils/opening-hours';
	import type { LocalCity } from '$lib/modules/citycorners/types';

	const cityCtx = getContext<{ value: LocalCity | undefined }>('currentCity');
	let city = $derived(cityCtx.value);
	let citySlug = $derived($page.params.slug);

	const allFavorites = useAllFavorites();
	let favoriteIds = $derived(getFavoriteIds(allFavorites.value));

	interface TimelineEntry {
		year: string;
		event: string;
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
		timeline?: TimelineEntry[];
		website?: string;
		phone?: string;
		openingHours?: Record<string, string>;
		createdBy?: string;
	}

	let location = $state<Location | null>(null);
	let nearbyLocations = $state<NearbyLocation[]>([]);
	let loading = $state(true);
	let shareSuccess = $state(false);
	let showDeleteConfirm = $state(false);
	let deleting = $state(false);

	let selectedImageIndex = $state(0);

	let isOwner = $derived(
		location?.createdBy != null &&
			authStore.isAuthenticated &&
			authStore.user?.id === location.createdBy
	);

	let allImages = $derived(() => {
		if (!location) return [];
		const imgs: string[] = [];
		if (location.imageUrl) imgs.push(location.imageUrl);
		return imgs;
	});

	const allLocs = useAllLocations();

	onMount(async () => {
		try {
			const locId = $page.params.id;
			const loc = await ccLocationTable.get(locId);
			if (loc) {
				location = {
					id: loc.id,
					name: loc.name,
					category: loc.category,
					description: loc.description || '',
					address: loc.address || undefined,
					latitude: loc.latitude || undefined,
					longitude: loc.longitude || undefined,
					imageUrl: loc.imageUrl || undefined,
					timeline: loc.timeline?.map((t) => ({ year: String(t.year), event: t.event })),
				};

				// Find nearby locations from the same city
				if (city && loc.latitude && loc.longitude) {
					const cityLocs = filterByCity(allLocs.value, city.id).filter(
						(l) => l.id !== locId && l.latitude && l.longitude
					);
					nearbyLocations = cityLocs
						.map((l) => {
							const dist = Math.round(
								haversine(loc.latitude!, loc.longitude!, l.latitude!, l.longitude!)
							);
							return {
								id: l.id,
								name: l.name,
								category: l.category,
								imageUrl: l.imageUrl || undefined,
								distance: dist,
							};
						})
						.sort((a, b) => a.distance - b.distance)
						.slice(0, 5);
				}
			}
		} catch (err) {
			console.error('Failed to load location:', err);
		} finally {
			loading = false;
		}
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
			await ccLocationTable.update(location.id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			goto(`/citycorners/cities/${citySlug}`);
		} catch {
			// ignore
		} finally {
			deleting = false;
			showDeleteConfirm = false;
		}
	}
</script>

<svelte:head>
	<title>{location?.name || 'Location'} - {city?.name || 'CityCorners'}</title>
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
		<a
			href="/citycorners/cities/{citySlug}"
			class="mt-4 inline-block text-sm text-primary hover:underline">{$_('detail.back')}</a
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
				href="/citycorners/cities/{citySlug}"
				class="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
			>
				<CaretLeft size={20} />
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
					<Check size={20} class="text-green-400" />
				{:else}
					<ShareNetwork size={20} />
				{/if}
			</button>

			{#if authStore.isAuthenticated}
				<button
					class="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-all hover:bg-black/50"
					onclick={() => favoritesStore.toggle(location!.id)}
					title={favoriteIds.has(location.id) ? $_('favorites.remove') : $_('favorites.add')}
				>
					{#if favoriteIds.has(location.id)}
						<Heart size={20} weight="fill" class="text-red-500" />
					{:else}
						<Heart size={20} class="text-white" />
					{/if}
				</button>
			{/if}
		</div>

		{#if images.length > 1}
			<div
				class="absolute bottom-4 right-4 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm"
			>
				{selectedImageIndex + 1} / {images.length}
			</div>
		{/if}

		<div class="absolute bottom-4 left-4 flex items-center gap-2">
			<span
				class="rounded-full px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
				style="background: {CATEGORY_COLORS[location.category] || '#6b7280'}cc"
			>
				{$_(`category.${location.category}`)}
			</span>
			{#if isOpenNow(location.openingHours) === true}
				<span
					class="rounded-full bg-green-500/90 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
				>
					{$_('detail.openNow')}
				</span>
			{:else if isOpenNow(location.openingHours) === false}
				<span
					class="rounded-full bg-red-500/80 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
				>
					{$_('detail.closedNow')}
				</span>
			{/if}
		</div>
	</div>

	<!-- Content -->
	<div class="space-y-6">
		<div>
			<h1 class="text-3xl font-bold text-foreground">{location.name}</h1>
			{#if location.address}
				<p class="mt-2 flex items-center gap-1.5 text-foreground-secondary">
					<MapPin size={16} class="flex-shrink-0" />
					{location.address}
				</p>
			{/if}
		</div>

		<p class="text-base leading-relaxed text-foreground">{location.description}</p>

		<!-- Contact info -->
		{#if location.website || location.phone}
			<div class="space-y-2">
				{#if location.website}
					<div class="flex items-center gap-2 text-sm">
						<span class="font-medium text-foreground-secondary">{$_('detail.website')}:</span>
						<a
							href={location.website}
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary hover:underline truncate"
						>
							{location.website.replace(/^https?:\/\//, '')}
						</a>
					</div>
				{/if}
				{#if location.phone}
					<div class="flex items-center gap-2 text-sm">
						<span class="font-medium text-foreground-secondary">{$_('detail.phone')}:</span>
						<a href="tel:{location.phone}" class="text-primary hover:underline">
							{location.phone}
						</a>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Opening hours -->
		{#if location.openingHours && Object.keys(location.openingHours).length > 0}
			<div>
				<h2 class="mb-3 text-lg font-semibold text-foreground">{$_('detail.openingHours')}</h2>
				<div class="rounded-xl border border-border bg-background-card overflow-hidden">
					<table class="w-full text-sm">
						<tbody>
							{#each ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'] as day}
								{#if location.openingHours[day]}
									<tr class="border-b border-border last:border-b-0">
										<td class="px-4 py-2 font-medium text-foreground">{$_(`days.${day}`)}</td>
										<td class="px-4 py-2 text-right text-foreground-secondary">
											{location.openingHours[day] === 'closed'
												? $_('detail.closed')
												: location.openingHours[day]}
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- Owner actions -->
		{#if isOwner}
			<div class="flex gap-3">
				<a
					href="/citycorners/cities/{citySlug}/locations/{location.id}/edit"
					class="flex items-center gap-2 rounded-lg border border-border bg-background-card px-4 py-2.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-card-hover hover:text-foreground"
				>
					<PencilSimple size={16} />
					{$_('detail.edit')}
				</a>
				<button
					onclick={() => (showDeleteConfirm = true)}
					class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
				>
					<Trash size={16} />
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
				<iframe
					title="Map"
					src="https://www.openstreetmap.org/export/embed.html?bbox={location.longitude -
						0.005},{location.latitude - 0.004},{location.longitude + 0.005},{location.latitude +
						0.004}&layer=mapnik&marker={location.latitude},{location.longitude}"
					class="h-52 w-full border-0"
					loading="lazy"
					referrerpolicy="no-referrer"
				></iframe>
				<div class="flex divide-x divide-border border-t border-border">
					<a
						href="/citycorners/cities/{citySlug}/map"
						class="flex flex-1 items-center justify-center gap-2 bg-background-card px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:text-primary"
					>
						<MapTrifold size={16} />
						{$_('detail.showOnMap')}
					</a>
					<a
						href="https://www.google.com/maps/dir/?api=1&destination={location.latitude},{location.longitude}"
						target="_blank"
						rel="noopener noreferrer"
						class="flex flex-1 items-center justify-center gap-2 bg-background-card px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:text-primary"
					>
						<NavigationArrow size={16} />
						{$_('detail.directions')}
					</a>
					<a
						href="https://www.openstreetmap.org/?mlat={location.latitude}&mlon={location.longitude}#map=17/{location.latitude}/{location.longitude}"
						target="_blank"
						rel="noopener noreferrer"
						class="flex flex-1 items-center justify-center gap-2 bg-background-card px-4 py-2.5 text-sm text-foreground-secondary transition-colors hover:text-primary"
					>
						<ArrowSquareOut size={16} />
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
							href="/citycorners/cities/{citySlug}/locations/{nearby.id}"
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
								<p class="text-sm font-medium text-foreground line-clamp-1">
									{nearby.name}
								</p>
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
