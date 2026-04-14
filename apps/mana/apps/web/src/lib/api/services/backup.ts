/**
 * Backup / Restore API — M1 thin slice.
 *
 * Talks directly to mana-sync's /backup/export endpoint, which streams every
 * sync_changes row owned by the current user as JSONL (one event per line).
 * The file is immediately usable as input for a future import flow: replaying
 * the events through applyServerChanges() reconstructs the user's entire
 * dataset in a fresh IndexedDB.
 *
 * Field-level encrypted fields stay ciphertext throughout — the file is safe
 * at rest for those fields. Plaintext fields (IDs, timestamps, sort keys) are
 * visible as-is, which matches the GDPR data-portability expectation.
 */

import { authStore } from '$lib/stores/auth.svelte';

function getSyncServerUrl(): string {
	if (typeof window !== 'undefined') {
		const injected = (window as unknown as { __PUBLIC_SYNC_SERVER_URL__?: string })
			.__PUBLIC_SYNC_SERVER_URL__;
		if (injected) return injected;
	}
	return (import.meta.env.PUBLIC_SYNC_SERVER_URL as string | undefined) ?? 'http://localhost:3050';
}

export const backupService = {
	/**
	 * Trigger a browser download of the user's full sync-event backup as
	 * a .jsonl file. Streams directly from mana-sync; no intermediate buffer
	 * in the app server.
	 */
	async downloadBackup(): Promise<void> {
		const token = await authStore.getValidToken();
		if (!token) throw new Error('not authenticated');

		const response = await fetch(`${getSyncServerUrl()}/backup/export`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			throw new Error(`backup export failed: ${response.status} ${response.statusText}`);
		}

		const blob = await response.blob();
		const filename =
			response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
			`mana-backup-${new Date().toISOString().slice(0, 10)}.jsonl`;

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	},
};
