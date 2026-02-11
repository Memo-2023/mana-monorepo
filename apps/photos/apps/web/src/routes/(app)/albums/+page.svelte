<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { albumStore } from '$lib/stores/albums.svelte';
	import AlbumGrid from '$lib/components/albums/AlbumGrid.svelte';
	import CreateAlbumModal from '$lib/components/albums/CreateAlbumModal.svelte';

	let showCreateModal = $state(false);

	function handleAlbumClick(album: any) {
		goto(`/albums/${album.id}`);
	}

	async function handleCreateAlbum(data: { name: string; description?: string }) {
		const album = await albumStore.createAlbum(data);
		if (album) {
			showCreateModal = false;
			goto(`/albums/${album.id}`);
		}
	}
</script>

<svelte:head>
	<title>{$_('albums.title')} | Photos</title>
</svelte:head>

<div class="albums-page">
	<header class="page-header">
		<h1 class="text-2xl font-bold">{$_('albums.title')}</h1>
		<button class="btn btn-primary" onclick={() => (showCreateModal = true)}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="mr-1"
			>
				<path d="M5 12h14" />
				<path d="M12 5v14" />
			</svg>
			{$_('albums.create')}
		</button>
	</header>

	{#if albumStore.error}
		<div class="error-message">
			<p>{albumStore.error}</p>
		</div>
	{:else if albumStore.albums.length === 0 && !albumStore.loading}
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
					d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
				/>
			</svg>
			<h2 class="text-lg font-medium mt-4">{$_('albums.empty')}</h2>
			<p class="text-muted-foreground">{$_('albums.emptyHint')}</p>
			<button class="btn btn-primary mt-4" onclick={() => (showCreateModal = true)}>
				{$_('albums.create')}
			</button>
		</div>
	{:else}
		<AlbumGrid
			albums={albumStore.albums}
			loading={albumStore.loading}
			onAlbumClick={handleAlbumClick}
		/>
	{/if}

	{#if showCreateModal}
		<CreateAlbumModal onClose={() => (showCreateModal = false)} onCreate={handleCreateAlbum} />
	{/if}
</div>

<style>
	.albums-page {
		max-width: 1400px;
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
