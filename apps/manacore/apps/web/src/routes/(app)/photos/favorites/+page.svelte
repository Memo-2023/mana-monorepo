<script lang="ts">
	import { getContext } from 'svelte';
	import { photoStore } from '$lib/modules/photos/stores/photos.svelte';
	import PhotoGrid from '$lib/modules/photos/components/gallery/PhotoGrid.svelte';
	import PhotoDetailModal from '$lib/modules/photos/components/gallery/PhotoDetailModal.svelte';
	import type { Photo, LocalFavorite } from '$lib/modules/photos/types';
	import { Heart } from '@manacore/shared-icons';

	const allFavorites: { readonly value: LocalFavorite[] } = getContext('favorites');

	// Derive favorite photos from live query (auto-updates when favorites change)
	let favorites = $derived<Photo[]>(
		allFavorites.value.map((f) => ({ id: f.mediaId, isFavorited: true }) as Photo)
	);

	function handlePhotoClick(photo: Photo) {
		photoStore.selectPhoto(photo);
	}

	function handleCloseModal() {
		photoStore.selectPhoto(null);
	}
</script>

<svelte:head>
	<title>Favorites | Photos - ManaCore</title>
</svelte:head>

<div class="favorites-page">
	<header class="page-header">
		<h1 class="text-2xl font-bold">Favorites</h1>
		<span class="text-sm text-muted-foreground">
			{favorites.length}
			{favorites.length === 1 ? 'photo' : 'photos'}
		</span>
	</header>

	{#if favorites.length === 0}
		<div class="empty-state">
			<Heart size={20} class="text-muted-foreground" />
			<h2 class="text-lg font-medium mt-4">No favorites yet</h2>
			<p class="text-muted-foreground">Heart a photo to add it to your favorites.</p>
		</div>
	{:else}
		<PhotoGrid
			photos={favorites}
			loading={false}
			hasMore={false}
			onPhotoClick={handlePhotoClick}
			onLoadMore={() => {}}
		/>
	{/if}

	{#if photoStore.selectedPhoto}
		<PhotoDetailModal photo={photoStore.selectedPhoto} onClose={handleCloseModal} />
	{/if}
</div>

<style>
	.favorites-page {
		max-width: 1600px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
	}
</style>
