<!--
  AuthGate - Centralized auth initialization and loading gate.

  Handles:
  - Auth store initialization
  - Loading spinner while checking auth
  - Redirect to login if not authenticated (unless allowGuest)
  - Access tier check (blocks apps the user doesn't have access to)
  - Calling onReady callback after auth is confirmed
  - Rendering children only when ready

  Usage:
    <AuthGate authStore={authStore} onReady={loadAppData} requiredTier="beta">
      <AppContent />
    </AuthGate>
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { hasAppAccess, ACCESS_TIER_LABELS, type AccessTier } from '@manacore/shared-branding';

	/**
	 * Minimal interface that all app auth stores must satisfy.
	 * Every app's authStore (e.g. `$lib/stores/auth.svelte`) already matches this.
	 */
	interface AuthStoreInterface {
		initialize(): Promise<void>;
		readonly isAuthenticated: boolean;
		readonly user: { tier?: string; email?: string } | null;
	}

	interface Props {
		/** The app's auth store instance (must have initialize() and isAuthenticated) */
		authStore: AuthStoreInterface;
		/** Path to redirect to when not authenticated (default: '/login') */
		loginHref?: string;
		/** If true, render children even when not authenticated (for guest-mode apps) */
		allowGuest?: boolean;
		/** Minimum access tier required to use this app */
		requiredTier?: AccessTier;
		/** App name shown on the access denied screen */
		appName?: string;
		/** Callback invoked after auth is confirmed, before children are rendered.
		 *  Use this for loading app-specific data (projects, calendars, etc.) */
		onReady?: () => void | Promise<void>;
		/** SvelteKit goto function for client-side navigation. Falls back to window.location. */
		goto?: (url: string, opts?: Record<string, unknown>) => unknown;
		/** Content to render when ready */
		children: Snippet;
	}

	let {
		authStore,
		loginHref = '/login',
		allowGuest = false,
		requiredTier,
		appName,
		onReady,
		goto: gotoFn,
		children,
	}: Props = $props();

	let ready = $state(false);
	let tierDenied = $state(false);
	let userTierLabel = $state('');
	let requiredTierLabel = $state('');

	function navigate(url: string) {
		if (gotoFn) {
			gotoFn(url);
		} else if (typeof window !== 'undefined') {
			window.location.href = url;
		}
	}

	function goHome() {
		const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
		const homeUrl = isLocal ? 'http://localhost:5173' : 'https://mana.how';
		window.location.href = homeUrl;
	}

	onMount(async () => {
		await authStore.initialize();

		if (!authStore.isAuthenticated && !allowGuest) {
			navigate(loginHref);
			return;
		}

		// Check access tier if required and user is authenticated
		if (requiredTier && authStore.isAuthenticated && authStore.user) {
			const userTier = authStore.user.tier || 'public';
			if (!hasAppAccess(userTier, requiredTier)) {
				userTierLabel = ACCESS_TIER_LABELS['de'][userTier as AccessTier] || userTier;
				requiredTierLabel = ACCESS_TIER_LABELS['de'][requiredTier] || requiredTier;
				tierDenied = true;
				return;
			}
		}

		if (onReady) {
			await onReady();
		}

		ready = true;
	});
</script>

{#if tierDenied}
	<div class="tier-denied">
		<div class="tier-denied-card">
			{#if appName}
				<h1 class="tier-denied-title">{appName}</h1>
			{/if}
			<div class="tier-denied-icon">🔒</div>
			<p class="tier-denied-message">
				Diese App ist aktuell in der geschlossenen <strong>{requiredTierLabel}</strong>-Phase.
			</p>
			<div class="tier-denied-info">
				<div class="tier-row">
					<span class="tier-label">Dein Zugang:</span>
					<span class="tier-value">{userTierLabel}</span>
				</div>
				<div class="tier-row">
					<span class="tier-label">Benötigt:</span>
					<span class="tier-value tier-required">{requiredTierLabel}</span>
				</div>
			</div>
			<div class="tier-denied-actions">
				<button class="tier-btn-primary" onclick={goHome}> Zur Übersicht </button>
			</div>
		</div>
	</div>
{:else if !ready}
	<div class="flex items-center justify-center h-screen bg-background">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.tier-denied {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: hsl(var(--background, 0 0% 100%));
		padding: 1.5rem;
	}

	.tier-denied-card {
		max-width: 24rem;
		width: 100%;
		text-align: center;
		padding: 2.5rem 2rem;
		border-radius: 1rem;
		border: 1px solid hsl(var(--border, 0 0% 90%));
		background: hsl(var(--card, 0 0% 100%));
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
	}

	.tier-denied-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--foreground, 0 0% 9%));
		margin: 0 0 1rem;
	}

	.tier-denied-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.tier-denied-message {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground, 0 0% 45%));
		margin: 0 0 1.5rem;
		line-height: 1.5;
	}

	.tier-denied-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: hsl(var(--muted, 0 0% 96%));
		margin-bottom: 1.5rem;
	}

	.tier-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.tier-label {
		color: hsl(var(--muted-foreground, 0 0% 45%));
	}

	.tier-value {
		font-weight: 600;
		color: hsl(var(--foreground, 0 0% 9%));
	}

	.tier-required {
		color: #8b5cf6;
	}

	.tier-denied-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.tier-btn-primary {
		width: 100%;
		padding: 0.625rem 1rem;
		border-radius: 0.5rem;
		border: none;
		background: hsl(var(--primary, 239 84% 67%));
		color: hsl(var(--primary-foreground, 0 0% 100%));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.tier-btn-primary:hover {
		opacity: 0.9;
	}
</style>
