<script lang="ts">
	import { setContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, CommandBar, TagStrip } from '@manacore/shared-ui';
	import { SyncIndicator } from '@manacore/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		CommandBarItem,
		QuickAction,
	} from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { useAllCalculations, useAllSavedFormulas } from '$lib/data/queries';
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
	import { calcOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { calcStore } from '$lib/data/local-store';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';

	const allCalculations = useAllCalculations();
	const allSavedFormulas = useAllSavedFormulas();
	const allTags = useAllSharedTags();

	setContext('calculations', allCalculations);
	setContext('savedFormulas', allSavedFormulas);
	setContext('tags', allTags);

	let showGuestWelcome = $state(false);

	function initGuestWelcome() {
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('calc')) {
			showGuestWelcome = true;
		}
	}

	const appItems = getPillAppItems('calc');

	let { children } = $props();

	let commandBarOpen = $state(false);

	const commandBarQuickActions: QuickAction[] = [
		{
			id: 'standard',
			label: 'Standard-Rechner',
			icon: 'calculator',
			href: '/standard',
			shortcut: '1',
		},
		{
			id: 'scientific',
			label: 'Wissenschaftlich',
			icon: 'flask',
			href: '/scientific',
			shortcut: '2',
		},
		{ id: 'programmer', label: 'Programmierer', icon: 'code', href: '/programmer', shortcut: '3' },
		{
			id: 'converter',
			label: 'Einheiten-Rechner',
			icon: 'ruler',
			href: '/converter',
			shortcut: '4',
		},
		{ id: 'currency', label: 'Währungsrechner', icon: 'coins', href: '/currency' },
		{ id: 'finance', label: 'Finanzrechner', icon: 'piggy-bank', href: '/finance' },
		{ id: 'settings', label: 'Einstellungen', icon: 'settings', href: '/settings' },
	];

	async function handleCommandBarSearch(query: string): Promise<CommandBarItem[]> {
		if (!query.trim()) return [];
		const queryLower = query.toLowerCase();
		const results: CommandBarItem[] = [];

		const matchingCalcs = allCalculations.value
			.filter((c) => c.expression.toLowerCase().includes(queryLower))
			.slice(0, 5)
			.map((c) => ({
				id: `calc-${c.id}`,
				title: c.expression,
				subtitle: `= ${c.result}`,
			}));
		results.push(...matchingCalcs);

		const matchingFormulas = allSavedFormulas.value
			.filter(
				(f) =>
					f.name.toLowerCase().includes(queryLower) ||
					f.expression.toLowerCase().includes(queryLower)
			)
			.slice(0, 5)
			.map((f) => ({
				id: `formula-${f.id}`,
				title: f.name,
				subtitle: f.expression,
			}));
		results.push(...matchingFormulas);

		return results.slice(0, 10);
	}

	function handleCommandBarSelect(item: CommandBarItem) {
		if (item.id.startsWith('calc-') || item.id.startsWith('formula-')) {
			goto('/standard');
		}
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

	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	const baseNavItems: PillNavItem[] = [
		{ href: '/', label: 'Übersicht', icon: 'home' },
		{ href: '/standard', label: 'Standard', icon: 'calculator' },
		{ href: '/scientific', label: 'Wissenschaftlich', icon: 'flask' },
		{ href: '/programmer', label: 'Programmierer', icon: 'code' },
		{ href: '/converter', label: 'Einheiten', icon: 'ruler' },
		{ href: '/currency', label: 'Währung', icon: 'coins' },
		{ href: '/finance', label: 'Finanzen', icon: 'piggy-bank' },
		{ href: '/date', label: 'Datum', icon: 'calendar' },
		{ href: '/percentage', label: 'Prozent', icon: 'percent' },
		{ href: '/skins', label: 'Skins', icon: 'palette' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
	];

	const navItems = $derived(
		filterHiddenNavItems('calc', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	const navRoutes = baseNavItems.map((item) => item.href);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;

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

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('calc-nav-collapsed', String(collapsed));
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
		await Promise.all([calcStore.initialize(), tagLocalStore.initialize()]);

		if (authStore.isAuthenticated) {
			const getToken = () => authStore.getValidToken();
			calcStore.startSync(getToken);
			tagMutations.startSync(getToken);
		}

		const savedCollapsed = localStorage.getItem('calc-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		initGuestWelcome();

		if (authStore.isAuthenticated) {
			await userSettings.load();
		}

		const currentPath = window.location.pathname;
		if (currentPath === '/' && userSettings.startPage && userSettings.startPage !== '/') {
			goto(userSettings.startPage, { replaceState: true });
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<div class="layout-container">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Calc"
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
			primaryColor="#ec4899"
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

		{#if isTagStripVisible}
			<TagStrip
				tags={allTags.value.map((t) => ({
					id: t.id,
					name: t.name,
					color: t.color || '#3b82f6',
				}))}
				selectedIds={[]}
				onToggle={() => {}}
				onClear={() => {}}
				managementHref="/tags"
			/>
		{/if}

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
			placeholder="Schnellzugriff..."
			emptyText="Keine Ergebnisse"
			searchingText="Suche..."
		/>
	</div>

	{#if calcOnboarding.shouldShow}
		<MiniOnboardingModal store={calcOnboarding} appName="Calc" appEmoji="🧮" />
	{/if}

	<GuestWelcomeModal
		appId="calc"
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
