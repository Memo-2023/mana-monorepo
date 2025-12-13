<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, QuickInputBar } from '@manacore/shared-ui';
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
	} from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { eventTagsStore } from '$lib/stores/event-tags.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
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

	// Base navigation items for Calendar
	const baseNavItems: PillNavItem[] = [
		{ href: '/', label: 'Kalender', icon: 'calendar' },
		{ href: '/tasks', label: 'Aufgaben', icon: 'check-square' },
		{ href: '/tags', label: 'Tags', icon: 'tag' },
		{ href: '/statistics', label: 'Statistiken', icon: 'bar-chart-3' },
		{ href: '/network', label: 'Netzwerk', icon: 'share-2' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{ href: '/feedback', label: 'Feedback', icon: 'chat' },
	];

	// Navigation items filtered by visibility settings
	const navItems = $derived(
		filterHiddenNavItems('calendar', baseNavItems, userSettings.nav.hiddenNavItems)
	);

	// Navigation shortcuts (Ctrl+1-4) - use base items for consistent shortcuts
	const navRoutes = baseNavItems.map((item) => item.href);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;

		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const num = parseInt(event.key);
			if (num >= 1 && num <= navRoutes.length) {
				event.preventDefault();
				const route = navRoutes[num - 1];
				if (route) {
					goto(route);
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

	onMount(async () => {
		// Redirect to login if not authenticated
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Initialize split-panel from URL/localStorage
		splitPanel.initialize();

		// Initialize view state
		viewStore.initialize();

		// Load calendars, tags, and user settings
		await calendarsStore.fetchCalendars();
		await eventTagsStore.fetchTags();
		await userSettings.load();

		// Redirect to start page if on root and a custom start page is set
		const currentPath = window.location.pathname;
		if (currentPath === '/' && userSettings.startPage && userSettings.startPage !== '/') {
			goto(userSettings.startPage, { replaceState: true });
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
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<SplitPaneContainer>
	<div class="layout-container">
		<PillNavigation
			items={navItems}
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
			<DateStrip {isSidebarMode} isToolbarExpanded={!isToolbarCollapsed} />
		{/if}

		<!-- Calendar toolbar (only on main calendar page, not in sidebar mode) -->
		{#if showCalendarToolbar && !isSidebarMode}
			<CalendarToolbar
				{isSidebarMode}
				isCollapsed={isToolbarCollapsed}
				onModeChange={handleToolbarModeChange}
				onCollapsedChange={handleToolbarCollapsedChange}
			/>
		{/if}

		<main
			class="main-content bg-background"
			class:sidebar-mode={isSidebarMode && !isCollapsed}
			class:floating-mode={!isSidebarMode && !isCollapsed}
			class:has-toolbar={showCalendarToolbar}
		>
			<div
				class="content-wrapper"
				class:calendar-expanded={settingsStore.sidebarCollapsed && $page.url.pathname === '/'}
			>
				{@render children()}
			</div>
		</main>

		<!-- Global Input Bar -->
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
			primaryColor="#3b82f6"
			autoFocus={true}
			bottomOffset={isSidebarMode
				? '0px'
				: showCalendarToolbar && !isToolbarCollapsed
					? '140px'
					: '70px'}
		/>
	</div>
</SplitPaneContainer>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		transition: all 300ms ease;
		position: relative;
		/* Space for QuickInputBar at bottom */
		padding-bottom: calc(80px + env(safe-area-inset-bottom));
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
		/* On mobile, toolbars are at bottom, extra padding at bottom instead */
		.main-content {
			padding-bottom: calc(150px + env(safe-area-inset-bottom)); /* PillNav + QuickInputBar */
		}
		.main-content.has-toolbar {
			padding-bottom: calc(
				200px + env(safe-area-inset-bottom)
			); /* DateStrip + BottomNav + QuickInputBar */
		}
		.main-content.floating-mode.has-toolbar {
			padding-top: 70px;
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
</style>
