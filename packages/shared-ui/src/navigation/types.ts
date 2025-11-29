import type { Snippet } from 'svelte';

export interface KeyboardShortcut {
	/** Key combination (e.g., ['Ctrl', 'S'] or ['Cmd', 'Shift', 'P']) */
	keys: string[];
	/** Description of what the shortcut does */
	label: string;
	/** Category for grouping (optional) */
	category?: string;
}

// ============ Pill Navigation Types ============

export interface PillNavItem {
	/** Display label for the navigation item */
	label: string;
	/** URL to navigate to */
	href: string;
	/** Icon name (predefined) or 'mana' for special mana icon */
	icon?: string;
	/** Custom SVG icon HTML (for custom icons) */
	iconSvg?: string;
}

export interface PillDropdownItem {
	/** Unique identifier */
	id: string;
	/** Display label */
	label: string;
	/** Icon name (SVG path) */
	icon?: string;
	/** Image URL for icon (data URL or regular URL) */
	imageUrl?: string;
	/** Click handler */
	onClick?: () => void;
	/** Whether item is disabled */
	disabled?: boolean;
	/** Whether item should be styled as danger/destructive */
	danger?: boolean;
	/** Whether this item is currently active/selected */
	active?: boolean;
	/** Whether this item is a divider */
	divider?: boolean;
	/** Nested submenu items */
	submenu?: PillDropdownItem[];
}

export interface PillAppItem {
	/** Unique identifier (app id) */
	id: string;
	/** App display name */
	name: string;
	/** App URL */
	url: string;
	/** App icon (data URL or regular URL) */
	icon?: string;
	/** App brand color */
	color?: string;
	/** Whether this is the current app */
	isCurrent?: boolean;
}

// ============ Pill Tab Group Types ============

export interface PillTabOption {
	/** Unique identifier for the tab */
	id: string;
	/** Icon name (predefined) */
	icon?: string;
	/** Custom SVG icon HTML */
	iconSvg?: string;
	/** Optional label (shown in sidebar mode) */
	label?: string;
	/** Tooltip text */
	title?: string;
	/** Whether this option is disabled */
	disabled?: boolean;
}

export interface PillTabGroupConfig {
	/** Discriminator for type checking */
	type: 'tabs';
	/** Tab options */
	options: PillTabOption[];
	/** Currently selected tab id */
	value: string;
	/** Called when selection changes */
	onChange: (id: string) => void;
	/** Optional section label (shown above in sidebar mode) */
	sectionLabel?: string;
}

export interface PillDivider {
	/** Discriminator for type checking */
	type: 'divider';
}

/** Union type for all elements that can appear in PillNavigation */
export type PillNavElement = PillNavItem | PillTabGroupConfig | PillDivider;

export interface PillNavigationProps {
	/** Navigation items */
	items: PillNavItem[];
	/** Current active path */
	currentPath?: string;
	/** Logo snippet */
	logo?: Snippet;
	/** App name */
	appName?: string;
	/** Home/default route */
	homeRoute?: string;
	/** Called when logout is clicked */
	onLogout?: () => void;
	/** Called when theme toggle is clicked */
	onToggleTheme?: () => void;
	/** Whether dark mode is active */
	isDark?: boolean;
	/** Whether sidebar mode is enabled (controlled) */
	isSidebarMode?: boolean;
	/** Called when sidebar mode changes */
	onModeChange?: (isSidebar: boolean) => void;
	/** Whether navigation is collapsed (controlled) */
	isCollapsed?: boolean;
	/** Called when collapsed state changes */
	onCollapsedChange?: (isCollapsed: boolean) => void;
	/** Language dropdown items */
	languageItems?: PillDropdownItem[];
	/** Current language label */
	currentLanguageLabel?: string;
	/** Show language switcher */
	showLanguageSwitcher?: boolean;
	/** Show theme toggle */
	showThemeToggle?: boolean;
	/** Primary color for active state */
	primaryColor?: string;
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
