<script lang="ts">
	import type { Image } from '$lib/api/images';
	import Modal from '../ui/Modal.svelte';
	import Button from '../ui/Button.svelte';
	import { unarchiveImage, deleteImage, downloadImage } from '$lib/api/images';
	import { archivedImages } from '$lib/stores/archive';
	import { DownloadSimple, ArrowCounterClockwise, Trash } from '@manacore/shared-icons';

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
		if (!image || !image.publicUrl) return;
		const filename = `picture-${image.id}.png`;
		downloadImage(image.publicUrl, filename);
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('de-DE', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(date);
	}
</script>

<Modal open={!!image} {onClose}>
	{#if image}
		<div class="flex flex-col gap-6 p-6 md:flex-row">
			<!-- Image -->
			<div class="flex-1">
				<img
					src={image.publicUrl}
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
					<p class="text-gray-900">{image.model || 'Unknown'}</p>
				</div>

				<!-- Created At -->
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-500">Created</h3>
					<p class="text-gray-900">{formatDate(image.createdAt)}</p>
				</div>

				<!-- Actions -->
				<div class="space-y-2">
					<Button variant="primary" class="w-full" onclick={handleDownload}>
						<DownloadSimple size={20} class="mr-2" />
						Download
					</Button>

					<Button
						variant="secondary"
						class="w-full"
						onclick={handleUnarchive}
						loading={isUnarchiving}
						disabled={isUnarchiving || isDeleting}
					>
						<ArrowCounterClockwise size={20} class="mr-2" />
						Restore to Gallery
					</Button>

					<Button
						variant="danger"
						class="w-full"
						onclick={handleDelete}
						loading={isDeleting}
						disabled={isUnarchiving || isDeleting}
					>
						<Trash size={20} class="mr-2" />
						Delete Permanently
					</Button>
				</div>
			</div>
		</div>
	{/if}
</Modal>
