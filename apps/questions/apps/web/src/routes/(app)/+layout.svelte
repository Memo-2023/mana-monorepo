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
	let isCollapsed = $state(false);

	// Theme state
	let isDark = $derived(theme.current === 'dark');

	// User email for nav
	let userEmail = $derived(authStore.user?.email || 'Menu');

	onMount(async () => {
		// Initialize auth and redirect if not authenticated
		await authStore.initialize();
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Set API token
		const token = await authStore.getValidToken();
		apiClient.setAccessToken(token);

		// Load initial data
		await collectionsStore.load();
		await questionsStore.load();

		// Initialize mobile state
		updateMobileState();

		// Restore nav mode from localStorage
		if (browser) {
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
</script>

<svelte:window onresize={updateMobileState} />

<div class="layout-container">
	<!-- Navigation -->
	<PillNavigation
		items={navItems}
		currentPath={$page.url.pathname}
		appName="Questions"
		homeRoute="/"
		onToggleTheme={handleToggleTheme}
		{isDark}
		{isCollapsed}
		onCollapsedChange={handleCollapsedChange}
		showThemeToggle={true}
		showLogout={true}
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
		bottomOffset={isMobile ? '70px' : '70px'}
	/>

	<!-- Main Content -->
	<main class="main-content bg-background">
		<div class="content-wrapper">
			{@render children()}
		</div>
	</main>
</div>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		padding-bottom: calc(80px + env(safe-area-inset-bottom));
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

		.content-wrapper {
			padding: 0.75rem;
		}
	}
</style>
