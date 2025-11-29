<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';
	import type { LayoutData } from './$types';

	// App switcher items
	const appItems = getPillAppItems('chat');

	let { children, data }: { children: any; data: LayoutData } = $props();

	let isChecking = $state(true);
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

	// Navigation items for Chat (settings moved to user dropdown)
	const navItems: PillNavItem[] = [
		{ href: '/chat', label: 'Chat', icon: 'home' },
		{ href: '/templates', label: 'Templates', icon: 'document' },
		{ href: '/spaces', label: 'Spaces', icon: 'building' },
		{ href: '/documents', label: 'Dokumente', icon: 'archive' },
		{ href: '/archive', label: 'Archiv', icon: 'list' },
	];

	// User email for user dropdown
	let userEmail = $derived(authStore.user?.email);

	// Check if current page is a chat page (needs full-width layout)
	let isChatPage = $derived($page.url.pathname.startsWith('/chat'));

	// Navigation shortcuts (Ctrl+1-5)
	const navRoutes = navItems.map((item) => item.href);

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
			localStorage.setItem('chat-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('chat-nav-collapsed', String(collapsed));
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

	// Check auth on mount and redirect if not authenticated
	onMount(async () => {
		// Initialize theme
		theme.initialize();

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('chat-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('chat-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		await authStore.initialize();

		if (!authStore.isAuthenticated) {
			const redirectTo = encodeURIComponent(data.pathname || '/chat');
			goto(`/login?redirectTo=${redirectTo}`);
			return;
		}

		isChecking = false;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isChecking}
	<!-- Loading state while checking auth -->
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
			></div>
			<p class="text-muted-foreground">Laden...</p>
		</div>
	</div>
{:else}
	<!-- Navigation Layout -->
	<div class="layout-container">
		<!-- Floating/Sidebar Pill Navigation -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="ManaChat"
			homeRoute="/chat"
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isSidebarMode}
			onModeChange={handleModeChange}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			showThemeVariants={true}
			{themeVariantItems}
			{currentThemeVariantLabel}
			themeMode={theme.mode}
			onThemeModeChange={handleThemeModeChange}
			showLanguageSwitcher={false}
			showLogout={true}
			onLogout={handleLogout}
			primaryColor="#3b82f6"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
		/>

		<!-- Main Content with dynamic padding based on nav mode -->
		<main
			class="main-content bg-background"
			class:sidebar-mode={isSidebarMode && !isCollapsed}
			class:floating-mode={!isSidebarMode && !isCollapsed}
			class:chat-page={isChatPage}
		>
			{#if isChatPage}
				<!-- Full-width layout for chat pages -->
				{@render children()}
			{:else}
				<div class="content-wrapper">
					{@render children()}
				</div>
			{/if}
		</main>
	</div>
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
	}

	/* Floating nav mode - add top padding for fixed nav */
	.main-content.floating-mode {
		padding-top: 100px;
	}

	/* Sidebar mode - add left padding for sidebar nav */
	.main-content.sidebar-mode {
		padding-left: 180px;
	}

	/* Chat page - no content wrapper, but keep nav padding */
	.main-content.chat-page {
		overflow: hidden;
	}

	.content-wrapper {
		max-width: 80rem;
		margin-left: auto;
		margin-right: auto;
		padding: 2rem 1rem;
	}

	@media (min-width: 640px) {
		.content-wrapper {
			padding-left: 1.5rem;
			padding-right: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.content-wrapper {
			padding-left: 2rem;
			padding-right: 2rem;
		}
	}
</style>
