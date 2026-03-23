<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
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
		QuickInputItem,
		CreatePreview,
	} from '@manacore/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { todoSettings } from '$lib/stores/settings.svelte';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { labelsStore } from '$lib/stores/labels.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { theme } from '$lib/stores/theme';
	import FilterStrip from '$lib/components/FilterStrip.svelte';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { filterHiddenNavItems } from '@manacore/shared-theme';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { getTasks } from '$lib/api/tasks';
	import { parseTaskInput, resolveTaskIds, formatParsedTaskPreview } from '$lib/utils/task-parser';
	import { todoOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { TodoEvents } from '@manacore/shared-utils/analytics';

	// App switcher items
	const appItems = getPillAppItems('todo');

	// Split-Panel Store für Split-Screen Feature
	const splitPanel = setSplitPanelContext('todo', DEFAULT_APPS);

	// Handler für Split-Screen Panel-Öffnung
	function handleOpenInPanel(appId: string, url: string) {
		splitPanel.openPanel(appId);
	}

	let { children } = $props();

	// QuickInputBar search - search tasks
	async function handleSearch(query: string): Promise<QuickInputItem[]> {
		if (!query.trim()) return [];

		try {
			const tasks = await getTasks({ search: query });
			return tasks.slice(0, 10).map((task) => ({
				id: task.id,
				title: task.title,
				subtitle: task.isCompleted
					? '✓ Erledigt'
					: task.dueDate
						? new Date(task.dueDate).toLocaleDateString('de-DE')
						: 'Kein Datum',
			}));
		} catch {
			return [];
		}
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
			const resolved = resolveTaskIds(parsed, projectsStore.projects, labelsStore.labels);

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

	// User email for user dropdown
	let userEmail = $derived(authStore.user?.email || 'Menü');

	// Toggle FilterStrip visibility
	function handleFilterToggle() {
		todoSettings.toggleFilterStrip();
	}

	// Base navigation items for Todo
	// Note: Filter uses onClick to toggle FilterStrip visibility instead of navigating
	let baseNavItems = $derived<PillNavItem[]>([
		{ href: '/', label: 'Liste', icon: 'list' },
		{ href: '/kanban', label: 'Kanban', icon: 'columns' },
		{
			href: '/',
			label: 'Filter',
			icon: 'filter',
			onClick: handleFilterToggle,
			active: isFilterStripVisible,
		},
		{ href: '/tags', label: 'Tags', icon: 'tag' },
	]);

	// Navigation items filtered by visibility settings (with fallback for guest mode)
	const navItems = $derived(
		filterHiddenNavItems('todo', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	// Navigation shortcuts (Ctrl+1-6) - use base items for consistent shortcuts
	let navRoutes = $derived(baseNavItems.map((item) => item.href));

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
		projectsStore.clear();
		labelsStore.clear();
		goto('/login');
	}

	onMount(async () => {
		// Initialize auth and redirect if not authenticated
		await authStore.initialize();
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Initialize split-panel from URL/localStorage
		splitPanel.initialize();

		// Initialize todo settings
		todoSettings.initialize();

		// Load projects, labels, and user settings
		await projectsStore.fetchProjects();
		await Promise.all([labelsStore.fetchLabels(), userSettings.load()]);

		// Redirect to start page if on root and a custom start page is set
		const currentPath = window.location.pathname;
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
	});
</script>

<svelte:window onkeydown={handleKeydown} />

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
					showLogout={true}
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
					onOpenInPanel={handleOpenInPanel}
					ariaLabel="Hauptnavigation"
				/>

				<!-- FilterStrip (shown when Filter pill is active in PillNav) -->
				{#if isFilterStripVisible}
					<FilterStrip />
				{/if}
			{/if}

			<!-- Global Quick Input Bar -->
			<QuickInputBar
				onSearch={handleSearch}
				onSelect={handleSelect}
				placeholder="Neue Aufgabe oder suchen..."
				emptyText="Keine Aufgaben gefunden"
				searchingText="Suche..."
				onCreate={handleCreate}
				onParseCreate={handleParseCreate}
				createText="Erstellen"
				appIcon="todo"
				hasFabRight={true}
				bottomOffset={isPillNavCollapsed ? '16px' : isFilterStripVisible ? '140px' : '70px'}
			/>

			<!-- FAB to toggle PillNav visibility -->
			<button
				class="pillnav-fab"
				onclick={handlePillNavToggle}
				title={isPillNavCollapsed ? 'Navigation anzeigen' : 'Navigation ausblenden'}
				aria-label={isPillNavCollapsed ? 'Navigation anzeigen' : 'Navigation ausblenden'}
			>
				{#if isPillNavCollapsed}
					<!-- Menu icon -->
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="fab-icon">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				{:else}
					<!-- Close icon -->
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="fab-icon">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
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
			<div
				class="content-wrapper"
				class:full-width={$page.url.pathname === '/kanban'}
				class:immersive={todoSettings.immersiveModeEnabled}
			>
				{@render children()}
			</div>
		</main>
		<!-- Onboarding Modal -->
		{#if todoOnboarding.shouldShow}
			<MiniOnboardingModal store={todoOnboarding} appName="Todo" appEmoji="✅" />
		{/if}
	</div>
</SplitPaneContainer>

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

	.content-wrapper {
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
		padding: 1rem;
	}

	.content-wrapper.full-width {
		max-width: none;
		padding-left: 0;
		padding-right: 0;
	}

	@media (min-width: 640px) {
		.content-wrapper {
			padding: 1.5rem;
		}
		.content-wrapper.full-width {
			padding-left: 0;
			padding-right: 0;
		}
	}

	@media (min-width: 1024px) {
		.content-wrapper {
			padding: 2rem;
		}
		.content-wrapper.full-width {
			padding-left: 0;
			padding-right: 0;
		}
	}

	/* Mobile: More space for QuickInputBar + PillNav */
	@media (max-width: 768px) {
		.main-content {
			padding-bottom: calc(150px + env(safe-area-inset-bottom));
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
