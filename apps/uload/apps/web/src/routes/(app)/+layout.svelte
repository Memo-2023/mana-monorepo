<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem } from '@manacore/shared-ui';
	import { getPillAppItems, getManaApp } from '@manacore/shared-branding';
	import { AuthGate, GuestWelcomeModal, SessionExpiredBanner } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { uloadStore } from '$lib/data/local-store';

	let { children } = $props();

	let appItems = $derived(getPillAppItems(undefined, undefined, undefined, authStore.user?.tier));

	let userEmail = $derived(authStore.isAuthenticated ? (authStore.user?.email ?? '') : '');

	const navItems: PillNavItem[] = [
		{ href: '/my/links', label: 'Links', icon: 'link' },
		{ href: '/my/tags', label: 'Tags', icon: 'tag' },
		{ href: '/my/analytics', label: 'Analytics', icon: 'chart' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
	];

	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);
	let isDark = $state(false);
	let showGuestWelcome = $state(false);

	const navRoutes = ['/my/links', '/my/tags', '/my/analytics', '/settings'];

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}
		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const num = parseInt(event.key);
			if (num >= 1 && num <= 4) {
				event.preventDefault();
				const route = navRoutes[num - 1];
				if (route) goto(route);
			}
		}
	}

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		localStorage?.setItem('uload-nav-sidebar', String(isSidebar));
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		localStorage?.setItem('uload-nav-collapsed', String(collapsed));
	}

	function handleToggleTheme() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		localStorage?.setItem('uload-dark-mode', String(isDark));
	}

	async function handleLogout() {
		uloadStore.stopSync();
		await authStore.signOut();
		goto('/login');
	}

	function handleAuthReady() {
		// Start sync if authenticated
		if (authStore.isAuthenticated) {
			uloadStore.startSync(() => authStore.getValidToken());
		}

		// Show guest welcome for first-time guests
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('uload')) {
			showGuestWelcome = true;
		}

		// Restore nav preferences
		const savedSidebar = localStorage?.getItem('uload-nav-sidebar');
		if (savedSidebar === 'true') isSidebarMode = true;
		const savedCollapsed = localStorage?.getItem('uload-nav-collapsed');
		if (savedCollapsed === 'true') isCollapsed = true;
		const savedDark = localStorage?.getItem('uload-dark-mode');
		if (savedDark === 'true') {
			isDark = true;
			document.documentElement.classList.add('dark');
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<AuthGate
	{authStore}
	{goto}
	allowGuest={true}
	onReady={handleAuthReady}
	requiredTier={getManaApp('uload')?.requiredTier}
	appName={getManaApp('uload')?.name}
>
	<div class="flex min-h-screen flex-col">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="uload"
			homeRoute="/my/links"
			onLogout={handleLogout}
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			primaryColor="#6366f1"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
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

	<GuestWelcomeModal
		appId="uload"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/login')}
		onRegister={() => goto('/register')}
		locale="de"
	/>

	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale="de" loginHref="/login" />
	{/if}
</AuthGate>
