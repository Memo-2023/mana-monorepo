<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { albumMutations } from '$lib/modules/photos/stores/albums.svelte';
	import { enrichAlbumsWithCounts } from '$lib/modules/photos/queries';
	import AlbumGrid from '$lib/modules/photos/components/albums/AlbumGrid.svelte';
	import CreateAlbumModal from '$lib/modules/photos/components/albums/CreateAlbumModal.svelte';
	import type { Album, AlbumItem } from '$lib/modules/photos/types';
	import { Folder, Plus } from '@manacore/shared-icons';

	const allAlbums: { readonly value: Album[] } = getContext('albums');
	const allAlbumItems: { readonly value: AlbumItem[] } = getContext('albumItems');

	let albums = $derived(enrichAlbumsWithCounts(allAlbums.value, allAlbumItems.value));

	let showCreateModal = $state(false);

	function handleAlbumClick(album: any) {
		goto(`/photos/albums/${album.id}`);
	}

	async function handleCreateAlbum(data: { name: string; description?: string }) {
		const album = await albumMutations.createAlbum(data);
		if (album) {
			showCreateModal = false;
			goto(`/photos/albums/${album.id}`);
		}
	}
</script>

<svelte:head>
	<title>Albums | Photos - ManaCore</title>
</svelte:head>

<div class="albums-page">
	<header class="page-header">
		<h1 class="text-2xl font-bold">Albums</h1>
		<button class="btn btn-primary" onclick={() => (showCreateModal = true)}>
			<Plus size={20} class="mr-1" />
			Create Album
		</button>
	</header>

	{#if albums.length === 0}
		<div class="empty-state">
			<Folder size={20} class="text-muted-foreground" />
			<h2 class="text-lg font-medium mt-4">No albums yet</h2>
			<p class="text-muted-foreground">Create an album to organize your photos.</p>
			<button class="btn btn-primary mt-4" onclick={() => (showCreateModal = true)}>
				Create Album
			</button>
		</div>
	{:else}
		<AlbumGrid {albums} loading={false} onAlbumClick={handleAlbumClick} />
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
</style>
