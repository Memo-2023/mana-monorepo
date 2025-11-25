<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth, isAuthenticated } from '$lib/stores/auth';
	import { isSidebarMode as sidebarModeStore, isNavCollapsed as collapsedStore } from '$lib/stores/navigation';
	import { theme } from '$lib/stores/theme';
	import { locale } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillDropdownItem } from '@manacore/shared-ui';

	// Navigation shortcuts (Ctrl+1-9)
	const navRoutes = [
		'/record',      // Ctrl+1
		'/memos',       // Ctrl+2
		'/upload',      // Ctrl+3
		'/audio-archive', // Ctrl+4
		'/tags',        // Ctrl+5
		'/subscription', // Ctrl+6
		'/blueprints',  // Ctrl+7
		'/statistics',  // Ctrl+8
		'/settings',    // Ctrl+9
	];

	// Navigation items for Memoro
	const navItems: PillNavItem[] = [
		{ href: '/record', label: 'Aufnehmen', icon: 'mic' },
		{ href: '/memos', label: 'Memos', icon: 'archive' },
		{ href: '/upload', label: 'Upload', icon: 'upload' },
		{ href: '/audio-archive', label: 'Audio-Archiv', icon: 'music' },
		{ href: '/tags', label: 'Tags', icon: 'tag' },
		{ href: '/subscription', label: 'Mana', icon: 'mana' },
		{ href: '/blueprints', label: 'Blueprints', icon: 'document' },
		{ href: '/statistics', label: 'Statistics', icon: 'chart' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
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

		// Ctrl+1-9 for navigation
		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
			const num = parseInt(event.key);
			if (num >= 1 && num <= 9) {
				event.preventDefault();
				const route = navRoutes[num - 1];
				if (route) {
					goto(route);
				}
			}
		}
	}

	let { children } = $props();
	let loading = $state(true);
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Get theme state
	let effectiveMode = $derived(theme.effectiveMode);

	// Check if current page needs full height (no scroll container)
	const isFullHeightPage = $derived(
		$page.url.pathname === '/record' || $page.url.pathname === '/memos' || $page.url.pathname === '/dashboard'
	);

	// Language state - sync with svelte-i18n locale
	let currentLanguage = $derived($locale || 'de');

	const languages = [
		{ code: 'de', label: 'Deutsch' },
		{ code: 'en', label: 'English' },
		{ code: 'es', label: 'Español' },
		{ code: 'fr', label: 'Français' },
		{ code: 'it', label: 'Italiano' },
	];

	const languageItems: PillDropdownItem[] = $derived(languages.map(lang => ({
		id: lang.code,
		label: lang.label,
		onClick: () => {
			locale.set(lang.code);
		},
		active: currentLanguage === lang.code
	})));

	const currentLanguageLabel = $derived(
		languages.find(l => l.code === currentLanguage)?.label || 'Deutsch'
	);

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		sidebarModeStore.set(isSidebar);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('memoro-nav-sidebar', String(isSidebar));
		}
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		collapsedStore.set(collapsed);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('memoro-nav-collapsed', String(collapsed));
		}
	}

	function handleToggleTheme() {
		theme.toggleMode();
	}

	// Client-side auth guard
	onMount(() => {
		if (!$isAuthenticated) {
			goto(`/login?redirectTo=${$page.url.pathname}`);
		} else {
			// Initialize sidebar mode from localStorage
			const savedSidebar = localStorage.getItem('memoro-nav-sidebar');
			if (savedSidebar === 'true') {
				isSidebarMode = true;
				sidebarModeStore.set(true);
			}

			// Initialize collapsed state from localStorage
			const savedCollapsed = localStorage.getItem('memoro-nav-collapsed');
			if (savedCollapsed === 'true') {
				isCollapsed = true;
				collapsedStore.set(true);
			}
			loading = false;
		}
	});

	async function handleLogout() {
		await auth.signOut();
		goto('/login');
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid spinner-border border-r-transparent"></div>
			<p class="text-theme-secondary">Loading...</p>
		</div>
	</div>
{:else}
	<!-- Navigation Layout -->
	<div class="flex flex-col min-h-screen">
		<!-- Floating/Sidebar Pill Navigation -->
		<PillNavigation
			items={navItems}
			currentPath={$page.url.pathname}
			appName="Memoro"
			homeRoute="/record"
			onLogout={handleLogout}
			onToggleTheme={handleToggleTheme}
			isDark={effectiveMode === 'dark'}
			isSidebarMode={isSidebarMode}
			onModeChange={handleModeChange}
			isCollapsed={isCollapsed}
			onCollapsedChange={handleCollapsedChange}
			showThemeToggle={true}
			showLanguageSwitcher={true}
			languageItems={languageItems}
			currentLanguageLabel={currentLanguageLabel}
			primaryColor="#F7D44C"
		>
			{#snippet logo()}
				<svg class="pill-icon" width="16" height="16" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" clip-rule="evenodd" d="M280 140C280 217.32 217.32 280 140 280C62.6801 280 0 217.32 0 140C0 62.6801 62.6801 0 140 0C217.32 0 280 62.6801 280 140ZM247.988 140C247.988 199.64 199.64 241.988 140 241.988C80.3598 241.988 32.0118 199.64 32.0118 140C32.0118 111.918 36.7308 95.3397 54.3005 76.1331C58.5193 71.5212 70.5 63 79.3937 74.511L119.781 131.788C134.5 149 149 147 160.218 131.788L200.605 74.5101C208 64 221.48 71.5203 225.699 76.1321C243.269 95.3388 247.988 111.918 247.988 140Z" fill="#F7D44C"/>
				</svg>
				<span class="pill-label font-bold">Memoro</span>
			{/snippet}
		</PillNavigation>

		<!-- Main Content with dynamic padding based on nav mode -->
		<main
			class="flex-1 main-content transition-all duration-300 {isCollapsed ? '' : (isSidebarMode ? 'pl-[180px]' : 'pt-20')} {isFullHeightPage ? 'overflow-hidden' : 'overflow-auto'}"
		>
			{#if isFullHeightPage}
				<!-- Full width and height, no container -->
				{@render children?.()}
			{:else}
				<!-- Other pages: Normal container layout -->
				<div class="container mx-auto px-4 py-8">
					{@render children?.()}
				</div>
			{/if}
		</main>
	</div>
{/if}
