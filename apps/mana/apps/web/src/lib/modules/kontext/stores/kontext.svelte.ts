/**
 * Kontext Store — per-Space markdown document.
 *
 * Since Phase 2d.2 the module is Space-scoped: each Space has its own
 * kontextDoc. The store finds the row via `getInScopeSpaceIds()` (which
 * matches the active Space plus the legacy `_personal:<userId>` sentinel
 * so Personal-Space's pre-migration singleton row still renders).
 *
 * `content` is encrypted at rest. The Dexie creating hook stamps
 * `spaceId` on new rows automatically — we just pick a fresh UUID.
 */

import { kontextDocTable } from '../collections';
import { encryptRecord, decryptRecords } from '$lib/data/crypto';
import { scopedTable } from '$lib/data/scope/scoped-db';
import type { LocalKontextDoc } from '../types';

async function findForActiveSpace(): Promise<LocalKontextDoc | undefined> {
	const rows = await scopedTable<LocalKontextDoc, string>('kontextDoc').toArray();
	return rows.find((r) => !r.deletedAt);
}

export const kontextStore = {
	/**
	 * Ensure a kontextDoc exists for the active Space. No-op if one
	 * already exists. Returns the row so callers can read + write the
	 * same id.
	 */
	async ensureDoc(): Promise<LocalKontextDoc> {
		const existing = await findForActiveSpace();
		if (existing) return existing;
		const newLocal: LocalKontextDoc = {
			id: crypto.randomUUID(),
			content: '',
		};
		await encryptRecord('kontextDoc', newLocal);
		await kontextDocTable.add(newLocal);
		// Reload — the creating-hook stamped spaceId/authorId/actor fields.
		const created = await kontextDocTable.get(newLocal.id);
		if (!created) throw new Error('Failed to create kontextDoc');
		return created;
	},

	async setContent(content: string): Promise<void> {
		const row = await this.ensureDoc();
		const diff: Partial<LocalKontextDoc> = {
			content,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('kontextDoc', diff);
		await kontextDocTable.update(row.id, diff);
	},

	async appendContent(chunk: string): Promise<void> {
		const row = await this.ensureDoc();
		const [decrypted] = await decryptRecords('kontextDoc', [row]);
		const current = decrypted?.content ?? '';
		const separator = current.trim() ? '\n\n---\n\n' : '';
		await this.setContent(`${current}${separator}${chunk}`);
	},
};
