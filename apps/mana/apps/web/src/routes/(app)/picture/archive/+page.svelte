<script lang="ts">
	import { getContext } from 'svelte';
	import { imagesStore } from '$lib/modules/picture/stores/images.svelte';
	import { pictureViewStore } from '$lib/modules/picture/stores/view.svelte';
	import type { Image } from '$lib/modules/picture/types';
	import { SquaresFour, ArrowCounterClockwise, Trash, Archive } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';

	const archivedImages: { value: Image[] } = getContext('archivedImages');

	let gridClass = $derived(
		pictureViewStore.viewMode === 'single'
			? 'grid-cols-1 max-w-2xl mx-auto'
			: pictureViewStore.viewMode === 'grid3'
				? 'grid-cols-2 sm:grid-cols-3'
				: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'
	);

	async function handleRestore(img: Image) {
		await imagesStore.restoreImage(img.id);
	}

	async function handleDelete(img: Image) {
		if (!confirm('Bild endgültig löschen?')) return;
		await imagesStore.deleteImage(img.id);
	}
</script>

<svelte:head>
	<title>Archiv - Picture - Mana</title>
</svelte:head>

<RoutePage appId="picture" backHref="/picture">
	<div class="p-4">
		<header class="mb-6">
			<h1 class="text-2xl font-bold text-foreground">Archiv</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Archivierte Bilder werden nicht in der Galerie angezeigt
			</p>
		</header>

		{#if archivedImages.value.length === 0}
			<div class="flex flex-col items-center justify-center py-20">
				<Archive size={64} weight="thin" class="text-muted-foreground/30" />
				<h3 class="mt-4 text-lg font-semibold text-foreground">Archiv ist leer</h3>
				<p class="mt-1 text-sm text-muted-foreground">Archivierte Bilder erscheinen hier</p>
			</div>
		{:else}
			<div class="grid gap-3 {gridClass}">
				{#each archivedImages.value as img (img.id)}
					<div class="group relative overflow-hidden rounded-lg border border-border bg-card">
						{#if img.publicUrl}
							<img
								src={img.publicUrl}
								alt={img.prompt}
								class="aspect-square w-full object-cover opacity-70"
								loading="lazy"
							/>
						{:else}
							<div class="flex aspect-square items-center justify-center bg-muted">
								<SquaresFour size={32} class="text-muted-foreground/30" />
							</div>
						{/if}

						<!-- Actions Overlay -->
						<div
							class="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<button
								onclick={() => handleRestore(img)}
								class="rounded-lg bg-muted/90 p-2 text-foreground hover:bg-white transition-colors"
								title="Wiederherstellen"
							>
								<ArrowCounterClockwise size={18} />
							</button>
							<button
								onclick={() => handleDelete(img)}
								class="rounded-lg bg-red-500/90 p-2 text-white hover:bg-red-600 transition-colors"
								title="Endgültig löschen"
							>
								<Trash size={18} />
							</button>
						</div>

						<div class="p-2">
							<p class="text-xs text-muted-foreground line-clamp-1">{img.prompt}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</RoutePage>
