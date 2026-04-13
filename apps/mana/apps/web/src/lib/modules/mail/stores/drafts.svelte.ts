/**
 * Drafts Store — local-first draft management.
 */

import { encryptRecord } from '$lib/data/crypto';
import { mailDraftTable } from '../collections';
import { toMailDraft } from '../queries';
import type { LocalMailDraft } from '../types';

export const draftsStore = {
	async saveDraft(input: {
		accountId: string;
		to?: string;
		cc?: string;
		subject?: string;
		body?: string;
		htmlBody?: string;
		replyToMessageId?: string | null;
		existingDraftId?: string;
	}) {
		if (input.existingDraftId) {
			const wrapped = { ...input } as Record<string, unknown>;
			delete wrapped.existingDraftId;
			delete wrapped.accountId;
			await encryptRecord('mailDrafts', wrapped);
			await mailDraftTable.update(input.existingDraftId, {
				...wrapped,
				updatedAt: new Date().toISOString(),
			});
			return input.existingDraftId;
		}

		const newLocal: LocalMailDraft = {
			id: crypto.randomUUID(),
			accountId: input.accountId,
			to: input.to ?? '',
			cc: input.cc ?? '',
			subject: input.subject ?? '',
			body: input.body ?? '',
			htmlBody: input.htmlBody ?? '',
			replyToMessageId: input.replyToMessageId ?? null,
		};
		const snapshot = toMailDraft({ ...newLocal });
		await encryptRecord('mailDrafts', newLocal);
		await mailDraftTable.add(newLocal);
		return snapshot.id;
	},

	async deleteDraft(id: string) {
		await mailDraftTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};
