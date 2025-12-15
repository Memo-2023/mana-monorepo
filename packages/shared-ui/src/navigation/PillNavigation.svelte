<script lang="ts">
	import type { Snippet } from 'svelte';
	import type {
		PillNavItem,
		PillDropdownItem,
		PillNavElement,
		PillTabGroupConfig,
		PillAppItem,
	} from './types';
	import PillDropdown from './PillDropdown.svelte';
	import PillTabGroup from './PillTabGroup.svelte';
	// Phosphor Icons (via shared-icons)
	import {
		House,
		Users,
		Tag,
		Heart,
		Gear,
		ChatCircle,
		Question,
		ShareNetwork,
		Bell,
		Clock,
		Timer,
		Target,
		Globe,
		Tray,
		Check,
		CheckCircle,
		CheckSquare,
		Plus,
		Columns,
		Microphone,
		CalendarBlank,
		Folder,
		Archive,
		Upload,
		MusicNote,
		File,
		ChartBar,
		MagnifyingGlass,
		List,
		Compass,
		Moon,
		Sun,
		SignOut,
		CaretDown,
		CaretUp,
		CaretLeft,
		Fire,
		GridFour,
		Palette,
		CreditCard,
		Buildings,
		User,
	} from '@manacore/shared-icons';

	// Map icon names to Phosphor components
	const phosphorIcons: Record<string, any> = {
		home: House,
		users: Users,
		user: User,
		tag: Tag,
		heart: Heart,
		settings: Gear,
		chat: ChatCircle,
		'help-circle': Question,
		'share-2': ShareNetwork,
		bell: Bell,
		clock: Clock,
		timer: Timer,
		target: Target,
		globe: Globe,
		inbox: Tray,
		check: Check,
		checkCircle: CheckCircle,
		'check-square': CheckSquare,
		plus: Plus,
		columns: Columns,
		kanban: Columns,
		mic: Microphone,
		calendar: CalendarBlank,
		folder: Folder,
		archive: Archive,
		upload: Upload,
		music: MusicNote,
		document: File,
		chart: ChartBar,
		'bar-chart-3': ChartBar,
		search: MagnifyingGlass,
		list: List,
		compass: Compass,
		moon: Moon,
		sun: Sun,
		logout: SignOut,
		chevronDown: CaretDown,
		chevronUp: CaretUp,
		chevronLeft: CaretLeft,
		menu: List,
		fire: Fire,
		grid: GridFour,
		gridSmall: GridFour,
		palette: Palette,
		creditCard: CreditCard,
		building: Buildings,
	};

	// Convert app items to dropdown items (will be computed as derived)
	function createAppDropdownItems(
		apps: PillAppItem[],
		allAppsUrl?: string,
		allAppsText?: string,
		openInPanelHandler?: (appId: string, url: string) => void
	): PillDropdownItem[] {
		const items: PillDropdownItem[] = apps.map((app) => ({
			id: app.id,
			label: app.name,
			// Use image icon if available, otherwise use grid as fallback
			imageUrl: app.icon,
			icon: app.icon ? undefined : 'grid',
			onClick: (event?: MouseEvent) => {
				// Check for modifier keys (Ctrl/Cmd + Click opens in panel)
				if (
					event &&
					(event.ctrlKey || event.metaKey) &&
					openInPanelHandler &&
					app.url &&
					!app.isCurrent
				) {
					openInPanelHandler(app.id, app.url);
					return;
				}

				if (app.isCurrent) {
					// Navigate to home route for current app
					window.location.href = '/';
				} else if (app.url) {
					window.open(app.url, '_blank', 'noopener,noreferrer');
				}
			},
			active: app.isCurrent,
			disabled: false,
			// Show split button if handler is provided and app is not current
			showSplitButton: !!openInPanelHandler && !app.isCurrent && !!app.url,
			onSplitClick:
				openInPanelHandler && app.url ? () => openInPanelHandler(app.id, app.url!) : undefined,
		}));

		// Add "All Apps" link at the end if href is provided
		if (allAppsUrl) {
			items.push(
				{ id: 'all-apps-divider', label: '', divider: true },
				{
					id: 'all-apps',
					label: allAppsText || 'Alle Apps',
					icon: 'grid',
					onClick: () => {
						window.location.href = allAppsUrl;
					},
					active: false,
				}
			);
		}

		return items;
	}

	interface Props {
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
		/** Whether sidebar mode is enabled */
		isSidebarMode?: boolean;
		/** Called when sidebar mode changes */
		onModeChange?: (isSidebar: boolean) => void;
		/** Whether navigation is collapsed */
		isCollapsed?: boolean;
		/** Called when collapsed state changes */
		onCollapsedChange?: (isCollapsed: boolean) => void;
		/** Language dropdown items */
		languageItems?: PillDropdownItem[];
		/** Current language label */
		currentLanguageLabel?: string;
		/** Show language switcher */
		showLanguageSwitcher?: boolean;
		/** Show theme toggle (standalone button, hidden if showThemeVariants is true) */
		showThemeToggle?: boolean;
		/** Primary color for active state (CSS custom property or hex) */
		primaryColor?: string;
		/** Elements to prepend before nav items (tab groups, dividers, nav items) */
		prependElements?: PillNavElement[];
		/** Additional elements (tab groups, dividers) to show after nav items */
		elements?: PillNavElement[];
		/** Show logout button */
		showLogout?: boolean;
		/** Theme variant dropdown items */
		themeVariantItems?: PillDropdownItem[];
		/** Current theme variant label */
		currentThemeVariantLabel?: string;
		/** Show theme variant selector */
		showThemeVariants?: boolean;
		/** Current theme mode ('light', 'dark', 'system') */
		themeMode?: 'light' | 'dark' | 'system';
		/** Called when theme mode changes */
		onThemeModeChange?: (mode: 'light' | 'dark' | 'system') => void;
		/** App items for app switcher dropdown */
		appItems?: PillAppItem[];
		/** Show app switcher dropdown */
		showAppSwitcher?: boolean;
		/** User email for user dropdown */
		userEmail?: string;
		/** Settings page href */
		settingsHref?: string;
		/** Mana/subscription page href */
		manaHref?: string;
		/** Profile page href */
		profileHref?: string;
		/** Login page href (shown when not logged in) */
		loginHref?: string;
		/** All Apps page href */
		allAppsHref?: string;
		/** All Apps label (default: "Alle Apps") */
		allAppsLabel?: string;
		// A11y Settings
		/** A11y contrast level */
		a11yContrast?: 'normal' | 'high';
		/** Called when a11y contrast changes */
		onA11yContrastChange?: (contrast: 'normal' | 'high') => void;
		/** A11y reduce motion setting */
		a11yReduceMotion?: boolean;
		/** Called when a11y reduce motion changes */
		onA11yReduceMotionChange?: (reduce: boolean) => void;
		/** Show a11y quick toggles in theme dropdown */
		showA11yQuickToggles?: boolean;
		/** Desktop navigation position (mobile always at bottom) */
		desktopPosition?: 'top' | 'bottom';
		/** Called when an app should be opened in a split panel */
		onOpenInPanel?: (appId: string, url: string) => void;
		/** Toolbar content snippet (shown in sidebar mode) */
		toolbarContent?: Snippet;
	}

	let {
		items,
		currentPath = '',
		logo,
		appName = 'App',
		homeRoute = '/',
		onLogout,
		onToggleTheme,
		isDark = false,
		isSidebarMode: externalSidebarMode,
		onModeChange,
		isCollapsed: externalCollapsed,
		onCollapsedChange,
		languageItems = [],
		currentLanguageLabel = 'Language',
		showLanguageSwitcher = false,
		showThemeToggle = true,
		primaryColor,
		prependElements = [],
		elements = [],
		showLogout = true,
		themeVariantItems = [],
		currentThemeVariantLabel = 'Theme',
		showThemeVariants = false,
		themeMode = 'system',
		onThemeModeChange,
		appItems = [],
		showAppSwitcher = false,
		userEmail,
		settingsHref = '/settings',
		manaHref,
		profileHref,
		loginHref,
		allAppsHref,
		allAppsLabel = 'Alle Apps',
		a11yContrast = 'normal',
		onA11yContrastChange,
		a11yReduceMotion = false,
		onA11yReduceMotionChange,
		showA11yQuickToggles = false,
		desktopPosition = 'top',
		onOpenInPanel,
		toolbarContent,
	}: Props = $props();

	// Type guards for elements
	function isTabGroup(element: PillNavElement): element is PillTabGroupConfig {
		return 'type' in element && element.type === 'tabs';
	}

	function isDivider(element: PillNavElement): element is { type: 'divider' } {
		return 'type' in element && element.type === 'divider';
	}

	function isNavItem(element: PillNavElement): element is PillNavItem {
		return 'href' in element;
	}

	// Truncate email for display (show first part before @, max 12 chars)
	function truncateEmail(email: string, maxLength = 12): string {
		const atIndex = email.indexOf('@');
		const localPart = atIndex > 0 ? email.substring(0, atIndex) : email;
		if (localPart.length <= maxLength) {
			return localPart;
		}
		return localPart.substring(0, maxLength) + '…';
	}

	// Local state for uncontrolled mode
	let internalSidebarMode = $state(false);
	let internalCollapsed = $state(false);

	// Use external or internal state
	const isSidebarMode = $derived(
		onModeChange !== undefined ? (externalSidebarMode ?? false) : internalSidebarMode
	);
	const isCollapsed = $derived(
		onCollapsedChange !== undefined ? (externalCollapsed ?? false) : internalCollapsed
	);

	// Mobile detection for dropdown direction
	let isMobile = $state(false);
	$effect(() => {
		if (typeof window !== 'undefined') {
			const checkMobile = () => {
				isMobile = window.innerWidth <= 768;
			};
			checkMobile();
			window.addEventListener('resize', checkMobile);
			return () => window.removeEventListener('resize', checkMobile);
		}
	});

	// Dropdown direction: up when nav is at bottom (mobile or desktop-bottom), down otherwise
	const dropdownDirection = $derived<'up' | 'down'>(
		// Mobile: always up (nav at bottom) unless in sidebar mode
		(isMobile && !isSidebarMode) ||
			// Desktop with bottom position: up unless in sidebar mode
			(!isMobile && desktopPosition === 'bottom' && !isSidebarMode)
			? 'up'
			: 'down'
	);

	function toggleSidebarMode() {
		const newValue = !isSidebarMode;
		if (onModeChange) {
			onModeChange(newValue);
		} else {
			internalSidebarMode = newValue;
		}
	}

	function collapseNav() {
		if (onCollapsedChange) {
			onCollapsedChange(true);
		} else {
			internalCollapsed = true;
		}
	}

	function expandNav() {
		if (onCollapsedChange) {
			onCollapsedChange(false);
		} else {
			internalCollapsed = false;
		}
	}

	function isActive(path: string) {
		return currentPath === path;
	}

	// Icon SVG paths
	const icons: Record<string, string> = {
		// Clock app icons
		bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
		clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
		timer: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
		stopwatch: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0zM9 3h6m-3-1v2',
		activity: 'M13 10V3L4 14h7v7l9-11h-7z',
		target:
			'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
		globe:
			'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
		// Todo app icons
		inbox:
			'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
		check: 'M5 13l4 4L19 7',
		checkCircle: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
		plus: 'M12 4v16m8-8H4',
		columns:
			'M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1zM19 4h-4a1 1 0 00-1 1v14a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1z',
		kanban:
			'M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1zM19 4h-4a1 1 0 00-1 1v14a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1z',
		// Original icons
		mic: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
		calendar:
			'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
		folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
		archive: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
		upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
		music:
			'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
		tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
		document:
			'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
		chart:
			'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
		settings:
			'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
		settingsInner: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
		home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		users:
			'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
		user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
		building:
			'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
		creditCard:
			'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
		search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
		heart:
			'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
		list: 'M4 6h16M4 10h16M4 14h16M4 18h16',
		compass:
			'M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z',
		moon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
		sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
		logout:
			'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
		chevronDown: 'M19 9l-7 7-7-7',
		chevronUp: 'M5 15l7-7 7 7',
		chevronLeft: 'M15 19l-7-7 7-7',
		chevronRight: 'M9 5l7 7-7 7',
		menu: 'M4 6h16M4 12h16M4 18h16',
		// Layout icons
		sidebar: 'M3 3h7v18H3V3zm9 0h9v18h-9V3z', // Sidebar layout icon
		layoutBottom: 'M3 3h18v9H3V3zm0 12h18v6H3v-6z', // Bottom bar layout icon
		panelRight: 'M9 3h12v18H9V3zM3 3h3v18H3V3z', // Panel right icon
		minimize: 'M4 12h16', // Minimize (minus) icon
		maximize: 'M4 8h16M4 16h16', // Two lines for expand
		fire: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
		grid: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
		gridSmall:
			'M4 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM10 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM16 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM4 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM10 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zM16 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z',
		palette:
			'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
		chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
		'help-circle':
			'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
		'share-2':
			'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98',
	};

	function getIconPath(name: string): string {
		return icons[name] || '';
	}
</script>

{#if !isCollapsed}
	<nav
		class="pill-nav"
		class:sidebar-mode={isSidebarMode}
		class:desktop-bottom={desktopPosition === 'bottom'}
		style={primaryColor ? `--pill-primary-color: ${primaryColor}` : ''}
	>
		<div class="pill-nav-container" class:sidebar-container={isSidebarMode}>
			<!-- Logo pill / App Switcher -->
			{#if showAppSwitcher && appItems.length > 0}
				<PillDropdown
					items={createAppDropdownItems(appItems, allAppsHref, allAppsLabel, onOpenInPanel)}
					direction={dropdownDirection}
					label={appName}
					icon="grid"
					iconOnly={!isSidebarMode}
				/>
			{:else}
				<a href={homeRoute} class="pill glass-pill logo-pill">
					{#if logo}
						{@render logo()}
					{:else}
						<span class="pill-label font-bold">{appName}</span>
					{/if}
				</a>
			{/if}

			<!-- Prepended Elements (Tab Groups, Dividers, Nav Items) -->
			{#each prependElements as element}
				{#if isTabGroup(element)}
					<PillTabGroup
						options={element.options}
						value={element.value}
						onChange={element.onChange}
						sectionLabel={element.sectionLabel}
						onContextMenu={element.onContextMenu}
						{isSidebarMode}
						{primaryColor}
					/>
				{:else if isDivider(element)}
					<div class="pill-divider" class:sidebar-divider={isSidebarMode}></div>
				{:else if isNavItem(element)}
					<a href={element.href} class="pill glass-pill" class:active={isActive(element.href)}>
						{#if element.icon}
							{#if phosphorIcons[element.icon]}
								{@const IconComponent = phosphorIcons[element.icon]}
								<IconComponent size={18} class="pill-icon" />
							{:else}
								<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getIconPath(element.icon)}
									/>
								</svg>
							{/if}
						{/if}
						<span class="pill-label">{element.label}</span>
					</a>
				{/if}
			{/each}

			<!-- Navigation Items -->
			{#each items as item}
				{#if item.onClick}
					<button onclick={item.onClick} class="pill glass-pill" class:active={item.active}>
						{#if item.icon}
							{#if item.icon === 'mana'}
								<svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z"
									/>
								</svg>
							{:else if item.iconSvg}
								{@html item.iconSvg}
							{:else if phosphorIcons[item.icon]}
								{@const IconComponent = phosphorIcons[item.icon]}
								<IconComponent size={18} class="pill-icon" />
							{:else}
								<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getIconPath(item.icon)}
									/>
								</svg>
							{/if}
						{/if}
						<span class="pill-label">{item.label}</span>
					</button>
				{:else}
					<a href={item.href} class="pill glass-pill" class:active={isActive(item.href)}>
						{#if item.icon}
							{#if item.icon === 'mana'}
								<svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z"
									/>
								</svg>
							{:else if item.iconSvg}
								{@html item.iconSvg}
							{:else if phosphorIcons[item.icon]}
								{@const IconComponent = phosphorIcons[item.icon]}
								<IconComponent size={18} class="pill-icon" />
							{:else}
								<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getIconPath(item.icon)}
									/>
								</svg>
							{/if}
						{/if}
						<span class="pill-label">{item.label}</span>
					</a>
				{/if}
			{/each}

			<!-- Additional Elements (Tab Groups, Dividers) -->
			{#each elements as element}
				{#if isTabGroup(element)}
					<PillTabGroup
						options={element.options}
						value={element.value}
						onChange={element.onChange}
						sectionLabel={element.sectionLabel}
						onContextMenu={element.onContextMenu}
						{isSidebarMode}
						{primaryColor}
					/>
				{:else if isDivider(element)}
					<div class="pill-divider" class:sidebar-divider={isSidebarMode}></div>
				{:else if isNavItem(element)}
					<a href={element.href} class="pill glass-pill" class:active={isActive(element.href)}>
						{#if element.icon}
							{#if phosphorIcons[element.icon]}
								{@const IconComponent = phosphorIcons[element.icon]}
								<IconComponent size={18} class="pill-icon" />
							{:else}
								<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getIconPath(element.icon)}
									/>
								</svg>
							{/if}
						{/if}
						<span class="pill-label">{element.label}</span>
					</a>
				{/if}
			{/each}

			<!-- Theme Variant Selector -->
			{#if showThemeVariants && themeVariantItems.length > 0}
				<PillDropdown
					items={themeVariantItems}
					direction={dropdownDirection}
					label={currentThemeVariantLabel}
					icon="palette"
				>
					{#snippet header()}
						<div class="theme-mode-selector glass-pill">
							<button
								type="button"
								onclick={() => onThemeModeChange?.('light')}
								class="mode-btn"
								class:active={themeMode === 'light'}
								title="Light mode"
							>
								<svg class="mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getIconPath('sun')}
									/>
								</svg>
							</button>
							<button
								type="button"
								onclick={() => onThemeModeChange?.('dark')}
								class="mode-btn"
								class:active={themeMode === 'dark'}
								title="Dark mode"
							>
								<svg class="mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getIconPath('moon')}
									/>
								</svg>
							</button>
							<button
								type="button"
								onclick={() => onThemeModeChange?.('system')}
								class="mode-btn"
								class:active={themeMode === 'system'}
								title="System mode"
							>
								<svg class="mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<rect x="2" y="3" width="20" height="14" rx="2" stroke-width="2" />
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 21h8M12 17v4"
									/>
								</svg>
							</button>
						</div>
					{/snippet}
					{#snippet footer()}
						{#if showA11yQuickToggles}
							<div class="a11y-quick-toggles glass-pill">
								<!-- Contrast Toggle -->
								<button
									type="button"
									onclick={() =>
										onA11yContrastChange?.(a11yContrast === 'high' ? 'normal' : 'high')}
									class="a11y-btn"
									class:active={a11yContrast === 'high'}
									title="Hoher Kontrast"
									aria-pressed={a11yContrast === 'high'}
								>
									<svg
										class="a11y-icon"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<circle cx="12" cy="12" r="10" />
										<path d="M12 2v20M12 2a10 10 0 0 1 0 20" fill="currentColor" />
									</svg>
								</button>
								<!-- Reduce Motion Toggle -->
								<button
									type="button"
									onclick={() => onA11yReduceMotionChange?.(!a11yReduceMotion)}
									class="a11y-btn"
									class:active={a11yReduceMotion}
									title="Animationen reduzieren"
									aria-pressed={a11yReduceMotion}
								>
									<svg
										class="a11y-icon"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										{#if a11yReduceMotion}
											<rect x="6" y="4" width="4" height="16" rx="1" />
											<rect x="14" y="4" width="4" height="16" rx="1" />
										{:else}
											<polygon points="5 3 19 12 5 21 5 3" />
										{/if}
									</svg>
								</button>
							</div>
						{/if}
					{/snippet}
				</PillDropdown>
			{/if}

			<!-- Mana Button -->
			{#if manaHref}
				<a
					href={manaHref}
					class="pill glass-pill"
					class:active={currentPath === manaHref}
					title="Mana"
				>
					<svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z"
						/>
					</svg>
					<span class="pill-label">Mana</span>
				</a>
			{/if}

			<!-- Theme Toggle (only show when not using theme variants dropdown) -->
			{#if showThemeToggle && onToggleTheme && !showThemeVariants}
				<button
					onclick={onToggleTheme}
					class="pill glass-pill"
					title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
				>
					{#if !isDark}
						<svg class="pill-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getIconPath('moon')}
							/>
						</svg>
					{:else}
						<svg class="pill-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getIconPath('sun')}
							/>
						</svg>
					{/if}
					<span class="pill-label">{isDark ? 'Light' : 'Dark'}</span>
				</button>
			{/if}

			<!-- User Menu Dropdown -->
			{#if userEmail}
				<PillDropdown
					items={[
						...(profileHref
							? [
									{
										id: 'profile',
										label: 'Profil',
										icon: 'user',
										onClick: () => {
											window.location.href = profileHref;
										},
										active: currentPath === profileHref,
									},
								]
							: []),
						{
							id: 'settings',
							label: 'Einstellungen',
							icon: 'settings',
							onClick: () => {
								window.location.href = settingsHref;
							},
							active: currentPath === settingsHref,
						},
						...(showLanguageSwitcher && languageItems.length > 0
							? [
									{ id: 'language-divider', label: '', divider: true },
									{
										id: 'language',
										label: currentLanguageLabel,
										submenu: languageItems.map((item) => ({
											...item,
											id: `lang-${item.id}`,
										})),
									},
								]
							: []),
						{ id: 'auth-divider', label: '', divider: true },
						...(showLogout && onLogout
							? [
									{
										id: 'logout',
										label: 'Logout',
										icon: 'logout',
										onClick: () => onLogout?.(),
										danger: true,
									},
								]
							: loginHref
								? [
										{
											id: 'login',
											label: 'Login',
											icon: 'user',
											onClick: () => {
												window.location.href = loginHref;
											},
										},
									]
								: []),
					]}
					direction={dropdownDirection}
					label={truncateEmail(userEmail)}
					icon="user"
				/>
			{:else if onLogout && showLogout}
				<!-- Fallback to standalone logout if no user email -->
				<button onclick={onLogout} class="pill glass-pill logout-pill" title="Logout">
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={getIconPath('logout')}
						/>
					</svg>
					<span class="pill-label">Logout</span>
				</button>
			{/if}

			<!-- Control Button (right position in horizontal mode, bottom in sidebar mode) -->
			{#if !isSidebarMode}
				<div class="pill glass-pill segmented-control">
					<button onclick={collapseNav} class="segment-btn" title="Navigation minimieren">
						<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getIconPath('chevronRight')}
							/>
						</svg>
					</button>
					<div class="segment-divider"></div>
					<button onclick={toggleSidebarMode} class="segment-btn" title="Zur Sidebar wechseln">
						<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getIconPath('sidebar')}
							/>
						</svg>
					</button>
				</div>
			{/if}

			<!-- Control Button (bottom position in sidebar mode) -->
			{#if isSidebarMode}
				<!-- Toolbar content (if provided) -->
				{#if toolbarContent}
					<div class="pill-divider sidebar-divider"></div>
					<div class="sidebar-toolbar-content">
						{@render toolbarContent()}
					</div>
				{/if}
				<div class="sidebar-spacer"></div>
				<div class="pill glass-pill segmented-control sidebar-segmented">
					<button
						onclick={toggleSidebarMode}
						class="segment-btn"
						title="Zur Bottom-Navigation wechseln"
					>
						<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getIconPath('layoutBottom')}
							/>
						</svg>
					</button>
					<div class="segment-divider"></div>
					<button onclick={collapseNav} class="segment-btn" title="Sidebar minimieren">
						<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getIconPath('chevronRight')}
							/>
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</nav>
{/if}

<!-- FAB for collapsed state -->
{#if isCollapsed}
	<button
		onclick={expandNav}
		class="nav-fab glass-pill"
		class:desktop-bottom={desktopPosition === 'bottom'}
		title="Expand navigation"
	>
		<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d={getIconPath('menu')}
			/>
		</svg>
	</button>
{/if}

<style>
	.pill-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		padding: 0.75rem 0 1.5rem;
		pointer-events: none;
		/* Container query context */
		container-type: inline-size;
		container-name: pillnav;
	}

	/* Desktop bottom position */
	@media (min-width: 769px) {
		.pill-nav.desktop-bottom:not(.sidebar-mode) {
			top: auto;
			bottom: 0;
			padding: 1rem 0 0.75rem;
		}
	}

	/* Mobile: always position at bottom */
	@media (max-width: 768px) {
		.pill-nav:not(.sidebar-mode) {
			top: auto;
			bottom: 0;
			padding: 1rem 0 calc(env(safe-area-inset-bottom, 0px) + 0.75rem);
		}
	}

	.pill-nav-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		pointer-events: auto;
		padding: 0.5rem 2rem;
		/* Default: left-aligned with fit-content */
		width: fit-content;
		max-width: 100%;
	}

	/* Center when container has enough space (> 600px) */
	@container pillnav (min-width: 600px) {
		.pill-nav-container:not(.sidebar-container) {
			margin-left: auto;
			margin-right: auto;
		}
	}

	/* Larger screens: always centered */
	@container pillnav (min-width: 900px) {
		.pill-nav-container:not(.sidebar-container) {
			margin-left: auto;
			margin-right: auto;
		}
	}

	.pill-nav-container::-webkit-scrollbar {
		display: none;
	}

	/* Base pill styles */
	.pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	/* Glass effect */
	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	.glass-pill:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .glass-pill:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	/* Active state - uses CSS custom property for theming */
	.pill.active {
		background: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.9)));
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 20%,
			white 80%
		);
		border-color: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.5)));
		color: #1a1a1a;
	}

	:global(.dark) .pill.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 30%,
			transparent 70%
		);
		border-color: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.4)));
		color: var(--pill-primary-color, var(--color-primary-500, #f8d62b));
	}

	/* Divider */
	.pill-divider {
		width: 1px;
		height: 1.5rem;
		background: rgba(0, 0, 0, 0.15);
		flex-shrink: 0;
		margin: 0 0.25rem;
	}

	:global(.dark) .pill-divider {
		background: rgba(255, 255, 255, 0.2);
	}

	.sidebar-divider {
		width: 100%;
		height: 1px;
		margin: 0.5rem 0;
	}

	/* Logout pill */
	.logout-pill {
		color: #dc2626;
	}

	:global(.dark) .logout-pill {
		color: #ef4444;
	}

	.logout-pill:hover {
		background: rgba(220, 38, 38, 0.15);
		border-color: rgba(220, 38, 38, 0.3);
	}

	.pill-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.pill-label {
		display: inline;
	}

	/* Sidebar mode styles */
	.pill-nav.sidebar-mode {
		top: 0;
		left: 0;
		bottom: 0;
		right: auto;
		width: 180px;
		padding: 0.75rem 0;
		background: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		border: none;
	}

	:global(.dark) .pill-nav.sidebar-mode {
		background: transparent;
		border: none;
	}

	/* Mobile: Sidebar as bottom sheet */
	@media (max-width: 768px) {
		.pill-nav.sidebar-mode {
			top: auto;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			max-height: 70vh;
			padding: 1.5rem 0 calc(env(safe-area-inset-bottom, 0px) + 0.75rem);
			background: rgba(255, 255, 255, 0.95);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
			border-top: 1px solid rgba(0, 0, 0, 0.1);
			border-radius: 1.5rem 1.5rem 0 0;
			box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
		}

		/* Drag handle */
		.pill-nav.sidebar-mode::before {
			content: '';
			position: absolute;
			top: 0.625rem;
			left: 50%;
			transform: translateX(-50%);
			width: 2.5rem;
			height: 0.25rem;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 9999px;
		}

		:global(.dark) .pill-nav.sidebar-mode {
			background: rgba(30, 30, 30, 0.95);
			border-top: 1px solid rgba(255, 255, 255, 0.1);
		}

		:global(.dark) .pill-nav.sidebar-mode::before {
			background: rgba(255, 255, 255, 0.3);
		}
	}

	.sidebar-container {
		flex-direction: column;
		align-items: stretch;
		gap: 0.5rem;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 1rem 1rem;
		height: 100%;
	}

	/* Toolbar content in sidebar mode */
	.sidebar-toolbar-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0;
		max-height: 40vh;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
	}

	.sidebar-toolbar-content::-webkit-scrollbar {
		width: 4px;
	}

	.sidebar-toolbar-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.sidebar-toolbar-content::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}

	:global(.dark) .sidebar-toolbar-content {
		scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
	}

	:global(.dark) .sidebar-toolbar-content::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
	}

	.sidebar-toolbar-content :global(.toolbar-bar) {
		flex-direction: column;
		background: transparent;
		backdrop-filter: none;
		border: none;
		box-shadow: none;
		border-radius: 0;
		padding: 0;
		gap: 0.5rem;
	}

	.sidebar-toolbar-content :global(.toolbar-content) {
		flex-direction: column;
		align-items: stretch;
		gap: 0.5rem;
		width: 100%;
	}

	/* All buttons in sidebar toolbar - full width, left aligned */
	.sidebar-toolbar-content :global(.pill-toolbar-btn),
	.sidebar-toolbar-content :global(.pill-dropdown .trigger-button),
	.sidebar-toolbar-content :global(button) {
		width: 100%;
		justify-content: flex-start;
		text-align: left;
		background: transparent;
		border: 1px solid transparent;
		box-shadow: none;
	}

	.sidebar-toolbar-content :global(.pill-toolbar-btn:hover),
	.sidebar-toolbar-content :global(.pill-dropdown .trigger-button:hover),
	.sidebar-toolbar-content :global(button:hover) {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .sidebar-toolbar-content :global(.pill-toolbar-btn:hover),
	:global(.dark) .sidebar-toolbar-content :global(.pill-dropdown .trigger-button:hover),
	:global(.dark) .sidebar-toolbar-content :global(button:hover) {
		background: rgba(255, 255, 255, 0.1);
	}

	/* Style for PillViewSwitcher in sidebar - vertical layout */
	.sidebar-toolbar-content :global(.pill-view-switcher) {
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
		padding: 0;
		background: transparent;
		border: none;
		box-shadow: none;
	}

	/* Hide the sliding indicator in vertical mode */
	.sidebar-toolbar-content :global(.pill-view-switcher .sliding-indicator) {
		display: none;
	}

	.sidebar-toolbar-content :global(.pill-view-switcher .switcher-btn) {
		width: 100%;
		justify-content: flex-start;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		background: transparent;
		border: 1px solid transparent;
	}

	.sidebar-toolbar-content :global(.pill-view-switcher .switcher-btn:hover) {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .sidebar-toolbar-content :global(.pill-view-switcher .switcher-btn:hover) {
		background: rgba(255, 255, 255, 0.1);
	}

	.sidebar-toolbar-content :global(.pill-view-switcher .switcher-btn.active) {
		background: color-mix(in srgb, var(--pill-primary-color, #3b82f6) 15%, transparent 85%);
		border-color: color-mix(in srgb, var(--pill-primary-color, #3b82f6) 25%, transparent 75%);
	}

	:global(.dark) .sidebar-toolbar-content :global(.pill-view-switcher .switcher-btn.active) {
		background: color-mix(in srgb, var(--pill-primary-color, #3b82f6) 25%, transparent 75%);
		border-color: color-mix(in srgb, var(--pill-primary-color, #3b82f6) 35%, transparent 65%);
	}

	/* PillTimeRangeSelector in sidebar */
	.sidebar-toolbar-content :global(.pill-time-range-selector),
	.sidebar-toolbar-content :global(.pill-dropdown) {
		width: 100%;
	}

	/* PillCalendarSelector in sidebar */
	.sidebar-toolbar-content :global(.calendar-selector) {
		width: 100%;
	}

	/* Mobile: Sidebar container adjustments */
	@media (max-width: 768px) {
		.sidebar-container {
			padding: 1rem 1.5rem 1rem;
			gap: 0.5rem;
			height: auto;
			max-height: calc(70vh - 2rem);
		}

		/* Hide spacer on mobile - not needed in bottom sheet */
		.sidebar-container .sidebar-spacer {
			display: none;
		}
	}

	.sidebar-container .pill {
		justify-content: flex-start;
		width: 100%;
	}

	.sidebar-container :global(.pill-dropdown) {
		width: 100%;
	}

	.sidebar-container :global(.pill-dropdown .trigger-button) {
		width: 100%;
		justify-content: flex-start;
	}

	.sidebar-container .segmented-control {
		width: 100%;
	}

	.sidebar-container .segmented-control .segment-btn {
		flex: 1;
	}

	/* Transparent pills in sidebar mode (desktop) */
	.sidebar-container .glass-pill,
	.sidebar-container :global(.pill-dropdown .trigger-button) {
		background: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		border: 1px solid transparent;
		box-shadow: none;
	}

	.sidebar-container .glass-pill:hover,
	.sidebar-container :global(.pill-dropdown .trigger-button:hover) {
		background: rgba(0, 0, 0, 0.05);
		border-color: rgba(0, 0, 0, 0.1);
		transform: none;
		box-shadow: none;
	}

	:global(.dark) .sidebar-container .glass-pill:hover,
	:global(.dark) .sidebar-container :global(.pill-dropdown .trigger-button:hover) {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Mobile: Visible pills in sidebar/bottom-sheet mode */
	@media (max-width: 768px) {
		.sidebar-container .glass-pill,
		.sidebar-container :global(.pill-dropdown .trigger-button) {
			background: rgba(0, 0, 0, 0.05);
			border: 1px solid rgba(0, 0, 0, 0.08);
		}

		.sidebar-container .glass-pill:hover,
		.sidebar-container :global(.pill-dropdown .trigger-button:hover) {
			background: rgba(0, 0, 0, 0.1);
			border-color: rgba(0, 0, 0, 0.15);
		}

		:global(.dark) .sidebar-container .glass-pill,
		:global(.dark) .sidebar-container :global(.pill-dropdown .trigger-button) {
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid rgba(255, 255, 255, 0.1);
		}

		:global(.dark) .sidebar-container .glass-pill:hover,
		:global(.dark) .sidebar-container :global(.pill-dropdown .trigger-button:hover) {
			background: rgba(255, 255, 255, 0.15);
			border-color: rgba(255, 255, 255, 0.2);
		}
	}

	/* Keep active state visible */
	.sidebar-container .pill.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 20%,
			transparent 80%
		);
		border-color: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 30%,
			transparent 70%
		);
	}

	:global(.dark) .sidebar-container .pill.active {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 15%,
			transparent 85%
		);
		border-color: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 25%,
			transparent 75%
		);
	}

	/* Logo pill in sidebar - same as other pills (transparent) */
	.sidebar-container .logo-pill {
		background: transparent;
		border-color: transparent;
	}

	.sidebar-container .logo-pill:hover {
		background: rgba(0, 0, 0, 0.05);
		border-color: rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .sidebar-container .logo-pill:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Spacer to push toggle button to bottom */
	.sidebar-spacer {
		flex: 1;
		min-height: 1rem;
	}

	/* Note: .toggle-pill class may be applied dynamically */

	/* Segmented control */
	.segmented-control {
		display: flex;
		align-items: center;
		padding: 0;
		gap: 0;
	}

	.segment-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0.625rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: inherit;
		transition: background 0.2s;
	}

	.segment-btn:first-child {
		border-radius: 9999px 0 0 9999px;
	}

	.segment-btn:last-child {
		border-radius: 0 9999px 9999px 0;
	}

	.segment-btn:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .segment-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.segment-divider {
		width: 1px;
		height: 1rem;
		background: rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .segment-divider {
		background: rgba(255, 255, 255, 0.2);
	}

	.sidebar-segmented {
		margin: 0;
	}

	/* FAB for collapsed state - positioned at right */
	.nav-fab {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 1001;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.875rem;
		border-radius: 0 0 0 1rem;
		cursor: pointer;
		border: none;
	}

	/* Desktop: FAB at bottom when desktop-bottom */
	@media (min-width: 769px) {
		.nav-fab.desktop-bottom {
			top: auto;
			bottom: 0;
			border-radius: 1rem 0 0 0;
		}
	}

	/* Mobile: FAB always at bottom right */
	@media (max-width: 768px) {
		.nav-fab {
			top: auto;
			bottom: 0;
			right: 0;
			border-radius: 1rem 0 0 0;
			padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 0.875rem);
		}
	}

	/* Transitions */
	.pill-nav {
		transition: all 0.3s ease;
	}

	.pill-nav-container {
		transition: all 0.3s ease;
	}

	/* Theme mode selector in dropdown header */
	:global(.theme-mode-selector) {
		display: flex !important;
		align-items: center !important;
		gap: 0.25rem !important;
		padding: 0.25rem !important;
		border-radius: 9999px !important;
		background: rgba(245, 245, 245, 0.95) !important;
		border: 1px solid rgba(0, 0, 0, 0.1) !important;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
		color: #374151 !important;
	}

	:global(.dark .theme-mode-selector) {
		background: rgba(40, 40, 40, 0.95) !important;
		border: 1px solid rgba(255, 255, 255, 0.15) !important;
		color: #f3f4f6 !important;
	}

	:global(.mode-btn) {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		border: none;
		background: transparent;
		border-radius: 9999px;
		cursor: pointer;
		color: #374151;
		transition: all 0.15s;
	}

	:global(.dark .mode-btn) {
		color: #f3f4f6;
	}

	:global(.mode-btn:hover:not(.active)) {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark .mode-btn:hover:not(.active)) {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.mode-btn.active) {
		background: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.2)));
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #3b82f6)) 20%,
			white 80%
		);
	}

	:global(.dark .mode-btn.active) {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #3b82f6)) 30%,
			transparent 70%
		);
	}

	:global(.mode-icon) {
		width: 1rem;
		height: 1rem;
	}

	/* A11y quick toggles in dropdown footer */
	:global(.a11y-quick-toggles) {
		display: flex !important;
		align-items: center !important;
		gap: 0.25rem !important;
		padding: 0.25rem !important;
		border-radius: 9999px !important;
		background: rgba(245, 245, 245, 0.95) !important;
		border: 1px solid rgba(0, 0, 0, 0.1) !important;
		color: #374151 !important;
	}

	:global(.dark .a11y-quick-toggles) {
		background: rgba(40, 40, 40, 0.95) !important;
		border: 1px solid rgba(255, 255, 255, 0.15) !important;
		color: #f3f4f6 !important;
	}

	:global(.a11y-btn) {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		border: none;
		background: transparent;
		border-radius: 9999px;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.15s;
	}

	:global(.dark .a11y-btn) {
		color: #9ca3af;
	}

	:global(.a11y-btn:hover:not(.active)) {
		background: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark .a11y-btn:hover:not(.active)) {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	:global(.a11y-btn.active) {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #3b82f6)) 20%,
			white 80%
		);
		color: var(--pill-primary-color, var(--color-primary-500, #3b82f6));
	}

	:global(.dark .a11y-btn.active) {
		background: color-mix(
			in srgb,
			var(--pill-primary-color, var(--color-primary-500, #3b82f6)) 30%,
			transparent 70%
		);
	}

	:global(.a11y-icon) {
		width: 1rem;
		height: 1rem;
	}
</style>
