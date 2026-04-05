<script lang="ts">
	import { getContext } from 'svelte';
	import { imagesStore } from '$lib/modules/picture/stores/images.svelte';
	import { pictureViewStore } from '$lib/modules/picture/stores/view.svelte';
	import { getFavoriteImages, getImagesByTags } from '$lib/modules/picture/queries';
	import type { Image, LocalImageTag } from '$lib/modules/picture/types';
	import type { Tag } from '@mana/shared-tags';
	import {
		Heart,
		SquaresFour,
		Rows,
		GridFour,
		Plus,
		MagnifyingGlass,
		Star,
		Archive,
	} from '@mana/shared-icons';

	const allImages: { value: Image[] } = getContext('allImages');
	const allPictureTags: { value: Tag[] } = getContext('pictureTags');
	const allImageTags: { value: LocalImageTag[] } = getContext('allImageTags');

	let searchQuery = $state('');
	let selectedTagIds = $state<string[]>([]);

	// Derive filtered images reactively
	let filteredImages = $derived.by(() => {
		let result = allImages.value;

		if (imagesStore.showFavoritesOnly) {
			result = getFavoriteImages(result);
		}

		if (selectedTagIds.length > 0) {
			result = getImagesByTags(result, allImageTags.value, selectedTagIds);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter((img) => img.prompt.toLowerCase().includes(q));
		}

		return result;
	});

	function toggleTag(tagId: string) {
		if (selectedTagIds.includes(tagId)) {
			selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
		} else {
			selectedTagIds = [...selectedTagIds, tagId];
		}
	}

	// Grid columns based on view mode
	let gridClass = $derived(
		pictureViewStore.viewMode === 'single'
			? 'grid-cols-1 max-w-2xl mx-auto'
			: pictureViewStore.viewMode === 'grid3'
				? 'grid-cols-2 sm:grid-cols-3'
				: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'
	);

	let selectedImage = $state<Image | null>(null);

	async function handleToggleFavorite(img: Image) {
		await imagesStore.toggleFavorite(img.id);
	}

	async function handleArchive(img: Image) {
		await imagesStore.archiveImage(img.id);
		selectedImage = null;
	}
</script>

<svelte:head>
	<title>Galerie - Picture - Mana</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Header -->
	<header class="border-b border-border px-4 py-3">
		<div class="flex items-center justify-between mb-3">
			<h1 class="text-lg font-semibold text-foreground">Galerie</h1>
			<div class="flex items-center gap-2">
				<!-- View Mode -->
				<div class="flex rounded-lg border border-border bg-card">
					<button
						onclick={() => pictureViewStore.setViewMode('single')}
						class="p-1.5 {pictureViewStore.viewMode === 'single'
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'} rounded-l-lg transition-colors"
						title="Liste"
					>
						<Rows size={16} />
					</button>
					<button
						onclick={() => pictureViewStore.setViewMode('grid3')}
						class="p-1.5 {pictureViewStore.viewMode === 'grid3'
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'} transition-colors"
						title="Mittel"
					>
						<GridFour size={16} />
					</button>
					<button
						onclick={() => pictureViewStore.setViewMode('grid5')}
						class="p-1.5 {pictureViewStore.viewMode === 'grid5'
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'} rounded-r-lg transition-colors"
						title="Klein"
					>
						<SquaresFour size={16} />
					</button>
				</div>

				<a
					href="/picture/generate"
					class="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
				>
					<Plus size={16} />
					Generieren
				</a>
			</div>
		</div>

		<!-- Search & Filters -->
		<div class="flex flex-wrap items-center gap-2">
			<div class="relative flex-1 min-w-[200px]">
				<MagnifyingGlass
					size={16}
					class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Prompts durchsuchen..."
					class="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
				/>
			</div>

			<button
				onclick={() => imagesStore.toggleFavoritesFilter()}
				class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors {imagesStore.showFavoritesOnly
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:text-foreground'}"
			>
				<Heart size={14} weight={imagesStore.showFavoritesOnly ? 'fill' : 'regular'} />
				Favoriten
			</button>

			{#each allPictureTags.value as tag (tag.id)}
				<button
					onclick={() => toggleTag(tag.id)}
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedTagIds.includes(
						tag.id
					)
						? 'text-white'
						: 'bg-muted text-muted-foreground hover:text-foreground'}"
					style={selectedTagIds.includes(tag.id)
						? `background-color: ${tag.color || '#6b7280'}`
						: ''}
				>
					{tag.name}
				</button>
			{/each}
		</div>
	</header>

	<!-- Gallery Grid -->
	<div class="flex-1 overflow-auto p-4">
		{#if filteredImages.length === 0}
			<div class="flex flex-col items-center justify-center py-20">
				<SquaresFour size={64} weight="thin" class="text-muted-foreground/30" />
				<h3 class="mt-4 text-lg font-semibold text-foreground">
					{allImages.value.length === 0 ? 'Noch keine Bilder' : 'Keine Ergebnisse'}
				</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					{allImages.value.length === 0
						? 'Generiere dein erstes Bild mit KI'
						: 'Passe deine Filter an'}
				</p>
				{#if allImages.value.length === 0}
					<a
						href="/picture/generate"
						class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						Erstes Bild generieren
					</a>
				{/if}
			</div>
		{:else}
			<div class="grid gap-3 {gridClass}">
				{#each filteredImages as img (img.id)}
					<button
						onclick={() => (selectedImage = img)}
						class="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-lg hover:border-primary/50"
					>
						{#if img.publicUrl}
							<img
								src={img.publicUrl}
								alt={img.prompt}
								class="aspect-square w-full object-cover transition-transform group-hover:scale-105"
								loading="lazy"
							/>
						{:else}
							<div class="flex aspect-square items-center justify-center bg-muted">
								<SquaresFour size={32} class="text-muted-foreground/30" />
							</div>
						{/if}

						<!-- Overlay on hover -->
						<div
							class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2"
						>
							<p class="text-xs text-white line-clamp-2">{img.prompt}</p>
						</div>

						<!-- Favorite indicator -->
						{#if img.isFavorite}
							<div class="absolute top-1.5 right-1.5">
								<Heart size={16} weight="fill" class="text-red-500 drop-shadow" />
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Image Detail Modal -->
{#if selectedImage}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
		<div
			class="relative max-h-[90vh] max-w-4xl w-full overflow-auto rounded-xl border border-border bg-card"
		>
			<!-- Image -->
			<div class="relative bg-black flex items-center justify-center">
				{#if selectedImage.publicUrl}
					<img
						src={selectedImage.publicUrl}
						alt={selectedImage.prompt}
						class="max-h-[60vh] w-full object-contain"
					/>
				{:else}
					<div class="flex h-64 items-center justify-center">
						<SquaresFour size={64} class="text-muted-foreground/30" />
					</div>
				{/if}
			</div>

			<!-- Info -->
			<div class="p-4">
				<p class="text-sm text-foreground">{selectedImage.prompt}</p>
				{#if selectedImage.model}
					<p class="mt-1 text-xs text-muted-foreground">Modell: {selectedImage.model}</p>
				{/if}
				{#if selectedImage.width && selectedImage.height}
					<p class="text-xs text-muted-foreground">
						{selectedImage.width} x {selectedImage.height}
					</p>
				{/if}
				<p class="text-xs text-muted-foreground">
					{new Date(selectedImage.createdAt).toLocaleDateString('de-DE', {
						day: 'numeric',
						month: 'long',
						year: 'numeric',
					})}
				</p>

				<div class="mt-3 flex gap-2">
					<button
						onclick={() => selectedImage && handleToggleFavorite(selectedImage)}
						class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border border-border hover:bg-muted transition-colors"
					>
						<Heart
							size={16}
							weight={selectedImage.isFavorite ? 'fill' : 'regular'}
							class={selectedImage.isFavorite ? 'text-red-500' : 'text-muted-foreground'}
						/>
						{selectedImage.isFavorite ? 'Entfernen' : 'Favorit'}
					</button>
					<button
						onclick={() => selectedImage && handleArchive(selectedImage)}
						class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border border-border hover:bg-muted transition-colors"
					>
						<Archive size={16} class="text-muted-foreground" />
						Archivieren
					</button>
					<div class="flex-1"></div>
					<button
						onclick={() => (selectedImage = null)}
						class="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
					>
						Schließen
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
