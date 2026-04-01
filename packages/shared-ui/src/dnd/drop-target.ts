/**
 * Svelte action: use:dropTarget
 *
 * Registers an element as a drop target for Layer 1 (pointer-events) drags.
 * Handles hover detection via the global drag state and listens for
 * the 'mana-drag-drop' custom event fired by dragSource.
 *
 * Usage:
 *   <div use:dropTarget={{
 *     accepts: ['tag'],
 *     onDrop: (payload) => assignTag(task.id, payload.data.id),
 *     canDrop: (p) => !task.labelIds.includes(p.data.id),
 *   }}>
 */

import type { DropTargetOptions, DragPayload } from './types';
import { dragState, setHoveredTarget } from './drag-state.svelte';

let targetCounter = 0;

export function dropTarget(node: HTMLElement, options: DropTargetOptions) {
	let opts = options;
	const targetId = `drop-target-${++targetCounter}`;

	node.dataset.manaDropTarget = targetId;

	let isHovering = false;

	function accepts(payload: DragPayload | null): boolean {
		if (!payload || opts.disabled) return false;
		if (!opts.accepts.includes(payload.type)) return false;
		if (opts.canDrop && !opts.canDrop(payload)) return false;
		return true;
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragState.isDragging) return;

		const payload = dragState.activeDrag;
		if (!payload || !accepts(payload)) return;

		const rect = node.getBoundingClientRect();
		const inside =
			e.clientX >= rect.left &&
			e.clientX <= rect.right &&
			e.clientY >= rect.top &&
			e.clientY <= rect.bottom;

		if (inside && !isHovering) {
			isHovering = true;
			node.classList.add('mana-drop-target-hover');
			setHoveredTarget(targetId);
			opts.onHover?.(payload);
		} else if (!inside && isHovering) {
			isHovering = false;
			node.classList.remove('mana-drop-target-hover');
			setHoveredTarget(null);
			opts.onLeave?.();
		}
	}

	function handleDrop(_e: CustomEvent<{ x: number; y: number }>) {
		if (!isHovering) return;

		const payload = dragState.activeDrag;
		if (!payload || !accepts(payload)) {
			resetHover();
			return;
		}

		opts.onDrop(payload);
		resetHover();

		// Brief success flash
		node.classList.add('mana-drop-target-success');
		setTimeout(() => node.classList.remove('mana-drop-target-success'), 400);
	}

	function resetHover() {
		isHovering = false;
		node.classList.remove('mana-drop-target-hover');
		setHoveredTarget(null);
		opts.onLeave?.();
	}

	// Also reset when drag ends without drop on this target
	function handleDragEnd() {
		if (isHovering) resetHover();
	}

	document.addEventListener('pointermove', handlePointerMove);
	document.addEventListener('mana-drag-drop', handleDrop as EventListener);
	// dragSource fires pointerup → endDrag, but in case of cancel:
	document.addEventListener('pointercancel', handleDragEnd);

	return {
		update(newOptions: DropTargetOptions) {
			opts = newOptions;
		},
		destroy() {
			resetHover();
			document.removeEventListener('pointermove', handlePointerMove);
			document.removeEventListener('mana-drag-drop', handleDrop as EventListener);
			document.removeEventListener('pointercancel', handleDragEnd);
		},
	};
}
