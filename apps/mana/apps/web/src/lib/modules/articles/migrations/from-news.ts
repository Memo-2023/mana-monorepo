/**
 * One-off migration: move `newsArticles` with `type='saved'` into the
 * new `articles` module.
 *
 * Runs at app-shell boot (from routes/(app)/+layout.svelte) rather than
 * inside the Dexie `.upgrade()` hook because we need the encryption
 * layer initialised: the source rows are encrypted under the
 * `newsArticles` field allowlist, the target rows need to be
 * re-encrypted under the `articles` allowlist, and both roundtrips
 * require Web Crypto + the master key — which the Dexie upgrade path
 * runs before.
 *
 * Idempotent: a localStorage sentinel prevents re-runs per device.
 * The original rows are soft-deleted (deletedAt stamped) so the sync
 * layer propagates the removal to the server and to other devices.
 *
 * Migration mapping:
 *   newsArticles.isArchived = true   → articles.status = 'archived'
 *   newsArticles.isRead = true       → articles.status = 'finished'
 *   otherwise                        → articles.status = 'unread'
 *
 * isFavorite, createdAt, userId carry across. `sourceSlug` /
 * `sourceCuratedId` / `categoryId` don't have a counterpart on
 * articles (they're news-feed-specific) and are dropped — the user's
 * reading-list view doesn't depend on them.
 */

import { db } from '$lib/data/database';
import { encryptRecord, decryptRecords } from '$lib/data/crypto';
import { hasAnyEncryption } from '$lib/data/crypto/registry';
import type { LocalArticle as NewLocalArticle, ArticleStatus } from '../types';

const SENTINEL_KEY = 'mana:articles:from-news-migration:v1';

// Shape of the source rows we care about. Kept narrow so the migration
// stays decoupled from the news module's evolving type file.
interface LegacyNewsArticle {
	id: string;
	type: 'curated' | 'saved';
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
	isArchived?: boolean;
	isRead?: boolean;
	isFavorite?: boolean;
	userId?: string;
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string | null;
}

function statusFor(row: LegacyNewsArticle): ArticleStatus {
	if (row.isArchived) return 'archived';
	if (row.isRead) return 'finished';
	return 'unread';
}

/**
 * Run the migration once per device. Returns the number of rows moved.
 * Fire-and-forget from app boot; errors are logged but never thrown so
 * a single broken row never blocks the rest of the app from starting.
 */
export async function runArticlesFromNewsMigration(): Promise<number> {
	if (typeof window === 'undefined') return 0;
	if (window.localStorage.getItem(SENTINEL_KEY)) return 0;

	// The migration requires the crypto layer to be live. If the app is
	// running entirely plaintext (Phase 1 bootstrap or a test harness),
	// decryptRecords is a pass-through so this still works — we check
	// anyway as a defensive gate and bail if the registry isn't ready.
	try {
		// Access the flag so linters don't flag the import as unused when
		// someone later decides the gate isn't worth keeping. The call is
		// cheap either way.
		hasAnyEncryption();
	} catch {
		return 0;
	}

	try {
		const newsTable = db.table<LegacyNewsArticle>('newsArticles');
		const articlesTable = db.table<NewLocalArticle>('articles');

		const candidates = await newsTable.where('type').equals('saved').toArray();
		const visible = candidates.filter((row) => !row.deletedAt);
		if (visible.length === 0) {
			window.localStorage.setItem(SENTINEL_KEY, new Date().toISOString());
			return 0;
		}

		const decrypted = (await decryptRecords(
			'newsArticles',
			visible as unknown as Record<string, unknown>[]
		)) as unknown as LegacyNewsArticle[];

		const now = new Date().toISOString();
		let moved = 0;

		// Separate transactions: one write batch per row with its own
		// encryption roundtrip, so a single bad row doesn't lose the
		// batch. Dexie auto-batches the internal index updates either way.
		for (const row of decrypted) {
			try {
				const newRow: NewLocalArticle = {
					id: crypto.randomUUID(),
					originalUrl: row.originalUrl,
					title: row.title,
					excerpt: row.excerpt,
					content: row.content,
					htmlContent: row.htmlContent,
					author: row.author,
					siteName: row.siteName,
					imageUrl: row.imageUrl,
					wordCount: row.wordCount,
					readingTimeMinutes: row.readingTimeMinutes,
					publishedAt: row.publishedAt,
					status: statusFor(row),
					readingProgress: 0,
					isFavorite: row.isFavorite ?? false,
					savedAt: row.createdAt ?? now,
					readAt: row.isRead ? (row.updatedAt ?? now) : null,
					userNote: null,
					extractedVersion: 1,
					// userId is stamped by the Dexie creating-hook from the active
					// session — don't set it manually, let the hook do its job.
				};
				await encryptRecord('articles', newRow);
				await articlesTable.add(newRow);
				// Soft-delete the source so the sync engine removes it from
				// the server + other devices. Keep it in the local table so
				// if someone later rolls back the migration they can still
				// see what was there.
				await newsTable.update(row.id, { deletedAt: now });
				moved++;
			} catch (rowErr) {
				console.warn(`[articles/from-news] skipping row ${row.id} — ${(rowErr as Error).message}`);
			}
		}

		window.localStorage.setItem(SENTINEL_KEY, now);
		if (moved > 0) {
			console.info(`[articles/from-news] migrated ${moved} saved article(s) into /articles`);
		}
		return moved;
	} catch (err) {
		console.error('[articles/from-news] migration failed:', err);
		return 0;
	}
}

/** Clear the sentinel so the next boot re-runs. Test / recovery helper only. */
export function resetArticlesFromNewsSentinel(): void {
	if (typeof window !== 'undefined') {
		window.localStorage.removeItem(SENTINEL_KEY);
	}
}
