<script lang="ts">
	/**
	 * Drop zone that appears when a drag is active (Layer 1 or Layer 2).
	 *
	 * Slides in from the bottom during any drag, acts as a drop target
	 * for actions like delete, archive, etc.
	 *
	 * Usage:
	 *   <ActionZone
	 *     accepts={['task', 'card']}
	 *     onDrop={(payload) => deleteItem(payload.data.id)}
	 *     variant="danger"
	 *     label="Löschen"
	 *   />
	 */

	import { dragState } from './drag-state.svelte';
	import { dropTarget } from './drop-target';
	import { passiveDropZone } from './passive-drop';
	import type { DragPayload, DragType } from './types';
	import { Trash, Archive, FolderOpen } from '@manacore/shared-icons';

	interface Props {
		accepts: DragType[];
		onDrop: (payload: DragPayload) => void;
		canDrop?: (payload: DragPayload) => boolean;
		variant?: 'danger' | 'warning' | 'info' | 'success';
		label?: string;
		icon?: typeof Trash;
	}

	let { accepts, onDrop, canDrop, variant = 'danger', label = '', icon }: Props = $props();

	const visible = $derived(dragState.anyDragActive);

	const iconComponent = $derived(
		icon ?? (variant === 'danger' ? Trash : variant === 'warning' ? Archive : FolderOpen)
	);

	// The zone is both a Layer 1 drop target and a Layer 2 passive zone
	function handleDrop(payload: DragPayload) {
		onDrop(payload);
	}
</script>

{#if visible}
	<div
		class="action-zone variant-{variant}"
		use:dropTarget={{
			accepts,
			onDrop: handleDrop,
			canDrop,
		}}
		use:passiveDropZone={{
			accepts,
			onDrop: handleDrop,
			canDrop,
			highlightClass: 'action-zone-active',
		}}
		role="button"
		tabindex="-1"
	>
		<svelte:component this={iconComponent} size={20} weight="bold" />
		{#if label}
			<span class="action-label">{label}</span>
		{/if}
	</div>
{/if}

<style>
	.action-zone {
		position: fixed;
		bottom: calc(120px + env(safe-area-inset-bottom, 0px));
		left: 50%;
		transform: translateX(-50%);
		z-index: 60;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 9999px;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transition: all 0.2s ease;
		animation: action-zone-in 200ms ease-out;
		cursor: default;
	}

	@keyframes action-zone-in {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(20px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0) scale(1);
		}
	}

	.action-label {
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
	}

	/* Variants */
	.variant-danger {
		background: rgba(239, 68, 68, 0.15);
		border: 1.5px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}

	.variant-warning {
		background: rgba(245, 158, 11, 0.15);
		border: 1.5px solid rgba(245, 158, 11, 0.3);
		color: #f59e0b;
	}

	.variant-info {
		background: rgba(59, 130, 246, 0.15);
		border: 1.5px solid rgba(59, 130, 246, 0.3);
		color: #3b82f6;
	}

	.variant-success {
		background: rgba(16, 185, 129, 0.15);
		border: 1.5px solid rgba(16, 185, 129, 0.3);
		color: #10b981;
	}

	/* Hover state (when item is over the zone) */
	:global(.action-zone.mana-drop-target-hover),
	:global(.action-zone.action-zone-active) {
		transform: translateX(-50%) scale(1.1);
	}

	:global(.variant-danger.mana-drop-target-hover),
	:global(.variant-danger.action-zone-active) {
		background: rgba(239, 68, 68, 0.3);
		border-color: rgba(239, 68, 68, 0.6);
		box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
	}

	:global(.variant-warning.mana-drop-target-hover),
	:global(.variant-warning.action-zone-active) {
		background: rgba(245, 158, 11, 0.3);
		border-color: rgba(245, 158, 11, 0.6);
		box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
	}

	:global(.variant-info.mana-drop-target-hover),
	:global(.variant-info.action-zone-active) {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
	}

	:global(.variant-success.mana-drop-target-hover),
	:global(.variant-success.action-zone-active) {
		background: rgba(16, 185, 129, 0.3);
		border-color: rgba(16, 185, 129, 0.6);
		box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
	}

	/* Success flash after drop */
	:global(.action-zone.mana-drop-target-success),
	:global(.action-zone.mana-passive-zone-success) {
		animation: action-success 400ms ease-out;
	}

	@keyframes action-success {
		0% {
			transform: translateX(-50%) scale(1.15);
		}
		50% {
			transform: translateX(-50%) scale(0.95);
		}
		100% {
			transform: translateX(-50%) scale(1);
		}
	}

	:global(.dark) .variant-danger {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.4);
	}

	:global(.dark) .variant-warning {
		background: rgba(245, 158, 11, 0.2);
		border-color: rgba(245, 158, 11, 0.4);
	}

	:global(.dark) .variant-info {
		background: rgba(59, 130, 246, 0.2);
		border-color: rgba(59, 130, 246, 0.4);
	}

	:global(.dark) .variant-success {
		background: rgba(16, 185, 129, 0.2);
		border-color: rgba(16, 185, 129, 0.4);
	}
</style>
