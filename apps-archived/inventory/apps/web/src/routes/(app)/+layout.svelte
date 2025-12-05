<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import { authStore, categoriesStore, locationsStore } from '$lib/stores';
	import { onMount } from 'svelte';

	let { children } = $props();
	let sidebarOpen = $state(false);

	const navItems = $derived([
		{ href: '/items', label: $_('nav.items'), icon: 'box' },
		{ href: '/favorites', label: $_('nav.favorites'), icon: 'star' },
		{ href: '/archive', label: $_('nav.archive'), icon: 'archive' },
		{ href: '/categories', label: $_('nav.categories'), icon: 'folder' },
		{ href: '/locations', label: $_('nav.locations'), icon: 'map-pin' },
		{ href: '/import', label: $_('nav.import'), icon: 'upload' },
	]);

	const bottomNavItems = $derived([
		{ href: '/settings', label: $_('nav.settings'), icon: 'settings' },
		{ href: '/feedback', label: $_('nav.feedback'), icon: 'message-circle' },
		{ href: '/mana', label: $_('nav.mana'), icon: 'grid' },
	]);

	onMount(async () => {
		if (!authStore.isAuthenticated && !authStore.isLoading) {
			goto('/login');
			return;
		}

		await Promise.all([categoriesStore.fetchCategories(), locationsStore.fetchLocations()]);
	});

	function handleLogout() {
		authStore.signOut();
		goto('/login');
	}

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}
</script>

<div class="flex h-screen bg-theme">
	<!-- Sidebar -->
	<aside class="hidden md:flex md:flex-col md:w-64 border-r border-theme">
		<!-- Logo -->
		<div class="p-4 border-b border-theme">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
					<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
						/>
					</svg>
				</div>
				<span class="font-semibold text-theme">{$_('app.name')}</span>
			</div>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 p-4 space-y-1 overflow-y-auto">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors {isActive(item.href)
						? 'bg-primary/10 text-primary'
						: 'text-theme-secondary hover:bg-theme-secondary/10 hover:text-theme'}"
				>
					<span class="w-5 h-5">
						{#if item.icon === 'box'}
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
								/></svg
							>
						{:else if item.icon === 'star'}
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
								/></svg
							>
						{:else if item.icon === 'archive'}
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
								/></svg
							>
						{:else if item.icon === 'folder'}
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
								/></svg
							>
						{:else if item.icon === 'map-pin'}
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								/></svg
							>
						{:else if item.icon === 'upload'}
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
								/></svg
							>
						{/if}
					</span>
					<span class="text-sm font-medium">{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- Bottom Navigation -->
		<div class="p-4 border-t border-theme space-y-1">
			{#each bottomNavItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors {isActive(item.href)
						? 'bg-primary/10 text-primary'
						: 'text-theme-secondary hover:bg-theme-secondary/10 hover:text-theme'}"
				>
					<span class="w-5 h-5">
						{#if item.icon === 'settings'}
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/></svg
							>
						{:else if item.icon === 'message-circle'}
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								/></svg
							>
						{:else if item.icon === 'grid'}
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
								/></svg
							>
						{/if}
					</span>
					<span class="text-sm font-medium">{item.label}</span>
				</a>
			{/each}

			<button
				onclick={handleLogout}
				class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-theme-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
				<span class="text-sm font-medium">{$_('auth.logout')}</span>
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>
</div>
