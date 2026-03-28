<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { photoStore } from '$lib/stores/photos.svelte';
	import { favoriteCollection } from '$lib/data/local-store';
	import PhotoGrid from '$lib/components/gallery/PhotoGrid.svelte';
	import PhotoDetailModal from '$lib/components/gallery/PhotoDetailModal.svelte';
	import type { Photo } from '@photos/shared';

	let favorites = $state<Photo[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadFavorites();
	});

	async function loadFavorites() {
		loading = true;
		error = null;

		try {
			const localFavs = await favoriteCollection.getAll();
			// Favorited media IDs — full photo data would come from mana-media
			favorites = localFavs.map((f) => ({ id: f.mediaId, isFavorited: true }) as Photo);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load favorites';
		} finally {
			loading = false;
		}
	}

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

	{#if error}
		<div class="error-message">
			<p>{error}</p>
		</div>
	{:else if favorites.length === 0 && !loading}
		<div class="empty-state">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="64"
				height="64"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-muted-foreground"
			>
				<path
					d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
				/>
			</svg>
			<h2 class="text-lg font-medium mt-4">{$_('favorites.empty')}</h2>
			<p class="text-muted-foreground">{$_('favorites.emptyHint')}</p>
		</div>
	{:else}
		<PhotoGrid
			photos={favorites}
			{loading}
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
