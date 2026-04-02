<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import { onDestroy, setContext } from 'svelte';
	import KeyboardShortcutsModal from '$lib/components/KeyboardShortcutsModal.svelte';
	import SessionWarning from '$lib/components/SessionWarning.svelte';
	import { locale, _ } from 'svelte-i18n';
	import {
		PillNavigation,
		TagStrip,
		DragPreview,
		ActionZone,
		QuickInputBar,
	} from '@manacore/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		SpotlightAction,
		ContentSearcher,
	} from '@manacore/shared-ui';
	import type { InputBarAdapter } from '$lib/quick-input/types';
	import { getAdapterLoader } from '$lib/quick-input/registry';
	import { createFallbackAdapter } from '$lib/quick-input/fallback-adapter';
	import { AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { createGuestMode, type GuestMode } from '$lib/stores/guest-mode.svelte';
	import { NotificationBar } from '@manacore/shared-ui';
	import { tagLocalStore, tagMutations, useAllTags } from '$lib/stores/tags.svelte';
	import { linkLocalStore, linkMutations } from '@manacore/shared-links';
	import { manacoreStore } from '$lib/data/local-store';
	import { createUnifiedSync } from '$lib/data/sync';
	import { migrateFromLegacyDbs } from '$lib/data/legacy-migration';
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
	import { setUser as setErrorTrackingUser } from '@manacore/shared-error-tracking/browser';
	import { trackReturnVisit, trackModuleUsed, markAsGuest } from '$lib/stores/funnel-tracking';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { onboardingStore } from '$lib/stores/onboarding.svelte';
	import { OnboardingWizard } from '$lib/components/onboarding';
	import { STORAGE_KEYS } from '$lib/config/storage-keys';
	import { SearchRegistry } from '$lib/search/registry';
	import { registerAllProviders } from '$lib/search/providers';
	import { initSharedUload } from '@manacore/shared-uload';
	import type { DragPayload } from '@manacore/shared-ui/dnd';

	let { children }: { children: Snippet } = $props();

	// ── App switcher ────────────────────────────────────────
	let appItems = $derived(getPillAppItems('manacore', undefined, undefined, authStore.user?.tier));

	// ── UI State ────────────────────────────────────────────
	let isCollapsed = $state(false);
	let showShortcuts = $state(false);
	let showOnboarding = $state(false);

	// ── Theme ───────────────────────────────────────────────
	let isDark = $derived(theme.isDark);
	let pinnedThemes = $derived<ThemeVariant[]>(
		(userSettings.theme?.pinnedThemes || []).filter((t): t is ThemeVariant =>
			EXTENDED_THEME_VARIANTS.includes(t as ThemeVariant)
		)
	);
	let visibleThemes = $derived<ThemeVariant[]>([...DEFAULT_THEME_VARIANTS, ...pinnedThemes]);
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
			label: $_('nav.all_themes'),
			icon: 'palette',
			onClick: () => goto('/themes'),
			active: false,
		},
	]);
	let currentThemeVariantLabel = $derived(THEME_DEFINITIONS[theme.variant].label);

	// ── i18n ────────────────────────────────────────────────
	let currentLocale = $derived($locale || 'de');
	function handleLocaleChange(newLocale: string) {
		setLocale(newLocale as any);
		userSettings.updateGlobal({ locale: newLocale });
		AppEvents.languageChanged(newLocale);
	}

	// Sync locale from user settings (backend) after login
	$effect(() => {
		if (userSettings.loaded && userSettings.locale) {
			const settingsLocale = userSettings.locale;
			if (supportedLocales.includes(settingsLocale as any) && settingsLocale !== $locale) {
				setLocale(settingsLocale as any);
			}
		}
	});
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// ── User / Guest awareness ──────────────────────────────
	let userEmail = $derived(
		authStore.isAuthenticated ? authStore.user?.email || $_('nav.menu') : ''
	);

	// ── Tags ────────────────────────────────────────────────
	const allTags = useAllTags();
	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	// ── DnD context ─────────────────────────────────────────
	let tagDropHandler = $state<((tagId: string, payload: DragPayload) => void) | null>(null);
	setContext('tagDropHandler', {
		set(handler: (tagId: string, payload: DragPayload) => void) {
			tagDropHandler = handler;
		},
		clear() {
			tagDropHandler = null;
		},
	});

	// ── Navigation ──────────────────────────────────────────
	let baseNavItems = $derived<PillNavItem[]>([
		{ href: '/home', label: $_('nav.home'), icon: 'home' },
		{ href: '/dashboard', label: $_('nav.dashboard'), icon: 'grid' },
		{ href: '/spiral', label: $_('nav.spiral'), icon: 'spiral' },
		{ href: '/observatory', label: $_('nav.observatory'), icon: 'eye' },
		{ href: '/credits', label: $_('nav.credits'), icon: 'creditCard' },
		{ href: '/gifts', label: $_('nav.gifts'), icon: 'gift' },
		{ href: '/api-keys', label: $_('nav.api_keys'), icon: 'key' },
		{ href: '/profile', label: $_('nav.profile'), icon: 'user' },
		{ href: '/settings', label: $_('nav.settings'), icon: 'settings' },
		{
			href: '/',
			label: $_('nav.tags'),
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
	]);

	let isAdmin = $derived(authStore.user?.role === 'admin');
	let navItems = $derived<PillNavItem[]>(
		isAdmin ? [...baseNavItems, { href: '/admin', label: 'Admin', icon: 'shield' }] : baseNavItems
	);
	let navRoutes = $derived(navItems.map((item) => item.href));

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}
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
				if (route) goto(route);
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

	// ── Sync ────────────────────────────────────────────────
	const SYNC_SERVER_URL =
		(typeof window !== 'undefined' &&
			(window as Record<string, unknown>).__PUBLIC_SYNC_SERVER_URL__) ||
		import.meta.env.PUBLIC_SYNC_SERVER_URL ||
		'http://localhost:3050';
	let unifiedSync: ReturnType<typeof createUnifiedSync> | null = null;

	async function handleSignOut() {
		unifiedSync?.stopAll();
		guestMode?.destroy();
		setErrorTrackingUser(null);
		await authStore.signOut();
		goto('/login');
	}

	// ── Guest Mode ──────────────────────────────────────────
	let guestMode: GuestMode | null = null;

	// ── Onboarding ──────────────────────────────────────────
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

	// ── Auth Ready (replaces monolith onMount) ──────────────
	async function handleAuthReady() {
		// Phase A: Auth-independent — guests + authenticated
		await Promise.all([
			manacoreStore.initialize(),
			tagLocalStore.initialize(),
			linkLocalStore.initialize(),
		]);
		await migrateFromLegacyDbs();
		initSharedUload();
		await dashboardStore.initialize();

		// Restore nav collapsed state
		if (typeof localStorage !== 'undefined') {
			const savedCollapsed = localStorage.getItem(STORAGE_KEYS.NAV_COLLAPSED);
			if (savedCollapsed === 'true') {
				isCollapsed = true;
				collapsedStore.set(true);
			}
		}

		// Phase B: Auth-dependent — sync, settings, onboarding
		if (authStore.isAuthenticated) {
			setErrorTrackingUser({ id: authStore.user?.id ?? 'unknown', email: authStore.user?.email });
			trackReturnVisit();
			const getToken = () => authStore.getValidToken();
			unifiedSync = createUnifiedSync(SYNC_SERVER_URL, getToken);
			unifiedSync.startAll();

			userSettings.load().catch(() => {});

			onboardingStore.load();
			if (onboardingStore.shouldShow) {
				onboardingStore.start();
				ManaCoreEvents.onboardingStarted();
				showOnboarding = true;
			}
		}

		// Phase C: Guest mode — welcome modal + nudge
		if (!authStore.isAuthenticated) {
			markAsGuest();
			guestMode = createGuestMode('manacore', {
				nudgeDelayMinutes: 3,
				onRegister: () => goto('/register'),
			});
		}
	}

	onDestroy(() => {
		unifiedSync?.stopAll();
		guestMode?.destroy();
	});

	// ── Search / Spotlight ───────────────────────────────────
	const searchRegistry = new SearchRegistry();
	registerAllProviders(searchRegistry);

	const contentSearcher: ContentSearcher = async (query, signal) => {
		return searchRegistry.search(query, { signal });
	};

	// ── QuickInputBar — context-aware adapter per module ─────
	let inputBarAdapter = $state<InputBarAdapter>(createFallbackAdapter(searchRegistry));
	let activeModulePrefix = $state<string | null>(null);

	$effect(() => {
		const pathname = $page.url.pathname;
		const moduleSlug = '/' + pathname.split('/')[1];

		if (moduleSlug === activeModulePrefix) return;

		// Track module usage for funnel analysis
		const moduleName = pathname.split('/')[1];
		if (moduleName && authStore.isAuthenticated) {
			trackModuleUsed(moduleName);
		}

		const loader = getAdapterLoader(pathname);
		if (!loader) {
			inputBarAdapter = createFallbackAdapter(searchRegistry);
			activeModulePrefix = null;
			return;
		}

		const target = moduleSlug;
		loader().then(({ createAdapter }) => {
			if (target === '/' + $page.url.pathname.split('/')[1]) {
				inputBarAdapter = createAdapter() as InputBarAdapter;
				activeModulePrefix = target;
			}
		});
	});

	const spotlightActions: SpotlightAction[] = [
		{ id: 'home', label: 'Home', category: 'Navigation', onExecute: () => goto('/home') },
		{
			id: 'dashboard',
			label: 'Dashboard',
			category: 'Navigation',
			onExecute: () => goto('/dashboard'),
		},
		{
			id: 'spiral',
			label: 'Mana Spiral',
			category: 'Navigation',
			onExecute: () => goto('/spiral'),
		},
		{ id: 'credits', label: 'Credits', category: 'Navigation', onExecute: () => goto('/credits') },
		{ id: 'apps', label: 'Alle Apps', category: 'Navigation', onExecute: () => goto('/apps') },
		{
			id: 'settings',
			label: 'Einstellungen',
			category: 'Navigation',
			onExecute: () => goto('/settings'),
		},
	];
</script>

<svelte:window onkeydown={handleKeydown} />

<AuthGate
	{authStore}
	{goto}
	allowGuest={true}
	onReady={handleAuthReady}
	appName="ManaCore"
	locale={($locale || 'de') === 'de' ? 'de' : 'en'}
>
	<!-- Onboarding Wizard (auth only) -->
	{#if showOnboarding && authStore.isAuthenticated}
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
			showLogout={authStore.isAuthenticated}
			loginHref="/login"
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
			{spotlightActions}
			{contentSearcher}
		/>

		<!-- QuickInputBar (context-aware per module) -->
		<QuickInputBar
			onSearch={inputBarAdapter.onSearch}
			onSelect={inputBarAdapter.onSelect}
			onParseCreate={inputBarAdapter.onParseCreate}
			onCreate={inputBarAdapter.onCreate}
			onSearchChange={inputBarAdapter.onSearchChange}
			placeholder={inputBarAdapter.placeholder}
			appIcon={inputBarAdapter.appIcon}
			emptyText={inputBarAdapter.emptyText}
			createText={inputBarAdapter.createText}
			deferSearch={inputBarAdapter.deferSearch}
			locale={$locale || 'de'}
			defaultOptions={inputBarAdapter.defaultOptions}
			selectedDefaultId={inputBarAdapter.selectedDefaultId}
			defaultOptionLabel={inputBarAdapter.defaultOptionLabel}
			onDefaultChange={inputBarAdapter.onDefaultChange}
			highlightPatterns={inputBarAdapter.highlightPatterns}
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
				onTagDrop={tagDropHandler ?? undefined}
				managementHref="/tags"
				loading={allTags.loading}
			/>
		{/if}

		<!-- DnD: floating preview -->
		<DragPreview />

		<!-- Main content -->
		<main class="pb-24">
			<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{@render children()}
			</div>
		</main>

		<!-- Session expiry warning (auth only) -->
		{#if authStore.isAuthenticated}
			<SessionWarning />
		{/if}

		<!-- Keyboard shortcuts modal -->
		<KeyboardShortcutsModal open={showShortcuts} onclose={() => (showShortcuts = false)} />

		<!-- Guest notifications (nudge) -->
		{#if guestMode && guestMode.notifications.length > 0}
			<div class="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
				<NotificationBar notifications={guestMode.notifications} />
			</div>
		{/if}
	</div>

	<!-- Guest Welcome Modal -->
	{#if guestMode}
		<GuestWelcomeModal
			appId="manacore"
			visible={guestMode.showWelcome}
			onClose={() => guestMode?.dismissWelcome()}
			onLogin={() => goto('/login')}
			onRegister={() => goto('/register')}
			locale={($locale || 'de') === 'de' ? 'de' : 'en'}
		/>
	{/if}
</AuthGate>
