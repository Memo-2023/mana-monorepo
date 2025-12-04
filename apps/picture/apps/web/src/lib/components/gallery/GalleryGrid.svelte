<script lang="ts">
	import type { Image } from '$lib/api/images';
	import ImageCard from './ImageCard.svelte';
	import { selectedImage } from '$lib/stores/images';
	import { viewMode } from '$lib/stores/view';
	import type { ViewMode } from '$lib/stores/view';
	import { Image as ImageIcon } from '@manacore/shared-icons';

	interface Props {
		images: Image[];
	}

	let { images }: Props = $props();

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
</script>

{#if images.length === 0}
	<div class="flex min-h-[400px] items-center justify-center rounded-lg bg-white p-8 shadow">
		<div class="text-center">
			<ImageIcon size={96} weight="thin" class="mx-auto text-gray-400" />
			<h2 class="mt-4 text-xl font-semibold text-gray-900">No images yet</h2>
			<p class="mt-2 text-gray-600">Start generating AI images to see them here.</p>
			<a
				href="/app/generate"
				class="mt-6 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
			>
				Generate Image
			</a>
		</div>
	</div>
{:else}
	<!-- Gallery Grid with dynamic view mode -->
	<div class={getGridClass($viewMode)}>
		{#each images as image (image.id)}
			<ImageCard {image} onclick={() => handleImageClick(image)} viewMode={$viewMode} />
		{/each}
	</div>
{/if}
