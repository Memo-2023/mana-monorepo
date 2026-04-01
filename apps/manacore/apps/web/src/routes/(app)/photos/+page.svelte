<script lang="ts">
	import { onMount } from 'svelte';
	import { photoStore } from '$lib/modules/photos/stores/photos.svelte';
	import PhotoGrid from '$lib/modules/photos/components/gallery/PhotoGrid.svelte';
	import PhotoDetailModal from '$lib/modules/photos/components/gallery/PhotoDetailModal.svelte';
	import FilterBar from '$lib/modules/photos/components/filters/FilterBar.svelte';
	import { Image } from '@manacore/shared-icons';

	let showFilters = $state(false);

	onMount(async () => {
		await photoStore.loadPhotos(true);
	});

	function handlePhotoClick(photo: any) {
		photoStore.selectPhoto(photo);
	}

	function handleCloseModal() {
		photoStore.selectPhoto(null);
	}

	function handleLoadMore() {
		photoStore.loadMore();
	}
</script>

<svelte:head>
	<title>Gallery | Photos - ManaCore</title>
</svelte:head>

<div class="gallery-page">
	<header class="page-header">
		<h1 class="text-2xl font-bold">Gallery</h1>
		<div class="flex items-center gap-2">
			{#if photoStore.stats}
				<span class="text-sm text-muted-foreground">
					{photoStore.stats.totalCount}
					{photoStore.stats.totalCount === 1 ? 'photo' : 'photos'}
				</span>
			{/if}
			<button class="icon-btn" onclick={() => (showFilters = !showFilters)} title="Filters">
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
					<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
				</svg>
			</button>
		</div>
	</header>

	{#if showFilters}
		<FilterBar />
	{/if}

	{#if photoStore.error}
		<div class="error-message">
			<p>{photoStore.error}</p>
		</div>
	{:else if photoStore.photos.length === 0 && !photoStore.loading}
		<div class="empty-state">
			<Image size={20} class="text-muted-foreground" />
			<h2 class="text-lg font-medium mt-4">No photos yet</h2>
			<p class="text-muted-foreground">Upload some photos to get started.</p>
		</div>
	{:else}
		<PhotoGrid
			photos={photoStore.photos}
			loading={photoStore.loading}
			hasMore={photoStore.hasMore}
			onPhotoClick={handlePhotoClick}
			onLoadMore={handleLoadMore}
		/>
	{/if}

	{#if photoStore.selectedPhoto}
		<PhotoDetailModal photo={photoStore.selectedPhoto} onClose={handleCloseModal} />
	{/if}
</div>

<style>
	.gallery-page {
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
		margin-bottom: 1rem;
	}
</style>
