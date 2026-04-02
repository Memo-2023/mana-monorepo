<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { albumMutations } from '$lib/stores/albums.svelte';
	import { photoStore } from '$lib/stores/photos.svelte';
	import { getAlbumById, getAlbumItemsForAlbum } from '$lib/data/queries';
	import PhotoGrid from '$lib/components/gallery/PhotoGrid.svelte';
	import PhotoDetailModal from '$lib/components/gallery/PhotoDetailModal.svelte';
	import type { Album, AlbumItem, Photo } from '@photos/shared';
	import { CaretRight, Minus } from '@manacore/shared-icons';

	const allAlbums: { readonly value: Album[] } = getContext('albums');
	const allAlbumItems: { readonly value: AlbumItem[] } = getContext('albumItems');

	const albumId = $derived($page.params.id);
	let currentAlbum = $derived(getAlbumById(allAlbums.value, albumId));
	let albumItems = $derived(getAlbumItemsForAlbum(allAlbumItems.value, albumId));
	let albumPhotos = $derived(albumItems.map((item) => ({ id: item.mediaId }) as Photo));

	function handlePhotoClick(photo: any) {
		photoStore.selectPhoto(photo);
	}

	function handleCloseModal() {
		photoStore.selectPhoto(null);
	}

	async function handleDeleteAlbum() {
		if (confirm($_('albums.deleteConfirm'))) {
			const success = await albumMutations.deleteAlbum(albumId);
			if (success) {
				goto('/albums');
			}
		}
	}
</script>

<svelte:head>
	<title>{currentAlbum?.name || $_('albums.title')} | Photos</title>
</svelte:head>

<div class="album-detail-page">
	{#if !currentAlbum}
		<div class="loading-state">
			<div class="animate-pulse text-muted-foreground">{$_('common.loading')}</div>
		</div>
	{:else}
		<header class="page-header">
			<div class="flex items-center gap-3">
				<button class="icon-btn" onclick={() => goto('/albums')} title="Back">
					<CaretRight size={20} />
				</button>
				<div>
					<h1 class="text-2xl font-bold">{currentAlbum.name}</h1>
					{#if currentAlbum.description}
						<p class="text-sm text-muted-foreground">{currentAlbum.description}</p>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">
					{albumPhotos.length}
					{$_('albums.items')}
				</span>
				<button
					class="icon-btn text-destructive"
					onclick={handleDeleteAlbum}
					title={$_('albums.delete')}
				>
					<Minus size={20} />
				</button>
			</div>
		</header>

		{#if albumPhotos.length === 0}
			<div class="empty-state">
				<p class="text-muted-foreground">{$_('gallery.empty')}</p>
			</div>
		{:else}
			<PhotoGrid
				photos={albumPhotos}
				loading={false}
				hasMore={false}
				onPhotoClick={handlePhotoClick}
				onLoadMore={() => {}}
			/>
		{/if}
	{/if}

	{#if photoStore.selectedPhoto}
		<PhotoDetailModal photo={photoStore.selectedPhoto} onClose={handleCloseModal} />
	{/if}
</div>

<style>
	.album-detail-page {
		max-width: 1600px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.loading-state,
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 300px;
	}

	.error-message {
		padding: 1rem;
		background-color: var(--color-destructive);
		color: var(--color-destructive-foreground);
		border-radius: var(--radius-md);
	}
</style>
