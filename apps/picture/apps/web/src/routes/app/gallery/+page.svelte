<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		images,
		isLoading,
		hasMore,
		currentPage,
		selectedImage,
		showFavoritesOnly,
	} from '$lib/stores/images';
	import { isUIVisible } from '$lib/stores/ui';
	import { tags, selectedTags } from '$lib/stores/tags';
	import { getImages } from '$lib/api/images';
	import { getAllTags } from '$lib/api/tags';
	import GalleryGrid from '$lib/components/gallery/GalleryGrid.svelte';
	import ImageDetailModal from '$lib/components/gallery/ImageDetailModal.svelte';
	import QuickGenerateBar from '$lib/components/gallery/QuickGenerateBar.svelte';
	import ContextMenu from '$lib/components/ui/ContextMenu.svelte';
	import ImageSkeleton from '$lib/components/ui/ImageSkeleton.svelte';
	import ViewModeSwitcher from '$lib/components/ui/ViewModeSwitcher.svelte';
	import TagPills from '$lib/components/tags/TagPills.svelte';
	import { Heart } from '@manacore/shared-icons';
	import { onMount } from 'svelte';

	let loadingMore = $state(false);
	let observer: IntersectionObserver | null = null;
	let loadMoreTrigger = $state<HTMLElement | null>(null);

	onMount(async () => {
		await loadTags();
		loadInitialImages();

		// Setup Intersection Observer for infinite scroll
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && $hasMore && !$isLoading && !loadingMore) {
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
		};
	});

	async function loadTags() {
		try {
			const data = await getAllTags();
			tags.set(data);
		} catch (error) {
			console.error('Error loading tags:', error);
		}
	}

	// React to tag and favorites filter changes
	$effect(() => {
		if ($selectedTags || $showFavoritesOnly !== undefined) {
			loadInitialImages();
		}
	});

	async function loadInitialImages() {
		if (!authStore.user) return;

		isLoading.set(true);
		try {
			const data = await getImages({
				userId: authStore.user.id,
				page: 1,
				tagIds: $selectedTags.length > 0 ? $selectedTags : undefined,
				favoritesOnly: $showFavoritesOnly,
			});
			images.set(data);
			currentPage.set(1);
			hasMore.set(data.length === 20);
		} catch (error) {
			console.error('Error loading images:', error);
		} finally {
			isLoading.set(false);
		}
	}

	async function loadMoreImages() {
		if (!authStore.user || !$hasMore || $isLoading || loadingMore) return;

		loadingMore = true;
		const nextPage = $currentPage + 1;

		try {
			const newImages = await getImages({
				userId: authStore.user.id,
				page: nextPage,
				tagIds: $selectedTags.length > 0 ? $selectedTags : undefined,
				favoritesOnly: $showFavoritesOnly,
			});
			if (newImages.length > 0) {
				images.update((current) => [...current, ...newImages]);
				currentPage.set(nextPage);
				hasMore.set(newImages.length === 20);
			} else {
				hasMore.set(false);
			}
		} catch (error) {
			console.error('Error loading more images:', error);
		} finally {
			loadingMore = false;
		}
	}
</script>

<svelte:head>
	<title>Gallery - Picture</title>
</svelte:head>

<!-- Filter Bar -->
<div class="sticky top-0 z-20 px-4 py-3">
	<div class="flex flex-wrap items-center gap-3">
		<!-- Favorites Toggle -->
		<button
			onclick={() => showFavoritesOnly.update((v) => !v)}
			class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all {$showFavoritesOnly
				? 'bg-blue-600 text-white'
				: 'bg-gray-100/80 text-gray-700 backdrop-blur-xl hover:bg-gray-200/80 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-700/80'}"
		>
			<Heart size={16} weight={$showFavoritesOnly ? 'fill' : 'regular'} />
			<span>Favoriten</span>
		</button>

		<!-- Tags -->
		{#if $tags.length > 0}
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tags:</span>
				<TagPills />
			</div>
		{/if}

		<!-- Reset Filter -->
		{#if $selectedTags.length > 0 || $showFavoritesOnly}
			<button
				onclick={() => {
					selectedTags.set([]);
					showFavoritesOnly.set(false);
				}}
				class="ml-auto text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
			>
				Filter zurücksetzen
			</button>
		{/if}
	</div>

	<!-- Active Filter Summary -->
	{#if $selectedTags.length > 0 || $showFavoritesOnly}
		<div class="mt-2 rounded-lg bg-blue-50/80 px-3 py-1.5 backdrop-blur-xl dark:bg-blue-900/30">
			<p class="text-xs font-medium text-blue-900 dark:text-blue-100">
				{#if $showFavoritesOnly && $selectedTags.length > 0}
					Favoriten + {$selectedTags.length} {$selectedTags.length === 1 ? 'Tag' : 'Tags'}
				{:else if $showFavoritesOnly}
					Nur Favoriten
				{:else}
					{$selectedTags.length} {$selectedTags.length === 1 ? 'Tag' : 'Tags'} ausgewählt
				{/if}
			</p>
		</div>
	{/if}
</div>

{#if $isLoading}
	<div class="px-4 py-8">
		<ImageSkeleton count={20} />
	</div>
{:else}
	<div class="px-4 py-8 pb-32">
		<GalleryGrid images={$images} />

		<!-- Infinite Scroll Trigger -->
		{#if $hasMore}
			<div bind:this={loadMoreTrigger} class="mt-8 flex justify-center">
				{#if loadingMore}
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent dark:border-blue-400"
					></div>
				{:else}
					<p class="text-sm text-gray-500 dark:text-gray-400">Scroll to load more</p>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<!-- Image Detail Modal -->
<ImageDetailModal image={$selectedImage} onClose={() => selectedImage.set(null)} />

<!-- Context Menu -->
<ContextMenu />

<!-- Quick Generate Bar (conditionally visible) -->
{#if $isUIVisible}
	<QuickGenerateBar onGenerated={loadInitialImages} />
{/if}
