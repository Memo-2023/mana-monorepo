<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, SyncIndicator } from '@mana/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		SpotlightAction,
		ContentSearcher,
	} from '@mana/shared-ui';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { games } from '$lib/data/games';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@mana/shared-theme';
	import type { ThemeVariant } from '@mana/shared-theme';
	import { filterHiddenNavItems } from '@mana/shared-theme';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@mana/shared-i18n';
	import { getPillAppItems } from '@mana/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@mana/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@mana/shared-auth-ui';
	import { gamesOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@mana/shared-ui';
	import { gamesStore } from '$lib/data/local-store';
	import { tagLocalStore, tagMutations, useAllTags as useAllSharedTags } from '@mana/shared-stores';

	const allTags = useAllSharedTags();

	let showGuestWelcome = $state(false);

	function initGuestWelcome() {
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('arcade')) {
			showGuestWelcome = true;
		}
	}

	let appItems = $derived(getPillAppItems('arcade', undefined, undefined, authStore.user?.tier));

	let { children } = $props();

	// Cmd+K spotlight — nav shortcuts + game search. The PillNavigation
	// hosts GlobalSpotlight internally, wired via spotlightActions +
	// contentSearcher below.
	const spotlightActions: SpotlightAction[] = [
		{
			id: 'home',
			label: 'Alle Spiele',
			icon: 'gamepad-2',
			shortcut: '1',
			category: 'Navigation',
			onExecute: () => goto('/'),
		},
		{
			id: 'new-game',
			label: 'Spiel erstellen',
			icon: 'sparkles',
			shortcut: '2',
			category: 'Erstellen',
			onExecute: () => goto('/create'),
		},
		{
			id: 'community',
			label: 'Community',
			icon: 'users',
			shortcut: '3',
			category: 'Navigation',
			onExecute: () => goto('/community'),
		},
		{
			id: 'stats',
			label: 'Statistiken',
			icon: 'bar-chart-3',
			shortcut: '4',
			category: 'Navigation',
			onExecute: () => goto('/stats'),
		},
		{
			id: 'settings',
			label: 'Einstellungen',
			icon: 'settings',
			category: 'Navigation',
			onExecute: () => goto('/settings'),
		},
	];

	const contentSearcher: ContentSearcher = async (query) => {
		const q = query.trim().toLowerCase();
		if (!q) return [];

		const hits = games
			.filter(
				(g) => g.title.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q))
			)
			.slice(0, 10);

		if (hits.length === 0) return [];

		return [
			{
				appId: 'arcade',
				appName: 'Spiele',
				results: hits.map((g, i) => ({
					id: `game-${g.slug}`,
					type: 'game',
					appId: 'arcade',
					title: g.title,
					subtitle: g.tags.join(', '),
					href: `/play/${g.slug}`,
					score: hits.length - i,
				})),
			},
		];
	};

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
			{spotlightActions}
			{contentSearcher}
			spotlightPlaceholder="Spiele oder Aktionen suchen..."
		/>

		<main class="main-content bg-background">
			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>
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
