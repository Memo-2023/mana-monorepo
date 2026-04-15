/**
 * Kontext Store — singleton markdown document.
 *
 * `content` is encrypted at rest. The whole module is one row keyed by
 * a fixed id so there's no list/detail — just read/write.
 */

import { kontextDocTable } from '../collections';
import { encryptRecord, decryptRecords } from '$lib/data/crypto';
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

	async appendContent(chunk: string): Promise<void> {
		await this.ensureDoc();
		const row = await kontextDocTable.get(KONTEXT_SINGLETON_ID);
		const [decrypted] = row ? await decryptRecords('kontextDoc', [row]) : [];
		const current = decrypted?.content ?? '';
		const separator = current.trim() ? '\n\n---\n\n' : '';
		await this.setContent(`${current}${separator}${chunk}`);
	},
};
