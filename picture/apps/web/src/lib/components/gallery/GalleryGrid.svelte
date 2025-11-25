<script lang="ts">
	import type { Database } from '@picture/shared/types';
	import ImageCard from './ImageCard.svelte';
	import { selectedImage } from '$lib/stores/images';
	import { viewMode, type ViewMode } from '$lib/stores/view';

	type Image = Database['public']['Tables']['images']['Row'];

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
			<svg
				class="mx-auto h-24 w-24 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
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
