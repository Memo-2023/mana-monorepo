<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { photoStore } from '$lib/stores/photos.svelte';
	import PhotoGrid from '$lib/components/gallery/PhotoGrid.svelte';
	import PhotoDetailModal from '$lib/components/gallery/PhotoDetailModal.svelte';
	import FilterBar from '$lib/components/filters/FilterBar.svelte';

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
	<title>{$_('gallery.title')} | Photos</title>
</svelte:head>

<div class="gallery-page">
	<header class="page-header">
		<h1 class="text-2xl font-bold">{$_('gallery.title')}</h1>
		<div class="flex items-center gap-2">
			{#if photoStore.stats}
				<span class="text-sm text-muted-foreground">
					{photoStore.stats.totalCount}
					{photoStore.stats.totalCount === 1 ? $_('gallery.photo') : $_('gallery.photos')}
				</span>
			{/if}
			<button
				class="icon-btn"
				onclick={() => (showFilters = !showFilters)}
				title={$_('filters.title')}
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
				<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
				<circle cx="9" cy="9" r="2" />
				<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
			</svg>
			<h2 class="text-lg font-medium mt-4">{$_('gallery.empty')}</h2>
			<p class="text-muted-foreground">{$_('gallery.emptyHint')}</p>
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
