/**
 * Articles module — Pocket-style read-it-later.
 *
 * Three Dexie tables:
 *
 *   articles           — saved URLs + extracted Readability content
 *                        (encrypted: title, excerpt, content, htmlContent,
 *                        author, userNote). Reading state + dedupe key
 *                        stay plaintext for indexing.
 *   articleHighlights  — per-selection rows with plain-text offsets.
 *                        Encrypted: text, note, context snippets.
 *   articleTags        — pure junction into globalTags. No user-typed
 *                        content lives here — tag names/colors are in
 *                        the global tag system (appId: 'tags').
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Discriminators ──────────────────────────────────────

export type ArticleStatus = 'unread' | 'reading' | 'finished' | 'archived';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

// ─── Local Records (Dexie) ───────────────────────────────

export interface LocalArticle extends BaseRecord {
	originalUrl: string;
	title: string;
	excerpt: string | null;
	content: string;
	htmlContent: string | null;
	author: string | null;
	siteName: string | null;
	imageUrl: string | null;
	wordCount: number | null;
	readingTimeMinutes: number | null;
	publishedAt: string | null;
	status: ArticleStatus;
	/** 0..1 scroll position so the reader can restore where the user stopped. */
	readingProgress: number;
	isFavorite: boolean;
	savedAt: string;
	readAt: string | null;
	userNote: string | null;
	/** Bumped when the article is re-extracted so highlight re-anchoring
	 *  can decide whether to trust cached offsets. */
	extractedVersion: number;
}

export interface LocalHighlight extends BaseRecord {
	articleId: string;
	text: string;
	note: string | null;
	color: HighlightColor;
	/** Plain-text char offsets into `LocalArticle.content`. The reader maps
	 *  these back to DOM ranges over the rendered htmlContent. */
	startOffset: number;
	endOffset: number;
	/** Short fragments (~50 chars) around the selection — used to
	 *  re-anchor the highlight if the article gets re-extracted and
	 *  the offsets shift. */
	contextBefore: string | null;
	contextAfter: string | null;
}

/**
 * Junction row linking one article to one global tag. Same shape as
 * noteTags / eventTags / contactTags / placeTags — zero user-typed
 * content, so the row stays out of the encryption registry and lives
 * on the plaintext allowlist. Tag name/color/group come from globalTags
 * via @mana/shared-stores helpers.
 */
export interface LocalArticleTag extends BaseRecord {
	articleId: string;
	tagId: string;
}

// ─── Public DTOs (rendered by views) ─────────────────────

export interface Article {
	id: string;
	originalUrl: string;
	title: string;
	excerpt: string | null;
	content: string;
	htmlContent: string | null;
	author: string | null;
	siteName: string | null;
	imageUrl: string | null;
	wordCount: number | null;
	readingTimeMinutes: number | null;
	publishedAt: string | null;
	status: ArticleStatus;
	readingProgress: number;
	isFavorite: boolean;
	savedAt: string;
	readAt: string | null;
	userNote: string | null;
	extractedVersion: number;
	createdAt: string;
	updatedAt: string;
}

export interface Highlight {
	id: string;
	articleId: string;
	text: string;
	note: string | null;
	color: HighlightColor;
	startOffset: number;
	endOffset: number;
	contextBefore: string | null;
	contextAfter: string | null;
	createdAt: string;
	updatedAt: string;
}
