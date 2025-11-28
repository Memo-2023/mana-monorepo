<script lang="ts">
	import type { AppConfig } from '@zitare/shared';
	import { isSidebarCollapsed } from '../stores/sidebar';
	import { theme } from '../stores/theme';

	interface Props {
		config: AppConfig;
		currentPath: string;
	}

	let { config, currentPath }: Props = $props();
	let showUserMenu = $state(false);

	function isActive(path: string) {
		return currentPath === path;
	}

	// Build nav items from config
	// For web apps, we use a simple structure: Home, Browse, Favorites (if enabled), Discover Apps
	const navItems = $derived([
		{
			path: '/',
			label: 'Home',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		},
		{
			path: '/browse',
			label: `Alle ${config.contentLabel.plural}`,
			icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
		},
		...(config.features.favorites
			? [
					{
						path: '/favorites',
						label: 'Favoriten',
						icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
					},
				]
			: []),
		{
			path: '/discover',
			label: 'Apps entdecken',
			icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
		},
	]);
</script>

<svelte:head>
	<style>
		@media (max-width: 1023px) {
			.mobile-header {
				display: block !important;
			}
			.mobile-bottom-nav {
				display: block !important;
			}
		}
		@media (min-width: 1024px) {
			.desktop-sidebar {
				display: flex !important;
			}
			.sidebar-toggle {
				display: flex !important;
			}
		}
	</style>
</svelte:head>

<!-- Sidebar Toggle Button (when collapsed) -->
<button
	onclick={() => isSidebarCollapsed.set(false)}
	class="sidebar-toggle"
	class:collapsed={$isSidebarCollapsed}
	aria-label="Sidebar öffnen"
	style="background: rgb({config.colors.primary});"
>
	<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M4 6h16M4 12h16M4 18h16"
		/>
	</svg>
</button>

<!-- Desktop Sidebar -->
<aside class="desktop-sidebar" class:collapsed={$isSidebarCollapsed}>
	<!-- Logo & Collapse Button -->
	<div class="sidebar-header">
		<a href="/" class="sidebar-logo">
			{config.metadata.displayName}
		</a>
		<button
			onclick={() => isSidebarCollapsed.set(true)}
			class="collapse-btn"
			aria-label="Sidebar schließen"
		>
			<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
	</div>

	<!-- Navigation -->
	<nav class="sidebar-nav">
		{#each navItems as item}
			{@const active = isActive(item.path)}
			<a
				href={item.path}
				class="nav-item"
				class:active
				style={active
					? `background: rgb(${config.colors.primary}); box-shadow: 0 2px 8px rgba(${config.colors.primary}, 0.3);`
					: ''}
			>
				<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
				</svg>
				<span>{item.label}</span>
			</a>
		{/each}

		<!-- Divider -->
		<div class="divider"></div>

		<!-- Theme Toggle -->
		<button onclick={() => theme.toggle()} class="nav-item">
			<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				{#if $theme === 'dark'}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				{:else}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				{/if}
			</svg>
			<span>{$theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
		</button>
	</nav>

	<!-- User Section -->
	<div class="sidebar-footer">
		<div class="user-section">
			<button onclick={() => (showUserMenu = !showUserMenu)} class="user-button">
				<div class="user-avatar" style="background: rgb({config.colors.primary});">U</div>
				<div class="user-info">
					<p class="user-name">User</p>
					<p class="user-role">Account</p>
				</div>
				<svg
					width="16"
					height="16"
					class="chevron"
					class:rotated={showUserMenu}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{#if showUserMenu}
				<div class="user-menu">
					<button onclick={() => (showUserMenu = false)} class="user-menu-item">
						<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						Profil & Einstellungen
					</button>
				</div>
			{/if}
		</div>
	</div>
</aside>

<!-- Mobile Header -->
<header class="mobile-header">
	<div class="mobile-header-content">
		<!-- Logo -->
		<a href="/" class="mobile-logo">
			{config.metadata.displayName}
		</a>

		<!-- User Avatar -->
		<button
			onclick={() => (showUserMenu = !showUserMenu)}
			class="mobile-avatar"
			style="background: rgb({config.colors.primary});"
		>
			U
		</button>
	</div>

	<!-- Mobile User Menu -->
	{#if showUserMenu}
		<div class="mobile-menu">
			<nav class="mobile-menu-nav">
				{#each navItems as item}
					{@const active = isActive(item.path)}
					<a
						href={item.path}
						onclick={() => (showUserMenu = false)}
						class="mobile-nav-item"
						class:active
						style={active
							? `background: rgba(${config.colors.primary}, 0.15); color: rgb(${config.colors.primary});`
							: ''}
					>
						<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
						</svg>
						{item.label}
					</a>
				{/each}

				<!-- Theme Toggle Mobile -->
				<button
					onclick={() => {
						theme.toggle();
						showUserMenu = false;
					}}
					class="mobile-nav-item"
				>
					<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						{#if $theme === 'dark'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
							/>
						{/if}
					</svg>
					{$theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
				</button>
			</nav>
		</div>
	{/if}
</header>

<!-- Mobile Bottom Navigation -->
<nav class="mobile-bottom-nav">
	<div class="bottom-nav-grid">
		{#each navItems as item}
			{@const active = isActive(item.path)}
			<a
				href={item.path}
				class="bottom-nav-item"
				class:active
				style={active
					? `background: rgba(${config.colors.primary}, 0.15); color: rgb(${config.colors.primary});`
					: ''}
			>
				<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
				</svg>
				<span>{item.label}</span>
			</a>
		{/each}
	</div>
</nav>

<style>
	/* Sidebar Toggle Button */
	.sidebar-toggle {
		position: fixed;
		bottom: 2rem;
		left: 1rem;
		z-index: 50;
		display: none;
		height: 3.5rem;
		width: 3.5rem;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		color: white;
		box-shadow: var(--shadow-xl);
		backdrop-filter: blur(10px);
		transition: all 0.3s ease;
		border: none;
		cursor: pointer;
	}

	.sidebar-toggle:hover {
		transform: scale(1.05);
	}

	.sidebar-toggle.collapsed {
		opacity: 1;
	}

	.sidebar-toggle:not(.collapsed) {
		opacity: 0;
		pointer-events: none;
	}

	/* Desktop Sidebar */
	.desktop-sidebar {
		position: fixed;
		left: 1rem;
		top: 1rem;
		z-index: 40;
		display: none;
		height: calc(100vh - 2rem);
		width: 16rem;
		flex-direction: column;
		overflow: hidden;
		border-radius: 1.5rem;
		background: rgba(var(--color-surface), 0.8);
		border: 1px solid rgba(var(--color-border), 0.5);
		box-shadow: var(--shadow-xl);
		backdrop-filter: blur(20px);
		transition: transform 0.3s ease;
	}

	.desktop-sidebar.collapsed {
		transform: translateX(calc(-100% - 2rem));
	}

	/* Sidebar Header */
	.sidebar-header {
		display: flex;
		height: 4rem;
		flex-shrink: 0;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		border-bottom: 1px solid rgba(var(--color-border), 0.5);
	}

	.sidebar-logo {
		font-size: 1.5rem;
		font-weight: 700;
		color: rgb(var(--color-text-primary));
		text-decoration: none;
	}

	.collapse-btn {
		display: flex;
		height: 2rem;
		width: 2rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.collapse-btn:hover {
		background: rgba(var(--color-primary), 0.1);
		color: rgb(var(--color-text-primary));
	}

	/* Sidebar Navigation */
	.sidebar-nav {
		flex: 1;
		overflow-y: auto;
		padding: 1rem 0.75rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		border-radius: 0.75rem;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-secondary));
		text-decoration: none;
		transition: all 0.2s ease;
		background: transparent;
		border: none;
		width: 100%;
		cursor: pointer;
		text-align: left;
		position: relative;
	}

	.nav-item svg {
		color: rgb(var(--color-text-secondary));
		transition: color 0.2s ease;
		flex-shrink: 0;
	}

	.nav-item:hover {
		background: rgba(var(--color-primary), 0.1);
		color: rgb(var(--color-text-primary));
		transform: translateX(2px);
	}

	.nav-item:hover svg {
		color: rgb(var(--color-primary));
	}

	.nav-item:active {
		transform: translateX(2px) scale(0.98);
	}

	.nav-item.active {
		color: white;
		font-weight: 600;
	}

	.nav-item.active svg {
		color: white;
	}

	.nav-item.active:hover {
		transform: translateX(0) scale(1.02);
	}

	.divider {
		margin: 1rem 0;
		border-top: 1px solid rgb(var(--color-border));
	}

	/* Sidebar Footer */
	.sidebar-footer {
		flex-shrink: 0;
		padding: 0.75rem;
		border-top: 1px solid rgba(var(--color-border), 0.5);
	}

	.user-section {
		position: relative;
	}

	.user-button {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.75rem;
		border-radius: 0.5rem;
		padding: 0.625rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.user-button:hover {
		background: rgba(var(--color-primary), 0.05);
	}

	.user-avatar {
		display: flex;
		height: 2.25rem;
		width: 2.25rem;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.user-info {
		flex: 1;
		overflow: hidden;
		text-align: left;
	}

	.user-name {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-role {
		margin: 0;
		font-size: 0.75rem;
		color: rgb(var(--color-text-secondary));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chevron {
		color: rgb(var(--color-text-secondary));
		transition: transform 0.2s ease;
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.user-menu {
		position: absolute;
		bottom: 100%;
		left: 0;
		right: 0;
		margin-bottom: 0.5rem;
		overflow: hidden;
		border-radius: 1rem;
		background: rgba(var(--color-surface), 0.95);
		border: 1px solid rgba(var(--color-border), 0.5);
		box-shadow: var(--shadow-lg);
		backdrop-filter: blur(20px);
	}

	.user-menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
		text-decoration: none;
		transition: background 0.2s ease;
		background: transparent;
		border: none;
		width: 100%;
		cursor: pointer;
		text-align: left;
	}

	.user-menu-item:hover {
		background: rgba(var(--color-primary), 0.1);
	}

	/* Mobile Header */
	.mobile-header {
		display: none;
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		z-index: 30;
		background: rgb(var(--color-surface));
		border-bottom: 1px solid rgb(var(--color-border));
	}

	.mobile-header-content {
		display: flex;
		height: 4rem;
		align-items: center;
		justify-content: space-between;
		padding: 0 1rem;
	}

	.mobile-logo {
		font-size: 1.25rem;
		font-weight: 700;
		color: rgb(var(--color-text-primary));
		text-decoration: none;
	}

	.mobile-avatar {
		display: flex;
		height: 2.25rem;
		width: 2.25rem;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
	}

	.mobile-menu {
		border-top: 1px solid rgb(var(--color-border));
		background: rgb(var(--color-surface));
	}

	.mobile-menu-nav {
		display: flex;
		flex-direction: column;
	}

	.mobile-nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-secondary));
		text-decoration: none;
		transition: all 0.2s ease;
		border-bottom: 1px solid rgba(var(--color-border), 0.3);
		background: transparent;
		border: none;
		width: 100%;
		cursor: pointer;
		text-align: left;
	}

	.mobile-nav-item svg {
		color: rgb(var(--color-text-secondary));
		transition: color 0.2s ease;
		flex-shrink: 0;
	}

	.mobile-nav-item:hover {
		background: rgba(var(--color-primary), 0.1);
		color: rgb(var(--color-text-primary));
	}

	.mobile-nav-item:hover svg {
		color: rgb(var(--color-primary));
	}

	.mobile-nav-item:active {
		transform: scale(0.98);
	}

	.mobile-nav-item.active svg {
		color: inherit;
	}

	/* Mobile Bottom Nav */
	.mobile-bottom-nav {
		display: none;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 30;
		background: rgb(var(--color-surface));
		border-top: 1px solid rgb(var(--color-border));
		padding-bottom: env(safe-area-inset-bottom);
	}

	.bottom-nav-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		gap: 0.25rem;
		padding: 0.5rem;
	}

	.bottom-nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		border-radius: 0.75rem;
		padding: 0.625rem 0.75rem;
		color: rgb(var(--color-text-secondary));
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.bottom-nav-item:hover {
		background: rgba(var(--color-primary), 0.1);
		color: rgb(var(--color-text-primary));
	}

	.bottom-nav-item:active {
		transform: scale(0.95);
	}

	.bottom-nav-item.active svg {
		color: inherit;
	}

	.bottom-nav-item span {
		font-size: 0.75rem;
		font-weight: 500;
	}
</style>
