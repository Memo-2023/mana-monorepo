<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { sessionConversationsStore } from '$lib/stores/session-conversations.svelte';
	import { theme } from '$lib/stores/theme';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { filterHiddenNavItems } from '@manacore/shared-theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import AuthGateModal from '$lib/components/AuthGateModal.svelte';
	import type { LayoutData } from './$types';

	// App switcher items
	const appItems = getPillAppItems('chat');

	let { children, data }: { children: any; data: LayoutData } = $props();

	let isChecking = $state(true);
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Guest mode state
	let showAuthGateModal = $state(false);
	let authGateAction = $state<'save' | 'sync' | 'ai' | 'feature'>('ai');

	// Check if in guest mode
	let isGuestMode = $derived(!authStore.isAuthenticated);
	let sessionConversationCount = $derived(sessionConversationsStore.count);

	// Use theme store's isDark directly
	let isDark = $derived(theme.isDark);

	// Get pinned themes from user settings (extended themes only)
	let pinnedThemes = $derived<ThemeVariant[]>(
		(userSettings.theme?.pinnedThemes || []).filter((t): t is ThemeVariant =>
			EXTENDED_THEME_VARIANTS.includes(t as ThemeVariant)
		)
	);

	// Visible themes in PillNav: default + pinned extended
	let visibleThemes = $derived<ThemeVariant[]>([...DEFAULT_THEME_VARIANTS, ...pinnedThemes]);

	// Theme variant dropdown items
	let themeVariantItems = $derived<PillDropdownItem[]>([
		// Theme variants (only default + pinned)
		...visibleThemes.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant].label,
			icon: THEME_DEFINITIONS[variant].icon,
			onClick: () => theme.setVariant(variant),
			active: theme.variant === variant,
		})),
		// Separator and link to full themes page
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

	// Base navigation items for Chat (settings moved to user dropdown)
	const baseNavItems: PillNavItem[] = [
		{ href: '/chat', label: 'Chat', icon: 'home' },
		{ href: '/templates', label: 'Templates', icon: 'document' },
		{ href: '/spaces', label: 'Spaces', icon: 'building' },
		{ href: '/documents', label: 'Dokumente', icon: 'archive' },
		{ href: '/archive', label: 'Archiv', icon: 'list' },
		{ href: '/feedback', label: 'Feedback', icon: 'chat' },
	];

	// Navigation items filtered by visibility settings (with fallback for guest mode)
	const navItems = $derived(
		filterHiddenNavItems('chat', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	// User email for user dropdown
	let userEmail = $derived(authStore.user?.email);

	// Check if current page is a chat page (needs full-width layout)
	let isChatPage = $derived($page.url.pathname.startsWith('/chat'));

	// Navigation shortcuts (Ctrl+1-5) - use base items for consistent shortcuts
	const navRoutes = baseNavItems.map((item) => item.href);

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
			localStorage.setItem('chat-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('chat-nav-collapsed', String(collapsed));
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

	// Initialize on mount - supports both authenticated and guest mode
	onMount(async () => {
		// Initialize theme
		theme.initialize();

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('chat-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('chat-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		await authStore.initialize();

		// Load user settings if authenticated
		if (authStore.isAuthenticated) {
			await userSettings.load();

			// Check for session conversations to migrate
			if (conversationsStore.hasSessionConversations) {
				await conversationsStore.migrateSessionConversations();
			}

			// Redirect to start page if on /chat and a custom start page is set
			const currentPath = window.location.pathname;
			if (currentPath === '/chat' && userSettings.startPage && userSettings.startPage !== '/chat') {
				goto(userSettings.startPage, { replaceState: true });
			}
		}

		isChecking = false;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isChecking}
	<!-- Loading state while checking auth -->
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
			></div>
			<p class="text-muted-foreground">Laden...</p>
		</div>
	</div>
{:else}
	<!-- Guest Mode Banner -->
	{#if isGuestMode}
		<div class="guest-banner">
			<span>
				Du bist im Gast-Modus.
				{#if sessionConversationCount > 0}
					{sessionConversationCount}
					{sessionConversationCount === 1 ? 'Unterhaltung' : 'Unterhaltungen'} in dieser Session.
				{/if}
			</span>
			<button onclick={() => goto('/login')}>Anmelden</button>
		</div>
	{/if}

	<!-- Navigation Layout -->
	<div class="layout-container" class:has-guest-banner={isGuestMode}>
		<!-- Floating/Sidebar Pill Navigation -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="ManaChat"
			homeRoute="/chat"
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isSidebarMode}
			onModeChange={handleModeChange}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			desktopPosition={userSettings.nav?.desktopPosition || 'bottom'}
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
			primaryColor="#3b82f6"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			manaHref="/mana"
			profileHref="/profile"
			allAppsHref="/apps"
		/>

		<!-- Main Content with dynamic padding based on nav mode -->
		<main
			class="main-content bg-background"
			class:sidebar-mode={isSidebarMode && !isCollapsed}
			class:floating-mode={!isSidebarMode && !isCollapsed}
			class:chat-page={isChatPage}
		>
			{#if isChatPage}
				<!-- Full-width layout for chat pages -->
				{@render children()}
			{:else}
				<div class="content-wrapper">
					{@render children()}
				</div>
			{/if}
		</main>
	</div>

	<!-- Auth Gate Modal -->
	<AuthGateModal
		open={showAuthGateModal}
		action={authGateAction}
		conversationCount={sessionConversationCount}
		onClose={() => (showAuthGateModal = false)}
	/>
{/if}

<style>
	.guest-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 60;
		background-color: #3b82f6;
		color: white;
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		font-size: 0.875rem;
	}

	.guest-banner button {
		background-color: white;
		color: #3b82f6;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-weight: 500;
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.guest-banner button:hover {
		background-color: #f0f9ff;
	}

	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.layout-container.has-guest-banner {
		padding-top: 40px;
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

	/* Chat page - no content wrapper, but keep nav padding */
	.main-content.chat-page {
		overflow: hidden;
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
