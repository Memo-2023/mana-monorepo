<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { getPillAppItems } from '@manacore/shared-branding';

	let { children }: { children: Snippet } = $props();

	// App switcher items
	const appItems = getPillAppItems('manacore');

	let loading = $state(true);
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Get theme state
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
	let userEmail = $derived(authStore.user?.email);

	// Navigation items for ManaCore
	const navItems: PillNavItem[] = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'home' },
		{ href: '/credits', label: 'Credits', icon: 'creditCard' },
		{ href: '/feedback', label: 'Feedback', icon: 'chat' },
		{ href: '/profile', label: 'Profil', icon: 'user' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
	];

	// Navigation shortcuts (Ctrl+1-5)
	const navRoutes = navItems.map((item) => item.href);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
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
			localStorage.setItem('manacore-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('manacore-nav-collapsed', String(collapsed));
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

	$effect(() => {
		// Redirect to login if not authenticated (after initialization)
		if (authStore.initialized && !authStore.isAuthenticated) {
			goto('/login');
		}
	});

	onMount(async () => {
		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('manacore-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('manacore-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		// Load user settings from server
		if (authStore.isAuthenticated) {
			await userSettings.load();

			// Redirect to start page if on /dashboard and a custom start page is set
			const currentPath = window.location.pathname;
			if (
				currentPath === '/dashboard' &&
				userSettings.startPage &&
				userSettings.startPage !== '/dashboard'
			) {
				goto(userSettings.startPage, { replaceState: true });
			}
		}

		loading = false;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if loading || authStore.loading}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"
			></div>
			<p class="text-muted-foreground">Loading...</p>
		</div>
	</div>
{:else if authStore.isAuthenticated}
	<div class="min-h-screen bg-background">
		<!-- Pill Navigation -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="ManaCore"
			homeRoute="/dashboard"
			onLogout={handleSignOut}
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
			showLogout={true}
			primaryColor="#6366f1"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			manaHref="/mana"
			profileHref="/profile"
			allAppsHref="/apps"
		/>

		<!-- Main content with dynamic padding -->
		<main
			class="transition-all duration-300 {isCollapsed
				? ''
				: isSidebarMode
					? 'pl-[180px]'
					: 'pt-20'}"
		>
			<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{@render children()}
			</div>
		</main>
	</div>
{/if}
