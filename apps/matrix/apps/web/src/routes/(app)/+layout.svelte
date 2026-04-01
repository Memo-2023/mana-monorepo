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
	import { PillNavigation, TagStrip } from '@manacore/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		QuickInputItem,
		SpotlightAction,
	} from '@manacore/shared-ui';
	import { tagStore } from '$lib/stores/tags.svelte';
	import { MagnifyingGlass, X } from '@manacore/shared-icons';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';

	const AUTH_URL = import.meta.env.VITE_MANA_AUTH_URL || 'https://auth.mana.how';
	const MATRIX_HOMESERVER = import.meta.env.VITE_MATRIX_HOMESERVER || 'matrix.mana.how';

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

		// Load tags (uses mana-core-auth token)
		await tagStore.fetchTags();
	}

	// App switcher items
	let appItems = $derived(getPillAppItems('matrix'));

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
	let loading = $state(true);
	let initError = $state<string | null>(null);

	// Navigation state
	let isCollapsed = $state(false);

	// Hide PillNavigation on mobile when inside a room view
	let isMobileRoomView = $derived(
		typeof window !== 'undefined' &&
			window.innerWidth < 1024 &&
			$page.url.pathname.startsWith('/chat/') &&
			$page.url.pathname !== '/chat'
	);

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

	// TagStrip visibility
	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	const spotlightActions: SpotlightAction[] = [
		{ id: 'rooms', label: 'Räume', category: 'Navigation', onExecute: () => goto('/') },
		{
			id: 'settings',
			label: 'Einstellungen',
			category: 'Navigation',
			onExecute: () => goto('/settings'),
		},
	];

	// Navigation items for Matrix
	const navItems: PillNavItem[] = [
		{ href: '/chat', label: 'Chat', icon: 'home' },
		{ href: '/bots', label: 'Bots', icon: 'robot' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
	];

	// User info from Matrix
	let userEmail = $derived(matrixStore.userId || undefined);

	// Keyboard shortcuts
	const navRoutes = navItems.map((item) => item.href);

	function handleKeydown(event: KeyboardEvent) {
		// Cmd/Ctrl+K opens command palette from anywhere
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			if (showCommandPalette) {
				closeCommandPalette();
			} else {
				openCommandPalette();
			}
			return;
		}

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

	// Command Palette state
	let showCommandPalette = $state(false);
	let commandQuery = $state('');
	let commandResults = $state<QuickInputItem[]>([]);
	let commandSelectedIndex = $state(0);
	let commandInputEl = $state<HTMLInputElement | null>(null);

	function openCommandPalette() {
		showCommandPalette = true;
		commandQuery = '';
		commandResults = [];
		commandSelectedIndex = 0;
		// Focus after render
		setTimeout(() => commandInputEl?.focus(), 50);
	}

	function closeCommandPalette() {
		showCommandPalette = false;
		commandQuery = '';
		commandResults = [];
	}

	function handleCommandSearch() {
		const q = commandQuery.toLowerCase().trim();
		if (!q) {
			commandResults = [];
			return;
		}
		commandResults = matrixStore.rooms
			.filter((r) => r.name?.toLowerCase().includes(q))
			.slice(0, 10)
			.map((room) => ({
				id: room.roomId,
				title: room.name || room.roomId,
				subtitle: room.isDirect ? 'Direktnachricht' : 'Gruppe',
			}));
		commandSelectedIndex = 0;
	}

	function handleCommandSelect(item: QuickInputItem) {
		matrixStore.selectRoom(item.id);
		goto('/chat');
		closeCommandPalette();
	}

	function handleCommandKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeCommandPalette();
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			commandSelectedIndex = Math.min(commandSelectedIndex + 1, commandResults.length - 1);
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			commandSelectedIndex = Math.max(commandSelectedIndex - 1, 0);
			return;
		}
		if (event.key === 'Enter' && commandResults.length > 0) {
			event.preventDefault();
			handleCommandSelect(commandResults[commandSelectedIndex]);
		}
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
			const result = await loginWithLoginToken(MATRIX_HOMESERVER, loginToken);

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
		<!-- PillNavigation (hidden on mobile when in a room) -->
		{#if !isMobileRoomView}
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
				helpHref="/help"
				allAppsHref="https://mana.how"
				{spotlightActions}
			/>
		{/if}

		<!-- TagStrip (above PillNav, toggled via Tags pill) -->
		{#if isTagStripVisible && !isMobileRoomView}
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

		<!-- Main Content -->
		<main class="main-content bg-background">
			{@render children()}
		</main>

		<!-- Command Palette (Cmd+K) -->
		{#if showCommandPalette}
			<!-- Backdrop -->
			<button
				class="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
				onclick={closeCommandPalette}
				aria-label="Schließen"
			></button>
			<!-- Dialog -->
			<div class="fixed inset-0 z-[201] flex items-start justify-center pt-[20vh] px-4">
				<div
					class="w-full max-w-lg rounded-2xl bg-surface-elevated border border-border shadow-2xl overflow-hidden animate-fade-in"
				>
					<!-- Search Input -->
					<div class="flex items-center gap-3 px-4 py-3 border-b border-border">
						<MagnifyingGlass class="h-5 w-5 text-muted-foreground flex-shrink-0" />
						<input
							bind:this={commandInputEl}
							type="text"
							bind:value={commandQuery}
							oninput={handleCommandSearch}
							onkeydown={handleCommandKeydown}
							placeholder="Raum oder Kontakt suchen..."
							class="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
						/>
						<kbd
							class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-mono"
						>
							ESC
						</kbd>
					</div>
					<!-- Results -->
					{#if commandQuery.trim()}
						<div class="max-h-80 overflow-y-auto p-2">
							{#if commandResults.length === 0}
								<p class="px-3 py-6 text-center text-sm text-muted-foreground">
									Keine Räume gefunden
								</p>
							{:else}
								{#each commandResults as item, index (item.id)}
									<button
										class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors
											   {index === commandSelectedIndex
											? 'bg-primary/10 text-foreground'
											: 'text-foreground hover:bg-surface-hover'}"
										onclick={() => handleCommandSelect(item)}
										onmouseenter={() => (commandSelectedIndex = index)}
									>
										<div
											class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-semibold"
										>
											{item.title
												.split(' ')
												.map((w) => w[0])
												.join('')
												.substring(0, 2)
												.toUpperCase()}
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium truncate">{item.title}</p>
											{#if item.subtitle}
												<p class="text-xs text-muted-foreground">{item.subtitle}</p>
											{/if}
										</div>
									</button>
								{/each}
							{/if}
						</div>
					{:else}
						<div class="px-4 py-6 text-center text-sm text-muted-foreground">
							Tippe um Räume und Kontakte zu finden
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Spacer for PillNavigation (hidden when nav is hidden) -->
		{#if !isMobileRoomView}
			<div class="pill-nav-spacer"></div>
		{/if}
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
