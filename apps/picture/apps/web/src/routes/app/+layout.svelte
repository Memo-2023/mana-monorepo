<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillNavElement, PillDropdownItem } from '@manacore/shared-ui';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { filterHiddenNavItems } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import KeyboardShortcutsModal from '$lib/components/ui/KeyboardShortcutsModal.svelte';
	import { theme } from '$lib/stores/theme';
	import { isUIVisible, toggleUI, showKeyboardShortcuts } from '$lib/stores/ui';
	import { pictureOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { SessionExpiredBanner, AuthGate } from '@manacore/shared-auth-ui';
	import { viewMode, setViewMode } from '$lib/stores/view';
	import type { ViewMode } from '$lib/stores/view';
	import { browser } from '$app/environment';

	// App switcher items
	const appItems = getPillAppItems('picture');

	let { children } = $props();

	// PillNav state
	let isCollapsed = $state(false);

	// Load persisted nav state
	$effect(() => {
		if (browser) {
			const savedCollapsed = localStorage.getItem('picture-nav-collapsed');
			if (savedCollapsed !== null) isCollapsed = savedCollapsed === 'true';
		}
	});

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		if (browser) localStorage.setItem('picture-nav-collapsed', String(collapsed));
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/auth/login');
	}

	function handleToggleTheme() {
		theme.toggleMode();
	}

	function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}

	async function handleAuthReady() {
		await userSettings.load();

		// Redirect to start page if on /app and a custom start page is set
		const currentPath = window.location.pathname;
		if (
			currentPath === '/app' &&
			userSettings.startPage &&
			userSettings.startPage !== '/' &&
			userSettings.startPage !== '/app'
		) {
			const targetPath = userSettings.startPage.startsWith('/app')
				? userSettings.startPage
				: `/app${userSettings.startPage}`;
			goto(targetPath, { replaceState: true });
		}
	}

	// Base navigation items (Mana is in user dropdown via manaHref)
	const baseNavItems: PillNavItem[] = [
		{ href: '/app/gallery', label: 'Galerie', icon: 'home' },
		{ href: '/app/board', label: 'Moodboards', icon: 'grid' },
		{ href: '/app/explore', label: 'Entdecken', icon: 'search' },
		{ href: '/app/generate', label: 'Generieren', icon: 'fire' },
		{ href: '/app/upload', label: 'Upload', icon: 'upload' },
		{ href: '/app/tags', label: 'Tags', icon: 'tag' },
		{ href: '/app/archive', label: 'Archiv', icon: 'archive' },
	];

	// Navigation items filtered by visibility settings (with fallback for guest mode)
	const navItems = $derived(
		filterHiddenNavItems('picture', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	// View mode options for tab group
	const viewModeOptions = [
		{ id: 'single', icon: 'list', title: 'Liste (1)' },
		{ id: 'grid3', icon: 'grid', title: 'Mittel (2)' },
		{ id: 'gridSmall', icon: 'gridSmall', title: 'Klein (3)' },
	];

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
			onClick: () => goto('/app/themes'),
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

	// Elements (divider + view mode tabs)
	let elements: PillNavElement[] = $derived([
		{ type: 'divider' as const },
		{
			type: 'tabs' as const,
			sectionLabel: 'Ansicht',
			options: viewModeOptions,
			value: $viewMode === 'grid5' ? 'gridSmall' : $viewMode,
			onChange: (id: string) => {
				const mode = id === 'gridSmall' ? 'grid5' : (id as ViewMode);
				setViewMode(mode);
			},
		},
	]);

	// Global keyboard shortcuts
	function handleKeyDown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
			return;
		}

		switch (e.key.toLowerCase()) {
			case 'tab':
				e.preventDefault();
				toggleUI();
				break;
			case '?':
				e.preventDefault();
				showKeyboardShortcuts.set(true);
				break;
			case 'escape':
				showKeyboardShortcuts.set(false);
				break;
			case 'g':
				e.preventDefault();
				goto('/app/gallery');
				break;
			case 'm':
				e.preventDefault();
				goto('/app/board');
				break;
			case 'e':
				e.preventDefault();
				goto('/app/explore');
				break;
			case 'n':
				e.preventDefault();
				goto('/app/generate');
				break;
			case 'u':
				e.preventDefault();
				goto('/app/upload');
				break;
			case 'a':
				e.preventDefault();
				goto('/app/archive');
				break;
			case 't':
				e.preventDefault();
				goto('/app/themes');
				break;
			case '1':
				e.preventDefault();
				setViewMode('single');
				break;
			case '2':
				e.preventDefault();
				setViewMode('grid3');
				break;
			case '3':
				e.preventDefault();
				setViewMode('grid5');
				break;
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

<AuthGate {authStore} {goto} loginHref="/auth/login" onReady={handleAuthReady}>
	<div class="min-h-screen" style="background-color: hsl(var(--color-background));">
		<!-- PillNavigation (conditionally visible) -->
		{#if $isUIVisible}
			<PillNavigation
				items={navItems}
				{elements}
				currentPath={$page.url.pathname}
				appName="Picture"
				homeRoute="/app/gallery"
				onLogout={handleLogout}
				onToggleTheme={handleToggleTheme}
				isDark={theme.isDark}
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
				primaryColor="#3b82f6"
				showAppSwitcher={true}
				{appItems}
				{userEmail}
				settingsHref="/app/settings"
				manaHref="/app/mana"
				profileHref="/app/profile"
				allAppsHref="/app/apps"
			/>
		{/if}

		<!-- Main Content Area -->
		<main class="main-content pb-24">
			<div class="min-h-screen">
				{@render children?.()}
			</div>
		</main>

		<!-- Keyboard Shortcuts Modal -->
		<KeyboardShortcutsModal />

		<!-- Onboarding Modal -->
		{#if pictureOnboarding.shouldShow}
			<MiniOnboardingModal store={pictureOnboarding} appName="Picture" appEmoji="🎨" />
		{/if}
	</div>
	<SessionExpiredBanner locale={$locale || 'de'} loginHref="/auth/login" />
</AuthGate>

<style>
	.main-content {
		padding-bottom: 100px;
	}
</style>
