<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { authStore } from '$lib/stores/authStore.svelte';
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
	const appItems = getPillAppItems('manadeck');

	let { children } = $props();

	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Get theme state
	let isDark = $derived(theme.isDark);

	// Navigation items for ManaDeck
	const navItems: PillNavItem[] = [
		{ href: '/decks', label: 'Decks', icon: 'archive' },
		{ href: '/explore', label: 'Explore', icon: 'search' },
		{ href: '/progress', label: 'Progress', icon: 'chart' },
		{ href: '/mana', label: 'Mana', icon: 'mana' },
		{ href: '/profile', label: 'Profile', icon: 'user' },
	];

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

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		sidebarModeStore.set(isSidebar);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('manadeck-nav-sidebar', String(isSidebar));
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

	onMount(async () => {
		await authStore.initialize();

		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('manadeck-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
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
			primaryColor="#6366f1"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			manaHref="/mana"
			profileHref="/profile"
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
