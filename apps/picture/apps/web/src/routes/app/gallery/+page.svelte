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
	import { imageCollection, imageTagCollection, tagCollection } from '$lib/data/local-store';
	import type { Image } from '$lib/api/images';
	import type { LocalImage } from '$lib/data/local-store';
	import GalleryGrid from '$lib/components/gallery/GalleryGrid.svelte';
	import ImageDetailModal from '$lib/components/gallery/ImageDetailModal.svelte';
	import QuickGenerateBar from '$lib/components/gallery/QuickGenerateBar.svelte';
	import ContextMenu from '$lib/components/ui/ContextMenu.svelte';
	import ImageSkeleton from '$lib/components/ui/ImageSkeleton.svelte';
	import ViewModeSwitcher from '$lib/components/ui/ViewModeSwitcher.svelte';
	import TagPills from '$lib/components/tags/TagPills.svelte';
	import { Heart } from '@manacore/shared-icons';
	import { onMount } from 'svelte';

	const PAGE_SIZE = 20;

	let loadingMore = $state(false);
	let observer: IntersectionObserver | null = null;
	let loadMoreTrigger = $state<HTMLElement | null>(null);

	/** Convert LocalImage (IndexedDB) to the Image type used by components. */
	function toImage(local: LocalImage): Image {
		return {
			id: local.id,
			userId: 'local',
			prompt: local.prompt,
			negativePrompt: local.negativePrompt ?? undefined,
			model: local.model ?? undefined,
			style: local.style ?? undefined,
			publicUrl: local.publicUrl ?? undefined,
			storagePath: local.storagePath,
			filename: local.filename,
			format: local.format ?? undefined,
			width: local.width ?? undefined,
			height: local.height ?? undefined,
			fileSize: local.fileSize ?? undefined,
			blurhash: local.blurhash ?? undefined,
			isPublic: local.isPublic,
			isFavorite: local.isFavorite,
			downloadCount: local.downloadCount,
			rating: local.rating ?? undefined,
			archivedAt: local.archivedAt ?? undefined,
			generationId: local.generationId ?? undefined,
			sourceImageId: local.sourceImageId ?? undefined,
			createdAt: local.createdAt ?? new Date().toISOString(),
			updatedAt: local.updatedAt ?? new Date().toISOString(),
		};
	}

	onMount(() => {
		loadTags().then(() => {
			loadInitialImages();
		});

		// Setup Intersection Observer for infinite scroll
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && $hasMore && !$isLoading && !loadingMore) {
					loadMoreImages();
				}
			},
			{
				threshold: 0.1,
				rootMargin: '100px',
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
			const localTags = await tagCollection.getAll();
			tags.set(
				localTags.map((t) => ({
					id: t.id,
					name: t.name,
					color: t.color ?? undefined,
					createdAt: t.createdAt ?? new Date().toISOString(),
				}))
			);
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
		isLoading.set(true);
		try {
			let allImages = await imageCollection.getAll();

			// Filter out archived images
			allImages = allImages.filter((img) => !img.archivedAt);

			// Filter favorites
			if ($showFavoritesOnly) {
				allImages = allImages.filter((img) => img.isFavorite);
			}

			// Filter by tags
			if ($selectedTags.length > 0) {
				const allImageTags = await imageTagCollection.getAll();
				const imageIdsWithTags = new Set(
					allImageTags.filter((it) => $selectedTags.includes(it.tagId)).map((it) => it.imageId)
				);
				allImages = allImages.filter((img) => imageIdsWithTags.has(img.id));
			}

			// Sort by createdAt descending
			allImages.sort(
				(a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
			);

			// Paginate
			const page1 = allImages.slice(0, PAGE_SIZE);
			images.set(page1.map(toImage));
			currentPage.set(1);
			hasMore.set(allImages.length > PAGE_SIZE);
		} catch (error) {
			console.error('Error loading images:', error);
		} finally {
			isLoading.set(false);
		}
	}

	async function loadMoreImages() {
		if (!$hasMore || $isLoading || loadingMore) return;

		loadingMore = true;
		const nextPage = $currentPage + 1;

		try {
			let allImages = await imageCollection.getAll();
			allImages = allImages.filter((img) => !img.archivedAt);

			if ($showFavoritesOnly) {
				allImages = allImages.filter((img) => img.isFavorite);
			}

			if ($selectedTags.length > 0) {
				const allImageTags = await imageTagCollection.getAll();
				const imageIdsWithTags = new Set(
					allImageTags.filter((it) => $selectedTags.includes(it.tagId)).map((it) => it.imageId)
				);
				allImages = allImages.filter((img) => imageIdsWithTags.has(img.id));
			}

			allImages.sort(
				(a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
			);

			const start = (nextPage - 1) * PAGE_SIZE;
			const pageImages = allImages.slice(start, start + PAGE_SIZE);

			if (pageImages.length > 0) {
				images.update((current) => [...current, ...pageImages.map(toImage)]);
				currentPage.set(nextPage);
				hasMore.set(start + PAGE_SIZE < allImages.length);
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
