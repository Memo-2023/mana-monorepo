/**
 * Reactive queries + type converters for News.
 *
 * Read-side only. Anything that mutates lives in stores/*.svelte.ts.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import {
	articleTable,
	cachedFeedTable,
	categoryTable,
	preferencesTable,
	reactionTable,
	DEFAULT_PREFERENCES,
} from './collections';
import type {
	Article,
	Category,
	LocalArticle,
	LocalCachedArticle,
	LocalCategory,
	LocalPreferences,
	LocalReaction,
	Preferences,
	Reaction,
} from './types';
import { PREFERENCES_ID } from './types';

// ─── Type converters ───────────────────────────────────────

export function toArticle(local: LocalArticle): Article {
	return {
		id: local.id,
		type: local.type,
		sourceCuratedId: local.sourceCuratedId ?? undefined,
		originalUrl: local.originalUrl,
		title: local.title,
		excerpt: local.excerpt,
		content: local.content,
		htmlContent: local.htmlContent,
		author: local.author,
		siteName: local.siteName,
		sourceSlug: local.sourceSlug,
		imageUrl: local.imageUrl,
		categoryId: local.categoryId,
		wordCount: local.wordCount,
		readingTimeMinutes: local.readingTimeMinutes,
		publishedAt: local.publishedAt,
		isArchived: local.isArchived,
		isRead: local.isRead,
		isFavorite: local.isFavorite,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toCategory(local: LocalCategory): Category {
	return {
		id: local.id,
		name: local.name,
		color: local.color,
		icon: local.icon,
		sortOrder: local.sortOrder,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toPreferences(local: LocalPreferences): Preferences {
	return {
		id: local.id,
		selectedTopics: local.selectedTopics ?? [],
		blockedSources: local.blockedSources ?? [],
		preferredLanguages: local.preferredLanguages ?? ['de', 'en'],
		topicWeights: local.topicWeights ?? {},
		sourceWeights: local.sourceWeights ?? {},
		onboardingCompleted: local.onboardingCompleted ?? false,
	};
}

export function toReaction(local: LocalReaction): Reaction {
	return {
		id: local.id,
		articleId: local.articleId,
		reaction: local.reaction,
		sourceSlug: local.sourceSlug,
		topic: local.topic,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

// ─── Live queries ──────────────────────────────────────────

/** Saved articles (the personal reading list). Encrypted on disk. */
export function useSavedArticles() {
	return useLiveQueryWithDefault(async () => {
		const visible = (await articleTable.toArray()).filter((a) => !a.deletedAt && !a.isArchived);
		const decrypted = await decryptRecords('newsArticles', visible);
		return decrypted.map(toArticle).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}, [] as Article[]);
}

export function useArticle(id: string) {
	return useLiveQueryWithDefault(
		async () => {
			const local = await articleTable.get(id);
			if (!local || local.deletedAt) return null;
			const [decrypted] = await decryptRecords('newsArticles', [local]);
			return decrypted ? toArticle(decrypted) : null;
		},
		null as Article | null
	);
}

export function useCategories() {
	return useLiveQueryWithDefault(async () => {
		const visible = (await categoryTable.toArray()).filter((c) => !c.deletedAt);
		const decrypted = await decryptRecords('newsCategories', visible);
		return decrypted.map(toCategory).sort((a, b) => a.sortOrder - b.sortOrder);
	}, [] as Category[]);
}

/**
 * Singleton preferences row. Returns the default-shape preferences if
 * the user has never opened the module before — onboardingCompleted
 * starts as `false`, which the route layer uses to redirect into the
 * onboarding view on first launch.
 */
export function usePreferences() {
	return useLiveQueryWithDefault(async () => {
		const local = await preferencesTable.get(PREFERENCES_ID);
		if (!local) return toPreferences(DEFAULT_PREFERENCES);
		const [decrypted] = await decryptRecords('newsPreferences', [local]);
		return toPreferences(decrypted ?? DEFAULT_PREFERENCES);
	}, toPreferences(DEFAULT_PREFERENCES));
}

export function useReactions() {
	return useLiveQueryWithDefault(async () => {
		const visible = (await reactionTable.toArray()).filter((r) => !r.deletedAt);
		const decrypted = await decryptRecords('newsReactions', visible);
		return decrypted.map(toReaction);
	}, [] as Reaction[]);
}

/** The local mirror of the server's curated pool — plaintext, not synced. */
export function useCachedFeed() {
	return useLiveQueryWithDefault(async () => {
		const all = await cachedFeedTable.toArray();
		// Newest first, but the feed engine re-sorts by score so this is
		// only a stable input order.
		return all.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
	}, [] as LocalCachedArticle[]);
}

// ─── Pure helpers ──────────────────────────────────────────

export function formatRelativeTime(iso: string | null): string {
	if (!iso) return '';
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return 'jetzt';
	if (mins < 60) return `vor ${mins}m`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `vor ${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `vor ${days}d`;
	return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}
