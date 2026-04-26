/**
 * Lists Store — Mutation-only
 * Reads come from liveQuery via queries.ts (reactive, auto-updating).
 * This store only handles write operations.
 */

import { db } from '$lib/data/database';
import { QuotesEvents } from '@mana/shared-utils/analytics';
import type { LocalQuoteList } from '../types';
import { toQuoteList, type QuoteList } from '../queries';

export type { QuoteList } from '../queries';

export const listsStore = {
	async getList(id: string): Promise<QuoteList | null> {
		const local = await db.table<LocalQuoteList>('quotesLists').get(id);
		return local ? toQuoteList(local) : null;
	},

	async createList(name: string, description?: string): Promise<QuoteList | null> {
		try {
			const now = new Date().toISOString();
			const newLocal: LocalQuoteList = {
				id: crypto.randomUUID(),
				name,
				description: description ?? null,
				quoteIds: [],
				createdAt: now,
			};
			await db.table<LocalQuoteList>('quotesLists').add(newLocal);
			QuotesEvents.listCreated();
			return toQuoteList(newLocal);
		} catch {
			return null;
		}
	},

	async updateList(
		id: string,
		updates: { name?: string; description?: string }
	): Promise<QuoteList | null> {
		try {
			await db.table('quotesLists').update(id, {
				...updates,
			});
			const updated = await db.table<LocalQuoteList>('quotesLists').get(id);
			return updated ? toQuoteList(updated) : null;
		} catch {
			return null;
		}
	},

	async deleteList(id: string): Promise<boolean> {
		try {
			await db.table('quotesLists').update(id, {
				deletedAt: new Date().toISOString(),
			});
			QuotesEvents.listDeleted();
			return true;
		} catch {
			return false;
		}
	},

	async addQuoteToList(listId: string, quoteId: string): Promise<boolean> {
		try {
			const existing = await db.table<LocalQuoteList>('quotesLists').get(listId);
			if (!existing) return false;

			const quoteIds = [...(existing.quoteIds || [])];
			if (!quoteIds.includes(quoteId)) {
				quoteIds.push(quoteId);
			}

			await db.table('quotesLists').update(listId, {
				quoteIds,
			});
			return true;
		} catch {
			return false;
		}
	},

	async removeQuoteFromList(listId: string, quoteId: string): Promise<boolean> {
		try {
			const existing = await db.table<LocalQuoteList>('quotesLists').get(listId);
			if (!existing) return false;

			const quoteIds = (existing.quoteIds || []).filter((qid) => qid !== quoteId);

			await db.table('quotesLists').update(listId, {
				quoteIds,
			});
			return true;
		} catch {
			return false;
		}
	},
};
