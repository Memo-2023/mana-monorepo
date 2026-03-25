<!--
  AuthGate - Centralized auth initialization and loading gate.

  Handles:
  - Auth store initialization
  - Loading spinner while checking auth
  - Redirect to login if not authenticated (unless allowGuest)
  - Calling onReady callback after auth is confirmed
  - Rendering children only when ready

  Usage:
    <AuthGate authStore={authStore} onReady={loadAppData}>
      <AppContent />
    </AuthGate>
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	/**
	 * Minimal interface that all app auth stores must satisfy.
	 * Every app's authStore (e.g. `$lib/stores/auth.svelte`) already matches this.
	 */
	interface AuthStoreInterface {
		initialize(): Promise<void>;
		readonly isAuthenticated: boolean;
	}

	interface Props {
		/** The app's auth store instance (must have initialize() and isAuthenticated) */
		authStore: AuthStoreInterface;
		/** Path to redirect to when not authenticated (default: '/login') */
		loginHref?: string;
		/** If true, render children even when not authenticated (for guest-mode apps) */
		allowGuest?: boolean;
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
		onReady,
		goto: gotoFn,
		children,
	}: Props = $props();

	let ready = $state(false);

	function navigate(url: string) {
		if (gotoFn) {
			gotoFn(url);
		} else if (typeof window !== 'undefined') {
			window.location.href = url;
		}
	}

	onMount(async () => {
		await authStore.initialize();

		if (!authStore.isAuthenticated && !allowGuest) {
			navigate(loginHref);
			return;
		}

		if (onReady) {
			await onReady();
		}

		ready = true;
	});
</script>

{#if !ready}
	<div class="flex items-center justify-center h-screen bg-background">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
{:else}
	{@render children()}
{/if}
