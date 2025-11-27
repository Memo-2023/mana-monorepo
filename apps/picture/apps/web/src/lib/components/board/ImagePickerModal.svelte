<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/auth';
	import { images, isLoading as isLoadingImages } from '$lib/stores/images';
	import { canvasItems, addCanvasItem } from '$lib/stores/canvas';
	import { getImages } from '$lib/api/images';
	import { addBoardItem, isImageOnBoard } from '$lib/api/boardItems';
	import { showToast } from '$lib/stores/toast';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Database } from '@picture/shared/types';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	type Image = Database['public']['Tables']['images']['Row'];

	let selectedImages = $state<Set<string>>(new Set());
	let isAdding = $state(false);
	let searchQuery = $state('');
	let currentPage = $state(1);
	let hasMore = $state(true);

	const boardId = $derived($page.params.id);

	// Load images when modal opens
	$effect(() => {
		if (open && $user) {
			loadImages();
		}
	});

	async function loadImages() {
		if (!$user) return;

		isLoadingImages.set(true);
		try {
			const data = await getImages({
				userId: $user.id,
				page: 1,
				limit: 50,
				archived: false,
			});
			images.set(data);
			currentPage = 1;
			hasMore = data.length === 50;
		} catch (error) {
			console.error('Error loading images:', error);
			showToast('Fehler beim Laden der Bilder', 'error');
		} finally {
			isLoadingImages.set(false);
		}
	}

	function toggleImageSelection(imageId: string) {
		if (selectedImages.has(imageId)) {
			selectedImages.delete(imageId);
		} else {
			selectedImages.add(imageId);
		}
		// Trigger reactivity
		selectedImages = new Set(selectedImages);
	}

	function isImageSelected(imageId: string): boolean {
		return selectedImages.has(imageId);
	}

	function isImageAlreadyOnBoard(imageId: string): boolean {
		return $canvasItems.some((item) => item.image_id === imageId);
	}

	async function handleAddImages() {
		if (selectedImages.size === 0 || !boardId) return;

		isAdding = true;
		try {
			let addedCount = 0;

			for (const imageId of selectedImages) {
				// Check if already on board
				if (isImageAlreadyOnBoard(imageId)) {
					continue;
				}

				// Get image details
				const image = $images.find((img) => img.id === imageId);
				if (!image) continue;

				// Add to board
				const boardItem = await addBoardItem({
					board_id: boardId,
					image_id: imageId,
					position_x: 100 + addedCount * 20, // Offset each image slightly
					position_y: 100 + addedCount * 20,
					scale_x: 1,
					scale_y: 1,
					rotation: 0,
					z_index: addedCount,
					opacity: 1,
					width: image.width || 400,
					height: image.height || 300,
				});

				// Add to canvas
				addCanvasItem(boardItem);
				addedCount++;
			}

			selectedImages.clear();
			selectedImages = new Set();
			showToast(`${addedCount} ${addedCount === 1 ? 'Bild' : 'Bilder'} hinzugefügt`, 'success');
			onClose();
		} catch (error) {
			console.error('Error adding images:', error);
			showToast('Fehler beim Hinzufügen', 'error');
		} finally {
			isAdding = false;
		}
	}

	function handleSelectAll() {
		const availableImages = $images.filter((img) => !isImageAlreadyOnBoard(img.id));
		selectedImages = new Set(availableImages.map((img) => img.id));
	}

	function handleDeselectAll() {
		selectedImages.clear();
		selectedImages = new Set();
	}

	const filteredImages = $derived(
		searchQuery.trim()
			? $images.filter((img) => img.prompt?.toLowerCase().includes(searchQuery.toLowerCase()))
			: $images
	);
</script>

<Modal {open} {onClose} size="large">
	<div class="flex h-[80vh] flex-col p-6">
		<!-- Header -->
		<div class="mb-6">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Bilder hinzufügen</h2>
			<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
				Wähle Bilder aus deiner Galerie aus
			</p>
		</div>

		<!-- Search & Actions -->
		<div class="mb-4 flex items-center gap-3">
			<div class="relative flex-1">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Bilder suchen..."
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
				/>
				<svg
					class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>

			<Button
				variant="outline"
				size="sm"
				onclick={selectedImages.size > 0 ? handleDeselectAll : handleSelectAll}
			>
				{selectedImages.size > 0 ? 'Abwählen' : 'Alle auswählen'}
			</Button>
		</div>

		<!-- Selection Info -->
		{#if selectedImages.size > 0}
			<div class="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
				<p class="text-sm font-medium text-blue-900 dark:text-blue-100">
					{selectedImages.size}
					{selectedImages.size === 1 ? 'Bild' : 'Bilder'} ausgewählt
				</p>
			</div>
		{/if}

		<!-- Images Grid -->
		<div class="flex-1 overflow-y-auto">
			{#if $isLoadingImages}
				<div class="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
					{#each Array(15) as _}
						<div class="aspect-square animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
					{/each}
				</div>
			{:else if filteredImages.length === 0}
				<div class="flex h-full flex-col items-center justify-center py-12">
					<svg
						class="h-16 w-16 text-gray-300 dark:text-gray-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<p class="mt-4 text-gray-600 dark:text-gray-400">
						{searchQuery ? 'Keine Bilder gefunden' : 'Keine Bilder in deiner Galerie'}
					</p>
				</div>
			{:else}
				<div class="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
					{#each filteredImages as image (image.id)}
						{@const selected = isImageSelected(image.id)}
						{@const alreadyOnBoard = isImageAlreadyOnBoard(image.id)}
						<button
							onclick={() => !alreadyOnBoard && toggleImageSelection(image.id)}
							disabled={alreadyOnBoard}
							class="group relative aspect-square overflow-hidden rounded-lg transition-all {selected
								? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
								: ''} {alreadyOnBoard
								? 'cursor-not-allowed opacity-40'
								: 'hover:ring-2 hover:ring-gray-300'}"
						>
							<img
								src={image.public_url}
								alt={image.prompt || 'Image'}
								class="h-full w-full object-cover"
							/>

							<!-- Selection Indicator -->
							{#if selected}
								<div
									class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
							{/if}

							<!-- Already on Board Badge -->
							{#if alreadyOnBoard}
								<div
									class="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-medium text-white"
								>
									Bereits auf Board
								</div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Footer Actions -->
		<div class="mt-6 flex gap-3">
			<Button variant="outline" class="flex-1" onclick={onClose}>Abbrechen</Button>
			<Button
				class="flex-1"
				onclick={handleAddImages}
				disabled={selectedImages.size === 0}
				loading={isAdding}
			>
				{selectedImages.size > 0
					? `${selectedImages.size} ${selectedImages.size === 1 ? 'Bild' : 'Bilder'} hinzufügen`
					: 'Bilder hinzufügen'}
			</Button>
		</div>
	</div>
</Modal>
