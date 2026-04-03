/**
 * Svelte action: use:dragSource
 *
 * Makes an element draggable via pointer events.
 * Works on mouse, touch, and pen — no polyfills needed.
 *
 * Desktop: drag starts after moving past moveThreshold (default 5px).
 * Mobile:  drag starts after long-press (default 300ms).
 *
 * Usage:
 *   <button use:dragSource={{ type: 'tag', data: () => ({ id, name, color }) }}>
 */

import type { DragSourceOptions } from './types';
import { startDrag, updatePointer, endDrag } from './drag-state.svelte';

const DEFAULT_LONG_PRESS_MS = 300;
const DEFAULT_MOVE_THRESHOLD = 5;

export function dragSource(node: HTMLElement, options: DragSourceOptions) {
	let opts = options;

	let startX = 0;
	let startY = 0;
	let isDragging = false;
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	let isTouch = false;

	// Prevent native drag (images, links)
	function handleNativeDragStart(e: Event) {
		if (isDragging) e.preventDefault();
	}

	function handlePointerDown(e: PointerEvent) {
		if (opts.disabled) return;
		// Only primary button (left click / single touch)
		if (e.button !== 0) return;

		startX = e.clientX;
		startY = e.clientY;
		isTouch = e.pointerType === 'touch';

		// Capture pointer so we get events even when leaving the element
		node.setPointerCapture(e.pointerId);

		if (isTouch) {
			// Touch: wait for long-press
			longPressTimer = setTimeout(() => {
				beginDrag(e.clientX, e.clientY);
				// Haptic feedback if available
				if (navigator.vibrate) navigator.vibrate(30);
			}, opts.longPressMs ?? DEFAULT_LONG_PRESS_MS);
		}

		document.addEventListener('pointermove', handlePointerMove);
		document.addEventListener('pointerup', handlePointerUp);
		document.addEventListener('pointercancel', handlePointerCancel);
	}

	function handlePointerMove(e: PointerEvent) {
		if (isDragging) {
			e.preventDefault();
			updatePointer(e.clientX, e.clientY);
			return;
		}

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (isTouch) {
			// On touch, moving before long-press fires → cancel
			if (distance > 10 && longPressTimer) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
				cleanup();
			}
		} else {
			// Mouse: start drag after threshold
			const threshold = opts.moveThreshold ?? DEFAULT_MOVE_THRESHOLD;
			if (distance >= threshold) {
				beginDrag(e.clientX, e.clientY);
			}
		}
	}

	function beginDrag(x: number, y: number) {
		isDragging = true;
		const payload = { type: opts.type, data: opts.data() };
		startDrag(payload);
		updatePointer(x, y);

		// Add dragging class to source element
		node.classList.add('mana-drag-source-active');
		// Prevent text selection during drag
		document.body.style.userSelect = 'none';
		document.body.style.webkitUserSelect = 'none';
	}

	function handlePointerUp(e: PointerEvent) {
		if (isDragging) {
			// Final position
			updatePointer(e.clientX, e.clientY);
			// Dispatch custom event so dropTargets can finalize
			document.dispatchEvent(
				new CustomEvent('mana-drag-drop', {
					detail: { x: e.clientX, y: e.clientY },
				})
			);
			endDrag();
			// Block the click event that fires after pointerup — prevents
			// opening detail views when dropping an item.
			const blocker = (ev: Event) => {
				ev.stopPropagation();
				ev.preventDefault();
			};
			node.addEventListener('click', blocker, { capture: true, once: true });
			// Safety: remove blocker after a tick in case click doesn't fire
			setTimeout(() => node.removeEventListener('click', blocker, { capture: true }), 0);
		}
		cleanup();
	}

	function handlePointerCancel(_e: PointerEvent) {
		if (isDragging) {
			endDrag();
		}
		cleanup();
	}

	function cleanup() {
		isDragging = false;
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		node.classList.remove('mana-drag-source-active');
		document.body.style.userSelect = '';
		document.body.style.webkitUserSelect = '';
		document.removeEventListener('pointermove', handlePointerMove);
		document.removeEventListener('pointerup', handlePointerUp);
		document.removeEventListener('pointercancel', handlePointerCancel);
	}

	node.addEventListener('pointerdown', handlePointerDown);
	node.addEventListener('dragstart', handleNativeDragStart);
	// Hint: touch-action none prevents browser scroll during drag
	node.style.touchAction = 'none';

	return {
		update(newOptions: DragSourceOptions) {
			opts = newOptions;
		},
		destroy() {
			cleanup();
			node.removeEventListener('pointerdown', handlePointerDown);
			node.removeEventListener('dragstart', handleNativeDragStart);
		},
	};
}
