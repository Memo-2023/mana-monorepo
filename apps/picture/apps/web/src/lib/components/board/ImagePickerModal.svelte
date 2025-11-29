<script lang="ts">
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { images, isLoading as isLoadingImages } from '$lib/stores/images';
	import { canvasItems, addCanvasItem } from '$lib/stores/canvas';
	import { getImages } from '$lib/api/images';
	import { addBoardItem } from '$lib/api/boardItems';
	import { showToast } from '$lib/stores/toast';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { MagnifyingGlass, Image as ImageIcon, Check } from '@manacore/shared-icons';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let selectedImages = $state<Set<string>>(new Set());
	let isAdding = $state(false);
	let searchQuery = $state('');
	let currentPage = $state(1);
	let hasMore = $state(true);

	const boardId = $derived($page.params.id);

	// Load images when modal opens
	$effect(() => {
		if (open && authStore.user) {
			loadImages();
		}
	});

	async function loadImages() {
		if (!authStore.user) return;

		isLoadingImages.set(true);
		try {
			const data = await getImages({
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
		return $canvasItems.some((item) => item.imageId === imageId);
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
					boardId: boardId,
					itemType: 'image',
					imageId: imageId,
					positionX: 100 + addedCount * 20, // Offset each image slightly
					positionY: 100 + addedCount * 20,
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
				<MagnifyingGlass size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
					<ImageIcon size={64} weight="thin" class="text-gray-300 dark:text-gray-600" />
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
								src={image.publicUrl}
								alt={image.prompt || 'Image'}
								class="h-full w-full object-cover"
							/>

							<!-- Selection Indicator -->
							{#if selected}
								<div
									class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white"
								>
									<Check size={16} weight="bold" />
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
