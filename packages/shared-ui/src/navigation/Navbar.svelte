<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { NavItem } from './types';
	import NavLink from './NavLink.svelte';
	import { List, X } from '@manacore/shared-icons';

	interface Props {
		/** Navigation items to display */
		items: NavItem[];
		/** Logo snippet */
		logo?: Snippet;
		/** App name to display next to logo */
		appName?: string;
		/** Logo href */
		logoHref?: string;
		/** Current pathname for active state detection */
		currentPath?: string;
		/** User email to display */
		userEmail?: string;
		/** Called when sign out is clicked */
		onSignOut?: () => void;
		/** Sign out button label */
		signOutLabel?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		items,
		logo,
		appName = '',
		logoHref = '/',
		currentPath = '',
		userEmail = '',
		onSignOut,
		signOutLabel = 'Sign Out',
		class: className = '',
	}: Props = $props();

	let mobileMenuOpen = $state(false);

	function isActive(href: string): boolean {
		if (href === '/') return currentPath === '/';
		return currentPath.startsWith(href);
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<nav class="navbar {className}">
	<div class="navbar__container">
		<div class="navbar__content">
			<!-- Logo -->
			<div class="navbar__brand">
				<a href={logoHref} class="navbar__logo">
					{#if logo}
						{@render logo()}
					{/if}
					{#if appName}
						<span class="navbar__app-name">{appName}</span>
					{/if}
				</a>
			</div>

			<!-- Desktop Navigation -->
			<div class="navbar__nav">
				{#each items as item}
					<NavLink {item} active={isActive(item.href)} variant="default" />
				{/each}
			</div>

			<!-- User Section -->
			<div class="navbar__user">
				{#if userEmail}
					<span class="navbar__email">{userEmail}</span>
				{/if}
				{#if onSignOut}
					<button onclick={onSignOut} class="navbar__signout">
						{signOutLabel}
					</button>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="navbar__mobile-toggle"
				onclick={toggleMobileMenu}
				aria-expanded={mobileMenuOpen}
				aria-label="Toggle menu"
			>
				{#if mobileMenuOpen}
					<X size={24} />
				{:else}
					<List size={24} />
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="navbar__mobile-menu">
			<div class="navbar__mobile-nav">
				{#each items as item}
					<NavLink {item} active={isActive(item.href)} variant="mobile" />
				{/each}
			</div>
			{#if onSignOut}
				<div class="navbar__mobile-footer">
					<button onclick={onSignOut} class="navbar__mobile-signout">
						{signOutLabel}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</nav>

<style>
	.navbar {
		border-bottom: 1px solid hsl(var(--color-border));
		background-color: hsl(var(--color-surface-elevated));
	}

	.navbar__container {
		max-width: 80rem;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.navbar__content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 4rem;
	}

	/* Brand/Logo */
	.navbar__brand {
		display: flex;
		align-items: center;
	}

	.navbar__logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: hsl(var(--color-foreground));
	}

	.navbar__app-name {
		font-size: 1.25rem;
		font-weight: 700;
	}

	/* Desktop Navigation */
	.navbar__nav {
		display: none;
		align-items: center;
		gap: 0.25rem;
	}

	@media (min-width: 768px) {
		.navbar__nav {
			display: flex;
		}
	}

	/* User Section */
	.navbar__user {
		display: none;
		align-items: center;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.navbar__user {
			display: flex;
		}
	}

	.navbar__email {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.navbar__signout {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-error));
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.navbar__signout:hover {
		background-color: hsl(var(--color-error) / 0.1);
	}

	/* Mobile Menu Toggle */
	.navbar__mobile-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		color: hsl(var(--color-muted-foreground));
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.navbar__mobile-toggle:hover {
		background-color: hsl(var(--color-surface-hover));
	}

	@media (min-width: 768px) {
		.navbar__mobile-toggle {
			display: none;
		}
	}

	/* Mobile Menu */
	.navbar__mobile-menu {
		border-top: 1px solid hsl(var(--color-border));
	}

	@media (min-width: 768px) {
		.navbar__mobile-menu {
			display: none;
		}
	}

	.navbar__mobile-nav {
		display: flex;
		justify-content: space-around;
		padding: 0.5rem;
	}

	.navbar__mobile-footer {
		padding: 0.5rem 1rem 1rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.navbar__mobile-signout {
		width: 100%;
		padding: 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-error));
		background: transparent;
		border: 1px solid hsl(var(--color-error) / 0.3);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.navbar__mobile-signout:hover {
		background-color: hsl(var(--color-error) / 0.1);
	}
</style>
