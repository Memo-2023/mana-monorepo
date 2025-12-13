import type { Component } from 'svelte';

export interface ContextMenuItem {
	/** Unique identifier for the item */
	id: string;
	/** Display label */
	label: string;
	/** Icon component to render (Phosphor icon or any Svelte component) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: Component<any>;
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
	/** Show a toggle switch (for boolean settings) */
	toggle?: boolean;
	/** Current toggle state (only used when toggle is true) */
	checked?: boolean;
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
