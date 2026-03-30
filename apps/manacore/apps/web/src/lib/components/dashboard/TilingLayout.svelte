<script lang="ts">
	/**
	 * TilingLayout — Recursive renderer for the tiling tree.
	 *
	 * Leaf → TilePanel (renders widget)
	 * Split → Flex container with two children and a resize handle between them.
	 */

	import type { TileNode } from '$lib/types/tiling';
	import { tilingStore } from '$lib/stores/tiling.svelte';
	import TilePanel from './TilePanel.svelte';
	import TileResizeHandle from './TileResizeHandle.svelte';
	import Self from './TilingLayout.svelte';

	interface Props {
		node: TileNode;
	}

	let { node }: Props = $props();

	let isResizing = $state(false);
</script>

{#if node.type === 'leaf'}
	<TilePanel leaf={node} />
{:else}
	<div
		class="tile-split"
		class:tile-split-h={node.direction === 'horizontal'}
		class:tile-split-v={node.direction === 'vertical'}
		class:tile-split-resizing={isResizing}
	>
		<div class="tile-child" style:flex={node.ratio}>
			<Self node={node.first} />
		</div>

		<TileResizeHandle
			direction={node.direction}
			ratio={node.ratio}
			onResize={(r) => tilingStore.resizePanel(node.id, r)}
			onReset={() => tilingStore.resizePanel(node.id, 0.5)}
			onDragStateChange={(d) => (isResizing = d)}
		/>

		<div class="tile-child" style:flex={1 - node.ratio}>
			<Self node={node.second} />
		</div>
	</div>
{/if}

<style>
	.tile-split {
		display: flex;
		width: 100%;
		height: 100%;
		min-height: 0;
		min-width: 0;
	}

	.tile-split-h {
		flex-direction: row;
	}

	.tile-split-v {
		flex-direction: column;
	}

	.tile-child {
		min-height: 0;
		min-width: 0;
		overflow: hidden;
	}

	.tile-split-resizing {
		user-select: none;
	}
</style>
