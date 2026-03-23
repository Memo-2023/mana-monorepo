<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { PillNavigation, QuickInputBar, DevBuildBadge } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem, QuickInputItem } from '@manacore/shared-ui';
	import {
		SplitPaneContainer,
		setSplitPanelContext,
		DEFAULT_APPS,
	} from '@manacore/shared-splitscreen';
	import { getPillAppItems } from '@manacore/shared-branding';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
	} from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { libraryStore } from '$lib/stores/library.svelte';
	import MiniPlayer from '$lib/components/MiniPlayer.svelte';
	import FullPlayer from '$lib/components/FullPlayer.svelte';
	import QueuePanel from '$lib/components/QueuePanel.svelte';

	let { children } = $props();

	// App switcher items
	const appItems = getPillAppItems('mukke' as any);

	// Split-Panel Store
	const splitPanel = setSplitPanelContext('mukke' as any, DEFAULT_APPS);

	function handleOpenInPanel(appId: string, url: string) {
		splitPanel.openPanel(appId);
	}

	// Theme
	let isDark = $derived(theme.isDark);

	let themeVariantItems = $derived<PillDropdownItem[]>([
		...DEFAULT_THEME_VARIANTS.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant].label,
			icon: THEME_DEFINITIONS[variant].icon,
			onClick: () => theme.setVariant(variant),
			active: theme.variant === variant,
		})),
		{
			id: 'all-themes',
			label: 'All Themes',
			icon: 'palette',
			onClick: () => goto('/themes'),
			active: false,
		},
	]);

	let currentThemeVariantLabel = $derived(THEME_DEFINITIONS[theme.variant].label);

	// User
	let userEmail = $derived(authStore.user?.email || 'Menu');

	// Navigation items
	const baseNavItems: PillNavItem[] = [
		{ href: '/library', label: 'Library', icon: 'music-notes' },
		{ href: '/playlists', label: 'Playlists', icon: 'playlist' },
		{ href: '/projects', label: 'Editor', icon: 'waveform' },
		{ href: '/upload', label: 'Upload', icon: 'upload' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
		{ href: '/help', label: 'Help', icon: 'help-circle' },
	];

	const navItems = $derived(baseNavItems);

	// Keyboard shortcuts (Ctrl+1-5)
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
				if (route) goto(route);
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

	// QuickInputBar handlers
	async function handleInputSearch(query: string): Promise<QuickInputItem[]> {
		const songs = await libraryStore.searchSongs(query);
		return songs.slice(0, 10).map((song) => ({
			id: song.id,
			title: song.title || 'Untitled',
			subtitle: [song.artist, song.album].filter(Boolean).join(' — '),
			isFavorite: song.favorite,
		}));
	}

	function handleInputSelect(item: QuickInputItem) {
		goto(`/library?song=${item.id}`);
	}

	onMount(async () => {
		await authStore.initialize();
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
		splitPanel.initialize();
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if !authStore.isAuthenticated}
	<div class="min-h-screen flex items-center justify-center bg-background">
		<div
			class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
		></div>
	</div>
{:else}
	<SplitPaneContainer>
		<div class="layout-container">
			<a
				href="#main-content"
				class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
			>
				Skip to content
			</a>

			<PillNavigation
				items={navItems}
				currentPath={$page.url.pathname}
				appName="Mukke"
				homeRoute="/library"
				onToggleTheme={handleToggleTheme}
				{isDark}
				showThemeToggle={true}
				showThemeVariants={true}
				{themeVariantItems}
				{currentThemeVariantLabel}
				themeMode={theme.mode}
				onThemeModeChange={handleThemeModeChange}
				showLogout={true}
				onLogout={handleLogout}
				loginHref="/login"
				primaryColor="#f97316"
				showAppSwitcher={true}
				{appItems}
				{userEmail}
				settingsHref="/settings"
				onOpenInPanel={handleOpenInPanel}
				ariaLabel="Main navigation"
			/>

			<!-- Quick Input Bar -->
			<QuickInputBar
				onSearch={handleInputSearch}
				onSelect={handleInputSelect}
				placeholder="Song suchen..."
				emptyText="Keine Songs gefunden"
				searchingText="Suche..."
				locale="de"
				appIcon="search"
				bottomOffset="140px"
			/>

			<!-- Main Content -->
			<main id="main-content" class="main-content bg-background">
				<div class="content-wrapper">
					{@render children()}
				</div>
			</main>

			<!-- Player components -->
			<MiniPlayer />
			<FullPlayer />
			<QueuePanel />
			<DevBuildBadge commitHash={__BUILD_HASH__} buildTime={__BUILD_TIME__} />
		</div>
	</SplitPaneContainer>
{/if}

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		transition: all 300ms ease;
		padding-bottom: calc(180px + env(safe-area-inset-bottom));
	}

	@media (max-width: 768px) {
		.main-content {
			padding-bottom: calc(190px + env(safe-area-inset-bottom));
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
