<script lang="ts">
	import type { NodeKind } from '$lib/types/content';

	interface ImageItem {
		id: string;
		image_url: string;
		prompt?: string;
		is_primary: boolean;
		sort_order: number;
		created_at: string;
	}

	interface Props {
		images: ImageItem[];
		nodeSlug: string;
		nodeKind: NodeKind;
		editable?: boolean;
		onImageUpdate?: () => void;
	}

	let { images = [], nodeSlug, nodeKind, editable = false, onImageUpdate }: Props = $props();

	let selectedImage = $state<ImageItem | null>(null);
	let showLightbox = $state(false);
	let loading = $state(false);

	// Sort images: primary first, then by sort_order
	let sortedImages = $derived(
		[...images].sort((a, b) => {
			if (a.is_primary && !b.is_primary) return -1;
			if (!a.is_primary && b.is_primary) return 1;
			return a.sort_order - b.sort_order;
		})
	);

	let primaryImage = $derived(sortedImages.find((img) => img.is_primary) || sortedImages[0]);
	let galleryImages = $derived(sortedImages.filter((img) => !img.is_primary));

	function openLightbox(image: ImageItem) {
		selectedImage = image;
		showLightbox = true;
	}

	function closeLightbox() {
		showLightbox = false;
		selectedImage = null;
	}

	async function setPrimaryImage(imageId: string) {
		if (!editable || loading) return;

		loading = true;
		try {
			const response = await fetch(`/api/nodes/${nodeSlug}/images/${imageId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_primary: true }),
			});

			if (response.ok) {
				onImageUpdate?.();
			} else {
				console.error('Failed to set primary image');
			}
		} catch (error) {
			console.error('Error setting primary image:', error);
		} finally {
			loading = false;
		}
	}

	async function deleteImage(imageId: string) {
		if (!editable || loading) return;

		loading = true;
		try {
			const response = await fetch(`/api/nodes/${nodeSlug}/images/${imageId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				onImageUpdate?.();
			} else {
				console.error('Failed to delete image');
			}
		} catch (error) {
			console.error('Error deleting image:', error);
		} finally {
			loading = false;
		}
	}

	// Get aspect ratio class based on node kind for primary image display
	function getAspectClass() {
		switch (nodeKind) {
			case 'world':
			case 'place':
				return 'w-full aspect-[21/9]'; // 21:9 ultrawide
			case 'character':
				return 'w-full aspect-[9/16]'; // Portrait 9:16 format
			case 'object':
			default:
				return 'w-full aspect-square'; // 1:1
		}
	}
</script>

{#if images.length > 0}
	<!-- Primary Image Display -->
	{#if primaryImage}
		<div class="mb-6">
			<div class="group relative">
				<button onclick={() => openLightbox(primaryImage)} class="block w-full">
					<img
						src={primaryImage.image_url}
						alt="Hauptbild"
						class={`${getAspectClass()} rounded-lg object-cover shadow-lg transition-shadow hover:shadow-xl`}
						onload={() => console.log('🖼️ Primary image loaded:', primaryImage.image_url)}
						onerror={(e) =>
							console.error('🚨 Primary image failed to load:', primaryImage.image_url, e)}
					/>
				</button>
			</div>
		</div>
	{/if}

	<!-- Gallery Grid -->
	{#if galleryImages.length > 0}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
			{#each galleryImages as image}
				<div class="group relative">
					<button onclick={() => openLightbox(image)} class="block w-full">
						<img
							src={image.image_url}
							alt="Galeriebild"
							class="aspect-square w-full rounded-lg object-cover shadow transition-shadow hover:shadow-lg"
							onload={() => console.log('🖼️ Gallery image loaded:', image.image_url)}
							onerror={(e) => console.error('🚨 Gallery image failed to load:', image.image_url, e)}
						/>
					</button>

					{#if editable}
						<div
							class="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<button
								onclick={() => setPrimaryImage(image.id)}
								disabled={loading}
								class="rounded-full bg-white p-1 shadow-md hover:bg-yellow-50 disabled:opacity-50"
								title="Als Hauptbild setzen"
							>
								<svg class="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
									<path
										d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
									/>
								</svg>
							</button>
							<button
								onclick={() => deleteImage(image.id)}
								disabled={loading}
								class="hover:bg-theme-error/10 rounded-full bg-theme-surface p-1 shadow-md disabled:opacity-50"
								title="Löschen"
							>
								<svg
									class="h-4 w-4 text-theme-error"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{:else}
	<div class="py-8 text-center text-gray-500">Noch keine Bilder vorhanden</div>
{/if}

<!-- Lightbox -->
{#if showLightbox && selectedImage}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
		onclick={closeLightbox}
		onkeydown={(e) => e.key === 'Enter' && closeLightbox()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="relative max-h-full max-w-6xl">
			<img
				src={selectedImage.image_url}
				alt="Vollbild"
				class="max-h-[90vh] max-w-full object-contain"
			/>

			<button
				onclick={closeLightbox}
				aria-label="Close lightbox"
				class="absolute right-4 top-4 text-white hover:text-gray-300"
			>
				<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>

			{#if selectedImage.prompt}
				<div
					class="absolute bottom-4 left-4 right-4 mx-auto max-w-2xl rounded-lg bg-black bg-opacity-75 p-4 text-white"
				>
					<p class="text-sm">{selectedImage.prompt}</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
