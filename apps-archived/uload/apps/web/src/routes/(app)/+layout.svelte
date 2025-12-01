<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { accountsStore } from '$lib/stores/accounts';
	import { workspacesStore } from '$lib/stores/workspaces';
	import { activeWorkspace } from '$lib/stores/activeWorkspace';
	import type { LayoutData } from './$types';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';

	let { data, children }: { data: LayoutData; children: any } = $props();

	// App switcher items
	const appItems = getPillAppItems('uload');

	// User email for dropdown
	let userEmail = $derived(data.user?.email);

	// Navigation items for uload
	const navItems: PillNavItem[] = [
		{ href: '/', label: 'Dashboard', icon: 'home' },
		{ href: '/links', label: 'Links', icon: 'link' },
		{ href: '/analytics', label: 'Analytics', icon: 'chart' },
		{ href: '/teams', label: 'Teams', icon: 'users' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
	];

	let loading = $state(true);
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);
	let isDark = $state(false);

	// Navigation shortcuts (Ctrl+1-5)
	const navRoutes = ['/', '/links', '/analytics', '/teams', '/settings'];

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
			localStorage.setItem('uload-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('uload-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('uload-dark-mode', String(isDark));
		}
	}

	async function handleLogout() {
		// Clear local storage and redirect
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('auth_token');
		}
		goto('/login');
	}

	// Watch for URL workspace parameter changes
	$effect(() => {
		const urlWorkspaceId = $page.url.searchParams.get('workspace');
		if (urlWorkspaceId) {
			activeWorkspace.initFromUrl(urlWorkspaceId);
		}
	});

	onMount(() => {
		// Initialize both stores during migration
		if (data.user) {
			accountsStore.init(data.user, data.sharedAccounts || [], data.viewingAs);
			workspacesStore.init(
				data.user,
				data.personalWorkspace,
				data.teamWorkspaces || [],
				data.currentWorkspaceId
			);

			const urlWorkspaceId = $page.url.searchParams.get('workspace');
			if (urlWorkspaceId) {
				activeWorkspace.initFromUrl(urlWorkspaceId);
				const workspace =
					data.teamWorkspaces?.find((w) => w.id === urlWorkspaceId) ||
					(data.personalWorkspace?.id === urlWorkspaceId ? data.personalWorkspace : null);
				if (workspace) {
					activeWorkspace.set(workspace);
				}
			}
		}

		// Restore nav mode from localStorage
		if (typeof localStorage !== 'undefined') {
			const savedSidebar = localStorage.getItem('uload-nav-sidebar');
			if (savedSidebar === 'true') {
				isSidebarMode = true;
			}
			const savedCollapsed = localStorage.getItem('uload-nav-collapsed');
			if (savedCollapsed === 'true') {
				isCollapsed = true;
			}
			const savedDark = localStorage.getItem('uload-dark-mode');
			if (savedDark === 'true') {
				isDark = true;
				document.documentElement.classList.add('dark');
			}
		}

		loading = false;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"
			></div>
			<p class="text-gray-600 dark:text-gray-400">Laden...</p>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen flex-col">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="uload"
			homeRoute="/"
			onLogout={handleLogout}
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isSidebarMode}
			onModeChange={handleModeChange}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			primaryColor="#6366f1"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			manaHref="/subscription"
			profileHref="/profile"
			allAppsHref="/apps"
		>
			{#snippet logo()}
				<span class="text-xl">🔗</span>
				<span class="pill-label font-bold">uload</span>
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
				{@render children?.()}
			</div>
		</main>
	</div>
{/if}
