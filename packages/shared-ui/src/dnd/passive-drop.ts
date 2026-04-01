/**
 * Svelte action: use:passiveDropZone
 *
 * Layer 2: Detects when a svelte-dnd-action drag hovers over this element.
 *
 * svelte-dnd-action uses pointer events internally. We listen to global
 * pointermove and use elementFromPoint to check if the pointer is over
 * this zone. When the pointer is released over the zone, we fire onDrop.
 *
 * The app must call registerSvelteActionDrag(payload) when a
 * svelte-dnd-action drag starts (in the onconsider handler) and
 * clearSvelteActionDrag() when it ends (in onfinalize).
 *
 * Usage:
 *   <button use:passiveDropZone={{
 *     accepts: ['task'],
 *     onDrop: (payload) => assignTag(tag.id, payload.data.id),
 *     highlightClass: 'tag-drop-highlight',
 *   }}>
 */

import type { PassiveDropZoneOptions, DragPayload } from './types';
import { dragState, setHoveredTarget, clearSvelteActionDrag } from './drag-state.svelte';

let zoneCounter = 0;

export function passiveDropZone(node: HTMLElement, options: PassiveDropZoneOptions) {
	let opts = options;
	const zoneId = `passive-zone-${++zoneCounter}`;
	let isHovering = false;

	node.dataset.manaPassiveZone = zoneId;

	function getPayload(): DragPayload | null {
		return dragState.svelteActionPayload;
	}

	function accepts(payload: DragPayload | null): boolean {
		if (!payload || opts.disabled) return false;
		if (!opts.accepts.includes(payload.type)) return false;
		if (opts.canDrop && !opts.canDrop(payload)) return false;
		return true;
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragState.svelteActionDragActive) {
			if (isHovering) resetHover();
			return;
		}

		const payload = getPayload();
		if (!accepts(payload)) return;

		// Check if pointer is over this element
		// pointer-events: none on the dragged ghost means elementFromPoint
		// can see through to our zone
		const rect = node.getBoundingClientRect();
		const inside =
			e.clientX >= rect.left &&
			e.clientX <= rect.right &&
			e.clientY >= rect.top &&
			e.clientY <= rect.bottom;

		if (inside && !isHovering) {
			isHovering = true;
			if (opts.highlightClass) node.classList.add(opts.highlightClass);
			node.classList.add('mana-passive-zone-hover');
			setHoveredTarget(zoneId);
		} else if (!inside && isHovering) {
			resetHover();
		}
	}

	function handlePointerUp(_e: PointerEvent) {
		if (!isHovering) return;

		const payload = getPayload();
		if (!payload || !accepts(payload)) {
			resetHover();
			return;
		}

		// Fire the drop action
		opts.onDrop(payload);

		// Clear the svelte-dnd-action drag state so the item returns quietly
		clearSvelteActionDrag();
		resetHover();

		// Brief success flash
		node.classList.add('mana-passive-zone-success');
		setTimeout(() => node.classList.remove('mana-passive-zone-success'), 400);
	}

	function resetHover() {
		isHovering = false;
		if (opts.highlightClass) node.classList.remove(opts.highlightClass);
		node.classList.remove('mana-passive-zone-hover');
		setHoveredTarget(null);
	}

	// Use capture phase to see pointer events before svelte-dnd-action
	document.addEventListener('pointermove', handlePointerMove, true);
	document.addEventListener('pointerup', handlePointerUp, true);

	return {
		update(newOptions: PassiveDropZoneOptions) {
			opts = newOptions;
		},
		destroy() {
			resetHover();
			document.removeEventListener('pointermove', handlePointerMove, true);
			document.removeEventListener('pointerup', handlePointerUp, true);
		},
	};
}
