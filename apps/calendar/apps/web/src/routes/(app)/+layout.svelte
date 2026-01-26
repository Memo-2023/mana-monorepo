<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import {
		PillNavigation,
		QuickInputBar,
		InputBarHelpModal,
		ImmersiveModeToggle,
	} from '@manacore/shared-ui';
	import {
		SplitPaneContainer,
		setSplitPanelContext,
		DEFAULT_APPS,
	} from '@manacore/shared-splitscreen';
	import type {
		PillNavItem,
		PillDropdownItem,
		QuickInputItem,
		CreatePreview,
		PillTabGroupConfig,
		PillNavElement,
	} from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { eventTagsStore } from '$lib/stores/event-tags.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { birthdaysStore } from '$lib/stores/birthdays.svelte';
	import { browser } from '$app/environment';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { filterHiddenNavItems } from '@manacore/shared-theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
		isToolbarCollapsed as toolbarCollapsedStore,
	} from '$lib/stores/navigation';
	import { viewModeStore } from '$lib/stores/view-mode.svelte';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { searchEvents } from '$lib/api/events';
	import { searchStore } from '$lib/stores/search.svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import {
		parseEventInput,
		resolveEventIds,
		formatParsedEventPreview,
	} from '$lib/utils/event-parser';
	import CalendarToolbar from '$lib/components/calendar/CalendarToolbar.svelte';
	import CalendarToolbarContent from '$lib/components/calendar/CalendarToolbarContent.svelte';
	import DateStrip from '$lib/components/calendar/DateStrip.svelte';
	import DateStripFab from '$lib/components/calendar/DateStripFab.svelte';
	import TagStrip from '$lib/components/calendar/TagStrip.svelte';
	import EventContextMenu from '$lib/components/event/EventContextMenu.svelte';
	import ViewModePillContextMenu from '$lib/components/calendar/ViewModePillContextMenu.svelte';
	import StatsOverlay from '$lib/components/calendar/StatsOverlay.svelte';
	import SettingsModal from '$lib/components/settings/SettingsModal.svelte';
	import AuthGateModal from '$lib/components/AuthGateModal.svelte';
	import { eventContextMenuStore } from '$lib/stores/eventContextMenu.svelte';
	import { heatmapStore } from '$lib/stores/heatmap.svelte';
	import { sessionEventsStore } from '$lib/stores/session-events.svelte';
	import type { CalendarViewType } from '@calendar/shared';

	// App switcher items
	const appItems = getPillAppItems('calendar');

	// Split-Panel Store für Split-Screen Feature
	const splitPanel = setSplitPanelContext('calendar', DEFAULT_APPS);

	// Handler für Split-Screen Panel-Öffnung
	function handleOpenInPanel(appId: string, url: string) {
		splitPanel.openPanel(appId);
	}

	let { children } = $props();

	// InputBar search - search events
	async function handleSearch(query: string): Promise<QuickInputItem[]> {
		if (!query.trim()) return [];

		const result = await searchEvents(query);
		if (result.error || !result.data) return [];

		return result.data.slice(0, 10).map((event) => ({
			id: event.id,
			title: event.title,
			subtitle: format(new Date(event.startTime), 'dd. MMM yyyy, HH:mm', { locale: de }),
		}));
	}

	function handleSelect(item: QuickInputItem) {
		searchStore.clear();
		goto(`/event/${item.id}`);
	}

	// Update search store when search changes (for calendar view highlighting)
	function handleSearchChange(query: string, results: QuickInputItem[]) {
		if (!query.trim()) {
			searchStore.clear();
		} else {
			searchStore.setSearch(query, results);
		}
	}

	// QuickInputBar Quick-Create handlers
	function handleParseCreate(query: string): CreatePreview | null {
		if (!query.trim()) return null;

		const parsed = parseEventInput(query);
		if (!parsed.title) return null;

		return {
			title: `"${parsed.title}" erstellen`,
			subtitle: formatParsedEventPreview(parsed),
		};
	}

	async function handleCreate(query: string): Promise<void> {
		const parsed = parseEventInput(query);
		if (!parsed.title) return;

		// Resolve calendar and tag names to IDs
		const calendars = calendarsStore.calendars.map((c) => ({ id: c.id, name: c.name }));
		const tags = eventTagsStore.tags.map((t) => ({ id: t.id, name: t.name }));
		const resolved = resolveEventIds(parsed, calendars, tags);

		// Ensure we have start and end times
		if (!resolved.startTime) {
			// Default to now + 1 hour
			const now = new Date();
			resolved.startTime = now.toISOString();
			const end = new Date(now.getTime() + 60 * 60 * 1000);
			resolved.endTime = end.toISOString();
		}

		// Create event - calendarId is now optional, backend will use/create default if not provided
		await eventsStore.createEvent({
			// Only include calendarId if resolved (from command or default calendar)
			...(resolved.calendarId ? { calendarId: resolved.calendarId } : {}),
			title: resolved.title,
			startTime: resolved.startTime,
			endTime: resolved.endTime || resolved.startTime,
			isAllDay: resolved.isAllDay,
			location: resolved.location,
			tagIds: resolved.tagIds,
		});

		// Refresh calendars if none existed (in case default was created)
		if (calendarsStore.calendars.length === 0) {
			await calendarsStore.fetchCalendars();
		}
	}

	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);
	let isToolbarCollapsed = $state(true); // Default to collapsed - FAB next to InputBar

	// Mobile detection for responsive layout
	let isMobile = $state(false);

	function updateMobileState() {
		if (browser) {
			isMobile = window.innerWidth <= 640;
		}
	}

	// InputBar help modal state
	let helpModalOpen = $state(false);
	let helpModalMode = $state<'shortcuts' | 'syntax'>('shortcuts');

	// Settings modal state
	let showSettingsModal = $state(false);

	function handleShowShortcuts() {
		helpModalMode = 'shortcuts';
		helpModalOpen = true;
	}

	function handleShowSyntaxHelp() {
		helpModalMode = 'syntax';
		helpModalOpen = true;
	}

	function handleCloseHelpModal() {
		helpModalOpen = false;
	}

	// Default calendar for InputBar quick create
	let selectedDefaultCalendarId = $derived(
		calendarsStore.calendars.find((c) => c.isDefault)?.id || calendarsStore.calendars[0]?.id
	);

	function handleDefaultCalendarChange(id: string) {
		// Update the default calendar via API
		calendarsStore.setAsDefault(id);
	}

	// Calendar options for InputBar context menu
	let calendarOptions = $derived(
		calendarsStore.calendars.map((c) => ({
			id: c.id,
			label: c.name,
		}))
	);

	// Use theme store's isDark directly
	let isDark = $derived(theme.isDark);

	// Show toolbar only on calendar main page
	let showCalendarToolbar = $derived($page.url.pathname === '/');

	// Get pinned themes from user settings (extended themes only)
	let pinnedThemes = $derived<ThemeVariant[]>(
		(userSettings.theme?.pinnedThemes || []).filter((t): t is ThemeVariant =>
			EXTENDED_THEME_VARIANTS.includes(t as ThemeVariant)
		)
	);

	// Visible themes in PillNav: default + pinned extended
	let visibleThemes = $derived<ThemeVariant[]>([...DEFAULT_THEME_VARIANTS, ...pinnedThemes]);

	// Theme variant dropdown items
	let themeVariantItems = $derived<PillDropdownItem[]>([
		...visibleThemes.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant].label,
			icon: THEME_DEFINITIONS[variant].icon,
			onClick: () => theme.setVariant(variant),
			active: theme.variant === variant,
		})),
		{
			id: 'all-themes',
			label: 'Alle Themes',
			icon: 'palette',
			onClick: () => goto('/themes'),
			active: false,
		},
	]);

	// Current theme variant label
	let currentThemeVariantLabel = $derived(THEME_DEFINITIONS[theme.variant].label);

	// Language selector items
	let currentLocale = $derived($locale || 'de');
	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as any);
	}
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// User email for user dropdown
	let userEmail = $derived(authStore.user?.email || 'Menü');

	// Toggle TagStrip visibility
	function handleTagsToggle() {
		settingsStore.toggleTagStrip();
	}

	// Tags button active state (show as active when TagStrip is visible)
	let isTagStripVisible = $derived(!settingsStore.tagStripCollapsed);

	// Offset for elements above TagStrip (70px when visible)
	let tagStripOffset = $derived(showCalendarToolbar && !settingsStore.tagStripCollapsed ? 70 : 0);

	// Base navigation items for Calendar (without Kalender/Aufgaben - handled by tab group)
	// Note: Tags uses onClick to toggle TagStrip visibility instead of navigating
	// Note: Statistiken uses onClick to toggle heatmap mode (shows stats overlay + event density)
	let baseNavItems = $derived<PillNavItem[]>([
		{
			href: '/tags',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagsToggle,
			active: isTagStripVisible,
		},
		{
			href: '/',
			label: 'Statistiken',
			icon: 'flame',
			onClick: () => heatmapStore.toggle(),
			active: heatmapStore.enabled,
		},
		{
			href: '/',
			label: 'Einstellungen',
			icon: 'settings',
			onClick: () => (showSettingsModal = true),
		},
		{ href: '/feedback', label: 'Feedback', icon: 'chat' },
	]);

	// Navigation items filtered by visibility settings (with fallback for guest mode)
	const navItems = $derived(
		filterHiddenNavItems('calendar', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	// Active tab based on sidebar state: 'tasks' when sidebar is open, 'calendar' when closed
	let activeTab = $derived(settingsStore.sidebarCollapsed ? 'calendar' : 'tasks');

	// Tab group for Kalender/Aufgaben
	let calendarTasksTabGroup = $derived<PillTabGroupConfig>({
		type: 'tabs',
		options: [
			{ id: 'calendar', icon: 'calendar', label: 'Kalender', title: 'Kalender anzeigen' },
			{ id: 'tasks', icon: 'check-square', label: 'Aufgaben', title: 'Aufgaben-Sidebar öffnen' },
		],
		value: activeTab,
		onChange: handleTabChange,
	});

	// View switcher context menu
	let viewContextMenu: ViewModePillContextMenu;

	function handleViewContextMenu(x: number, y: number) {
		viewContextMenu?.show(x, y);
	}

	// View labels for tabs (numbers for day views, letters for others)
	const viewLabels: Record<CalendarViewType, string> = {
		day: '1',
		'3day': '3',
		'5day': '5',
		week: '7',
		'10day': '10',
		'14day': '14',
		'30day': '30',
		'60day': '60',
		'90day': '90',
		'365day': '365',
		month: 'M',
		year: 'Y',
		agenda: 'L',
		custom: '', // Will be set dynamically
	};

	// View titles for tooltips
	const viewTitles: Record<CalendarViewType, string> = {
		day: 'Tagesansicht',
		'3day': '3-Tage-Ansicht',
		'5day': '5-Tage-Ansicht',
		week: 'Wochenansicht',
		'10day': '10-Tage-Ansicht',
		'14day': '14-Tage-Ansicht',
		'30day': '30-Tage-Ansicht',
		'60day': '60-Tage-Ansicht',
		'90day': '90-Tage-Ansicht',
		'365day': '365-Tage-Ansicht',
		month: 'Monatsansicht',
		year: 'Jahresansicht',
		agenda: 'Agenda',
		custom: 'Benutzerdefiniert',
	};

	// Get enabled views from settings
	let enabledViews = $derived(settingsStore.quickViewPillViews);

	// Get label for a view (dynamic for custom)
	function getViewLabel(view: CalendarViewType): string {
		if (view === 'custom') {
			return String(settingsStore.customDayCount);
		}
		return viewLabels[view];
	}

	// Handle view/mode change - switches between calendar views and network mode
	function handleViewModeChange(id: string) {
		if (id === 'network') {
			viewModeStore.setMode('network');
		} else {
			// Switch to calendar mode and set the view type
			viewModeStore.setMode('calendar');
			viewStore.setViewType(id as CalendarViewType);
		}
	}

	// Current view value - shows 'network' when in network mode, otherwise the calendar view type
	let currentViewValue = $derived(
		viewModeStore.mode === 'network' ? 'network' : viewStore.viewType
	);

	// View switcher tab group (only shown on calendar main page)
	// Includes calendar views + network option
	let viewSwitcherTabGroup = $derived<PillTabGroupConfig>({
		type: 'tabs',
		options: [
			...enabledViews.map((view) => ({
				id: view,
				label: getViewLabel(view),
				title:
					view === 'custom' ? `${settingsStore.customDayCount}-Tage-Ansicht` : viewTitles[view],
			})),
			{ id: 'network', label: 'N', title: 'Netzwerk-Ansicht' },
		],
		value: currentViewValue,
		onChange: handleViewModeChange,
		onContextMenu: handleViewContextMenu,
	});

	// Prepended elements (tab groups at the start of navigation)
	let prependElements = $derived<PillNavElement[]>(
		showCalendarToolbar ? [calendarTasksTabGroup, viewSwitcherTabGroup] : [calendarTasksTabGroup]
	);

	// Handle tab change: toggle sidebar for tasks, close for calendar
	function handleTabChange(tabId: string) {
		// Always navigate to main calendar page if not there
		if ($page.url.pathname !== '/') {
			goto('/');
		}

		if (tabId === 'tasks') {
			// Toggle behavior: if sidebar is already open, close it
			settingsStore.toggleSidebar();
		} else if (tabId === 'calendar') {
			// Kalender-Tab: close sidebar if open
			if (!settingsStore.sidebarCollapsed) {
				settingsStore.toggleSidebar();
			}
		}
	}

	// Navigation shortcuts (Ctrl+1 = Kalender, Ctrl+2 = Aufgaben toggle, Ctrl+3+ = other nav items)
	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;

		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const num = parseInt(event.key);
			if (num === 1) {
				// Ctrl+1: Kalender (close sidebar)
				event.preventDefault();
				handleTabChange('calendar');
			} else if (num === 2) {
				// Ctrl+2: Aufgaben (toggle sidebar)
				event.preventDefault();
				handleTabChange('tasks');
			} else if (num >= 3 && num <= baseNavItems.length + 2) {
				// Ctrl+3+: other nav items (offset by 2 for the tab group)
				event.preventDefault();
				const route = baseNavItems[num - 3]?.href;
				if (route) {
					goto(route);
				}
			}
		}

		// F = Toggle Immersive Mode (no modifier keys)
		if (
			(event.key === 'f' || event.key === 'F') &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.shiftKey &&
			!event.altKey
		) {
			event.preventDefault();
			settingsStore.toggleImmersiveMode();
		}

		// Arrow keys for calendar navigation (only on main calendar page, no modifiers)
		if (
			showCalendarToolbar &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.shiftKey &&
			!event.altKey
		) {
			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				viewStore.goToPrevious();
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				viewStore.goToNext();
			} else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				// Scroll calendar view up/down - scroll to top/bottom
				const scrollContainer = document.querySelector('.carousel-page.current');
				if (scrollContainer) {
					event.preventDefault();
					if (event.key === 'ArrowDown') {
						// Scroll to bottom
						scrollContainer.scrollTo({
							top: scrollContainer.scrollHeight,
							behavior: 'smooth',
						});
					} else {
						// Scroll to top
						scrollContainer.scrollTo({
							top: 0,
							behavior: 'smooth',
						});
					}
				}
			}
		}
	}

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		sidebarModeStore.set(isSidebar);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('calendar-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('calendar-nav-collapsed', String(collapsed));
		}
	}

	function handleToolbarModeChange(isSidebar: boolean) {
		// Sync toolbar mode with nav mode
		handleModeChange(isSidebar);
	}

	function handleToolbarCollapsedChange(collapsed: boolean) {
		isToolbarCollapsed = collapsed;
		toolbarCollapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('calendar-toolbar-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		theme.toggleMode();
	}

	function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	// Context menu edit handler - navigate to event
	function handleContextMenuEdit(event: { id: string }) {
		goto(`/?event=${event.id}`);
	}

	// Reactive effect: load birthdays when setting is enabled
	$effect(() => {
		if (browser && settingsStore.showBirthdays && authStore.isAuthenticated) {
			birthdaysStore.fetchBirthdays();
		}
	});

	// Auth gate modal state
	let showAuthGateModal = $state(false);
	let authGateAction = $state<'save' | 'sync' | 'feature'>('save');

	// Show auth gate modal (can be called from child components)
	function showAuthGate(action: 'save' | 'sync' | 'feature' = 'save') {
		authGateAction = action;
		showAuthGateModal = true;
	}

	// Session events indicator
	let hasSessionEvents = $derived(sessionEventsStore.hasEvents);
	let sessionEventCount = $derived(sessionEventsStore.count);

	onMount(async () => {
		// Initialize split-panel from URL/localStorage
		splitPanel.initialize();

		// Initialize view state
		viewStore.initialize();

		// Initialize session events for guest mode
		sessionEventsStore.initialize();

		// Load calendars and tags (works in both guest and authenticated mode)
		await calendarsStore.fetchCalendars();

		// Only fetch tags and user settings if authenticated
		if (authStore.isAuthenticated) {
			await eventTagsStore.fetchTags();
			await userSettings.load();

			// Check for session events to migrate after login
			if (eventsStore.hasSessionEvents) {
				const defaultCalendar = calendarsStore.defaultCalendar;
				await eventsStore.migrateSessionEvents(defaultCalendar?.id);
			}
		}

		// Note: Birthdays are loaded via reactive $effect when showBirthdays is enabled

		// Redirect to start page if on root and a custom start page is set (only if authenticated)
		if (authStore.isAuthenticated) {
			const currentPath = window.location.pathname;
			if (currentPath === '/' && userSettings.startPage && userSettings.startPage !== '/') {
				goto(userSettings.startPage, { replaceState: true });
			}
		}

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('calendar-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('calendar-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		// Initialize toolbar collapsed state from localStorage (default is now collapsed)
		const savedToolbarCollapsed = localStorage.getItem('calendar-toolbar-collapsed');
		if (savedToolbarCollapsed === 'false') {
			isToolbarCollapsed = false;
			toolbarCollapsedStore.set(false);
		}

		// Initialize mobile state
		updateMobileState();
	});
</script>

<svelte:window onkeydown={handleKeydown} onresize={updateMobileState} />

<SplitPaneContainer>
	<div class="layout-container">
		<!-- Guest Mode Banner -->
		{#if !authStore.isAuthenticated}
			<div
				class="guest-banner bg-primary/10 border-primary/20 fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b px-4 py-2"
			>
				<div class="flex items-center gap-2 text-sm">
					<svg class="text-primary h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="text-foreground">
						<strong>Gast-Modus</strong>
						{#if sessionEventCount > 0}
							- {sessionEventCount}
							{sessionEventCount === 1 ? 'Termin' : 'Termine'} lokal gespeichert
						{:else}
							- Termine werden nur in diesem Tab gespeichert
						{/if}
					</span>
				</div>
				<button
					onclick={() => showAuthGate('sync')}
					class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 text-sm font-medium transition-colors"
				>
					Anmelden
				</button>
			</div>
		{/if}
		<!-- UI Elements (hidden in immersive mode) -->
		{#if !settingsStore.immersiveModeEnabled}
			<PillNavigation
				items={navItems}
				{prependElements}
				currentPath={$page.url.pathname}
				appName="Kalender"
				homeRoute="/"
				onToggleTheme={handleToggleTheme}
				{isDark}
				{isSidebarMode}
				onModeChange={handleModeChange}
				{isCollapsed}
				onCollapsedChange={handleCollapsedChange}
				desktopPosition="bottom"
				showThemeToggle={true}
				showThemeVariants={true}
				{themeVariantItems}
				{currentThemeVariantLabel}
				themeMode={theme.mode}
				onThemeModeChange={handleThemeModeChange}
				showLanguageSwitcher={true}
				{languageItems}
				{currentLanguageLabel}
				showLogout={authStore.isAuthenticated}
				onLogout={handleLogout}
				loginHref="/login"
				primaryColor="#3b82f6"
				showAppSwitcher={true}
				{appItems}
				{userEmail}
				settingsHref="/settings"
				manaHref="/mana"
				profileHref="/profile"
				allAppsHref="/apps"
				onOpenInPanel={handleOpenInPanel}
			>
				{#snippet toolbarContent()}
					{#if showCalendarToolbar}
						<CalendarToolbarContent vertical={true} />
					{/if}
				{/snippet}
			</PillNavigation>

			<!-- Date strip (only on main calendar page) -->
			{#if showCalendarToolbar}
				{#if settingsStore.dateStripCollapsed}
					<DateStripFab
						{isSidebarMode}
						isToolbarExpanded={!isToolbarCollapsed}
						{isMobile}
						hasTagStrip={!settingsStore.tagStripCollapsed}
					/>
				{:else}
					<DateStrip
						{isSidebarMode}
						isToolbarExpanded={!isToolbarCollapsed}
						hasTagStrip={!settingsStore.tagStripCollapsed}
					/>
				{/if}
			{/if}

			<!-- Tag strip (only on main calendar page, when not collapsed) - directly above PillNav -->
			{#if showCalendarToolbar && !settingsStore.tagStripCollapsed}
				<TagStrip {isSidebarMode} />
			{/if}

			<!-- Calendar toolbar (only on main calendar page, not in sidebar mode) -->
			{#if showCalendarToolbar && !isSidebarMode}
				<CalendarToolbar
					{isSidebarMode}
					isCollapsed={isToolbarCollapsed}
					{isMobile}
					bottomOffset={settingsStore.tagStripCollapsed ? '70px' : '140px'}
					onModeChange={handleToolbarModeChange}
					onCollapsedChange={handleToolbarCollapsedChange}
				/>
			{/if}
		{/if}

		<!-- Global Input Bar (hidden via CSS in immersive mode to prevent re-mount focus) -->
		<div class="input-bar-wrapper" class:hidden={settingsStore.immersiveModeEnabled}>
			<QuickInputBar
				onSearch={handleSearch}
				onSelect={handleSelect}
				onSearchChange={handleSearchChange}
				placeholder="Neuer Termin oder suchen..."
				emptyText="Keine Termine gefunden"
				searchingText="Suche..."
				onCreate={handleCreate}
				onParseCreate={handleParseCreate}
				createText="Erstellen"
				appIcon="calendar"
				bottomOffset={isMobile
					? `${70 + tagStripOffset}px`
					: isSidebarMode
						? `${tagStripOffset}px`
						: showCalendarToolbar && !isToolbarCollapsed
							? `${140 + tagStripOffset}px`
							: `${70 + tagStripOffset}px`}
				hasFabRight={showCalendarToolbar && !isSidebarMode}
				hasFabLeft={!isMobile &&
					showCalendarToolbar &&
					!isSidebarMode &&
					settingsStore.dateStripCollapsed}
				defaultOptions={calendarOptions}
				selectedDefaultId={selectedDefaultCalendarId}
				defaultOptionLabel="Standard-Kalender"
				onDefaultChange={handleDefaultCalendarChange}
				onShowShortcuts={handleShowShortcuts}
				onShowSyntaxHelp={handleShowSyntaxHelp}
			/>
		</div>

		<!-- Immersive Mode Toggle (always visible on main calendar page) -->
		<ImmersiveModeToggle
			isImmersive={settingsStore.immersiveModeEnabled}
			onToggle={() => settingsStore.toggleImmersiveMode()}
			visible={showCalendarToolbar}
		/>

		<main
			class="main-content bg-background"
			class:sidebar-mode={isSidebarMode && !isCollapsed}
			class:floating-mode={!isSidebarMode && !isCollapsed}
			class:has-toolbar={showCalendarToolbar}
			class:immersive={settingsStore.immersiveModeEnabled}
		>
			<div
				class="content-wrapper"
				class:calendar-expanded={settingsStore.sidebarCollapsed && $page.url.pathname === '/'}
				class:immersive={settingsStore.immersiveModeEnabled}
			>
				{@render children()}
			</div>
		</main>
	</div>
</SplitPaneContainer>

<!-- Global Event Context Menu - rendered at top level for proper z-index -->
<EventContextMenu onEdit={handleContextMenuEdit} />

<!-- View Mode Context Menu -->
<ViewModePillContextMenu bind:this={viewContextMenu} />

<!-- InputBar Help Modal -->
<InputBarHelpModal open={helpModalOpen} onClose={handleCloseHelpModal} mode={helpModalMode} />

<!-- Stats Overlay (shown when heatmap is enabled) -->
<StatsOverlay />

<!-- Settings Modal -->
<SettingsModal
	visible={showSettingsModal}
	onClose={() => (showSettingsModal = false)}
	{isSidebarMode}
/>

<!-- Auth Gate Modal -->
<AuthGateModal
	visible={showAuthGateModal}
	onClose={() => (showAuthGateModal = false)}
	action={authGateAction}
/>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	/* Guest banner styling */
	.guest-banner {
		height: 40px;
		min-height: 40px;
	}

	/* Offset content when guest banner is visible */
	.layout-container:has(.guest-banner) {
		padding-top: 40px;
	}

	/* Floating mode already has padding-top, no extra adjustment needed since container handles banner offset */

	/* Mobile: Fixed viewport, no scroll */
	@media (max-width: 768px) {
		.layout-container {
			height: 100vh;
			max-height: 100vh;
			overflow: hidden;
		}

		.layout-container:has(.guest-banner) {
			height: calc(100vh - 40px);
			margin-top: 40px;
			padding-top: 0;
		}
	}

	.main-content {
		transition: all 300ms ease;
		position: relative;
		/* Space for QuickInputBar at bottom */
		padding-bottom: calc(80px + env(safe-area-inset-bottom));
		/* Flex container for children */
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.main-content.floating-mode {
		padding-top: 70px;
	}

	/* Extra padding when DateStrip is at bottom (toolbar is now a FAB) */
	.main-content.floating-mode.has-toolbar {
		padding-top: 0;
		padding-bottom: calc(
			220px + env(safe-area-inset-bottom)
		); /* DateStrip + PillNav + QuickInputBar */
	}

	@media (max-width: 768px) {
		/* On mobile, fixed height layout - no page scroll */
		.main-content {
			height: calc(100vh - 70px); /* Full height minus bottom nav */
			overflow: hidden;
			padding-bottom: 0;
			display: flex;
			flex-direction: column;
		}
		.main-content.has-toolbar {
			height: calc(100vh - 70px);
			padding-bottom: 0;
		}
		.main-content.floating-mode {
			padding-top: 0; /* No top padding on mobile - everything is at bottom */
		}
	}

	/* Mobile: Fixed height, internal scrolling only */
	@media (max-width: 640px) {
		.main-content {
			height: calc(100vh - 70px);
			overflow: hidden;
			padding-bottom: 0;
		}
		.main-content.has-toolbar {
			height: calc(100vh - 70px);
			padding-bottom: 0;
		}
	}

	.main-content.sidebar-mode {
		padding-left: 180px;
	}

	.content-wrapper {
		max-width: 100%;
		margin-left: auto;
		margin-right: auto;
		padding: 1rem;
		position: relative;
		z-index: 0;
		/* Flex for calendar layout */
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	/* Mobile: no padding, full height */
	@media (max-width: 768px) {
		.content-wrapper {
			padding: 0;
			height: 100%;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}
	}

	@media (min-width: 640px) {
		.content-wrapper {
			padding: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.content-wrapper {
			padding: 2rem;
		}
	}

	/* Full width when calendar sidebar is collapsed */
	.content-wrapper.calendar-expanded {
		width: 100%;
		max-width: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	/* Calendar fills entire screen - UI elements float on top */
	.main-content:has(.content-wrapper.calendar-expanded) {
		padding-bottom: 0 !important;
	}

	/* Immersive Mode - fullscreen, no UI elements visible */
	.main-content.immersive {
		padding: 0 !important;
		height: 100vh !important;
		width: 100vw;
		transition: padding 300ms ease;
	}

	.content-wrapper.immersive {
		padding: 0 !important;
		margin: 0;
		height: 100vh;
		width: 100vw;
		max-width: 100vw;
	}

	/* Adjust InputBar when FABs are visible (toolbar FAB on right, DateStripFab on left) */
	/* For a centered InputBar with max-width 450px, left edge is at 50% - 225px */
	/* DateStripFab is positioned at: 50% - 225px - 8px gap - 54px fab width */
	/* Note: In sidebar mode, InputBar uses default 700px max-width */
	:global(.quick-input-bar.has-fab-right .input-container),
	:global(.quick-input-bar.has-fab-left .input-container) {
		max-width: 450px;
	}

	/* On smaller screens (<900px), FABs move to fixed positions (left: 1rem, right: 1rem) */
	@media (max-width: 900px) {
		:global(.quick-input-bar.has-fab-right .input-container) {
			max-width: calc(100% - 140px); /* 54px FAB + padding */
			margin-left: auto;
			margin-right: 0;
		}
		:global(.quick-input-bar.has-fab-left .input-container) {
			max-width: calc(100% - 140px); /* 54px FAB + padding */
			margin-left: 0;
			margin-right: auto;
		}
		:global(.quick-input-bar.has-fab-right.has-fab-left .input-container) {
			max-width: calc(100% - 200px); /* Both FABs */
			margin-left: auto;
			margin-right: auto;
		}
	}

	/* Mobile: InputBar in its own row (above PillNav), Settings FAB stays next to InputBar */
	@media (max-width: 640px) {
		/* InputBar takes all available space up to the FAB */
		:global(.quick-input-bar.has-fab-right .input-container) {
			max-width: none;
			width: 100%;
			margin: 0;
		}

		:global(.quick-input-bar.has-fab-right) {
			padding-left: 1rem;
			padding-right: calc(54px + 1rem + 8px); /* FAB width + margin + gap */
		}
	}
</style>
