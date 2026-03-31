<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { NavItem } from './types';
	import NavLink from './NavLink.svelte';
	import { CaretLeft, List, Moon, SignOut, Sun } from '@manacore/shared-icons';

	interface Props {
		/** Navigation items to display */
		items: NavItem[];
		/** Logo snippet */
		logo?: Snippet;
		/** App name to display */
		appName?: string;
		/** Logo href */
		logoHref?: string;
		/** Current pathname for active state detection */
		currentPath?: string;
		/** Whether sidebar is minimized/collapsed */
		minimized?: boolean;
		/** Called when minimize toggle is clicked */
		onToggleMinimize?: () => void;
		/** User email to display */
		userEmail?: string;
		/** Called when sign out is clicked */
		onSignOut?: () => void;
		/** Sign out button label */
		signOutLabel?: string;
		/** Show theme toggle */
		showThemeToggle?: boolean;
		/** Called when theme toggle is clicked */
		onToggleTheme?: () => void;
		/** Current theme mode (for icon display) */
		isDark?: boolean;
		/** Light mode label */
		lightModeLabel?: string;
		/** Dark mode label */
		darkModeLabel?: string;
		/** Minimize label */
		minimizeLabel?: string;
		/** Expand label */
		expandLabel?: string;
		/** Additional CSS classes */
		class?: string;
		/** Footer content slot */
		footer?: Snippet;
	}

	let {
		items,
		logo,
		appName = '',
		logoHref = '/',
		currentPath = '',
		minimized = false,
		onToggleMinimize,
		userEmail = '',
		onSignOut,
		signOutLabel = 'Sign Out',
		showThemeToggle = false,
		onToggleTheme,
		isDark = false,
		lightModeLabel = 'Light Mode',
		darkModeLabel = 'Dark Mode',
		minimizeLabel = 'Minimize',
		expandLabel = 'Expand',
		class: className = '',
		footer,
	}: Props = $props();

	function isActive(href: string): boolean {
		if (href === '/') return currentPath === '/';
		return currentPath.startsWith(href);
	}
</script>

<aside class="sidebar {minimized ? 'sidebar--minimized' : ''} {className}">
	<div class="sidebar__inner">
		<!-- Logo/Brand -->
		<div class="sidebar__header">
			<a href={logoHref} class="sidebar__logo">
				{#if logo}
					{@render logo()}
				{/if}
				{#if appName && !minimized}
					<span class="sidebar__app-name">{appName}</span>
				{/if}
			</a>
		</div>

		<!-- Navigation -->
		<nav class="sidebar__nav">
			{#each items as item}
				<NavLink {item} active={isActive(item.href)} variant="sidebar" {minimized} />
			{/each}
		</nav>

		<!-- Footer -->
		<div class="sidebar__footer">
			{#if footer}
				{@render footer()}
			{/if}

			<!-- Theme Toggle -->
			{#if showThemeToggle && onToggleTheme}
				<button
					onclick={onToggleTheme}
					class="sidebar__action"
					title={isDark ? lightModeLabel : darkModeLabel}
				>
					{#if isDark}
						<!-- Sun icon -->
						<Sun size={20} />
					{:else}
						<!-- Moon icon -->
						<Moon size={20} />
					{/if}
					{#if !minimized}
						<span>{isDark ? lightModeLabel : darkModeLabel}</span>
					{/if}
				</button>
			{/if}

			<!-- User Email -->
			{#if userEmail && !minimized}
				<div class="sidebar__email">{userEmail}</div>
			{/if}

			<!-- Sign Out -->
			{#if onSignOut}
				<button
					onclick={onSignOut}
					class="sidebar__action sidebar__action--danger"
					title={signOutLabel}
				>
					<SignOut size={20} />
					{#if !minimized}
						<span>{signOutLabel}</span>
					{/if}
				</button>
			{/if}

			<!-- Toggle Minimize -->
			{#if onToggleMinimize}
				<button
					onclick={onToggleMinimize}
					class="sidebar__action"
					title={minimized ? expandLabel : minimizeLabel}
				>
					{#if minimized}
						<!-- Menu icon (expand) -->
						<List size={20} />
					{:else}
						<!-- Chevron left (minimize) -->
						<CaretLeft size={20} />
						<span>{minimizeLabel}</span>
					{/if}
				</button>
			{/if}
		</div>
	</div>
</aside>

<style>
	.sidebar {
		width: 240px;
		height: 100vh;
		position: sticky;
		top: 0;
		left: 0;
		flex-shrink: 0;
		transition: width 0.2s ease;
		z-index: 40;
	}

	.sidebar--minimized {
		width: 64px;
	}

	.sidebar__inner {
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: hsl(var(--color-surface));
		border-right: 1px solid hsl(var(--color-border));
	}

	/* Header/Logo */
	.sidebar__header {
		display: flex;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.sidebar__logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: hsl(var(--color-foreground));
	}

	.sidebar--minimized .sidebar__logo {
		justify-content: center;
		width: 100%;
	}

	.sidebar__app-name {
		font-size: 1.125rem;
		font-weight: 700;
		white-space: nowrap;
	}

	/* Navigation */
	.sidebar__nav {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	/* Footer */
	.sidebar__footer {
		padding: 0.5rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.sidebar__email {
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sidebar__action {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		background: transparent;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
	}

	.sidebar__action:hover {
		background-color: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}

	.sidebar--minimized .sidebar__action {
		justify-content: center;
	}

	.sidebar__action--danger {
		color: hsl(var(--color-error));
	}

	.sidebar__action--danger:hover {
		background-color: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
	}

	/* Icon sizing */
	.sidebar__action :global(svg) {
		flex-shrink: 0;
	}
</style>
