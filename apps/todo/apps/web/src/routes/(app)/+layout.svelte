<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { setContext } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, QuickInputBar, ImmersiveModeToggle } from '@manacore/shared-ui';
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
	} from '@manacore/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { todoSettings } from '$lib/stores/settings.svelte';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';
	import { linkLocalStore, linkMutations } from '@manacore/shared-links';
	import { theme } from '$lib/stores/theme';
	import TaskFilters from '$lib/components/TaskFilters.svelte';
	import { viewStore, type SortBy } from '$lib/stores/view.svelte';
	import type { TaskPriority } from '@todo/shared';
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
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { TodoEvents } from '@manacore/shared-utils/analytics';
	import { todoStore, taskCollection } from '$lib/data/local-store';
	import type { LocalBoardView } from '$lib/data/local-store';
	import {
		useAllTasks,
		useAllProjects,
		useAllBoardViews,
		getActiveProjects,
	} from '$lib/data/task-queries';
	import SyncIndicator from '$lib/components/SyncIndicator.svelte';
	import { List, X } from '@manacore/shared-icons';

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allTasks = useAllTasks();
	const allProjects = useAllProjects();
	const allTags = useAllSharedTags();

	// ─── Board View Management ──────────────────────────────
	const boardViews = useAllBoardViews();

	// Use first board view as the single active view
	let activeView = $derived(boardViews.value[0] ?? null);

	// Provide data to child components via Svelte context
	setContext('projects', allProjects);
	setContext('tasks', allTasks);
	setContext('tags', allTags);
	setContext('activeView', {
		get value() {
			return activeView;
		},
	});

	// Edit mode state — shared between layout (PillNav button) and page (editor)
	let editMode = $state(false);
	setContext('editMode', {
		get active() {
			return editMode;
		},
		toggle() {
			editMode = !editMode;
		},
		set(val: boolean) {
			editMode = val;
		},
	});

	// Derived active projects for UI
	let activeProjects = $derived(getActiveProjects(allProjects.value));

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
			const resolved = resolveTaskIds(parsed, allProjects.value, allTags.value);

			await tasksStore.createTask({
				title: resolved.title,
				dueDate: resolved.dueDate,
				priority: resolved.priority,
				projectId: resolved.projectId,
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

	// Toggle FilterStrip visibility
	function handleFilterToggle() {
		todoSettings.toggleFilterStrip();
	}

	// View mode switching (state-based, not route-based)
	let viewTabGroup = $derived<PillNavElement>({
		type: 'tabs' as const,
		options: [
			{ id: 'fokus', icon: 'list', label: 'Fokus', title: 'Fokus-Ansicht' },
			{ id: 'uebersicht', icon: 'columns', label: 'Übersicht', title: 'Übersicht' },
			{ id: 'matrix', icon: 'grid', label: 'Matrix', title: 'Eisenhower-Matrix' },
		],
		value: todoSettings.activeLayoutMode,
		onChange: (id: string) => {
			todoSettings.set('activeLayoutMode', id as 'fokus' | 'uebersicht' | 'matrix');
			// Navigate to homepage if not already there
			if ($page.url.pathname !== '/') goto('/');
		},
	});

	// Keep navRoutes for keyboard shortcuts (Ctrl+1-3)
	const viewRoutes: Record<string, string> = { fokus: '/', uebersicht: '/', matrix: '/' };

	// Filter, Tags, and Layout stay as standalone pills (toggle behavior, not navigation)
	let baseNavItems = $derived<PillNavItem[]>([
		{
			href: '/',
			label: 'Filter',
			icon: 'filter',
			onClick: handleFilterToggle,
			active: isFilterStripVisible,
		},
		...($page.url.pathname === '/' || $page.url.pathname === ''
			? [
					{
						href: '/',
						label: editMode ? 'Fertig' : 'Layout',
						icon: editMode ? 'check' : 'grid',
						onClick: () => {
							editMode = !editMode;
						},
						active: editMode,
					},
				]
			: []),
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

		// Redirect /kanban to / with Übersicht mode
		const currentPath = window.location.pathname;
		if (currentPath === '/kanban') {
			todoSettings.set('activeLayoutMode', 'uebersicht');
			goto('/', { replaceState: true });
			return;
		}

		// Redirect to start page if on root and a custom start page is set
		if (currentPath === '/' && userSettings.startPage && userSettings.startPage !== '/') {
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
			>
				Zum Inhalt springen
			</a>

			<!-- UI Elements (hidden in immersive mode) -->
			{#if !todoSettings.immersiveModeEnabled}
				<!-- PillNav (shown/hidden via FAB) -->
				{#if !isPillNavCollapsed}
					<PillNavigation
						items={navItems}
						prependElements={[viewTabGroup]}
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
					/>

					<!-- Unified filter strip (tags + priorities + sort, toggled via Filter pill) -->
					{#if isFilterStripVisible}
						<TaskFilters
							variant="strip"
							selectedPriorities={viewStore.filterPriorities}
							selectedProjectId={viewStore.filterProjectId}
							selectedLabelIds={viewStore.filterLabelIds}
							searchQuery={viewStore.filterSearchQuery}
							onPrioritiesChange={(p: TaskPriority[]) => viewStore.setFilterPriorities(p)}
							onProjectChange={(id: string | null) => viewStore.setFilterProjectId(id)}
							onLabelsChange={(ids: string[]) => viewStore.setFilterLabelIds(ids)}
							onSearchChange={(q: string) => viewStore.setFilterSearchQuery(q)}
							onClearFilters={() => viewStore.clearFilters()}
							sortBy={viewStore.sortBy}
							onSortChange={(s: SortBy) => viewStore.setSort(s, viewStore.sortOrder)}
							showSort={true}
							showCompleted={true}
							showTags={true}
							isCompletedVisible={viewStore.showCompleted}
							onToggleCompleted={() => viewStore.toggleShowCompleted()}
						/>
					{/if}
				{/if}

				<!-- Global Quick Input Bar -->
				{#if $page.url.pathname === '/' || $page.url.pathname === '/statistics'}
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
						bottomOffset={isPillNavCollapsed ? '16px' : isFilterStripVisible ? '180px' : '110px'}
					/>
				{/if}

				<!-- FAB to toggle PillNav visibility -->
				<button
					class="pillnav-fab"
					onclick={handlePillNavToggle}
					title={isPillNavCollapsed ? 'Navigation anzeigen' : 'Navigation ausblenden'}
					aria-label={isPillNavCollapsed ? 'Navigation anzeigen' : 'Navigation ausblenden'}
				>
					{#if isPillNavCollapsed}
						<!-- Menu icon -->
						<List size={20} class="fab-icon" />
					{:else}
						<!-- Close icon -->
						<X size={20} class="fab-icon" />
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
					class:full-width={todoSettings.activeLayoutMode !== 'fokus'}
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

	/* FAB to toggle PillNav */
	.pillnav-fab {
		position: fixed;
		bottom: calc(16px + env(safe-area-inset-bottom, 0px));
		right: 1rem;
		width: 54px;
		height: 54px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 2px 4px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1002;
		transition: all 0.2s ease;
	}

	:global(.dark) .pillnav-fab {
		background: rgba(30, 30, 30, 0.9);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.pillnav-fab:hover {
		transform: scale(1.05);
		box-shadow:
			0 6px 16px rgba(0, 0, 0, 0.2),
			0 3px 6px rgba(0, 0, 0, 0.15);
	}

	.pillnav-fab:active {
		transform: scale(0.95);
	}

	.fab-icon {
		width: 24px;
		height: 24px;
		color: #374151;
	}

	:global(.dark) .fab-icon {
		color: #f3f4f6;
	}
</style>
