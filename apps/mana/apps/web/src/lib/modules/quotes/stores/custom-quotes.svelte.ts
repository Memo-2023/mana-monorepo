/**
 * Custom Quotes Store — Mutation-only
 * Handles CRUD for user-created quotes.
 */

import { db } from '$lib/data/database';
import type { LocalCustomQuote } from '../types';

export interface CustomQuoteInput {
	text: string;
	author: string;
	category?: string;
	source?: string;
	year?: number;
}

export const customQuotesStore = {
	async create(input: CustomQuoteInput): Promise<string> {
		const now = new Date().toISOString();
		const id = `custom-${crypto.randomUUID()}`;
		await db.table<LocalCustomQuote>('customQuotes').add({
			id,
			text: input.text,
			author: input.author,
			category: input.category ?? null,
			source: input.source ?? null,
			year: input.year ?? null,
			createdAt: now,
			updatedAt: now,
		});
		return id;
	},

	async update(id: string, updates: Partial<CustomQuoteInput>): Promise<void> {
		await db.table('customQuotes').update(id, {
			...updates,
			updatedAt: new Date().toISOString(),
		});
	},

	async remove(id: string): Promise<void> {
		await db.table('customQuotes').update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};
