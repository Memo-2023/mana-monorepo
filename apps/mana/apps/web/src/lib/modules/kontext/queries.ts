/**
 * Kontext module — reactive query for the active-Space document.
 *
 * Content is encrypted at rest. Returns null until first write; the
 * view calls kontextStore.ensureDoc() on mount to materialise the row.
 *
 * Per-Space since Phase 2d.2: each Space has its own kontextDoc;
 * Personal-Space's legacy singleton row is matched by the in-scope
 * set's inclusion of the `_personal:<userId>` sentinel.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { decryptRecords } from '$lib/data/crypto';
import { scopedTable } from '$lib/data/scope/scoped-db';
import type { KontextDoc, LocalKontextDoc } from './types';

export function toKontextDoc(local: LocalKontextDoc): KontextDoc {
	return {
		id: local.id,
		content: local.content ?? '',
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function useKontextDoc() {
	return useLiveQueryWithDefault(
		async () => {
			const rows = await scopedTable<LocalKontextDoc, string>('kontextDoc').toArray();
			const match = rows.find((r) => !r.deletedAt);
			if (!match) return null;
			const [decrypted] = await decryptRecords('kontextDoc', [match]);
			return decrypted ? toKontextDoc(decrypted) : null;
		},
		null as KontextDoc | null
	);
}
