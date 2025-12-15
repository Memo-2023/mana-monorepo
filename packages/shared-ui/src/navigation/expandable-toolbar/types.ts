import type { Snippet } from 'svelte';

export interface ExpandableToolbarProps {
	/** Whether the toolbar is collapsed */
	isCollapsed?: boolean;
	/** Called when collapsed state changes */
	onCollapsedChange?: (isCollapsed: boolean) => void;
	/** Whether in sidebar mode (affects positioning) */
	isSidebarMode?: boolean;
	/** Bottom offset from viewport bottom (default: '70px') */
	bottomOffset?: string;
	/** Sidebar mode bottom offset (default: '0px') */
	sidebarBottomOffset?: string;
	/** Panel height when expanded (default: '70px') */
	panelHeight?: string;
	/** FAB tooltip when collapsed */
	collapsedTitle?: string;
	/** FAB tooltip when expanded */
	expandedTitle?: string;
	/** Custom collapsed icon snippet */
	collapsedIcon?: Snippet;
	/** Custom expanded icon snippet */
	expandedIcon?: Snippet;
	/** Panel content (required) */
	children: Snippet;
	/** Optional right-side content (e.g., layout toggle) */
	rightActions?: Snippet;
}
