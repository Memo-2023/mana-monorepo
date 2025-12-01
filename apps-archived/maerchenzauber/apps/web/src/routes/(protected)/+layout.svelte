<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/authStore.svelte';
	import { onMount } from 'svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';

	// App switcher items
	const appItems = getPillAppItems('maerchenzauber');

	// User email for dropdown
	let userEmail = $derived(authStore.user?.email);

	// Navigation items for Märchenzauber
	const navItems: PillNavItem[] = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'home' },
		{ href: '/stories', label: 'Geschichten', icon: 'document' },
		{ href: '/characters', label: 'Charaktere', icon: 'users' },
		{ href: '/discover', label: 'Entdecken', icon: 'compass' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
	];

	let { children } = $props();
	let loading = $state(true);
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);
	let isDark = $state(false);

	// Navigation shortcuts (Ctrl+1-5)
	const navRoutes = ['/dashboard', '/stories', '/characters', '/discover', '/settings'];

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
			localStorage.setItem('maerchenzauber-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('maerchenzauber-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('maerchenzauber-dark-mode', String(isDark));
		}
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	onMount(async () => {
		await authStore.initialize();

		if (!authStore.isAuthenticated) {
			goto(`/login?redirectTo=${$page.url.pathname}`);
			return;
		}

		// Restore nav mode from localStorage
		if (typeof localStorage !== 'undefined') {
			const savedSidebar = localStorage.getItem('maerchenzauber-nav-sidebar');
			if (savedSidebar === 'true') {
				isSidebarMode = true;
			}
			const savedCollapsed = localStorage.getItem('maerchenzauber-nav-collapsed');
			if (savedCollapsed === 'true') {
				isCollapsed = true;
			}
			const savedDark = localStorage.getItem('maerchenzauber-dark-mode');
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
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"
			></div>
			<p class="text-gray-600 dark:text-gray-400">Laden...</p>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen flex-col">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Märchenzauber"
			homeRoute="/dashboard"
			onLogout={handleLogout}
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isSidebarMode}
			onModeChange={handleModeChange}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			primaryColor="#ec4899"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
			manaHref="/subscription"
			profileHref="/profile"
			allAppsHref="/apps"
		>
			{#snippet logo()}
				<span class="text-xl">✨</span>
				<span class="pill-label font-bold">Märchenzauber</span>
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

	<ToastContainer />
{/if}
