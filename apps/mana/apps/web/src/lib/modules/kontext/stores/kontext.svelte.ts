/**
 * Kontext Store — singleton markdown document.
 *
 * `content` is encrypted at rest. The whole module is one row keyed by
 * a fixed id so there's no list/detail — just read/write.
 */

import { kontextDocTable } from '../collections';
import { encryptRecord } from '$lib/data/crypto';
import { KONTEXT_SINGLETON_ID, type LocalKontextDoc } from '../types';

export const kontextStore = {
	async ensureDoc(): Promise<void> {
		const existing = await kontextDocTable.get(KONTEXT_SINGLETON_ID);
		if (existing) return;
		const newLocal: LocalKontextDoc = {
			id: KONTEXT_SINGLETON_ID,
			content: '',
		};
		await encryptRecord('kontextDoc', newLocal);
		await kontextDocTable.add(newLocal);
	},

	async setContent(content: string): Promise<void> {
		await this.ensureDoc();
		const diff: Partial<LocalKontextDoc> = {
			content,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('kontextDoc', diff);
		await kontextDocTable.update(KONTEXT_SINGLETON_ID, diff);
	},
};
