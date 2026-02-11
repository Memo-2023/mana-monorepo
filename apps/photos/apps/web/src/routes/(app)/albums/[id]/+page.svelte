<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { albumStore } from '$lib/stores/albums.svelte';
	import { photoStore } from '$lib/stores/photos.svelte';
	import PhotoGrid from '$lib/components/gallery/PhotoGrid.svelte';
	import PhotoDetailModal from '$lib/components/gallery/PhotoDetailModal.svelte';

	const albumId = $derived($page.params.id);

	onMount(async () => {
		if (albumId) {
			await albumStore.loadAlbum(albumId);
		}
	});

	function handlePhotoClick(photo: any) {
		photoStore.selectPhoto(photo);
	}

	function handleCloseModal() {
		photoStore.selectPhoto(null);
	}

	async function handleDeleteAlbum() {
		if (confirm($_('albums.deleteConfirm'))) {
			const success = await albumStore.deleteAlbum(albumId);
			if (success) {
				goto('/albums');
			}
		}
	}
</script>

<svelte:head>
	<title>{albumStore.currentAlbum?.name || $_('albums.title')} | Photos</title>
</svelte:head>

<div class="album-detail-page">
	{#if albumStore.loading}
		<div class="loading-state">
			<div class="animate-pulse text-muted-foreground">{$_('common.loading')}</div>
		</div>
	{:else if albumStore.error}
		<div class="error-message">
			<p>{albumStore.error}</p>
		</div>
	{:else if albumStore.currentAlbum}
		<header class="page-header">
			<div class="flex items-center gap-3">
				<button class="icon-btn" onclick={() => goto('/albums')} title="Back">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
				</button>
				<div>
					<h1 class="text-2xl font-bold">{albumStore.currentAlbum.name}</h1>
					{#if albumStore.currentAlbum.description}
						<p class="text-sm text-muted-foreground">{albumStore.currentAlbum.description}</p>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">
					{albumStore.albumPhotos.length}
					{$_('albums.items')}
				</span>
				<button
					class="icon-btn text-destructive"
					onclick={handleDeleteAlbum}
					title={$_('albums.delete')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 6h18" />
						<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
						<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
					</svg>
				</button>
			</div>
		</header>

		{#if albumStore.albumPhotos.length === 0}
			<div class="empty-state">
				<p class="text-muted-foreground">{$_('gallery.empty')}</p>
			</div>
		{:else}
			<PhotoGrid
				photos={albumStore.albumPhotos}
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
