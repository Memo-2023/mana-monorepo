<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore.svelte';
	import { theme } from '$lib/stores/theme';
	import {
		isSidebarMode as sidebarModeStore,
		isNavCollapsed as collapsedStore,
	} from '$lib/stores/navigation';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem } from '@manacore/shared-ui';

	let { children } = $props();

	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Get theme state
	let effectiveMode = $derived(theme.effectiveMode);

	// Navigation items for ManaDeck
	const navItems: PillNavItem[] = [
		{ href: '/decks', label: 'Decks', icon: 'archive' },
		{ href: '/explore', label: 'Explore', icon: 'search' },
		{ href: '/progress', label: 'Progress', icon: 'chart' },
		{ href: '/subscription', label: 'Mana', icon: 'mana' },
		{ href: '/profile', label: 'Profile', icon: 'user' },
	];

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
			localStorage.setItem('manadeck-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('manadeck-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		theme.toggleMode();
	}

	async function handleSignOut() {
		await authStore.signOut();
		goto('/login');
	}

	onMount(async () => {
		await authStore.initialize();

		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Initialize sidebar mode from localStorage
		const savedSidebar = localStorage.getItem('manadeck-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			sidebarModeStore.set(true);
		}

		// Initialize collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('manadeck-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			collapsedStore.set(true);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if authStore.loading}
	<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
		<div class="text-center">
			<div
				class="inline-block animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"
			></div>
			<p class="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
		</div>
	</div>
{:else if authStore.isAuthenticated}
	<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
		<!-- Pill Navigation -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="ManaDeck"
			homeRoute="/decks"
			onLogout={handleSignOut}
			onToggleTheme={handleToggleTheme}
			isDark={effectiveMode === 'dark'}
			{isSidebarMode}
			onModeChange={handleModeChange}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			showLanguageSwitcher={false}
			primaryColor="#6366f1"
		/>

		<!-- Main content with dynamic padding -->
		<main
			class="transition-all duration-300 {isCollapsed
				? ''
				: isSidebarMode
					? 'pl-[180px]'
					: 'pt-20'}"
		>
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{@render children()}
			</div>
		</main>
	</div>
{/if}
