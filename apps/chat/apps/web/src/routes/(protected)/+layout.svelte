<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { useAllConversations, useAllTemplates } from '$lib/data/queries';
	import { theme } from '$lib/stores/theme';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { filterHiddenNavItems } from '@manacore/shared-theme';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { setContext } from 'svelte';
	import { PillNavigation, TagStrip } from '@manacore/shared-ui';
	import { SyncIndicator } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import type { LayoutData } from './$types';
	import { chatOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { chatStore } from '$lib/data/local-store';

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allConversations = useAllConversations();
	const allTemplates = useAllTemplates();
	const allTags = useAllSharedTags();

	// Provide data to child components via Svelte context
	setContext('conversations', allConversations);
	setContext('templates', allTemplates);
	setContext('tags', allTags);

	// App switcher items
	let appItems = $derived(getPillAppItems('chat', undefined, undefined, authStore.user?.tier));

	let { children, data }: { children: any; data: LayoutData } = $props();

	let isCollapsed = $state(false);

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

	// TagStrip visibility
	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	// Base navigation items for Chat (settings moved to user dropdown)
	const baseNavItems: PillNavItem[] = [
		{ href: '/chat', label: 'Chat', icon: 'home' },
		{ href: '/compare', label: 'Vergleichen', icon: 'scale' },
		{ href: '/templates', label: 'Templates', icon: 'document' },
		{ href: '/spaces', label: 'Spaces', icon: 'building' },
		{ href: '/documents', label: 'Dokumente', icon: 'archive' },
		{ href: '/archive', label: 'Archiv', icon: 'list' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
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
		tagMutations.stopSync();
		goto('/login');
	}

	let showGuestWelcome = $state(false);

	async function handleAuthReady() {
		// Initialize local-first databases
		await Promise.all([chatStore.initialize(), tagLocalStore.initialize()]);
		if (authStore.isAuthenticated) {
			const getToken = () => authStore.getValidToken();
			chatStore.startSync(getToken);
			tagMutations.startSync(getToken);
		}
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('chat')) {
			showGuestWelcome = true;
		}

		// Initialize theme
		theme.initialize();

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('chat-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		if (!authStore.isAuthenticated) return;

		// Load user settings
		await userSettings.load();

		// Redirect to start page if on /chat and a custom start page is set
		const currentPath = window.location.pathname;
		if (currentPath === '/chat' && userSettings.startPage && userSettings.startPage !== '/chat') {
			goto(userSettings.startPage, { replaceState: true });
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<!-- Navigation Layout -->
	<div class="layout-container">
		<!-- Floating Pill Navigation -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="ManaChat"
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
			primaryColor="#3b82f6"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			manaHref="/mana"
			profileHref="/profile"
			themesHref="/themes"
			helpHref="/help"
			allAppsHref="/apps"
		/>

		<!-- TagStrip (above PillNav, toggled via Tags pill) -->
		{#if isTagStripVisible}
			<TagStrip
				tags={allTags.value.map((t) => ({
					id: t.id,
					name: t.name,
					color: t.color || '#3b82f6',
				}))}
				selectedIds={[]}
				onToggle={() => {}}
				onClear={() => {}}
				managementHref="/tags"
			/>
		{/if}

		<!-- Main Content -->
		<main class="main-content bg-background" class:chat-page={isChatPage}>
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

	<!-- Onboarding Modal -->
	{#if chatOnboarding.shouldShow}
		<MiniOnboardingModal store={chatOnboarding} appName="Chat" appEmoji="💬" />
	{/if}

	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale={$locale || 'de'} loginHref="/login" />
	{/if}

	<GuestWelcomeModal
		appId="chat"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale={($locale || 'de') === 'de' ? 'de' : 'en'}
	/>
	<SyncIndicator />
</AuthGate>

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
