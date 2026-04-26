/**
 * Articles store — the user's saved reading list.
 *
 * Now single-purpose: saveFromCurated copies a row from the local pool
 * mirror into the encrypted reading list (hit when the user presses
 * "speichern" on a feed card). The ad-hoc URL path (`saveFromUrl` +
 * the `type: 'saved'` discriminator) moved to the Articles module in
 * M5 — see `modules/articles/migrations/from-news.ts` for the one-off
 * data migration and `modules/articles/stores/articles.svelte.ts` for
 * the replacement flow.
 *
 * All other operations (read/archive/favorite/delete) are plain
 * updates against `newsArticles`.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { articleTable } from '../collections';
import { toArticle } from '../queries';
import type { Article, LocalArticle, LocalCachedArticle } from '../types';

export const articlesStore = {
	async saveFromCurated(input: LocalCachedArticle): Promise<Article> {
		// Dedupe: if the user has already saved this curated article,
		// return the existing row instead of creating a duplicate. The
		// `sourceCuratedId` index makes this O(1).
		const existing = await articleTable.where('sourceCuratedId').equals(input.id).first();
		if (existing) return toArticle(existing);

		const newLocal: LocalArticle = {
			id: crypto.randomUUID(),
			type: 'curated',
			sourceCuratedId: input.id,
			originalUrl: input.originalUrl,
			title: input.title,
			excerpt: input.excerpt,
			content: input.content,
			htmlContent: input.htmlContent,
			author: input.author,
			siteName: input.siteName,
			sourceSlug: input.sourceSlug,
			imageUrl: input.imageUrl,
			categoryId: null,
			wordCount: input.wordCount,
			readingTimeMinutes: input.readingTimeMinutes,
			publishedAt: input.publishedAt,
			isArchived: false,
			isRead: false,
			isFavorite: false,
		};
		const snapshot = toArticle(newLocal);
		await encryptRecord('newsArticles', newLocal);
		await articleTable.add(newLocal);
		emitDomainEvent('ArticleSaved', 'news', 'newsArticles', newLocal.id, {
			articleId: newLocal.id,
			title: input.title ?? '',
		});
		return snapshot;
	},

	async markRead(id: string, isRead = true): Promise<void> {
		await articleTable.update(id, {
			isRead,
		});
	},

	async toggleFavorite(id: string): Promise<void> {
		const a = await articleTable.get(id);
		if (!a) return;
		await articleTable.update(id, {
			isFavorite: !a.isFavorite,
		});
	},

	async archive(id: string): Promise<void> {
		await articleTable.update(id, {
			isArchived: true,
		});
	},

	async setCategory(id: string, categoryId: string | null): Promise<void> {
		await articleTable.update(id, {
			categoryId,
		});
	},

	async delete(id: string): Promise<void> {
		await articleTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},
};
