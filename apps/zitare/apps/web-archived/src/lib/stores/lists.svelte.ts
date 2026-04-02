/**
 * Lists Store — Mutation-only
 * Reads come from useLiveQuery via queries.ts (reactive, auto-updating).
 * This store only handles write operations.
 */

import { listCollection, type LocalQuoteList } from '$lib/data/local-store';
import { toQuoteList, type QuoteList } from '$lib/data/queries';

export type { QuoteList } from '$lib/data/queries';

export const listsStore = {
	async getList(id: string): Promise<QuoteList | null> {
		const local = await listCollection.get(id);
		return local ? toQuoteList(local) : null;
	},

	async createList(name: string, description?: string): Promise<QuoteList | null> {
		try {
			const newLocal: LocalQuoteList = {
				id: crypto.randomUUID(),
				name,
				description: description ?? null,
				quoteIds: [],
			};
			const inserted = await listCollection.insert(newLocal);
			return toQuoteList(inserted);
		} catch {
			return null;
		}
	},

	async updateList(
		id: string,
		updates: { name?: string; description?: string }
	): Promise<QuoteList | null> {
		try {
			const updated = await listCollection.update(id, updates as Partial<LocalQuoteList>);
			return updated ? toQuoteList(updated) : null;
		} catch {
			return null;
		}
	},

	async deleteList(id: string): Promise<boolean> {
		try {
			await listCollection.delete(id);
			return true;
		} catch {
			return false;
		}
	},

	async addQuoteToList(listId: string, quoteId: string): Promise<boolean> {
		try {
			const existing = await listCollection.get(listId);
			if (!existing) return false;

			const quoteIds = [...(existing.quoteIds || [])];
			if (!quoteIds.includes(quoteId)) {
				quoteIds.push(quoteId);
			}

			await listCollection.update(listId, { quoteIds } as Partial<LocalQuoteList>);
			return true;
		} catch {
			return false;
		}
	},

	async removeQuoteFromList(listId: string, quoteId: string): Promise<boolean> {
		try {
			const existing = await listCollection.get(listId);
			if (!existing) return false;

			const quoteIds = (existing.quoteIds || []).filter((qid) => qid !== quoteId);

			await listCollection.update(listId, { quoteIds } as Partial<LocalQuoteList>);
			return true;
		} catch {
			return false;
		}
	},
};
