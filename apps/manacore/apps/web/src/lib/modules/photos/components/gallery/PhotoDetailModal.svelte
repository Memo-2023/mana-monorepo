<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Photo } from '$lib/modules/photos/types';
	import { photoStore } from '$lib/modules/photos/stores/photos.svelte';
	import { CaretRight, DownloadSimple, Heart, X } from '@manacore/shared-icons';

	interface Props {
		photo: Photo;
		onClose: () => void;
	}

	let { photo, onClose }: Props = $props();

	let showInfo = $state(true);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function handleBackdropClick(e: Event) {
		if (e.target === e.currentTarget) onClose();
	}

	function handleFavorite() {
		photoStore.toggleFavorite(photo.id);
	}

	function formatDate(date: string | Date | null | undefined) {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function formatSize(bytes: number | null | undefined) {
		if (!bytes) return '-';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="lightbox-backdrop" onclick={handleBackdropClick}>
	<div class="lightbox-container">
		<button class="close-btn" onclick={onClose}>
			<X size={20} />
		</button>

		<div class="lightbox-main">
			<img src={photo.url} alt="" class="lightbox-image" />
		</div>

		{#if showInfo}
			<div class="info-panel">
				<div class="info-header">
					<h3 class="font-medium">Details</h3>
					<button class="icon-btn" onclick={() => (showInfo = false)}>
						<CaretRight size={20} />
					</button>
				</div>

				<div class="info-actions">
					<button class="action-btn" class:favorited={photo.isFavorited} onclick={handleFavorite}>
						<Heart size={20} />
						{photo.isFavorited ? 'Favorit entfernen' : 'Favorit'}
					</button>
					<a class="action-btn" href={photo.url} download target="_blank" rel="noopener noreferrer">
						<DownloadSimple size={20} />
						Download
					</a>
				</div>

				<div class="info-section">
					<h4 class="info-label">Auflösung</h4>
					<p class="info-value">
						{photo.width && photo.height ? `${photo.width} x ${photo.height}` : '-'}
					</p>
				</div>

				<div class="info-section">
					<h4 class="info-label">Größe</h4>
					<p class="info-value">{formatSize(photo.size)}</p>
				</div>

				<div class="info-section">
					<h4 class="info-label">Datum</h4>
					<p class="info-value">{formatDate(photo.exif?.dateTaken || photo.createdAt)}</p>
				</div>

				{#if photo.exif}
					{#if photo.exif.cameraMake || photo.exif.cameraModel}
						<div class="info-section">
							<h4 class="info-label">Kamera</h4>
							<p class="info-value">
								{[photo.exif.cameraMake, photo.exif.cameraModel].filter(Boolean).join(' ')}
							</p>
						</div>
					{/if}

					{#if photo.exif.focalLength}
						<div class="info-section">
							<h4 class="info-label">Brennweite</h4>
							<p class="info-value">{photo.exif.focalLength}</p>
						</div>
					{/if}

					{#if photo.exif.aperture}
						<div class="info-section">
							<h4 class="info-label">Blende</h4>
							<p class="info-value">f/{photo.exif.aperture}</p>
						</div>
					{/if}

					{#if photo.exif.iso}
						<div class="info-section">
							<h4 class="info-label">ISO</h4>
							<p class="info-value">ISO {photo.exif.iso}</p>
						</div>
					{/if}

					{#if photo.exif.gpsLatitude && photo.exif.gpsLongitude}
						<div class="info-section">
							<h4 class="info-label">Standort</h4>
							<a
								class="info-value text-primary hover:underline"
								href={`https://www.google.com/maps?q=${photo.exif.gpsLatitude},${photo.exif.gpsLongitude}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								Auf Karte anzeigen
							</a>
						</div>
					{/if}
				{/if}

				{#if photo.tags && photo.tags.length > 0}
					<div class="info-section">
						<h4 class="info-label">Tags</h4>
						<div class="flex flex-wrap gap-2">
							{#each photo.tags as tag}
								<span
									class="rounded-full px-2 py-0.5 text-xs"
									style="background-color: {tag.color}20; color: {tag.color}"
								>
									{tag.name}
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.lightbox-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.95);
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lightbox-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		left: 1rem;
		padding: 0.5rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: none;
		cursor: pointer;
		z-index: 10;
		transition: background 150ms;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.lightbox-main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.lightbox-image {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.info-panel {
		width: 320px;
		background: var(--color-card, #ffffff);
		color: var(--color-foreground, #0f172a);
		overflow-y: auto;
		padding: 1.5rem;
	}

	.info-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border, #e2e8f0);
	}

	.info-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		background: var(--color-background, #ffffff);
		color: var(--color-foreground, #0f172a);
		cursor: pointer;
		transition: all 150ms;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.action-btn:hover {
		background: var(--color-accent, #f1f5f9);
	}
	.action-btn.favorited {
		color: #ef4444;
		border-color: #ef4444;
	}

	.info-section {
		margin-bottom: 1rem;
	}

	.info-label {
		font-size: 0.75rem;
		color: var(--color-muted-foreground, #64748b);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.info-value {
		font-size: 0.875rem;
	}

	.icon-btn {
		padding: 0.25rem;
		border-radius: 50%;
		background: transparent;
		color: var(--color-foreground, #0f172a);
		border: none;
		cursor: pointer;
	}

	@media (max-width: 768px) {
		.info-panel {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			width: 100%;
			max-height: 50%;
			border-radius: 1rem 1rem 0 0;
		}
	}
</style>
