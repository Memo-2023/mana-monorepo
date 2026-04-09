/**
 * Articles store — the user's saved reading list.
 *
 * Two paths in:
 *   - saveFromCurated(article)  copies a row from the local pool
 *     mirror into the encrypted reading list. Used when the user
 *     hits "speichern" on a feed card.
 *   - saveFromUrl(url)  hits POST /api/v1/news/extract/save and
 *     stores the result. Used by /news/add for ad-hoc URLs.
 *
 * All other operations (read/archive/favorite/delete) are plain
 * updates against `newsArticles`.
 */

import { encryptRecord } from '$lib/data/crypto';
import { articleTable } from '../collections';
import { extractFromUrl } from '../api';
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
		return snapshot;
	},

	async saveFromUrl(url: string): Promise<Article> {
		const extracted = await extractFromUrl(url);
		const newLocal: LocalArticle = {
			id: crypto.randomUUID(),
			type: 'saved',
			sourceCuratedId: null,
			originalUrl: extracted.originalUrl,
			title: extracted.title,
			excerpt: extracted.excerpt,
			content: extracted.content,
			htmlContent: extracted.htmlContent,
			author: extracted.author,
			siteName: extracted.siteName,
			sourceSlug: null,
			imageUrl: null,
			categoryId: null,
			wordCount: extracted.wordCount,
			readingTimeMinutes: extracted.readingTimeMinutes,
			publishedAt: null,
			isArchived: false,
			isRead: false,
			isFavorite: false,
		};
		const snapshot = toArticle(newLocal);
		await encryptRecord('newsArticles', newLocal);
		await articleTable.add(newLocal);
		return snapshot;
	},

	async markRead(id: string, isRead = true): Promise<void> {
		await articleTable.update(id, {
			isRead,
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleFavorite(id: string): Promise<void> {
		const a = await articleTable.get(id);
		if (!a) return;
		await articleTable.update(id, {
			isFavorite: !a.isFavorite,
			updatedAt: new Date().toISOString(),
		});
	},

	async archive(id: string): Promise<void> {
		await articleTable.update(id, {
			isArchived: true,
			updatedAt: new Date().toISOString(),
		});
	},

	async setCategory(id: string, categoryId: string | null): Promise<void> {
		await articleTable.update(id, {
			categoryId,
			updatedAt: new Date().toISOString(),
		});
	},

	async delete(id: string): Promise<void> {
		await articleTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};
