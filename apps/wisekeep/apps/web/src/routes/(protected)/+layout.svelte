<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem } from '@manacore/shared-ui';
	import { getPillAppItems } from '@manacore/shared-branding';
	import { AuthGate, GuestWelcomeModal, SessionExpiredBanner } from '@manacore/shared-auth-ui';
	import { shouldShowGuestWelcome } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { wisekeepStore } from '$lib/data/local-store';

	let { children } = $props();
	const appItems = getPillAppItems();
	let userEmail = $derived(authStore.isAuthenticated ? (authStore.user?.email ?? '') : '');
	let showGuestWelcome = $state(false);
	let isCollapsed = $state(false);
	let isDark = $state(true);

	const navItems: PillNavItem[] = [
		{ href: '/transcribe', label: 'Transkribieren', icon: 'mic' },
		{ href: '/transcripts', label: 'Bibliothek', icon: 'book' },
		{ href: '/playlists', label: 'Playlists', icon: 'list' },
	];

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		localStorage?.setItem('wisekeep-collapsed', String(collapsed));
	}

	function handleToggleTheme() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		localStorage?.setItem('wisekeep-dark', String(isDark));
	}

	async function handleLogout() {
		wisekeepStore.stopSync();
		await authStore.signOut();
		goto('/auth/login');
	}

	function handleAuthReady() {
		if (authStore.isAuthenticated) wisekeepStore.startSync(() => authStore.getValidToken());
		if (!authStore.isAuthenticated && shouldShowGuestWelcome('wisekeep')) showGuestWelcome = true;
		const c = localStorage?.getItem('wisekeep-collapsed');
		if (c === 'true') isCollapsed = true;
		const d = localStorage?.getItem('wisekeep-dark');
		isDark = d !== 'false';
		document.documentElement.classList.toggle('dark', isDark);
	}
</script>

<AuthGate {authStore} {goto} allowGuest={true} onReady={handleAuthReady}>
	<div class="flex min-h-screen flex-col">
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Wisekeep"
			homeRoute="/transcribe"
			onLogout={handleLogout}
			onToggleTheme={handleToggleTheme}
			{isDark}
			{isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			primaryColor="#8b5cf6"
			showAppSwitcher={true}
			{appItems}
			{userEmail}
			settingsHref="/settings"
		>
			{#snippet logo()}
				<span class="text-xl">🎙️</span>
				<span class="pill-label font-bold">Wisekeep</span>
			{/snippet}
		</PillNavigation>

		<main class="main-content flex-1 transition-all duration-300 {isCollapsed ? '' : 'pt-20'}">
			<div class="container mx-auto px-4 py-8">
				{@render children()}
			</div>
		</main>
	</div>

	<GuestWelcomeModal
		appId="wisekeep"
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
