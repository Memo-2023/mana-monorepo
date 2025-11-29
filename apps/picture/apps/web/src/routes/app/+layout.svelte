<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PillNavigation } from '@manacore/shared-ui';
	import type { PillNavItem, PillNavElement, PillDropdownItem } from '@manacore/shared-ui';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import KeyboardShortcutsModal from '$lib/components/ui/KeyboardShortcutsModal.svelte';
	import { theme } from '$lib/stores/theme';
	import { isUIVisible, toggleUI, showKeyboardShortcuts } from '$lib/stores/ui';
	import { viewMode, setViewMode, type ViewMode } from '$lib/stores/view';
	import { browser } from '$app/environment';

	let { children } = $props();

	// PillNav state
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	// Load persisted nav state
	$effect(() => {
		if (browser) {
			const savedSidebarMode = localStorage.getItem('picture-nav-sidebar');
			const savedCollapsed = localStorage.getItem('picture-nav-collapsed');
			if (savedSidebarMode !== null) isSidebarMode = savedSidebarMode === 'true';
			if (savedCollapsed !== null) isCollapsed = savedCollapsed === 'true';
		}
	});

	function handleModeChange(isSidebar: boolean) {
		isSidebarMode = isSidebar;
		if (browser) localStorage.setItem('picture-nav-sidebar', String(isSidebar));
	}

	function handleCollapsedChange(collapsed: boolean) {
		isCollapsed = collapsed;
		if (browser) localStorage.setItem('picture-nav-collapsed', String(collapsed));
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/auth/login');
	}

	function handleToggleTheme() {
		theme.toggleMode();
	}

	// Client-side auth check
	$effect(() => {
		if (authStore.initialized && !authStore.loading && !authStore.user) {
			goto('/auth/login');
		}
	});

	// Navigation items
	const navItems: PillNavItem[] = [
		{ href: '/app/gallery', label: 'Galerie', icon: 'home' },
		{ href: '/app/board', label: 'Moodboards', icon: 'grid' },
		{ href: '/app/explore', label: 'Entdecken', icon: 'search' },
		{ href: '/app/generate', label: 'Generieren', icon: 'fire' },
		{ href: '/app/upload', label: 'Upload', icon: 'upload' },
		{ href: '/app/tags', label: 'Tags', icon: 'tag' },
		{ href: '/app/archive', label: 'Archiv', icon: 'archive' },
		{ href: '/app/mana', label: 'Mana', icon: 'mana' },
	];

	// View mode options for tab group
	const viewModeOptions = [
		{ id: 'single', icon: 'list', title: 'Liste (1)' },
		{ id: 'grid3', icon: 'grid', title: 'Mittel (2)' },
		{ id: 'gridSmall', icon: 'gridSmall', title: 'Klein (3)' },
	];

	// Theme variant dropdown items
	let themeVariantItems = $derived<PillDropdownItem[]>([
		...theme.variants.map((variant) => ({
			id: variant,
			label: THEME_DEFINITIONS[variant].label,
			icon: THEME_DEFINITIONS[variant].icon,
			onClick: () => theme.setVariant(variant),
			active: theme.variant === variant,
		})),
		{
			id: 'all-themes',
			label: 'Alle Themes',
			icon: 'palette',
			onClick: () => goto('/app/themes'),
			active: false,
		},
	]);

	// Current theme variant label
	let currentThemeVariantLabel = $derived(THEME_DEFINITIONS[theme.variant].label);

	// Elements (divider + view mode tabs)
	let elements: PillNavElement[] = $derived([
		{ type: 'divider' as const },
		{
			type: 'tabs' as const,
			sectionLabel: 'Ansicht',
			options: viewModeOptions,
			value: $viewMode === 'grid5' ? 'gridSmall' : $viewMode,
			onChange: (id: string) => {
				const mode = id === 'gridSmall' ? 'grid5' : id as ViewMode;
				setViewMode(mode);
			},
		},
	]);

	// Global keyboard shortcuts
	function handleKeyDown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
			return;
		}

		switch (e.key.toLowerCase()) {
			case 'tab':
				e.preventDefault();
				toggleUI();
				break;
			case '?':
				e.preventDefault();
				showKeyboardShortcuts.set(true);
				break;
			case 'escape':
				showKeyboardShortcuts.set(false);
				break;
			case 'g':
				e.preventDefault();
				goto('/app/gallery');
				break;
			case 'm':
				e.preventDefault();
				goto('/app/board');
				break;
			case 'e':
				e.preventDefault();
				goto('/app/explore');
				break;
			case 'n':
				e.preventDefault();
				goto('/app/generate');
				break;
			case 'u':
				e.preventDefault();
				goto('/app/upload');
				break;
			case 'a':
				e.preventDefault();
				goto('/app/archive');
				break;
			case 't':
				e.preventDefault();
				goto('/app/themes');
				break;
			case '1':
				e.preventDefault();
				setViewMode('single');
				break;
			case '2':
				e.preventDefault();
				setViewMode('grid3');
				break;
			case '3':
				e.preventDefault();
				setViewMode('grid5');
				break;
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if authStore.loading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
			></div>
			<p class="text-gray-600">Loading...</p>
		</div>
	</div>
{:else if authStore.user}
	<div class="min-h-screen" style="background-color: hsl(var(--color-background));">
		<!-- PillNavigation (conditionally visible) -->
		{#if $isUIVisible}
			<PillNavigation
				items={navItems}
				{elements}
				currentPath={$page.url.pathname}
				appName="Picture"
				homeRoute="/app/gallery"
				onLogout={handleLogout}
				onToggleTheme={handleToggleTheme}
				isDark={theme.isDark}
				{isSidebarMode}
				onModeChange={handleModeChange}
				{isCollapsed}
				onCollapsedChange={handleCollapsedChange}
				showThemeToggle={true}
				showThemeVariants={true}
				{themeVariantItems}
				{currentThemeVariantLabel}
				showLanguageSwitcher={false}
				primaryColor="#3b82f6"
			/>
		{/if}

		<!-- Main Content Area -->
		<main
			class="main-content transition-all duration-300"
			class:sidebar-mode={isSidebarMode && !isCollapsed && $isUIVisible}
			class:floating-mode={!isSidebarMode && !isCollapsed && $isUIVisible}
		>
			<div class="min-h-screen">
				{@render children?.()}
			</div>
		</main>

		<!-- Keyboard Shortcuts Modal -->
		<KeyboardShortcutsModal />
	</div>
{/if}

<style>
	/* Floating nav mode - add top padding for fixed nav */
	.main-content.floating-mode {
		padding-top: 80px;
	}

	/* Sidebar mode - add left padding for sidebar nav */
	.main-content.sidebar-mode {
		padding-left: 180px;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.main-content.floating-mode {
			padding-top: 70px;
		}
		.main-content.sidebar-mode {
			padding-left: 0;
			padding-top: 70px;
		}
	}
</style>
