<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Photo } from '$lib/modules/photos/types';
	import { photoStore } from '$lib/modules/photos/stores/photos.svelte';
	import { CaretRight, DownloadSimple, Heart, MapPin, X } from '@mana/shared-icons';
	import { TagChip } from '@mana/shared-ui';
	import { reverseGeocode, formatLocality, type GeocodingResult } from '$lib/geocoding';

	interface Props {
		photo: Photo;
		onClose: () => void;
	}

	let { photo, onClose }: Props = $props();

	let showInfo = $state(true);

	// Reverse geocoding for GPS coordinates
	let locationLabel = $state<string | null>(null);
	let locationResult = $state<GeocodingResult | null>(null);

	$effect(() => {
		const lat = photo.exif?.gpsLatitude;
		const lon = photo.exif?.gpsLongitude;
		if (lat && lon) {
			locationLabel = null;
			locationResult = null;
			reverseGeocode(lat, lon).then((result) => {
				if (result) {
					locationResult = result;
					locationLabel = formatLocality(result);
				}
			});
		} else {
			locationLabel = null;
			locationResult = null;
		}
	});

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

<div class="lightbox-backdrop" onclick={handleBackdropClick} role="presentation" tabindex="-1">
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
							{#if locationLabel}
								<p class="info-value location-line">
									<MapPin size={12} />
									<span>{locationLabel}</span>
								</p>
								{#if locationResult?.address.city && locationResult.address.country}
									<p class="info-value location-sub">
										{[locationResult.address.city, locationResult.address.country]
											.filter(Boolean)
											.join(', ')}
									</p>
								{/if}
							{:else}
								<p class="info-value location-loading">Wird ermittelt…</p>
							{/if}
							<a
								class="info-value location-map-link"
								href={`https://www.openstreetmap.org/?mlat=${photo.exif.gpsLatitude}&mlon=${photo.exif.gpsLongitude}#map=17/${photo.exif.gpsLatitude}/${photo.exif.gpsLongitude}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								In OpenStreetMap öffnen →
							</a>
						</div>
					{/if}
				{/if}

				{#if photo.tags && photo.tags.length > 0}
					<div class="info-section">
						<h4 class="info-label">Tags</h4>
						<div class="flex flex-wrap gap-2">
							{#each photo.tags as tag}
								<TagChip name={tag.name} color={tag.color} />
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Lightbox backdrop is intentionally near-black regardless of theme — photos
	   need a neutral viewing chrome. */
	.lightbox-backdrop {
		position: fixed;
		inset: 0;
		background: hsl(0 0% 0% / 0.95);
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
		background: hsl(0 0% 100% / 0.1);
		color: white;
		border: none;
		cursor: pointer;
		z-index: 10;
		transition: background 150ms;
	}

	.close-btn:hover {
		background: hsl(0 0% 100% / 0.2);
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
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		overflow-y: auto;
		padding: 1.5rem;
	}

	.info-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
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
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: all 150ms;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.action-btn:hover {
		background: hsl(var(--color-accent));
	}
	.action-btn.favorited {
		color: hsl(var(--color-error));
		border-color: hsl(var(--color-error));
	}

	.info-section {
		margin-bottom: 1rem;
	}

	.info-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.info-value {
		font-size: 0.875rem;
	}

	.location-line {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-weight: 500;
	}

	.location-sub {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		margin-top: 0.125rem;
	}

	.location-loading {
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
	}

	.location-map-link {
		display: inline-block;
		margin-top: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-decoration: none;
	}

	.location-map-link:hover {
		color: #0ea5e9;
	}

	.icon-btn {
		padding: 0.25rem;
		border-radius: 50%;
		background: transparent;
		color: hsl(var(--color-foreground));
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
