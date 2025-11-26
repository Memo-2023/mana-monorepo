<script lang="ts">
	import type { Database } from '@picture/shared/types';
	import Modal from '../ui/Modal.svelte';
	import Button from '../ui/Button.svelte';
	import { unarchiveImage, deleteImage, downloadImage } from '$lib/api/images';
	import { archivedImages } from '$lib/stores/archive';

	type Image = Database['public']['Tables']['images']['Row'];

	interface Props {
		image: Image | null;
		onClose: () => void;
	}

	let { image, onClose }: Props = $props();

	let isUnarchiving = $state(false);
	let isDeleting = $state(false);

	async function handleUnarchive() {
		if (!image) return;

		isUnarchiving = true;
		try {
			await unarchiveImage(image.id);
			// Update store
			archivedImages.update((current) => current.filter((img) => img.id !== image.id));
			onClose();
		} catch (error) {
			console.error('Error unarchiving image:', error);
			alert('Failed to unarchive image');
		} finally {
			isUnarchiving = false;
		}
	}

	async function handleDelete() {
		if (!image) return;
		if (!confirm('Are you sure you want to delete this image? This action cannot be undone.'))
			return;

		isDeleting = true;
		try {
			await deleteImage(image.id);
			// Update store
			archivedImages.update((current) => current.filter((img) => img.id !== image.id));
			onClose();
		} catch (error) {
			console.error('Error deleting image:', error);
			alert('Failed to delete image');
		} finally {
			isDeleting = false;
		}
	}

	function handleDownload() {
		if (!image) return;
		const filename = `picture-${image.id}.png`;
		downloadImage(image.public_url, filename);
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('de-DE', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}
</script>

<Modal open={!!image} {onClose}>
	{#if image}
		<div class="flex flex-col gap-6 p-6 md:flex-row">
			<!-- Image -->
			<div class="flex-1">
				<img
					src={image.public_url}
					alt={image.prompt}
					class="h-auto w-full rounded-lg object-contain"
				/>
			</div>

			<!-- Details -->
			<div class="w-full space-y-6 md:w-96">
				<div>
					<h2 class="text-2xl font-bold text-gray-900">Details</h2>
					<div class="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1">
						<span class="text-sm font-medium text-gray-700">Archived</span>
					</div>
				</div>

				<!-- Prompt -->
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-500">Prompt</h3>
					<p class="text-gray-900">{image.prompt}</p>
				</div>

				<!-- Model -->
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-500">Model</h3>
					<p class="text-gray-900">{image.model_id || 'Unknown'}</p>
				</div>

				<!-- Created At -->
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-500">Created</h3>
					<p class="text-gray-900">{formatDate(image.created_at)}</p>
				</div>

				<!-- Actions -->
				<div class="space-y-2">
					<Button variant="primary" class="w-full" onclick={handleDownload}>
						<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
						Download
					</Button>

					<Button
						variant="secondary"
						class="w-full"
						onclick={handleUnarchive}
						loading={isUnarchiving}
						disabled={isUnarchiving || isDeleting}
					>
						<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
							/>
						</svg>
						Restore to Gallery
					</Button>

					<Button
						variant="danger"
						class="w-full"
						onclick={handleDelete}
						loading={isDeleting}
						disabled={isUnarchiving || isDeleting}
					>
						<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
						Delete Permanently
					</Button>
				</div>
			</div>
		</div>
	{/if}
</Modal>
