import { writable } from 'svelte/store';
import type { Database } from '@picture/shared/types';

type Image = Database['public']['Tables']['images']['Row'];

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

export const contextMenu = writable<ContextMenuState>(initialState);

export function showContextMenu(x: number, y: number, image: Image) {
	contextMenu.set({
		visible: true,
		x,
		y,
		image,
		showTagSubmenu: false,
		submenuX: 0,
		submenuY: 0,
	});
}

export function hideContextMenu() {
	contextMenu.set(initialState);
}

export function showTagSubmenu(x: number, y: number) {
	contextMenu.update((state) => ({
		...state,
		showTagSubmenu: true,
		submenuX: x,
		submenuY: y,
	}));
}

export function hideTagSubmenu() {
	contextMenu.update((state) => ({
		...state,
		showTagSubmenu: false,
	}));
}
