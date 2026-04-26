/**
 * Kontext Store — per-Space markdown document.
 *
 * Since Phase 2d.2 the module is Space-scoped: each Space has its own
 * kontextDoc. Since 2026-04-26 (sync-field-meta-overhaul Punkt 2) every
 * Space-creation also bootstraps an empty kontextDoc server-side via
 * `bootstrapSpaceSingletons` — fresh clients pull the row from mana-sync
 * instead of racing on a local insert. `getOrCreateLocalDoc()` below is
 * kept as a fallback for the brief window before the first pull lands
 * (and for legacy Spaces created before the bootstrap shipped).
 *
 * The store finds the row via `getInScopeSpaceIds()` (which matches the
 * active Space plus the legacy `_personal:<userId>` sentinel so
 * Personal-Space's pre-migration singleton row still renders).
 *
 * `content` is encrypted at rest. The Dexie creating hook stamps
 * `spaceId` on new rows automatically — we just pick a fresh UUID.
 */

import { kontextDocTable } from '../collections';
import { encryptRecord, decryptRecords } from '$lib/data/crypto';
import { scopedTable } from '$lib/data/scope/scoped-db';
import { makeSystemActor, SYSTEM_BOOTSTRAP } from '@mana/shared-ai';
import { runAsAsync } from '$lib/data/events/actor';
import type { LocalKontextDoc } from '../types';

const BOOTSTRAP_ACTOR = makeSystemActor(SYSTEM_BOOTSTRAP);

async function findForActiveSpace(): Promise<LocalKontextDoc | undefined> {
	const rows = await scopedTable<LocalKontextDoc, string>('kontextDoc').toArray();
	return rows.find((r) => !r.deletedAt);
}

/**
 * Race-window fallback for the narrow window between "server bootstrap
 * provisioned the row in mana_sync" and "first pull landed it in
 * IndexedDB". Without this, `setContent` / `appendContent` would hit
 * `update(missing-id, diff)` — a Dexie no-op that silently swallows the
 * write. Insert is stamped `origin: 'system'` (via SYSTEM_BOOTSTRAP)
 * so the server's bootstrap pull won't fight with it. Subsequent
 * `setContent` writes stamp `origin: 'user'` as usual.
 */
async function getOrCreateLocalDoc(): Promise<LocalKontextDoc> {
	const existing = await findForActiveSpace();
	if (existing) return existing;
	const newLocal: LocalKontextDoc = {
		id: crypto.randomUUID(),
		content: '',
	};
	await encryptRecord('kontextDoc', newLocal);
	await runAsAsync(BOOTSTRAP_ACTOR, async () => {
		await kontextDocTable.add(newLocal);
	});
	// Reload — the creating-hook stamped spaceId/authorId/actor fields.
	const created = await kontextDocTable.get(newLocal.id);
	if (!created) throw new Error('Failed to create kontextDoc');
	return created;
}

export const kontextStore = {
	async setContent(content: string): Promise<void> {
		const row = await getOrCreateLocalDoc();
		const diff: Partial<LocalKontextDoc> = {
			content,
		};
		await encryptRecord('kontextDoc', diff);
		await kontextDocTable.update(row.id, diff);
	},

	async appendContent(chunk: string): Promise<void> {
		const row = await getOrCreateLocalDoc();
		const [decrypted] = await decryptRecords('kontextDoc', [row]);
		const current = decrypted?.content ?? '';
		const separator = current.trim() ? '\n\n---\n\n' : '';
		await this.setContent(`${current}${separator}${chunk}`);
	},
};
