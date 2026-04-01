<script lang="ts">
	import { onMount } from 'svelte';
	import type { Photo } from '$lib/modules/photos/types';
	import PhotoCard from './PhotoCard.svelte';

	interface Props {
		photos: Photo[];
		loading: boolean;
		hasMore: boolean;
		onPhotoClick: (photo: Photo) => void;
		onLoadMore: () => void;
	}

	let { photos, loading, hasMore, onPhotoClick, onLoadMore }: Props = $props();

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
		<PhotoCard {photo} onClick={() => onPhotoClick(photo)} />
	{/each}
</div>

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
		gap: 4px;
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
		border: 3px solid var(--color-border, #e2e8f0);
		border-top-color: var(--color-primary, #6366f1);
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
