<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { AuthGate, GuestWelcomeModal, SessionExpiredBanner } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { moodlitStore } from '$lib/data/local-store';

	let { children } = $props();
	let appItems = $derived(getPillAppItems(undefined, undefined, undefined, authStore.user?.tier));
	let userEmail = $derived(authStore.isAuthenticated ? (authStore.user?.email ?? '') : '');
	let showGuestWelcome = $state(false);
	let isCollapsed = $state(false);
	let isDark = $state(true);

	const navItems: PillNavItem[] = [
		{ href: '/moods', label: 'Moods', icon: 'palette' },
		{ href: '/sequences', label: 'Sequences', icon: 'list' },
	];

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		localStorage?.setItem('moodlit-collapsed', String(collapsed));
	}

	function handleToggleTheme() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
	}

	async function handleLogout() {
		moodlitStore.stopSync();
		await authStore.signOut();
		goto('/auth/login');
	}

	function handleAuthReady() {
		if (authStore.isAuthenticated) moodlitStore.startSync(() => authStore.getValidToken());
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('moodlit')) showGuestWelcome = true;
		const c = localStorage?.getItem('moodlit-collapsed');
		if (c === 'true') isCollapsed = true;
	}
</script>

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<div class="flex min-h-screen flex-col">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Moodlit"
			homeRoute="/moods"
			onLogout={handleLogout}
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			primaryColor="#7c3aed"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
		>
			{#snippet logo()}
				<span class="text-xl">🌈</span>
				<span class="pill-label font-bold">Moodlit</span>
			{/snippet}
		</PillNavigation>

		<main class="main-content flex-1 transition-all duration-300 {isCollapsed ? '' : 'pt-20'}">
			<div class="container mx-auto px-4 py-8">
				{@render children()}
			</div>
		</main>
	</div>

	<GuestWelcomeModal
		appId="moodlit"
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
