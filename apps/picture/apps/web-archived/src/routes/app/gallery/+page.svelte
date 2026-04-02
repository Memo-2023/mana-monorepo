<script lang="ts">
	import { selectedImage, showFavoritesOnly } from '$lib/stores/images';
	import { isUIVisible } from '$lib/stores/ui';
	import { selectedTags } from '$lib/stores/tags';
	import { getContext } from 'svelte';
	import type { Tag } from '@manacore/shared-tags';
	import type { Image } from '$lib/api/images';
	import { getFavoriteImages, getImagesByTags } from '$lib/data/queries';
	import GalleryGrid from '$lib/components/gallery/GalleryGrid.svelte';
	import ImageDetailModal from '$lib/components/gallery/ImageDetailModal.svelte';
	import QuickGenerateBar from '$lib/components/gallery/QuickGenerateBar.svelte';
	import ContextMenu from '$lib/components/ui/ContextMenu.svelte';
	import TagPills from '$lib/components/tags/TagPills.svelte';
	import { Heart } from '@manacore/shared-icons';

	const allTags: { value: Tag[] } = getContext('tags');
	const allImages: { value: Image[] } = getContext('allImages');
	const allImageTags: { value: { imageId: string; tagId: string }[] } = getContext('allImageTags');

	// Derive filtered images reactively from live query data
	const filteredImages = $derived.by(() => {
		let result = allImages.value;

		// Filter favorites
		if ($showFavoritesOnly) {
			result = getFavoriteImages(result);
		}

		// Filter by tags
		if ($selectedTags.length > 0) {
			result = getImagesByTags(result, allImageTags.value, $selectedTags);
		}

		return result;
	});
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
		{#if allTags.value.length > 0}
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					>Tags:</span
				>
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

<div class="px-4 py-8 pb-32">
	<GalleryGrid images={filteredImages} />
</div>

<!-- Image Detail Modal -->
<ImageDetailModal image={$selectedImage} onClose={() => selectedImage.set(null)} />

<!-- Context Menu -->
<ContextMenu />

<!-- Quick Generate Bar (conditionally visible) -->
{#if $isUIVisible}
	<QuickGenerateBar />
{/if}
