<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { authStore, collectionsStore, questionsStore } from '$lib/stores';
	import { apiClient } from '$lib/api/client';
	import { questionsApi } from '$lib/api/questions';
	import { theme } from '$lib/stores/theme';
	import { PillNavigation, QuickInputBar } from '@manacore/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		QuickInputItem,
		CreatePreview,
	} from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { GuestWelcomeModal, shouldShowGuestWelcome } from '@manacore/shared-auth-ui';

	let { children } = $props();

	// App switcher items
	const appItems = getPillAppItems('questions');

	// Mobile detection
	let isMobile = $state(false);

	function updateMobileState() {
		if (browser) {
			isMobile = window.innerWidth <= 640;
		}
	}

	// Navigation mode state
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Theme state
	let isDark = $derived(theme.current === 'dark');

	// User email for nav
	let userEmail = $derived(authStore.user?.email || 'Menu');

	// Guest welcome modal state
	let showGuestWelcome = $state(false);

	onMount(async () => {
		// Set API token if authenticated
		if (authStore.isAuthenticated) {
			const token = await authStore.getValidToken();
			apiClient.setAccessToken(token);
		} else {
			// Show guest welcome modal for unauthenticated users
			if (shouldShowGuestWelcome('questions')) {
				showGuestWelcome = true;
			}
		}

		// Load initial data (works in both guest and authenticated mode)
		await collectionsStore.load();
		await questionsStore.load();

		// Initialize mobile state
		updateMobileState();

		// Restore nav mode from localStorage
		if (browser) {
			const savedSidebar = localStorage.getItem('questions-nav-sidebar');
			if (savedSidebar === 'true') {
				isSidebarMode = true;
			}

			const savedCollapsed = localStorage.getItem('questions-nav-collapsed');
			if (savedCollapsed === 'true') {
				isCollapsed = true;
			}
		}
	});

	async function handleSignOut() {
		await authStore.signOut();
		apiClient.setAccessToken(null);
		goto('/login');
	}

	function handleToggleTheme() {
		theme.toggle();
	}

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('questions-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('questions-nav-collapsed', String(collapsed));
		}
	}

	// InputBar search - search questions
	async function handleSearch(query: string): Promise<QuickInputItem[]> {
		if (!query.trim()) return [];

		// Demo mode: search from store
		if (!authStore.isAuthenticated) {
			await questionsStore.load({ search: query });
			return questionsStore.questions.slice(0, 10).map((q) => ({
				id: q.id,
				title: q.title,
				subtitle: q.status || 'pending',
			}));
		}

		// Authenticated: search via API
		try {
			const response = await questionsApi.getAll({ search: query, limit: 10 });
			return response.data.map((q) => ({
				id: q.id,
				title: q.title,
				subtitle: q.status || 'pending',
			}));
		} catch {
			return [];
		}
	}

	function handleSelect(item: QuickInputItem) {
		goto(`/question/${item.id}`);
	}

	// Quick-create handler - parse question input
	function handleParseCreate(query: string): CreatePreview | null {
		if (!query.trim() || query.length < 3) return null;

		// Simple parsing: the entire query is the question title
		return {
			title: `Create: "${query}"`,
			subtitle: 'New question',
		};
	}

	async function handleCreate(query: string): Promise<void> {
		if (!query.trim()) return;

		// Demo mode: show login prompt
		if (!authStore.isAuthenticated) {
			showGuestWelcome = true;
			return;
		}

		const question = await questionsStore.create({
			title: query,
			collectionId: collectionsStore.selectedId || undefined,
		});

		if (question) {
			goto(`/question/${question.id}`);
		}
	}

	// Collection dropdown items
	let collectionItems = $derived<PillDropdownItem[]>([
		{
			id: 'all',
			label: 'All Questions',
			icon: 'help-circle',
			onClick: () => selectCollection(null),
			active: !collectionsStore.selectedId,
		},
		...collectionsStore.collections.map((c) => ({
			id: c.id,
			label: c.name,
			icon: 'folder',
			onClick: () => selectCollection(c.id),
			active: collectionsStore.selectedId === c.id,
		})),
	]);

	let currentCollectionLabel = $derived(
		collectionsStore.selectedId
			? collectionsStore.collections.find((c) => c.id === collectionsStore.selectedId)?.name ||
					'Collection'
			: 'All Questions'
	);

	function selectCollection(id: string | null) {
		collectionsStore.select(id);
		if (id) {
			questionsStore.load({ collectionId: id });
		} else {
			questionsStore.load();
		}
	}

	// Navigation items
	let navItems = $derived<PillNavItem[]>([
		{ href: '/', label: 'Questions', icon: 'help-circle' },
		{ href: '/collections', label: 'Collections', icon: 'folder' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
	]);

	// Guest features for welcome modal
	const guestFeatures = [
		'Browse sample research questions',
		'Explore the app interface',
		'See how AI research works',
	];
</script>

<svelte:window onresize={updateMobileState} />

<div class="layout-container">
	<!-- Demo Mode Banner -->
	{#if !authStore.isAuthenticated}
		<div
			class="guest-banner fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-primary/20 bg-primary/10 px-4 py-2"
		>
			<div class="flex items-center gap-2 text-sm">
				<svg class="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
					/>
				</svg>
				<span class="text-foreground">
					<strong>Demo Mode</strong>
					<span class="hidden text-muted-foreground sm:inline">
						- Sample questions to explore
					</span>
				</span>
			</div>
			<button
				onclick={() => goto('/login')}
				class="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
			>
				Sign In
			</button>
		</div>
	{/if}

	<!-- Navigation -->
	<PillNavigation
		items={navItems}
		currentPath={$page.url.pathname}
		appName="Questions"
		homeRoute="/"
		onToggleTheme={handleToggleTheme}
		{isDark}
		{isSidebarMode}
		onModeChange={handleModeChange}
		{isCollapsed}
		onCollapsedChange={handleCollapsedChange}
		desktopPosition="bottom"
		showThemeToggle={true}
		showLogout={authStore.isAuthenticated}
		onLogout={handleSignOut}
		loginHref="/login"
		primaryColor="#8b5cf6"
		showAppSwitcher={true}
		{appItems}
		{userEmail}
		settingsHref="/settings"
	/>

	<!-- Quick Input Bar -->
	<QuickInputBar
		onSearch={handleSearch}
		onSelect={handleSelect}
		placeholder="New question or search..."
		emptyText="No questions found"
		searchingText="Searching..."
		onCreate={handleCreate}
		onParseCreate={handleParseCreate}
		createText="Create"
		appIcon="help-circle"
		bottomOffset={isMobile ? '70px' : isSidebarMode ? '0px' : '70px'}
	/>

	<!-- Main Content -->
	<main
		class="main-content bg-background"
		class:sidebar-mode={isSidebarMode && !isCollapsed}
		class:has-banner={!authStore.isAuthenticated}
	>
		<div class="content-wrapper">
			{@render children()}
		</div>
	</main>
</div>

<!-- Guest Welcome Modal -->
<GuestWelcomeModal
	appId="questions"
	visible={showGuestWelcome}
	onClose={() => (showGuestWelcome = false)}
	onLogin={() => {
		showGuestWelcome = false;
		goto('/login');
	}}
	onRegister={() => {
		showGuestWelcome = false;
		goto('/register');
	}}
	helpHref="/help"
	locale="en"
	features={guestFeatures}
/>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	/* Guest banner styling */
	.guest-banner {
		height: 40px;
		min-height: 40px;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		padding-bottom: calc(80px + env(safe-area-inset-bottom));
		transition: all 300ms ease;
	}

	.main-content.has-banner {
		padding-top: 40px;
	}

	.main-content.sidebar-mode {
		padding-left: 180px;
		padding-bottom: 0;
	}

	.content-wrapper {
		flex: 1;
		overflow-y: auto;
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

	@media (max-width: 640px) {
		.main-content {
			padding-bottom: calc(150px + env(safe-area-inset-bottom));
		}

		.main-content.has-banner {
			padding-top: 40px;
		}

		.content-wrapper {
			padding: 0.75rem;
		}
	}
</style>
