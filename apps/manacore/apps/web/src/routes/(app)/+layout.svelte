<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import KeyboardShortcutsModal from '$lib/components/KeyboardShortcutsModal.svelte';
	import SessionWarning from '$lib/components/SessionWarning.svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, TagStrip } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { tagLocalStore, tagMutations, useAllTags } from '$lib/stores/tags.svelte';
	import { manacoreStore } from '$lib/data/local-store';
	import { todoReader, calendarReader, contactsReader } from '$lib/data/cross-app-stores';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { ManaCoreEvents, AppEvents } from '@manacore/shared-utils/analytics';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { onboardingStore } from '$lib/stores/onboarding.svelte';
	import { OnboardingWizard } from '$lib/components/onboarding';
	import { STORAGE_KEYS } from '$lib/config/storage-keys';

	let { children }: { children: Snippet } = $props();

	// App switcher items
	const appItems = getPillAppItems('manacore');

	let loading = $state(true);
	let isCollapsed = $state(false);
	let showShortcuts = $state(false);

	// Get theme state
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
		...visibleThemes.map((variant) => ({
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
		AppEvents.languageChanged(newLocale);
	}
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// User email for user dropdown
	let userEmail = $derived(authStore.user?.email);

	// Tags (local-first reactive query)
	const allTags = useAllTags();

	// TagStrip visibility
	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	// Navigation items for ManaCore
	const baseNavItems: PillNavItem[] = [
		{ href: '/home', label: 'Home', icon: 'home' },
		{ href: '/dashboard', label: 'Dashboard', icon: 'grid' },
		{ href: '/observatory', label: 'Observatory', icon: 'eye' },
		{ href: '/credits', label: 'Credits', icon: 'creditCard' },
		{ href: '/gifts', label: 'Geschenke', icon: 'gift' },
		{ href: '/api-keys', label: 'API Keys', icon: 'key' },
		{ href: '/profile', label: 'Profil', icon: 'user' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
	];

	// Only show admin link if user has admin role
	let isAdmin = $derived(authStore.user?.role === 'admin');
	let navItems = $derived<PillNavItem[]>(
		isAdmin ? [...baseNavItems, { href: '/admin', label: 'Admin', icon: 'shield' }] : baseNavItems
	);

	// Navigation shortcuts (Ctrl+1-5)
	const navRoutes = navItems.map((item) => item.href);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		// ? key opens keyboard shortcuts
		if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
			event.preventDefault();
			showShortcuts = !showShortcuts;
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
			localStorage.setItem(STORAGE_KEYS.NAV_COLLAPSED, String(collapsed));
		}
	}

	function handleToggleTheme() {
		theme.toggleMode();
		AppEvents.themeChanged(theme.isDark ? 'dark' : 'light');
	}

	function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
		AppEvents.themeChanged(mode);
	}

	async function handleSignOut() {
		manacoreStore.stopSync();
		tagMutations.stopSync();
		await authStore.signOut();
		goto('/login');
	}

	// Track initialization state
	let isInitializing = $state(true);
	let showOnboarding = $state(false);

	function handleOnboardingComplete() {
		onboardingStore.complete();
		ManaCoreEvents.onboardingCompleted();
		showOnboarding = false;
	}

	function handleOnboardingSkip() {
		ManaCoreEvents.onboardingSkipped(onboardingStore.currentStep);
		onboardingStore.skip();
		showOnboarding = false;
	}

	onMount(async () => {
		// Initialize auth store first
		await authStore.initialize();

		// Only after initialization is complete, check auth status
		isInitializing = false;

		// Redirect to login if not authenticated
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Initialize local-first databases (opens IndexedDB, seeds guest data)
		await Promise.all([
			manacoreStore.initialize(),
			tagLocalStore.initialize(),
			// Cross-app readers (read-only, no sync — owning apps handle sync)
			todoReader.initialize(),
			calendarReader.initialize(),
			contactsReader.initialize(),
		]);

		// Start syncing to server
		const getToken = () => authStore.getValidToken();
		manacoreStore.startSync(getToken);
		tagMutations.startSync(getToken);

		// Initialize dashboard from IndexedDB
		await dashboardStore.initialize();

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem(STORAGE_KEYS.NAV_COLLAPSED);
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		// Load user settings from server (still needed for shared-theme sync)
		userSettings.load().catch(() => {});

		// Load onboarding state and show wizard if needed
		onboardingStore.load();
		if (onboardingStore.shouldShow) {
			onboardingStore.start();
			ManaCoreEvents.onboardingStarted();
			showOnboarding = true;
		}

		loading = false;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isInitializing || loading || authStore.loading}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"
			></div>
			<p class="text-muted-foreground">Loading...</p>
		</div>
	</div>
{:else if authStore.isAuthenticated}
	<!-- Onboarding Wizard Modal -->
	{#if showOnboarding}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
		>
			<OnboardingWizard onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
		</div>
	{/if}

	<div class="min-h-screen bg-background">
		<!-- Pill Navigation -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="ManaCore"
			homeRoute="/home"
			onLogout={handleSignOut}
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
			primaryColor="#6366f1"
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
				tags={(allTags.value ?? []).map((t) => ({
					id: t.id,
					name: t.name,
					color: t.color || '#3b82f6',
				}))}
				selectedIds={[]}
				onToggle={() => {}}
				onClear={() => {}}
				managementHref="/tags"
				loading={allTags.loading}
			/>
		{/if}

		<!-- Main content -->
		<main class="pb-24">
			<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{@render children()}
			</div>
		</main>

		<!-- Session expiry warning -->
		<SessionWarning />

		<!-- Keyboard shortcuts modal -->
		<KeyboardShortcutsModal open={showShortcuts} onclose={() => (showShortcuts = false)} />
	</div>
{/if}
