<script lang="ts">
	import type { Photo } from '$lib/modules/photos/types';
	import { photoStore } from '$lib/modules/photos/stores/photos.svelte';
	import { Heart, Image } from '@mana/shared-icons';

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
			<Image size={20} />
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
			<Heart size={20} />
		</button>
	</div>
</div>

<style>
	.photo-card {
		position: relative;
		aspect-ratio: 1;
		overflow: hidden;
		border-radius: 0.5rem;
		background-color: hsl(var(--color-muted));
		cursor: pointer;
		border: none;
		padding: 0;
		transition:
			transform 200ms ease,
			box-shadow 200ms ease;
	}

	.photo-card:hover {
		transform: scale(1.02);
		box-shadow: 0 10px 20px hsl(0 0% 0% / 0.2);
		z-index: 10;
	}

	.placeholder {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, hsl(var(--color-muted)) 0%, hsl(var(--color-accent)) 100%);
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
		color: hsl(var(--color-muted-foreground));
	}

	.photo-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, hsl(0 0% 0% / 0.5) 0%, transparent 40%);
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
		background: hsl(0 0% 100% / 0.9);
		color: hsl(var(--color-muted-foreground));
		border: none;
		cursor: pointer;
		transition: all 150ms;
	}

	.favorite-btn:hover {
		transform: scale(1.1);
	}
	.favorite-btn.favorited {
		color: hsl(var(--color-error));
	}
</style>
