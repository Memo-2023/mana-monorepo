/**
 * Network status store — tracks online/offline state and pending sync changes.
 *
 * Integrates with the unified sync manager to show sync status
 * and pending change counts in the UI.
 */

import type { SyncStatus } from '$lib/data/sync';

let isOnline = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);
let syncStatus = $state<SyncStatus>('idle');
let pendingCount = $state(0);

let cleanup: (() => void) | null = null;

function initialize() {
	if (typeof window === 'undefined') return;
	if (cleanup) return; // Guard against double-init

	const handleOnline = () => (isOnline = true);
	const handleOffline = () => (isOnline = false);

	window.addEventListener('online', handleOnline);
	window.addEventListener('offline', handleOffline);

	cleanup = () => {
		window.removeEventListener('online', handleOnline);
		window.removeEventListener('offline', handleOffline);
	};
}

function destroy() {
	cleanup?.();
	cleanup = null;
}

function setSyncStatus(status: SyncStatus) {
	syncStatus = status;
}

function setPendingCount(count: number) {
	pendingCount = count;
}

export const networkStore = {
	get isOnline() {
		return isOnline;
	},
	get syncStatus() {
		return syncStatus;
	},
	get pendingCount() {
		return pendingCount;
	},
	initialize,
	destroy,
	setSyncStatus,
	setPendingCount,
};
