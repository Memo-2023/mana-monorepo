<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import { onDestroy, setContext } from 'svelte';
	import { createReminderScheduler, notificationService } from '@mana/shared-stores';
	import { todoReminderSource } from '$lib/modules/todo/reminder-source';
	import KeyboardShortcutsModal from '$lib/components/KeyboardShortcutsModal.svelte';
	import SessionWarning from '$lib/components/SessionWarning.svelte';
	import { locale, _ } from 'svelte-i18n';
	import {
		PillNavigation,
		TagStrip,
		DragPreview,
		ActionZone,
		QuickInputBar,
	} from '@mana/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		SpotlightAction,
		ContentSearcher,
		ContextMenuItem,
	} from '@mana/shared-ui';
	import { ContextMenu } from '@mana/shared-ui';
	import { createWorkbenchContextMenu } from '$lib/context-menu';
	import type { InputBarAdapter } from '$lib/quick-input/types';
	import { getAdapterLoader } from '$lib/quick-input/registry';
	import { createFallbackAdapter } from '$lib/quick-input/fallback-adapter';
	import { AuthGate, GuestWelcomeModal } from '@mana/shared-auth-ui';
	import { createGuestMode, type GuestMode } from '$lib/stores/guest-mode.svelte';
	import { NotificationBar } from '@mana/shared-ui';
	import { tagLocalStore, tagMutations, useAllTags } from '@mana/shared-stores';
	import { linkLocalStore, linkMutations } from '@mana/shared-links';
	import { manaStore } from '$lib/data/local-store';
	import { createUnifiedSync } from '$lib/data/sync';
	import { networkStore } from '$lib/stores/network.svelte';
	import { db } from '$lib/data/database';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@mana/shared-theme';
	import type { ThemeVariant } from '@mana/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@mana/shared-i18n';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import { ManaEvents, AppEvents } from '@mana/shared-utils/analytics';
	import { setUser as setErrorTrackingUser } from '@mana/shared-error-tracking/browser';
	import { trackReturnVisit, trackModuleUsed, markAsGuest } from '$lib/stores/funnel-tracking';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { getPillAppItems } from '@mana/shared-branding';
	import { onboardingStore } from '$lib/stores/onboarding.svelte';
	import { OnboardingWizard } from '$lib/components/onboarding';
	import { STORAGE_KEYS } from '$lib/config/storage-keys';
	import { SearchRegistry } from '$lib/search/registry';
	import { registerAllProviders } from '$lib/search/providers';
	import { initSharedUload } from '@mana/shared-uload';
	import type { DragPayload } from '@mana/shared-ui/dnd';

	let { children }: { children: Snippet } = $props();

	// ── App switcher ────────────────────────────────────────
	let appItems = $derived(getPillAppItems('mana', undefined, undefined, authStore.user?.tier));

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

	// Bottom chrome height: calculated from state, not measured (avoids reflow loop)
	const bottomChromeHeight = $derived((isCollapsed ? 0 : 80) + (isTagStripVisible ? 44 : 0) + 72);

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

	// ── Navigation Context Menu ──────────────────────────────
	const navCtxMenu = createWorkbenchContextMenu();

	function makeNavContextMenu(href: string): (e: MouseEvent) => void {
		return (e: MouseEvent) => {
			e.preventDefault();
			const items: ContextMenuItem[] = [
				{
					id: 'open-new-tab',
					label: 'In neuem Tab öffnen',
					action: () => window.open(href, '_blank'),
				},
				{
					id: 'copy-link',
					label: 'Link kopieren',
					action: () => navigator.clipboard.writeText(window.location.origin + href),
				},
			];
			navCtxMenu.open(e, href, items);
		};
	}

	// ── Navigation ──────────────────────────────────────────
	let baseNavItems = $derived<PillNavItem[]>([
		{
			href: '/',
			label: $_('nav.tags'),
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
		{ href: '/', label: $_('nav.home'), icon: 'home', onContextMenu: makeNavContextMenu('/') },
		{
			href: '/spiral',
			label: $_('nav.spiral'),
			icon: 'spiral',
			onContextMenu: makeNavContextMenu('/spiral'),
		},
		{
			href: '/credits',
			label: $_('nav.credits'),
			icon: 'creditCard',
			onContextMenu: makeNavContextMenu('/credits'),
		},
		{
			href: '/profile',
			label: $_('nav.profile'),
			icon: 'user',
			onContextMenu: makeNavContextMenu('/profile'),
		},
		{
			href: '/settings',
			label: $_('nav.settings'),
			icon: 'settings',
			onContextMenu: makeNavContextMenu('/settings'),
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
	const reminderScheduler = createReminderScheduler({
		sources: [todoReminderSource],
	});

	async function handleSignOut() {
		unifiedSync?.stopAll();
		guestMode?.destroy();
		setErrorTrackingUser(null);
		await authStore.signOut();
		goto('/login');
	}

	// ── Guest Mode ──────────────────────────────────────────
	let guestMode = $state<GuestMode | null>(null);

	// ── Onboarding ──────────────────────────────────────────
	function handleOnboardingComplete() {
		onboardingStore.complete();
		ManaEvents.onboardingCompleted();
		showOnboarding = false;
	}

	function handleOnboardingSkip() {
		ManaEvents.onboardingSkipped(onboardingStore.currentStep);
		onboardingStore.skip();
		showOnboarding = false;
	}

	// ── Auth Ready (replaces monolith onMount) ──────────────
	async function handleAuthReady() {
		// Phase A: Auth-independent — guests + authenticated
		await Promise.all([
			manaStore.initialize(),
			tagLocalStore.initialize(),
			linkLocalStore.initialize(),
		]);
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
			unifiedSync.onStatusChange(async (s) => {
				networkStore.setSyncStatus(s);
				// Update pending count when sync status changes
				try {
					const count = await db.table('_pendingChanges').count();
					networkStore.setPendingCount(count);
				} catch {
					// DB not ready yet
				}
			});
			unifiedSync.startAll();

			userSettings.load().catch(() => {});

			onboardingStore.load();
			if (onboardingStore.shouldShow) {
				onboardingStore.start();
				ManaEvents.onboardingStarted();
				showOnboarding = true;
			}
		}

		// Phase B2: Start reminder scheduler
		reminderScheduler.start();
		notificationService.requestPermission();

		// Phase C: Guest mode — welcome modal + nudge
		if (!authStore.isAuthenticated) {
			markAsGuest();
			guestMode = createGuestMode('mana', {
				nudgeDelayMinutes: 3,
				onRegister: () => goto('/register'),
			});
		}
	}

	onDestroy(() => {
		unifiedSync?.stopAll();
		reminderScheduler.stop();
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

		// Track module usage + ensure lazy sync for this module
		const moduleName = pathname.split('/')[1];
		if (moduleName && authStore.isAuthenticated) {
			trackModuleUsed(moduleName);
			unifiedSync?.ensureAppSynced(moduleName);
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
		{ id: 'home', label: 'Home', category: 'Navigation', onExecute: () => goto('/') },
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
	appName="Mana"
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
		<!-- Bottom Stack: all fixed-bottom elements in one flex container -->
		<div class="bottom-stack" style:--bottom-chrome-height="{bottomChromeHeight}px">
			<!-- Guest nudge — sits above the input bar, fades with the stack -->
			{#if guestMode && guestMode.notifications.length > 0}
				<div class="bottom-stack-notification">
					<NotificationBar notifications={guestMode.notifications} />
				</div>
			{/if}

			<!-- QuickInputBar with inline nav toggle -->
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
				positioning="static"
			>
				{#snippet rightAction()}
					<button
						class="pill-nav-toggle"
						onclick={() => handleCollapsedChange(!isCollapsed)}
						title={isCollapsed ? 'Navigation einblenden' : 'Navigation ausblenden'}
					>
						<span class="pill-nav-toggle-icon" class:collapsed={isCollapsed}>▼</span>
					</button>
				{/snippet}
			</QuickInputBar>

			<!-- TagStrip (between QuickInputBar and PillNav) -->
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
					positioning="static"
				/>
			{/if}

			<!-- PillNav (bottom of stack) -->
			<PillNavigation
				items={navItems}
				currentPath={$page.url.pathname}
				appName="Mana"
				homeRoute="/"
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
				positioning="static"
			/>
		</div>

		<!-- DnD: floating preview -->
		<DragPreview />

		<!-- Main content -->
		<main style="padding-bottom: {bottomChromeHeight + 32}px">
			<div class="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
				{@render children()}
			</div>
		</main>

		<!-- Session expiry warning (auth only) -->
		{#if authStore.isAuthenticated}
			<SessionWarning />
		{/if}

		<!-- Keyboard shortcuts modal -->
		<KeyboardShortcutsModal open={showShortcuts} onclose={() => (showShortcuts = false)} />
	</div>

	<!-- Navigation Context Menu -->
	<ContextMenu
		visible={navCtxMenu.state.visible}
		x={navCtxMenu.state.x}
		y={navCtxMenu.state.y}
		items={navCtxMenu.items}
		onClose={() => navCtxMenu.close()}
	/>

	<!-- Guest Welcome Modal -->
	{#if guestMode}
		<GuestWelcomeModal
			appId="mana"
			visible={guestMode.showWelcome}
			onClose={() => guestMode?.dismissWelcome()}
			onLogin={() => goto('/login')}
			onRegister={() => goto('/register')}
			locale={($locale || 'de') === 'de' ? 'de' : 'en'}
		/>
	{/if}
</AuthGate>

<style>
	.bottom-stack {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 90;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		pointer-events: none;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.bottom-stack > :global(*) {
		pointer-events: auto;
	}

	.pill-nav-toggle {
		width: 36px;
		height: 36px;
		flex-shrink: 0;
		border-radius: 50%;
		border: none;
		background: hsl(var(--color-foreground, 0 0% 90%) / 0.08);
		color: hsl(var(--color-foreground, 0 0% 90%) / 0.4);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.15s ease,
			color 0.15s ease;
		padding: 0;
	}

	.pill-nav-toggle:hover {
		background: hsl(var(--color-foreground, 0 0% 90%) / 0.15);
		color: hsl(var(--color-foreground, 0 0% 90%) / 0.7);
	}

	.pill-nav-toggle-icon {
		font-size: 11px;
		transition: transform 0.3s ease;
		display: inline-block;
	}

	.pill-nav-toggle-icon.collapsed {
		transform: rotate(180deg);
	}

	.bottom-stack-notification {
		display: flex;
		justify-content: center;
		padding: 0 1rem 0.5rem;
	}
</style>
