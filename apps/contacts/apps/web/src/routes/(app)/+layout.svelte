<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { setContext } from 'svelte';
	import {
		PillNavigation,
		QuickInputBar,
		ImmersiveModeToggle,
		TagStrip,
	} from '@manacore/shared-ui';
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
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
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
	import ContactDetailModal from '$lib/components/ContactDetailModal.svelte';
	import NewContactModal from '$lib/components/NewContactModal.svelte';
	import { useAllContacts } from '$lib/data/queries';
	import { newContactModalStore } from '$lib/stores/new-contact-modal.svelte';
	import { contactsApi, tagsApi } from '$lib/api/contacts';
	import { viewModeStore } from '$lib/stores/view-mode.svelte';
	import { contactsSettings } from '$lib/stores/settings.svelte';
	import { contactsFilterStore } from '$lib/stores/filter.svelte';
	import {
		parseContactInput,
		resolveContactIds,
		formatParsedContactPreview,
	} from '$lib/utils/contact-parser';
	import ContactsToolbar from '$lib/components/ContactsToolbar.svelte';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';
	import { linkLocalStore, linkMutations } from '@manacore/shared-links';
	import { contactsOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { contactsLocalStore } from '$lib/data/local-store';

	// Guest welcome modal state
	let showGuestWelcome = $state(false);

	function initGuestWelcome() {
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('contacts')) {
			showGuestWelcome = true;
		}
	}

	// Live tag query + context
	const allTags = useAllSharedTags();
	setContext('tags', allTags);

	// Live contacts query + context
	const allContacts = useAllContacts();
	setContext('contacts', allContacts);

	// Check if we're on a contact detail route
	const contactDetailMatch = $derived($page.url.pathname.match(/^\/contacts\/([0-9a-f-]{36})$/i));
	const showContactModal = $derived(!!contactDetailMatch);
	const modalContactId = $derived(contactDetailMatch?.[1] || null);

	// App switcher items
	const appItems = getPillAppItems('contacts');

	// Split-Panel Store für Split-Screen Feature
	const splitPanel = setSplitPanelContext('contacts', DEFAULT_APPS);

	// Handler für Split-Screen Panel-Öffnung
	function handleOpenInPanel(appId: string, url: string) {
		splitPanel.openPanel(appId);
	}

	let { children } = $props();

	// Show toolbar only on main contacts page
	const showContactsToolbar = $derived($page.url.pathname === '/');

	// Check if toolbar is expanded
	const isToolbarExpanded = $derived(
		showContactsToolbar && !contactsFilterStore.isToolbarCollapsed
	);

	// Dynamic bottom offset based on toolbar state (TagStrip adds ~40px)
	const inputBarBottomOffset = $derived(isToolbarExpanded ? '180px' : '110px');

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
		// Theme variants (only default + pinned)
		...visibleThemes.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant].label,
			icon: THEME_DEFINITIONS[variant].icon,
			onClick: () => theme.setVariant(variant),
			active: theme.variant === variant,
		})),
		// Separator and link to full themes page
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

	// User email for user dropdown (fallback to 'Menü' when not logged in)
	// User email for user dropdown — empty string for guests so PillNav shows login button
	let userEmail = $derived(authStore.isAuthenticated ? authStore.user?.email || 'Menü' : '');

	// TagStrip visibility (toggle via Tags button in PillNav)
	let isTagStripVisible = $state(true);

	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	// Base navigation items for Contacts
	const baseNavItems: PillNavItem[] = [
		{ href: '/', label: 'Kontakte', icon: 'users' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{ href: '/help', label: 'Hilfe', icon: 'help-circle' },
		{ href: '/spiral', label: 'Spiral', icon: 'sparkles' },
	];

	// Navigation items filtered by visibility settings (with fallback for guest mode)
	const navItems = $derived(
		filterHiddenNavItems('contacts', baseNavItems, userSettings.nav?.hiddenNavItems || {})
	);

	// Navigation shortcuts (Ctrl+1-5) - use base items for consistent shortcuts
	const navRoutes = baseNavItems.map((item) => item.href);

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
			contactsSettings.toggleImmersiveMode();
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
		goto('/login');
	}

	function handleCloseContactModal() {
		// No need to refresh — live query auto-updates
		goto('/', { replaceState: false });
	}

	// QuickInputBar search function
	async function handleSearch(query: string): Promise<QuickInputItem[]> {
		const response = await contactsApi.list({ search: query, limit: 10 });
		return (response.contacts || []).map((contact: any) => ({
			id: contact.id,
			title:
				contact.displayName ||
				[contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
				contact.email ||
				'Unbekannt',
			subtitle: contact.company || contact.email,
			imageUrl: contact.photoUrl,
			isFavorite: contact.isFavorite,
		}));
	}

	// QuickInputBar item selection
	function handleSelect(item: QuickInputItem) {
		goto(`/contacts/${item.id}`);
	}

	// QuickInputBar Quick-Create handlers
	function handleParseCreate(query: string): CreatePreview | null {
		if (!query.trim()) return null;

		const parsed = parseContactInput(query);
		if (!parsed.displayName) return null;

		return {
			title: `"${parsed.displayName}" erstellen`,
			subtitle: formatParsedContactPreview(parsed),
		};
	}

	async function handleCreate(query: string): Promise<void> {
		const parsed = parseContactInput(query);
		if (!parsed.displayName) {
			// If no query, just open empty modal
			newContactModalStore.open();
			return;
		}

		// Open modal with prefilled data
		newContactModalStore.open({
			displayName: parsed.displayName,
			firstName: parsed.firstName || undefined,
			lastName: parsed.lastName || undefined,
			email: parsed.email || undefined,
			phone: parsed.phone || undefined,
			company: parsed.company || undefined,
		});
	}

	// Navigate to import page after onboarding if user chose to import
	let previousOnboardingShow = true;
	$effect(() => {
		const showing = contactsOnboarding.shouldShow;
		if (previousOnboardingShow && !showing) {
			// Onboarding just closed
			const importSource = contactsOnboarding.preferences.importSource as string;
			if (importSource === 'google') {
				goto('/data?tab=import&source=google');
			} else if (importSource === 'file') {
				goto('/data?tab=import&source=file');
			}
		}
		previousOnboardingShow = showing;
	});

	async function handleAuthReady() {
		// Initialize local-first databases (opens IndexedDB, seeds guest data)
		await Promise.all([
			contactsLocalStore.initialize(),
			tagLocalStore.initialize(),
			linkLocalStore.initialize(),
		]);

		// If authenticated, start syncing to server
		if (authStore.isAuthenticated) {
			const getToken = () => authStore.getValidToken();
			contactsLocalStore.startSync(getToken);
			tagMutations.startSync(getToken);
			linkMutations.startSync(getToken);
		}

		// Initialize split-panel from URL/localStorage
		splitPanel.initialize();

		// Initialize contacts settings, view mode, and filter store
		contactsSettings.initialize();
		viewModeStore.initialize();
		contactsFilterStore.initialize();

		// Show guest welcome modal on first visit
		initGuestWelcome();

		// Load user settings only when authenticated
		if (authStore.isAuthenticated) {
			await userSettings.load();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<SplitPaneContainer>
		<!-- Navigation Layout -->
		<div class="layout-container">
			<a
				href="#main-content"
				class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
			>
				Zum Inhalt springen
			</a>

			<!-- UI Elements (hidden in immersive mode) -->
			{#if !contactsSettings.immersiveModeEnabled}
				<!-- Floating Pill Navigation (at bottom) -->
				<PillNavigation
					items={navItems}
					currentPath={$page.url.pathname}
					appName="Contacts"
					homeRoute="/"
					onToggleTheme={handleToggleTheme}
					{isDark}
					desktopPosition="bottom"
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
					themesHref="/themes"
					helpHref="/help"
					allAppsHref="/apps"
					onOpenInPanel={handleOpenInPanel}
					ariaLabel="Hauptnavigation"
				/>

				<!-- TagStrip (above PillNav, toggled via Tags pill) -->
				{#if isTagStripVisible}
					<TagStrip
						tags={allTags.value.map((t) => ({
							id: t.id,
							name: t.name,
							color: t.color || '#3b82f6',
						}))}
						selectedIds={contactsFilterStore.selectedTagId
							? [contactsFilterStore.selectedTagId]
							: []}
						onToggle={(tagId) => {
							if (contactsFilterStore.selectedTagId === tagId) {
								contactsFilterStore.setSelectedTagId(null);
							} else {
								contactsFilterStore.setSelectedTagId(tagId);
							}
						}}
						onClear={() => contactsFilterStore.setSelectedTagId(null)}
						managementHref="/tags"
					/>
				{/if}

				<!-- Global Quick Input Bar -->
				<QuickInputBar
					onSearch={handleSearch}
					onSelect={handleSelect}
					onSearchChange={(query) => contactsFilterStore.setSearchQuery(query)}
					placeholder="Neuer Kontakt oder suchen..."
					emptyText="Keine Kontakte gefunden"
					searchingText="Suche..."
					searchText="Suchen"
					onCreate={handleCreate}
					onParseCreate={handleParseCreate}
					createText="Erstellen"
					deferSearch={true}
					locale={$locale || 'de'}
					appIcon="contacts"
					bottomOffset={inputBarBottomOffset}
					hasFabRight={showContactsToolbar}
				/>

				<!-- Contacts Toolbar (FAB + expandable bar) - only on main page -->
				{#if showContactsToolbar}
					<ContactsToolbar contacts={allContacts.value} />
				{/if}
			{/if}

			<!-- Immersive Mode Toggle (always visible) -->
			<ImmersiveModeToggle
				isImmersive={contactsSettings.immersiveModeEnabled}
				onToggle={() => contactsSettings.toggleImmersiveMode()}
			/>

			<!-- Main Content -->
			<main
				id="main-content"
				class="main-content bg-background"
				class:immersive={contactsSettings.immersiveModeEnabled}
			>
				<div class="content-wrapper" class:immersive={contactsSettings.immersiveModeEnabled}>
					{@render children()}
				</div>
			</main>

			<!-- Contact Detail Modal -->
			{#if showContactModal && modalContactId}
				<ContactDetailModal contactId={modalContactId} onClose={handleCloseContactModal} />
			{/if}

			<!-- New Contact Modal -->
			{#if newContactModalStore.isOpen}
				<NewContactModal onClose={() => newContactModalStore.close()} />
			{/if}
		</div>
	</SplitPaneContainer>

	<!-- Onboarding Modal -->
	{#if contactsOnboarding.shouldShow}
		<MiniOnboardingModal store={contactsOnboarding} appName="Kontakte" appEmoji="👥" />
	{/if}

	<!-- Guest Welcome Modal -->
	<GuestWelcomeModal
		appId="contacts"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale={($locale || 'de') === 'de' ? 'de' : 'en'}
	/>

	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale={$locale || 'de'} loginHref="/login" />
	{/if}
	<SyncIndicator />
</AuthGate>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		transition: all 300ms ease;
		/* Space for QuickInputBar + PillNav at bottom */
		padding-bottom: calc(150px + env(safe-area-inset-bottom));
	}

	/* Extra bottom padding on mobile */
	@media (max-width: 768px) {
		.main-content {
			padding-bottom: calc(160px + env(safe-area-inset-bottom));
		}
	}

	/* Immersive mode - fullscreen, no padding */
	.main-content.immersive {
		padding: 0 !important;
		height: 100vh;
		width: 100vw;
	}

	.content-wrapper.immersive {
		padding: 0;
		height: 100%;
	}

	.content-wrapper {
		/* No max-width - let individual views control their own width */
		padding: 1rem;
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

	/* Adjust InputBar when toolbar elements (view-mode-pill + FAB) are visible */
	/* Pill left edge is at: 50% - 238px from right edge of viewport */
	/* This means from center, there's 238px to the pill's left edge */
	/* For a centered InputBar with max-width W, right edge is at: center + W/2 */
	/* We need: center + W/2 < center + 238 - 12px gap, so W/2 < 226, W < 452px */
	:global(.quick-input-bar.has-fab-right .input-container) {
		max-width: 450px;
	}

	/* On smaller screens (<900px), the FAB + pill move to right: 1rem position */
	/* So we need fixed padding instead */
	@media (max-width: 900px) {
		:global(.quick-input-bar.has-fab-right .input-container) {
			max-width: calc(100% - 200px); /* ~120px pill + 8px + 54px FAB + 18px gap */
			margin-left: 0;
			margin-right: auto;
		}
	}
</style>
