<script lang="ts">
	import { matrixStore, loginWithLoginToken } from '$lib/matrix';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { locale } from 'svelte-i18n';
	import type { Snippet } from 'svelte';
	import { CircleNotch, WarningCircle, ArrowsClockwise } from '@manacore/shared-icons';
	import { theme } from '$lib/stores/theme';
	import {
		userSettings,
		setAccessToken,
		clearAccessToken,
		loadStoredAccessToken,
	} from '$lib/stores/userSettings.svelte';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation.svelte';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';

	const AUTH_URL = import.meta.env.VITE_MANA_AUTH_URL || 'https://auth.mana.how';

	/**
	 * Exchange session cookie for JWT token from mana-core-auth
	 * This enables cross-app settings sync after Matrix SSO login
	 */
	async function fetchManaCoreToken(): Promise<boolean> {
		try {
			const response = await fetch(`${AUTH_URL}/api/v1/auth/session-to-token`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				if (data.accessToken) {
					setAccessToken(data.accessToken);
					return true;
				}
			}
		} catch {
			// Token exchange failed silently - user can still use Matrix without mana-core settings
		}
		return false;
	}

	/**
	 * Initialize user settings (load from mana-core-auth)
	 */
	async function initUserSettings(): Promise<void> {
		// First try to load stored token
		const storedToken = loadStoredAccessToken();

		// If no stored token, try to exchange session cookie
		if (!storedToken) {
			await fetchManaCoreToken();
		}

		// Load user settings (will use the token we just set)
		await userSettings.load();
	}

	// App switcher items
	const appItems = getPillAppItems('matrix');

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
	let loading = $state(true);
	let initError = $state<string | null>(null);

	// Navigation state
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
		{ href: '/bots', label: 'Bots', icon: 'robot' },
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
		clearAccessToken();
		goto('/login');
	}

	onMount(async () => {
		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('matrix-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		// Check if already initialized
		if (matrixStore.isReady) {
			// Matrix ready, initialize user settings in background
			initUserSettings();
			loading = false;
			return;
		}

		// Check for SSO loginToken in URL (Matrix SSO callback)
		const urlParams = new URLSearchParams(window.location.search);
		const loginToken = urlParams.get('loginToken');

		if (loginToken) {
			// Exchange loginToken for Matrix credentials
			const result = await loginWithLoginToken('matrix.mana.how', loginToken);

			if (result.success && result.credentials) {
				// Remove loginToken from URL to prevent re-processing on refresh
				const cleanUrl = window.location.pathname;
				window.history.replaceState({}, '', cleanUrl);

				// Initialize with the new credentials
				const initialized = await matrixStore.initialize(result.credentials);

				if (!initialized) {
					initError = matrixStore.error || 'Failed to initialize Matrix client';
				} else {
					// Matrix ready after SSO, fetch mana-core-auth token and load settings
					// This happens after SSO so the session cookie should be available
					initUserSettings();
				}

				loading = false;
				return;
			} else {
				// SSO token exchange failed
				initError = result.error || 'SSO login failed';
				loading = false;

				// Clear the URL and redirect to login
				window.history.replaceState({}, '', '/login');
				goto('/login');
				return;
			}
		}

		// Try to initialize Matrix with stored credentials
		const success = await matrixStore.initialize();

		if (!success) {
			// Check if no credentials (should redirect to login)
			if (!matrixStore.hasStoredCredentials()) {
				goto('/login');
				return;
			}
			// Has credentials but failed to init
			initError = matrixStore.error || 'Failed to connect to Matrix server';
		} else {
			// Matrix ready, initialize user settings in background
			initUserSettings();
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
	<div
		class="flex h-screen flex-col items-center justify-center gap-4 bg-background safe-area-top safe-area-bottom"
	>
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
	<div
		class="flex h-screen flex-col items-center justify-center gap-4 p-4 bg-background safe-area-top safe-area-bottom"
	>
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
			primaryColor="#8b5cf6"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			allAppsHref="https://mana.how"
		/>

		<!-- Main Content -->
		<main class="main-content bg-background">
			{@render children()}
		</main>

		<!-- Spacer for PillNavigation -->
		<div class="pill-nav-spacer"></div>
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
	}

	.pill-nav-spacer {
		flex-shrink: 0;
		height: 80px;
	}
</style>
