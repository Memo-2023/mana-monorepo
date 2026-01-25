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
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { alarmsStore } from '$lib/stores/alarms.svelte';
	import { timersStore } from '$lib/stores/timers.svelte';
	import { sessionAlarmsStore } from '$lib/stores/session-alarms.svelte';
	import { sessionTimersStore } from '$lib/stores/session-timers.svelte';
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
	} from '$lib/stores/navigation';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { alarmsApi } from '$lib/api/alarms';
	import { timersApi } from '$lib/api/timers';
	import AuthGateModal from '$lib/components/AuthGateModal.svelte';

	// App switcher items
	const appItems = getPillAppItems('clock');

	let { children } = $props();

	// CommandBar state
	let commandBarOpen = $state(false);

	// CommandBar quick actions
	const commandBarQuickActions: QuickAction[] = [
		{
			id: 'alarm',
			label: 'Neuen Wecker erstellen',
			icon: 'bell',
			href: '/alarms?new=true',
			shortcut: 'A',
		},
		{
			id: 'timer',
			label: 'Neuen Timer starten',
			icon: 'timer',
			href: '/timers?new=true',
			shortcut: 'T',
		},
		{ id: 'stopwatch', label: 'Stoppuhr', icon: 'stopwatch', href: '/stopwatch' },
		{ id: 'pomodoro', label: 'Pomodoro starten', icon: 'target', href: '/pomodoro' },
		{ id: 'worldclock', label: 'Weltzeituhr', icon: 'globe', href: '/world-clock' },
		{ id: 'settings', label: 'Einstellungen', icon: 'settings', href: '/settings' },
	];

	// CommandBar search - search alarms and timers
	async function handleCommandBarSearch(query: string): Promise<CommandBarItem[]> {
		if (!query.trim()) return [];

		const queryLower = query.toLowerCase();
		const results: CommandBarItem[] = [];

		try {
			// Search alarms
			const alarms = await alarmsApi.getAll();
			const matchingAlarms = alarms
				.filter((alarm) => alarm.label?.toLowerCase().includes(queryLower))
				.slice(0, 5)
				.map((alarm) => ({
					id: `alarm-${alarm.id}`,
					title: alarm.label || 'Wecker',
					subtitle: `⏰ ${alarm.time} ${alarm.enabled ? '(aktiv)' : '(inaktiv)'}`,
				}));
			results.push(...matchingAlarms);

			// Search timers
			const timers = await timersApi.getAll();
			const matchingTimers = timers
				.filter((timer) => timer.label?.toLowerCase().includes(queryLower))
				.slice(0, 5)
				.map((timer) => {
					const mins = Math.floor(timer.durationSeconds / 60);
					const secs = timer.durationSeconds % 60;
					return {
						id: `timer-${timer.id}`,
						title: timer.label || 'Timer',
						subtitle: `⏱️ ${mins}:${secs.toString().padStart(2, '0')} ${timer.status === 'running' ? '(läuft)' : ''}`,
					};
				});
			results.push(...matchingTimers);
		} catch {
			// Ignore errors
		}

		return results.slice(0, 10);
	}

	function handleCommandBarSelect(item: CommandBarItem) {
		if (item.id.startsWith('alarm-')) {
			goto('/alarms');
		} else if (item.id.startsWith('timer-')) {
			goto('/timers');
		}
	}

	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Guest mode state
	let showAuthGateModal = $state(false);
	let authGateAction = $state<'save' | 'sync' | 'feature'>('save');

	// Check if in guest mode
	let isGuestMode = $derived(!authStore.isAuthenticated);
	let sessionItemCount = $derived(sessionAlarmsStore.count + sessionTimersStore.count);

	// Use theme store's isDark directly
	let isDark = $derived(theme.isDark);

	// Get pinned themes from user settings (extended themes only)
	let pinnedThemes = $derived<ThemeVariant[]>(
		(userSettings.theme?.pinnedThemes || []).filter((t): t is ThemeVariant =>
			EXTENDED_THEME_VARIANTS.includes(t as ThemeVariant)
		)
	);

	// Visible themes in PillNav: default + pinned extended
	let visibleThemes = $derived<ThemeVariant[]>([...DEFAULT_THEME_VARIANTS, ...pinnedThemes]);

	// Theme variant dropdown items (with SSR fallback)
	let themeVariantItems = $derived<PillDropdownItem[]>([
		...visibleThemes.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant]?.label || variant,
			icon: THEME_DEFINITIONS[variant]?.icon || '🎨',
			onClick: () => theme.setVariant(variant),
			active: (theme.variant || 'lume') === variant,
		})),
		{
			id: 'all-themes',
			label: 'Alle Themes',
			icon: 'palette',
			onClick: () => goto('/themes'),
			active: false,
		},
	]);

	// Current theme variant label (with SSR fallback)
	let currentThemeVariantLabel = $derived(
		THEME_DEFINITIONS[theme.variant]?.label || THEME_DEFINITIONS.lume?.label || 'Lume'
	);

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

	// Base navigation items for Clock
	const baseNavItems: PillNavItem[] = [
		{ href: '/', label: 'Übersicht', icon: 'home' },
		{ href: '/alarms', label: 'Wecker', icon: 'bell' },
		{ href: '/timers', label: 'Timer', icon: 'timer' },
		{ href: '/stopwatch', label: 'Stoppuhr', icon: 'stopwatch' },
		{ href: '/pomodoro', label: 'Pomodoro', icon: 'target' },
		{ href: '/world-clock', label: 'Weltzeituhr', icon: 'globe' },
		{ href: '/life', label: 'Lebensuhr', icon: 'heart' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{ href: '/feedback', label: 'Feedback', icon: 'chat' },
	];

	// Navigation items filtered by visibility settings (with fallback for guest mode)
	const navItems = $derived(
		filterHiddenNavItems('clock', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	// Navigation shortcuts (Ctrl+1-9) - use base items for consistent shortcuts
	const navRoutes = baseNavItems.map((item) => item.href);

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
			localStorage.setItem('clock-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('clock-nav-collapsed', String(collapsed));
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
		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('clock-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('clock-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		// Load user settings if authenticated
		if (authStore.isAuthenticated) {
			await userSettings.load();

			// Check for session data to migrate
			if (alarmsStore.hasSessionAlarms) {
				await alarmsStore.migrateSessionAlarms();
			}
			if (timersStore.hasSessionTimers) {
				await timersStore.migrateSessionTimers();
			}

			// Redirect to start page if on root and a custom start page is set
			const currentPath = window.location.pathname;
			if (currentPath === '/' && userSettings.startPage && userSettings.startPage !== '/') {
				goto(userSettings.startPage, { replaceState: true });
			}
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Guest Mode Banner -->
{#if isGuestMode}
	<div class="guest-banner">
		<span>
			Du bist im Gast-Modus.
			{#if sessionItemCount > 0}
				{sessionItemCount}
				{sessionItemCount === 1 ? 'Element' : 'Elemente'} in dieser Session.
			{/if}
		</span>
		<button onclick={() => goto('/login')}>Anmelden</button>
	</div>
{/if}

<div class="layout-container" class:has-guest-banner={isGuestMode}>
	<PillNavigation
		items={navItems}
		currentPath={$page.url.pathname}
		appName="Clock"
		homeRoute="/"
		desktopPosition={userSettings.nav?.desktopPosition || 'bottom'}
		onToggleTheme={handleToggleTheme}
		{isDark}
		{isSidebarMode}
		onModeChange={handleModeChange}
		{isCollapsed}
		onCollapsedChange={handleCollapsedChange}
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
		primaryColor="#f59e0b"
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
		<div class="content-wrapper">
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
		placeholder="Schnellzugriff..."
		emptyText="Keine Ergebnisse"
		searchingText="Suche..."
	/>

	<!-- Auth Gate Modal -->
	<AuthGateModal
		open={showAuthGateModal}
		action={authGateAction}
		itemCount={sessionItemCount}
		onClose={() => (showAuthGateModal = false)}
	/>
</div>

<style>
	.guest-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 60;
		background-color: #f59e0b;
		color: white;
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		font-size: 0.875rem;
	}

	.guest-banner button {
		background-color: white;
		color: #f59e0b;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-weight: 500;
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.guest-banner button:hover {
		background-color: #fef3c7;
	}

	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.layout-container.has-guest-banner {
		padding-top: 40px;
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
</style>
