<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { format } from 'date-fns';
	import type { Photo } from '@photos/shared';
	import { photoStore } from '$lib/stores/photos.svelte';

	interface Props {
		photo: Photo;
		onClose: () => void;
	}

	let { photo, onClose }: Props = $props();

	let showInfo = $state(true);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleBackdropClick(e: Event) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleFavorite() {
		photoStore.toggleFavorite(photo.id);
	}

	function formatDate(date: string | Date | null | undefined) {
		if (!date) return '-';
		return format(new Date(date), 'dd.MM.yyyy HH:mm');
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
		<!-- Close button -->
		<button class="close-btn" onclick={onClose} title={$_('common.close')}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
		</button>

		<!-- Main image -->
		<div class="lightbox-main">
			<img src={photo.url} alt="" class="lightbox-image" />
		</div>

		<!-- Info panel -->
		{#if showInfo}
			<div class="info-panel">
				<div class="info-header">
					<h3 class="font-medium">{$_('photo.details')}</h3>
					<button
						class="icon-btn"
						onclick={() => (showInfo = false)}
						title={$_('photo.hideInfo')}
						aria-label={$_('photo.hideInfo')}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
					</button>
				</div>

				<!-- Actions -->
				<div class="info-actions">
					<button class="action-btn" class:favorited={photo.isFavorited} onclick={handleFavorite}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill={photo.isFavorited ? 'currentColor' : 'none'}
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
							/>
						</svg>
						{photo.isFavorited ? $_('photo.unfavorite') : $_('photo.favorite')}
					</button>
					<a class="action-btn" href={photo.url} download target="_blank" rel="noopener noreferrer">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" x2="12" y1="15" y2="3" />
						</svg>
						{$_('photo.download')}
					</a>
				</div>

				<!-- Metadata -->
				<div class="info-section">
					<h4 class="info-label">{$_('exif.dimensions')}</h4>
					<p class="info-value">
						{photo.width && photo.height ? `${photo.width} x ${photo.height}` : '-'}
					</p>
				</div>

				<div class="info-section">
					<h4 class="info-label">Size</h4>
					<p class="info-value">{formatSize(photo.size)}</p>
				</div>

				<div class="info-section">
					<h4 class="info-label">{$_('exif.date')}</h4>
					<p class="info-value">{formatDate(photo.exif?.dateTaken || photo.createdAt)}</p>
				</div>

				{#if photo.exif}
					{#if photo.exif.cameraMake || photo.exif.cameraModel}
						<div class="info-section">
							<h4 class="info-label">{$_('exif.camera')}</h4>
							<p class="info-value">
								{[photo.exif.cameraMake, photo.exif.cameraModel].filter(Boolean).join(' ')}
							</p>
						</div>
					{/if}

					{#if photo.exif.focalLength}
						<div class="info-section">
							<h4 class="info-label">{$_('exif.focalLength')}</h4>
							<p class="info-value">{photo.exif.focalLength}</p>
						</div>
					{/if}

					{#if photo.exif.aperture}
						<div class="info-section">
							<h4 class="info-label">{$_('exif.aperture')}</h4>
							<p class="info-value">f/{photo.exif.aperture}</p>
						</div>
					{/if}

					{#if photo.exif.iso}
						<div class="info-section">
							<h4 class="info-label">{$_('exif.iso')}</h4>
							<p class="info-value">ISO {photo.exif.iso}</p>
						</div>
					{/if}

					{#if photo.exif.exposureTime}
						<div class="info-section">
							<h4 class="info-label">{$_('exif.exposure')}</h4>
							<p class="info-value">{photo.exif.exposureTime}s</p>
						</div>
					{/if}

					{#if photo.exif.gpsLatitude && photo.exif.gpsLongitude}
						<div class="info-section">
							<h4 class="info-label">{$_('exif.location')}</h4>
							<a
								class="info-value location-link"
								href={`https://www.google.com/maps?q=${photo.exif.gpsLatitude},${photo.exif.gpsLongitude}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								View on map
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
									<polyline points="15 3 21 3 21 9" />
									<line x1="10" x2="21" y1="14" y2="3" />
								</svg>
							</a>
						</div>
					{/if}
				{/if}

				<!-- Tags -->
				{#if photo.tags && photo.tags.length > 0}
					<div class="info-section">
						<h4 class="info-label">{$_('photo.tags')}</h4>
						<div class="tags-list">
							{#each photo.tags as tag}
								<span class="tag" style="background-color: {tag.color}20; color: {tag.color}">
									{tag.name}
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<button class="show-info-btn" onclick={() => (showInfo = true)} title="Show info">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" />
					<path d="M12 16v-4" />
					<path d="M12 8h.01" />
				</svg>
			</button>
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
		background: var(--color-card);
		color: var(--color-foreground);
		overflow-y: auto;
		padding: 1.5rem;
	}

	.info-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
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
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 150ms;
		text-decoration: none;
	}

	.action-btn:hover {
		background: var(--color-accent);
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
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.info-value {
		font-size: 0.875rem;
	}

	.location-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--color-primary);
		text-decoration: none;
	}

	.location-link:hover {
		text-decoration: underline;
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
	}

	.show-info-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.5rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: none;
		cursor: pointer;
		z-index: 10;
	}

	.icon-btn {
		padding: 0.25rem;
		border-radius: 50%;
		background: transparent;
		color: var(--color-foreground);
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
			border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		}
	}
</style>
