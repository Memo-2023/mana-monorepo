<script lang="ts">
	import type { Album } from '@photos/shared';
	import AlbumCard from './AlbumCard.svelte';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { albumMutations } from '$lib/stores/albums.svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		albums: Album[];
		loading: boolean;
		onAlbumClick: (album: Album) => void;
	}

	let { albums, loading, onAlbumClick }: Props = $props();

	// Context menu state
	let contextMenuVisible = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);
	let contextMenuAlbum = $state<Album | null>(null);

	function handleContextMenu(e: MouseEvent, album: Album) {
		e.preventDefault();
		e.stopPropagation();
		contextMenuX = e.clientX;
		contextMenuY = e.clientY;
		contextMenuAlbum = album;
		contextMenuVisible = true;
	}

	function getContextMenuItems(): ContextMenuItem[] {
		if (!contextMenuAlbum) return [];
		const album = contextMenuAlbum;

		return [
			{
				id: 'open',
				label: $_('contextMenu.open'),
				action: () => onAlbumClick(album),
			},
			{ id: 'divider-1', label: '', type: 'divider' },
			{
				id: 'delete',
				label: $_('common.delete'),
				variant: 'danger',
				action: () => albumMutations.deleteAlbum(album.id),
			},
		];
	}
</script>

<div class="album-grid">
	{#each albums as album (album.id)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div oncontextmenu={(e) => handleContextMenu(e, album)}>
			<AlbumCard {album} onClick={() => onAlbumClick(album)} />
		</div>
	{/each}
</div>

<ContextMenu
	visible={contextMenuVisible}
	x={contextMenuX}
	y={contextMenuY}
	items={getContextMenuItems()}
	onClose={() => {
		contextMenuVisible = false;
		contextMenuAlbum = null;
	}}
/>

{#if loading}
	<div class="loading-indicator">
		<div class="spinner"></div>
	</div>
{/if}

<style>
	.album-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.loading-indicator {
		display: flex;
		justify-content: center;
		padding: 2rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
