import type { Snippet } from 'svelte';

export interface KeyboardShortcut {
	/** Key combination (e.g., ['Ctrl', 'S'] or ['Cmd', 'Shift', 'P']) */
	keys: string[];
	/** Description of what the shortcut does */
	label: string;
	/** Category for grouping (optional) */
	category?: string;
}

export interface NavItem {
	/** Display label for the navigation item */
	label: string;
	/** URL to navigate to */
	href: string;
	/** Icon - can be emoji, SVG path, or component name */
	icon?: string;
	/** Whether this item is currently active */
	active?: boolean;
	/** Badge text (e.g., notification count) */
	badge?: string | number;
	/** Whether the item is disabled */
	disabled?: boolean;
	/** Keyboard shortcut hint */
	shortcut?: string;
}

export interface NavbarProps {
	/** Navigation items to display */
	items: NavItem[];
	/** Logo snippet or component */
	logo?: Snippet;
	/** App name to display next to logo */
	appName?: string;
	/** Current pathname for active state detection */
	currentPath?: string;
	/** User email to display */
	userEmail?: string;
	/** Show mobile menu */
	showMobile?: boolean;
	/** Called when sign out is clicked */
	onSignOut?: () => void;
	/** Additional CSS classes */
	class?: string;
}

export interface SidebarProps {
	/** Navigation items to display */
	items: NavItem[];
	/** Logo snippet or component */
	logo?: Snippet;
	/** App name to display */
	appName?: string;
	/** Current pathname for active state detection */
	currentPath?: string;
	/** Whether sidebar is minimized/collapsed */
	minimized?: boolean;
	/** Called when minimize toggle is clicked */
	onToggleMinimize?: () => void;
	/** User email to display */
	userEmail?: string;
	/** Called when sign out is clicked */
	onSignOut?: () => void;
	/** Show theme toggle */
	showThemeToggle?: boolean;
	/** Called when theme toggle is clicked */
	onToggleTheme?: () => void;
	/** Current theme mode (for icon display) */
	isDark?: boolean;
	/** Additional CSS classes */
	class?: string;
	/** Footer items (shortcuts, etc.) */
	footerItems?: NavItem[];
}

export interface NavLinkProps {
	/** Navigation item data */
	item: NavItem;
	/** Whether the link is active */
	active?: boolean;
	/** Display variant */
	variant?: 'default' | 'sidebar' | 'mobile' | 'pill';
	/** Whether in minimized sidebar mode (show tooltip) */
	minimized?: boolean;
	/** Additional CSS classes */
	class?: string;
}
