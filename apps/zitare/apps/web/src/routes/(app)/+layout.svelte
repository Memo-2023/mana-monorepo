<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale, _ } from 'svelte-i18n';
	import {
		PillNavigation,
		QuickInputBar,
		ImmersiveModeToggle,
		TagStrip,
	} from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem, QuickInputItem } from '@manacore/shared-ui';
	import { tagStore } from '$lib/stores/tags.svelte';

	// Extend QuickInputItem for zitare-specific search results with href navigation
	interface ZitareSearchItem extends QuickInputItem {
		href?: string;
	}
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { favoritesStore } from '$lib/stores/favorites.svelte';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import { listsStore } from '$lib/stores/lists.svelte';
	import { zitareSettings } from '$lib/stores/settings.svelte';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		createUserSettingsStore,
		filterHiddenNavItems,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { QUOTES, type Quote } from '@zitare/content';
	import { zitareStore } from '$lib/data/local-store';

	let showGuestWelcome = $state(false);

	// App switcher items
	const appItems = getPillAppItems('zitare');

	// User settings for nav visibility
	const userSettings = createUserSettingsStore({
		appId: 'zitare',
		authUrl: import.meta.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001',
		getAccessToken: () => authStore.getAccessToken(),
	});

	let { children } = $props();

	// Use theme store's isDark directly
	let isDark = $derived(theme.isDark);

	// Check if on home page for toolbar visibility
	let isHomePage = $derived($page.url.pathname === '/');

	// Bottom offset for QuickInputBar
	let inputBarBottomOffset = $derived(zitareSettings.pillNavCollapsed ? '16px' : '70px');

	// Visible themes in PillNav
	let visibleThemes = $derived<ThemeVariant[]>([...DEFAULT_THEME_VARIANTS]);

	// Theme variant dropdown items
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
			label: $_('nav.allThemes'),
			icon: 'palette',
			onClick: () => goto('/themes'),
			active: false,
		},
	]);

	// Current theme variant label
	let currentThemeVariantLabel = $derived(
		THEME_DEFINITIONS[theme.variant]?.label || THEME_DEFINITIONS.lume?.label || 'Lume'
	);

	// Language selector items
	let currentLocale = $derived($locale || 'de');
	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as 'de' | 'en');
	}
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// User email for user dropdown
	let userEmail = $derived(
		authStore.isAuthenticated ? authStore.user?.email || $_('nav.menu') : ''
	);

	// TagStrip visibility
	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	// Base navigation items for Zitare
	let baseNavItems = $derived<PillNavItem[]>([
		{ href: '/', label: $_('nav.today'), icon: 'sun' },
		{ href: '/categories', label: $_('nav.categories'), icon: 'grid' },
		{ href: '/favorites', label: $_('nav.favorites'), icon: 'heart' },
		{ href: '/lists', label: $_('nav.lists'), icon: 'list' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
	]);

	// Filter hidden nav items
	let navItems = $derived(
		filterHiddenNavItems('zitare', baseNavItems, userSettings.nav.hiddenNavItems || {})
	);

	// Navigation routes for keyboard shortcuts
	const navRoutes = ['/', '/categories', '/favorites', '/lists'];

	function handleToggleTheme() {
		theme.toggleMode();
	}

	function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}

	async function handleLogout() {
		await authStore.signOut();
		favoritesStore.clear();
		goto('/login');
	}

	// QuickInputBar search handler
	async function handleSearch(query: string): Promise<ZitareSearchItem[]> {
		if (!query.trim()) return [];

		const results = quotesStore.search(query);
		return results.slice(0, 10).map((quote: Quote) => ({
			id: quote.id,
			title: quotesStore.getText(quote).substring(0, 60) + '...',
			subtitle: quote.author,
			icon: 'quote' as const,
			href: `/quote/${quote.id}`,
		}));
	}

	// QuickInputBar select handler
	function handleSelect(item: ZitareSearchItem) {
		if (item.href) {
			goto(item.href);
		}
	}

	// QuickInputBar create preview
	function handleParseCreate(query: string) {
		if (!query.trim()) return null;
		return {
			title: `"${query}" ${$_('search.createList')}`,
			subtitle: $_('search.createListDescription'),
		};
	}

	// QuickInputBar create handler
	async function handleCreate(query: string) {
		if (!query.trim() || !authStore.isAuthenticated) return;

		// Create a new list with the query as name
		await listsStore.createList(query, '');
		goto('/lists');
	}

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;

		// Don't interfere with text inputs
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		// Ctrl+1, Ctrl+2, etc. for navigation
		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const num = parseInt(event.key);
			if (num >= 1 && num <= navRoutes.length) {
				event.preventDefault();
				const route = navRoutes[num - 1];
				goto(route);
			}
		}

		// F key - Toggle Immersive Mode (no modifiers)
		if (
			(event.key === 'f' || event.key === 'F') &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.shiftKey &&
			!event.altKey
		) {
			event.preventDefault();
			zitareSettings.toggleImmersiveMode();
		}

		// N key - New random quote (on home page)
		if (
			isHomePage &&
			(event.key === 'n' || event.key === 'N') &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.shiftKey &&
			!event.altKey
		) {
			event.preventDefault();
			quotesStore.loadRandomQuote();
		}
	}

	// Toggle PillNav visibility (called by FAB)
	function handlePillNavToggle() {
		zitareSettings.togglePillNav();
	}

	async function handleAuthReady() {
		// Initialize local-first database
		await zitareStore.initialize();

		// Initialize settings
		zitareSettings.initialize();

		// Load favorites and lists from IndexedDB (works for guests and auth)
		await favoritesStore.load();
		await listsStore.loadLists();

		if (authStore.isAuthenticated) {
			zitareStore.startSync(() => authStore.getValidToken());
			userSettings.load();
			tagStore.fetchTags();
		} else if (shouldShowGuestWelcome('zitare')) {
			showGuestWelcome = true;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<div class="layout-container">
		{#if !zitareSettings.immersiveModeEnabled}
			<!-- PillNav (shown/hidden via FAB) -->
			{#if !zitareSettings.pillNavCollapsed}
				<PillNavigation
					items={navItems}
					currentPath={$page.url.pathname}
					appName="Zitare"
					homeRoute="/"
					onToggleTheme={handleToggleTheme}
					{isDark}
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
					primaryColor="#8b5cf6"
					showAppSwitcher={true}
					{appItems}
					{userEmail}
					settingsHref="/settings"
					spiralHref="/spiral"
					themesHref="/themes"
					manaHref="/mana"
					profileHref="/profile"
					helpHref="/help"
					allAppsHref="/apps"
				/>
			{/if}

			<!-- TagStrip (above PillNav, toggled via Tags pill) -->
			{#if isTagStripVisible}
				<TagStrip
					tags={tagStore.tags.map((t) => ({
						id: t.id,
						name: t.name,
						color: t.color || '#3b82f6',
					}))}
					selectedIds={[]}
					onToggle={() => {}}
					onClear={() => {}}
					managementHref="/tags"
					loading={tagStore.loading}
				/>
			{/if}

			<!-- Global Quick Input Bar -->
			<QuickInputBar
				onSearch={handleSearch}
				onSelect={handleSelect}
				onCreate={handleCreate}
				onParseCreate={handleParseCreate}
				placeholder={$_('search.placeholder')}
				emptyText={$_('search.noResults')}
				searchingText={$_('search.searching')}
				createText={$_('search.create')}
				deferSearch={true}
				locale={$locale || 'de'}
				appIcon="quote"
				bottomOffset={inputBarBottomOffset}
				hasFabRight={true}
			/>

			<!-- FAB to toggle PillNav visibility -->
			<button
				class="pillnav-fab"
				onclick={handlePillNavToggle}
				title={zitareSettings.pillNavCollapsed ? $_('nav.showNav') : $_('nav.hideNav')}
			>
				{#if zitareSettings.pillNavCollapsed}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="fab-icon">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				{:else}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="fab-icon">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				{/if}
			</button>
		{/if}

		<!-- Immersive Mode Toggle (always visible) -->
		<ImmersiveModeToggle
			isImmersive={zitareSettings.immersiveModeEnabled}
			onToggle={() => zitareSettings.toggleImmersiveMode()}
		/>

		<!-- Main content -->
		<main class="main-content bg-background" class:immersive={zitareSettings.immersiveModeEnabled}>
			<div class="content-wrapper" class:immersive={zitareSettings.immersiveModeEnabled}>
				{@render children()}
			</div>
		</main>
	</div>
	<GuestWelcomeModal
		appId="zitare"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale={($locale || 'de') === 'de' ? 'de' : 'en'}
	/>

	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale={$locale || 'de'} loginHref="/login" />
	{/if}
</AuthGate>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		position: relative;
	}

	.main-content {
		flex: 1;
		transition: all 300ms ease;
		padding-bottom: calc(150px + env(safe-area-inset-bottom));
	}

	.main-content.immersive {
		padding: 0 !important;
	}

	.content-wrapper {
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
		padding: 1rem;
	}

	.content-wrapper.immersive {
		max-width: 100%;
		padding: 0;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media (min-width: 640px) {
		.content-wrapper:not(.immersive) {
			padding: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.content-wrapper:not(.immersive) {
			padding: 2rem;
		}
	}

	@media (max-width: 768px) {
		.main-content:not(.immersive) {
			padding-bottom: calc(160px + env(safe-area-inset-bottom));
		}
	}

	/* FAB to toggle PillNav */
	.pillnav-fab {
		position: fixed;
		bottom: calc(16px + env(safe-area-inset-bottom, 0px));
		right: 1rem;
		width: 54px;
		height: 54px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		transition: all 0.2s ease;
	}

	.pillnav-fab:hover {
		transform: scale(1.05);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	}

	.pillnav-fab:active {
		transform: scale(0.95);
	}

	:global(.dark) .pillnav-fab {
		background: rgba(30, 30, 30, 0.9);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.fab-icon {
		width: 24px;
		height: 24px;
		color: var(--color-foreground);
	}
</style>
