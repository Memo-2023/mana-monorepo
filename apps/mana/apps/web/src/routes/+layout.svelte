<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { networkStore } from '$lib/stores/network.svelte';
	import { loadAutomations } from '$lib/triggers';
	import { setCurrentUserId } from '$lib/data/current-user';
	import { migrateGuestDataToUser } from '$lib/data/guest-migration';
	import { installDataLayerListeners } from '$lib/data/data-layer-listeners';
	import { getVaultClient, hasAnyEncryption } from '$lib/data/crypto';
	import { toast } from '$lib/stores/toast.svelte';
	import RecoveryCodeUnlockModal from '$lib/components/RecoveryCodeUnlockModal.svelte';
	import SyncConflictToast from '$lib/components/SyncConflictToast.svelte';
	import OfflineIndicator from '$lib/components/OfflineIndicator.svelte';
	import PwaUpdatePrompt from '$lib/components/PwaUpdatePrompt.svelte';
	import AuthRequiredModal from '$lib/components/auth/AuthRequiredModal.svelte';

	let { children } = $props();

	// Tracks the last user id we pushed into the data layer. Comparing
	// against this lets us short-circuit identity-update churn during auth
	// initialisation, which previously caused effect_update_depth_exceeded.
	let lastUserId: string | null | undefined = undefined;

	// Lazy singleton — constructed on first call, reused everywhere
	// (root layout, settings/security page, future settings sub-pages).
	const vaultClient = getVaultClient();

	/** True iff the vault unlock landed in the Phase 9 zero-knowledge
	 *  branch and is waiting for the user to type their recovery code
	 *  into the modal. The unlock effect below sets it after the
	 *  vaultClient.unlock() call returns 'awaiting-recovery-code'. */
	let needsRecoveryCode = $state(false);

	// Push the active user id into the data layer whenever auth state changes.
	// The Dexie creating-hook reads this to auto-stamp `userId` on every record,
	// so module stores never need to know who the current user is.
	$effect(() => {
		const userId = authStore.user?.id ?? null;
		if (userId === lastUserId) return;
		const previousUserId = lastUserId;
		lastUserId = userId;

		setCurrentUserId(userId);

		// First time we see an authenticated user (transition from guest/null
		// to a real id), lift any guest records into their account so the data
		// they typed before signing up follows them. Only on the first such
		// transition — re-running on token refresh would be a no-op anyway,
		// but we skip the table scan entirely.
		if (userId && previousUserId === undefined) {
			migrateGuestDataToUser(userId).catch((err) => {
				console.error('[mana] guest → user migration failed:', err);
			});
		}

		// Encryption vault: unlock when authenticated, lock when not.
		// Skip the network round-trip entirely while no table is encrypted —
		// hasAnyEncryption() flips to true once Phase 3 enables a pilot.
		if (userId && hasAnyEncryption()) {
			console.info('[mana-crypto] vault unlock started — userId present, encryption enabled');
			vaultClient.unlock().then((state) => {
				if (state.status === 'unlocked') {
					console.info('[mana-crypto] vault unlocked successfully');
					needsRecoveryCode = false;
					return;
				}
				if (state.status === 'awaiting-recovery-code') {
					// Phase 9: server is in zero-knowledge mode. Show the
					// modal that collects the user's recovery code.
					console.info('[mana-crypto] vault awaiting recovery code (zero-knowledge mode)');
					needsRecoveryCode = true;
					return;
				}
				const reason = 'reason' in state ? state.reason : 'unknown';
				console.error(`[mana-crypto] vault unlock FAILED — reason: ${reason}`, state);
				toast.error(
					`Verschlüsselungs-Vault konnte nicht entsperrt werden (${reason}). Verschlüsselte Inhalte sind nicht lesbar.`
				);
			});
		} else if (!userId) {
			vaultClient.lock();
			needsRecoveryCode = false;
		}
	});

	onMount(() => {
		// Initialize theme
		const cleanupTheme = theme.initialize();

		// Initialize network status tracking
		networkStore.initialize();

		// Subscribe to data-layer events: quota toasts, sync telemetry to
		// the error tracker, and the daily tombstone cleanup loop.
		const disposeDataLayer = installDataLayerListeners();

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
			disposeDataLayer();
		};
	});
</script>

{@render children()}
<SyncConflictToast />
<OfflineIndicator />
<PwaUpdatePrompt />
<AuthRequiredModal />

{#if needsRecoveryCode}
	<RecoveryCodeUnlockModal onUnlocked={() => (needsRecoveryCode = false)} />
{/if}
