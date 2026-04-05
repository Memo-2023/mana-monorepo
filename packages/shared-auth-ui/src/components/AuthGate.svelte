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
	import { hasAppAccess, ACCESS_TIER_LABELS, type AccessTier } from '@mana/shared-branding';

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
		/** Locale for tier-denied screen (default: 'de') */
		locale?: 'de' | 'en';
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
		locale = 'de',
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
				const labels = ACCESS_TIER_LABELS[locale] || ACCESS_TIER_LABELS['de'];
				userTierLabel = labels[userTier as AccessTier] || userTier;
				requiredTierLabel = labels[requiredTier] || requiredTier;
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
	<div
		class="flex items-center justify-center min-h-screen p-6"
		style:background-color="hsl(var(--background, 0 0% 100%))"
	>
		<div
			class="max-w-96 w-full text-center py-10 px-8 rounded-2xl border shadow-sm"
			style:border-color="hsl(var(--border, 0 0% 90%))"
			style:background-color="hsl(var(--card, 0 0% 100%))"
		>
			{#if appName}
				<h1 class="text-xl font-bold mb-4" style:color="hsl(var(--foreground, 0 0% 9%))">
					{appName}
				</h1>
			{/if}
			<div class="text-5xl mb-4">🔒</div>
			<p
				class="text-[0.9375rem] leading-relaxed mb-6"
				style:color="hsl(var(--muted-foreground, 0 0% 45%))"
			>
				{locale === 'en'
					? `This app is currently in closed `
					: `Diese App ist aktuell in der geschlossenen `}<strong>{requiredTierLabel}</strong
				>{locale === 'en' ? ' phase.' : '-Phase.'}
			</p>
			<div
				class="flex flex-col gap-2 p-4 rounded-xl mb-6"
				style:background-color="hsl(var(--muted, 0 0% 96%))"
			>
				<div class="flex justify-between items-center text-sm">
					<span style:color="hsl(var(--muted-foreground, 0 0% 45%))"
						>{locale === 'en' ? 'Your access:' : 'Dein Zugang:'}</span
					>
					<span class="font-semibold" style:color="hsl(var(--foreground, 0 0% 9%))"
						>{userTierLabel}</span
					>
				</div>
				<div class="flex justify-between items-center text-sm">
					<span style:color="hsl(var(--muted-foreground, 0 0% 45%))"
						>{locale === 'en' ? 'Required:' : 'Benötigt:'}</span
					>
					<span class="font-semibold text-violet-500">{requiredTierLabel}</span>
				</div>
			</div>
			<button
				class="w-full py-2.5 px-4 rounded-lg border-none text-sm font-medium cursor-pointer transition-opacity hover:opacity-90"
				style:background-color="hsl(var(--primary, 239 84% 67%))"
				style:color="hsl(var(--primary-foreground, 0 0% 100%))"
				onclick={goHome}
			>
				{locale === 'en' ? 'Back to overview' : 'Zur Übersicht'}
			</button>
		</div>
	</div>
{:else if !ready}
	<div class="flex items-center justify-center h-screen bg-background">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
{:else}
	{@render children()}
{/if}
