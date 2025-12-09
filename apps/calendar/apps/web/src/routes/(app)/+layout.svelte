<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, CommandBar } from '@manacore/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		CommandBarItem,
		QuickAction,
	} from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { searchEvents } from '$lib/api/events';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';

	// App switcher items
	const appItems = getPillAppItems('calendar');

	let { children } = $props();

	// CommandBar state
	let commandBarOpen = $state(false);

	// CommandBar quick actions (no search for calendar yet)
	const commandBarQuickActions: QuickAction[] = [
		{ id: 'new', label: 'Neuen Termin erstellen', icon: 'plus', href: '/event/new', shortcut: 'N' },
		{
			id: 'today',
			label: 'Zu Heute springen',
			icon: 'calendar',
			onclick: () => viewStore.goToToday(),
		},
		{ id: 'agenda', label: 'Agenda anzeigen', icon: 'list', href: '/agenda' },
		{ id: 'settings', label: 'Einstellungen', icon: 'settings', href: '/settings' },
	];

	// CommandBar search - search events
	async function handleCommandBarSearch(query: string): Promise<CommandBarItem[]> {
		if (!query.trim()) return [];

		const result = await searchEvents(query);
		if (result.error || !result.data) return [];

		return result.data.slice(0, 10).map((event) => ({
			id: event.id,
			title: event.title,
			subtitle: format(new Date(event.startTime), 'dd. MMM yyyy, HH:mm', { locale: de }),
		}));
	}

	function handleCommandBarSelect(item: CommandBarItem) {
		goto(`/event/${item.id}`);
	}

	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Use theme store's isDark directly
	let isDark = $derived(theme.isDark);

	// Theme variant dropdown items
	let themeVariantItems = $derived<PillDropdownItem[]>([
		...theme.variants.map((variant) => ({
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

	// Navigation items for Calendar
	const navItems: PillNavItem[] = [
		{ href: '/', label: 'Kalender', icon: 'calendar' },
		{ href: '/agenda', label: 'Agenda', icon: 'list' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{ href: '/feedback', label: 'Feedback', icon: 'chat' },
	];

	// Navigation shortcuts (Ctrl+1-4)
	const navRoutes = navItems.map((item) => item.href);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;

		// Cmd/Ctrl+K to open command bar (works even in inputs)
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			commandBarOpen = true;
			return;
		}

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

		// Initialize view state
		viewStore.initialize();

		// Load calendars and user settings
		await calendarsStore.fetchCalendars();
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
	});
</script>

<svelte:window onkeydown={handleKeydown} />

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
		desktopPosition={userSettings.nav.desktopPosition}
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
	/>

	<main
		class="main-content bg-background"
		class:sidebar-mode={isSidebarMode && !isCollapsed}
		class:floating-mode={!isSidebarMode && !isCollapsed}
	>
		<div
			class="content-wrapper"
			class:calendar-expanded={settingsStore.sidebarCollapsed && $page.url.pathname === '/'}
		>
			{@render children()}
		</div>
	</main>

	<!-- Global Command Bar (Cmd/K) -->
	<CommandBar
		bind:open={commandBarOpen}
		onClose={() => (commandBarOpen = false)}
		onSearch={handleCommandBarSearch}
		onSelect={handleCommandBarSelect}
		quickActions={commandBarQuickActions}
		placeholder="Termin suchen..."
		emptyText="Keine Termine gefunden"
		searchingText="Suche..."
	/>
</div>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		transition: all 300ms ease;
		position: relative;
		z-index: 0;
	}

	.main-content.floating-mode {
		padding-top: 70px;
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
	}
</style>
