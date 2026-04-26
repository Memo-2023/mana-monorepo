/**
 * Articles store — mutation-only service.
 *
 * M1 scope is intentionally thin: delete + status/favourite/progress toggles
 * that exercise the encryption + event pipeline. `saveFromUrl` (the real
 * ingestion path) lands in M2 together with the server extract route and
 * AddUrlForm. The pipeline is wired now so the Reader view and CRUD plumbing
 * in M2/M3 can slot in without reshaping calls.
 */

import { encryptRecord, decryptRecords } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { scopedForModule } from '$lib/data/scope';
import { articleTable } from '../collections';
import { extractArticle, type ExtractedArticle } from '../api';
import { toArticle } from '../queries';
import type { Article, ArticleStatus, LocalArticle } from '../types';

export const articlesStore = {
	async setStatus(id: string, status: ArticleStatus): Promise<void> {
		const diff: Partial<LocalArticle> = {
			status,
		};
		if (status === 'finished') {
			const existing = await articleTable.get(id);
			if (existing && !existing.readAt) diff.readAt = diff.updatedAt;
		}
		await articleTable.update(id, diff);
	},

	async toggleFavorite(id: string): Promise<void> {
		const existing = await articleTable.get(id);
		if (!existing) return;
		await articleTable.update(id, {
			isFavorite: !existing.isFavorite,
		});
	},

	async setProgress(id: string, progress: number): Promise<void> {
		const clamped = Math.max(0, Math.min(1, progress));
		await articleTable.update(id, {
			readingProgress: clamped,
		});
	},

	async updateNote(id: string, note: string | null): Promise<void> {
		const diff: Partial<LocalArticle> = {
			userNote: note,
		};
		await encryptRecord('articles', diff as LocalArticle);
		await articleTable.update(id, diff);
	},

	async deleteArticle(id: string): Promise<void> {
		await articleTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},

	/**
	 * Look up an already-saved article by URL in the current space. Used
	 * by the dedupe path in saveFromUrl and by AddUrlForm to offer
	 * "already saved — open it" instead of duplicating the row.
	 * Returns a decrypted snapshot, or null.
	 */
	async findByUrl(url: string): Promise<Article | null> {
		const match = await scopedForModule<LocalArticle, string>('articles', 'articles')
			.filter((r) => r.originalUrl === url && !r.deletedAt)
			.first();
		if (!match) return null;
		const [decrypted] = await decryptRecords('articles', [match]);
		return decrypted ? toArticle(decrypted) : null;
	},

	/**
	 * Persist an extracted payload as a saved article. Returns the snapshot
	 * directly so callers can navigate to `/articles/<id>` without waiting
	 * for the liveQuery to tick.
	 *
	 * AddUrlForm passes a pre-extracted payload (after it already called
	 * extractArticle once to render the preview); the direct path in
	 * saveFromUrl lets the store do the extract itself.
	 */
	async saveFromExtracted(extracted: ExtractedArticle): Promise<Article> {
		const now = new Date().toISOString();
		const newLocal: LocalArticle = {
			id: crypto.randomUUID(),
			originalUrl: extracted.originalUrl,
			title: extracted.title,
			excerpt: extracted.excerpt ?? null,
			content: extracted.content,
			htmlContent: extracted.htmlContent ?? null,
			author: extracted.author ?? null,
			siteName: extracted.siteName ?? null,
			imageUrl: null,
			wordCount: extracted.wordCount,
			readingTimeMinutes: extracted.readingTimeMinutes,
			publishedAt: null,
			status: 'unread',
			readingProgress: 0,
			isFavorite: false,
			savedAt: now,
			readAt: null,
			userNote: null,
			extractedVersion: 1,
		};
		const snapshot = toArticle(newLocal);
		await encryptRecord('articles', newLocal);
		await articleTable.add(newLocal);
		emitDomainEvent('ArticleSaved', 'articles', 'articles', newLocal.id, {
			articleId: newLocal.id,
			title: newLocal.title,
		});
		return snapshot;
	},

	/**
	 * Full save path: dedupe → extract → persist. Returns the existing
	 * article when the URL is already saved in the current space (the
	 * caller can then navigate to it instead of creating a duplicate).
	 */
	async saveFromUrl(url: string): Promise<{ article: Article; duplicate: boolean }> {
		const existing = await this.findByUrl(url);
		if (existing) return { article: existing, duplicate: true };
		const extracted = await extractArticle(url);
		const article = await this.saveFromExtracted(extracted);
		return { article, duplicate: false };
	},
};
