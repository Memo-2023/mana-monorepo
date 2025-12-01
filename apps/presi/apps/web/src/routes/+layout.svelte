<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import '../app.css';

	// App switcher items
	const appItems = getPillAppItems('presi');

	let { children } = $props();

	let loading = $state(true);
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

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
	let userEmail = $derived(auth.user?.email);

	// Navigation items for Presi
	const navItems: PillNavItem[] = [
		{ href: '/', label: 'Decks', icon: 'document' },
		{ href: '/profile', label: 'Profil', icon: 'user' },
		{ href: '/mana', label: 'Mana', icon: 'sparkles' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
	];

	// Public routes that don't require auth
	const publicRoutes = ['/login', '/register', '/forgot-password'];

	// Routes where nav should be hidden
	const hideNavRoutes = ['/present/', '/shared/'];

	function shouldHideNav(pathname: string): boolean {
		return hideNavRoutes.some((route) => pathname.startsWith(route));
	}

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		sidebarModeStore.set(isSidebar);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('presi-nav-sidebar', String(isSidebar));
		}
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

	// Redirect to login if not authenticated
	$effect(() => {
		if (!auth.isLoading && !auth.isAuthenticated && !publicRoutes.includes($page.url.pathname)) {
			goto('/login');
		}
	});

	onMount(() => {
		// Initialize auth
		auth.init();

		// Initialize theme
		const cleanup = theme.initialize();

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('presi-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('presi-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		loading = false;

		return cleanup;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Presi - Presentation Creator</title>
</svelte:head>

{#if loading || auth.isLoading}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
			></div>
			<p class="text-muted-foreground">Laden...</p>
		</div>
	</div>
{:else if auth.isAuthenticated || publicRoutes.includes($page.url.pathname)}
	{#if auth.isAuthenticated && !publicRoutes.includes($page.url.pathname) && !shouldHideNav($page.url.pathname)}
		<!-- Navigation Layout -->
		<div class="layout-container">
			<!-- Floating/Sidebar Pill Navigation -->
			<PillNavigation
				items={navItems}
				currentPath={$page.url.pathname}
				appName="Presi"
				homeRoute="/"
				onToggleTheme={handleToggleTheme}
				isDark={theme.isDark}
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
				showLogout={true}
				onLogout={handleLogout}
				primaryColor="#64748b"
				showAppSwitcher={true}
				{appItems}
				{userEmail}
				settingsHref="/settings"
				manaHref="/mana"
				profileHref="/profile"
			/>

			<!-- Main Content with dynamic padding based on nav mode -->
			<main
				class="main-content"
				class:sidebar-mode={isSidebarMode && !isCollapsed}
				class:floating-mode={!isSidebarMode && !isCollapsed}
			>
				<div class="content-wrapper">
					{@render children()}
				</div>
			</main>
		</div>
	{:else}
		<!-- Public/Presentation routes without nav -->
		<main class="min-h-screen bg-background">
			{@render children()}
		</main>
	{/if}
{/if}

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		transition: all 300ms ease;
	}

	/* Floating nav mode - add top padding for fixed nav */
	.main-content.floating-mode {
		padding-top: 100px;
	}

	/* Sidebar mode - add left padding for sidebar nav */
	.main-content.sidebar-mode {
		padding-left: 180px;
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
