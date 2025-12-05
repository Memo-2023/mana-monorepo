<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale, _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';

	// App switcher items
	const appItems = getPillAppItems('moodlit');

	let { children } = $props();

	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Get theme state
	let isDark = $derived(theme.isDark);

	// Navigation items for Moodlit
	const navItems: PillNavItem[] = [
		{ href: '/', label: 'Moods', icon: 'palette' },
		{ href: '/sequences', label: 'Sequences', icon: 'layers' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
	];

	// Theme variant dropdown items
	let themeVariantItems = $derived<PillDropdownItem[]>([
		...theme.variants.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant]?.label || variant,
			icon: THEME_DEFINITIONS[variant]?.icon || 'circle',
			onClick: () => theme.setVariant(variant),
			active: theme.variant === variant,
		})),
	]);

	// Current theme variant label
	let currentThemeVariantLabel = $derived(THEME_DEFINITIONS[theme.variant]?.label || theme.variant);

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

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		sidebarModeStore.set(isSidebar);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('moodlit-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('moodlit-nav-collapsed', String(collapsed));
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

	onMount(async () => {
		await authStore.initialize();

		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('moodlit-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('moodlit-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}
	});
</script>

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
			appName="Moodlit"
			homeRoute="/"
			onLogout={handleSignOut}
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
			showLogout={true}
			primaryColor="#8b5cf6"
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
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{@render children()}
			</div>
		</main>
	</div>
{/if}
