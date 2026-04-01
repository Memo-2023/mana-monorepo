<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { setContext } from 'svelte';
	import { locale } from 'svelte-i18n';
	import {
		PillNavigation,
		QuickInputBar,
		ImmersiveModeToggle,
		BottomStack,
		MinimizedTabs,
	} from '@manacore/shared-ui';
	import {
		SplitPaneContainer,
		setSplitPanelContext,
		DEFAULT_APPS,
	} from '@manacore/shared-splitscreen';
	import type {
		PillNavItem,
		PillDropdownItem,
		PillNavElement,
		QuickInputItem,
		CreatePreview,
		SpotlightAction,
	} from '@manacore/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { todoSettings } from '$lib/stores/settings.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';
	import { linkLocalStore, linkMutations } from '@manacore/shared-links';
	import { theme } from '$lib/stores/theme';
	import TagStrip from '$lib/components/TagStrip.svelte';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { filterHiddenNavItems } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems, getManaApp } from '@manacore/shared-branding';
	import { parseTaskInput, resolveTaskIds, formatParsedTaskPreview } from '$lib/utils/task-parser';
	import { todoOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import {
		SessionExpiredBanner,
		AuthGate,
		GuestWelcomeModal,
		GuestRegistrationNudge,
	} from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { TodoEvents } from '@manacore/shared-utils/analytics';
	import { todoStore, taskCollection } from '$lib/data/local-store';
	import type { LocalBoardView } from '$lib/data/local-store';
	import { useAllTasks, useAllBoardViews } from '$lib/data/task-queries';
	import SyncIndicator from '$lib/components/SyncIndicator.svelte';
	import { List, X } from '@manacore/shared-icons';
	import { createMinimizedPagesContext } from '$lib/stores/minimized-pages.svelte';

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allTasks = useAllTasks();
	const allTags = useAllSharedTags();

	// ─── Board View Management ──────────────────────────────
	const boardViews = useAllBoardViews();

	// Use first board view as the single active view
	let activeView = $derived(boardViews.value[0] ?? null);

	// ─── Active Tag Filter (shared between TagStrip + BoardViewRenderer) ───
	let activeTagFilterIds = $state<string[]>([]);
	const activeTagFilter = {
		get ids() {
			return activeTagFilterIds;
		},
		set(ids: string[]) {
			activeTagFilterIds = ids;
		},
	};

	// Provide data to child components via Svelte context
	setContext('tasks', allTasks);
	setContext('tags', allTags);
	setContext('activeTagFilter', activeTagFilter);
	setContext('activeView', {
		get value() {
			return activeView;
		},
	});

	// Guest welcome modal state
	let showGuestWelcome = $state(false);

	function initGuestWelcome() {
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('todo')) {
			showGuestWelcome = true;
		}
	}

	// App switcher items (filtered by user's access tier)
	let appItems = $derived(getPillAppItems('todo', undefined, undefined, authStore.user?.tier));

	// Split-Panel Store für Split-Screen Feature
	const splitPanel = setSplitPanelContext('todo', DEFAULT_APPS);

	// Handler für Split-Screen Panel-Öffnung
	function handleOpenInPanel(appId: string, url: string) {
		splitPanel.openPanel(appId);
	}

	let { children } = $props();

	// QuickInputBar search - search tasks locally
	async function handleSearch(query: string): Promise<QuickInputItem[]> {
		if (!query.trim()) return [];

		const q = query.toLowerCase();
		return allTasks.value
			.filter(
				(task) =>
					task.title.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q)
			)
			.slice(0, 10)
			.map((task) => ({
				id: task.id,
				title: task.title,
				subtitle: task.isCompleted
					? '✓ Erledigt'
					: task.dueDate
						? new Date(task.dueDate).toLocaleDateString('de-DE')
						: 'Kein Datum',
			}));
	}

	function handleSelect(item: QuickInputItem) {
		goto(`/task/${item.id}`);
	}

	// QuickInputBar create - parse input and show preview
	function handleParseCreate(query: string): CreatePreview | null {
		if (!query.trim()) return null;

		const parsed = parseTaskInput(query);
		const preview = formatParsedTaskPreview(parsed);

		return {
			title: `"${parsed.title}" erstellen`,
			subtitle: preview || 'Neue Aufgabe',
		};
	}

	// QuickInputBar create - actually create the task
	async function handleCreate(query: string): Promise<void> {
		if (!query.trim()) return;

		try {
			const parsed = parseTaskInput(query);
			const resolved = resolveTaskIds(parsed, allTags.value);

			await tasksStore.createTask({
				title: resolved.title,
				dueDate: resolved.dueDate,
				priority: resolved.priority,
				labelIds: resolved.labelIds,
			});
			TodoEvents.quickAddUsed();
		} catch (error) {
			console.error('Failed to create task:', error);
		}
	}

	// PillNav collapsed state (controlled by FAB)
	let isPillNavCollapsed = $state(true);

	// FilterStrip visibility (toggle via Filter button in PillNav)
	let isFilterStripVisible = $derived(!todoSettings.filterStripCollapsed);

	// Minimized page tabs add extra height to the bottom bar stack
	let hasMinimizedTabs = $derived(minimizedPagesStore.hasPages);
	const MINIMIZED_TABS_HEIGHT = 36; // px

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
		locale.set(newLocale);
	}
	let languageItems = $derived(
		getLanguageDropdownItems(['de', 'en'], currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// User email for user dropdown — empty string for guests so PillNav shows login button
	let userEmail = $derived(authStore.isAuthenticated ? authStore.user?.email || 'Menü' : '');

	// Toggle TagStrip visibility
	function handleTagStripToggle() {
		todoSettings.toggleFilterStrip();
	}

	// Keep navRoutes for keyboard shortcuts (Ctrl+1-3)
	const viewRoutes: Record<string, string> = { fokus: '/' };

	// Tags pill (toggle behavior, not navigation)
	let baseNavItems = $derived<PillNavItem[]>([
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isFilterStripVisible,
		},
	]);

	// Navigation items filtered by visibility settings (with fallback for guest mode)
	const navItems = $derived(
		filterHiddenNavItems('todo', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	// Navigation shortcuts (Ctrl+1-3) - use view routes for consistent shortcuts
	let navRoutes = $derived(Object.values(viewRoutes));

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
					TodoEvents.keyboardShortcutUsed(`ctrl+${num}`);
					goto(route);
				}
			}
		}

		// F = Toggle Immersive Mode (no modifier keys)
		if (
			(event.key === 'f' || event.key === 'F') &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.shiftKey &&
			!event.altKey
		) {
			event.preventDefault();
			TodoEvents.keyboardShortcutUsed('f-immersive');
			todoSettings.toggleImmersiveMode();
		}
	}

	// Toggle PillNav visibility (called by FAB)
	function handlePillNavToggle() {
		isPillNavCollapsed = !isPillNavCollapsed;
		try {
			localStorage?.setItem('todo-pillnav-collapsed', String(isPillNavCollapsed));
		} catch {
			// localStorage not available or quota exceeded
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
		linkMutations.stopSync();
		goto('/login');
	}

	const spotlightActions: SpotlightAction[] = [
		{
			id: 'new-task',
			label: 'Neue Aufgabe',
			icon: 'plus',
			shortcut: 'N',
			category: 'Erstellen',
			onExecute: () => goto('/'),
		},
		{
			id: 'settings',
			label: 'Einstellungen',
			category: 'Navigation',
			onExecute: () => goto('/settings'),
		},
		{
			id: 'tags',
			label: 'Tags verwalten',
			category: 'Navigation',
			onExecute: () => goto('/tags'),
		},
	];

	async function handleAuthReady() {
		// Initialize local-first databases (opens IndexedDB, seeds guest data)
		await Promise.all([
			todoStore.initialize(),
			tagLocalStore.initialize(),
			linkLocalStore.initialize(),
		]);

		// If authenticated, start syncing to server
		if (authStore.isAuthenticated) {
			const getToken = () => authStore.getValidToken();
			todoStore.startSync(getToken);
			tagMutations.startSync(getToken);
			linkMutations.startSync(getToken);
		}

		// Initialize split-panel from URL/localStorage
		splitPanel.initialize();

		// Initialize todo settings
		todoSettings.initialize();

		// Show guest welcome modal on first visit
		initGuestWelcome();

		// Tags and projects are now loaded reactively via useLiveQuery — no fetch needed

		// User settings need auth
		if (authStore.isAuthenticated) {
			await userSettings.load();
		}

		// Redirect to start page if on root and a custom start page is set
		if ($page.url.pathname === '/' && userSettings.startPage && userSettings.startPage !== '/') {
			goto(userSettings.startPage, { replaceState: true });
		}

		// Initialize PillNav collapsed state from localStorage
		try {
			const savedPillNavCollapsed = localStorage?.getItem('todo-pillnav-collapsed');
			if (savedPillNavCollapsed === 'false') {
				isPillNavCollapsed = false;
			}
		} catch {
			// localStorage not available
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<AuthGate
	{authStore}
	{goto}
	allowGuest={true}
	onReady={handleAuthReady}
	requiredTier={getManaApp('todo')?.requiredTier}
	appName={getManaApp('todo')?.name}
>
	<SplitPaneContainer>
		<div class="layout-container">
			<a
				href="#main-content"
				class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
				data-umami-event="skip-to-content"
			>
				Zum Inhalt springen
			</a>

			<!-- UI Elements (hidden in immersive mode) -->
			{#if !todoSettings.immersiveModeEnabled}
				<!-- PillNav (shown/hidden via FAB) -->
				{#if !isPillNavCollapsed}
					<PillNavigation
						items={navItems}
						currentPath={$page.url.pathname}
						appName="Todo"
						homeRoute="/"
						onToggleTheme={handleToggleTheme}
						{isDark}
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
						primaryColor="#8b5cf6"
						showAppSwitcher={true}
						{appItems}
						{userEmail}
						settingsHref="/settings"
						manaHref="/mana"
						profileHref="/profile"
						allAppsHref="/apps"
						themesHref="/themes"
						spiralHref="/spiral"
						helpHref="/help"
						onOpenInPanel={handleOpenInPanel}
						ariaLabel="Hauptnavigation"
						{spotlightActions}
					/>

					<!-- Tag strip (toggled via Tags pill) -->
					{#if isFilterStripVisible}
						<TagStrip />
					{/if}
				{/if}

				<!-- Minimized Page Tabs (between PillNav and QuickInputBar) -->
				{#if hasMinimizedTabs}
					<div
						class="minimized-tabs-bar"
						style="--tabs-bottom: {(() => {
							let offset = 16;
							if (!isPillNavCollapsed) offset += 68;
							if (!isPillNavCollapsed && isFilterStripVisible) offset += 50;
							return `${offset}px`;
						})()}"
					>
						<div class="minimized-tabs-inner">
							{#each minimizedPagesStore.pages as pg (pg.id)}
								<div
									class="minimized-tab"
									role="button"
									tabindex="0"
									onclick={() => {
										window.dispatchEvent(new CustomEvent('restore-page', { detail: pg.id }));
									}}
								>
									<span class="minimized-tab-dot" style="background-color: {pg.color}"></span>
									<span class="minimized-tab-title">{pg.title}</span>
									<button
										class="minimized-tab-close"
										onclick={(e) => {
											e.stopPropagation();
											window.dispatchEvent(new CustomEvent('remove-page', { detail: pg.id }));
										}}
										title="Schließen"
									>
										<X size={10} />
									</button>
								</div>
							{/each}
							<button
								class="minimized-tab-add"
								onclick={() => window.dispatchEvent(new CustomEvent('toggle-page-picker'))}
								title="Neue Seite hinzufügen"
							>
								<Plus size={14} />
							</button>
						</div>
					</div>
				{/if}

				<!-- Global Quick Input Bar -->
				{#if $page.url.pathname === '/'}
					<QuickInputBar
						onSearch={handleSearch}
						onSelect={handleSelect}
						placeholder="Neue Aufgabe oder suchen..."
						emptyText="Keine Aufgaben gefunden"
						searchingText="Suche..."
						searchText="Suchen"
						onCreate={handleCreate}
						onParseCreate={handleParseCreate}
						createText="Erstellen"
						deferSearch={true}
						locale={$locale || 'de'}
						appIcon="todo"
						hasFabRight={true}
						bottomOffset={(() => {
							let offset = 16;
							if (!isPillNavCollapsed) offset += 68;
							if (!isPillNavCollapsed && isFilterStripVisible) offset += 50;
							if (hasMinimizedTabs) offset += MINIMIZED_TABS_HEIGHT;
							return `${offset}px`;
						})()}
					/>
				{/if}

				<!-- FAB to toggle PillNav visibility -->
				<button
					class="pillnav-fab"
					style="--fab-bottom: {(() => {
						let offset = 20;
						if (!isPillNavCollapsed) offset += 68;
						if (!isPillNavCollapsed && isFilterStripVisible) offset += 50;
						if (hasMinimizedTabs) offset += MINIMIZED_TABS_HEIGHT;
						return `${offset}px`;
					})()}"
					onclick={handlePillNavToggle}
					title={isPillNavCollapsed ? 'Navigation anzeigen' : 'Navigation ausblenden'}
					aria-label={isPillNavCollapsed ? 'Navigation anzeigen' : 'Navigation ausblenden'}
					data-umami-event="pillnav-toggle"
				>
					{#if isPillNavCollapsed}
						<!-- Menu icon -->
						<List size="48" weight="bold" />
					{:else}
						<!-- Close icon -->
						<X size="48" weight="bold" />
					{/if}
				</button>
			{/if}

			<!-- Immersive Mode Toggle (always visible) -->
			<ImmersiveModeToggle
				isImmersive={todoSettings.immersiveModeEnabled}
				onToggle={() => todoSettings.toggleImmersiveMode()}
			/>

			<main
				id="main-content"
				class="main-content bg-background"
				class:immersive={todoSettings.immersiveModeEnabled}
			>
				<!-- Sync status indicator (top right) -->
				<div class="sync-indicator-wrapper">
					<SyncIndicator />
				</div>
				<div
					class="content-wrapper"
					class:full-width={false}
					class:immersive={todoSettings.immersiveModeEnabled}
				>
					{@render children()}
				</div>
			</main>
		</div>
	</SplitPaneContainer>

	<!-- Onboarding Modal -->
	{#if todoOnboarding.shouldShow}
		<MiniOnboardingModal store={todoOnboarding} appName="Todo" appEmoji="✅" />
	{/if}

	<!-- Guest Welcome Modal -->
	<GuestWelcomeModal
		appId="todo"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale={($locale || 'de') === 'de' ? 'de' : 'en'}
	/>

	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale={$locale || 'de'} loginHref="/login" />
	{:else}
		<GuestRegistrationNudge
			appId="todo"
			onRegister={() => goto('/register')}
			locale={($locale || 'de') === 'de' ? 'de' : 'en'}
			delayMinutes={3}
		/>
	{/if}
</AuthGate>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		transition: all 300ms ease;
		position: relative;
		/* Space for QuickInputBar at bottom */
		padding-bottom: calc(80px + env(safe-area-inset-bottom));
	}

	/* Immersive mode - fullscreen, no padding */
	.main-content.immersive {
		padding: 0 !important;
		height: 100vh;
		width: 100vw;
	}

	.content-wrapper.immersive {
		padding: 0;
		max-width: none;
		height: 100%;
	}

	.sync-indicator-wrapper {
		position: absolute;
		top: 0.5rem;
		right: 0.75rem;
		z-index: 10;
	}

	.content-wrapper {
		max-width: none;
		margin-left: auto;
		margin-right: auto;
		padding: 0;
	}

	.content-wrapper.full-width {
		max-width: none;
		padding-left: 0;
		padding-right: 0;
	}

	@media (min-width: 640px) {
		.content-wrapper.full-width {
			padding-left: 0;
			padding-right: 0;
		}
	}

	@media (min-width: 1024px) {
		.content-wrapper.full-width {
			padding-left: 0;
			padding-right: 0;
		}
	}

	/* Mobile: Space for QuickInputBar + PillNav */
	@media (max-width: 768px) {
		.main-content {
			padding-bottom: calc(100px + env(safe-area-inset-bottom));
		}
	}

	/* FAB to toggle PillNav — sits right next to the centered QuickInputBar */
	.pillnav-fab {
		position: fixed;
		bottom: calc(var(--fab-bottom, 16px) + env(safe-area-inset-bottom, 0px));
		/* Anchor to center, then offset by half of InputBar max-width (350px) + gap */
		left: calc(50% + 350px + 0.75rem);
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--color-surface-elevated-2);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-xl);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1002;
		transition: all 0.2s ease;
	}

	/* On narrower screens, FAB sits at the right edge of the padded input area */
	@media (max-width: 900px) {
		.pillnav-fab {
			left: auto;
			right: 1rem;
		}
	}

	.pillnav-fab:hover {
		transform: scale(1.05);
	}

	.pillnav-fab:active {
		transform: scale(0.95);
	}

	.pillnav-fab :global(svg) {
		color: var(--color-foreground);
	}

	/* ── Minimized Page Tabs Bar ─────────────────────────── */
	.minimized-tabs-bar {
		position: fixed;
		bottom: calc(var(--tabs-bottom, 16px) + env(safe-area-inset-bottom, 0px));
		left: 50%;
		transform: translateX(-50%);
		z-index: 1001;
	}

	.minimized-tabs-inner {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.3rem 0.5rem;
		background: var(--color-surface-elevated, #fffef5);
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
		border-radius: 0.625rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		overflow-x: auto;
		scrollbar-width: none;
	}
	:global(.dark) .minimized-tabs-inner {
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
	}
	.minimized-tabs-inner::-webkit-scrollbar {
		display: none;
	}

	.minimized-tab {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		border-radius: 0.3rem;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
		font-family: inherit;
	}
	.minimized-tab:hover {
		background: rgba(0, 0, 0, 0.05);
	}
	:global(.dark) .minimized-tab:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.minimized-tab-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.minimized-tab-title {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-muted-foreground, #6b7280);
	}

	.minimized-tab-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border: none;
		background: transparent;
		color: var(--color-muted-foreground, #d1d5db);
		border-radius: 0.125rem;
		cursor: pointer;
		padding: 0;
		transition: all 0.15s;
		opacity: 0.5;
	}
	.minimized-tab-close:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .minimized-tab-close:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.minimized-tab-add {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 0.3rem;
		border: none;
		background: transparent;
		color: var(--color-muted-foreground, #9ca3af);
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
		opacity: 0.6;
	}
	.minimized-tab-add:hover {
		opacity: 1;
		color: var(--color-primary, #8b5cf6);
	}
</style>
