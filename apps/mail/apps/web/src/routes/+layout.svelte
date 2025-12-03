<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { THEME_DEFINITIONS, type ThemeVariant } from '@manacore/shared-theme';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import { accountsStore } from '$lib/stores/accounts.svelte';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import '../app.css';

	let { children } = $props();

	let loading = $state(true);
	let isDark = $state(false);
	let themeMode = $state<'light' | 'dark' | 'system'>('system');
	let themeVariant = $state<ThemeVariant>('ocean');
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// App switcher items
	const appItems = getPillAppItems('mail');

	// Theme variant dropdown items
	let themeVariantItems = $derived<PillDropdownItem[]>(
		Object.entries(THEME_DEFINITIONS).map(([key, def]) => ({
			id: key,
			label: def.label,
			icon: def.icon,
			onClick: () => setThemeVariant(key as ThemeVariant),
			active: themeVariant === key,
		}))
	);

	let currentThemeVariantLabel = $derived(THEME_DEFINITIONS[themeVariant]?.label || 'Ocean');

	// User email for user dropdown
	let userEmail = $derived(authStore.user?.email || 'Menu');

	// Check if current route is an auth route
	let isAuthRoute = $derived(
		$page.url.pathname.startsWith('/login') ||
			$page.url.pathname.startsWith('/register') ||
			$page.url.pathname.startsWith('/forgot-password')
	);

	// Navigation items for Mail
	const navItems: PillNavItem[] = [
		{ href: '/', label: 'Inbox', icon: 'inbox' },
		{ href: '/sent', label: 'Sent', icon: 'send' },
		{ href: '/drafts', label: 'Drafts', icon: 'file' },
		{ href: '/starred', label: 'Starred', icon: 'star' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
	];

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('mail-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('mail-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		isDark = !isDark;
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', isDark);
			localStorage.setItem('mail-theme-dark', String(isDark));
		}
	}

	function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
		themeMode = mode;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('mail-theme-mode', mode);
		}
		updateTheme();
	}

	function setThemeVariant(variant: ThemeVariant) {
		themeVariant = variant;
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', variant);
			localStorage.setItem('mail-theme-variant', variant);
		}
	}

	function updateTheme() {
		if (typeof window === 'undefined') return;

		let shouldBeDark = false;
		if (themeMode === 'dark') {
			shouldBeDark = true;
		} else if (themeMode === 'system') {
			shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}

		isDark = shouldBeDark;
		document.documentElement.classList.toggle('dark', isDark);
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	onMount(async () => {
		// Initialize theme
		const savedMode = localStorage.getItem('mail-theme-mode') as 'light' | 'dark' | 'system' | null;
		if (savedMode) themeMode = savedMode;

		const savedVariant = localStorage.getItem('mail-theme-variant') as ThemeVariant | null;
		if (savedVariant && savedVariant in THEME_DEFINITIONS) {
			themeVariant = savedVariant;
			document.documentElement.setAttribute('data-theme', savedVariant);
		}

		updateTheme();

		// Initialize auth
		await authStore.initialize();

		// Load data if authenticated
		if (authStore.isAuthenticated) {
			await accountsStore.fetchAccounts();
			if (accountsStore.selectedAccountId) {
				await foldersStore.fetchFolders(accountsStore.selectedAccountId);
			}
		}

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('mail-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
		}

		const savedCollapsed = localStorage.getItem('mail-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
		}

		loading = false;
	});
</script>

{#if isAuthRoute}
	{@render children()}
{:else if loading}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
			></div>
			<p class="text-muted-foreground">Loading...</p>
		</div>
	</div>
{:else}
	<div class="layout-container">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Mail"
			homeRoute="/"
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
			{themeMode}
			onThemeModeChange={handleThemeModeChange}
			showLogout={authStore.isAuthenticated}
			onLogout={handleLogout}
			loginHref="/login"
			primaryColor="#6366f1"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			profileHref="/profile"
		/>

		<main
			class="main-content bg-background"
			class:sidebar-mode={isSidebarMode && !isCollapsed}
			class:floating-mode={!isSidebarMode && !isCollapsed}
		>
			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>
	</div>
{/if}

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
