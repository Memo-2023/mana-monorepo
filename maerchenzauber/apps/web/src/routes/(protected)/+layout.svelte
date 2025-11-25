<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/authStore.svelte';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Header from '$lib/components/layout/Header.svelte';

	let { children } = $props();
	let loading = $state(true);
	let isSidebarCollapsed = $state(false);
	let isMobileMenuOpen = $state(false);

	// Keyboard shortcuts
	const navRoutes: Record<string, string> = {
		'1': '/dashboard',  // Dashboard
		'2': '/stories',    // Stories
		'3': '/characters', // Characters
		'4': '/discover',   // Discover
		'5': '/settings',   // Settings
	};

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

		// Ctrl/Cmd + number for navigation
		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const route = navRoutes[event.key];
			if (route) {
				event.preventDefault();
				goto(route);
			}
		}

		// ESC to close mobile menu
		if (event.key === 'Escape' && isMobileMenuOpen) {
			isMobileMenuOpen = false;
		}
	}

	function handleSidebarToggle() {
		isSidebarCollapsed = !isSidebarCollapsed;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('maerchenzauber-sidebar-collapsed', String(isSidebarCollapsed));
		}
	}

	function handleMobileMenuToggle() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	// Client-side auth guard
	onMount(async () => {
		await authStore.initialize();

		if (!authStore.isAuthenticated) {
			goto(`/login?redirectTo=${$page.url.pathname}`);
			return;
		}

		// Restore sidebar state from localStorage
		if (typeof localStorage !== 'undefined') {
			const savedCollapsed = localStorage.getItem('maerchenzauber-sidebar-collapsed');
			if (savedCollapsed === 'true') {
				isSidebarCollapsed = true;
			}
		}

		loading = false;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if loading}
	<!-- Loading State -->
	<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
		<div class="text-center">
			<div class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
			<p class="text-gray-600 dark:text-gray-400">Laden...</p>
		</div>
	</div>
{:else}
	<!-- Main Layout -->
	<div class="flex min-h-screen bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-gray-900 dark:to-gray-800">
		<!-- Sidebar (Desktop) -->
		<Sidebar
			isCollapsed={isSidebarCollapsed}
			currentPath={$page.url.pathname}
			onToggle={handleSidebarToggle}
			onLogout={handleLogout}
		/>

		<!-- Mobile Menu Overlay -->
		{#if isMobileMenuOpen}
			<div
				class="fixed inset-0 z-40 bg-black/50 lg:hidden"
				onclick={() => (isMobileMenuOpen = false)}
				onkeydown={(e) => e.key === 'Escape' && (isMobileMenuOpen = false)}
				role="button"
				tabindex="0"
			></div>
			<div class="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
				<Sidebar
					isCollapsed={false}
					currentPath={$page.url.pathname}
					onToggle={() => (isMobileMenuOpen = false)}
					onLogout={handleLogout}
					isMobile={true}
				/>
			</div>
		{/if}

		<!-- Main Content Area -->
		<div
			class="flex flex-1 flex-col transition-all duration-300"
			class:lg:ml-64={!isSidebarCollapsed}
			class:lg:ml-20={isSidebarCollapsed}
		>
			<!-- Header -->
			<Header
				onMenuClick={handleMobileMenuToggle}
				onLogout={handleLogout}
			/>

			<!-- Page Content -->
			<main class="flex-1 overflow-auto p-4 lg:p-6">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
