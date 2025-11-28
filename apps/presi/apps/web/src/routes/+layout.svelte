<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem } from '@manacore/shared-ui';
	import { auth } from '$lib/stores/auth.svelte';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import '../app.css';

	let { children } = $props();

	let loading = $state(true);
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);
	let isDark = $state(false);

	// Navigation items for Presi
	const navItems: PillNavItem[] = [
		{ href: '/', label: 'Decks', icon: 'document' },
		{ href: '/profile', label: 'Profil', icon: 'user' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
	];

	// Public routes that don't require auth
	const publicRoutes = ['/login', '/register', '/forgot-password'];

	// Routes where nav should be hidden
	const hideNavRoutes = ['/present/', '/shared/'];

	function shouldHideNav(pathname: string): boolean {
		return hideNavRoutes.some((route) => pathname.startsWith(route));
	}

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		sidebarModeStore.set(isSidebar);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('presi-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('presi-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		isDark = !isDark;
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
		document.documentElement.classList.toggle('dark', isDark);
	}

	function handleLogout() {
		auth.logout();
		goto('/login');
	}

	// Redirect to login if not authenticated
	$effect(() => {
		if (!auth.isLoading && !auth.isAuthenticated && !publicRoutes.includes($page.url.pathname)) {
			goto('/login');
		}
	});

	onMount(() => {
		// Initialize auth
		auth.init();

		// Initialize theme
		isDark =
			localStorage.getItem('theme') === 'dark' ||
			(!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
		document.documentElement.classList.toggle('dark', isDark);

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('presi-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('presi-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		loading = false;
	});
</script>

<svelte:head>
	<title>Presi - Presentation Creator</title>
</svelte:head>

{#if loading || auth.isLoading}
	<div class="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"
			></div>
			<p class="text-slate-500 dark:text-slate-400">Laden...</p>
		</div>
	</div>
{:else if auth.isAuthenticated || publicRoutes.includes($page.url.pathname)}
	{#if auth.isAuthenticated && !publicRoutes.includes($page.url.pathname) && !shouldHideNav($page.url.pathname)}
		<!-- Navigation Layout -->
		<div class="layout-container">
			<!-- Floating/Sidebar Pill Navigation -->
			<PillNavigation
				items={navItems}
				currentPath={$page.url.pathname}
				appName="Presi"
				homeRoute="/"
				onToggleTheme={handleToggleTheme}
				{isDark}
				{isSidebarMode}
				onModeChange={handleModeChange}
				{isCollapsed}
				onCollapsedChange={handleCollapsedChange}
				showThemeToggle={true}
				showLanguageSwitcher={false}
				showLogout={true}
				onLogout={handleLogout}
				primaryColor="#0ea5e9"
			/>

			<!-- Main Content with dynamic padding based on nav mode -->
			<main
				class="main-content"
				class:sidebar-mode={isSidebarMode && !isCollapsed}
				class:floating-mode={!isSidebarMode && !isCollapsed}
			>
				<div class="content-wrapper">
					{@render children()}
				</div>
			</main>
		</div>
	{:else}
		<!-- Public/Presentation routes without nav -->
		<main class="min-h-screen bg-slate-50 dark:bg-slate-900">
			{@render children()}
		</main>
	{/if}
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
