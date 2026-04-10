<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import { onDestroy, setContext } from 'svelte';
	import { createReminderScheduler } from '@mana/shared-stores';
	import { todoReminderSource } from '$lib/modules/todo/reminder-source';
	import KeyboardShortcutsModal from '$lib/components/KeyboardShortcutsModal.svelte';
	import SessionWarning from '$lib/components/SessionWarning.svelte';
	import EncryptionIntroBanner from '$lib/components/EncryptionIntroBanner.svelte';
	import { bottomBarStore } from '$lib/stores/bottom-bar.svelte';
	import SuggestionToast from '$lib/components/SuggestionToast.svelte';
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
	import { MANA_APPS, hasAppAccess, ACCESS_TIER_LABELS } from '@mana/shared-branding';
	import type { AccessTier } from '@mana/shared-branding';
	import { createGuestMode, type GuestMode } from '$lib/stores/guest-mode.svelte';
	import { guestPrompt, setGuestPromptNavigator } from '$lib/stores/guest-prompt.svelte';
	import { NotificationBar } from '@mana/shared-ui';
	import { tagLocalStore, tagMutations, useAllTags } from '@mana/shared-stores';
	import { linkLocalStore, linkMutations } from '@mana/shared-links';
	import { manaStore } from '$lib/data/local-store';
	import { startLlmQueue, stopLlmQueue } from '$lib/llm-queue';
	import { llmSettingsState, updateLlmSettings, tierLabel, type LlmTier } from '@mana/shared-llm';
	import { isLocalLlmSupported, getLocalLlmStatus, loadLocalLlm } from '@mana/local-llm';
	import {
		startMemoroLlmWatcher,
		stopMemoroLlmWatcher,
	} from '$lib/modules/memoro/llm-watcher.svelte';
	import { createUnifiedSync } from '$lib/data/sync';
	import { syncBilling } from '$lib/stores/sync-billing.svelte';
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
	import { setLocale, supportedLocales, type SupportedLocale } from '$lib/i18n';
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

	// ── Per-route tier gate ─────────────────────────────────
	// AuthGate (the wrapping component) only checks tiers onMount and only
	// for authenticated users — so a guest typing /dreams into the URL bar
	// or a public-tier user navigating into a founder module would slip
	// past silently. This reactive check looks up the first path segment
	// in MANA_APPS, and if that app has a requiredTier the current user
	// (or guest) doesn't meet, we render a denial panel instead of the
	// routed view.
	//
	// Routes that don't map to a MANA_APPS id (settings, profile, admin,
	// help, …) fall through with `routeAppId === null` and are never
	// blocked here. Workbench `/` (empty first segment) likewise passes
	// through — soft-filtering of openApps happens in (app)/+page.svelte.
	let routeAppId = $derived.by(() => {
		const seg = $page.url.pathname.split('/')[1] ?? '';
		if (!seg) return null;
		return MANA_APPS.find((a) => a.id === seg) ?? null;
	});
	let routeBlocked = $derived.by(() => {
		if (!routeAppId) return false;
		const tier = authStore.user?.tier ?? 'guest';
		return !hasAppAccess(tier, routeAppId.requiredTier);
	});
	let routeTierLabels = $derived.by(() => {
		const labels = ACCESS_TIER_LABELS[($locale || 'de') === 'de' ? 'de' : 'en'];
		const userTier = (authStore.user?.tier ?? 'guest') as AccessTier;
		const required = routeAppId?.requiredTier ?? ('public' as AccessTier);
		return {
			user: labels[userTier] ?? userTier,
			required: labels[required] ?? required,
		};
	});

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
		if (supportedLocales.includes(newLocale as SupportedLocale)) {
			setLocale(newLocale as SupportedLocale);
		}
		userSettings.updateGlobal({ locale: newLocale });
		AppEvents.languageChanged(newLocale);
	}

	// Sync locale from user settings (backend) after login
	$effect(() => {
		if (userSettings.loaded && userSettings.locale) {
			const settingsLocale = userSettings.locale;
			if (
				supportedLocales.includes(settingsLocale as SupportedLocale) &&
				settingsLocale !== $locale
			) {
				setLocale(settingsLocale as SupportedLocale);
			}
		}
	});
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// ── AI Tier Selector (PillNav dropdown) ─────────────────
	const webgpuSupported = isLocalLlmSupported();
	const localLlmStatus = getLocalLlmStatus();
	const llmSettings = $derived(llmSettingsState.current);

	function toggleAiTier(tier: LlmTier) {
		const current = llmSettings.allowedTiers;
		const next = current.includes(tier)
			? current.filter((t: LlmTier) => t !== tier)
			: [...current, tier];
		updateLlmSettings({ allowedTiers: next });
	}

	const TIER_TOGGLE_LIST: Array<{ tier: LlmTier; shortLabel: string }> = [
		{ tier: 'browser', shortLabel: 'Browser (Gemma 4)' },
		{ tier: 'mana-server', shortLabel: 'Server (Gemma 4)' },
		{ tier: 'cloud', shortLabel: 'Cloud (Gemini)' },
	];

	let aiTierItems = $derived<PillDropdownItem[]>([
		// Tier toggles
		...TIER_TOGGLE_LIST.filter((t) => t.tier !== 'browser' || webgpuSupported).map((t) => ({
			id: `ai-tier-${t.tier}`,
			label: t.shortLabel,
			active: llmSettings.allowedTiers.includes(t.tier),
			onClick: () => toggleAiTier(t.tier),
		})),
		// Browser model status / load button
		...(llmSettings.allowedTiers.includes('browser') && webgpuSupported
			? [
					{
						id: 'ai-browser-status',
						label:
							localLlmStatus.current.state === 'ready'
								? '✓ Modell geladen'
								: localLlmStatus.current.state === 'downloading'
									? `Lade… ${((localLlmStatus.current as { progress: number }).progress * 100).toFixed(0)}%`
									: 'Modell laden (~500 MB)',
						disabled: localLlmStatus.current.state === 'ready',
						onClick:
							localLlmStatus.current.state !== 'ready' ? () => void loadLocalLlm() : undefined,
					},
				]
			: []),
		// Divider + settings link
		{ id: 'ai-divider', label: '', divider: true },
		{
			id: 'ai-settings',
			label: 'KI-Einstellungen',
			icon: 'settings',
			onClick: () => goto('/settings'),
		},
	]);

	let currentAiTierLabel = $derived.by(() => {
		const active = llmSettings.allowedTiers;
		if (active.length === 0) return 'Aus';
		// Show the first (privacy-sorted) tier's short name
		const sorted = [...active].sort(
			(a, b) =>
				TIER_TOGGLE_LIST.findIndex((t) => t.tier === a) -
				TIER_TOGGLE_LIST.findIndex((t) => t.tier === b)
		);
		const first = TIER_TOGGLE_LIST.find((t) => t.tier === sorted[0]);
		return first ? first.shortLabel.split(' (')[0] : 'KI';
	});

	// ── Sync status dropdown ────────────────────────────────
	let syncStatusItems = $derived.by(() => {
		const items: import('@mana/shared-ui').PillDropdownItem[] = [];

		if (syncBilling.active) {
			items.push({
				id: 'sync-active',
				label: 'Cloud Sync aktiv',
				icon: 'cloudCheck',
				active: true,
				disabled: true,
			});
			if (syncBilling.nextChargeAt) {
				const date = new Date(syncBilling.nextChargeAt).toLocaleDateString('de-DE', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
				});
				items.push({
					id: 'sync-next',
					label: `Nächste Abbuchung: ${date}`,
					disabled: true,
				});
			}
		} else if (syncBilling.paused) {
			items.push({
				id: 'sync-paused',
				label: 'Sync pausiert — Credits aufladen',
				icon: 'warning',
				onClick: () => goto('/credits?tab=packages'),
			});
		} else {
			items.push({
				id: 'sync-inactive',
				label: 'Sync aktivieren',
				icon: 'cloudArrowUp',
				onClick: () => goto('/settings/sync'),
			});
			items.push({
				id: 'sync-info',
				label: 'Nur lokal — ab 30 Credits/Monat',
				disabled: true,
			});
		}

		items.push({ id: 'sync-divider', label: '', divider: true });
		items.push({
			id: 'sync-settings',
			label: 'Sync-Einstellungen',
			icon: 'gear',
			onClick: () => goto('/settings/sync'),
		});

		return items;
	});

	let currentSyncLabel = $derived(
		syncBilling.loading
			? '...'
			: syncBilling.active
				? 'Sync'
				: syncBilling.paused
					? 'Pausiert'
					: 'Lokal'
	);

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
	const bottomChromeHeight = $derived(
		(isCollapsed ? 0 : 80) + (isTagStripVisible ? 44 : 0) + 72 + (bottomBarStore.component ? 36 : 0)
	);

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
			(window as unknown as Record<string, unknown>).__PUBLIC_SYNC_SERVER_URL__) ||
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
		// Wire the unified guest-prompt singleton to SvelteKit's `goto`
		// so the "Anmelden" button does a client-side transition instead
		// of the default full-page reload. Idempotent — safe to call on
		// every auth-ready cycle. If the user signs in successfully,
		// drop any leftover guest prompts so the bottom bar starts the
		// authenticated session clean.
		setGuestPromptNavigator((href) => goto(href));
		if (authStore.isAuthenticated) guestPrompt.clear();

		// Phase A: Auth-independent — guests + authenticated
		await Promise.all([
			manaStore.initialize(),
			tagLocalStore.initialize(),
			linkLocalStore.initialize(),
		]);
		initSharedUload();
		await dashboardStore.initialize();

		// Start the persistent LLM task queue. Idempotent — safe to call
		// repeatedly. The queue picks up any tasks left in 'pending' state
		// from previous sessions (and reclaims orphaned 'running' rows
		// from a crashed session) before going idle. See $lib/llm-queue.ts.
		startLlmQueue();

		// Module-side LLM result watchers. Each subscribes via Dexie
		// liveQuery to completed task rows tagged for its module and
		// writes the results back to the module's own collection
		// (e.g. memoro auto-titles → memo.title). Idempotent.
		startMemoroLlmWatcher();

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
			await syncBilling.load();
			const getToken = () => authStore.getValidToken();
			unifiedSync = createUnifiedSync(SYNC_SERVER_URL, getToken, syncBilling.active);
			// Expose on window for SYNC_DEBUG.md (Schritt C). Not a security
			// concern: every method on the returned object is also reachable
			// via Dexie + a fresh fetch from the same DevTools console, and
			// the production user can't escalate anything by poking at it.
			if (typeof window !== 'undefined') {
				(window as unknown as { __unifiedSync: typeof unifiedSync }).__unifiedSync = unifiedSync;
			}
			const refreshPendingCount = async () => {
				try {
					const count = await db.table('_pendingChanges').count();
					networkStore.setPendingCount(count);
				} catch {
					// DB not ready yet
				}
			};
			unifiedSync.onStatusChange(async (s) => {
				networkStore.setSyncStatus(s);
				// Update pending count when sync status changes
				await refreshPendingCount();
			});
			unifiedSync.onBillingRequired(() => {
				// Server returned 402 — sync subscription expired or paused
				syncBilling.load();
			});
			unifiedSync.startAll();
			// Seed the badge count on mount: onStatusChange only fires on
			// transitions, so without this the badge stays at its last known
			// value (0 on a fresh tab) until a sync actually runs.
			refreshPendingCount();

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
		// IMPORTANT: do NOT call notificationService.requestPermission() here.
		// Browsers (Chrome/Firefox) require permission requests to come from
		// a user gesture. Calling it at mount time queues the prompt until
		// the next click, which means the FIRST click on any button (e.g.
		// the dreams "Traum sprechen" mic button) shows a notification
		// permission popup instead of the action the user actually clicked
		// — and getUserMedia() / other permission requests get silently
		// dropped because Chrome only shows one permission dialog at a time.
		//
		// Notification permission must be requested from a button the user
		// explicitly clicks ("Benachrichtigungen aktivieren" toggle in
		// Settings, or first time a reminder is created). The reminder
		// scheduler still runs without permission — it just won't fire
		// OS notifications until the user grants it.

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
		// Fire-and-forget — we don't need to await; the in-flight task
		// will finish in the background and the next page session will
		// pick up where we left off.
		void stopLlmQueue();
		stopMemoroLlmWatcher();
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
			<!-- Page-injected bottom bar (e.g. workbench scene+app tabs) -->
			{#if bottomBarStore.component}
				{@const BarComponent = bottomBarStore.component}
				<BarComponent {...bottomBarStore.props} />
			{/if}

			<!-- One-time encryption intro — sits at the top of the stack so
				 it can't be obscured by the QuickInputBar / TagStrip / PillNav.
				 Self-gates on isVaultUnlocked() so guests never see it. -->
			<div class="bottom-stack-notification">
				<EncryptionIntroBanner />
			</div>

			<!-- Sync pause banner — shown when sync was paused due to insufficient credits -->
			{#if syncBilling.paused}
				<div class="bottom-stack-notification">
					<div
						class="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
					>
						<span>Cloud Sync pausiert — Credits reichen nicht aus.</span>
						<div class="flex gap-2">
							<a href="/credits?tab=packages" class="font-medium underline hover:no-underline">
								Credits aufladen
							</a>
							<a href="/settings/sync" class="font-medium underline hover:no-underline">
								Sync-Einstellungen
							</a>
						</div>
					</div>
				</div>
			{/if}

			<!-- Guest notifications — combines the time-based nudge from
				 createGuestMode (one-shot after N minutes) with the
				 event-driven prompts pushed by guestPrompt.requireAccount
				 (e.g. server feature called while signed out, 401 from
				 the auth-aware fetch). Both flow into the same bar so
				 the user only ever sees one stripe instead of stacking. -->
			{#if (guestMode && guestMode.notifications.length > 0) || guestPrompt.notifications.length > 0}
				<div class="bottom-stack-notification">
					<NotificationBar
						notifications={[...(guestMode?.notifications ?? []), ...guestPrompt.notifications]}
					/>
				</div>
			{/if}

			<!-- Session expiry warning (auth only). Self-gates on the
				 secondsLeft countdown and only renders inside the stack
				 when actually warning, so the wrapper is no-op otherwise. -->
			{#if authStore.isAuthenticated}
				<div class="bottom-stack-notification">
					<SessionWarning />
				</div>
			{/if}

			<!-- Cross-module automation suggestions. Lives in the (app)
				 stack because automationsStore is an (app)-only module
				 and the toast doesn't make sense on auth/landing pages
				 anyway. Self-gates on visible state. -->
			<div class="bottom-stack-notification">
				<SuggestionToast />
			</div>

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
				showAiTierSelector={true}
				{aiTierItems}
				{currentAiTierLabel}
				showSyncStatus={authStore.isAuthenticated}
				{syncStatusItems}
				{currentSyncLabel}
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
				{#if routeBlocked && routeAppId}
					<!-- Per-route tier gate. The wrapping AuthGate only fires
						 onMount + only for authenticated users, so this is the
						 only place that catches direct URL navigation into a
						 gated module by a guest or under-tier user. -->
					<div class="flex min-h-[60vh] items-center justify-center p-6">
						<div
							class="w-full max-w-96 rounded-2xl border px-8 py-10 text-center shadow-sm"
							style:border-color="hsl(var(--border, 0 0% 90%))"
							style:background-color="hsl(var(--card, 0 0% 100%))"
						>
							<h1 class="mb-4 text-xl font-bold" style:color="hsl(var(--foreground, 0 0% 9%))">
								{routeAppId.name}
							</h1>
							<div class="mb-4 text-5xl">🔒</div>
							<p
								class="mb-6 text-[0.9375rem] leading-relaxed"
								style:color="hsl(var(--muted-foreground, 0 0% 45%))"
							>
								{($locale || 'de') === 'de'
									? 'Diese App ist aktuell in der geschlossenen '
									: 'This app is currently in closed '}<strong>{routeTierLabels.required}</strong
								>{($locale || 'de') === 'de' ? '-Phase.' : ' phase.'}
							</p>
							<div
								class="mb-6 flex flex-col gap-2 rounded-xl p-4"
								style:background-color="hsl(var(--muted, 0 0% 96%))"
							>
								<div class="flex items-center justify-between text-sm">
									<span style:color="hsl(var(--muted-foreground, 0 0% 45%))"
										>{($locale || 'de') === 'de' ? 'Dein Zugang:' : 'Your access:'}</span
									>
									<span class="font-semibold" style:color="hsl(var(--foreground, 0 0% 9%))"
										>{routeTierLabels.user}</span
									>
								</div>
								<div class="flex items-center justify-between text-sm">
									<span style:color="hsl(var(--muted-foreground, 0 0% 45%))"
										>{($locale || 'de') === 'de' ? 'Benötigt:' : 'Required:'}</span
									>
									<span class="font-semibold text-violet-500">{routeTierLabels.required}</span>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<button
									class="w-full cursor-pointer rounded-lg border-none px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
									style:background-color="hsl(var(--primary, 239 84% 67%))"
									style:color="hsl(var(--primary-foreground, 0 0% 100%))"
									onclick={() => goto('/')}
								>
									{($locale || 'de') === 'de' ? 'Zur Übersicht' : 'Back to overview'}
								</button>
								{#if !authStore.isAuthenticated}
									<button
										class="w-full cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
										style:border-color="hsl(var(--border, 0 0% 90%))"
										style:color="hsl(var(--foreground, 0 0% 9%))"
										onclick={() => goto('/login')}
									>
										{($locale || 'de') === 'de' ? 'Anmelden' : 'Sign in'}
									</button>
								{/if}
							</div>
						</div>
					</div>
				{:else}
					{@render children()}
				{/if}
			</div>
		</main>

		<!-- Session expiry warning lives inside .bottom-stack now (see above)
			 so it doesn't end up obscured by the QuickInputBar like
			 EncryptionIntroBanner used to be. -->

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
