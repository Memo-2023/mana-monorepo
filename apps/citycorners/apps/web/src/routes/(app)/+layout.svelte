<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { _, locale } from 'svelte-i18n';
	import { PillNavigation, QuickInputBar } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem, QuickInputItem } from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { favoritesStore } from '$lib/stores/favorites.svelte';
	import { THEME_DEFINITIONS, DEFAULT_THEME_VARIANTS } from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { api } from '$lib/api';

	const appItems = getPillAppItems('citycorners');

	let { children } = $props();

	let isDark = $derived(theme.isDark);
	let showNav = $state(true);

	let visibleThemes = $derived<ThemeVariant[]>([...DEFAULT_THEME_VARIANTS]);

	let themeVariantItems = $derived<PillDropdownItem[]>(
		visibleThemes.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant]?.label || variant,
			icon: THEME_DEFINITIONS[variant]?.icon || '🎨',
			onClick: () => theme.setVariant(variant),
			active: (theme.variant || 'lume') === variant,
		}))
	);

	let currentThemeVariantLabel = $derived(
		THEME_DEFINITIONS[theme.variant]?.label || THEME_DEFINITIONS.lume?.label || 'Lume'
	);

	// Language
	let currentLocale = $derived($locale || 'de');
	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as 'de' | 'en');
	}
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	let userEmail = $derived(authStore.user?.email || $_('nav.settings'));

	let navItems = $derived<PillNavItem[]>([
		{ href: '/', label: $_('nav.explore'), icon: 'compass' },
		{ href: '/map', label: $_('nav.map'), icon: 'mappin' },
		{ href: '/add', label: $_('nav.add'), icon: 'plus' },
		{ href: '/favorites', label: $_('nav.favorites'), icon: 'heart' },
		{ href: '/settings', label: $_('nav.settings'), icon: 'settings' },
	]);

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

	let inputBarBottomOffset = $derived(showNav ? '70px' : '16px');

	interface SearchItem extends QuickInputItem {
		href?: string;
		isHistory?: boolean;
	}

	const SEARCH_HISTORY_KEY = 'citycorners-search-history';
	const MAX_HISTORY = 8;

	function getSearchHistory(): { query: string; name: string; category: string; id: string }[] {
		try {
			return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
		} catch {
			return [];
		}
	}

	function saveToHistory(loc: { id: string; name: string; category: string }) {
		const history = getSearchHistory().filter((h) => h.id !== loc.id);
		history.unshift({ query: loc.name, name: loc.name, category: loc.category, id: loc.id });
		localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
	}

	async function handleSearch(query: string): Promise<SearchItem[]> {
		if (!query.trim()) {
			// Show search history when empty
			const history = getSearchHistory();
			if (history.length === 0) return [];
			return history.map((h) => ({
				id: h.id,
				title: h.name,
				subtitle: $_(`category.${h.category}`),
				icon: 'clock' as const,
				href: `/locations/${h.id}`,
				isHistory: true,
			}));
		}

		try {
			// Use suggestions endpoint for prefix matching (faster)
			const res = await fetch(api(`/locations/suggestions?q=${encodeURIComponent(query)}`));
			if (!res.ok) return [];
			const data = await res.json();
			if (data.suggestions?.length > 0) {
				return data.suggestions.map((s: any) => ({
					id: s.id,
					title: s.name,
					subtitle: $_(`category.${s.category}`),
					icon: 'mappin' as const,
					href: `/locations/${s.id}`,
				}));
			}

			// Fallback to full search
			const fullRes = await fetch(api(`/locations/search?q=${encodeURIComponent(query)}`));
			if (!fullRes.ok) return [];
			const fullData = await fullRes.json();
			return fullData.locations.slice(0, 8).map((loc: any) => ({
				id: loc.id,
				title: loc.name,
				subtitle: $_(`category.${loc.category}`),
				icon: 'mappin' as const,
				href: `/locations/${loc.id}`,
			}));
		} catch {
			return [];
		}
	}

	function handleSelect(item: SearchItem) {
		if (item.href) {
			// Save to search history
			saveToHistory({
				id: item.id as string,
				name: item.title,
				category: item.subtitle || '',
			});
			goto(item.href);
		}
	}

	function handleNavToggle() {
		showNav = !showNav;
	}

	onMount(() => {
		const savedNav = localStorage.getItem('citycorners-nav-visible');
		if (savedNav !== null) showNav = savedNav !== 'false';
	});
</script>

<div class="layout-container">
	{#if showNav}
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="CityCorners"
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
			primaryColor="#2563eb"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			themesHref="/themes"
			helpHref="/help"
			profileHref="/profile"
		/>
	{/if}

	<!-- Quick Search Bar -->
	<QuickInputBar
		onSearch={handleSearch}
		onSelect={handleSelect}
		placeholder={$_('search.placeholder')}
		emptyText={$_('search.noResults')}
		searchingText={$_('search.searching')}
		locale={$locale || 'de'}
		appIcon="mappin"
		bottomOffset={inputBarBottomOffset}
		hasFabRight={true}
	/>

	<button
		class="pillnav-fab"
		onclick={handleNavToggle}
		title={showNav ? $_('nav.hideNav') : $_('nav.showNav')}
	>
		{#if !showNav}
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

	<main class="main-content bg-background">
		<div class="content-wrapper">
			{@render children()}
		</div>
	</main>
</div>

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

	.content-wrapper {
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
		padding: 1rem;
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

	@media (max-width: 768px) {
		.main-content {
			padding-bottom: calc(160px + env(safe-area-inset-bottom));
		}
	}

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
