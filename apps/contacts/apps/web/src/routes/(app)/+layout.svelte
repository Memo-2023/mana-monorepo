<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, QuickInputBar } from '@manacore/shared-ui';
	import {
		SplitPaneContainer,
		setSplitPanelContext,
		DEFAULT_APPS,
	} from '@manacore/shared-splitscreen';
	import type {
		PillNavItem,
		PillDropdownItem,
		QuickInputItem,
		QuickAction,
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
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import ContactDetailModal from '$lib/components/ContactDetailModal.svelte';
	import NewContactModal from '$lib/components/NewContactModal.svelte';
	import { contactsStore } from '$lib/stores/contacts.svelte';
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

	// Tags state for Quick-Create
	let availableTags = $state<{ id: string; name: string }[]>([]);

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

	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Show toolbar only on main contacts page
	const showContactsToolbar = $derived($page.url.pathname === '/' && !isSidebarMode);

	// Dynamic bottom offset based on toolbar state
	const inputBarBottomOffset = $derived(
		isSidebarMode
			? '0px'
			: showContactsToolbar && !contactsFilterStore.isToolbarCollapsed
				? '140px'
				: '70px'
	);

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
	let userEmail = $derived(authStore.user?.email || 'Menü');

	// Base navigation items for Contacts
	const baseNavItems: PillNavItem[] = [
		{ href: '/', label: 'Kontakte', icon: 'users' },
		{ href: '/tags', label: 'Tags', icon: 'tag' },
		{ href: '/favorites', label: 'Favoriten', icon: 'heart' },
		{ href: '/statistics', label: 'Statistiken', icon: 'bar-chart-3' },
		{ href: '/network', label: 'Netzwerk', icon: 'share-2' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{ href: '/feedback', label: 'Feedback', icon: 'chat' },
		{ href: '/help', label: 'Hilfe', icon: 'help-circle' },
	];

	// Navigation items filtered by visibility settings
	const navItems = $derived(
		filterHiddenNavItems('contacts', baseNavItems, userSettings.nav.hiddenNavItems)
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
	}

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		sidebarModeStore.set(isSidebar);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('contacts-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('contacts-nav-collapsed', String(collapsed));
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

	async function handleCloseContactModal() {
		// Refresh contacts list in case something was changed
		await contactsStore.loadContacts();
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

	// QuickInputBar quick actions
	const quickActions: QuickAction[] = [
		{ id: 'favorites', label: 'Favoriten', icon: 'heart', href: '/favorites' },
		{ id: 'tags', label: 'Tags', icon: 'tag', href: '/tags' },
		{ id: 'settings', label: 'Einstellungen', icon: 'settings', href: '/settings' },
	];

	onMount(async () => {
		// Redirect to login if not authenticated
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Initialize split-panel from URL/localStorage
		splitPanel.initialize();

		// Load user settings and tags
		await userSettings.load();

		// Load tags for Quick-Create
		try {
			const tagsResult = await tagsApi.list();
			availableTags = (tagsResult.tags || []).map((t) => ({ id: t.id, name: t.name }));
		} catch (e) {
			console.error('Failed to load tags:', e);
		}

		// Initialize contacts settings, view mode, and filter store
		contactsSettings.initialize();
		viewModeStore.initialize();
		contactsFilterStore.initialize();

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('contacts-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('contacts-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<SplitPaneContainer>
	<!-- Navigation Layout -->
	<div class="layout-container">
		<!-- Floating/Sidebar Pill Navigation (at bottom) -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Contacts"
			homeRoute="/"
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isSidebarMode}
			onModeChange={handleModeChange}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
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
			allAppsHref="/apps"
			onOpenInPanel={handleOpenInPanel}
		/>

		<!-- Main Content with dynamic padding based on nav mode -->
		<main
			class="main-content bg-background"
			class:sidebar-mode={isSidebarMode && !isCollapsed}
			class:floating-mode={!isSidebarMode}
		>
			<div class="content-wrapper">
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

		<!-- Global Quick Input Bar -->
		<QuickInputBar
			onSearch={handleSearch}
			onSelect={handleSelect}
			onSearchChange={(query) => contactsFilterStore.setSearchQuery(query)}
			{quickActions}
			placeholder="Neuer Kontakt oder suchen..."
			emptyText="Keine Kontakte gefunden"
			searchingText="Suche..."
			onCreate={handleCreate}
			onParseCreate={handleParseCreate}
			createText="Erstellen"
			appIcon="contacts"
			primaryColor="#3b82f6"
			autoFocus={true}
			bottomOffset={inputBarBottomOffset}
			hasFabRight={showContactsToolbar}
		/>

		<!-- Contacts Toolbar (FAB + expandable bar) - only on main page -->
		{#if showContactsToolbar}
			<ContactsToolbar {isSidebarMode} contacts={contactsStore.contacts} />
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
		flex: 1;
		transition: all 300ms ease;
		/* Space for QuickInputBar + PillNav at bottom */
		padding-bottom: calc(150px + env(safe-area-inset-bottom));
	}

	/* Floating nav mode - nav is at bottom, no top padding needed */
	.main-content.floating-mode {
		padding-top: 0;
	}

	/* Extra bottom padding on mobile */
	@media (max-width: 768px) {
		.main-content {
			padding-bottom: calc(160px + env(safe-area-inset-bottom));
		}
	}

	/* Sidebar mode - add left padding for sidebar nav */
	.main-content.sidebar-mode {
		padding-left: 180px;
	}

	.content-wrapper {
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
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
</style>
