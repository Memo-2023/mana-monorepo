<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PillNavItem, PillDropdownItem } from './types';
	import PillDropdown from './PillDropdown.svelte';

	interface Props {
		/** Navigation items */
		items: PillNavItem[];
		/** Current active path */
		currentPath?: string;
		/** Logo snippet */
		logo?: Snippet;
		/** App name */
		appName?: string;
		/** Home/default route */
		homeRoute?: string;
		/** Called when logout is clicked */
		onLogout?: () => void;
		/** Called when theme toggle is clicked */
		onToggleTheme?: () => void;
		/** Whether dark mode is active */
		isDark?: boolean;
		/** Whether sidebar mode is enabled */
		isSidebarMode?: boolean;
		/** Called when sidebar mode changes */
		onModeChange?: (isSidebar: boolean) => void;
		/** Whether navigation is collapsed */
		isCollapsed?: boolean;
		/** Called when collapsed state changes */
		onCollapsedChange?: (isCollapsed: boolean) => void;
		/** Language dropdown items */
		languageItems?: PillDropdownItem[];
		/** Current language label */
		currentLanguageLabel?: string;
		/** Show language switcher */
		showLanguageSwitcher?: boolean;
		/** Show theme toggle */
		showThemeToggle?: boolean;
		/** Primary color for active state (CSS custom property or hex) */
		primaryColor?: string;
	}

	let {
		items,
		currentPath = '',
		logo,
		appName = 'App',
		homeRoute = '/',
		onLogout,
		onToggleTheme,
		isDark = false,
		isSidebarMode: externalSidebarMode,
		onModeChange,
		isCollapsed: externalCollapsed,
		onCollapsedChange,
		languageItems = [],
		currentLanguageLabel = 'Language',
		showLanguageSwitcher = false,
		showThemeToggle = true,
		primaryColor
	}: Props = $props();

	// Local state for uncontrolled mode
	let internalSidebarMode = $state(false);
	let internalCollapsed = $state(false);

	// Use external or internal state
	const isSidebarMode = $derived(onModeChange !== undefined ? (externalSidebarMode ?? false) : internalSidebarMode);
	const isCollapsed = $derived(onCollapsedChange !== undefined ? (externalCollapsed ?? false) : internalCollapsed);

	function toggleSidebarMode() {
		const newValue = !isSidebarMode;
		if (onModeChange) {
			onModeChange(newValue);
		} else {
			internalSidebarMode = newValue;
		}
	}

	function collapseNav() {
		if (onCollapsedChange) {
			onCollapsedChange(true);
		} else {
			internalCollapsed = true;
		}
	}

	function expandNav() {
		if (onCollapsedChange) {
			onCollapsedChange(false);
		} else {
			internalCollapsed = false;
		}
	}

	function isActive(path: string) {
		return currentPath === path;
	}

	// Icon SVG paths
	const icons: Record<string, string> = {
		mic: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
		archive: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
		upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
		music: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
		tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
		document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
		chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
		settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
		settingsInner: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
		home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
		user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
		building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
		creditCard: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
		search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
		moon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
		sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
		logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
		chevronDown: 'M19 9l-7 7-7-7',
		chevronUp: 'M5 15l7-7 7 7',
		chevronLeft: 'M15 19l-7-7 7-7',
		menu: 'M4 6h16M4 12h16M4 18h16'
	};

	function getIconPath(name: string): string {
		return icons[name] || '';
	}
</script>

{#if !isCollapsed}
<nav class="pill-nav" class:sidebar-mode={isSidebarMode} style={primaryColor ? `--pill-primary-color: ${primaryColor}` : ''}>
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
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath('chevronDown')} />
					</svg>
				</button>
				<div class="segment-divider"></div>
				<button
					onclick={collapseNav}
					class="segment-btn"
					title="Collapse navigation"
				>
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath('chevronLeft')} />
					</svg>
				</button>
			</div>
		{/if}

		<!-- Logo pill -->
		<a href={homeRoute} class="pill glass-pill logo-pill">
			{#if logo}
				{@render logo()}
			{:else}
				<span class="pill-label font-bold">{appName}</span>
			{/if}
		</a>

		<!-- Navigation Items -->
		{#each items as item}
			<a
				href={item.href}
				class="pill glass-pill"
				class:active={isActive(item.href)}
			>
				{#if item.icon}
					{#if item.icon === 'mana'}
						<svg class="pill-icon" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z" />
						</svg>
					{:else if item.icon === 'settings'}
						<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath('settings')} />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath('settingsInner')} />
						</svg>
					{:else if item.iconSvg}
						{@html item.iconSvg}
					{:else}
						<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath(item.icon)} />
						</svg>
					{/if}
				{/if}
				<span class="pill-label">{item.label}</span>
			</a>
		{/each}

		<!-- Language Switcher -->
		{#if showLanguageSwitcher && languageItems.length > 0}
			<PillDropdown
				items={languageItems}
				direction="down"
				label={currentLanguageLabel}
				icon="globe"
			/>
		{/if}

		<!-- Theme Toggle -->
		{#if showThemeToggle && onToggleTheme}
			<button
				onclick={onToggleTheme}
				class="pill glass-pill"
				title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				{#if !isDark}
					<svg class="pill-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath('moon')} />
					</svg>
				{:else}
					<svg class="pill-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath('sun')} />
					</svg>
				{/if}
				<span class="pill-label">{isDark ? 'Light' : 'Dark'}</span>
			</button>
		{/if}

		<!-- Logout -->
		{#if onLogout}
			<button
				onclick={onLogout}
				class="pill glass-pill logout-pill"
				title="Logout"
			>
				<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath('logout')} />
				</svg>
				<span class="pill-label">Logout</span>
			</button>
		{/if}

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
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath('chevronUp')} />
					</svg>
				</button>
				<div class="segment-divider"></div>
				<button
					onclick={collapseNav}
					class="segment-btn"
					title="Collapse navigation"
				>
					<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath('chevronLeft')} />
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
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath('menu')} />
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

	/* Active state - uses CSS custom property for theming */
	.pill.active {
		background: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.9)));
		background: color-mix(in srgb, var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 20%, white 80%);
		border-color: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.5)));
		color: #1a1a1a;
	}

	:global(.dark) .pill.active {
		background: color-mix(in srgb, var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 30%, transparent 70%);
		border-color: var(--pill-primary-color, var(--color-primary-500, rgba(248, 214, 43, 0.4)));
		color: var(--pill-primary-color, var(--color-primary-500, #f8d62b));
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
		background: color-mix(in srgb, var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 20%, transparent 80%);
		border-color: color-mix(in srgb, var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 30%, transparent 70%);
	}

	:global(.dark) .sidebar-container .pill.active {
		background: color-mix(in srgb, var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 15%, transparent 85%);
		border-color: color-mix(in srgb, var(--pill-primary-color, var(--color-primary-500, #f8d62b)) 25%, transparent 75%);
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
