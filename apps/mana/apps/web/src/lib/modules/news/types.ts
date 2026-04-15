/**
 * News module types — local-first reading hub backed by the curated
 * pool from `news.curated_articles` (see services/news-ingester).
 *
 * Local data is split across five Dexie tables:
 *
 *   newsArticles      — saved reading list (encrypted)
 *   newsCategories    — user-defined folders for the reading list
 *   newsPreferences   — singleton row: topics, blocklist, weights
 *   newsReactions     — per-article feedback signals
 *   newsCachedFeed    — local mirror of the server's curated pool
 *                       (NOT synced, NOT encrypted)
 */

import type { BaseRecord } from '@mana/local-store';

export type Topic =
	| 'tech'
	| 'wissenschaft'
	| 'weltgeschehen'
	| 'wirtschaft'
	| 'kultur'
	| 'gesundheit'
	| 'politik';

export const ALL_TOPICS: readonly Topic[] = [
	'tech',
	'wissenschaft',
	'weltgeschehen',
	'wirtschaft',
	'kultur',
	'gesundheit',
	'politik',
];

export type Language = 'de' | 'en';

export type ReactionKind = 'interested' | 'not_interested' | 'source_blocked' | 'hidden';

// ─── Saved reading list ────────────────────────────────────

export interface LocalArticle extends BaseRecord {
	/** 'curated' = saved from the server pool, 'saved' = ad-hoc URL extract. */
	type: 'curated' | 'saved';
	/** Foreign key into the server's curated pool when type='curated'. */
	sourceCuratedId?: string | null;
	originalUrl: string;
	title: string;
	excerpt: string | null;
	content: string;
	htmlContent: string | null;
	author: string | null;
	siteName: string | null;
	sourceSlug: string | null;
	imageUrl: string | null;
	categoryId: string | null;
	wordCount: number | null;
	readingTimeMinutes: number | null;
	publishedAt: string | null;
	isArchived: boolean;
	isRead: boolean;
	isFavorite: boolean;
}

export interface LocalCategory extends BaseRecord {
	name: string;
	color: string;
	icon: string;
	sortOrder: number;
}

// ─── Preferences (singleton) ───────────────────────────────

/**
 * The single row id for the preferences singleton — there is exactly
 * one preferences row per user, so we use a stable string instead of a
 * uuid to make upserts idempotent.
 */
export const PREFERENCES_ID = 'singleton';

export interface CustomFeed {
	id: string;
	url: string;
	title: string;
	/** Optional topic tag from the standard taxonomy. */
	topic?: Topic;
	/** Epoch ms when the user pinned this feed. */
	pinnedAt: number;
}

export interface LocalPreferences extends BaseRecord {
	id: string;
	selectedTopics: Topic[];
	blockedSources: string[];
	preferredLanguages: Language[];
	/** topic slug → weight (default 1.0, range ~0.1 to 3.0). */
	topicWeights: Record<string, number>;
	/** source slug → weight (default 1.0, range ~0.1 to 3.0). */
	sourceWeights: Record<string, number>;
	onboardingCompleted: boolean;
	/**
	 * User-subscribed RSS feeds, populated from the News Research module's
	 * "Pin feed" action. Not ingested centrally — the client fetches these
	 * on its own schedule (see feed-cache).
	 */
	customFeeds?: CustomFeed[];
}

// ─── Reactions ─────────────────────────────────────────────

export interface LocalReaction extends BaseRecord {
	/** The curated article id (server-side uuid from the pool). */
	articleId: string;
	reaction: ReactionKind;
	/** Denormalized for O(1) weight updates without a join. */
	sourceSlug: string;
	topic: string;
}

// ─── Cached pool mirror (local only) ───────────────────────

export interface LocalCachedArticle {
	/** Server-side curated_articles.id. Used as the dedupe key. */
	id: string;
	originalUrl: string;
	title: string;
	excerpt: string | null;
	content: string;
	htmlContent: string | null;
	author: string | null;
	siteName: string;
	sourceSlug: string;
	imageUrl: string | null;
	topic: string;
	language: string;
	wordCount: number | null;
	readingTimeMinutes: number | null;
	publishedAt: string | null;
	ingestedAt: string;
	/** Local timestamp when this row entered the cache. */
	cachedAt: string;
}

// ─── Public DTOs (rendered by views) ───────────────────────

export interface Article {
	id: string;
	type: 'curated' | 'saved';
	sourceCuratedId?: string;
	originalUrl: string;
	title: string;
	excerpt: string | null;
	content: string;
	htmlContent: string | null;
	author: string | null;
	siteName: string | null;
	sourceSlug: string | null;
	imageUrl: string | null;
	categoryId: string | null;
	wordCount: number | null;
	readingTimeMinutes: number | null;
	publishedAt: string | null;
	isArchived: boolean;
	isRead: boolean;
	isFavorite: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Category {
	id: string;
	name: string;
	color: string;
	icon: string;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface Preferences {
	id: string;
	selectedTopics: Topic[];
	blockedSources: string[];
	preferredLanguages: Language[];
	topicWeights: Record<string, number>;
	sourceWeights: Record<string, number>;
	onboardingCompleted: boolean;
	customFeeds: CustomFeed[];
}

export interface Reaction {
	id: string;
	articleId: string;
	reaction: ReactionKind;
	sourceSlug: string;
	topic: string;
	createdAt: string;
}
