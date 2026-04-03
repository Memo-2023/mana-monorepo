<script lang="ts">
	/**
	 * Floating drag preview that follows the pointer during Layer 1 drags.
	 *
	 * Place this once in your app layout:
	 *   <DragPreview />
	 *
	 * It reads from dragState and renders a pill showing what's being dragged.
	 * For tags: colored dot + tag name.
	 * For entities: app color dot + item title + app name.
	 */

	import { dragState } from './drag-state.svelte';
	import type { TagDragData } from './types';

	interface Props {
		/** Resolve display data for a dragged entity. */
		resolveEntity?: (
			type: string,
			data: Record<string, unknown>
		) => { title: string; subtitle?: string; color?: string; appName?: string } | null;
	}

	let { resolveEntity }: Props = $props();

	const OFFSET_X = 12;
	const OFFSET_Y = -20;

	const tagData = $derived(
		dragState.activeDrag?.type === 'tag' ? (dragState.activeDrag.data as TagDragData) : null
	);

	const entityData = $derived(() => {
		if (!dragState.activeDrag || dragState.activeDrag.type === 'tag') return null;
		if (!resolveEntity) return null;
		return resolveEntity(
			dragState.activeDrag.type,
			dragState.activeDrag.data as Record<string, unknown>
		);
	});

	const style = $derived(
		dragState.isDragging
			? `left:${dragState.pointerX + OFFSET_X}px;top:${dragState.pointerY + OFFSET_Y}px;`
			: ''
	);
</script>

{#if dragState.isDragging}
	<div class="drag-preview" {style}>
		{#if tagData}
			<span class="preview-dot" style="background-color: {tagData.color}"></span>
			<span class="preview-title">{tagData.name}</span>
		{:else if entityData()}
			{@const entity = entityData()}
			<span class="preview-dot" style="background-color: {entity?.color ?? '#6B7280'}"></span>
			<span class="preview-title">{entity?.title}</span>
			{#if entity?.appName}
				<span class="preview-app">{entity.appName}</span>
			{/if}
		{:else if dragState.activeDrag}
			<span class="preview-title fallback">{dragState.activeDrag.type}</span>
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
		white-space: nowrap;
		max-width: 280px;
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

	.preview-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.preview-title {
		font-weight: 600;
		color: #1a1a1a;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	:global(.dark) .preview-title {
		color: #e5e5e5;
	}

	.preview-title.fallback {
		color: #6b7280;
		text-transform: capitalize;
		font-weight: 500;
	}

	.preview-app {
		font-size: 0.6875rem;
		font-weight: 400;
		color: #9ca3af;
		flex-shrink: 0;
	}
</style>
