<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { _, locale } from 'svelte-i18n';
	import { PillNavigation, QuickInputBar, TagStrip } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem, QuickInputItem } from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { photoStore } from '$lib/stores/photos.svelte';
	import { albumStore } from '$lib/stores/albums.svelte';
	import { tagStore } from '$lib/stores/tags.svelte';
	import { THEME_DEFINITIONS, DEFAULT_THEME_VARIANTS } from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { SessionExpiredBanner, AuthGate, GuestWelcomeModal } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { photosStore } from '$lib/data/local-store';

	let { children } = $props();

	let isDark = $derived(theme.isDark);
	let userEmail = $derived(authStore.user?.email || 'Menu');

	// TagStrip state
	let isTagStripVisible = $state(true);
	let selectedTagIds = $state<string[]>([]);

	function handleTagStripToggle() {
		isTagStripVisible = !isTagStripVisible;
	}

	function handleTagToggle(tagId: string) {
		if (selectedTagIds.includes(tagId)) {
			selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
		} else {
			selectedTagIds = [...selectedTagIds, tagId];
		}
	}

	function handleTagClear() {
		selectedTagIds = [];
	}

	// Navigation items
	const navItems: PillNavItem[] = [
		{ href: '/', label: $_('nav.gallery'), icon: 'image' },
		{ href: '/albums', label: $_('nav.albums'), icon: 'folder' },
		{ href: '/favorites', label: $_('nav.favorites'), icon: 'heart' },
		{ href: '/upload', label: $_('nav.upload'), icon: 'upload' },
		{
			href: '/',
			label: 'Tags',
			icon: 'tag',
			onClick: handleTagStripToggle,
			active: isTagStripVisible,
		},
		{ href: '/settings', label: $_('nav.settings'), icon: 'settings' },
	];

	// Theme dropdown items
	let themeVariantItems = $derived<PillDropdownItem[]>(
		DEFAULT_THEME_VARIANTS.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant].label,
			icon: THEME_DEFINITIONS[variant].icon,
			onClick: () => theme.setVariant(variant),
			active: theme.variant === variant,
		}))
	);

	let currentThemeVariantLabel = $derived(THEME_DEFINITIONS[theme.variant].label);

	function handleToggleTheme() {
		theme.toggleMode();
	}

	function handleThemeModeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}

	async function handleLogout() {
		await authStore.signOut();
		photoStore.reset();
		albumStore.reset();
		tagStore.reset();
		goto('/login');
	}

	// QuickInputBar handlers
	async function handleInputSearch(query: string): Promise<QuickInputItem[]> {
		const q = query.toLowerCase();
		const albums = albumStore.albums.filter((a) => a.name?.toLowerCase().includes(q));
		const tags = tagStore.tags.filter((t) => t.name?.toLowerCase().includes(q));
		const results: QuickInputItem[] = [];
		for (const album of albums.slice(0, 5)) {
			results.push({ id: `album-${album.id}`, title: album.name, subtitle: 'Album' });
		}
		for (const tag of tags.slice(0, 5)) {
			results.push({ id: `tag-${tag.id}`, title: tag.name, subtitle: 'Tag' });
		}
		return results;
	}

	function handleInputSelect(item: QuickInputItem) {
		if (item.id.startsWith('album-')) {
			goto(`/albums/${item.id.replace('album-', '')}`);
		} else if (item.id.startsWith('tag-')) {
			goto(`/tags/${item.id.replace('tag-', '')}`);
		}
	}

	let showGuestWelcome = $state(false);

	async function handleAuthReady() {
		await photosStore.initialize();
		if (authStore.isAuthenticated) {
			photosStore.startSync(() => authStore.getValidToken());
			await Promise.all([photoStore.loadStats(), albumStore.loadAlbums(), tagStore.loadTags()]);
		}
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('photos')) {
			showGuestWelcome = true;
		}
	}
</script>

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<div class="layout-container">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Photos"
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
			showLogout={true}
			onLogout={handleLogout}
			loginHref="/login"
			primaryColor="#8b5cf6"
			{userEmail}
			settingsHref="/settings"
			themesHref="/themes"
			helpHref="/help"
			profileHref="/profile"
		/>

		<!-- TagStrip (toggled via Tags pill) -->
		{#if isTagStripVisible}
			<TagStrip
				tags={tagStore.tags.map((t) => ({
					id: t.id,
					name: t.name,
					color: t.color || '#6b7280',
				}))}
				selectedIds={selectedTagIds}
				onToggle={handleTagToggle}
				onClear={handleTagClear}
				managementHref="/tags"
			/>
		{/if}

		<!-- Quick Input Bar -->
		<QuickInputBar
			onSearch={handleInputSearch}
			onSelect={handleInputSelect}
			placeholder="Album oder Tag suchen..."
			emptyText="Nichts gefunden"
			searchingText="Suche..."
			locale={$locale || 'de'}
			appIcon="search"
			bottomOffset="70px"
		/>

		<main class="main-content bg-background">
			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>
	</div>
	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale={$locale || 'de'} loginHref="/login" />
	{/if}

	<GuestWelcomeModal
		appId="photos"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale={($locale || 'de') === 'de' ? 'de' : 'en'}
	/>
</AuthGate>

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		padding-bottom: calc(100px + env(safe-area-inset-bottom));
	}

	@media (max-width: 768px) {
		.main-content {
			padding-bottom: calc(120px + env(safe-area-inset-bottom));
		}
	}

	.content-wrapper {
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
