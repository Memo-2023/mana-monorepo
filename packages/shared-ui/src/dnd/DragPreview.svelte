<script lang="ts">
	/**
	 * Floating drag preview that follows the pointer during Layer 1 drags.
	 *
	 * Place this once in your app layout:
	 *   <DragPreview />
	 *
	 * It reads from dragState and renders a small pill showing what's being dragged.
	 */

	import { dragState } from './drag-state.svelte';
	import type { TagDragData } from './types';

	const OFFSET_X = 12;
	const OFFSET_Y = -20;

	const tagData = $derived(
		dragState.activeDrag?.type === 'tag' ? (dragState.activeDrag.data as TagDragData) : null
	);

	const style = $derived(
		dragState.isDragging
			? `left:${dragState.pointerX + OFFSET_X}px;top:${dragState.pointerY + OFFSET_Y}px;`
			: ''
	);
</script>

{#if dragState.isDragging}
	<div class="drag-preview" {style}>
		{#if tagData}
			<span class="tag-dot" style="background-color: {tagData.color}"></span>
			<span class="tag-name">{tagData.name}</span>
		{:else if dragState.activeDrag}
			<span class="generic-label">{dragState.activeDrag.type}</span>
		{/if}
	</div>
{/if}

<style>
	.drag-preview {
		position: fixed;
		z-index: 9999;
		pointer-events: none;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.12);
		box-shadow:
			0 8px 24px -4px rgba(0, 0, 0, 0.15),
			0 2px 6px -1px rgba(0, 0, 0, 0.1);
		font-size: 0.8125rem;
		font-weight: 600;
		white-space: nowrap;
		transform: scale(1.05);
		animation: drag-preview-in 150ms ease-out;
	}

	:global(.dark) .drag-preview {
		background: rgba(30, 30, 30, 0.95);
		border-color: rgba(255, 255, 255, 0.15);
	}

	@keyframes drag-preview-in {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1.05);
		}
	}

	.tag-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.tag-name {
		color: var(--color-foreground, #1a1a1a);
	}

	:global(.dark) .tag-name {
		color: var(--color-foreground, #e5e5e5);
	}

	.generic-label {
		color: var(--color-muted-foreground, #6b7280);
		text-transform: capitalize;
	}
</style>
