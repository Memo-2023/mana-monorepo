/**
 * Reactive sync status for Svelte 5 components.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useSyncStatus } from '@mana/local-store/svelte';
 *   const sync = useSyncStatus(syncEngine);
 * </script>
 *
 * {#if sync.status === 'offline'}
 *   <span>Offline</span>
 * {:else if sync.status === 'syncing'}
 *   <span>Syncing...</span>
 * {:else if sync.pendingCount > 0}
 *   <span>{sync.pendingCount} pending</span>
 * {/if}
 * ```
 */

import { onDestroy, onMount } from 'svelte';
import type { SyncEngine } from '../sync/engine.js';
import type { SyncStatus } from '../types.js';

interface SyncStatusState {
	readonly status: SyncStatus;
	readonly pendingCount: number;
	readonly isOnline: boolean;
	readonly isSyncing: boolean;
}

export function useSyncStatus(engine: SyncEngine): SyncStatusState {
	let status = $state<SyncStatus>(engine.status);
	let pendingCount = $state(0);

	let unsubscribe: (() => void) | undefined;
	let pendingInterval: ReturnType<typeof setInterval> | undefined;

	onMount(() => {
		unsubscribe = engine.onStatusChange((newStatus) => {
			status = newStatus;
		});

		// Poll pending count every 2s (cheap IndexedDB query)
		const updatePending = async () => {
			pendingCount = await engine.getPendingCount();
		};
		updatePending();
		pendingInterval = setInterval(updatePending, 2000);
	});

	onDestroy(() => {
		unsubscribe?.();
		if (pendingInterval) clearInterval(pendingInterval);
	});

	return {
		get status() {
			return status;
		},
		get pendingCount() {
			return pendingCount;
		},
		get isOnline() {
			return status !== 'offline';
		},
		get isSyncing() {
			return status === 'syncing';
		},
	};
}
