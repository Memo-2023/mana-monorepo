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
	import { newsStore } from '$lib/data/local-store';

	let { children } = $props();

	let appItems = $derived(getPillAppItems(undefined, undefined, undefined, authStore.user?.tier));
	let userEmail = $derived(authStore.isAuthenticated ? (authStore.user?.email ?? '') : '');

	const navItems: PillNavItem[] = [
		{ href: '/feed', label: 'Feed', icon: 'rss' },
		{ href: '/saved', label: 'Gespeichert', icon: 'bookmark' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
	];

	let isCollapsed = $state(false);
	let isDark = $state(true);
	let showGuestWelcome = $state(false);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
			return;
		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const num = parseInt(event.key);
			const routes = ['/feed', '/saved', '/settings'];
			if (num >= 1 && num <= 3) {
				event.preventDefault();
				goto(routes[num - 1]);
			}
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		localStorage?.setItem('news-nav-collapsed', String(collapsed));
	}

	function handleToggleTheme() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		localStorage?.setItem('news-dark-mode', String(isDark));
	}

	async function handleLogout() {
		newsStore.stopSync();
		await authStore.signOut();
		goto('/auth/login');
	}

	function handleAuthReady() {
		if (authStore.isAuthenticated) {
			newsStore.startSync(() => authStore.getValidToken());
		}
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('news')) {
			showGuestWelcome = true;
		}
		const savedCollapsed = localStorage?.getItem('news-nav-collapsed');
		if (savedCollapsed === 'true') isCollapsed = true;
		const savedDark = localStorage?.getItem('news-dark-mode');
		isDark = savedDark !== 'false'; // default dark
		document.documentElement.classList.toggle('dark', isDark);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<AuthGate
	{authStore}
	{goto}
	allowGuest={true}
	onReady={handleAuthReady}
	requiredTier={getManaApp('news')?.requiredTier}
	appName={getManaApp('news')?.name}
>
	<div class="flex min-h-screen flex-col">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="News"
			homeRoute="/feed"
			onLogout={handleLogout}
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			primaryColor="#10b981"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
		>
			{#snippet logo()}
				<span class="text-xl">📰</span>
				<span class="pill-label font-bold">News</span>
			{/snippet}
		</PillNavigation>

		<main class="main-content flex-1 transition-all duration-300 {isCollapsed ? '' : 'pt-20'}">
			<div class="container mx-auto px-4 py-8">
				{@render children()}
			</div>
		</main>
	</div>

	<GuestWelcomeModal
		appId="news"
		visible={showGuestWelcome}
		onClose={() => (showGuestWelcome = false)}
		onLogin={() => goto('/auth/login')}
		onRegister={() => goto('/auth/register')}
		locale="de"
	/>

	{#if authStore.isAuthenticated}
		<SessionExpiredBanner locale="de" loginHref="/auth/login" />
	{/if}
</AuthGate>
