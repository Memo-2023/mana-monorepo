<script lang="ts">
	import { page } from '$app/stores';
	import { user } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { locale } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import PillDropdown from './PillDropdown.svelte';

	interface Props {
		onLogout: () => void;
		onModeChange?: (isSidebar: boolean) => void;
		onCollapsedChange?: (isCollapsed: boolean) => void;
	}

	let { onLogout, onModeChange, onCollapsedChange }: Props = $props();

	// Sidebar mode state with localStorage persistence
	let isSidebarMode = $state(false);
	let isCollapsed = $state(false);

	onMount(() => {
		const savedSidebar = localStorage.getItem('memoro-nav-sidebar');
		if (savedSidebar === 'true') {
			isSidebarMode = true;
			onModeChange?.(true);
		}

		const savedCollapsed = localStorage.getItem('memoro-nav-collapsed');
		if (savedCollapsed === 'true') {
			isCollapsed = true;
			onCollapsedChange?.(true);
		}
	});

	function toggleSidebarMode() {
		isSidebarMode = !isSidebarMode;
		localStorage.setItem('memoro-nav-sidebar', String(isSidebarMode));
		onModeChange?.(isSidebarMode);
	}

	function collapseNav() {
		isCollapsed = true;
		localStorage.setItem('memoro-nav-collapsed', 'true');
		onCollapsedChange?.(true);
	}

	function expandNav() {
		isCollapsed = false;
		localStorage.setItem('memoro-nav-collapsed', 'false');
		onCollapsedChange?.(false);
	}

	function isActive(path: string) {
		return $page.url.pathname === path;
	}

	function toggleTheme() {
		theme.toggleMode();
	}

	let currentTheme = $derived($theme);

	// Language state - sync with svelte-i18n locale
	let currentLanguage = $derived($locale || 'de');

	const languages = [
		{ code: 'de', label: 'Deutsch' },
		{ code: 'en', label: 'English' },
		{ code: 'es', label: 'Español' },
		{ code: 'fr', label: 'Français' },
		{ code: 'it', label: 'Italiano' },
	];

	const languageItems = $derived(languages.map(lang => ({
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

	const navItems = [
		{ path: '/record', label: 'Aufnehmen', icon: 'mic' },
		{ path: '/memos', label: 'Memos', icon: 'archive' },
		{ path: '/upload', label: 'Upload', icon: 'upload' },
		{ path: '/audio-archive', label: 'Audio-Archiv', icon: 'music' },
		{ path: '/tags', label: 'Tags', icon: 'tag' },
		{ path: '/subscription', label: 'Mana', icon: 'mana' },
		{ path: '/blueprints', label: 'Blueprints', icon: 'document' },
		{ path: '/statistics', label: 'Statistics', icon: 'chart' },
		{ path: '/settings', label: 'Settings', icon: 'settings' },
	];
</script>

{#if !isCollapsed}
<nav class="pill-nav" class:sidebar-mode={isSidebarMode}>
	<div class="pill-nav-container" class:sidebar-container={isSidebarMode}>
		<!-- Control Button (left position in horizontal mode) -->
		{#if !isSidebarMode}
			<div class="pill glass-pill segmented-control">
				<button
					onclick={toggleSidebarMode}
					class="segment-btn"
					title="Switch to sidebar navigation"
				>
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				<div class="segment-divider"></div>
				<button
					onclick={collapseNav}
					class="segment-btn"
					title="Collapse navigation"
				>
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
			</div>
		{/if}

		<!-- Memoro Logo as first pill -->
		<a href="/record" class="pill glass-pill logo-pill">
			<svg class="pill-icon" width="16" height="16" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M280 140C280 217.32 217.32 280 140 280C62.6801 280 0 217.32 0 140C0 62.6801 62.6801 0 140 0C217.32 0 280 62.6801 280 140ZM247.988 140C247.988 199.64 199.64 241.988 140 241.988C80.3598 241.988 32.0118 199.64 32.0118 140C32.0118 111.918 36.7308 95.3397 54.3005 76.1331C58.5193 71.5212 70.5 63 79.3937 74.511L119.781 131.788C134.5 149 149 147 160.218 131.788L200.605 74.5101C208 64 221.48 71.5203 225.699 76.1321C243.269 95.3388 247.988 111.918 247.988 140Z" fill="#F7D44C"/>
			</svg>
			<span class="pill-label">Memoro</span>
		</a>
		{#each navItems as item}
			<a
				href={item.path}
				class="pill glass-pill"
				class:active={isActive(item.path)}
			>
				{#if item.icon === 'mic'}
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
					</svg>
				{:else if item.icon === 'archive'}
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
					</svg>
				{:else if item.icon === 'upload'}
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
					</svg>
				{:else if item.icon === 'music'}
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
					</svg>
				{:else if item.icon === 'tag'}
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
					</svg>
				{:else if item.icon === 'mana'}
					<svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z" />
					</svg>
				{:else if item.icon === 'document'}
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				{:else if item.icon === 'chart'}
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
				{:else if item.icon === 'settings'}
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				{/if}
				<span class="pill-label">{item.label}</span>
			</a>
		{/each}

		<!-- Language Switcher -->
		<PillDropdown
			items={languageItems}
			direction="down"
			label={currentLanguageLabel}
			icon="globe"
		/>

		<!-- Theme Toggle as pill -->
		<button
			onclick={toggleTheme}
			class="pill glass-pill"
			title={currentTheme.effectiveMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
		>
			{#if currentTheme.effectiveMode === 'light'}
				<svg class="pill-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
				</svg>
			{:else}
				<svg class="pill-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			{/if}
			<span class="pill-label">{currentTheme.effectiveMode === 'light' ? 'Dark' : 'Light'}</span>
		</button>

		<!-- Logout as pill -->
		<button
			onclick={onLogout}
			class="pill glass-pill logout-pill"
			title="Logout"
		>
			<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
			</svg>
			<span class="pill-label">Logout</span>
		</button>

		<!-- Control Button (bottom position in sidebar mode) -->
		{#if isSidebarMode}
			<div class="sidebar-spacer"></div>
			<div class="pill glass-pill segmented-control sidebar-segmented">
				<button
					onclick={toggleSidebarMode}
					class="segment-btn"
					title="Switch to top navigation"
				>
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
					</svg>
				</button>
				<div class="segment-divider"></div>
				<button
					onclick={collapseNav}
					class="segment-btn"
					title="Collapse navigation"
				>
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
			</div>
		{/if}
	</div>
</nav>
{/if}

<!-- FAB for collapsed state -->
{#if isCollapsed}
	<button
		onclick={expandNav}
		class="nav-fab glass-pill"
		title="Expand navigation"
	>
		<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
		</svg>
	</button>
{/if}

<style>
	.pill-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		padding: 0.75rem 0 1.5rem;
		pointer-events: none;
	}

	.pill-nav-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		pointer-events: auto;
		padding: 0.5rem 2rem;
	}

	.pill-nav-container::-webkit-scrollbar {
		display: none;
	}

	/* Base pill styles */
	.pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	/* Glass effect */
	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	.glass-pill:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .glass-pill:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	/* Active state */
	.pill.active {
		background: rgba(248, 214, 43, 0.9);
		border-color: rgba(248, 214, 43, 0.5);
		color: #1a1a1a;
	}

	:global(.dark) .pill.active {
		background: rgba(248, 214, 43, 0.3);
		border-color: rgba(248, 214, 43, 0.4);
		color: #f8d62b;
	}

	/* Logout pill */
	.logout-pill {
		color: #dc2626;
	}

	:global(.dark) .logout-pill {
		color: #ef4444;
	}

	.logout-pill:hover {
		background: rgba(220, 38, 38, 0.15);
		border-color: rgba(220, 38, 38, 0.3);
	}

	.pill-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.pill-label {
		display: inline;
	}

	/* Toggle button */
	.toggle-pill {
		flex-shrink: 0;
	}

	/* Sidebar mode styles */
	.pill-nav.sidebar-mode {
		top: 0;
		left: 0;
		bottom: 0;
		right: auto;
		width: 180px;
		padding: 0.75rem 0;
		background: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		border: none;
	}

	:global(.dark) .pill-nav.sidebar-mode {
		background: transparent;
		border: none;
	}

	.sidebar-container {
		flex-direction: column;
		align-items: stretch;
		gap: 0.5rem;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 0.5rem 0.75rem;
		height: 100%;
	}

	.sidebar-container .pill {
		justify-content: flex-start;
		width: 100%;
	}

	/* Transparent pills in sidebar mode */
	.sidebar-container .glass-pill,
	.sidebar-container :global(.pill-dropdown .trigger-button) {
		background: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		border: 1px solid transparent;
		box-shadow: none;
	}

	.sidebar-container .glass-pill:hover,
	.sidebar-container :global(.pill-dropdown .trigger-button:hover) {
		background: rgba(0, 0, 0, 0.05);
		border-color: rgba(0, 0, 0, 0.1);
		transform: none;
		box-shadow: none;
	}

	:global(.dark) .sidebar-container .glass-pill:hover,
	:global(.dark) .sidebar-container :global(.pill-dropdown .trigger-button:hover) {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Keep active state visible */
	.sidebar-container .pill.active {
		background: rgba(248, 214, 43, 0.2);
		border-color: rgba(248, 214, 43, 0.3);
	}

	:global(.dark) .sidebar-container .pill.active {
		background: rgba(248, 214, 43, 0.15);
		border-color: rgba(248, 214, 43, 0.25);
	}

	/* Logo pill in sidebar - same as other pills (transparent) */
	.sidebar-container .logo-pill {
		background: transparent;
		border-color: transparent;
	}

	.sidebar-container .logo-pill:hover {
		background: rgba(0, 0, 0, 0.05);
		border-color: rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .sidebar-container .logo-pill:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Spacer to push toggle button to bottom */
	.sidebar-spacer {
		flex: 1;
		min-height: 1rem;
	}

	.sidebar-container .toggle-pill {
		margin-top: auto;
	}

	/* Segmented control */
	.segmented-control {
		display: flex;
		align-items: center;
		padding: 0;
		gap: 0;
	}

	.segment-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0.625rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: inherit;
		transition: background 0.2s;
	}

	.segment-btn:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .segment-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.segment-divider {
		width: 1px;
		height: 1rem;
		background: rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .segment-divider {
		background: rgba(255, 255, 255, 0.2);
	}

	.sidebar-segmented {
		margin: 0 0.75rem;
	}

	/* FAB for collapsed state */
	.nav-fab {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 1001;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem;
		border-radius: 9999px;
		cursor: pointer;
		border: none;
	}

	/* Transitions */
	.pill-nav {
		transition: all 0.3s ease;
	}

	.pill-nav-container {
		transition: all 0.3s ease;
	}
</style>
