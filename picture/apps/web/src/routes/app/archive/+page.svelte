<script lang="ts">
	import { user } from '$lib/stores/auth';
	import {
		archivedImages,
		isLoadingArchive,
		hasMoreArchive,
		currentArchivePage
	} from '$lib/stores/archive';
	import { getImages } from '$lib/api/images';
	import ArchivedImageCard from '$lib/components/archive/ArchivedImageCard.svelte';
	import ArchivedImageModal from '$lib/components/archive/ArchivedImageModal.svelte';
	import ImageSkeleton from '$lib/components/ui/ImageSkeleton.svelte';
	import ContextMenu from '$lib/components/ui/ContextMenu.svelte';
	import { onMount } from 'svelte';
	import type { Database } from '@picture/shared/types';

	type Image = Database['public']['Tables']['images']['Row'];

	let loadingMore = $state(false);
	let observer: IntersectionObserver | null = null;
	let loadMoreTrigger = $state<HTMLElement | null>(null);
	let selectedImage = $state<Image | null>(null);

	onMount(() => {
		loadInitialImages();

		// Setup Intersection Observer for infinite scroll
		observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					$hasMoreArchive &&
					!$isLoadingArchive &&
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
		};
	});

	async function loadInitialImages() {
		if (!$user) return;

		isLoadingArchive.set(true);
		try {
			const data = await getImages({ userId: $user.id, page: 1, archived: true });
			archivedImages.set(data);
			currentArchivePage.set(1);
			hasMoreArchive.set(data.length === 20);
		} catch (error) {
			console.error('Error loading archived images:', error);
		} finally {
			isLoadingArchive.set(false);
		}
	}

	async function loadMoreImages() {
		if (!$user || !$hasMoreArchive || $isLoadingArchive || loadingMore) return;

		loadingMore = true;
		const nextPage = $currentArchivePage + 1;

		try {
			const newImages = await getImages({ userId: $user.id, page: nextPage, archived: true });
			if (newImages.length > 0) {
				archivedImages.update((current) => [...current, ...newImages]);
				currentArchivePage.set(nextPage);
				hasMoreArchive.set(newImages.length === 20);
			} else {
				hasMoreArchive.set(false);
			}
		} catch (error) {
			console.error('Error loading more archived images:', error);
		} finally {
			loadingMore = false;
		}
	}

	function handleImageClick(image: Image) {
		selectedImage = image;
	}
</script>

<svelte:head>
	<title>Archive - Picture</title>
</svelte:head>

{#if $isLoadingArchive}
	<div class="px-4 py-8">
		<ImageSkeleton count={20} />
	</div>
{:else if $archivedImages.length === 0}
	<div class="flex min-h-[400px] items-center justify-center px-4 py-8">
		<div class="text-center">
			<svg
				class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
				/>
			</svg>
			<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Kein Archiv</h3>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				Archiviere Bilder aus deiner Galerie, um sie organisiert zu halten ohne sie zu löschen
			</p>
		</div>
	</div>
{:else}
	<div class="px-4 py-8 pb-32">
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
			{#each $archivedImages as image (image.id)}
				<ArchivedImageCard {image} onclick={() => handleImageClick(image)} />
			{/each}
		</div>

		<!-- Infinite Scroll Trigger -->
		{#if $hasMoreArchive}
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
<ArchivedImageModal image={selectedImage} onClose={() => (selectedImage = null)} />

<!-- Context Menu -->
<ContextMenu />
