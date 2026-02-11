<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { photoStore } from '$lib/stores/photos.svelte';
	import { albumStore } from '$lib/stores/albums.svelte';
	import { tagStore } from '$lib/stores/tags.svelte';
	import { THEME_DEFINITIONS, DEFAULT_THEME_VARIANTS } from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';

	let { children } = $props();

	let isDark = $derived(theme.isDark);
	let userEmail = $derived(authStore.user?.email || 'Menu');

	// Navigation items
	const navItems: PillNavItem[] = [
		{ href: '/', label: $_('nav.gallery'), icon: 'image' },
		{ href: '/albums', label: $_('nav.albums'), icon: 'folder' },
		{ href: '/favorites', label: $_('nav.favorites'), icon: 'heart' },
		{ href: '/upload', label: $_('nav.upload'), icon: 'upload' },
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

	onMount(async () => {
		await authStore.initialize();
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Load initial data
		await Promise.all([photoStore.loadStats(), albumStore.loadAlbums(), tagStore.loadTags()]);
	});
</script>

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
	/>

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
