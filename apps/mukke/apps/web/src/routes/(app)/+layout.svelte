<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import MiniPlayer from '$lib/components/MiniPlayer.svelte';
	import FullPlayer from '$lib/components/FullPlayer.svelte';
	import QueuePanel from '$lib/components/QueuePanel.svelte';

	let { children } = $props();
	let sidebarOpen = $state(false);

	$effect(() => {
		if (authStore.initialized && !authStore.isAuthenticated) {
			goto('/login');
		}
	});

	const navItems = [
		{
			label: 'Dashboard',
			href: '/dashboard',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		},
		{
			label: 'Library',
			href: '/library',
			icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
		},
		{
			label: 'Search',
			href: '/search',
			icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
		},
		{
			label: 'Playlists',
			href: '/playlists',
			icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
		},
		{
			label: 'Editor Projects',
			href: '/projects',
			icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
		},
		{
			label: 'Upload',
			href: '/upload',
			icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
		},
	];

	function isActive(href: string, pathname: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

{#if !authStore.isAuthenticated}
	<div class="min-h-screen flex items-center justify-center">
		<div
			class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
		></div>
	</div>
{:else}
	<div class="flex h-screen overflow-hidden">
		<!-- Mobile overlay -->
		{#if sidebarOpen}
			<div
				class="fixed inset-0 bg-black/50 z-30 lg:hidden"
				onclick={closeSidebar}
				role="presentation"
			></div>
		{/if}

		<!-- Sidebar -->
		<aside
			class="fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 {sidebarOpen
				? 'translate-x-0'
				: '-translate-x-full'}"
		>
			<!-- Logo -->
			<div class="flex items-center justify-between h-16 px-4 border-b border-border">
				<a href="/" class="text-xl font-bold text-primary">Mukke</a>
				<button
					class="p-1 text-foreground-secondary hover:text-foreground lg:hidden"
					onclick={closeSidebar}
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
				{#each navItems as item}
					<a
						href={item.href}
						onclick={closeSidebar}
						class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {isActive(
							item.href,
							$page.url.pathname
						)
							? 'bg-primary text-white'
							: 'text-foreground-secondary hover:text-foreground hover:bg-background'}"
					>
						<svg
							class="w-5 h-5 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
						</svg>
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- User info -->
			<div class="border-t border-border p-4">
				<div class="flex items-center gap-3">
					<div
						class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium"
					>
						{authStore.user?.email?.[0]?.toUpperCase() ?? '?'}
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium truncate">{authStore.user?.email ?? ''}</p>
					</div>
					<button
						onclick={() => authStore.signOut()}
						class="p-1.5 text-foreground-secondary hover:text-foreground transition-colors"
						title="Logout"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg>
					</button>
				</div>
			</div>
		</aside>

		<!-- Main content -->
		<div class="flex-1 flex flex-col min-w-0">
			<!-- Mobile header -->
			<header class="h-16 border-b border-border flex items-center px-4 lg:hidden">
				<button
					class="p-1.5 text-foreground-secondary hover:text-foreground"
					onclick={() => (sidebarOpen = true)}
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>
				<span class="ml-3 text-lg font-bold text-primary">Mukke</span>
			</header>

			<!-- Page content -->
			<main class="flex-1 overflow-y-auto">
				{@render children()}
			</main>

			<!-- MiniPlayer -->
			<MiniPlayer />
		</div>
	</div>

	<!-- Full Player Overlay -->
	<FullPlayer />

	<!-- Queue Panel -->
	<QueuePanel />
{/if}
