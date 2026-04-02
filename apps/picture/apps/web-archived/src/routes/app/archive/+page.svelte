<script lang="ts">
	import type { Image } from '$lib/api/images';
	import ArchivedImageCard from '$lib/components/archive/ArchivedImageCard.svelte';
	import ArchivedImageModal from '$lib/components/archive/ArchivedImageModal.svelte';
	import ContextMenu from '$lib/components/ui/ContextMenu.svelte';
	import { Archive } from '@manacore/shared-icons';
	import { getContext } from 'svelte';

	const archivedImages: { value: Image[] } = getContext('archivedImages');

	let selectedImage = $state<Image | null>(null);

	function handleImageClick(image: Image) {
		selectedImage = image;
	}
</script>

<svelte:head>
	<title>Archive - Picture</title>
</svelte:head>

{#if archivedImages.value.length === 0}
	<div class="flex min-h-[400px] items-center justify-center px-4 py-8">
		<div class="text-center">
			<Archive size={64} weight="thin" class="mx-auto text-gray-400 dark:text-gray-600" />
			<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Kein Archiv</h3>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				Archiviere Bilder aus deiner Galerie, um sie organisiert zu halten ohne sie zu löschen
			</p>
		</div>
	</div>
{:else}
	<div class="px-4 py-8 pb-32">
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
			{#each archivedImages.value as image (image.id)}
				<ArchivedImageCard {image} onclick={() => handleImageClick(image)} />
			{/each}
		</div>
	</div>
{/if}

<!-- Image Detail Modal -->
<ArchivedImageModal image={selectedImage} onClose={() => (selectedImage = null)} />

<!-- Context Menu -->
<ContextMenu />
