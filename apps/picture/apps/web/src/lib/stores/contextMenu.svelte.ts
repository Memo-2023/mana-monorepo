/**
 * Context Menu Store - Svelte 5 Runes Version
 */

import type { Image } from '$lib/api/images';

interface ContextMenuState {
	visible: boolean;
	x: number;
	y: number;
	image: Image | null;
	showTagSubmenu: boolean;
	submenuX: number;
	submenuY: number;
}

const initialState: ContextMenuState = {
	visible: false,
	x: 0,
	y: 0,
	image: null,
	showTagSubmenu: false,
	submenuX: 0,
	submenuY: 0,
};

let contextMenuState = $state<ContextMenuState>({ ...initialState });

export const contextMenuStore = {
	get state() {
		return contextMenuState;
	},
	get visible() {
		return contextMenuState.visible;
	},
	get x() {
		return contextMenuState.x;
	},
	get y() {
		return contextMenuState.y;
	},
	get image() {
		return contextMenuState.image;
	},
	get showTagSubmenu() {
		return contextMenuState.showTagSubmenu;
	},
	get submenuX() {
		return contextMenuState.submenuX;
	},
	get submenuY() {
		return contextMenuState.submenuY;
	},

	show(x: number, y: number, image: Image) {
		contextMenuState = {
			visible: true,
			x,
			y,
			image,
			showTagSubmenu: false,
			submenuX: 0,
			submenuY: 0,
		};
	},

	hide() {
		contextMenuState = { ...initialState };
	},

	showTagSubmenu(x: number, y: number) {
		contextMenuState = {
			...contextMenuState,
			showTagSubmenu: true,
			submenuX: x,
			submenuY: y,
		};
	},

	hideTagSubmenu() {
		contextMenuState = {
			...contextMenuState,
			showTagSubmenu: false,
		};
	},
};

// Export for backwards compatibility
export function showContextMenu(x: number, y: number, image: Image) {
	contextMenuStore.show(x, y, image);
}

export function hideContextMenu() {
	contextMenuStore.hide();
}

export function showTagSubmenu(x: number, y: number) {
	contextMenuStore.showTagSubmenu(x, y);
}

export function hideTagSubmenu() {
	contextMenuStore.hideTagSubmenu();
}

export function getContextMenu() {
	return contextMenuState;
}

// Re-export for compatibility
export { contextMenuState as contextMenu };
