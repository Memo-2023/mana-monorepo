<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { onMount, setContext } from 'svelte';
	import { PillNavigation } from '@manacore/shared-ui';
	import { SyncIndicator } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem, SpotlightAction } from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { guidesStore } from '$lib/stores/guides.svelte';
	import { guidesStore as dbStore } from '$lib/data/local-store.js';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
		filterHiddenNavItems,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems, getManaApp } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { AuthGate, GuestWelcomeModal, SessionExpiredBanner } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';

	let { children } = $props();

	// Context for child pages
	let showCreateModal = $state(false);
	let showImportModal = $state(false);
	setContext('openCreateGuide', () => {
		showCreateModal = true;
	});
	setContext('openImportGuide', () => {
		showImportModal = true;
	});

	// App switcher
	let appItems = $derived(getPillAppItems('guides', undefined, undefined, authStore.user?.tier));

	// Collapsed state
	let isCollapsed = $state(false);

	// Theme
	let isDark = $derived(theme.isDark);
	let pinnedThemes = $derived<ThemeVariant[]>(
		[].filter((t): t is ThemeVariant => EXTENDED_THEME_VARIANTS.includes(t as ThemeVariant))
	);
	let visibleThemes = $derived<ThemeVariant[]>([...DEFAULT_THEME_VARIANTS, ...pinnedThemes]);
	let themeVariantItems = $derived<PillDropdownItem[]>([
		...visibleThemes.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant]?.label || variant,
			icon: THEME_DEFINITIONS[variant]?.icon || '🎨',
			onClick: () => theme.setVariant(variant),
			active: (theme.variant || 'lume') === variant,
		})),
		{
			id: 'all-themes',
			label: 'Alle Themes',
			icon: 'palette',
			onClick: () => goto('/themes'),
			active: false,
		},
	]);
	let currentThemeVariantLabel = $derived(
		THEME_DEFINITIONS[theme.variant]?.label || THEME_DEFINITIONS.lume?.label || 'Lume'
	);

	// Language
	let currentLocale = $derived($locale || 'de');
	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as Parameters<typeof setLocale>[0]);
	}
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// User
	let userEmail = $derived(authStore.isAuthenticated ? authStore.user?.email || 'Menü' : '');

	// Nav items
	const baseNavItems: PillNavItem[] = [
		{ href: '/', label: 'Bibliothek', icon: 'book' },
		{ href: '/collections', label: 'Sammlungen', icon: 'stack' },
		{ href: '/history', label: 'Verlauf', icon: 'clock-counter-clockwise' },
	];

	const navItems = $derived(filterHiddenNavItems('guides', baseNavItems, {}));

	// Guest welcome
	let showGuestWelcome = $state(false);
	function initGuestWelcome() {
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('guides')) {
			showGuestWelcome = true;
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
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

	const spotlightActions: SpotlightAction[] = [
		{
			id: 'new-guide',
			label: 'Neuer Guide',
			icon: 'plus',
			shortcut: 'N',
			category: 'Erstellen',
			onExecute: () => {
				showCreateModal = true;
			},
		},
		{ id: 'all-guides', label: 'Alle Guides', category: 'Navigation', onExecute: () => goto('/') },
		{
			id: 'collections',
			label: 'Sammlungen',
			category: 'Navigation',
			onExecute: () => goto('/collections'),
		},
		{
			id: 'settings',
			label: 'Einstellungen',
			category: 'Navigation',
			onExecute: () => goto('/settings'),
		},
	];

	async function handleAuthReady() {
		await dbStore.initialize();
		if (authStore.isAuthenticated) {
			dbStore.startSync(() => authStore.getValidToken());
		}
		const savedCollapsed = localStorage.getItem('guides-nav-collapsed');
		if (savedCollapsed === 'true') isCollapsed = true;
		initGuestWelcome();
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
			const num = parseInt(e.key);
			if (num >= 1 && num <= baseNavItems.length) {
				e.preventDefault();
				goto(baseNavItems[num - 1].href);
			}
		}
	}}
/>

<AuthGate
	{authStore}
	{goto}
	allowGuest={true}
	onReady={handleAuthReady}
	requiredTier={getManaApp('guides')?.requiredTier}
	appName={getManaApp('guides')?.name}
>
	<div class="flex flex-col min-h-screen">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Guides"
			homeRoute="/"
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
			primaryColor="#0d9488"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			{spotlightActions}
		/>

		<main class="relative z-0 pb-24" style="padding-top: 0">
			{@render children()}
		</main>

		<SyncIndicator />
	</div>

	<!-- FAB -->
	<button
		onclick={() => (showCreateModal = true)}
		class="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
		aria-label="Neue Anleitung erstellen"
	>
		<svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor"
			><path
				d="M228 128a12 12 0 0 1-12 12h-76v76a12 12 0 0 1-24 0v-76H40a12 12 0 0 1 0-24h76V40a12 12 0 0 1 24 0v76h76a12 12 0 0 1 12 12Z"
			/></svg
		>
	</button>

	<!-- Guest Welcome -->
	<GuestWelcomeModal
		appId="guides"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale={currentLocale === 'de' ? 'de' : 'en'}
	/>

	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale={$locale || 'de'} loginHref="/login" />
	{/if}
</AuthGate>

{#if showCreateModal}
	{#await import('$lib/components/GuideEditModal.svelte') then { default: GuideEditModal }}
		<GuideEditModal
			open={true}
			onClose={() => (showCreateModal = false)}
			onSave={async (data) => {
				await guidesStore.createGuide(data);
				showCreateModal = false;
			}}
		/>
	{/await}
{/if}

{#if showImportModal}
	{#await import('$lib/components/ImportModal.svelte') then { default: ImportModal }}
		<ImportModal
			open={true}
			onClose={() => (showImportModal = false)}
			onImported={(id) => {
				showImportModal = false;
				goto(`/guide/${id}`);
			}}
		/>
	{/await}
{/if}
