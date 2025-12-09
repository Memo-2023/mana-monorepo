<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { labelsStore } from '$lib/stores/labels.svelte';
	import { theme } from '$lib/stores/theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';

	// App switcher items
	const appItems = getPillAppItems('todo');

	let { children } = $props();

	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Use theme store's isDark directly
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
		locale.set(newLocale);
	}
	let languageItems = $derived(
		getLanguageDropdownItems(['de', 'en'], currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// User email for user dropdown
	let userEmail = $derived(authStore.user?.email || 'Menü');

	// Navigation items for Todo
	const navItems: PillNavItem[] = [
		{ href: '/', label: 'Aufgaben', icon: 'list' },
		{ href: '/kanban', label: 'Kanban', icon: 'columns' },
		{ href: '/statistics', label: 'Statistiken', icon: 'chart' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{ href: '/feedback', label: 'Feedback', icon: 'chat' },
	];

	// Navigation shortcuts (Ctrl+1-6)
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
			localStorage.setItem('todo-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('todo-nav-collapsed', String(collapsed));
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
		projectsStore.clear();
		labelsStore.clear();
		goto('/login');
	}

	onMount(async () => {
		// Redirect to login if not authenticated
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Load data
		await Promise.all([
			projectsStore.fetchProjects(),
			labelsStore.fetchLabels(),
			userSettings.load(),
		]);

		// Redirect to start page if on root and a custom start page is set
		const currentPath = window.location.pathname;
		if (currentPath === '/' && userSettings.startPage && userSettings.startPage !== '/') {
			goto(userSettings.startPage, { replaceState: true });
		}

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('todo-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('todo-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		// Register Service Worker for PWA
		if ('serviceWorker' in navigator) {
			try {
				const registration = await navigator.serviceWorker.register('/sw.js', {
					scope: '/',
				});
				console.log('Todo PWA: Service Worker registered', registration.scope);

				// Check for updates
				registration.addEventListener('updatefound', () => {
					const newWorker = registration.installing;
					if (newWorker) {
						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
								// New version available
								console.log('Todo PWA: New version available');
							}
						});
					}
				});
			} catch (error) {
				console.error('Todo PWA: Service Worker registration failed', error);
			}
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="layout-container">
	<PillNavigation
		items={navItems}
		currentPath={$page.url.pathname}
		appName="Todo"
		homeRoute="/"
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
		showLogout={authStore.isAuthenticated}
		onLogout={handleLogout}
		loginHref="/login"
		primaryColor="#8b5cf6"
		showAppSwitcher={true}
		{appItems}
		{userEmail}
		settingsHref="/settings"
		manaHref="/mana"
		profileHref="/profile"
		allAppsHref="/apps"
	/>

	<main
		class="main-content bg-background"
		class:sidebar-mode={isSidebarMode && !isCollapsed}
		class:floating-mode={!isSidebarMode && !isCollapsed}
	>
		<div class="content-wrapper" class:full-width={$page.url.pathname === '/kanban'}>
			{@render children()}
		</div>
	</main>
</div>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		transition: all 300ms ease;
		position: relative;
		z-index: 0;
	}

	.main-content.floating-mode {
		padding-top: 70px;
	}

	.main-content.sidebar-mode {
		padding-left: 180px;
	}

	.content-wrapper {
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
		padding: 1rem;
		position: relative;
		z-index: 0;
	}

	.content-wrapper.full-width {
		max-width: none;
		padding-left: 0;
		padding-right: 0;
	}

	@media (min-width: 640px) {
		.content-wrapper {
			padding: 1.5rem;
		}
		.content-wrapper.full-width {
			padding-left: 0;
			padding-right: 0;
		}
	}

	@media (min-width: 1024px) {
		.content-wrapper {
			padding: 2rem;
		}
		.content-wrapper.full-width {
			padding-left: 0;
			padding-right: 0;
		}
	}
</style>
