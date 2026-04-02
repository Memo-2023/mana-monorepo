<script lang="ts">
	import {
		exploreImages,
		isLoadingExplore,
		hasMoreExplore,
		currentExplorePage,
		exploreSortBy,
		exploreSearchQuery,
		showExploreFavoritesOnly,
	} from '$lib/stores/explore';
	import { selectedImage } from '$lib/stores/images';
	import { viewMode } from '$lib/stores/view';
	import { getPublicImages, searchPublicImages } from '$lib/api/explore';
	import ImageCard from '$lib/components/gallery/ImageCard.svelte';
	import ImageDetailModal from '$lib/components/gallery/ImageDetailModal.svelte';
	import ImageSkeleton from '$lib/components/ui/ImageSkeleton.svelte';
	import ViewModeSwitcher from '$lib/components/ui/ViewModeSwitcher.svelte';
	import ContextMenu from '$lib/components/ui/ContextMenu.svelte';
	import { MagnifyingGlass, X, Heart } from '@manacore/shared-icons';
	import { onMount } from 'svelte';
	import type { Image } from '$lib/api/images';
	import type { ViewMode } from '$lib/stores/view';

	let loadingMore = $state(false);
	let observer: IntersectionObserver | null = null;
	let loadMoreTrigger = $state<HTMLElement | null>(null);
	let searchInput = $state('');
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	// React to favorites filter changes
	$effect(() => {
		if ($showExploreFavoritesOnly !== undefined) {
			loadInitialImages();
		}
	});

	onMount(() => {
		loadInitialImages();

		// Setup Intersection Observer for infinite scroll
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && $hasMoreExplore && !$isLoadingExplore && !loadingMore) {
					loadMoreImages();
				}
			},
			{
				threshold: 0.1,
				rootMargin: '100px', // Load before reaching the trigger
			}
		);

		if (loadMoreTrigger) {
			observer.observe(loadMoreTrigger);
		}

		return () => {
			if (observer) observer.disconnect();
			if (searchTimeout) clearTimeout(searchTimeout);
		};
	});

	async function loadInitialImages() {
		isLoadingExplore.set(true);
		try {
			const data = await getPublicImages({
				page: 1,
				sortBy: $exploreSortBy,
				favoritesOnly: $showExploreFavoritesOnly,
			});
			exploreImages.set(data);
			currentExplorePage.set(1);
			hasMoreExplore.set(data.length === 20);
		} catch (error) {
			console.error('Error loading explore images:', error);
		} finally {
			isLoadingExplore.set(false);
		}
	}

	async function loadMoreImages() {
		if (!$hasMoreExplore || $isLoadingExplore || loadingMore) return;

		loadingMore = true;
		const nextPage = $currentExplorePage + 1;

		try {
			const newImages = $exploreSearchQuery
				? await searchPublicImages($exploreSearchQuery, nextPage, 20, $showExploreFavoritesOnly)
				: await getPublicImages({
						page: nextPage,
						sortBy: $exploreSortBy,
						favoritesOnly: $showExploreFavoritesOnly,
					});

			if (newImages.length > 0) {
				exploreImages.update((current) => [...current, ...newImages]);
				currentExplorePage.set(nextPage);
				hasMoreExplore.set(newImages.length === 20);
			} else {
				hasMoreExplore.set(false);
			}
		} catch (error) {
			console.error('Error loading more explore images:', error);
		} finally {
			loadingMore = false;
		}
	}

	function handleImageClick(image: Image) {
		selectedImage.set(image);
	}

	function getGridClass(mode: ViewMode) {
		switch (mode) {
			case 'single':
				return 'grid grid-cols-1 gap-4 max-w-2xl mx-auto';
			case 'grid3':
				return 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
			case 'grid5':
				return 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
		}
	}

	function handleSortChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		exploreSortBy.set(target.value as 'recent' | 'popular' | 'trending');
		loadInitialImages();
	}

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchInput = target.value;

		// Debounce search
		if (searchTimeout) clearTimeout(searchTimeout);

		searchTimeout = setTimeout(async () => {
			exploreSearchQuery.set(searchInput);

			if (searchInput.trim()) {
				isLoadingExplore.set(true);
				try {
					const results = await searchPublicImages(
						searchInput.trim(),
						1,
						20,
						$showExploreFavoritesOnly
					);
					exploreImages.set(results);
					currentExplorePage.set(1);
					hasMoreExplore.set(results.length === 20);
				} catch (error) {
					console.error('Error searching:', error);
				} finally {
					isLoadingExplore.set(false);
				}
			} else {
				loadInitialImages();
			}
		}, 500);
	}
</script>

<svelte:head>
	<title>Entdecken - Picture</title>
</svelte:head>

<!-- Filter Bar -->
<div class="sticky top-0 z-20 px-4 py-3">
	<div class="flex flex-wrap items-center gap-3">
		<!-- Search -->
		<div class="relative min-w-[200px] flex-1 max-w-md">
			<input
				type="text"
				value={searchInput}
				oninput={handleSearchInput}
				placeholder="Bilder suchen..."
				class="w-full rounded-full border border-gray-300/50 bg-white/80 px-4 py-2 pl-10 text-sm text-gray-900 placeholder-gray-500 backdrop-blur-xl transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600/50 dark:bg-gray-800/80 dark:text-gray-100 dark:placeholder-gray-400"
			/>
			<MagnifyingGlass
				size={16}
				class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
			/>
			{#if searchInput}
				<button
					onclick={() => {
						searchInput = '';
						exploreSearchQuery.set('');
						loadInitialImages();
					}}
					class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
				>
					<X size={16} />
				</button>
			{/if}
		</div>

		<!-- Sort -->
		<select
			value={$exploreSortBy}
			onchange={handleSortChange}
			class="rounded-full border border-gray-300/50 bg-white/80 px-4 py-2 text-sm text-gray-900 backdrop-blur-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600/50 dark:bg-gray-800/80 dark:text-gray-100"
		>
			<option value="recent">Neueste</option>
			<option value="popular">Beliebt</option>
			<option value="trending">Im Trend</option>
		</select>

		<!-- Favorites Toggle -->
		<button
			onclick={() => showExploreFavoritesOnly.update((v) => !v)}
			class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all {$showExploreFavoritesOnly
				? 'bg-blue-600 text-white'
				: 'bg-gray-100/80 text-gray-700 backdrop-blur-xl hover:bg-gray-200/80 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-700/80'}"
		>
			<Heart size={16} weight={$showExploreFavoritesOnly ? 'fill' : 'regular'} />
			<span>Favoriten</span>
		</button>

		<!-- Reset Filter -->
		{#if $exploreSearchQuery || $showExploreFavoritesOnly || $exploreSortBy !== 'recent'}
			<button
				onclick={() => {
					searchInput = '';
					exploreSearchQuery.set('');
					exploreSortBy.set('recent');
					showExploreFavoritesOnly.set(false);
					loadInitialImages();
				}}
				class="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
			>
				Zurücksetzen
			</button>
		{/if}
	</div>
</div>

{#if $isLoadingExplore && $exploreImages.length === 0}
	<div class="px-4 py-8">
		<ImageSkeleton count={20} />
	</div>
{:else if $exploreImages.length === 0}
	<div class="flex min-h-[400px] items-center justify-center px-4">
		<div class="text-center">
			<MagnifyingGlass size={64} weight="thin" class="mx-auto text-gray-400 dark:text-gray-500" />
			<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
				Keine Bilder gefunden
			</h3>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				{#if $exploreSearchQuery}
					Keine Ergebnisse für "{$exploreSearchQuery}"
				{:else}
					Es sind noch keine öffentlichen Bilder vorhanden
				{/if}
			</p>
		</div>
	</div>
{:else}
	<div class="px-4 py-8 pb-32">
		<div class={getGridClass($viewMode)}>
			{#each $exploreImages as image (image.id)}
				<ImageCard {image} onclick={() => handleImageClick(image)} viewMode={$viewMode} />
			{/each}
		</div>

		<!-- Infinite Scroll Trigger -->
		{#if $hasMoreExplore}
			<div bind:this={loadMoreTrigger} class="mt-8 flex justify-center">
				{#if loadingMore}
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent dark:border-blue-400"
					></div>
				{:else}
					<p class="text-sm text-gray-500 dark:text-gray-400">Scrolle für mehr</p>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<!-- Image Detail Modal -->
<ImageDetailModal image={$selectedImage} onClose={() => selectedImage.set(null)} />

<!-- Context Menu -->
<ContextMenu />
