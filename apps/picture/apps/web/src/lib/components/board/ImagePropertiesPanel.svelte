<script lang="ts">
	import { selectedItems, updateCanvasItem, removeSelectedItems } from '$lib/stores/canvas';
	import { updateBoardItem, changeBoardItemZIndex, isImageItem } from '$lib/api/boardItems';
	import { Button, toastStore } from '@manacore/shared-ui';
	import {
		Image,
		CaretDoubleUp,
		CaretDoubleDown,
		ArrowUp,
		ArrowDown,
		Trash,
		CursorClick,
	} from '@manacore/shared-icons';

	const selectedItem = $derived($selectedItems[0] || null);
	const hasMultipleSelected = $derived($selectedItems.length > 1);
	const selectedImageItem = $derived(
		selectedItem && isImageItem(selectedItem) ? selectedItem : null
	);

	// Local state for inputs (synced with selected item)
	let positionX = $state(0);
	let positionY = $state(0);
	let scaleX = $state(100);
	let scaleY = $state(100);
	let rotation = $state(0);
	let opacity = $state(100);
	let lockAspectRatio = $state(true);

	// Update local state when selection changes
	$effect(() => {
		if (selectedItem) {
			positionX = Math.round(selectedItem.positionX);
			positionY = Math.round(selectedItem.positionY);
			scaleX = Math.round(selectedItem.scaleX * 100);
			scaleY = Math.round(selectedItem.scaleY * 100);
			rotation = Math.round(selectedItem.rotation);
			opacity = Math.round(selectedItem.opacity * 100);
		}
	});

	async function handlePositionChange(axis: 'x' | 'y', value: number) {
		if (!selectedItem) return;

		const updates = axis === 'x' ? { positionX: value } : { positionY: value };

		updateCanvasItem(selectedItem.id, updates);

		try {
			await updateBoardItem(selectedItem.id, updates);
		} catch (error) {
			console.error('Error updating position:', error);
			toastStore.show('Fehler beim Speichern', 'error');
		}
	}

	async function handleScaleChange(axis: 'x' | 'y', percent: number) {
		if (!selectedItem) return;

		const scale = percent / 100;
		let updates: any = {};

		if (lockAspectRatio) {
			updates = { scaleX: scale, scaleY: scale };
			scaleX = percent;
			scaleY = percent;
		} else {
			updates = axis === 'x' ? { scaleX: scale } : { scaleY: scale };
		}

		updateCanvasItem(selectedItem.id, updates);

		try {
			await updateBoardItem(selectedItem.id, updates);
		} catch (error) {
			console.error('Error updating scale:', error);
			toastStore.show('Fehler beim Speichern', 'error');
		}
	}

	async function handleRotationChange(value: number) {
		if (!selectedItem) return;

		const updates = { rotation: value };
		updateCanvasItem(selectedItem.id, updates);

		try {
			await updateBoardItem(selectedItem.id, updates);
		} catch (error) {
			console.error('Error updating rotation:', error);
			toastStore.show('Fehler beim Speichern', 'error');
		}
	}

	async function handleOpacityChange(percent: number) {
		if (!selectedItem) return;

		const opacityValue = percent / 100;
		const updates = { opacity: opacityValue };
		updateCanvasItem(selectedItem.id, updates);

		try {
			await updateBoardItem(selectedItem.id, updates);
		} catch (error) {
			console.error('Error updating opacity:', error);
			toastStore.show('Fehler beim Speichern', 'error');
		}
	}

	async function handleLayerChange(direction: 'up' | 'down' | 'top' | 'bottom') {
		if (!selectedItem) return;

		try {
			await changeBoardItemZIndex(selectedItem.id, direction);
			toastStore.show('Layer-Reihenfolge geändert', 'success');
		} catch (error) {
			console.error('Error changing layer:', error);
			toastStore.show('Fehler beim Ändern der Layer-Reihenfolge', 'error');
		}
	}

	function handleResetTransform() {
		if (!selectedItem) return;

		positionX = 0;
		positionY = 0;
		scaleX = 100;
		scaleY = 100;
		rotation = 0;
		opacity = 100;

		handlePositionChange('x', 0);
		handlePositionChange('y', 0);
		handleScaleChange('x', 100);
		handleRotationChange(0);
		handleOpacityChange(100);
	}

	function handleDelete() {
		removeSelectedItems();
		toastStore.show('Bild entfernt', 'success');
	}
</script>

{#if hasMultipleSelected}
	<!-- Multiple Selection Info -->
	<div
		class="h-full overflow-y-auto border-l border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
	>
		<div class="text-center">
			<Image size={48} weight="regular" class="mx-auto text-gray-400" />
			<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
				{$selectedItems.length} Bilder ausgewählt
			</h3>
			<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
				Multi-Bearbeitung wird bald unterstützt
			</p>
			<Button variant="danger" class="mt-6" onclick={handleDelete}>Alle löschen</Button>
		</div>
	</div>
{:else if selectedItem}
	<!-- Single Item Properties -->
	<div
		class="h-full overflow-y-auto border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
	>
		<div class="p-6">
			<h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
				Bild-Eigenschaften
			</h3>

			<!-- Image Preview -->
			{#if selectedImageItem?.image}
				<div class="mb-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
					<img src={selectedImageItem.image.publicUrl} alt="Preview" class="w-full" />
				</div>

				<!-- Prompt Info -->
				{#if selectedImageItem.image.prompt}
					<div class="mb-6">
						<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Prompt
						</label>
						<p
							class="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
						>
							{selectedImageItem.image.prompt}
						</p>
					</div>
				{/if}
			{/if}

			<!-- Position -->
			<div class="mb-6">
				<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Position
				</label>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">X</label>
						<input
							type="number"
							bind:value={positionX}
							onchange={() => handlePositionChange('x', positionX)}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
						/>
					</div>
					<div>
						<label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Y</label>
						<input
							type="number"
							bind:value={positionY}
							onchange={() => handlePositionChange('y', positionY)}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
						/>
					</div>
				</div>
			</div>

			<!-- Scale -->
			<div class="mb-6">
				<div class="mb-2 flex items-center justify-between">
					<label class="text-sm font-medium text-gray-700 dark:text-gray-300"> Skalierung </label>
					<button
						onclick={() => (lockAspectRatio = !lockAspectRatio)}
						class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
					>
						{lockAspectRatio ? '🔒 Gesperrt' : '🔓 Frei'}
					</button>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Breite %</label>
						<input
							type="number"
							bind:value={scaleX}
							onchange={() => handleScaleChange('x', scaleX)}
							min="1"
							max="500"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
						/>
					</div>
					<div>
						<label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Höhe %</label>
						<input
							type="number"
							bind:value={scaleY}
							onchange={() => handleScaleChange('y', scaleY)}
							min="1"
							max="500"
							disabled={lockAspectRatio}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
						/>
					</div>
				</div>
				<input
					type="range"
					bind:value={scaleX}
					oninput={() => handleScaleChange('x', scaleX)}
					min="10"
					max="300"
					class="mt-3 w-full"
				/>
			</div>

			<!-- Rotation -->
			<div class="mb-6">
				<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Rotation: {rotation}°
				</label>
				<input
					type="range"
					bind:value={rotation}
					oninput={() => handleRotationChange(rotation)}
					min="0"
					max="360"
					class="w-full"
				/>
				<div class="mt-2 grid grid-cols-4 gap-2">
					<button
						onclick={() => {
							rotation = 0;
							handleRotationChange(0);
						}}
						class="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						0°
					</button>
					<button
						onclick={() => {
							rotation = 90;
							handleRotationChange(90);
						}}
						class="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						90°
					</button>
					<button
						onclick={() => {
							rotation = 180;
							handleRotationChange(180);
						}}
						class="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						180°
					</button>
					<button
						onclick={() => {
							rotation = 270;
							handleRotationChange(270);
						}}
						class="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						270°
					</button>
				</div>
			</div>

			<!-- Opacity -->
			<div class="mb-6">
				<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Deckkraft: {opacity}%
				</label>
				<input
					type="range"
					bind:value={opacity}
					oninput={() => handleOpacityChange(opacity)}
					min="0"
					max="100"
					class="w-full"
				/>
			</div>

			<!-- Layer Order -->
			<div class="mb-6">
				<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Layer-Reihenfolge
				</label>
				<div class="grid grid-cols-2 gap-2">
					<button
						onclick={() => handleLayerChange('top')}
						class="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
					>
						<CaretDoubleUp size={16} />
						Nach vorne
					</button>
					<button
						onclick={() => handleLayerChange('bottom')}
						class="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
					>
						<CaretDoubleDown size={16} />
						Nach hinten
					</button>
					<button
						onclick={() => handleLayerChange('up')}
						class="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
					>
						<ArrowUp size={16} />
						Eine Ebene
					</button>
					<button
						onclick={() => handleLayerChange('down')}
						class="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
					>
						<ArrowDown size={16} />
						Eine Ebene
					</button>
				</div>
			</div>

			<!-- Dimensions Info -->
			<div class="mb-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
				<div class="text-xs text-gray-500 dark:text-gray-400">
					{#if selectedImageItem?.image}
						<div class="flex justify-between py-1">
							<span>Original:</span>
							<span class="font-medium"
								>{selectedImageItem.image.width} × {selectedImageItem.image.height}px</span
							>
						</div>
						<div class="flex justify-between py-1">
							<span>Aktuell:</span>
							<span class="font-medium">
								{Math.round((selectedImageItem.image.width || 0) * selectedItem.scaleX)} ×
								{Math.round((selectedImageItem.image.height || 0) * selectedItem.scaleY)}px
							</span>
						</div>
					{/if}
					<div class="flex justify-between py-1">
						<span>Z-Index:</span>
						<span class="font-medium">{selectedItem.zIndex}</span>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="space-y-2">
				<Button variant="outline" class="w-full" onclick={handleResetTransform}>
					Transform zurücksetzen
				</Button>
				<Button variant="danger" class="w-full" onclick={handleDelete}>
					<Trash size={16} class="mr-2" />
					Bild entfernen
				</Button>
			</div>
		</div>
	</div>
{:else}
	<!-- No Selection -->
	<div
		class="flex h-full items-center justify-center border-l border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
	>
		<div class="text-center">
			<CursorClick size={48} weight="thin" class="mx-auto text-gray-300 dark:text-gray-600" />
			<p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
				Wähle ein Bild aus, um<br />seine Eigenschaften zu bearbeiten
			</p>
		</div>
	</div>
{/if}
