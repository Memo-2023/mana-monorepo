<script lang="ts">
	import type { BlockRenderProps } from '../types';
	import type { GalleryProps } from './schema';

	let { block, mode }: BlockRenderProps<GalleryProps> = $props();

	const isEdit = $derived(mode === 'edit');

	// Lightbox state — public-mode only; edit mode doesn't launch the
	// modal because clicking an image is how the user selects the
	// gallery block for editing.
	let lightboxIndex = $state<number | null>(null);

	function openLightbox(i: number) {
		if (mode !== 'public' || !block.props.lightbox) return;
		lightboxIndex = i;
	}

	function closeLightbox() {
		lightboxIndex = null;
	}

	function nextImage() {
		if (lightboxIndex === null) return;
		lightboxIndex = (lightboxIndex + 1) % block.props.images.length;
	}

	function prevImage() {
		if (lightboxIndex === null) return;
		lightboxIndex = (lightboxIndex - 1 + block.props.images.length) % block.props.images.length;
	}

	function onKey(e: KeyboardEvent) {
		if (lightboxIndex === null) return;
		if (e.key === 'Escape') closeLightbox();
		if (e.key === 'ArrowRight') nextImage();
		if (e.key === 'ArrowLeft') prevImage();
	}

	const activeImage = $derived(lightboxIndex !== null ? block.props.images[lightboxIndex] : null);
</script>

<svelte:window onkeydown={onKey} />

<section
	class="wb-gallery wb-gallery--cols-{block.props.columns} wb-gallery--gap-{block.props.gap}"
	class:wb-gallery--masonry={block.props.layout === 'masonry'}
	data-mode={mode}
>
	{#if block.props.title}
		<h2 class="wb-gallery__title">{block.props.title}</h2>
	{/if}

	{#if block.props.images.length === 0 && isEdit}
		<div class="wb-gallery__empty">Füge im Inspector Bilder hinzu.</div>
	{:else}
		<div class="wb-gallery__grid">
			{#each block.props.images as image, i (i)}
				<figure class="wb-gallery__item">
					{#if mode === 'public' && block.props.lightbox}
						<button
							class="wb-gallery__item-trigger"
							onclick={() => openLightbox(i)}
							aria-label={image.altText || `Bild ${i + 1} öffnen`}
						>
							<img src={image.url} alt={image.altText} loading="lazy" />
						</button>
					{:else}
						<img src={image.url} alt={image.altText} loading="lazy" />
					{/if}
					{#if image.caption}
						<figcaption>{image.caption}</figcaption>
					{/if}
				</figure>
			{/each}
		</div>
	{/if}
</section>

{#if activeImage && mode === 'public'}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="wb-lightbox"
		role="dialog"
		aria-modal="true"
		aria-label="Vollbild-Ansicht"
		tabindex="-1"
		onclick={closeLightbox}
		onkeydown={(e) => e.key === 'Escape' && closeLightbox()}
	>
		<button class="wb-lightbox__close" onclick={closeLightbox} aria-label="Schließen">×</button>
		<button
			class="wb-lightbox__nav wb-lightbox__nav--prev"
			onclick={(e) => {
				e.stopPropagation();
				prevImage();
			}}
			aria-label="Vorheriges Bild">‹</button
		>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<figure
			class="wb-lightbox__figure"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<img src={activeImage.url} alt={activeImage.altText} />
			{#if activeImage.caption}
				<figcaption>{activeImage.caption}</figcaption>
			{/if}
		</figure>
		<button
			class="wb-lightbox__nav wb-lightbox__nav--next"
			onclick={(e) => {
				e.stopPropagation();
				nextImage();
			}}
			aria-label="Nächstes Bild">›</button
		>
	</div>
{/if}

<style>
	.wb-gallery {
		padding: 2rem 1.5rem;
		max-width: 72rem;
		margin: 0 auto;
	}
	.wb-gallery__title {
		margin: 0 0 1.5rem;
		font-size: 1.75rem;
	}
	.wb-gallery__empty {
		padding: 3rem 1rem;
		text-align: center;
		border: 1px dashed rgba(127, 127, 127, 0.25);
		border-radius: 0.5rem;
		opacity: 0.45;
		font-style: italic;
	}
	.wb-gallery__grid {
		display: grid;
	}
	.wb-gallery--cols-2 .wb-gallery__grid {
		grid-template-columns: repeat(2, 1fr);
	}
	.wb-gallery--cols-3 .wb-gallery__grid {
		grid-template-columns: repeat(3, 1fr);
	}
	.wb-gallery--cols-4 .wb-gallery__grid {
		grid-template-columns: repeat(4, 1fr);
	}
	.wb-gallery--gap-sm .wb-gallery__grid {
		gap: 0.375rem;
	}
	.wb-gallery--gap-md .wb-gallery__grid {
		gap: 0.75rem;
	}
	.wb-gallery--gap-lg .wb-gallery__grid {
		gap: 1.5rem;
	}
	.wb-gallery--masonry .wb-gallery__grid {
		/* CSS masonry not universal; fallback to regular grid with row
		   flow. Switch to true masonry behind a feature flag later. */
		grid-auto-rows: masonry;
	}
	@media (max-width: 640px) {
		.wb-gallery--cols-2 .wb-gallery__grid,
		.wb-gallery--cols-3 .wb-gallery__grid,
		.wb-gallery--cols-4 .wb-gallery__grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	.wb-gallery__item {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		color: inherit;
	}
	.wb-gallery__item-trigger {
		display: block;
		padding: 0;
		background: transparent;
		border: none;
		cursor: pointer;
	}
	.wb-gallery__item img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: 0.375rem;
		transition: transform 0.2s ease;
	}
	.wb-gallery__item-trigger:hover img {
		transform: scale(1.02);
	}
	.wb-gallery__item figcaption {
		margin-top: 0.25rem;
		font-size: 0.8125rem;
		opacity: 0.7;
		text-align: left;
	}

	.wb-lightbox {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.88);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 2rem;
		cursor: zoom-out;
	}
	.wb-lightbox__figure {
		margin: 0;
		max-width: min(90vw, 72rem);
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		cursor: default;
	}
	.wb-lightbox__figure img {
		max-width: 100%;
		max-height: 80vh;
		object-fit: contain;
		border-radius: 0.375rem;
	}
	.wb-lightbox__figure figcaption {
		color: white;
		font-size: 0.875rem;
		opacity: 0.8;
		text-align: center;
	}
	.wb-lightbox__close,
	.wb-lightbox__nav {
		position: absolute;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: white;
		font-size: 1.5rem;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.wb-lightbox__close {
		top: 1.5rem;
		right: 1.5rem;
	}
	.wb-lightbox__nav--prev {
		left: 1.5rem;
	}
	.wb-lightbox__nav--next {
		right: 1.5rem;
	}
	.wb-lightbox__close:hover,
	.wb-lightbox__nav:hover {
		background: rgba(255, 255, 255, 0.18);
	}
</style>
