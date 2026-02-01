<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { locale } from 'svelte-i18n';
	import type { Snippet } from 'svelte';
	import { CircleNotch, WarningCircle, ArrowsClockwise } from '@manacore/shared-icons';
	import { theme } from '$lib/stores/theme';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';

	// App switcher items
	const appItems = getPillAppItems('matrix');

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
	let loading = $state(true);
	let initError = $state<string | null>(null);

	// Navigation state
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Theme state
	let isDark = $derived(theme.isDark);

	// Theme variant dropdown items (default themes only for now)
	let themeVariantItems = $derived<PillDropdownItem[]>([
		...DEFAULT_THEME_VARIANTS.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant].label,
			icon: THEME_DEFINITIONS[variant].icon,
			onClick: () => theme.setVariant(variant),
			active: theme.variant === variant,
		})),
	]);

	let currentThemeVariantLabel = $derived(THEME_DEFINITIONS[theme.variant]?.label || 'Theme');

	// Language selector
	let currentLocale = $derived($locale || 'de');
	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as any);
	}
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// Navigation items for Matrix
	const navItems: PillNavItem[] = [
		{ href: '/chat', label: 'Chat', icon: 'home' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
	];

	// User info from Matrix
	let userEmail = $derived(matrixStore.userId || undefined);

	// Keyboard shortcuts
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
			localStorage.setItem('matrix-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('matrix-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		theme.toggleMode();
	}

	function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}

	function handleLogout() {
		matrixStore.logout();
		goto('/login');
	}

	onMount(async () => {
		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('matrix-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('matrix-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		// Check if already initialized
		if (matrixStore.isReady) {
			loading = false;
			return;
		}

		// Try to initialize Matrix
		const success = await matrixStore.initialize();

		if (!success) {
			// Check if no credentials (should redirect to login)
			if (!matrixStore.hasStoredCredentials()) {
				goto('/login');
				return;
			}
			// Has credentials but failed to init
			initError = matrixStore.error || 'Failed to connect to Matrix server';
		}

		loading = false;
	});

	onDestroy(() => {
		// Don't destroy on navigation within app routes
	});

	async function retry() {
		loading = true;
		initError = null;
		const success = await matrixStore.initialize();
		if (!success) {
			initError = matrixStore.error || 'Failed to connect';
		}
		loading = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if loading}
	<!-- Loading State -->
	<div class="flex h-screen flex-col items-center justify-center gap-4 bg-background">
		<CircleNotch class="h-12 w-12 animate-spin text-primary" />
		<div class="text-center">
			<p class="font-medium text-foreground">Connecting to Matrix...</p>
			<p class="text-sm text-muted-foreground">
				{#if matrixStore.syncState === 'PREPARED'}
					Preparing sync...
				{:else if matrixStore.syncState === 'SYNCING'}
					Syncing messages...
				{:else if matrixStore.syncState === 'CATCHUP'}
					Catching up...
				{:else}
					Initializing...
				{/if}
			</p>
		</div>
	</div>
{:else if initError}
	<!-- Error State -->
	<div class="flex h-screen flex-col items-center justify-center gap-4 p-4 bg-background">
		<div class="rounded-full bg-red-500/10 p-4">
			<WarningCircle class="h-12 w-12 text-red-500" />
		</div>
		<div class="text-center">
			<h2 class="text-xl font-semibold text-foreground">Connection Failed</h2>
			<p class="mt-2 max-w-md text-muted-foreground">{initError}</p>
		</div>
		<div class="flex gap-2">
			<button
				class="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
				onclick={retry}
			>
				<ArrowsClockwise class="h-4 w-4" />
				Retry
			</button>
			<button class="px-4 py-2 rounded-xl glass-button font-medium" onclick={handleLogout}>
				Sign Out
			</button>
		</div>
	</div>
{:else if matrixStore.isReady}
	<!-- Ready - Show navigation and content -->
	<div class="layout-container">
		<!-- PillNavigation -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Manalink"
			homeRoute="/chat"
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isSidebarMode}
			onModeChange={handleModeChange}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			desktopPosition="bottom"
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
			primaryColor="#8b5cf6"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			allAppsHref="https://mana.how"
		/>

		<!-- Main Content -->
		<main
			class="main-content bg-background"
			class:sidebar-mode={isSidebarMode && !isCollapsed}
			class:floating-mode={!isSidebarMode && !isCollapsed}
		>
			{@render children()}
		</main>
	</div>
{:else}
	<!-- Unknown state - redirect to login -->
	<div class="flex h-screen items-center justify-center bg-background">
		<p class="text-muted-foreground">Redirecting...</p>
	</div>
{/if}

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.main-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		transition: all 300ms ease;
	}

	/* Sidebar mode - add left padding for sidebar nav */
	.main-content.sidebar-mode {
		padding-left: 180px;
	}
</style>
