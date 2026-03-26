<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { theme } from '$lib/stores/theme';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { PillNavigation, QuickInputBar, TagStrip } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem, QuickInputItem } from '@manacore/shared-ui';
	import { tagStore } from '$lib/stores/tags.svelte';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { filterHiddenNavItems } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { deckStore } from '$lib/stores/deckStore.svelte';
	import { manadeckOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';

	// App switcher items
	const appItems = getPillAppItems('manadeck');

	let { children } = $props();

	let isCollapsed = $state(false);

	// Get theme state
	let isDark = $derived(theme.isDark);

	// TagStrip visibility
	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	// Base navigation items for ManaDeck (Mana and Profile are in user dropdown)
	const baseNavItems: PillNavItem[] = [
		{ href: '/decks', label: 'Decks', icon: 'archive' },
		{ href: '/explore', label: 'Explore', icon: 'search' },
		{ href: '/progress', label: 'Progress', icon: 'chart' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
	];

	// Navigation items filtered by visibility settings (with fallback for guest mode)
	const navItems = $derived(
		filterHiddenNavItems('manadeck', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

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
	let userEmail = $derived(authStore.user?.email);

	// Navigation shortcuts (Ctrl+1-5)
	const navRoutes = navItems.map((item) => item.href);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		// Ctrl+Number navigation
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

		// Single key shortcuts (no modifiers)
		if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
			if (event.key.toLowerCase() === 't') {
				event.preventDefault();
				goto('/themes');
			}
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('manadeck-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		theme.toggleMode();
	}

	function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}

	async function handleSignOut() {
		await authStore.signOut();
		goto('/login');
	}

	// QuickInputBar handlers
	async function handleInputSearch(query: string): Promise<QuickInputItem[]> {
		const q = query.toLowerCase();
		return deckStore.decks
			.filter((d) => d.title.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q))
			.slice(0, 10)
			.map((deck) => ({
				id: deck.id,
				title: deck.title,
				subtitle: deck.description || undefined,
			}));
	}

	function handleInputSelect(item: QuickInputItem) {
		goto(`/decks/${item.id}`);
	}

	onMount(async () => {
		await authStore.initialize();

		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Load user settings and tags
		await userSettings.load();
		await tagStore.fetchTags();

		// Redirect to start page if on root and a custom start page is set
		const currentPath = window.location.pathname;
		if (currentPath === '/decks' && userSettings.startPage && userSettings.startPage !== '/decks') {
			goto(userSettings.startPage, { replaceState: true });
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('manadeck-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if authStore.loading}
	<div class="min-h-screen flex items-center justify-center bg-background">
		<div class="text-center">
			<div
				class="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
			></div>
			<p class="mt-4 text-muted-foreground">Loading...</p>
		</div>
	</div>
{:else if authStore.isAuthenticated}
	<div class="min-h-screen bg-background">
		<!-- Pill Navigation -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="ManaDeck"
			homeRoute="/decks"
			onLogout={handleSignOut}
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
			showLogout={true}
			primaryColor="#6366f1"
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

		<!-- Quick Input Bar -->
		<QuickInputBar
			onSearch={handleInputSearch}
			onSelect={handleInputSelect}
			placeholder="Deck suchen..."
			emptyText="Keine Decks gefunden"
			searchingText="Suche..."
			locale={$locale || 'de'}
			appIcon="search"
			bottomOffset="70px"
		/>

		<!-- Main content -->
		<main class="pb-24">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{@render children()}
			</div>
		</main>
	</div>

	<!-- Onboarding Modal -->
	{#if manadeckOnboarding.shouldShow}
		<MiniOnboardingModal store={manadeckOnboarding} appName="ManaDeck" appEmoji="🃏" />
	{/if}
{/if}
