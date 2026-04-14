/**
 * Kontext module — reactive query for the singleton document.
 *
 * Content is encrypted at rest. Returns null until first write; the
 * view calls kontextStore.ensureDoc() on mount to materialise the row.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { KONTEXT_SINGLETON_ID, type KontextDoc, type LocalKontextDoc } from './types';

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
			const local = await db.table<LocalKontextDoc>('kontextDoc').get(KONTEXT_SINGLETON_ID);
			if (!local || local.deletedAt) return null;
			const [decrypted] = await decryptRecords('kontextDoc', [local]);
			return decrypted ? toKontextDoc(decrypted) : null;
		},
		null as KontextDoc | null
	);
}
