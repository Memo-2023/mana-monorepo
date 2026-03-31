<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { photoStore } from '$lib/stores/photos.svelte';
	import PhotoGrid from '$lib/components/gallery/PhotoGrid.svelte';
	import PhotoDetailModal from '$lib/components/gallery/PhotoDetailModal.svelte';
	import type { Photo } from '@photos/shared';
	import type { LocalFavorite } from '$lib/data/local-store';
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
	<title>{$_('favorites.title')} | Photos</title>
</svelte:head>

<div class="favorites-page">
	<header class="page-header">
		<h1 class="text-2xl font-bold">{$_('favorites.title')}</h1>
		<span class="text-sm text-muted-foreground">
			{favorites.length}
			{favorites.length === 1 ? $_('gallery.photo') : $_('gallery.photos')}
		</span>
	</header>

	{#if favorites.length === 0}
		<div class="empty-state">
			<Heart size={20} class="text-muted-foreground" />
			<h2 class="text-lg font-medium mt-4">{$_('favorites.empty')}</h2>
			<p class="text-muted-foreground">{$_('favorites.emptyHint')}</p>
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

	.error-message {
		padding: 1rem;
		background-color: var(--color-destructive);
		color: var(--color-destructive-foreground);
		border-radius: var(--radius-md);
	}
</style>
