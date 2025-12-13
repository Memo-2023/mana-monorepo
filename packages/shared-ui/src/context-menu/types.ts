import type { Snippet } from 'svelte';

export interface ContextMenuItem {
	/** Unique identifier for the item */
	id: string;
	/** Display label */
	label: string;
	/** Icon snippet to render */
	icon?: Snippet;
	/** Keyboard shortcut hint */
	shortcut?: string;
	/** Whether the item is disabled */
	disabled?: boolean;
	/** Visual variant */
	variant?: 'default' | 'danger';
	/** Item type - use 'divider' for separator */
	type?: 'item' | 'divider';
	/** Action to perform when clicked */
	action?: () => void;
	/** Additional data attached to the item */
	data?: unknown;
}

export interface ContextMenuState<T = unknown> {
	visible: boolean;
	x: number;
	y: number;
	target: T | null;
}

/**
 * Creates a context menu state object
 */
export function createContextMenuState<T = unknown>(): ContextMenuState<T> {
	return {
		visible: false,
		x: 0,
		y: 0,
		target: null,
	};
}
