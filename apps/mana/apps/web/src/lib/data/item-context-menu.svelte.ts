/**
 * useItemContextMenu — Svelte 5 reactive wrapper around `ContextMenuState`.
 *
 * Every workbench-style ListView reimplemented the same boilerplate:
 *
 *   let ctxMenu = $state<{...}>({ visible: false, x: 0, y: 0, item: null });
 *   function handleItemContextMenu(e: MouseEvent, item: T) {
 *     e.preventDefault();
 *     ctxMenu = { visible: true, x: e.clientX, y: e.clientY, item };
 *   }
 *   // ... and a close handler that resets the target
 *
 * This helper collapses that to:
 *
 *   const ctxMenu = useItemContextMenu<LocalContact>();
 *
 * The consumer derives its menu items from `ctxMenu.state.target`, wires
 * `oncontextmenu={(e) => ctxMenu.open(e, item)}` on the row, and passes
 * `ctxMenu.close` to `<ContextMenu onClose>`.
 */

import type { ContextMenuState } from '@mana/shared-ui';

export interface ItemContextMenuHandle<T> {
	readonly state: ContextMenuState<T>;
	/** Call from `oncontextmenu` to open the menu at the click position. */
	open: (e: MouseEvent, target: T) => void;
	/** Hide the menu and clear the target. Pass to `<ContextMenu onClose>`. */
	close: () => void;
}

export function useItemContextMenu<T>(): ItemContextMenuHandle<T> {
	let state = $state<ContextMenuState<T>>({
		visible: false,
		x: 0,
		y: 0,
		target: null,
	});

	return {
		get state() {
			return state;
		},
		open(e: MouseEvent, target: T) {
			e.preventDefault();
			state = { visible: true, x: e.clientX, y: e.clientY, target };
		},
		close() {
			state = { ...state, visible: false, target: null };
		},
	};
}
