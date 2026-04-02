<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { currentBoard } from '$lib/stores/boards';
	import {
		canvasItems,
		resetCanvasState,
		isLoadingCanvasItems,
		showPropertiesPanel,
		selectedItemIds,
		addCanvasItem,
	} from '$lib/stores/canvas';
	import { getBoardById } from '$lib/api/boards';
	import { getBoardItems, addTextToBoard } from '$lib/api/boardItems';
	import { toastStore } from '@manacore/shared-ui';
	import BoardCanvas from '$lib/components/board/BoardCanvas.svelte';
	import CanvasToolbar from '$lib/components/board/CanvasToolbar.svelte';
	import ImagePickerModal from '$lib/components/board/ImagePickerModal.svelte';
	import ImagePropertiesPanel from '$lib/components/board/ImagePropertiesPanel.svelte';
	import { X, SlidersHorizontal } from '@manacore/shared-icons';

	const boardId = $derived($page.params.id);

	let showImagePicker = $state(false);
	let isLoading = $state(true);

	onMount(() => {
		if (!boardId) {
			goto('/app/board');
			return;
		}

		loadBoard();

		return () => {
			resetCanvasState();
			currentBoard.set(null);
		};
	});

	async function loadBoard() {
		if (!authStore.user || !boardId) return;

		isLoading = true;
		try {
			// Load board metadata
			const board = await getBoardById(boardId);

			// Check if user has access
			if (board.userId !== authStore.user.id && !board.isPublic) {
				toastStore.show('Zugriff verweigert', 'error');
				goto('/app/board');
				return;
			}

			currentBoard.set(board);

			// Load board items
			isLoadingCanvasItems.set(true);
			const items = await getBoardItems(boardId);
			canvasItems.set(items);
		} catch (error) {
			console.error('Error loading board:', error);
			toastStore.show('Fehler beim Laden des Boards', 'error');
			goto('/app/board');
		} finally {
			isLoading = false;
			isLoadingCanvasItems.set(false);
		}
	}

	function handleAddImages() {
		showImagePicker = true;
	}

	async function handleAddText() {
		if (!authStore.user || !boardId) return;

		try {
			// Add text to center of visible area
			const text = await addTextToBoard({
				boardId,
				content: 'Doppelklick zum Bearbeiten',
				position: { x: 200, y: 200 },
			});

			// Add to canvas
			addCanvasItem(text);
			toastStore.show('Text hinzugefügt', 'success');
		} catch (error) {
			console.error('Error adding text:', error);
			toastStore.show('Fehler beim Hinzufügen des Textes', 'error');
		}
	}

	function handleBackToList() {
		goto('/app/board');
	}

	// Auto-open panel when an item is selected
	$effect(() => {
		if ($selectedItemIds.length > 0) {
			showPropertiesPanel.set(true);
		}
	});
</script>

<svelte:head>
	<title>{$currentBoard?.name || 'Board'} - Picture</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
			></div>
			<p class="text-gray-600 dark:text-gray-400">Board wird geladen...</p>
		</div>
	</div>
{:else if $currentBoard}
	<div class="relative flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
		<!-- Toolbar -->
		<CanvasToolbar
			boardName={$currentBoard.name}
			onBack={handleBackToList}
			onAddImages={handleAddImages}
			onAddText={handleAddText}
		/>

		<!-- Canvas -->
		<div class="h-full flex-1 pt-16">
			<BoardCanvas />
		</div>

		<!-- Properties Panel (Right Side) with slide animation -->
		<div
			class="h-full pt-16 transition-all duration-300 ease-in-out {$showPropertiesPanel
				? 'w-80'
				: 'w-0'}"
		>
			{#if $showPropertiesPanel}
				<ImagePropertiesPanel />
			{/if}
		</div>

		<!-- FAB: Properties Panel Toggle (Bottom Right) -->
		<button
			onclick={() => showPropertiesPanel.set(!$showPropertiesPanel)}
			class="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
			title={$showPropertiesPanel ? 'Eigenschaften ausblenden' : 'Eigenschaften anzeigen'}
		>
			{#if $showPropertiesPanel}
				<X size={24} />
			{:else}
				<SlidersHorizontal size={24} />
			{/if}
		</button>

		<!-- Image Picker Modal -->
		<ImagePickerModal open={showImagePicker} onClose={() => (showImagePicker = false)} />
	</div>
{/if}
