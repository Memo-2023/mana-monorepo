<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, InputBarHelpModal, ImmersiveModeToggle } from '@manacore/shared-ui';
	import {
		SplitPaneContainer,
		setSplitPanelContext,
		DEFAULT_APPS,
	} from '@manacore/shared-splitscreen';
	import type {
		PillNavItem,
		PillDropdownItem,
		QuickInputItem,
		PillTabGroupConfig,
		PillTagSelectorConfig,
		PillNavElement,
	} from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { eventTagsStore } from '$lib/stores/event-tags.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { birthdaysStore } from '$lib/stores/birthdays.svelte';
	import { browser } from '$app/environment';
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
	import { searchEvents } from '$lib/api/events';
	import { searchStore } from '$lib/stores/search.svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import type { CreatePreview } from '@manacore/shared-ui';
	import {
		parseEventInput,
		resolveEventIds,
		formatParsedEventPreview,
	} from '$lib/utils/event-parser';
	import { CALENDAR_SYNTAX, CALENDAR_LIVE_EXAMPLE } from '$lib/utils/syntax-help';
	import UnifiedBar from '$lib/components/calendar/UnifiedBar.svelte';
	import SettingsModal from '$lib/components/settings/SettingsModal.svelte';
	import VoiceRecordButton from '$lib/components/voice/VoiceRecordButton.svelte';
	import VoiceRecordingModal from '$lib/components/voice/VoiceRecordingModal.svelte';
	import { voiceRecordingStore } from '$lib/stores/voice-recording.svelte';
	import { calendarOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { SessionExpiredBanner } from '@manacore/shared-auth-ui';

	// App switcher items
	const appItems = getPillAppItems('calendar');

	// Split-Panel Store für Split-Screen Feature
	const splitPanel = setSplitPanelContext('calendar', DEFAULT_APPS);

	// Handler für Split-Screen Panel-Öffnung
	function handleOpenInPanel(appId: string, url: string) {
		splitPanel.openPanel(appId);
	}

	let { children } = $props();

	// Auth gate - prevent children from mounting before auth is confirmed
	let appReady = $state(false);

	// InputBar search - search events
	async function handleSearch(query: string): Promise<QuickInputItem[]> {
		if (!query.trim()) return [];

		const result = await searchEvents(query);
		if (result.error || !result.data) return [];

		return result.data.slice(0, 10).map((event) => ({
			id: event.id,
			title: event.title,
			subtitle: format(new Date(event.startTime), 'dd. MMM yyyy, HH:mm', { locale: de }),
		}));
	}

	function handleSelect(item: QuickInputItem) {
		searchStore.clear();
		goto(`/event/${item.id}`);
	}

	// Update search store when search changes (for calendar view highlighting)
	function handleSearchChange(query: string, results: QuickInputItem[]) {
		if (!query.trim()) {
			searchStore.clear();
		} else {
			searchStore.setSearch(query, results);
		}
	}

	// Quick-Create: parse input for preview
	function handleParseCreate(query: string): CreatePreview | null {
		if (!query.trim()) return null;

		const parsed = parseEventInput(query);
		if (!parsed.title && !parsed.startDate) return null;

		const preview = formatParsedEventPreview(parsed);
		return {
			title: `"${parsed.title || query.trim()}" erstellen`,
			subtitle: preview || 'Neuer Termin',
		};
	}

	// Quick-Create: create event from parsed input
	async function handleCreate(query: string): Promise<void> {
		if (!query.trim()) return;

		const parsed = parseEventInput(query);
		if (!parsed.title) return;

		const defaultCalendarId =
			calendarsStore.calendars.find((c) => c.isDefault)?.id || calendarsStore.calendars[0]?.id;

		const resolved = resolveEventIds(
			parsed,
			calendarsStore.calendars.map((c) => ({ id: c.id, name: c.name })),
			eventTagsStore.tags.map((t) => ({ id: t.id, name: t.name })),
			defaultCalendarId
		);

		if (!resolved.startTime) {
			// No date/time parsed - default to now + 1h
			const now = new Date();
			now.setMinutes(0, 0, 0);
			now.setHours(now.getHours() + 1);
			resolved.startTime = now.toISOString();
			const end = new Date(now.getTime() + 60 * 60_000);
			resolved.endTime = end.toISOString();
		}

		await eventsStore.createEvent({
			title: resolved.title,
			startTime: resolved.startTime,
			endTime: resolved.endTime!,
			isAllDay: resolved.isAllDay,
			calendarId: resolved.calendarId,
			location: resolved.location,
			tagIds: resolved.tagIds,
		});
	}

	// Mobile detection for responsive layout
	let isMobile = $state(false);

	function updateMobileState() {
		if (browser) {
			isMobile = window.innerWidth <= 640;
		}
	}

	// InputBar help modal state
	let helpModalOpen = $state(false);
	let helpModalMode = $state<'shortcuts' | 'syntax'>('shortcuts');

	// Settings modal state
	let showSettingsModal = $state(false);

	function handleShowShortcuts() {
		helpModalMode = 'shortcuts';
		helpModalOpen = true;
	}

	function handleShowSyntaxHelp() {
		helpModalMode = 'syntax';
		helpModalOpen = true;
	}

	function handleCloseHelpModal() {
		helpModalOpen = false;
	}

	// Default calendar for InputBar quick create
	let selectedDefaultCalendarId = $derived(
		calendarsStore.calendars.find((c) => c.isDefault)?.id || calendarsStore.calendars[0]?.id
	);

	function handleDefaultCalendarChange(id: string) {
		// Update the default calendar via API
		calendarsStore.setAsDefault(id);
	}

	// Calendar options for InputBar context menu
	let calendarOptions = $derived(
		calendarsStore.calendars.map((c) => ({
			id: c.id,
			label: c.name,
		}))
	);

	// Use theme store's isDark directly
	let isDark = $derived(theme.isDark);

	// Show toolbar only on calendar main page
	let showCalendarToolbar = $derived($page.url.pathname === '/');

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
	}
	let languageItems = $derived(
		getLanguageDropdownItems(supportedLocales, currentLocale, handleLocaleChange)
	);
	let currentLanguageLabel = $derived(getCurrentLanguageLabel(currentLocale));

	// User email for user dropdown
	let userEmail = $derived(authStore.user?.email || 'Menü');

	// Base navigation items for Calendar (without Kalender/Aufgaben - handled by tab group)
	// Tags are now in the tag-selector dropdown in prependElements
	let baseNavItems = $derived<PillNavItem[]>([
		{
			href: '/',
			label: 'Einstellungen',
			icon: 'settings',
			onClick: () => (showSettingsModal = true),
		},
	]);

	// Navigation items filtered by visibility settings (with fallback for guest mode)
	const navItems = $derived(
		filterHiddenNavItems('calendar', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	// Active tab based on sidebar state: 'tasks' when sidebar is open, 'calendar' when closed
	let activeTab = $derived(settingsStore.sidebarCollapsed ? 'calendar' : 'tasks');

	// Tab group for Kalender/Aufgaben
	let calendarTasksTabGroup = $derived<PillTabGroupConfig>({
		type: 'tabs',
		options: [
			{ id: 'calendar', icon: 'calendar', label: 'Kalender', title: 'Kalender anzeigen' },
			{ id: 'tasks', icon: 'check-square', label: 'Aufgaben', title: 'Aufgaben-Sidebar öffnen' },
		],
		value: activeTab,
		onChange: handleTabChange,
	});

	// Tag selector config for PillNavigation
	let tagSelectorConfig = $derived<PillTagSelectorConfig>({
		type: 'tag-selector',
		tags: eventTagsStore.tags.map((t) => ({ id: t.id, name: t.name, color: t.color || '#3b82f6' })),
		selectedIds: settingsStore.selectedTagIds,
		onToggle: settingsStore.toggleTagSelection,
		onClear: settingsStore.clearTagSelection,
		onCreate: () => goto('/tags?new=true'),
		loading: eventTagsStore.loading,
		label: 'Tags',
	});

	// Prepended elements (tab groups at the start of navigation)
	// Note: View switcher moved to ViewsBar component
	let prependElements = $derived<PillNavElement[]>(
		showCalendarToolbar
			? [calendarTasksTabGroup, { type: 'divider' }, tagSelectorConfig]
			: [calendarTasksTabGroup]
	);

	// Handle tab change: toggle sidebar for tasks, close for calendar
	function handleTabChange(tabId: string) {
		// Always navigate to main calendar page if not there
		if ($page.url.pathname !== '/') {
			goto('/');
		}

		if (tabId === 'tasks') {
			// Toggle behavior: if sidebar is already open, close it
			settingsStore.toggleSidebar();
		} else if (tabId === 'calendar') {
			// Kalender-Tab: close sidebar if open
			if (!settingsStore.sidebarCollapsed) {
				settingsStore.toggleSidebar();
			}
		}
	}

	// Navigation shortcuts (Ctrl+1 = Kalender, Ctrl+2 = Aufgaben toggle, Ctrl+3+ = other nav items)
	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;

		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const num = parseInt(event.key);
			if (num === 1) {
				// Ctrl+1: Kalender (close sidebar)
				event.preventDefault();
				handleTabChange('calendar');
			} else if (num === 2) {
				// Ctrl+2: Aufgaben (toggle sidebar)
				event.preventDefault();
				handleTabChange('tasks');
			} else if (num >= 3 && num <= baseNavItems.length + 2) {
				// Ctrl+3+: other nav items (offset by 2 for the tab group)
				event.preventDefault();
				const route = baseNavItems[num - 3]?.href;
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
			settingsStore.toggleImmersiveMode();
		}

		// Arrow keys for calendar navigation (only on main calendar page, no modifiers)
		if (
			showCalendarToolbar &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.shiftKey &&
			!event.altKey
		) {
			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				viewStore.goToPrevious();
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				viewStore.goToNext();
			} else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				// Scroll calendar view up/down - scroll to top/bottom
				const scrollContainer = document.querySelector('.carousel-page.current');
				if (scrollContainer) {
					event.preventDefault();
					if (event.key === 'ArrowDown') {
						// Scroll to bottom
						scrollContainer.scrollTo({
							top: scrollContainer.scrollHeight,
							behavior: 'smooth',
						});
					} else {
						// Scroll to top
						scrollContainer.scrollTo({
							top: 0,
							behavior: 'smooth',
						});
					}
				}
			}
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
		goto('/login');
	}

	// Reactive effect: load birthdays when setting is enabled
	$effect(() => {
		if (browser && settingsStore.showBirthdays && authStore.isAuthenticated) {
			birthdaysStore.fetchBirthdays();
		}
	});

	// Voice recording result handler
	function handleVoiceResult(transcription: string) {
		if (!browser) return;

		// Dispatch custom event for +page.svelte to handle
		window.dispatchEvent(
			new CustomEvent('voice-event-create', {
				detail: {
					title: transcription,
					description: transcription,
				},
			})
		);
	}

	onMount(async () => {
		// Initialize auth state from stored tokens
		await authStore.initialize();

		// Redirect to login if not authenticated
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Auth confirmed - allow children to render
		appReady = true;

		// Initialize split-panel from URL/localStorage
		splitPanel.initialize();

		// Initialize view state
		viewStore.initialize();

		// Load calendars and tags
		await calendarsStore.fetchCalendars();

		// Fetch tags and user settings
		await eventTagsStore.fetchTags();
		await userSettings.load();

		// Note: Birthdays are loaded via reactive $effect when showBirthdays is enabled

		// Redirect to start page if on root and a custom start page is set (only if authenticated)
		if (authStore.isAuthenticated) {
			const currentPath = window.location.pathname;
			if (currentPath === '/' && userSettings.startPage && userSettings.startPage !== '/') {
				goto(userSettings.startPage, { replaceState: true });
			}
		}

		// Initialize mobile state
		updateMobileState();
	});
</script>

<svelte:window onkeydown={handleKeydown} onresize={updateMobileState} />

{#if !appReady}
	<div class="flex items-center justify-center h-screen bg-background">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
{:else}
	<SplitPaneContainer>
		<div class="layout-container">
			<a
				href="#main-content"
				class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
			>
				Zum Inhalt springen
			</a>

			<!-- UI Elements (hidden in immersive mode) -->
			{#if !settingsStore.immersiveModeEnabled}
				<PillNavigation
					items={navItems}
					{prependElements}
					currentPath={$page.url.pathname}
					appName="Kalender"
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
					primaryColor="#3b82f6"
					showAppSwitcher={true}
					{appItems}
					{userEmail}
					settingsHref="/settings"
					manaHref="/mana"
					profileHref="/profile"
					allAppsHref="/apps"
					onOpenInPanel={handleOpenInPanel}
					ariaLabel="Hauptnavigation"
				/>
			{/if}

			<!-- Unified Bar: QuickInputBar + DateStrip + TagStrip + CalendarToolbar -->
			<UnifiedBar
				onSearch={handleSearch}
				onSelect={handleSelect}
				onParseCreate={handleParseCreate}
				onCreate={handleCreate}
				onSearchChange={handleSearchChange}
				placeholder="Neuer Termin oder suchen..."
				emptyText="Keine Termine gefunden"
				searchingText="Suche..."
				createText="Erstellen"
				appIcon="calendar"
				locale={$locale || 'de'}
				defaultOptions={calendarOptions}
				selectedDefaultId={selectedDefaultCalendarId}
				defaultOptionLabel="Standard-Kalender"
				onDefaultChange={handleDefaultCalendarChange}
				onShowShortcuts={handleShowShortcuts}
				onShowSyntaxHelp={handleShowSyntaxHelp}
				showCalendarLayers={showCalendarToolbar}
				{isMobile}
				hidden={settingsStore.immersiveModeEnabled}
			>
				{#snippet leftAction()}
					{#if voiceRecordingStore.isSupported}
						<VoiceRecordButton onResult={handleVoiceResult} size={32} />
					{/if}
				{/snippet}
			</UnifiedBar>

			<!-- Voice Recording Modal -->
			<VoiceRecordingModal onResult={handleVoiceResult} />

			<!-- Immersive Mode Toggle (always visible on main calendar page) -->
			<ImmersiveModeToggle
				isImmersive={settingsStore.immersiveModeEnabled}
				onToggle={() => settingsStore.toggleImmersiveMode()}
				visible={showCalendarToolbar}
			/>

			<main
				id="main-content"
				class="main-content bg-background"
				class:has-toolbar={showCalendarToolbar}
				class:immersive={settingsStore.immersiveModeEnabled}
				aria-label="Kalender"
			>
				<div
					class="content-wrapper"
					class:calendar-expanded={settingsStore.sidebarCollapsed && $page.url.pathname === '/'}
					class:immersive={settingsStore.immersiveModeEnabled}
				>
					{@render children()}
				</div>
			</main>
		</div>
	</SplitPaneContainer>

	<!-- InputBar Help Modal -->
	<InputBarHelpModal
		open={helpModalOpen}
		onClose={handleCloseHelpModal}
		mode={helpModalMode}
		appSyntax={CALENDAR_SYNTAX}
		liveExample={CALENDAR_LIVE_EXAMPLE}
	/>

	<!-- Settings Modal -->
	<SettingsModal visible={showSettingsModal} onClose={() => (showSettingsModal = false)} />

	<!-- App Onboarding Modal (shown once on first visit) -->
	{#if calendarOnboarding.shouldShow}
		<MiniOnboardingModal store={calendarOnboarding} appName="Kalender" appEmoji="📅" />
	{/if}
	<SessionExpiredBanner locale={$locale || 'de'} loginHref="/login" />
{/if}

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	/* Mobile: Fixed viewport, no scroll */
	@media (max-width: 768px) {
		.layout-container {
			height: 100vh;
			max-height: 100vh;
			overflow: hidden;
		}
	}

	.main-content {
		transition: all 300ms ease;
		position: relative;
		/* Flex container for children */
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	/* Extra padding for UnifiedBar layers (PillNav + InputBar + DateStrip) */
	.main-content.has-toolbar {
		padding-bottom: calc(220px + env(safe-area-inset-bottom));
	}

	@media (max-width: 768px) {
		/* On mobile, fixed height layout - no page scroll */
		.main-content {
			height: calc(100vh - 70px); /* Full height minus bottom nav */
			overflow: hidden;
			padding-bottom: 0;
			display: flex;
			flex-direction: column;
		}
		.main-content.has-toolbar {
			height: calc(100vh - 70px);
			padding-bottom: 0;
		}
	}

	/* Mobile: Fixed height, internal scrolling only */
	@media (max-width: 640px) {
		.main-content {
			height: calc(100vh - 70px);
			overflow: hidden;
			padding-bottom: 0;
		}
		.main-content.has-toolbar {
			height: calc(100vh - 70px);
			padding-bottom: 0;
		}
	}

	.content-wrapper {
		max-width: 100%;
		margin-left: auto;
		margin-right: auto;
		padding: 1rem;
		position: relative;
		z-index: 0;
		/* Flex for calendar layout */
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	/* Mobile: no padding, full height */
	@media (max-width: 768px) {
		.content-wrapper {
			padding: 0;
			height: 100%;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}
	}

	@media (min-width: 640px) {
		.content-wrapper {
			padding: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.content-wrapper {
			padding: 2rem;
		}
	}

	/* Full width when calendar sidebar is collapsed */
	.content-wrapper.calendar-expanded {
		width: 100%;
		max-width: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	/* Calendar fills entire screen - UI elements float on top */
	.main-content:has(.content-wrapper.calendar-expanded) {
		padding-bottom: 0 !important;
	}

	/* Immersive Mode - fullscreen, no UI elements visible */
	.main-content.immersive {
		padding: 0 !important;
		height: 100vh !important;
		width: 100vw;
		transition: padding 300ms ease;
	}

	.content-wrapper.immersive {
		padding: 0 !important;
		margin: 0;
		height: 100vh;
		width: 100vw;
		max-width: 100vw;
	}
</style>
