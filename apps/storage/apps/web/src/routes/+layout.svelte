<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, setupGlobalErrorHandler } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { ToastContainer } from '@manacore/shared-ui';
	import { storageOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import '../app.css';

	// App switcher items
	const appItems = getPillAppItems('storage');

	let { children } = $props();

	let loading = $state(true);
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
		setLocale(newLocale as any);
	}
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// User email for user dropdown
	let userEmail = $derived(authStore.user?.email || 'Menü');

	// Navigation items for Storage
	const navItems: PillNavItem[] = [
		{ href: '/files', label: 'Dateien', icon: 'folder' },
		{ href: '/shared', label: 'Geteilt', icon: 'share' },
		{ href: '/favorites', label: 'Favoriten', icon: 'heart' },
		{ href: '/trash', label: 'Papierkorb', icon: 'trash' },
		{ href: '/search', label: 'Suche', icon: 'search' },
	];

	// Navigation shortcuts
	const navRoutes = navItems.map((item) => item.href);

	// Check if current path is auth page
	let isAuthPage = $derived(
		$page.url.pathname === '/login' ||
			$page.url.pathname === '/register' ||
			$page.url.pathname === '/forgot-password'
	);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;

		// Cmd/Ctrl+K to open search
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			goto('/search');
			return;
		}

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

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('storage-nav-collapsed', String(collapsed));
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
		goto('/login');
	}

	onMount(() => {
		// Setup global error handling
		const cleanupErrorHandler = setupGlobalErrorHandler();

		// Initialize async operations
		const init = async () => {
			// Initialize theme
			theme.initialize();

			// Initialize auth
			await authStore.initialize();

			// Load user settings
			await userSettings.load();

			// Initialize collapsed state from localStorage
			const savedCollapsed = localStorage.getItem('storage-nav-collapsed');
			if (savedCollapsed === 'true') {
				isCollapsed = true;
				collapsedStore.set(true);
			}

			loading = false;
		};

		init();

		return cleanupErrorHandler;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<ToastContainer />

{#if loading}
	<div
		class="flex min-h-screen items-center justify-center bg-background"
		role="status"
		aria-live="polite"
		aria-busy="true"
	>
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
				aria-hidden="true"
			></div>
			<p class="text-muted-foreground">Laden...</p>
		</div>
	</div>
{:else if isAuthPage}
	<!-- Auth pages without navigation -->
	{@render children()}
{:else}
	<!-- Navigation Layout -->
	<div class="layout-container">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Storage"
			homeRoute="/files"
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
			showLogout={authStore.isAuthenticated}
			onLogout={handleLogout}
			loginHref="/login"
			primaryColor="#3b82f6"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			manaHref="/mana"
			profileHref="/profile"
			allAppsHref="/apps"
		/>

		<main class="main-content bg-background">
			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>

		<!-- Onboarding Modal -->
		{#if storageOnboarding.shouldShow}
			<MiniOnboardingModal store={storageOnboarding} appName="Storage" appEmoji="☁️" />
		{/if}
	</div>
{/if}

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		padding-bottom: 100px;
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
