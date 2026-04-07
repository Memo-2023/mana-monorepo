<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { networkStore } from '$lib/stores/network.svelte';
	import { loadAutomations } from '$lib/triggers';
	import { setCurrentUserId } from '$lib/data/current-user';
	import { migrateGuestDataToUser } from '$lib/data/guest-migration';
	import SuggestionToast from '$lib/components/SuggestionToast.svelte';
	import OfflineIndicator from '$lib/components/OfflineIndicator.svelte';
	import PwaUpdatePrompt from '$lib/components/PwaUpdatePrompt.svelte';

	let { children } = $props();

	// Tracks whether we have already attempted the guest → user migration in
	// this app load. The migration is idempotent (no guest records → no-op)
	// so this just prevents redundant table scans on every auth state change.
	let guestMigrationAttempted = false;

	// Push the active user id into the data layer whenever auth state changes.
	// The Dexie creating-hook reads this to auto-stamp `userId` on every record,
	// so module stores never need to know who the current user is.
	$effect(() => {
		const userId = authStore.user?.id ?? null;
		setCurrentUserId(userId);

		// First time we see an authenticated user in this session, lift any
		// guest records into their account so the data they typed before
		// signing up follows them.
		if (userId && !guestMigrationAttempted) {
			guestMigrationAttempted = true;
			migrateGuestDataToUser(userId).catch((err) => {
				console.error('[mana] guest → user migration failed:', err);
			});
		}
	});

	onMount(() => {
		// Initialize theme
		const cleanupTheme = theme.initialize();

		// Initialize network status tracking
		networkStore.initialize();

		// Auth + automation loading is async — fire and forget. Returning
		// cleanup from an async onMount would silently drop it, so the async
		// work runs in an inner IIFE while the outer arrow stays sync.
		void (async () => {
			await authStore.initialize();
			await loadAutomations();
		})();

		return () => {
			cleanupTheme();
			networkStore.destroy();
		};
	});
</script>

{@render children()}
<SuggestionToast />
<OfflineIndicator />
<PwaUpdatePrompt />
