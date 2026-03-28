<script lang="ts">
	import { setContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, QuickInputBar, TagStrip } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem, QuickInputItem } from '@manacore/shared-ui';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { theme } from '$lib/stores/theme';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { decksStore } from '$lib/stores/decks.svelte';
	import { presiOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { presiStore } from '$lib/data/local-store';

	// App switcher items
	const appItems = getPillAppItems('presi');

	// Shared tag store (local-first)
	const allTags = useAllSharedTags();
	setContext('tags', allTags);

	let { children } = $props();

	let isCollapsed = $state(false);

	// Guest welcome modal state
	let showGuestWelcome = $state(false);

	// User email for user dropdown — empty string for guests so PillNav shows login button
	let userEmail = $derived(auth.isAuthenticated ? auth.user?.email || 'Menü' : '');

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

	// TagStrip visibility
	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	// Navigation items for Presi
	const navItems: PillNavItem[] = [
		{ href: '/', label: 'Decks', icon: 'document' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
	];

	// Routes where nav should be hidden (present mode, shared view)
	const hideNavRoutes = ['/present/', '/shared/'];

	function shouldHideNav(pathname: string): boolean {
		return hideNavRoutes.some((route) => pathname.startsWith(route));
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('presi-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		theme.toggleMode();
	}

	function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}

	function handleLogout() {
		auth.logout();
		goto('/login');
	}

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		// Single key shortcuts (no modifiers)
		if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
			if (event.key.toLowerCase() === 't') {
				event.preventDefault();
				goto('/themes');
			}
		}
	}

	// QuickInputBar handlers
	async function handleInputSearch(query: string): Promise<QuickInputItem[]> {
		const q = query.toLowerCase();
		return decksStore.decks
			.filter((d) => d.title.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q))
			.slice(0, 10)
			.map((deck) => ({
				id: deck.id,
				title: deck.title,
				subtitle: deck.description || undefined,
			}));
	}

	function handleInputSelect(item: QuickInputItem) {
		goto(`/deck/${item.id}`);
	}

	async function handleAuthReady() {
		// Initialize local-first databases (opens IndexedDB, seeds guest data)
		await Promise.all([presiStore.initialize(), tagLocalStore.initialize()]);

		// If authenticated, start syncing to server
		if (auth.isAuthenticated) {
			const getToken = () => auth.getValidToken();
			presiStore.startSync(getToken);
			tagMutations.startSync(getToken);
		}

		// Load decks from IndexedDB (guest seed or synced data)
		await decksStore.loadDecks();

		// Show guest welcome modal on first visit
		if (!auth.isAuthenticated && shouldShowGuestWelcome('presi')) {
			showGuestWelcome = true;
		}

		if (auth.isAuthenticated) {
			// Load user settings (requires auth)
			await userSettings.load();
		}

		// Redirect to start page if on root and a custom start page is set
		const currentPath = window.location.pathname;
		if (currentPath === '/' && userSettings.startPage && userSettings.startPage !== '/') {
			goto(userSettings.startPage, { replaceState: true });
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('presi-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if shouldHideNav($page.url.pathname)}
	<!-- Present mode and shared view - no nav -->
	<main class="min-h-screen bg-background">
		{@render children()}
	</main>
{:else}
	<AuthGate authStore={auth} {goto} allowGuest={true} onReady={handleAuthReady}>
		<!-- Navigation Layout -->
		<div class="layout-container">
			<!-- Floating Pill Navigation -->
			<PillNavigation
				items={navItems}
				currentPath={$page.url.pathname}
				appName="Presi"
				homeRoute="/"
				onToggleTheme={handleToggleTheme}
				isDark={theme.isDark}
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
				showLogout={auth.isAuthenticated}
				onLogout={handleLogout}
				loginHref="/login"
				primaryColor="#64748b"
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

			<!-- TagStrip (above PillNav, toggled via Tags pill) -->
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

			<!-- Quick Input Bar -->
			<QuickInputBar
				onSearch={handleInputSearch}
				onSelect={handleInputSelect}
				placeholder="Präsentation suchen..."
				emptyText="Keine Decks gefunden"
				searchingText="Suche..."
				locale={$locale || 'de'}
				appIcon="search"
				bottomOffset="70px"
			/>

			<!-- Main Content -->
			<main class="main-content">
				<div class="content-wrapper">
					{@render children()}
				</div>
			</main>
		</div>

		<!-- Onboarding Modal -->
		{#if presiOnboarding.shouldShow}
			<MiniOnboardingModal store={presiOnboarding} appName="Presi" appEmoji="📊" />
		{/if}

		<!-- Guest Welcome Modal -->
		<GuestWelcomeModal
			appId="presi"
			visible={showGuestWelcome}
			onClose={() => (showGuestWelcome = false)}
			onLogin={() => goto('/login')}
			onRegister={() => goto('/register')}
			locale={($locale || 'de') === 'de' ? 'de' : 'en'}
		/>

		{#if auth.isAuthenticated}
			<SessionExpiredBanner locale={$locale || 'de'} loginHref="/login" />
		{/if}
	</AuthGate>
{/if}

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		padding-bottom: 100px;
	}

	.content-wrapper {
		max-width: 80rem;
		margin-left: auto;
		margin-right: auto;
		padding: 2rem 1rem;
	}

	@media (min-width: 640px) {
		.content-wrapper {
			padding-left: 1.5rem;
			padding-right: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.content-wrapper {
			padding-left: 2rem;
			padding-right: 2rem;
		}
	}
</style>
