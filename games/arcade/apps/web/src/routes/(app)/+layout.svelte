<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, CommandBar, SyncIndicator } from '@manacore/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		CommandBarItem,
		QuickAction,
	} from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { games, getGameBySlug } from '$lib/data/games';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { filterHiddenNavItems } from '@manacore/shared-theme';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { gamesOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { gamesStore } from '$lib/data/local-store';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';

	const allTags = useAllSharedTags();

	let showGuestWelcome = $state(false);

	function initGuestWelcome() {
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('arcade')) {
			showGuestWelcome = true;
		}
	}

	let appItems = $derived(getPillAppItems('arcade', undefined, undefined, authStore.user?.tier));

	let { children } = $props();

	let commandBarOpen = $state(false);

	const commandBarQuickActions: QuickAction[] = [
		{ id: 'home', label: 'Alle Spiele', icon: 'gamepad-2', href: '/', shortcut: '1' },
		{ id: 'create', label: 'Spiel erstellen', icon: 'sparkles', href: '/create', shortcut: '2' },
		{ id: 'community', label: 'Community', icon: 'users', href: '/community', shortcut: '3' },
		{ id: 'stats', label: 'Statistiken', icon: 'bar-chart-3', href: '/stats', shortcut: '4' },
		{ id: 'settings', label: 'Einstellungen', icon: 'settings', href: '/settings' },
	];

	async function handleCommandBarSearch(query: string): Promise<CommandBarItem[]> {
		if (!query.trim()) return [];
		const queryLower = query.toLowerCase();

		return games
			.filter(
				(g) =>
					g.title.toLowerCase().includes(queryLower) ||
					g.tags.some((t) => t.toLowerCase().includes(queryLower))
			)
			.slice(0, 10)
			.map((g) => ({
				id: `game-${g.slug}`,
				title: g.title,
				subtitle: g.tags.join(', '),
			}));
	}

	function handleCommandBarSelect(item: CommandBarItem) {
		const slug = item.id.replace('game-', '');
		goto(`/play/${slug}`);
	}

	let isCollapsed = $state(false);
	let isDark = $derived(theme.isDark);

	let pinnedThemes = $derived<ThemeVariant[]>(
		(userSettings.theme?.pinnedThemes || []).filter((t): t is ThemeVariant =>
			EXTENDED_THEME_VARIANTS.includes(t as ThemeVariant)
		)
	);

	let visibleThemes = $derived<ThemeVariant[]>([...DEFAULT_THEME_VARIANTS, ...pinnedThemes]);

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

	let currentThemeVariantLabel = $derived(
		THEME_DEFINITIONS[theme.variant]?.label || THEME_DEFINITIONS.lume?.label || 'Lume'
	);

	let currentLocale = $derived($locale || 'de');
	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as any);
	}
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	let userEmail = $derived(authStore.isAuthenticated ? authStore.user?.email || 'Menü' : '');

	const baseNavItems: PillNavItem[] = [
		{ href: '/', label: 'Spiele', icon: 'gamepad-2' },
		{ href: '/create', label: 'Erstellen', icon: 'sparkles' },
		{ href: '/community', label: 'Community', icon: 'users' },
		{ href: '/stats', label: 'Statistiken', icon: 'bar-chart-3' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
	];

	const navItems = $derived(
		filterHiddenNavItems('arcade', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	function handleKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			commandBarOpen = true;
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('arcade-nav-collapsed', String(collapsed));
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

	async function handleAuthReady() {
		await Promise.all([gamesStore.initialize(), tagLocalStore.initialize()]);

		if (authStore.isAuthenticated) {
			const getToken = () => authStore.getValidToken();
			gamesStore.startSync(getToken);
			tagMutations.startSync(getToken);
		}

		const savedCollapsed = localStorage.getItem('arcade-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		initGuestWelcome();

		if (authStore.isAuthenticated) {
			await userSettings.load();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<div class="layout-container">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Arcade"
			homeRoute="/"
			onToggleTheme={handleToggleTheme}
			{isDark}
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
			primaryColor="#00ff88"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			manaHref="/mana"
			profileHref="/profile"
			themesHref="/themes"
			helpHref="/help"
			allAppsHref="/apps"
		/>

		<main class="main-content bg-background">
			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>

		<CommandBar
			bind:open={commandBarOpen}
			onClose={() => (commandBarOpen = false)}
			onSearch={handleCommandBarSearch}
			onSelect={handleCommandBarSelect}
			quickActions={commandBarQuickActions}
			placeholder="Spiel suchen..."
			emptyText="Keine Ergebnisse"
			searchingText="Suche..."
		/>
	</div>

	{#if gamesOnboarding.shouldShow}
		<MiniOnboardingModal store={gamesOnboarding} appName="Arcade" appEmoji="🎮" />
	{/if}

	<GuestWelcomeModal
		appId="arcade"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale={($locale || 'de') === 'de' ? 'de' : 'en'}
	/>

	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale={$locale || 'de'} loginHref="/login" />
	{/if}
	<SyncIndicator />
</AuthGate>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		position: relative;
		z-index: 0;
		padding-bottom: 100px;
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
