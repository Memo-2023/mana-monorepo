<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth, isAuthenticated } from '$lib/stores/auth';
	import { isSidebarMode as sidebarModeStore, isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { onMount } from 'svelte';
	import PillNavigation from '$lib/components/PillNavigation.svelte';

	// Navigation shortcuts (Ctrl+1-9)
	const navRoutes = [
		'/record',      // Ctrl+1
		'/memos',       // Ctrl+2
		'/upload',      // Ctrl+3
		'/audio-archive', // Ctrl+4
		'/tags',        // Ctrl+5
		'/subscription', // Ctrl+6
		'/blueprints',  // Ctrl+7
		'/statistics',  // Ctrl+8
		'/settings',    // Ctrl+9
	];

	function handleKeydown(event: KeyboardEvent) {
		// Don't handle if user is typing in an input
		const target = event.target as HTMLElement;
		if (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable
		) {
			return;
		}

		// Ctrl+1-9 for navigation
		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const num = parseInt(event.key);
			if (num >= 1 && num <= 9) {
				event.preventDefault();
				const route = navRoutes[num - 1];
				if (route) {
					goto(route);
				}
			}
		}
	}

	let { children } = $props();
	let loading = $state(true);
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Check if current page needs full height (no scroll container)
	const isFullHeightPage = $derived(
		$page.url.pathname === '/record' || $page.url.pathname === '/memos' || $page.url.pathname === '/dashboard'
	);

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		sidebarModeStore.set(isSidebar);
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
	}

	// Client-side auth guard
	onMount(() => {
		if (!$isAuthenticated) {
			goto(`/login?redirectTo=${$page.url.pathname}`);
		} else {
			// Initialize sidebar mode from localStorage
			const savedSidebar = localStorage.getItem('memoro-nav-sidebar');
			if (savedSidebar === 'true') {
				isSidebarMode = true;
				sidebarModeStore.set(true);
			}

			// Initialize collapsed state from localStorage
			const savedCollapsed = localStorage.getItem('memoro-nav-collapsed');
			if (savedCollapsed === 'true') {
				isCollapsed = true;
				collapsedStore.set(true);
			}
			loading = false;
		}
	});

	async function handleLogout() {
		await auth.signOut();
		goto('/login');
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid spinner-border border-r-transparent"></div>
			<p class="text-theme-secondary">Loading...</p>
		</div>
	</div>
{:else}
	<!-- Navigation Layout -->
	<div class="flex flex-col min-h-screen">
		<!-- Floating/Sidebar Pill Navigation -->
		<PillNavigation onLogout={handleLogout} onModeChange={handleModeChange} onCollapsedChange={handleCollapsedChange} />

		<!-- Main Content with dynamic padding based on nav mode -->
		<main
			class="flex-1 main-content transition-all duration-300 {isCollapsed ? '' : (isSidebarMode ? 'pl-[180px]' : 'pt-20')} {isFullHeightPage ? 'overflow-hidden' : 'overflow-auto'}"
		>
			{#if isFullHeightPage}
				<!-- Full width and height, no container -->
				{@render children?.()}
			{:else}
				<!-- Other pages: Normal container layout -->
				<div class="container mx-auto px-4 py-8">
					{@render children?.()}
				</div>
			{/if}
		</main>
	</div>
{/if}
