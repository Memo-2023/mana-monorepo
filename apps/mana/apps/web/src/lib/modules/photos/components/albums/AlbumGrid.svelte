<script lang="ts">
	import type { Album } from '$lib/modules/photos/types';
	import AlbumCard from './AlbumCard.svelte';

	interface Props {
		albums: Album[];
		loading: boolean;
		onAlbumClick: (album: Album) => void;
	}

	let { albums, loading, onAlbumClick }: Props = $props();
</script>

<div class="album-grid">
	{#each albums as album (album.id)}
		<AlbumCard {album} onClick={() => onAlbumClick(album)} />
	{/each}
</div>

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
		border: 3px solid hsl(var(--color-border));
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
