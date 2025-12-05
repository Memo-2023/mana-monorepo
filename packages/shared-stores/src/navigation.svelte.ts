/**
 * Navigation Store Factory
 * Creates a navigation state store with Svelte 5 runes.
 */

export interface NavigationItem {
	href: string;
	label: string;
	icon?: string;
	badge?: string | number;
	children?: NavigationItem[];
}

export interface NavigationStore {
	readonly items: NavigationItem[];
	readonly isOpen: boolean;
	readonly isSidebarMode: boolean;
	readonly isCollapsed: boolean;
	setItems: (items: NavigationItem[]) => void;
	toggle: () => void;
	open: () => void;
	close: () => void;
	setSidebarMode: (isSidebar: boolean) => void;
	setCollapsed: (collapsed: boolean) => void;
}

export interface NavigationStoreConfig {
	/** Initial navigation items */
	initialItems?: NavigationItem[];
	/** Storage key for persisting sidebar mode */
	storageKey?: string;
	/** Whether to start in sidebar mode */
	defaultSidebarMode?: boolean;
	/** Whether to start collapsed */
	defaultCollapsed?: boolean;
}

/**
 * Create a navigation store with Svelte 5 runes.
 */
export function createNavigationStore(config: NavigationStoreConfig = {}): NavigationStore {
	const {
		initialItems = [],
		storageKey,
		defaultSidebarMode = false,
		defaultCollapsed = false,
	} = config;

	let items = $state<NavigationItem[]>(initialItems);
	let isOpen = $state(false);
	let isSidebarMode = $state(defaultSidebarMode);
	let isCollapsed = $state(defaultCollapsed);

	// Load from localStorage if available
	if (storageKey && typeof localStorage !== 'undefined') {
		const savedSidebar = localStorage.getItem(`${storageKey}-sidebar`);
		const savedCollapsed = localStorage.getItem(`${storageKey}-collapsed`);

		if (savedSidebar !== null) {
			isSidebarMode = savedSidebar === 'true';
		}
		if (savedCollapsed !== null) {
			isCollapsed = savedCollapsed === 'true';
		}
	}

	function setItems(newItems: NavigationItem[]) {
		items = newItems;
	}

	function toggle() {
		isOpen = !isOpen;
	}

	function open() {
		isOpen = true;
	}

	function close() {
		isOpen = false;
	}

	function setSidebarMode(sidebar: boolean) {
		isSidebarMode = sidebar;
		if (storageKey && typeof localStorage !== 'undefined') {
			localStorage.setItem(`${storageKey}-sidebar`, String(sidebar));
		}
	}

	function setCollapsed(collapsed: boolean) {
		isCollapsed = collapsed;
		if (storageKey && typeof localStorage !== 'undefined') {
			localStorage.setItem(`${storageKey}-collapsed`, String(collapsed));
		}
	}

	return {
		get items() {
			return items;
		},
		get isOpen() {
			return isOpen;
		},
		get isSidebarMode() {
			return isSidebarMode;
		},
		get isCollapsed() {
			return isCollapsed;
		},
		setItems,
		toggle,
		open,
		close,
		setSidebarMode,
		setCollapsed,
	};
}
