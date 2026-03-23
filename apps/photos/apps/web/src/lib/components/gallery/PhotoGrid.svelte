<script lang="ts">
	import { onMount } from 'svelte';
	import type { Photo } from '@photos/shared';
	import PhotoCard from './PhotoCard.svelte';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { photoStore } from '$lib/stores/photos.svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		photos: Photo[];
		loading: boolean;
		hasMore: boolean;
		onPhotoClick: (photo: Photo) => void;
		onLoadMore: () => void;
	}

	let { photos, loading, hasMore, onPhotoClick, onLoadMore }: Props = $props();

	// Context menu state
	let contextMenuVisible = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);
	let contextMenuPhoto = $state<Photo | null>(null);

	function handleContextMenu(e: MouseEvent, photo: Photo) {
		e.preventDefault();
		e.stopPropagation();
		contextMenuX = e.clientX;
		contextMenuY = e.clientY;
		contextMenuPhoto = photo;
		contextMenuVisible = true;
	}

	function getContextMenuItems(): ContextMenuItem[] {
		if (!contextMenuPhoto) return [];
		const photo = contextMenuPhoto;

		return [
			{
				id: 'view',
				label: $_('contextMenu.view'),
				action: () => onPhotoClick(photo),
			},
			{
				id: 'favorite',
				label: photo.isFavorited
					? $_('contextMenu.removeFromFavorites')
					: $_('contextMenu.addToFavorites'),
				action: () => photoStore.toggleFavorite(photo.id),
			},
			{ id: 'divider-1', label: '', type: 'divider' },
			{
				id: 'delete',
				label: $_('common.delete'),
				variant: 'danger',
				action: () => photoStore.deletePhoto(photo.id),
			},
		];
	}

	let loadMoreRef = $state<HTMLDivElement | null>(null);
	let observer: IntersectionObserver;

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					onLoadMore();
				}
			},
			{ threshold: 0.1 }
		);

		if (loadMoreRef) {
			observer.observe(loadMoreRef);
		}

		return () => {
			observer.disconnect();
		};
	});

	$effect(() => {
		if (loadMoreRef && observer) {
			observer.disconnect();
			observer.observe(loadMoreRef);
		}
	});
</script>

<div class="photo-grid">
	{#each photos as photo (photo.id)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div oncontextmenu={(e) => handleContextMenu(e, photo)}>
			<PhotoCard {photo} onClick={() => onPhotoClick(photo)} />
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
		contextMenuPhoto = null;
	}}
/>

{#if loading}
	<div class="loading-indicator">
		<div class="spinner"></div>
	</div>
{/if}

{#if hasMore}
	<div bind:this={loadMoreRef} class="load-more-trigger"></div>
{/if}

<style>
	.photo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: var(--gallery-gap, 4px);
	}

	@media (min-width: 768px) {
		.photo-grid {
			grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		}
	}

	@media (min-width: 1200px) {
		.photo-grid {
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		}
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

	.load-more-trigger {
		height: 1px;
	}
</style>
