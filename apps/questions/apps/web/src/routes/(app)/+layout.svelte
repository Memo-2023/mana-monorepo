<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { locale } from 'svelte-i18n';
	import { authStore, collectionsStore, questionsStore } from '$lib/stores';
	import { theme } from '$lib/stores/theme';
	import { AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { questionsAppStore } from '$lib/data/local-store';
	import {
		useAllCollections,
		useAllQuestions,
		filterByCollection,
		searchQuestions,
	} from '$lib/data/queries';
	import { PillNavigation, QuickInputBar, TagStrip } from '@manacore/shared-ui';
	import type {
		PillNavItem,
		PillDropdownItem,
		QuickInputItem,
		CreatePreview,
	} from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';
	import {
		tagLocalStore,
		tagMutations,
		useAllTags as useAllSharedTags,
	} from '@manacore/shared-stores';

	let { children } = $props();

	const allTags = useAllSharedTags();
	setContext('tags', allTags);

	// Reactive live queries from IndexedDB
	const allCollections = useAllCollections();
	const allQuestions = useAllQuestions();

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

	let showGuestWelcome = $state(false);

	async function handleAuthReady() {
		await Promise.all([questionsAppStore.initialize(), tagLocalStore.initialize()]);
		if (authStore.isAuthenticated) {
			const getToken = () => authStore.getValidToken();
			questionsAppStore.startSync(getToken);
			tagMutations.startSync(getToken);
		}
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('questions')) {
			showGuestWelcome = true;
		}
		updateMobileState();
		if (browser) {
			const savedCollapsed = localStorage.getItem('questions-nav-collapsed');
			if (savedCollapsed === 'true') {
				isCollapsed = true;
			}
		}
	}

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

	// InputBar search - search questions from liveQuery data
	async function handleSearch(query: string): Promise<QuickInputItem[]> {
		if (!query.trim()) return [];

		const results = searchQuestions(allQuestions.value, query);
		return results.slice(0, 10).map((q) => ({
			id: q.id,
			title: q.title,
			subtitle: q.status || 'pending',
		}));
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

	// Collection dropdown items — driven by liveQuery
	let collectionItems = $derived<PillDropdownItem[]>([
		{
			id: 'all',
			label: 'All Questions',
			icon: 'help-circle',
			onClick: () => selectCollection(null),
			active: !collectionsStore.selectedId,
		},
		...allCollections.value.map((c) => ({
			id: c.id,
			label: c.name,
			icon: 'folder',
			onClick: () => selectCollection(c.id),
			active: collectionsStore.selectedId === c.id,
		})),
	]);

	let currentCollectionLabel = $derived(
		collectionsStore.selectedId
			? allCollections.value.find((c) => c.id === collectionsStore.selectedId)?.name || 'Collection'
			: 'All Questions'
	);

	function selectCollection(id: string | null) {
		collectionsStore.select(id);
	}

	// TagStrip visibility
	let isTagStripVisible = $state(false);
	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	// Navigation items
	let navItems = $derived<PillNavItem[]>([
		{ href: '/', label: 'Questions', icon: 'help-circle' },
		{ href: '/collections', label: 'Collections', icon: 'folder' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
	]);
</script>

<svelte:window onresize={updateMobileState} />

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<div class="layout-container">
		<!-- TagStrip (above PillNav, toggled via Tags pill) -->
		{#if isTagStripVisible}
			<TagStrip
				tags={allTags.value.map((t) => ({
					id: t.id,
					name: t.name,
					color: t.color || '#3b82f6',
				}))}
				selectedIds={[]}
				onToggle={() => {}}
				onClear={() => {}}
				managementHref="/tags"
			/>
		{/if}

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
			themesHref="/themes"
			helpHref="/help"
			profileHref="/profile"
		/>

		<!-- Quick Input Bar -->
		<QuickInputBar
			onSearch={handleSearch}
			onSelect={handleSelect}
			placeholder="New question or search..."
			emptyText="No questions found"
			searchingText="Searching..."
			searchText="Search"
			onCreate={handleCreate}
			onParseCreate={handleParseCreate}
			createText="Create"
			deferSearch={true}
			locale={$locale || 'en'}
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

	<GuestWelcomeModal
		appId="questions"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale="de"
	/>
</AuthGate>

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
