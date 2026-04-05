import type { ContextMenuItem } from '@mana/shared-ui';

export interface WorkbenchContextMenuState {
	visible: boolean;
	x: number;
	y: number;
	target: string | null;
}

export function createWorkbenchContextMenu() {
	let state = $state<WorkbenchContextMenuState>({
		visible: false,
		x: 0,
		y: 0,
		target: null,
	});
	let items = $state<ContextMenuItem[]>([]);

	return {
		get state() {
			return state;
		},
		get items() {
			return items;
		},
		open(e: MouseEvent, appId: string, menuItems: ContextMenuItem[]) {
			e.preventDefault();
			state = { visible: true, x: e.clientX, y: e.clientY, target: appId };
			items = menuItems;
		},
		close() {
			state = { visible: false, x: state.x, y: state.y, target: null };
			items = [];
		},
	};
}
