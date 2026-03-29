<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { initWebSocket, cleanup, isConnected } from '$lib/stores/jobs';
	import type { LayoutData } from './$types';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';

	let { children, data }: { children: any; data: LayoutData } = $props();

	// App switcher items
	const appItems = getPillAppItems('wisekeep');

	// User email for dropdown
	let userEmail = $derived(authStore.user?.email);

	// Navigation items for Wisekeep
	const navItems: PillNavItem[] = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'home' },
		{ href: '/transcribe', label: 'Transcribe', icon: 'mic' },
		{ href: '/transcripts', label: 'Transcripts', icon: 'document' },
		{ href: '/playlists', label: 'Playlists', icon: 'list' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
	];

	let isChecking = $state(true);
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);
	let isDark = $state(false);

	// Navigation shortcuts (Ctrl+1-5)
	const navRoutes = ['/dashboard', '/transcribe', '/transcripts', '/playlists', '/settings'];

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const num = parseInt(event.key);
			if (num >= 1 && num <= 5) {
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
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('wisekeep-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('wisekeep-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('wisekeep-dark-mode', String(isDark));
		}
	}

	async function handleSignOut() {
		await authStore.signOut();
		goto('/login');
	}

	// Check auth on mount and redirect if not authenticated
	onMount(async () => {
		let shouldRedirect = false;

		try {
			await authStore.initialize();
			shouldRedirect = !authStore.isAuthenticated;

			if (!shouldRedirect) {
				// Initialize WebSocket after auth check
				initWebSocket();
			}
		} catch (error) {
			console.error('Protected layout init error:', error);
			shouldRedirect = true;
		}

		// Restore nav mode from localStorage
		if (typeof localStorage !== 'undefined') {
			const savedSidebar = localStorage.getItem('wisekeep-nav-sidebar');
			if (savedSidebar === 'true') {
				isSidebarMode = true;
			}
			const savedCollapsed = localStorage.getItem('wisekeep-nav-collapsed');
			if (savedCollapsed === 'true') {
				isCollapsed = true;
			}
			const savedDark = localStorage.getItem('wisekeep-dark-mode');
			if (savedDark === 'true') {
				isDark = true;
				document.documentElement.classList.add('dark');
			}
		}

		// Always set isChecking to false
		isChecking = false;

		if (shouldRedirect) {
			const redirectTo = encodeURIComponent(data.pathname || '/dashboard');
			goto(`/login?redirectTo=${redirectTo}`);
		}

		// Return cleanup function
		return () => cleanup();
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isChecking}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"
			></div>
			<p class="text-gray-600 dark:text-gray-400">Laden...</p>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen flex-col">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Wisekeep"
			homeRoute="/dashboard"
			onLogout={handleSignOut}
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isSidebarMode}
			onModeChange={handleModeChange}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			primaryColor="#9333ea"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			manaHref="/subscription"
			profileHref="/profile"
			allAppsHref="/apps"
		>
			{#snippet logo()}
				<span class="text-xl">🧠</span>
				<span class="pill-label font-bold">Wisekeep</span>
			{/snippet}
		</PillNavigation>

		<main
			class="main-content flex-1 transition-all duration-300 {isCollapsed
				? ''
				: isSidebarMode
					? 'pl-[180px]'
					: 'pt-20'}"
		>
			<div class="container mx-auto px-4 py-8">
				{@render children()}
			</div>
		</main>
	</div>
{/if}
