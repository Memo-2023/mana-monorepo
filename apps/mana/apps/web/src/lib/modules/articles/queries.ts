/**
 * Reactive queries + type converters for the Articles module.
 *
 * Reads always flow through `scopedForModule` so the current space /
 * scene-scope filter applies transparently — module code never needs
 * to know which space it's in.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { decryptRecords } from '$lib/data/crypto';
import { scopedForModule, scopedGet } from '$lib/data/scope';
import type { LocalArticle, LocalHighlight, Article, Highlight, ArticleStatus } from './types';

// ─── Type Converters ─────────────────────────────────────

export function toArticle(local: LocalArticle): Article {
	const now = new Date().toISOString();
	return {
		id: local.id,
		originalUrl: local.originalUrl,
		title: local.title,
		excerpt: local.excerpt ?? null,
		content: local.content,
		htmlContent: local.htmlContent ?? null,
		author: local.author ?? null,
		siteName: local.siteName ?? null,
		imageUrl: local.imageUrl ?? null,
		wordCount: local.wordCount ?? null,
		readingTimeMinutes: local.readingTimeMinutes ?? null,
		publishedAt: local.publishedAt ?? null,
		status: local.status,
		readingProgress: local.readingProgress ?? 0,
		isFavorite: local.isFavorite ?? false,
		savedAt: local.savedAt,
		readAt: local.readAt ?? null,
		userNote: local.userNote ?? null,
		extractedVersion: local.extractedVersion ?? 1,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

export function toHighlight(local: LocalHighlight): Highlight {
	const now = new Date().toISOString();
	return {
		id: local.id,
		articleId: local.articleId,
		text: local.text,
		note: local.note ?? null,
		color: local.color,
		startOffset: local.startOffset,
		endOffset: local.endOffset,
		contextBefore: local.contextBefore ?? null,
		contextAfter: local.contextAfter ?? null,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

// ─── Live Queries ─────────────────────────────────────────

export function useAllArticles() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalArticle, string>('articles', 'articles').toArray();
		const visible = locals.filter((a) => !a.deletedAt);
		const decrypted = await decryptRecords('articles', visible);
		return decrypted
			.map(toArticle)
			.sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''));
	}, [] as Article[]);
}

export function useArticle(id: string) {
	return useLiveQueryWithDefault(
		async () => {
			// scopedGet returns undefined if the article belongs to another
			// space — protects against URL-manipulated deep links.
			const local = await scopedGet<LocalArticle>('articles', id);
			if (!local || local.deletedAt) return null;
			const [decrypted] = await decryptRecords('articles', [local]);
			return decrypted ? toArticle(decrypted) : null;
		},
		null as Article | null
	);
}

export function useArticleHighlights(articleId: string) {
	return useLiveQueryWithDefault(async () => {
		// scopedForModule returns the scope-filtered Collection; we narrow
		// to this article in a post-filter (O(highlights per space), tiny).
		// Using scopedForModule instead of a direct indexed where() keeps the
		// scope check centralised — same pattern other modules use for
		// per-parent lookups (e.g. notes tag subsets).
		const locals = await scopedForModule<LocalHighlight, string>(
			'articles',
			'articleHighlights'
		).toArray();
		const forArticle = locals.filter((h) => h.articleId === articleId && !h.deletedAt);
		const decrypted = await decryptRecords('articleHighlights', forArticle);
		return decrypted.map(toHighlight).sort((a, b) => a.startOffset - b.startOffset);
	}, [] as Highlight[]);
}

// ─── Pure Helpers ─────────────────────────────────────────

export function filterByStatus(articles: Article[], status: ArticleStatus): Article[] {
	return articles.filter((a) => a.status === status);
}

export function searchArticles(articles: Article[], query: string): Article[] {
	const lower = query.toLowerCase();
	return articles.filter(
		(a) =>
			a.title.toLowerCase().includes(lower) ||
			(a.author?.toLowerCase().includes(lower) ?? false) ||
			(a.siteName?.toLowerCase().includes(lower) ?? false)
	);
}
