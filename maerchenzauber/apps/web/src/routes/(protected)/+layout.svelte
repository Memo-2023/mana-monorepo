<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/authStore.svelte';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

	let { children } = $props();
	let loading = $state(true);
	let isSidebarCollapsed = $state(false);
	let isMobileMenuOpen = $state(false);
	let showKeyboardShortcuts = $state(false);

	// Keyboard shortcuts configuration
	const navRoutes: Record<string, string> = {
		'1': '/dashboard',  // Dashboard
		'2': '/stories',    // Stories
		'3': '/characters', // Characters
		'4': '/discover',   // Discover
		'5': '/settings',   // Settings
	};

	const actionRoutes: Record<string, string> = {
		'n': '/stories/create',    // New Story
		's': '/stories/create',    // New Story (alternative)
		'c': '/characters/create', // New Character
	};

	// Shortcut descriptions for help modal
	const shortcutGroups = [
		{
			title: 'Navigation',
			shortcuts: [
				{ keys: ['Cmd/Ctrl', '1'], description: 'Dashboard' },
				{ keys: ['Cmd/Ctrl', '2'], description: 'Geschichten' },
				{ keys: ['Cmd/Ctrl', '3'], description: 'Charaktere' },
				{ keys: ['Cmd/Ctrl', '4'], description: 'Entdecken' },
				{ keys: ['Cmd/Ctrl', '5'], description: 'Einstellungen' },
			]
		},
		{
			title: 'Aktionen',
			shortcuts: [
				{ keys: ['Cmd/Ctrl', 'N'], description: 'Neue Geschichte' },
				{ keys: ['Cmd/Ctrl', 'Shift', 'C'], description: 'Neuer Charakter' },
				{ keys: ['?'], description: 'Tastaturkürzel anzeigen' },
			]
		},
		{
			title: 'Allgemein',
			shortcuts: [
				{ keys: ['Esc'], description: 'Menü/Modal schließen' },
				{ keys: ['B'], description: 'Seitenleiste ein-/ausblenden' },
			]
		}
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

		// ? to show keyboard shortcuts
		if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
			event.preventDefault();
			showKeyboardShortcuts = !showKeyboardShortcuts;
			return;
		}

		// ESC to close modals/menus
		if (event.key === 'Escape') {
			if (showKeyboardShortcuts) {
				showKeyboardShortcuts = false;
				return;
			}
			if (isMobileMenuOpen) {
				isMobileMenuOpen = false;
				return;
			}
		}

		// B to toggle sidebar (without modifiers)
		if (event.key === 'b' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
			event.preventDefault();
			handleSidebarToggle();
			return;
		}

		// Ctrl/Cmd + key shortcuts
		if ((event.ctrlKey || event.metaKey) && !event.altKey) {
			// Ctrl/Cmd + number for navigation
			const route = navRoutes[event.key];
			if (route) {
				event.preventDefault();
				goto(route);
				return;
			}

			// Ctrl/Cmd + Shift + C for new character
			if (event.shiftKey && event.key.toLowerCase() === 'c') {
				event.preventDefault();
				goto('/characters/create');
				return;
			}

			// Ctrl/Cmd + N for new story
			if (!event.shiftKey && event.key.toLowerCase() === 'n') {
				event.preventDefault();
				goto('/stories/create');
				return;
			}
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

	<!-- Toast Notifications -->
	<ToastContainer />

	<!-- Keyboard Shortcuts Modal -->
	{#if showKeyboardShortcuts}
		<div
			class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
			onclick={() => (showKeyboardShortcuts = false)}
			onkeydown={(e) => e.key === 'Escape' && (showKeyboardShortcuts = false)}
			role="button"
			tabindex="0"
		>
			<div
				class="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
			>
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">Tastaturkürzel</h2>
					<button
						onclick={() => (showKeyboardShortcuts = false)}
						class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
						aria-label="Schließen"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="space-y-6">
					{#each shortcutGroups as group}
						<div>
							<h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
								{group.title}
							</h3>
							<div class="space-y-2">
								{#each group.shortcuts as shortcut}
									<div class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
										<span class="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
										<div class="flex gap-1">
											{#each shortcut.keys as key}
												<kbd class="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-300">
													{key}
												</kbd>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>

				<p class="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
					Drücke <kbd class="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-600">?</kbd> um dieses Menü zu öffnen
				</p>
			</div>
		</div>
	{/if}
{/if}
