<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { locale } from 'svelte-i18n';
	import { PillNavigation, CommandBar } from '@manacore/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		CommandBarItem,
		QuickAction,
	} from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { getLanguageDropdownItems, getCurrentLanguageLabel } from '@manacore/shared-i18n';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { setLocale, supportedLocales } from '$lib/i18n';
	import ContactDetailModal from '$lib/components/ContactDetailModal.svelte';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { contactsApi } from '$lib/api/contacts';
	import { viewModeStore } from '$lib/stores/view-mode.svelte';
	import { contactsSettings } from '$lib/stores/settings.svelte';

	// Search modal state
	let searchModalOpen = $state(false);

	// Check if we're on a contact detail route
	const contactDetailMatch = $derived($page.url.pathname.match(/^\/contacts\/([0-9a-f-]{36})$/i));
	const showContactModal = $derived(!!contactDetailMatch);
	const modalContactId = $derived(contactDetailMatch?.[1] || null);

	// App switcher items
	const appItems = getPillAppItems('contacts');

	let { children } = $props();

	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Use theme store's isDark directly
	let isDark = $derived(theme.isDark);

	// Theme variant dropdown items
	let themeVariantItems = $derived<PillDropdownItem[]>([
		// Theme variants
		...theme.variants.map((variant) => ({
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

	// Navigation items for Contacts
	const navItems: PillNavItem[] = [
		{ href: '/', label: 'Kontakte', icon: 'users' },
		{ href: '/tags', label: 'Tags', icon: 'tag' },
		{ href: '/favorites', label: 'Favoriten', icon: 'heart' },
		{ href: '/network', label: 'Netzwerk', icon: 'share-2' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		{ href: '/feedback', label: 'Feedback', icon: 'chat' },
		{ href: '/help', label: 'Hilfe', icon: 'help-circle' },
	];

	// Navigation shortcuts (Ctrl+1-5)
	const navRoutes = navItems.map((item) => item.href);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;

		// Cmd/Ctrl+K to open search (works even in inputs)
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			searchModalOpen = true;
			return;
		}

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

	// CommandBar search function
	async function handleCommandBarSearch(query: string): Promise<CommandBarItem[]> {
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

	// CommandBar item selection
	function handleCommandBarSelect(item: CommandBarItem) {
		goto(`/contacts/${item.id}`);
	}

	// CommandBar quick actions
	const commandBarQuickActions: QuickAction[] = [
		{
			id: 'new',
			label: 'Neuen Kontakt erstellen',
			icon: 'plus',
			href: '/contacts/new',
			shortcut: 'N',
		},
		{ id: 'favorites', label: 'Favoriten anzeigen', icon: 'heart', href: '/favorites' },
		{ id: 'tags', label: 'Tags verwalten', icon: 'tag', href: '/tags' },
		{ id: 'import', label: 'Kontakte importieren', icon: 'upload', href: '/data?tab=import' },
	];

	onMount(async () => {
		// Redirect to login if not authenticated
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Load user settings
		await userSettings.load();

		// Initialize contacts settings and view mode
		contactsSettings.initialize();
		viewModeStore.initialize();

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

<!-- Navigation Layout -->
<div class="layout-container">
	<!-- Floating/Sidebar Pill Navigation -->
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
		desktopPosition={userSettings.nav.desktopPosition}
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
	/>

	<!-- Main Content with dynamic padding based on nav mode -->
	<main
		class="main-content bg-background"
		class:sidebar-mode={isSidebarMode && !isCollapsed}
		class:floating-mode={!isSidebarMode}
	>
		<div class="content-wrapper" class:settings-page={$page.url.pathname === '/settings'}>
			{@render children()}
		</div>
	</main>

	<!-- Contact Detail Modal -->
	{#if showContactModal && modalContactId}
		<ContactDetailModal contactId={modalContactId} onClose={handleCloseContactModal} />
	{/if}

	<!-- Global Search Modal (Cmd/K) -->
	<CommandBar
		bind:open={searchModalOpen}
		onClose={() => (searchModalOpen = false)}
		onSearch={handleCommandBarSearch}
		onSelect={handleCommandBarSelect}
		quickActions={commandBarQuickActions}
		placeholder="Kontakt suchen..."
		emptyText="Keine Kontakte gefunden"
		searchingText="Suche..."
	/>
</div>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		transition: all 300ms ease;
	}

	/* Floating nav mode - add top padding for fixed nav */
	.main-content.floating-mode {
		padding-top: 80px;
	}

	/* Extra padding on mobile for larger nav */
	@media (max-width: 768px) {
		.main-content.floating-mode {
			padding-top: 90px;
		}
	}

	/* Sidebar mode - add left padding for sidebar nav */
	.main-content.sidebar-mode {
		padding-left: 180px;
	}

	.content-wrapper {
		max-width: 80rem;
		margin-left: auto;
		margin-right: auto;
		padding: 2rem 1rem;
	}

	/* Settings page has its own padding and max-width */
	.content-wrapper.settings-page {
		max-width: none;
		padding: 0;
	}

	@media (min-width: 640px) {
		.content-wrapper {
			padding-left: 1.5rem;
			padding-right: 1.5rem;
		}
		.content-wrapper.settings-page {
			padding: 0;
		}
	}

	@media (min-width: 1024px) {
		.content-wrapper {
			padding-left: 2rem;
			padding-right: 2rem;
		}
		.content-wrapper.settings-page {
			padding: 0;
		}
	}
</style>
