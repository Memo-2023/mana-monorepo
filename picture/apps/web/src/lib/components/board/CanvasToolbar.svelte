<script lang="ts">
	import { page } from '$app/stores';
	import {
		canvasZoom,
		showGrid,
		snapToGrid,
		zoomIn,
		zoomOut,
		resetZoom,
		zoomToFit,
		undo,
		redo,
		canUndo,
		canRedo,
		selectedItemIds,
		removeSelectedItems,
		deselectAll
	} from '$lib/stores/canvas';
	import { boardSettings } from '$lib/stores/boards';
	import Button from '$lib/components/ui/Button.svelte';
	import Konva from 'konva';

	interface Props {
		boardName: string;
		onBack: () => void;
		onAddImages: () => void;
		onAddText: () => void;
	}

	let { boardName, onBack, onAddImages, onAddText }: Props = $props();

	const zoomPercentage = $derived(Math.round($canvasZoom * 100));
	const hasSelection = $derived($selectedItemIds.length > 0);

	async function handleExport() {
		// Get the stage element
		const stage = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
		if (!stage) return;

		// Create download link
		const dataURL = stage.toDataURL({
			pixelRatio: 2, // Retina quality
			mimeType: 'image/png'
		});

		const link = document.createElement('a');
		link.download = `${boardName}.png`;
		link.href = dataURL;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function handleZoomToFit() {
		const container = document.querySelector('.konvajs-content')?.parentElement;
		if (!container) return;

		zoomToFit(
			container.clientWidth,
			container.clientHeight,
			$boardSettings.width,
			$boardSettings.height
		);
	}

	function handleDelete() {
		if (!hasSelection) return;
		removeSelectedItems();
	}
</script>

<div
	class="fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/95"
>
	<div class="flex h-16 items-center justify-between px-4">
		<!-- Left: Back + Board Name -->
		<div class="flex items-center gap-4">
			<button
				onclick={onBack}
				class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
				title="Zurück"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>

			<div>
				<h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{boardName}</h1>
				<p class="text-xs text-gray-500 dark:text-gray-400">
					{$boardSettings.width} × {$boardSettings.height}px
				</p>
			</div>
		</div>

		<!-- Center: Tools -->
		<div class="flex items-center gap-2">
			<!-- Undo/Redo -->
			<button
				onclick={undo}
				disabled={!$canUndo}
				class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
				title="Rückgängig (⌘Z)"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
					/>
				</svg>
			</button>

			<button
				onclick={redo}
				disabled={!$canRedo}
				class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
				title="Wiederherstellen (⌘⇧Z)"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
					/>
				</svg>
			</button>

			<div class="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

			<!-- Zoom Controls -->
			<button
				onclick={zoomOut}
				class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
				title="Verkleinern"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
				</svg>
			</button>

			<div class="flex h-10 min-w-[4rem] items-center justify-center rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100">
				{zoomPercentage}%
			</div>

			<button
				onclick={zoomIn}
				class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
				title="Vergrößern"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
			</button>

			<button
				onclick={handleZoomToFit}
				class="flex h-10 px-3 items-center justify-center rounded-lg text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
				title="An Fenster anpassen"
			>
				Fit
			</button>

			<button
				onclick={resetZoom}
				class="flex h-10 px-3 items-center justify-center rounded-lg text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
				title="100%"
			>
				100%
			</button>

			<div class="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

			<!-- Grid Toggle -->
			<button
				onclick={() => showGrid.set(!$showGrid)}
				class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors {$showGrid
					? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
					: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}"
				title="Raster {$showGrid ? 'ausblenden' : 'einblenden'}"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
					/>
				</svg>
			</button>

			<!-- Snap Toggle -->
			<button
				onclick={() => snapToGrid.set(!$snapToGrid)}
				class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors {$snapToGrid
					? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
					: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}"
				title="Am Raster einrasten"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
			</button>

			{#if hasSelection}
				<div class="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

				<!-- Delete Selection -->
				<button
					onclick={handleDelete}
					class="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
					title="Löschen (Entf)"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			{/if}
		</div>

		<!-- Right: Actions -->
		<div class="flex items-center gap-2">
			<Button variant="outline" onclick={onAddText}>
				<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h7"
					/>
				</svg>
				Text
			</Button>

			<Button variant="outline" onclick={onAddImages}>
				<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				Bilder
			</Button>

			<Button variant="secondary" onclick={handleExport}>
				<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
					/>
				</svg>
				Exportieren
			</Button>
		</div>
	</div>
</div>
