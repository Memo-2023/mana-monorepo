<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, TagStrip } from '@manacore/shared-ui';
	import type { PillNavItem, PillNavElement, PillDropdownItem } from '@manacore/shared-ui';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { filterHiddenNavItems } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems, getManaApp } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import KeyboardShortcutsModal from '$lib/components/ui/KeyboardShortcutsModal.svelte';
	import { theme } from '$lib/stores/theme';
	import { isUIVisible, toggleUI, showKeyboardShortcuts } from '$lib/stores/ui';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';
	import { setContext } from 'svelte';
	import { pictureOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { pictureStore } from '$lib/data/local-store';
	import {
		useAllImages,
		useArchivedImages,
		useAllBoards,
		useAllImageTags,
	} from '$lib/data/queries';
	import { viewMode, setViewMode } from '$lib/stores/view';
	import type { ViewMode } from '$lib/stores/view';
	import { browser } from '$app/environment';

	// App switcher items
	let appItems = $derived(getPillAppItems('picture', undefined, undefined, authStore.user?.tier));

	// Live query for shared tags (local-first)
	const allTags = useAllSharedTags();
	setContext('tags', allTags);

	// Live queries for picture data (local-first)
	const allImages = useAllImages();
	setContext('allImages', allImages);

	const archivedImages = useArchivedImages();
	setContext('archivedImages', archivedImages);

	const allBoards = useAllBoards();
	setContext('allBoards', allBoards);

	const allImageTags = useAllImageTags();
	setContext('allImageTags', allImageTags);

	let { children } = $props();

	// PillNav state
	let isCollapsed = $state(false);

	// Guest welcome modal state
	let showGuestWelcome = $state(false);

	// Load persisted nav state
	$effect(() => {
		if (browser) {
			const savedCollapsed = localStorage.getItem('picture-nav-collapsed');
			if (savedCollapsed !== null) isCollapsed = savedCollapsed === 'true';
		}
	});

	// TagStrip state
	let isTagStripVisible = $state(true);
	let selectedTagIds = $state<string[]>([]);

	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	function handleTagToggle(tagId: string) {
		if (selectedTagIds.includes(tagId)) {
			selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
		} else {
			selectedTagIds = [...selectedTagIds, tagId];
		}
	}

	function handleTagClear() {
		selectedTagIds = [];
	}

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
		// Initialize local-first databases (opens IndexedDB, seeds guest data)
		await Promise.all([pictureStore.initialize(), tagLocalStore.initialize()]);

		// If authenticated, start syncing to server
		if (authStore.isAuthenticated) {
			pictureStore.startSync(() => authStore.getValidToken());
			tagMutations.startSync(() => authStore.getValidToken());
		}

		// Show guest welcome modal on first visit
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('picture')) {
			showGuestWelcome = true;
		}

		if (authStore.isAuthenticated) {
			await userSettings.load();
		}

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
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
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

	// User email for user dropdown — empty string for guests so PillNav shows login button
	let userEmail = $derived(authStore.isAuthenticated ? authStore.user?.email || 'Menü' : '');

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

<AuthGate
	{authStore}
	{goto}
	loginHref="/auth/login"
	allowGuest={true}
	onReady={handleAuthReady}
	requiredTier={getManaApp('picture')?.requiredTier}
	appName={getManaApp('picture')?.name}
>
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
				showLogout={authStore.isAuthenticated}
				loginHref="/auth/login"
				primaryColor="#3b82f6"
				showAppSwitcher={true}
				{appItems}
				{userEmail}
				settingsHref="/app/settings"
				manaHref="/app/mana"
				profileHref="/app/profile"
				themesHref="/app/themes"
				helpHref="/app/help"
				feedbackHref="/app/feedback"
				allAppsHref="/app/apps"
			/>
			<!-- TagStrip (toggled via Tags pill) -->
			{#if isTagStripVisible}
				<TagStrip
					tags={allTags.value.map((t) => ({
						id: t.id,
						name: t.name,
						color: t.color || '#6b7280',
					}))}
					selectedIds={selectedTagIds}
					onToggle={handleTagToggle}
					onClear={handleTagClear}
					managementHref="/app/tags"
				/>
			{/if}
		{/if}

		<!-- Main Content Area -->
		<main class="main-content pb-24">
			<div class="min-h-screen">
				{@render children?.()}
			</div>
		</main>

		<!-- Keyboard Shortcuts Modal -->
		<KeyboardShortcutsModal />
	</div>

	<!-- Onboarding Modal -->
	{#if pictureOnboarding.shouldShow}
		<MiniOnboardingModal store={pictureOnboarding} appName="Picture" appEmoji="🎨" />
	{/if}

	<!-- Guest Welcome Modal -->
	<GuestWelcomeModal
		appId="picture"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/auth/login')}
		onRegister={() => goto('/auth/register')}
		locale={($locale || 'de') === 'de' ? 'de' : 'en'}
	/>

	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale={$locale || 'de'} loginHref="/auth/login" />
	{/if}
</AuthGate>

<style>
	.main-content {
		padding-bottom: 100px;
	}
</style>
