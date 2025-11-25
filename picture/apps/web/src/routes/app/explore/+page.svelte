<script lang="ts">
	import {
		exploreImages,
		isLoadingExplore,
		hasMoreExplore,
		currentExplorePage,
		exploreSortBy,
		exploreSearchQuery,
		showExploreFavoritesOnly
	} from '$lib/stores/explore';
	import { selectedImage } from '$lib/stores/images';
	import { viewMode } from '$lib/stores/view';
	import { getPublicImages, searchPublicImages } from '$lib/api/explore';
	import ImageCard from '$lib/components/gallery/ImageCard.svelte';
	import ImageDetailModal from '$lib/components/gallery/ImageDetailModal.svelte';
	import ImageSkeleton from '$lib/components/ui/ImageSkeleton.svelte';
	import ViewModeSwitcher from '$lib/components/ui/ViewModeSwitcher.svelte';
	import ContextMenu from '$lib/components/ui/ContextMenu.svelte';
	import { onMount } from 'svelte';
	import type { Database } from '@picture/shared/types';
	import type { ViewMode } from '$lib/stores/view';

	type Image = Database['public']['Tables']['images']['Row'];

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
				if (
					entries[0].isIntersecting &&
					$hasMoreExplore &&
					!$isLoadingExplore &&
					!loadingMore
				) {
					loadMoreImages();
				}
			},
			{
				threshold: 0.1,
				rootMargin: '100px' // Load before reaching the trigger
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
				favoritesOnly: $showExploreFavoritesOnly
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
					favoritesOnly: $showExploreFavoritesOnly
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
					const results = await searchPublicImages(searchInput.trim(), 1, 20, $showExploreFavoritesOnly);
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

{#if $isLoadingExplore && $exploreImages.length === 0}
	<div class="px-4 py-8">
		<ImageSkeleton count={20} />
	</div>
{:else if $exploreImages.length === 0}
	<div class="flex min-h-[400px] items-center justify-center px-4">
		<div class="text-center">
			<svg
				class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Keine Bilder gefunden</h3>
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
