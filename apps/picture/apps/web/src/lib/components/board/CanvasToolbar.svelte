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
		deselectAll,
	} from '$lib/stores/canvas';
	import { boardSettings } from '$lib/stores/boards';
	import Button from '$lib/components/ui/Button.svelte';
	import Konva from 'konva';
	import {
		CaretLeft,
		ArrowCounterClockwise,
		ArrowClockwise,
		Minus,
		Plus,
		GridFour,
		Table,
		Trash,
		TextT,
		Image,
		DownloadSimple,
	} from '@manacore/shared-icons';

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
			mimeType: 'image/png',
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
				<CaretLeft size={20} weight="bold" />
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
				<ArrowCounterClockwise size={20} weight="bold" />
			</button>

			<button
				onclick={redo}
				disabled={!$canRedo}
				class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
				title="Wiederherstellen (⌘⇧Z)"
			>
				<ArrowClockwise size={20} weight="bold" />
			</button>

			<div class="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

			<!-- Zoom Controls -->
			<button
				onclick={zoomOut}
				class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
				title="Verkleinern"
			>
				<Minus size={20} weight="bold" />
			</button>

			<div
				class="flex h-10 min-w-[4rem] items-center justify-center rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100"
			>
				{zoomPercentage}%
			</div>

			<button
				onclick={zoomIn}
				class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
				title="Vergrößern"
			>
				<Plus size={20} weight="bold" />
			</button>

			<button
				onclick={handleZoomToFit}
				class="flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
				title="An Fenster anpassen"
			>
				Fit
			</button>

			<button
				onclick={resetZoom}
				class="flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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
				<GridFour size={20} weight="bold" />
			</button>

			<!-- Snap Toggle -->
			<button
				onclick={() => snapToGrid.set(!$snapToGrid)}
				class="flex h-10 w-10 items-center justify-center rounded-lg transition-colors {$snapToGrid
					? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
					: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}"
				title="Am Raster einrasten"
			>
				<Table size={20} weight="bold" />
			</button>

			{#if hasSelection}
				<div class="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

				<!-- Delete Selection -->
				<button
					onclick={handleDelete}
					class="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
					title="Löschen (Entf)"
				>
					<Trash size={20} weight="bold" />
				</button>
			{/if}
		</div>

		<!-- Right: Actions -->
		<div class="flex items-center gap-2">
			<Button variant="outline" onclick={onAddText}>
				<TextT size={20} class="mr-2" />
				Text
			</Button>

			<Button variant="outline" onclick={onAddImages}>
				<Image size={20} class="mr-2" />
				Bilder
			</Button>

			<Button variant="secondary" onclick={handleExport}>
				<DownloadSimple size={20} class="mr-2" />
				Exportieren
			</Button>
		</div>
	</div>
</div>
