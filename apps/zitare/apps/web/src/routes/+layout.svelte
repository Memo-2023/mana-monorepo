<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem } from '@manacore/shared-ui';
	import { theme } from '$lib/stores/theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import '../app.css';

	let { children } = $props();

	let loading = $state(true);
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Get theme state
	let isDark = $state(false);

	// Navigation items for Zitare
	const navItems: PillNavItem[] = [
		{ href: '/', label: 'Start', icon: 'home' },
		{ href: '/search', label: 'Suche', icon: 'search' },
		{ href: '/discover', label: 'Entdecken', icon: 'compass' },
		{ href: '/authors', label: 'Autoren', icon: 'users' },
		{ href: '/favorites', label: 'Favoriten', icon: 'heart' },
		{ href: '/lists', label: 'Listen', icon: 'list' },
	];

	// Navigation shortcuts (Ctrl+1-5)
	const navRoutes = navItems.map((item) => item.href);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;

		// Cmd/Ctrl+K to open search (works even in inputs)
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			goto('/search');
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
			localStorage.setItem('zitare-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('zitare-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		theme.toggle();
		isDark = !isDark;
	}

	onMount(() => {
		// Initialize theme
		theme.init();
		isDark = document.documentElement.classList.contains('dark');

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('zitare-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('zitare-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}

		loading = false;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<ToastContainer />

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"
			></div>
			<p class="text-gray-500 dark:text-gray-400">Laden...</p>
		</div>
	</div>
{:else}
	<!-- Navigation Layout -->
	<div class="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
		<!-- Floating/Sidebar Pill Navigation -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Zitare"
			homeRoute="/"
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isSidebarMode}
			onModeChange={handleModeChange}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			showLanguageSwitcher={false}
			showLogout={false}
			primaryColor="#f59e0b"
		/>

		<!-- Main Content with dynamic padding based on nav mode -->
		<main
			class="flex-1 transition-all duration-300 {isCollapsed
				? ''
				: isSidebarMode
					? 'pl-[180px]'
					: 'pt-24'}"
		>
			<div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
				{@render children()}
			</div>
		</main>
	</div>
{/if}
