<script lang="ts">
	import Text from '$lib/components/atoms/Text.svelte';

	interface Photo {
		id: string;
		url: string;
		thumbnail?: string;
		caption?: string;
		created_at: string;
	}

	interface Props {
		photos: Photo[];
		onPhotoClick?: (photo: Photo) => void;
		onPhotoDelete?: (photoId: string) => void;
		onPhotoAdd?: () => void;
		canEdit?: boolean;
	}

	let { photos, onPhotoClick, onPhotoDelete, onPhotoAdd, canEdit = false }: Props = $props();

	let selectedPhoto = $state<Photo | null>(null);
	let showLightbox = $state(false);

	function handlePhotoClick(photo: Photo) {
		selectedPhoto = photo;
		showLightbox = true;
		if (onPhotoClick) {
			onPhotoClick(photo);
		}
	}

	function closeLightbox() {
		showLightbox = false;
		selectedPhoto = null;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!showLightbox) return;

		if (e.key === 'Escape') {
			closeLightbox();
		} else if (e.key === 'ArrowLeft') {
			navigatePhoto(-1);
		} else if (e.key === 'ArrowRight') {
			navigatePhoto(1);
		}
	}

	function navigatePhoto(direction: number) {
		if (!selectedPhoto) return;

		const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
		const newIndex = currentIndex + direction;

		if (newIndex >= 0 && newIndex < photos.length) {
			selectedPhoto = photos[newIndex];
		}
	}

	$effect(() => {
		if (showLightbox) {
			document.addEventListener('keydown', handleKeyDown);
			return () => document.removeEventListener('keydown', handleKeyDown);
		}
	});
</script>

{#if photos.length > 0 || canEdit}
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<Text variant="small" weight="semibold" class="uppercase text-theme-secondary">Photos</Text>
			{#if canEdit && onPhotoAdd}
				<button
					onclick={onPhotoAdd}
					class="flex items-center gap-1 text-xs text-primary hover:underline"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					<Text variant="muted">Add Photo</Text>
				</button>
			{/if}
		</div>

		<!-- Photo Grid -->
		{#if photos.length > 0}
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
				{#each photos as photo (photo.id)}
					<div class="group relative aspect-square overflow-hidden rounded-lg bg-content">
						<button
							onclick={() => handlePhotoClick(photo)}
							class="h-full w-full transition-transform group-hover:scale-105"
						>
							<img
								src={photo.thumbnail || photo.url}
								alt={photo.caption || 'Photo'}
								class="h-full w-full object-cover"
							/>
						</button>

						<!-- Delete Button (if editable) -->
						{#if canEdit && onPhotoDelete}
							<button
								onclick={(e) => {
									e.stopPropagation();
									if (onPhotoDelete) onPhotoDelete(photo.id);
								}}
								class="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
								title="Delete photo"
							>
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						{/if}

						<!-- Caption Overlay -->
						{#if photo.caption}
							<div
								class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<Text variant="muted" class="text-white line-clamp-2">{photo.caption}</Text>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else if canEdit}
			<div class="rounded-lg border-2 border-dashed border-theme p-8 text-center">
				<svg
					class="mx-auto mb-3 h-12 w-12 text-theme-secondary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				<Text variant="small" class="mb-2 text-theme-secondary">No photos yet</Text>
				<button onclick={onPhotoAdd} class="btn-secondary text-sm">Add your first photo</button>
			</div>
		{/if}
	</div>
{/if}

<!-- Lightbox Modal -->
{#if showLightbox && selectedPhoto}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm" onclick={closeLightbox}></div>

	<!-- Lightbox Content -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative max-h-full max-w-5xl" onclick={(e) => e.stopPropagation()}>
			<!-- Image -->
			<img
				src={selectedPhoto.url}
				alt={selectedPhoto.caption || 'Photo'}
				class="max-h-[90vh] w-auto rounded-lg shadow-2xl"
			/>

			<!-- Caption -->
			{#if selectedPhoto.caption}
				<div class="mt-4 rounded-lg bg-menu p-4">
					<Text variant="body">{selectedPhoto.caption}</Text>
				</div>
			{/if}

			<!-- Close Button -->
			<button
				onclick={closeLightbox}
				class="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
				title="Close (Esc)"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>

			<!-- Navigation Arrows -->
			{#if photos.length > 1}
				<button
					onclick={() => navigatePhoto(-1)}
					class="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70 disabled:opacity-50"
					disabled={photos.findIndex((p) => p.id === selectedPhoto.id) === 0}
					title="Previous (←)"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>

				<button
					onclick={() => navigatePhoto(1)}
					class="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70 disabled:opacity-50"
					disabled={photos.findIndex((p) => p.id === selectedPhoto.id) === photos.length - 1}
					title="Next (→)"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			{/if}

			<!-- Photo Counter -->
			<div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2">
				<Text variant="small" class="text-white">
					{photos.findIndex((p) => p.id === selectedPhoto.id) + 1} / {photos.length}
				</Text>
			</div>
		</div>
	</div>
{/if}
