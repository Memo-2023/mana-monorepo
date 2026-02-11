<script lang="ts">
	import type { Photo } from '@photos/shared';
	import { photoStore } from '$lib/stores/photos.svelte';

	interface Props {
		photo: Photo;
		onClick: () => void;
	}

	let { photo, onClick }: Props = $props();

	let loaded = $state(false);
	let error = $state(false);

	function handleFavoriteClick(e: Event) {
		e.stopPropagation();
		photoStore.toggleFavorite(photo.id);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="photo-card"
	onclick={onClick}
	onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
	role="button"
	tabindex="0"
>
	{#if !loaded && !error}
		<div class="placeholder"></div>
	{/if}

	<img
		src={photo.thumbnailUrl || photo.url}
		alt=""
		class="photo-image"
		class:loaded
		onload={() => (loaded = true)}
		onerror={() => (error = true)}
	/>

	{#if error}
		<div class="error-placeholder">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="32"
				height="32"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
				<circle cx="9" cy="9" r="2" />
				<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
			</svg>
		</div>
	{/if}

	<div class="photo-overlay">
		<button
			type="button"
			class="favorite-btn"
			class:favorited={photo.isFavorited}
			onclick={handleFavoriteClick}
			title={photo.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill={photo.isFavorited ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
				/>
			</svg>
		</button>
	</div>
</div>

<style>
	.photo-card {
		position: relative;
		aspect-ratio: 1;
		overflow: hidden;
		border-radius: var(--radius-md);
		background-color: var(--color-muted);
		cursor: pointer;
		border: none;
		padding: 0;
		transition:
			transform 200ms ease,
			box-shadow 200ms ease;
	}

	.photo-card:hover {
		transform: scale(1.02);
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
		z-index: 10;
	}

	.placeholder {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, var(--color-muted) 0%, var(--color-accent) 100%);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.photo-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 200ms;
	}

	.photo-image.loaded {
		opacity: 1;
	}

	.error-placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-muted-foreground);
	}

	.photo-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, transparent 40%);
		opacity: 0;
		transition: opacity 150ms;
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;
		padding: 0.5rem;
	}

	.photo-card:hover .photo-overlay {
		opacity: 1;
	}

	.favorite-btn {
		padding: 0.5rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.9);
		color: var(--color-muted-foreground);
		border: none;
		cursor: pointer;
		transition: all 150ms;
	}

	.favorite-btn:hover {
		transform: scale(1.1);
	}

	.favorite-btn.favorited {
		color: #ef4444;
	}
</style>
